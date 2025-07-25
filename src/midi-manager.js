export class MIDIManager {
    constructor(app) {
        this.app = app;
        this.midiAccess = null;
        this.midiInput = null;
        this.midiOutput = null;
        this.isConnected = false;
        this.supported = false;
        
        this.checkMIDISupport();
    }

    async checkMIDISupport() {
        if (navigator.requestMIDIAccess) {
            this.supported = true;
            console.log('Web MIDI API is supported');
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

        try {
            this.midiAccess = await navigator.requestMIDIAccess({
                sysex: false,
                software: true
            });

            console.log('MIDI Access granted');
            this.setupMIDIInputs();
            this.setupMIDIOutputs();
            this.isConnected = true;
            this.app.onMIDIConnected();

        } catch (error) {
            console.error('MIDI Access denied:', error);
            this.updateStatus('MIDI Access denied', false);
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
        this.app.onMIDIDisconnected();
        console.log('MIDI disconnected');
    }

    setupMIDIInputs() {
        const inputs = Array.from(this.midiAccess.inputs.values());
        
        if (inputs.length === 0) {
            console.warn('No MIDI inputs found');
            this.updateStatus('No MIDI inputs found', false);
            return;
        }

        // Use the first available input
        this.midiInput = inputs[0];
        this.midiInput.onmidimessage = (event) => this.handleMIDIMessage(event);
        
        console.log(`Connected to MIDI input: ${this.midiInput.name}`);
        this.updateStatus(`Connected to: ${this.midiInput.name}`, true);

        // Listen for new inputs
        this.midiAccess.onstatechange = (event) => {
            console.log('MIDI state changed:', event);
            if (event.port.state === 'connected' && event.port.type === 'input') {
                this.setupMIDIInputs();
            }
        };
    }

    setupMIDIOutputs() {
        const outputs = Array.from(this.midiAccess.outputs.values());
        
        if (outputs.length > 0) {
            this.midiOutput = outputs[0];
            console.log(`Connected to MIDI output: ${this.midiOutput.name}`);
        }
    }

    handleMIDIMessage(event) {
        const data = event.data;
        const command = data[0] & 0xF0;
        const channel = data[0] & 0x0F;
        const note = data[1];
        const velocity = data[2];

        // Show MIDI activity
        this.showMIDIActivity();

        // Process all channels since we now have per-parameter channel mapping
        // The individual parameter handlers will filter by their assigned channels

        let messageType = '';
        switch (command) {
            case 0x80: // Note Off
                this.app.onMIDINote(note, velocity, false);
                messageType = `Note Off: ${note}`;
                break;
            case 0x90: // Note On
                this.app.onMIDINote(note, velocity, true);
                messageType = `Note On: ${note} (${velocity})`;
                break;
            case 0xB0: // Control Change
                this.app.onMIDICC(note, velocity, channel);
                messageType = `CC: ${note} = ${velocity} (Ch:${channel})`;
                break;
            case 0xE0: // Pitch Bend
                const pitchBendValue = ((data[2] << 7) | data[1]) / 16384; // Normalize to 0-1
                this.app.onMIDIPitchBend(pitchBendValue);
                messageType = `Pitch Bend: ${pitchBendValue.toFixed(2)}`;
                break;
            case 0xD0: // Channel Pressure (Aftertouch)
                this.app.onMIDIAftertouch(data[1] / 127);
                messageType = `Aftertouch: ${data[1]}`;
                break;
            case 0xA0: // Polyphonic Key Pressure
                this.app.onMIDIAftertouch(data[2] / 127);
                messageType = `Poly Pressure: ${data[2]}`;
                break;
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

    // Get available MIDI outputs
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
            console.log(`Connected to MIDI input: ${input.name}`);
            return true;
        }
        return false;
    }

    // Connect to a specific output by name
    connectToOutput(outputName) {
        const outputs = this.getAvailableOutputs();
        const output = outputs.find(output => output.name === outputName);
        
        if (output) {
            this.midiOutput = output;
            console.log(`Connected to MIDI output: ${output.name}`);
            return true;
        }
        return false;
    }
} 