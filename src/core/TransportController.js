/**
 * TransportController.js - Transport and Timing Management
 * This module manages playback state, internal timing, and coordinates between MIDI clock
 * and internal clock modes. It provides a unified interface for transport controls and
 * ensures smooth transitions between different timing sources.
 */

export class TransportController {
    constructor(app) {
        this.app = app;
        
        // Transport state
        this.transportMode = 'stopped'; // 'playing', 'paused', 'stopped'
        this.syncSource = 'internal';   // 'internal', 'midi'
        this.internalBPM = 120;
        this.currentBPM = 120;
        this.beatDivision = '1/4';      // '1/4', '1/8', '1/16'
        this.midiClockEnabled = false;
        
        // Internal timing
        this.internalStartTime = 0;
        this.internalPauseTime = 0;
        this.internalTotalPauseTime = 0;
        this.internalBeatPosition = { bar: 1, beat: 1, tick: 1 };
        this.internalClockInterval = null;
        
        // Beat tracking
        this.lastBeatCallback = 0;
        this.beatCallbacks = new Set();
        this.transportCallbacks = new Set();
        this.bpmCallbacks = new Set();
        
        // Animation timing
        this.animationTimeOffset = 0;
        this.lastAnimationTime = 0;
        
        this.setupInternalClock();
    }
    
    setupInternalClock() {
        // Internal clock runs at high resolution for smooth animation
        this.internalClockInterval = setInterval(() => {
            if (this.syncSource === 'internal' && this.transportMode === 'playing') {
                this.updateInternalTiming();
            }
        }, 16); // ~60fps for smooth animation
    }
    
    updateInternalTiming() {
        const currentTime = performance.now();
        const elapsedTime = (currentTime - this.internalStartTime - this.internalTotalPauseTime) / 1000;
        
        // Calculate beat position
        const beatsElapsed = (elapsedTime * this.internalBPM) / 60;
        const totalQuarters = Math.floor(beatsElapsed);
        const bar = Math.floor(totalQuarters / 4) + 1;
        const beat = (totalQuarters % 4) + 1;
        const tick = Math.floor((beatsElapsed % 1) * 4) + 1;
        
        this.internalBeatPosition = { bar, beat, tick };
        
        // Check for beat boundaries and trigger callbacks
        this.checkBeatBoundaries(beatsElapsed);
    }
    
    checkBeatBoundaries(beatsElapsed) {
        let beatInterval;
        switch (this.beatDivision) {
            case '1/16': beatInterval = 0.25; break;
            case '1/8': beatInterval = 0.5; break;
            case '1/4': beatInterval = 1.0; break;
            default: beatInterval = 1.0;
        }
        
        const currentBeat = Math.floor(beatsElapsed / beatInterval);
        const lastBeat = Math.floor(this.lastBeatCallback / beatInterval);
        
        if (currentBeat > lastBeat) {
            this.triggerBeatCallbacks();
            this.lastBeatCallback = beatsElapsed;
        }
    }
    
    // Transport controls
    play() {
        if (this.transportMode === 'playing') return;
        
        const wasPlaying = this.transportMode === 'paused';
        this.transportMode = 'playing';
        
        if (this.syncSource === 'internal') {
            if (wasPlaying) {
                // Resume from pause
                this.internalTotalPauseTime += performance.now() - this.internalPauseTime;
                this.internalPauseTime = 0;
            } else {
                // Start from beginning
                this.internalStartTime = performance.now();
                this.internalTotalPauseTime = 0;
                this.internalBeatPosition = { bar: 1, beat: 1, tick: 1 };
                this.animationTimeOffset = 0;
            }
        }
        
        this.triggerTransportCallbacks('playing');
        
        // Update app state
        if (this.app.state) {
            this.app.state.set('transportMode', 'playing');
        }
    }
    
    pause() {
        if (this.transportMode !== 'playing') return;
        
        this.transportMode = 'paused';
        
        if (this.syncSource === 'internal') {
            this.internalPauseTime = performance.now();
        }
        
        this.triggerTransportCallbacks('paused');
        
        // Update app state
        if (this.app.state) {
            this.app.state.set('transportMode', 'paused');
        }
    }
    
    stop() {
        this.transportMode = 'stopped';
        
        if (this.syncSource === 'internal') {
            this.internalStartTime = 0;
            this.internalPauseTime = 0;
            this.internalTotalPauseTime = 0;
            this.internalBeatPosition = { bar: 1, beat: 1, tick: 1 };
            this.animationTimeOffset = 0;
        }
        
        this.triggerTransportCallbacks('stopped');
        
        // Update app state
        if (this.app.state) {
            this.app.state.set('transportMode', 'stopped');
        }
    }
    
    // Sync source management
    setSyncSource(source) {
        if (this.syncSource === source) return;
        
        const wasPlaying = this.transportMode === 'playing';
        
        // Stop current playback
        if (wasPlaying) {
            this.pause();
        }
        
        this.syncSource = source;
        
        // Update current BPM based on source
        if (source === 'internal') {
            this.currentBPM = this.internalBPM;
            this.midiClockEnabled = false;
        } else if (source === 'midi') {
            this.midiClockEnabled = true;
            // BPM will be updated by MIDI clock manager
        }
        
        // Resume if was playing
        if (wasPlaying) {
            this.play();
        }
        
        // Update app state
        if (this.app.state) {
            this.app.state.set('syncSource', source);
            this.app.state.set('midiClockEnabled', this.midiClockEnabled);
        }
        
        this.triggerTransportCallbacks('sync_changed');
    }
    
