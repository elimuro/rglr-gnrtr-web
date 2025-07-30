/**
 * midi-manager.js - MIDI Device Connection and Management
 * This module handles MIDI device detection, connection, and communication for the application,
 * providing real-time MIDI input processing and device management. It manages MIDI port connections,
 * handles device enumeration, provides connection status feedback, and serves as the primary
 * interface for all MIDI hardware interactions and device state management.
 */

export class MIDIManager {
    constructor(app) {
        this.app = app;
        this.midiAccess = null;
        this.midiInputs = []; // Array to hold multiple input devices
        this.midiOutput = null;
        this.isConnected = false;
        this.supported = false;
        this.deviceSelectionMode = false;
        this.lastSelectedDevices = {
            inputs: [], // Array to remember multiple selected inputs
            output: null
        };
        this._learnCCListeners = new Set();
        this._learnNoteListeners = new Set();
        this.checkMIDISupport();
    }

    async checkMIDISupport() {
        if (navigator.requestMIDIAccess) {
            this.supported = true;
        } else {
            console.warn('Web MIDI API is not supported in this browser');
            this.updateStatus('Web MIDI API not supported', false);
        }
    }

    async connect() {
        if (!this.supported) {
            console.error('MIDI not supported');
            return;
        }

        // Check if already connected or connecting
        if (this.isConnected || this.deviceSelectionMode) {
            return;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess({
                sysex: false,
                software: true
            });
            
            // Check if we have multiple input devices and need to show selection
            const inputs = Array.from(this.midiAccess.inputs.values());
            
            if (inputs.length > 1) {
                this.showDeviceSelection(inputs, []);
            } else {
                // Auto-connect to the only available input device
            this.setupMIDIInputs();
            this.isConnected = true;
            this.app.onMIDIConnected();
            }

        } catch (error) {
            console.error('MIDI Access denied:', error);
            this.updateStatus('MIDI Access denied', false);
        }
    }

    showDeviceSelection(inputs, outputs) {
        // Check if device selection is already open
        if (this.deviceSelectionMode || document.getElementById('midi-device-selection')) {
            return;
        }
        
        this.deviceSelectionMode = true;
        this.updateStatus('Select MIDI input device', false);
        
        // Create device selection UI
        const selectionContainer = document.createElement('div');
        selectionContainer.id = 'midi-device-selection';
        selectionContainer.className = 'midi-device-selection';
        
        let html = '<h4>Select MIDI Input Device</h4>';
        
        // Input device selection only
        if (inputs.length > 0) {
            html += '<div class="device-section">';
            html += '<label>MIDI Input Device:</label>';
            html += '<select id="midi-input-select" class="midi-device-select">';
            html += '<option value="">Auto-select first available</option>';
            inputs.forEach((input, index) => {
                const isSelected = this.lastSelectedDevices.input === input.name;
                const selectedAttr = isSelected ? ' selected' : '';
                html += `<option value="${index}"${selectedAttr}>${input.name || `Input ${index + 1}`}</option>`;
            });
            html += '</select>';
            html += '</div>';
        }
        
        html += '<div class="device-buttons">';
        html += '<button id="midi-connect-selected" class="midi-button">Connect Selected</button>';
        html += '<button id="midi-cancel-selection" class="midi-button">Cancel</button>';
        html += '</div>';
        
        selectionContainer.innerHTML = html;
        
        // Insert the selection UI after the first MIDI section
        const midiContainer = document.getElementById('midi-container');
        const firstSection = midiContainer.querySelector('.midi-section');
        if (firstSection) {
            firstSection.parentNode.insertBefore(selectionContainer, firstSection.nextSibling);
        } else {
            midiContainer.appendChild(selectionContainer);
        }
        
        // Set up event listeners
        document.getElementById('midi-connect-selected').addEventListener('click', () => {
            this.connectSelectedDevices(inputs, outputs);
        });
        
        document.getElementById('midi-cancel-selection').addEventListener('click', () => {
            this.cancelDeviceSelection();
        });
    }

    connectSelectedDevices(inputs, outputs) {
        const inputSelect = document.getElementById('midi-input-select');
        
        // Connect to selected input
        if (inputSelect && inputSelect.value !== '') {
            const inputIndex = parseInt(inputSelect.value);
            this.midiInput = inputs[inputIndex];
            this.midiInput.onmidimessage = (event) => this.handleMIDIMessage(event);
            this.lastSelectedDevices.input = this.midiInput.name;
        } else {
            // Auto-select first input
            this.midiInput = inputs[0];
            this.midiInput.onmidimessage = (event) => this.handleMIDIMessage(event);
            this.lastSelectedDevices.input = this.midiInput.name;
        }
        
        // Clear any existing output connection
        this.midiOutput = null;
        this.lastSelectedDevices.output = null;
        
        this.cleanupDeviceSelection();
        this.isConnected = true;
        this.deviceSelectionMode = false;
        this.app.onMIDIConnected();
        
        // Set up state change listener - but don't auto-reconnect to first device
        this.midiAccess.onstatechange = (event) => {
            // Only handle disconnections, not new connections
            if (event.port.state === 'disconnected' && event.port.type === 'input') {
                if (this.midiInput && event.port.id === this.midiInput.id) {
                    this.disconnect();
                }
            }
        };
    }

