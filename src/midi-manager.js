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
            this.updateStatus('Web MIDI API not supported', false);
        }
    }

    async connect() {
        if (!this.supported) {
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
            
            if (inputs.length === 0) {
                this.updateStatus('No MIDI inputs found', false);
                return;
            } else if (inputs.length > 1) {
                this.showDeviceSelection(inputs, []);
            } else {
                // Auto-connect to the only available input device
                this.setupMIDIInputs();
                this.isConnected = true;
                this.app.onMIDIConnected();
            }

        } catch (error) {
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
        
        // Create device selection UI with Tailwind styling
        const selectionContainer = document.createElement('div');
        selectionContainer.id = 'midi-device-selection';
        selectionContainer.className = 'p-3';
        
        let html = '<div class="mb-3">';
        html += '<h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-1">';
        html += '<div class="w-2 h-2 bg-midi-green rounded-full"></div>';
        html += 'Select MIDI Input Device</h4>';
        html += '</div>';
        
        // Input device selection only
        if (inputs.length > 0) {
            html += '<div class="mb-3">';
            html += '<label class="block text-xs font-medium text-gray-300 mb-1">MIDI Input Device:</label>';
            html += '<select id="midi-input-select" class="w-full px-2 py-1 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none">';
            html += '<option value="">Auto-select first available</option>';
            inputs.forEach((input, index) => {
                const isSelected = this.lastSelectedDevices.input === input.name;
                const selectedAttr = isSelected ? ' selected' : '';
                html += `<option value="${index}"${selectedAttr}>${input.name || `Input ${index + 1}`}</option>`;
            });
            html += '</select>';
            html += '</div>';
        }
        
        html += '<div class="grid grid-cols-2 gap-2">';
        html += '<button id="midi-connect-selected" class="px-2 py-1.5 bg-gradient-to-r from-midi-green to-green-500 text-black font-semibold rounded text-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">Connect Selected</button>';
        html += '<button id="midi-cancel-selection" class="px-2 py-1.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">Cancel</button>';
        html += '</div>';
        
        selectionContainer.innerHTML = html;
        
        // Insert the selection UI into the connection drawer
        const connectionDrawer = document.getElementById('drawer-connect-content');
        
        if (connectionDrawer) {
            // Add device selection below existing connection controls
            connectionDrawer.appendChild(selectionContainer);
        } else {
            // Fallback: insert into the drawer container
            const drawerContainer = document.getElementById('midi-drawer-container');
            if (drawerContainer) {
                drawerContainer.appendChild(selectionContainer);
            }
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
        const rawStatus = data[0];
        const channel = data[0] & 0x0f;

        // Show MIDI activity for all message types
        this.showMIDIActivity();

        let messageType = '';
        let messageCategory = '';

        // Check if this is a system real-time message (0xF8-0xFF)
        // These don't need status masking
        if (rawStatus >= 0xF8) {
            switch (rawStatus) {
                case 0xF8: // MIDI Clock (24 pulses per quarter note)
                    this.app.onMIDIClock();
                    messageType = 'MIDI Clock';
                    messageCategory = 'system';
                    break;

                case 0xFA: // MIDI Start
                    this.app.onMIDIStart();
                    messageType = 'MIDI Start';
                    messageCategory = 'system';
                    break;

                case 0xFB: // MIDI Continue
                    this.app.onMIDIContinue();
                    messageType = 'MIDI Continue';
                    messageCategory = 'system';
                    break;

                case 0xFC: // MIDI Stop
                    this.app.onMIDIStop();
                    messageType = 'MIDI Stop';
                    messageCategory = 'system';
                    break;

                case 0xFF: // System Reset
                    messageType = 'System Reset';
                    messageCategory = 'system';
                    break;

                default:
                    // Log unhandled system real-time messages for debugging
                    console.log('Unhandled system real-time MIDI message:', data, 'Status:', rawStatus.toString(16));
                    return;
            }
        } else if (rawStatus >= 0xF0) {
            // System common messages (0xF0-0xF7)
            switch (rawStatus) {
                case 0xF0: // System Exclusive Start
                    messageType = 'SysEx Start';
                    messageCategory = 'system';
                    break;

                case 0xF1: // MIDI Time Code Quarter Frame
                    messageType = 'MTC Quarter Frame';
                    messageCategory = 'system';
                    break;

                case 0xF2: // Song Position Pointer
                    const songPosition = ((data[2] << 7) | data[1]) * 6; // Convert to MIDI clock pulses
                    messageType = `Song Position: ${songPosition}`;
                    messageCategory = 'system';
                    break;

                case 0xF3: // Song Select
                    messageType = `Song Select: ${data[1]}`;
                    messageCategory = 'system';
                    break;

                case 0xF6: // Tune Request
                    messageType = 'Tune Request';
                    messageCategory = 'system';
                    break;

                case 0xF7: // System Exclusive End
                    messageType = 'SysEx End';
                    messageCategory = 'system';
                    break;

                default:
                    // Log unhandled system common messages for debugging
                    console.log('Unhandled system common MIDI message:', data, 'Status:', rawStatus.toString(16));
                    return;
            }
        } else {
            // Regular MIDI messages - apply status masking to strip channel
            const status = rawStatus & 0xf0;
            
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
                        messageType = `Note Off: ${note} (Ch:${channel + 1})`;
                        messageCategory = 'note';
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
                        messageType = `Note On: ${note} (${velocity}) (Ch:${channel + 1})`;
                        messageCategory = 'note';
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
                        messageType = `CC: ${controller} = ${value} (Ch:${channel + 1})`;
                        messageCategory = 'cc';
                    }
                    break;

                case 0xE0: // Pitch Bend
                    {
                        const pitchBendValue = ((data[2] << 7) | data[1]) / 16384; // Normalize to 0-1
                        this.app.onMIDIPitchBend(pitchBendValue);
                        messageType = `Pitch Bend: ${pitchBendValue.toFixed(2)}`;
                        messageCategory = 'pitch';
                    }
                    break;

                case 0xD0: // Channel Pressure (Aftertouch)
                    {
                        this.app.onMIDIAftertouch(data[1] / 127);
                        messageType = `Aftertouch: ${data[1]}`;
                        messageCategory = 'note';
                    }
                    break;

                case 0xA0: // Polyphonic Key Pressure
                    {
                        this.app.onMIDIAftertouch(data[2] / 127);
                        messageType = `Poly Pressure: ${data[2]}`;
                        messageCategory = 'note';
                    }
                    break;

                default:
                    // Log unhandled MIDI messages for debugging
                    console.log('Unhandled MIDI message:', data, 'Status:', rawStatus.toString(16));
                    return;
            }
        }

        // Send activity message to App for tracking
        if (messageType && this.app.addMIDIActivityMessage) {
            this.app.addMIDIActivityMessage(messageType, messageCategory);
        }

        this.updateLastMessage(messageType);
    }

    showMIDIActivity() {
        const activityIndicator = document.getElementById('drawer-midi-activity');
        if (activityIndicator) {
            // Find all activity bars (divs with bg-gray-600 class)
            const bars = activityIndicator.querySelectorAll('div.bg-gray-600.rounded');
            if (bars.length > 0) {
                const randomBar = bars[Math.floor(Math.random() * bars.length)];
                
                // Reset all bars
                bars.forEach(bar => {
                    bar.classList.remove('bg-midi-green', 'shadow-lg', 'animate-pulse', 'scale-y-120');
                    bar.classList.add('bg-gray-600');
                });
                
                // Activate random bar
                randomBar.classList.remove('bg-gray-600');
                randomBar.classList.add('bg-midi-green', 'shadow-lg', 'animate-pulse', 'scale-y-120');
                
                // Remove active class after animation
                setTimeout(() => {
                    randomBar.classList.remove('bg-midi-green', 'shadow-lg', 'animate-pulse', 'scale-y-120');
                    randomBar.classList.add('bg-gray-600');
                }, 200);
            }
        }
    }

    updateLastMessage(message) {
        // The text stays static now, only the activity bars indicate status
        // No need to update the text since it's always "MIDI Activity"
    }

    updateStatus(message, connected) {
        const statusElement = document.getElementById('midi-status');
        if (statusElement) {
            // Find the status dot (first div with rounded-full class)
            const statusDot = statusElement.querySelector('div.rounded-full');
            const statusText = statusElement.querySelector('.text-xs.font-medium.text-white');
            
            if (statusDot) {
                // Remove existing color classes
                statusDot.classList.remove('bg-red-500', 'bg-green-500', 'transition-all', 'duration-300');
                // Add appropriate color based on connection status
                if (connected) {
                    statusDot.classList.add('bg-green-500', 'transition-all', 'duration-300');
                } else {
                    statusDot.classList.add('bg-red-500', 'transition-all', 'duration-300');
                }
            }
            
            if (statusText) {
                statusText.textContent = message;
            }
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
            this.updateStatus(deviceInfo.input, true);
        } else {
            this.updateStatus('No MIDI Device', false);
        }
    }
} 