    // BPM management
    setInternalBPM(bpm) {
        this.internalBPM = Math.max(60, Math.min(200, bpm)); // Clamp to reasonable range
        
        if (this.syncSource === 'internal') {
            this.currentBPM = this.internalBPM;
            this.triggerBPMCallbacks(this.currentBPM);
        }
        
        // Update app state
        if (this.app.state) {
            this.app.state.set('internalBPM', this.internalBPM);
            if (this.syncSource === 'internal') {
                this.app.state.set('currentBPM', this.currentBPM);
            }
        }
    }
    
    updateMIDIBPM(bpm) {
        if (this.syncSource === 'midi') {
            this.currentBPM = bpm;
            this.triggerBPMCallbacks(this.currentBPM);
            
            // Update app state
            if (this.app.state) {
                this.app.state.set('currentBPM', this.currentBPM);
            }
        }
    }
    
    // Beat division
    setBeatDivision(division) {
        this.beatDivision = division;
        
        // Update app state
        if (this.app.state) {
            this.app.state.set('beatDivision', division);
        }
        
        this.triggerTransportCallbacks('division_changed');
    }
    
    // Animation timing interface
    getAnimationTime() {
        if (this.syncSource === 'midi' && this.app.midiClockManager) {
            return this.app.midiClockManager.getAnimationTime();
        }
        
        if (this.syncSource === 'internal' && this.transportMode === 'playing') {
            const currentTime = performance.now();
            const elapsedTime = (currentTime - this.internalStartTime - this.internalTotalPauseTime) / 1000;
            return (elapsedTime * this.internalBPM) / 60; // Convert to beats
        }
        
        return 0;
    }
    
    getBeatProgress() {
        if (this.syncSource === 'midi' && this.app.midiClockManager) {
            return this.app.midiClockManager.getBeatProgress(this.beatDivision);
        }
        
        if (this.syncSource === 'internal' && this.transportMode === 'playing') {
            const animationTime = this.getAnimationTime();
            let divisor;
            switch (this.beatDivision) {
                case '1/16': divisor = 0.25; break;
                case '1/8': divisor = 0.5; break;
                case '1/4': divisor = 1.0; break;
                default: divisor = 1.0;
            }
            return (animationTime % divisor) / divisor;
        }
        
        return 0;
    }
    
    isOnBeat() {
        if (this.syncSource === 'midi' && this.app.midiClockManager) {
            return this.app.midiClockManager.isOnBeat(this.beatDivision);
        }
        
        // For internal timing, this is handled in updateInternalTiming
        return false;
    }
    
    getCurrentBeatPosition() {
        if (this.syncSource === 'midi' && this.app.midiClockManager) {
            return this.app.midiClockManager.getState().beatPosition;
        }
        
        return this.internalBeatPosition;
    }
    
    // Callback management
    addBeatCallback(callback) {
        this.beatCallbacks.add(callback);
    }
    
    removeBeatCallback(callback) {
        this.beatCallbacks.delete(callback);
    }
    
    addTransportCallback(callback) {
        this.transportCallbacks.add(callback);
    }
    
    removeTransportCallback(callback) {
        this.transportCallbacks.delete(callback);
    }
    
    addBPMCallback(callback) {
        this.bpmCallbacks.add(callback);
    }
    
    removeBPMCallback(callback) {
        this.bpmCallbacks.delete(callback);
    }
    
    triggerBeatCallbacks() {
        const beatPosition = this.getCurrentBeatPosition();
        this.beatCallbacks.forEach(callback => {
            try {
                callback(beatPosition, this.currentBPM, this.beatDivision);
            } catch (error) {
                console.error('Error in beat callback:', error);
            }
        });
    }
    
    triggerTransportCallbacks(state) {
        this.transportCallbacks.forEach(callback => {
            try {
                callback(state, this.getCurrentBeatPosition());
            } catch (error) {
                console.error('Error in transport callback:', error);
            }
        });
    }
    
    triggerBPMCallbacks(bpm) {
        this.bpmCallbacks.forEach(callback => {
            try {
                callback(bpm, this.syncSource);
            } catch (error) {
                console.error('Error in BPM callback:', error);
            }
        });
    }
    
    // Get current state
    getState() {
        return {
            transportMode: this.transportMode,
            syncSource: this.syncSource,
            internalBPM: this.internalBPM,
            currentBPM: this.currentBPM,
            beatDivision: this.beatDivision,
            midiClockEnabled: this.midiClockEnabled,
            beatPosition: this.getCurrentBeatPosition(),
            isPlaying: this.transportMode === 'playing'
        };
    }
    
    // Cleanup
    destroy() {
        if (this.internalClockInterval) {
            clearInterval(this.internalClockInterval);
            this.internalClockInterval = null;
        }
        
        this.beatCallbacks.clear();
        this.transportCallbacks.clear();
        this.bpmCallbacks.clear();
    }
}