    cancelDeviceSelection() {
        this.cleanupDeviceSelection();
        this.deviceSelectionMode = false;
        this.disconnect();
    }

    cleanupDeviceSelection() {
        const selectionContainer = document.getElementById('midi-device-selection');
        if (selectionContainer) {
            selectionContainer.remove();
        }
    }

    disconnect() {
        if (this.midiInput) {
            this.midiInput.onmidimessage = null;
            this.midiInput = null;
        }
        if (this.midiOutput) {
            this.midiOutput = null;
        }
        this.midiAccess = null;
        this.isConnected = false;
        this.deviceSelectionMode = false;
        this.cleanupDeviceSelection();
        this.app.onMIDIDisconnected();
    }

    setupMIDIInputs() {
        const inputs = Array.from(this.midiAccess.inputs.values());
        
        if (inputs.length === 0) {
            console.warn('No MIDI inputs found');
            this.updateStatus('No MIDI inputs found', false);
            return;
        }

        // Use the first available input (only when auto-connecting)
        this.midiInput = inputs[0];
        this.midiInput.onmidimessage = (event) => this.handleMIDIMessage(event);
        
        this.updateStatus(`Connected to: ${this.midiInput.name}`, true);

        // Set up state change listener for disconnections only
        this.midiAccess.onstatechange = (event) => {
            if (event.port.state === 'disconnected' && event.port.type === 'input') {
                if (this.midiInput && event.port.id === this.midiInput.id) {
                    this.disconnect();
                }
            }
        };
    }

    setupMIDIOutputs() {
        // MIDI output setup removed - only input is needed
        this.midiOutput = null;
    }

    // --- LEARN MODE LISTENER REGISTRATION ---
    onCC(callback) {
        this._learnCCListeners.add(callback);
    }
    offCC(callback) {
        this._learnCCListeners.delete(callback);
    }
    onNote(callback) {
        this._learnNoteListeners.add(callback);
    }
    offNote(callback) {
        this._learnNoteListeners.delete(callback);
        }

    // --- MODIFIED handleMIDIMessage TO SUPPORT LEARN MODE ---
    handleMIDIMessage(event) {
        const data = event.data;
        const status = data[0] & 0xf0;
        const channel = data[0] & 0x0f;

        // Show MIDI activity for all message types
        this.showMIDIActivity();

        let messageType = '';

        // Handle different MIDI message types
        switch (status) {
            case 0x80: // Note Off
                {
                    const note = data[1];
                    const velocity = data[2];
                    // Call learn listeners for notes
                    if (this._learnNoteListeners.size > 0) {
                        this._learnNoteListeners.forEach(cb => cb(note, velocity, false, channel));
                    }
                    this.app.onMIDINote(note, velocity, false, channel);
                    messageType = `Note Off: ${note}`;
                }
                break;

            case 0x90: // Note On
                {
                    const note = data[1];
                    const velocity = data[2];
                    const isNoteOn = (velocity > 0);
                    // Call learn listeners for notes
                    if (this._learnNoteListeners.size > 0) {
                        this._learnNoteListeners.forEach(cb => cb(note, velocity, isNoteOn, channel));
                    }
                    this.app.onMIDINote(note, velocity, isNoteOn, channel);
                    messageType = `Note On: ${note} (${velocity})`;
                }
                break;

            case 0xB0: // Control Change
                {
                    const controller = data[1];
                    const value = data[2];
                    // Call learn listeners for CC
                    if (this._learnCCListeners.size > 0) {
                        this._learnCCListeners.forEach(cb => cb(controller, value, channel));
                    }
                    this.app.onMIDICC(controller, value, channel);
                    messageType = `CC: ${controller} = ${value} (Ch:${channel})`;
                }
                break;

            case 0xE0: // Pitch Bend
                {
                    const pitchBendValue = ((data[2] << 7) | data[1]) / 16384; // Normalize to 0-1
                    this.app.onMIDIPitchBend(pitchBendValue);
                    messageType = `Pitch Bend: ${pitchBendValue.toFixed(2)}`;
                }
                break;

            case 0xD0: // Channel Pressure (Aftertouch)
                {
                    this.app.onMIDIAftertouch(data[1] / 127);
                    messageType = `Aftertouch: ${data[1]}`;
                }
                break;

            case 0xA0: // Polyphonic Key Pressure
                {
                    this.app.onMIDIAftertouch(data[2] / 127);
                    messageType = `Poly Pressure: ${data[2]}`;
                }
                break;

            default:
                return;
        }

        this.updateLastMessage(messageType);
    }

