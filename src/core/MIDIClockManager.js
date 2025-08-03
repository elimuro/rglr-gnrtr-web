/**
 * MIDIClockManager.js - MIDI Clock Timing and Synchronization
 * This module handles MIDI clock messages (0xF8), transport controls (Start/Stop/Continue),
 * and provides precise tempo synchronization for animations. It calculates BPM from incoming
 * MIDI clock intervals and maintains beat position tracking for musical synchronization.
 */

export class MIDIClockManager {
    constructor(app) {
        this.app = app;
        
        // MIDI Clock state
        this.isReceivingClock = false;
        this.lastClockTime = 0;
        this.clockCount = 0;
        this.currentBPM = 120;
        this.clockInterval = 0;
        this.clockHistory = []; // For BPM averaging
        this.maxClockHistory = 24; // Average over 1 quarter note
        
        // Transport state
        this.isPlaying = false;
        this.beatPosition = { bar: 1, beat: 1, tick: 1 };
        this.songPosition = 0; // In MIDI beats (16th notes)
        this.ticksPerBeat = 24; // MIDI clocks per quarter note
        this.beatsPerBar = 4;
        
        // Timing
        this.startTime = 0;
        this.pauseTime = 0;
        this.totalPauseTime = 0;
        
        // Callbacks
        this.onBPMChange = null;
        this.onBeatChange = null;
        this.onTransportChange = null;
        
        // Clock timeout for detecting lost sync
        this.clockTimeout = null;
        this.clockTimeoutDuration = 200; // ms
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for MIDI clock timeout
        this.resetClockTimeout();
    }
    
    // Handle MIDI Clock message (0xF8)
    handleMIDIClock(timestamp) {
        const currentTime = performance.now();
        
        if (this.lastClockTime > 0) {
            this.clockInterval = currentTime - this.lastClockTime;
            this.updateBPMFromClock();
        }
        
        this.lastClockTime = currentTime;
        this.clockCount++;
        this.isReceivingClock = true;
        
        // Update beat position if playing
        if (this.isPlaying) {
            this.updateBeatPosition();
        }
        
        // Reset timeout
        this.resetClockTimeout();
        
        // Trigger beat callback on quarter note boundaries
        if (this.clockCount % 24 === 0 && this.onBeatChange) {
            this.onBeatChange(this.beatPosition, this.currentBPM);
        }
    }
    
    // Handle MIDI Start message (0xFA)
    handleMIDIStart(timestamp) {
        console.log('MIDI Start received');
        this.isPlaying = true;
        this.clockCount = 0;
        this.songPosition = 0;
        this.beatPosition = { bar: 1, beat: 1, tick: 1 };
        this.startTime = performance.now();
        this.totalPauseTime = 0;
        
        if (this.onTransportChange) {
            this.onTransportChange('playing', this.beatPosition);
        }
    }
    
    // Handle MIDI Stop message (0xFC)
    handleMIDIStop(timestamp) {
        console.log('MIDI Stop received');
        this.isPlaying = false;
        
        if (this.onTransportChange) {
            this.onTransportChange('stopped', this.beatPosition);
        }
    }
    
    // Handle MIDI Continue message (0xFB)
    handleMIDIContinue(timestamp) {
        console.log('MIDI Continue received');
        this.isPlaying = true;
        
        if (this.pauseTime > 0) {
            this.totalPauseTime += performance.now() - this.pauseTime;
            this.pauseTime = 0;
        }
        
        if (this.onTransportChange) {
            this.onTransportChange('playing', this.beatPosition);
        }
    }
    
    // Handle Song Position Pointer (0xF2)
    handleSongPositionPointer(data) {
        // Song position is in MIDI beats (16th notes)
        // Data bytes: LSB, MSB (14-bit value)
        const position = data[1] | (data[2] << 7);
        this.songPosition = position;
        
        // Convert to bar.beat.tick format
        const totalSixteenths = position;
        const totalQuarters = Math.floor(totalSixteenths / 4);
        const bar = Math.floor(totalQuarters / this.beatsPerBar) + 1;
        const beat = (totalQuarters % this.beatsPerBar) + 1;
        const tick = (totalSixteenths % 4) + 1;
        
        this.beatPosition = { bar, beat, tick };
        
        console.log(`Song Position: ${position} MIDI beats -> ${bar}.${beat}.${tick}`);
        
        if (this.onBeatChange) {
            this.onBeatChange(this.beatPosition, this.currentBPM);
        }
    }
    
