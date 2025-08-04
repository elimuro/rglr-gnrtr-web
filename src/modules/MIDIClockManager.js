/**
 * MIDIClockManager.js - MIDI Clock Synchronization and Transport Controls
 * This module handles MIDI clock messages, calculates BPM, manages transport state,
 * and provides clock-based timing for animations and effects.
 */

export class MIDIClockManager {
    constructor(app) {
        this.app = app;
        this.isClockActive = false;
        this.clockPulses = 0;
        this.lastClockTime = 0;
        this.clockInterval = 0; // Time between clock pulses
        this.bpm = 120; // Default BPM
        this.clockSource = 'internal'; // 'internal' or 'external'
        
        // BPM calculation improvements
        this.bpmUpdateInterval = 24; // Update BPM every quarter note (24 pulses)
        this.bpmSamples = []; // Store recent BPM samples for averaging
        this.maxBpmSamples = 4; // Number of samples to average
        
        // Tempo division settings
        this.tempoDivision = 'quarter'; // 'whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'
        this.syncMode = 'auto'; // 'auto', 'manual', 'off'
        
        // Clock subdivisions
        this.quarterNotePulses = 24; // Standard MIDI clock
        this.eighthNotePulses = 12;
        this.sixteenthNotePulses = 6;
        
        // Transport state
        this.isPlaying = false;
        this.isStopped = true;
        this.isPaused = false;
        
        // Animation sync points
        this.syncPoints = {
            quarter: 0,
            eighth: 0,
            sixteenth: 0,
            bar: 0
        };
        
        this.setupUI();
    }

    onMIDIClock() {
        const now = performance.now();
        
        if (this.lastClockTime > 0) {
            this.clockInterval = now - this.lastClockTime;
            
            // Calculate BPM from this interval
            const currentBpm = 60000 / (this.clockInterval * 24);
            
            // Add to samples for averaging
            this.bpmSamples.push(currentBpm);
            if (this.bpmSamples.length > this.maxBpmSamples) {
                this.bpmSamples.shift(); // Remove oldest sample
            }
            
            // Update BPM less frequently (every quarter note)
            if (this.clockPulses % this.bpmUpdateInterval === 0) {
                // Calculate average BPM from recent samples
                const avgBpm = this.bpmSamples.reduce((sum, bpm) => sum + bpm, 0) / this.bpmSamples.length;
                this.bpm = avgBpm;
            }
        }
        
        this.lastClockTime = now;
        this.clockPulses++;
        this.isClockActive = true;
        this.clockSource = 'external';
        
        // Calculate sync points
        this.updateSyncPoints();
        
        // Update UI less frequently
        if (this.clockPulses % 6 === 0) { // Update every 6 pulses (16th note)
            this.updateClockDisplay();
        }
        
        // Trigger animations based on clock
        this.triggerClockBasedAnimations();
    }

    onMIDIStart() {
        this.clockPulses = 0;
        this.isClockActive = true;
        this.clockSource = 'external';
        this.isPlaying = true;
        this.isStopped = false;
        this.isPaused = false;
        
        this.app.animationLoop.resetAnimationTime();
        this.updateTransportDisplay();
        console.log('MIDI Start received');
    }

    onMIDIStop() {
        this.isClockActive = false;
        this.clockSource = 'internal';
        this.isPlaying = false;
        this.isStopped = true;
        this.isPaused = false;
        
        this.updateTransportDisplay();
        console.log('MIDI Stop received');
    }

    onMIDIContinue() {
        this.isClockActive = true;
        this.clockSource = 'external';
        this.isPlaying = true;
        this.isStopped = false;
        this.isPaused = false;
        
        this.updateTransportDisplay();
        console.log('MIDI Continue received');
    }

    updateSyncPoints() {
        // Calculate various musical subdivisions
        this.syncPoints.quarter = Math.floor(this.clockPulses / 24);
        this.syncPoints.eighth = Math.floor(this.clockPulses / 12);
        this.syncPoints.sixteenth = Math.floor(this.clockPulses / 6);
        this.syncPoints.bar = Math.floor(this.clockPulses / 96); // Assuming 4/4 time
    }

    triggerClockBasedAnimations() {
        const state = this.app.state;
        
        // Sync shape cycling to quarter notes
        if (this.clockPulses % 24 === 0 && state.get('enableShapeCycling')) {
            // Trigger shape cycle animation
        }
        
        // Sync size animation to eighth notes
        if (this.clockPulses % 12 === 0 && state.get('enableSizeAnimation')) {
            // Trigger size animation
        }
        
        // Sync morphing to bars
        if (this.clockPulses % 96 === 0 && state.get('morphingEnabled')) {
            // Trigger morphing
        }
    }

