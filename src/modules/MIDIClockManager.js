/**
 * MIDIClockManager.js - MIDI Clock Synchronization and Transport Controls
 * This module handles MIDI clock messages, calculates BPM, manages transport state,
 * and provides clock-based timing for animations and effects.
 */

import { BPMTimingManager } from './BPMTimingManager.js';
import { MIDI_CONSTANTS } from '../config/index.js';

export class MIDIClockManager {
    constructor(app) {
        this.app = app;
        this.isClockActive = false;
        this.clockPulses = 0;
        this.lastClockTime = 0;
        this.clockInterval = 0; // Time between clock pulses
        this.bpm = MIDI_CONSTANTS.defaults.tempo; // Default BPM from MIDI constants
        this.clockSource = 'internal'; // 'internal' or 'external'
        
        // Initialize BPM timing manager
        this.bpmTimingManager = new BPMTimingManager(this.bpm);
        
        // BPM calculation improvements using MIDI constants
        this.bpmUpdateInterval = MIDI_CONSTANTS.clock.pulsesPerQuarterNote; // Update BPM every quarter note
        this.bpmSamples = []; // Store recent BPM samples for averaging
        this.maxBpmSamples = 4; // Number of samples to average
        
        this.syncMode = 'auto'; // 'auto', 'manual', 'off'
        
        // Clock subdivisions using MIDI constants
        this.quarterNotePulses = MIDI_CONSTANTS.clock.pulsesPerQuarterNote; // Standard MIDI clock
        this.eighthNotePulses = MIDI_CONSTANTS.clock.pulsesPerEighthNote;
        this.sixteenthNotePulses = MIDI_CONSTANTS.clock.pulsesPerSixteenthNote;
        
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
            
            // Validate clock interval to prevent division by zero or very small values
            if (this.clockInterval > 0 && this.clockInterval < MIDI_CONSTANTS.clock.clockTimeout * 10) { // Max timeout between pulses
                // Calculate BPM from this interval using MIDI constants
                const currentBpm = 60000 / (this.clockInterval * MIDI_CONSTANTS.clock.pulsesPerQuarterNote);
                
                // Validate BPM is within reasonable bounds using MIDI constants
                if (currentBpm >= MIDI_CONSTANTS.clock.minTempo && currentBpm <= MIDI_CONSTANTS.clock.maxTempo && isFinite(currentBpm)) {
                    // Add to samples for averaging
                    this.bpmSamples.push(currentBpm);
                    if (this.bpmSamples.length > this.maxBpmSamples) {
                        this.bpmSamples.shift(); // Remove oldest sample
                    }
                    
                    // Update BPM less frequently (every quarter note)
                    if (this.clockPulses % this.bpmUpdateInterval === 0) {
                        // Calculate average BPM from recent samples
                        const avgBpm = this.bpmSamples.reduce((sum, bpm) => sum + bpm, 0) / this.bpmSamples.length;
                        const oldBpm = this.bpm;
                        
                        // Use setBPM to ensure state and UI are updated
                        if (Math.abs(avgBpm - oldBpm) > 0.5) { // Only update if BPM changed by more than 0.5
                            this.setBPM(avgBpm);
                            console.log(`MIDI BPM changed to: ${Math.round(avgBpm)}`);
                        }
                    }
                } else {
                    // Log invalid BPM calculation for debugging
                    console.warn(`Invalid BPM calculation: ${currentBpm} (interval: ${this.clockInterval}ms)`);
                }
            } else {
                // Log invalid interval for debugging
                console.warn(`Invalid clock interval: ${this.clockInterval}ms`);
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
        this.syncPoints.quarter = Math.floor(this.clockPulses / MIDI_CONSTANTS.clock.pulsesPerQuarterNote);
        this.syncPoints.eighth = Math.floor(this.clockPulses / MIDI_CONSTANTS.clock.pulsesPerEighthNote);
        this.syncPoints.sixteenth = Math.floor(this.clockPulses / MIDI_CONSTANTS.clock.pulsesPerSixteenthNote);
        this.syncPoints.bar = Math.floor(this.clockPulses / MIDI_CONSTANTS.clock.pulsesPerBar); // Using centralized constant for 4/4 time
    }

    triggerClockBasedAnimations() {
        const state = this.app.state;
        
        // Sync shape cycling to quarter notes
        if (this.clockPulses % MIDI_CONSTANTS.clock.pulsesPerQuarterNote === 0 && state.get('enableShapeCycling')) {
            // Trigger shape cycle animation
        }
        
        // Sync size animation to eighth notes
        if (this.clockPulses % MIDI_CONSTANTS.clock.pulsesPerEighthNote === 0 && state.get('enableSizeAnimation')) {
            // Trigger size animation
        }
        
        // Sync morphing to bars
        if (this.clockPulses % MIDI_CONSTANTS.clock.pulsesPerBar === 0) {
            // Trigger morphing (placeholder for future implementation)
        }
    }

    getClockTime() {
        if (this.clockSource === 'external' && this.isClockActive) {
            return this.clockPulses / MIDI_CONSTANTS.clock.pulsesPerQuarterNote; // Return time in quarter notes
        } else {
            // Return internal time converted to quarter notes based on BPM
            const internalTime = this.app.animationLoop.getAnimationTime();
            const secondsPerQuarter = 60 / this.bpm;
            return internalTime / secondsPerQuarter;
        }
    }

    getClockTimeInSeconds() {
        if (this.clockSource === 'external' && this.isClockActive) {
            const quarterNotes = this.clockPulses / MIDI_CONSTANTS.clock.pulsesPerQuarterNote;
            const secondsPerQuarter = 60 / this.bpm;
            return quarterNotes * secondsPerQuarter;
        } else {
            return this.app.animationLoop.getAnimationTime();
        }
    }

    getBPM() {
        return this.bpm;
    }

    /**
     * Get the BPM timing manager for musical calculations
     */
    getBPMTimingManager() {
        return this.bpmTimingManager;
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
            <div class="flex flex-col md:flex-row md:items-center md:justify-between h-full px-4 py-1 md:py-0">
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
                        <span class="text-xs font-medium text-white">BPM: <span id="bpm-value">${MIDI_CONSTANTS.defaults.tempo}</span></span>
                    </div>
                    
                    <button id="bpm-down" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    
                    <button id="bpm-up" class="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
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
                
                <!-- Right side - Help button -->
                <div class="flex items-center justify-end gap-2 md:gap-4 mb-1 md:mb-0">
                    <button id="midi-help" class="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <path d="M12 17h.01"/>
                        </svg>
                        <span>Help</span>
                    </button>
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
        

        
        // Sync mode toggle
        document.getElementById('sync-toggle').addEventListener('click', () => {
            this.toggleSyncMode();
        });
        
        // BPM controls
        document.getElementById('bpm-up').addEventListener('click', () => {
            this.increaseBPM();
        });
        
        document.getElementById('bpm-down').addEventListener('click', () => {
            this.decreaseBPM();
        });
        
        // Help button
        document.getElementById('midi-help').addEventListener('click', () => {
            window.open('midi-help.html', '_blank');
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



    toggleSyncMode() {
        const modes = ['auto', 'manual', 'off'];
        const currentIndex = modes.indexOf(this.syncMode);
        this.syncMode = modes[(currentIndex + 1) % modes.length];
        this.updateSyncModeDisplay();
        console.log(`Sync mode changed to: ${this.syncMode}`);
    }

    increaseBPM() {
        const newBPM = Math.min(MIDI_CONSTANTS.clock.maxTempo, this.bpm + 1);
        this.setBPM(newBPM);
        console.log(`BPM increased to: ${newBPM}`);
    }

    decreaseBPM() {
        const newBPM = Math.max(1, this.bpm - 1);
        this.setBPM(newBPM);
        console.log(`BPM decreased to: ${newBPM}`);
    }

    setBPM(bpm) {
        // Validate BPM value before setting
        if (bpm >= MIDI_CONSTANTS.clock.minTempo && bpm <= MIDI_CONSTANTS.clock.maxTempo && isFinite(bpm)) {
            this.bpm = bpm;
            this.bpmTimingManager.setBPM(bpm);
            
            // Update state if app is available
            if (this.app && this.app.state) {
                this.app.state.set('globalBPM', Math.round(bpm));
            }
            
            this.updateClockDisplay();
        } else {
            console.warn(`Attempted to set invalid BPM: ${bpm}. BPM must be between ${MIDI_CONSTANTS.clock.minTempo}-${MIDI_CONSTANTS.clock.maxTempo} and finite.`);
        }
    }

    /**
     * Initialize BPM from state after state is loaded
     */
    initializeFromState() {
        if (this.app && this.app.state) {
            const stateBPM = this.app.state.get('globalBPM');
            if (stateBPM) {
                this.setBPM(stateBPM);
            }
        }
    }

    /**
     * Handle MIDI tempo change from external device
     * @param {number} newBPM - New BPM from MIDI device
     */
    onMIDITempoChange(newBPM) {
        if (newBPM > 0 && newBPM <= MIDI_CONSTANTS.clock.maxTempo) {
            this.setBPM(newBPM);
            console.log(`MIDI Tempo Change: ${Math.round(newBPM)} BPM`);
        }
    }

    /**
     * Handle MIDI tempo tap (for devices with tap tempo functionality)
     */
    onMIDITempoTap() {
        const now = performance.now();
        
        if (!this.tapTimes) {
            this.tapTimes = [];
        }
        
        // Add current tap time
        this.tapTimes.push(now);
        
        // Keep only last 4 taps
        if (this.tapTimes.length > 4) {
            this.tapTimes.shift();
        }
        
        // Calculate BPM from tap intervals (need at least 2 taps)
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                const interval = this.tapTimes[i] - this.tapTimes[i - 1];
                // Validate interval is reasonable (between 100ms and 10 seconds)
                if (interval >= 100 && interval <= MIDI_CONSTANTS.clock.clockTimeout * 10) {
                    intervals.push(interval);
                }
            }
            
            // Only proceed if we have valid intervals
            if (intervals.length >= 1) {
                // Calculate average interval
                const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
                
                // Validate average interval before calculating BPM
                if (avgInterval > 0 && avgInterval < MIDI_CONSTANTS.clock.clockTimeout * 10 && isFinite(avgInterval)) {
                    const newBPM = 60000 / avgInterval; // Convert to BPM
                    
                    if (newBPM >= MIDI_CONSTANTS.clock.minTempo && newBPM <= MIDI_CONSTANTS.clock.maxTempo && isFinite(newBPM)) { // Reasonable BPM range
                        this.setBPM(newBPM);
                        console.log(`MIDI Tap Tempo: ${Math.round(newBPM)} BPM`);
                    } else {
                        console.warn(`Invalid tap tempo BPM: ${newBPM} (avg interval: ${avgInterval}ms)`);
                    }
                } else {
                    console.warn(`Invalid average tap interval: ${avgInterval}ms`);
                }
            }
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
        
        // Update BPM display - use state value if available, otherwise use calculated BPM
        if (bpmElement) {
            let displayBPM = this.bpm;
            if (this.app && this.app.state) {
                const stateBPM = this.app.state.get('globalBPM');
                if (stateBPM) {
                    displayBPM = stateBPM;
                }
            }
            bpmElement.textContent = Math.round(displayBPM);
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
        
        // Update sync mode display
        this.updateSyncModeDisplay();
        
        // Debug: Log sync status occasionally
        if (Math.random() < 0.01) { // 1% chance per update
            const animationLoop = this.app.animationLoop;
            if (animationLoop) {
                console.log(`Clock Status: Source=${this.clockSource}, Active=${this.isClockActive}, Sync=${animationLoop.getSyncMode()}, Using External=${animationLoop.isUsingExternalClock()}`);
            }
        }
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