    showMIDIActivity() {
        const activityIndicator = document.getElementById('midi-activity');
        if (activityIndicator) {
            const bars = activityIndicator.querySelectorAll('.activity-bar');
            const randomBar = bars[Math.floor(Math.random() * bars.length)];
            
            // Reset all bars
            bars.forEach(bar => bar.classList.remove('active'));
            
            // Activate random bar
            randomBar.classList.add('active');
            
            // Remove active class after animation
            setTimeout(() => {
                randomBar.classList.remove('active');
            }, 200);
        }
    }

    updateLastMessage(message) {
        const lastMessageElement = document.getElementById('midi-last-message');
        if (lastMessageElement) {
            lastMessageElement.textContent = message;
        }
    }

    updateStatus(message, connected) {
        const statusElement = document.getElementById('midi-status');
        if (statusElement) {
            statusElement.textContent = `MIDI: ${message}`;
            statusElement.className = connected ? 'midi-connected' : 'midi-disconnected';
        }
    }

    // Send MIDI message to output (if available)
    sendMIDI(data) {
        if (this.midiOutput) {
            this.midiOutput.send(data);
        }
    }

    // Utility methods for sending specific MIDI messages
    sendNoteOn(note, velocity, channel = 0) {
        this.sendMIDI([0x90 + channel, note, velocity]);
    }

    sendNoteOff(note, velocity, channel = 0) {
        this.sendMIDI([0x80 + channel, note, velocity]);
    }

    sendControlChange(controller, value, channel = 0) {
        this.sendMIDI([0xB0 + channel, controller, value]);
    }

    sendPitchBend(value, channel = 0) {
        const msb = Math.floor(value * 127);
        const lsb = Math.floor((value * 127 - msb) * 127);
        this.sendMIDI([0xE0 + channel, lsb, msb]);
    }

    // Get available MIDI inputs
    getAvailableInputs() {
        if (!this.midiAccess) return [];
        return Array.from(this.midiAccess.inputs.values());
    }

    // Get available MIDI outputs (kept for compatibility but not used)
    getAvailableOutputs() {
        if (!this.midiAccess) return [];
        return Array.from(this.midiAccess.outputs.values());
    }

    // Connect to a specific input by name
    connectToInput(inputName) {
        const inputs = this.getAvailableInputs();
        const input = inputs.find(input => input.name === inputName);
        
        if (input) {
            if (this.midiInput) {
                this.midiInput.onmidimessage = null;
            }
            this.midiInput = input;
            this.midiInput.onmidimessage = (event) => this.handleMIDIMessage(event);
            return true;
        }
        return false;
    }

    // Connect to a specific output by name (kept for compatibility but not used)
    connectToOutput(outputName) {
        const outputs = this.getAvailableOutputs();
        const output = outputs.find(output => output.name === outputName);
        
        if (output) {
            this.midiOutput = output;
            return true;
        }
        return false;
    }

    // Refresh device list and show selection if multiple devices
    async refreshDevices() {
        if (!this.midiAccess) {
            console.warn('No MIDI access available');
            return;
        }

        const inputs = Array.from(this.midiAccess.inputs.values());
        
        // If already connected, disconnect first
        if (this.isConnected) {
            this.disconnect();
        }
        
        if (inputs.length > 1) {
            this.showDeviceSelection(inputs, []);
        } else if (inputs.length === 1) {
            // Only one input available
            this.midiInput = inputs[0];
            this.midiInput.onmidimessage = (event) => this.handleMIDIMessage(event);
            this.isConnected = true;
            this.app.onMIDIConnected();
        } else if (inputs.length === 0) {
            this.updateStatus('No MIDI inputs found', false);
        }
    }

    // Get current device info for display
    getCurrentDeviceInfo() {
        const info = {
            input: this.midiInput ? this.midiInput.name : 'None',
            output: this.midiOutput ? this.midiOutput.name : 'None'
        };
        return info;
    }

    // Update the status display with current device info
    updateDeviceStatus() {
        if (this.isConnected) {
            const deviceInfo = this.getCurrentDeviceInfo();
            const statusText = `Connected to: ${deviceInfo.input}`;
            this.updateStatus(statusText, true);
        }
    }
} 