    getClockTime() {
        if (this.clockSource === 'external' && this.isClockActive) {
            return this.clockPulses / 24; // Return time in quarter notes
        } else {
            return this.app.animationLoop.getAnimationTime();
        }
    }

    getBPM() {
        return this.bpm;
    }

    getTempoDivisionPulses() {
        const divisionMap = {
            'whole': 96,      // 4 beats * 24 pulses
            'half': 48,       // 2 beats * 24 pulses
            'quarter': 24,    // 1 beat * 24 pulses
            'eighth': 12,     // 1/2 beat * 24 pulses
            'sixteenth': 6,   // 1/4 beat * 24 pulses
            'thirty-second': 3 // 1/8 beat * 24 pulses
        };
        return divisionMap[this.tempoDivision] || 24;
    }

    getTempoDivisionName() {
        const nameMap = {
            'whole': 'Whole',
            'half': 'Half',
            'quarter': 'Quarter',
            'eighth': 'Eighth',
            'sixteenth': '16th',
            'thirty-second': '32nd'
        };
        return nameMap[this.tempoDivision] || 'Quarter';
    }

    isExternalClockActive() {
        return this.isClockActive && this.clockSource === 'external';
    }

    setupUI() {
        // Create bottom transport bar if it doesn't exist
        if (!document.getElementById('transport-bottom-bar')) {
            this.createTransportBar();
        }
    }

    createTransportBar() {
        const transportBar = document.createElement('div');
        transportBar.id = 'transport-bottom-bar';
        transportBar.className = 'fixed bottom-0 left-0 right-0 h-12 md:h-12 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white font-mono z-50 shadow-lg backdrop-blur-md border-t border-gray-700';
        
        transportBar.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center md:justify-start h-full px-4 py-1 md:py-0">
                <!-- All controls on the left side -->
                <div class="flex items-center justify-start gap-2 md:gap-4 mb-1 md:mb-0">
                    <button id="transport-play" class="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                        <span>Play</span>
                    </button>
                    
                    <button id="transport-stop" class="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                        <span>Stop</span>
                    </button>
                    
                    <button id="transport-reset" class="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M3 21v-5h5"></path>
                        </svg>
                        <span>Reset</span>
                    </button>
                    
                    <div id="clock-status" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 rounded-full border border-gray-600">
                        <div class="w-1.5 h-1.5 rounded-full bg-red-500 transition-all duration-300"></div>
                        <span class="text-xs font-medium text-white hidden sm:inline">Internal Clock</span>
                    </div>
                    
                    <div id="bpm-display" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 rounded-full border border-gray-600">
                        <span class="text-xs font-medium text-white">BPM: <span id="bpm-value">120</span></span>
                    </div>
                    
                    <div id="tempo-division" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 rounded-full border border-gray-600">
                        <span class="text-xs font-medium text-white">Div: <span id="division-value">Quarter</span></span>
                    </div>
                    
                    <button id="division-down" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    
                    <button id="division-up" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 15l6-6 6 6"/>
                        </svg>
                    </button>
                    
                    <button id="sync-toggle" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v4"/>
                            <path d="M12 18v4"/>
                            <path d="M4.93 4.93l2.83 2.83"/>
                            <path d="M16.24 16.24l2.83 2.83"/>
                            <path d="M2 12h4"/>
                            <path d="M18 12h4"/>
                            <path d="M4.93 19.07l2.83-2.83"/>
                            <path d="M16.24 7.76l2.83-2.83"/>
                        </svg>
                        <span id="sync-button-text">Auto</span>
                    </button>
                    
                    <div id="sync-mode" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 rounded-full border border-gray-600">
                        <span class="text-xs font-medium text-white">Sync: <span id="sync-value">Auto</span></span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(transportBar);
        
        // Add event listeners
        this.setupTransportEventListeners();
    }

    setupTransportEventListeners() {
        document.getElementById('transport-play').addEventListener('click', () => {
            this.startInternalClock();
        });
        
        document.getElementById('transport-stop').addEventListener('click', () => {
            this.stopInternalClock();
        });
        
        document.getElementById('transport-reset').addEventListener('click', () => {
            this.resetClock();
        });
        
        // Tempo division controls
        document.getElementById('division-up').addEventListener('click', () => {
            this.increaseTempoDivision();
        });
        
        document.getElementById('division-down').addEventListener('click', () => {
            this.decreaseTempoDivision();
        });
        
        // Sync mode toggle
        document.getElementById('sync-toggle').addEventListener('click', () => {
            this.toggleSyncMode();
        });
    }