    updateBPMFromClock() {
        if (this.clockInterval <= 0) return;
        
        // Calculate BPM from clock interval
        // 24 clocks per quarter note, 60000ms per minute
        const bpm = 60000 / (this.clockInterval * 24);
        
        // Add to history for averaging
        this.clockHistory.push(bpm);
        if (this.clockHistory.length > this.maxClockHistory) {
            this.clockHistory.shift();
        }
        
        // Calculate average BPM
        const avgBPM = this.clockHistory.reduce((sum, bpm) => sum + bpm, 0) / this.clockHistory.length;
        const roundedBPM = Math.round(avgBPM * 10) / 10; // Round to 1 decimal
        
        if (Math.abs(this.currentBPM - roundedBPM) > 0.1) {
            this.currentBPM = roundedBPM;
            
            if (this.onBPMChange) {
                this.onBPMChange(this.currentBPM);
            }
        }
    }
    
    updateBeatPosition() {
        // Update beat position based on clock count
        const totalSixteenths = Math.floor(this.clockCount / 6); // 6 clocks per 16th note
        const totalQuarters = Math.floor(totalSixteenths / 4);
        const bar = Math.floor(totalQuarters / this.beatsPerBar) + 1;
        const beat = (totalQuarters % this.beatsPerBar) + 1;
        const tick = (totalSixteenths % 4) + 1;
        
        this.beatPosition = { bar, beat, tick };
        this.songPosition = totalSixteenths;
    }
    
    resetClockTimeout() {
        if (this.clockTimeout) {
            clearTimeout(this.clockTimeout);
        }
        
        this.clockTimeout = setTimeout(() => {
            if (this.isReceivingClock) {
                console.log('MIDI Clock timeout - sync lost');
                this.isReceivingClock = false;
                
                if (this.onTransportChange) {
                    this.onTransportChange('sync_lost', this.beatPosition);
                }
            }
        }, this.clockTimeoutDuration);
    }
    
    // Get current timing info for animations
    getAnimationTime(baseTime = 0) {
        if (!this.isPlaying || !this.isReceivingClock) {
            return baseTime;
        }
        
        const currentTime = performance.now();
        const elapsedTime = (currentTime - this.startTime - this.totalPauseTime) / 1000;
        
        // Convert to musical time based on BPM
        const beatsElapsed = (elapsedTime * this.currentBPM) / 60;
        
        return beatsElapsed;
    }
    
    // Get beat progress (0-1) for current subdivision
    getBeatProgress(subdivision = '1/4') {
        if (!this.isPlaying) return 0;
        
        let divisor;
        switch (subdivision) {
            case '1/16': divisor = 6; break;   // 6 clocks per 16th
            case '1/8': divisor = 12; break;   // 12 clocks per 8th
            case '1/4': divisor = 24; break;   // 24 clocks per quarter
            default: divisor = 24;
        }
        
        return (this.clockCount % divisor) / divisor;
    }
    
    // Check if we're on a beat boundary
    isOnBeat(subdivision = '1/4') {
        let divisor;
        switch (subdivision) {
            case '1/16': divisor = 6; break;
            case '1/8': divisor = 12; break;
            case '1/4': divisor = 24; break;
            default: divisor = 24;
        }
        
        return this.clockCount % divisor === 0;
    }
    
    // Set callbacks
    setBPMChangeCallback(callback) {
        this.onBPMChange = callback;
    }
    
    setBeatChangeCallback(callback) {
        this.onBeatChange = callback;
    }
    
    setTransportChangeCallback(callback) {
        this.onTransportChange = callback;
    }
    
    // Get current state
    getState() {
        return {
            isReceivingClock: this.isReceivingClock,
            isPlaying: this.isPlaying,
            currentBPM: this.currentBPM,
            beatPosition: { ...this.beatPosition },
            songPosition: this.songPosition,
            clockCount: this.clockCount
        };
    }
    
    // Reset all timing
    reset() {
        this.isPlaying = false;
        this.isReceivingClock = false;
        this.clockCount = 0;
        this.songPosition = 0;
        this.beatPosition = { bar: 1, beat: 1, tick: 1 };
        this.clockHistory = [];
        this.startTime = 0;
        this.pauseTime = 0;
        this.totalPauseTime = 0;
        
        if (this.clockTimeout) {
            clearTimeout(this.clockTimeout);
            this.clockTimeout = null;
        }
    }
}