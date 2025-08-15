/**
 * MIDIClockManager.js - MIDI Clock Synchronization and Transport Controls
 * This module handles MIDI clock messages, calculates BPM, manages transport state,
 * and provides clock-based timing for animations and effects.
 */

import { BPMTimingManager } from './BPMTimingManager.js';
import { MIDI_CONSTANTS } from '../config/index.js';
import { TransportBar } from '../ui/TransportBar.js';

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
        
        // Initialize transport bar UI component
        this.transportBar = new TransportBar(this);
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
            this.transportBar.updateAllDisplays();
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
        this.transportBar.updateAllDisplays();
        console.log('MIDI Start received');
    }

    onMIDIStop() {
        this.isClockActive = false;
        this.clockSource = 'internal';
        this.isPlaying = false;
        this.isStopped = true;
        this.isPaused = false;
        
        this.transportBar.updateAllDisplays();
        console.log('MIDI Stop received');
    }

    onMIDIContinue() {
        this.isClockActive = true;
        this.clockSource = 'external';
        this.isPlaying = true;
        this.isStopped = false;
        this.isPaused = false;
        
        this.transportBar.updateAllDisplays();
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

    startInternalClock() {
        this.isPlaying = true;
        this.isStopped = false;
        this.isPaused = false;
        this.clockSource = 'internal';
        this.transportBar.updateAllDisplays();
        console.log('Internal clock started');
    }

    stopInternalClock() {
        this.isPlaying = false;
        this.isStopped = true;
        this.isPaused = false;
        this.transportBar.updateAllDisplays();
        console.log('Internal clock stopped');
    }

    resetClock() {
        this.clockPulses = 0;
        this.app.animationLoop.resetAnimationTime();
        this.transportBar.updateAllDisplays();
        console.log('Clock reset');
    }



    toggleSyncMode() {
        const modes = ['auto', 'manual', 'off'];
        const currentIndex = modes.indexOf(this.syncMode);
        this.syncMode = modes[(currentIndex + 1) % modes.length];
        this.transportBar.updateAllDisplays();
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
            
            this.transportBar.updateAllDisplays();
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




} 