    startInternalClock() {
        this.isPlaying = true;
        this.isStopped = false;
        this.isPaused = false;
        this.clockSource = 'internal';
        this.updateTransportDisplay();
        console.log('Internal clock started');
    }

    stopInternalClock() {
        this.isPlaying = false;
        this.isStopped = true;
        this.isPaused = false;
        this.updateTransportDisplay();
        console.log('Internal clock stopped');
    }

    resetClock() {
        this.clockPulses = 0;
        this.app.animationLoop.resetAnimationTime();
        this.updateClockDisplay();
        console.log('Clock reset');
    }

    increaseTempoDivision() {
        const divisions = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'];
        const currentIndex = divisions.indexOf(this.tempoDivision);
        if (currentIndex > 0) {
            this.tempoDivision = divisions[currentIndex - 1];
            this.updateTempoDivisionDisplay();
            console.log(`Tempo division increased to: ${this.getTempoDivisionName()}`);
        }
    }

    decreaseTempoDivision() {
        const divisions = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'];
        const currentIndex = divisions.indexOf(this.tempoDivision);
        if (currentIndex < divisions.length - 1) {
            this.tempoDivision = divisions[currentIndex + 1];
            this.updateTempoDivisionDisplay();
            console.log(`Tempo division decreased to: ${this.getTempoDivisionName()}`);
        }
    }

    toggleSyncMode() {
        const modes = ['auto', 'manual', 'off'];
        const currentIndex = modes.indexOf(this.syncMode);
        this.syncMode = modes[(currentIndex + 1) % modes.length];
        this.updateSyncModeDisplay();
        console.log(`Sync mode changed to: ${this.syncMode}`);
    }

    updateTempoDivisionDisplay() {
        const divisionElement = document.getElementById('division-value');
        if (divisionElement) {
            divisionElement.textContent = this.getTempoDivisionName();
        }
    }

    updateSyncModeDisplay() {
        const syncElement = document.getElementById('sync-value');
        const syncButtonText = document.getElementById('sync-button-text');
        
        if (syncElement) {
            syncElement.textContent = this.syncMode.charAt(0).toUpperCase() + this.syncMode.slice(1);
        }
        
        if (syncButtonText) {
            syncButtonText.textContent = this.syncMode.charAt(0).toUpperCase() + this.syncMode.slice(1);
        }
    }

    updateClockDisplay() {
        const bpmElement = document.getElementById('bpm-value');
        const clockStatusElement = document.getElementById('clock-status');
        
        if (bpmElement) {
            bpmElement.textContent = Math.round(this.bpm);
        }
        
        if (clockStatusElement) {
            const statusDot = clockStatusElement.querySelector('div.rounded-full');
            const statusText = clockStatusElement.querySelector('.text-xs.font-medium.text-white');
            
            if (statusDot) {
                statusDot.classList.remove('bg-red-500', 'bg-green-500', 'bg-yellow-500');
                if (this.clockSource === 'external' && this.isClockActive) {
                    statusDot.classList.add('bg-green-500');
                } else if (this.clockSource === 'internal' && this.isPlaying) {
                    statusDot.classList.add('bg-yellow-500');
                } else {
                    statusDot.classList.add('bg-red-500');
                }
            }
            
            if (statusText) {
                if (this.clockSource === 'external' && this.isClockActive) {
                    statusText.textContent = 'External Clock';
                } else if (this.clockSource === 'internal' && this.isPlaying) {
                    statusText.textContent = 'Internal Clock';
                } else {
                    statusText.textContent = 'Clock Stopped';
                }
            }
        }
        
        // Update tempo division and sync mode displays
        this.updateTempoDivisionDisplay();
        this.updateSyncModeDisplay();
    }

    updateTransportDisplay() {
        const playButton = document.getElementById('transport-play');
        const stopButton = document.getElementById('transport-stop');
        
        if (playButton && stopButton) {
            if (this.isPlaying) {
                playButton.classList.add('bg-green-500', 'bg-opacity-20', 'border-green-500');
                playButton.classList.remove('bg-black', 'bg-opacity-30', 'border-gray-600');
                stopButton.classList.remove('bg-red-500', 'bg-opacity-20', 'border-red-500');
                stopButton.classList.add('bg-black', 'bg-opacity-30', 'border-gray-600');
            } else {
                playButton.classList.remove('bg-green-500', 'bg-opacity-20', 'border-green-500');
                playButton.classList.add('bg-black', 'bg-opacity-30', 'border-gray-600');
                stopButton.classList.add('bg-red-500', 'bg-opacity-20', 'border-red-500');
                stopButton.classList.remove('bg-black', 'bg-opacity-30', 'border-gray-600');
            }
        }
        
        this.updateClockDisplay();
    }
} 