/**
 * TransportUI.js - Transport Control Bar Interface
 * This module handles all UI interactions for the transport control bar, including
 * play/pause/stop controls, BPM display, beat division selection, sync mode toggle,
 * beat visualization, and tap tempo functionality.
 */

export class TransportUI {
    constructor(app) {
        this.app = app;
        this.transportController = app.transportController;
        
        // UI elements
        this.elements = {};
        this.tapTempoTimes = [];
        this.tapTempoTimeout = null;
        
        // Beat visualization
        this.beatVisualizerElements = [];
        this.lastBeatTime = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateUI();
    }
    
    initializeElements() {
        // Transport controls
        this.elements.playPause = document.getElementById('transport-play-pause');
        this.elements.stop = document.getElementById('transport-stop');
        this.elements.rewind = document.getElementById('transport-rewind');
        
        // Play/Pause icons
        this.elements.playIcon = document.getElementById('play-icon');
        this.elements.pauseIcon = document.getElementById('pause-icon');
        
        // BPM controls
        this.elements.bpmDisplay = document.getElementById('bpm-display');
        this.elements.bpmInput = document.getElementById('bpm-input');
        
        // Beat division
        this.elements.beatDivision = document.getElementById('beat-division');
        
        // Position display
        this.elements.beatPosition = document.getElementById('beat-position');
        
        // Sync controls
        this.elements.syncToggle = document.getElementById('sync-toggle');
        this.elements.syncIndicator = document.getElementById('sync-indicator');
        this.elements.syncText = document.getElementById('sync-text');
        
        // Beat visualizer
        this.beatVisualizerElements = [
            document.getElementById('beat-viz-1'),
            document.getElementById('beat-viz-2'),
            document.getElementById('beat-viz-3'),
            document.getElementById('beat-viz-4')
        ];
        
        // Tap tempo
        this.elements.tapTempo = document.getElementById('tap-tempo');
    }
    
    setupEventListeners() {
        // Transport controls
        this.elements.playPause?.addEventListener('click', () => this.handlePlayPause());
        this.elements.stop?.addEventListener('click', () => this.handleStop());
        this.elements.rewind?.addEventListener('click', () => this.handleRewind());
        
        // BPM controls
        this.elements.bpmDisplay?.addEventListener('click', () => this.enableBPMEdit());
        this.elements.bpmInput?.addEventListener('blur', () => this.disableBPMEdit());
        this.elements.bpmInput?.addEventListener('keydown', (e) => this.handleBPMKeydown(e));
        this.elements.bpmInput?.addEventListener('input', (e) => this.handleBPMInput(e));
        
        // Beat division
        this.elements.beatDivision?.addEventListener('change', (e) => this.handleBeatDivisionChange(e));
        
        // Sync toggle
        this.elements.syncToggle?.addEventListener('click', () => this.handleSyncToggle());
        
        // Tap tempo
        this.elements.tapTempo?.addEventListener('click', () => this.handleTapTempo());
        
        // Transport controller callbacks
        if (this.transportController) {
            this.transportController.addTransportCallback((state, position) => {
                this.updateTransportState(state, position);
            });
            
            this.transportController.addBPMCallback((bpm, source) => {
                this.updateBPMDisplay(bpm, source);
            });
            
            this.transportController.addBeatCallback((position, bpm, division) => {
                this.updateBeatVisualization(position, bpm, division);
            });
        }
        
        // MIDI clock manager callbacks
        if (this.app.midiClockManager) {
            this.app.midiClockManager.setBPMChangeCallback((bpm) => {
                this.updateBPMDisplay(bpm, 'midi');
            });
            
            this.app.midiClockManager.setBeatChangeCallback((position, bpm) => {
                this.updateBeatPosition(position);
                this.updateBeatVisualization(position, bpm, this.app.state.get('beatDivision'));
            });
            
            this.app.midiClockManager.setTransportChangeCallback((state, position) => {
                this.updateTransportState(state, position);
            });
        }
        
        // State change listeners
        if (this.app.state) {
            this.app.state.subscribe('syncSource', (value) => this.updateSyncDisplay(value));
            this.app.state.subscribe('transportMode', (value) => this.updateTransportDisplay(value));
            this.app.state.subscribe('currentBPM', (value) => this.updateBPMDisplay(value));
            this.app.state.subscribe('beatDivision', (value) => this.updateBeatDivisionDisplay(value));
            this.app.state.subscribe('beatPosition', (value) => this.updateBeatPosition(value));
        }
    }
    
    // Transport control handlers
    handlePlayPause() {
        const currentMode = this.app.state?.get('transportMode') || 'stopped';
        
        if (currentMode === 'playing') {
            this.transportController?.pause();
        } else {
            this.transportController?.play();
        }
    }
    
    handleStop() {
        this.transportController?.stop();
    }
    
    handleRewind() {
        this.transportController?.stop();
        // Future: Add rewind to specific position functionality
    }
    
    // BPM control handlers
    enableBPMEdit() {
        const syncSource = this.app.state?.get('syncSource');
        if (syncSource === 'midi') return; // Can't edit BPM in MIDI mode
        
        this.elements.bpmDisplay.classList.add('hidden');
        this.elements.bpmInput.classList.remove('hidden');
        this.elements.bpmInput.focus();
        this.elements.bpmInput.select();
    }
    
    disableBPMEdit() {
        this.elements.bpmDisplay.classList.remove('hidden');
        this.elements.bpmInput.classList.add('hidden');
        
        const newBPM = parseInt(this.elements.bpmInput.value);
        if (!isNaN(newBPM) && newBPM >= 60 && newBPM <= 200) {
            this.transportController?.setInternalBPM(newBPM);
        } else {
            // Reset to current value if invalid
            const currentBPM = this.app.state?.get('internalBPM') || 120;
            this.elements.bpmInput.value = currentBPM;
        }
    }
    
    handleBPMKeydown(e) {
        if (e.key === 'Enter') {
            this.elements.bpmInput.blur();
        } else if (e.key === 'Escape') {
            // Reset to current value
            const currentBPM = this.app.state?.get('internalBPM') || 120;
            this.elements.bpmInput.value = currentBPM;
            this.elements.bpmInput.blur();
        }
    }
    
    handleBPMInput(e) {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 60 && value <= 200) {
            // Live update while typing (optional)
            // this.transportController?.setInternalBPM(value);
        }
    }
    
    // Beat division handler
    handleBeatDivisionChange(e) {
        this.transportController?.setBeatDivision(e.target.value);
    }
    
    // Sync toggle handler
    handleSyncToggle() {
        const currentSource = this.app.state?.get('syncSource') || 'internal';
        const newSource = currentSource === 'internal' ? 'midi' : 'internal';
        
        // Check if MIDI is available for MIDI sync
        if (newSource === 'midi' && !this.app.midiManager?.isConnected) {
            console.warn('MIDI not connected - cannot switch to MIDI sync');
            return;
        }
        
        this.transportController?.setSyncSource(newSource);
    }
    
    // Tap tempo handler
    handleTapTempo() {
        const syncSource = this.app.state?.get('syncSource');
        if (syncSource === 'midi') return; // Can't tap tempo in MIDI mode
        
        const now = performance.now();
        this.tapTempoTimes.push(now);
        
        // Keep only last 8 taps
        if (this.tapTempoTimes.length > 8) {
            this.tapTempoTimes.shift();
        }
        
        // Need at least 2 taps to calculate tempo
        if (this.tapTempoTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTempoTimes.length; i++) {
                intervals.push(this.tapTempoTimes[i] - this.tapTempoTimes[i - 1]);
            }
            
            const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
            const bpm = Math.round(60000 / avgInterval);
            
            if (bpm >= 60 && bpm <= 200) {
                this.transportController?.setInternalBPM(bpm);
            }
        }
        
        // Clear tap times after 3 seconds of inactivity
        if (this.tapTempoTimeout) {
            clearTimeout(this.tapTempoTimeout);
        }
        this.tapTempoTimeout = setTimeout(() => {
            this.tapTempoTimes = [];
        }, 3000);
        
        // Visual feedback
        this.elements.tapTempo.classList.add('scale-90');
        setTimeout(() => {
            this.elements.tapTempo.classList.remove('scale-90');
        }, 100);
    }
    
    // UI update methods
    updateTransportState(state, position) {
        this.updateTransportDisplay(state);
        if (position) {
            this.updateBeatPosition(position);
        }
    }
    
    updateTransportDisplay(state) {
        const isPlaying = state === 'playing';
        
        if (this.elements.playIcon && this.elements.pauseIcon) {
            if (isPlaying) {
                this.elements.playIcon.classList.add('hidden');
                this.elements.pauseIcon.classList.remove('hidden');
            } else {
                this.elements.playIcon.classList.remove('hidden');
                this.elements.pauseIcon.classList.add('hidden');
            }
        }
        
        // Update button styles
        if (this.elements.playPause) {
            if (isPlaying) {
                this.elements.playPause.classList.add('bg-red-500', 'bg-opacity-20', 'border-red-500', 'text-red-500');
                this.elements.playPause.classList.remove('bg-midi-green', 'bg-opacity-20', 'border-midi-green', 'text-midi-green');
            } else {
                this.elements.playPause.classList.remove('bg-red-500', 'bg-opacity-20', 'border-red-500', 'text-red-500');
                this.elements.playPause.classList.add('bg-midi-green', 'bg-opacity-20', 'border-midi-green', 'text-midi-green');
            }
        }
    }
    
    updateBPMDisplay(bpm, source) {
        const displayBPM = Math.round(bpm * 10) / 10; // Round to 1 decimal
        
        if (this.elements.bpmDisplay) {
            this.elements.bpmDisplay.textContent = displayBPM;
        }
        
        if (this.elements.bpmInput) {
            this.elements.bpmInput.value = Math.round(displayBPM);
        }
        
        // Update BPM display color based on source
        if (source === 'midi') {
            this.elements.bpmDisplay?.classList.add('text-blue-400');
            this.elements.bpmDisplay?.classList.remove('text-midi-green');
        } else {
            this.elements.bpmDisplay?.classList.remove('text-blue-400');
            this.elements.bpmDisplay?.classList.add('text-midi-green');
        }
    }
    
    updateBeatDivisionDisplay(division) {
        if (this.elements.beatDivision) {
            this.elements.beatDivision.value = division;
        }
    }
    
    updateBeatPosition(position) {
        if (this.elements.beatPosition && position) {
            const { bar, beat, tick } = position;
            this.elements.beatPosition.textContent = `${bar}.${beat}.${tick}`;
        }
    }
    
    updateSyncDisplay(source) {
        const isMidiSync = source === 'midi';
        const midiConnected = this.app.midiManager?.isConnected || false;
        
        if (this.elements.syncText) {
            this.elements.syncText.textContent = isMidiSync ? 'MIDI' : 'INT';
        }
        
        if (this.elements.syncIndicator) {
            this.elements.syncIndicator.classList.remove('bg-gray-500', 'bg-midi-green', 'bg-blue-400', 'bg-red-500');
            
            if (isMidiSync) {
                if (midiConnected) {
                    this.elements.syncIndicator.classList.add('bg-blue-400');
                } else {
                    this.elements.syncIndicator.classList.add('bg-red-500');
                }
            } else {
                this.elements.syncIndicator.classList.add('bg-midi-green');
            }
        }
        
        // Update BPM editability
        const canEditBPM = !isMidiSync;
        if (this.elements.bpmDisplay) {
            this.elements.bpmDisplay.style.cursor = canEditBPM ? 'pointer' : 'default';
            this.elements.bpmDisplay.title = canEditBPM ? 'Click to edit BPM' : 'BPM controlled by MIDI';
        }
        
        // Update tap tempo availability
        if (this.elements.tapTempo) {
            this.elements.tapTempo.style.opacity = canEditBPM ? '1' : '0.5';
            this.elements.tapTempo.style.cursor = canEditBPM ? 'pointer' : 'not-allowed';
        }
    }
    
    updateBeatVisualization(position, bpm, division) {
        if (!this.beatVisualizerElements.length) return;
        
        const { bar, beat, tick } = position;
        const currentTime = performance.now();
        
        // Determine which beat indicator to light up
        let activeIndex = -1;
        switch (division) {
            case '1/4':
                activeIndex = (beat - 1) % 4;
                break;
            case '1/8':
                activeIndex = ((beat - 1) * 2 + Math.floor((tick - 1) / 2)) % 4;
                break;
            case '1/16':
                activeIndex = (tick - 1) % 4;
                break;
        }
        
        // Reset all indicators
        this.beatVisualizerElements.forEach((element, index) => {
            element.classList.remove('bg-midi-green', 'bg-yellow-400', 'bg-white', 'scale-125');
            element.classList.add('bg-gray-600');
            
            if (index === activeIndex) {
                // Color coding: Green for downbeat, Yellow for strong beat, White for weak beat
                let color = 'bg-white';
                if (beat === 1 && tick === 1) {
                    color = 'bg-midi-green'; // Downbeat
                } else if (beat === 1 || beat === 3) {
                    color = 'bg-yellow-400'; // Strong beats
                }
                
                element.classList.remove('bg-gray-600');
                element.classList.add(color, 'scale-125');
                
                // Flash effect
                setTimeout(() => {
                    element.classList.remove('scale-125');
                }, 100);
            }
        });
        
        this.lastBeatTime = currentTime;
    }
    
    updateUI() {
        if (!this.app.state) return;
        
        const state = this.transportController?.getState() || {};
        
        this.updateTransportDisplay(state.transportMode);
        this.updateBPMDisplay(state.currentBPM || 120, state.syncSource);
        this.updateBeatDivisionDisplay(state.beatDivision || '1/4');
        this.updateBeatPosition(state.beatPosition);
        this.updateSyncDisplay(state.syncSource || 'internal');
    }
    
    // Cleanup
    destroy() {
        if (this.tapTempoTimeout) {
            clearTimeout(this.tapTempoTimeout);
        }
        
        // Remove event listeners
        Object.values(this.elements).forEach(element => {
            if (element && element.removeEventListener) {
                element.removeEventListener('click', () => {});
                element.removeEventListener('change', () => {});
                element.removeEventListener('input', () => {});
                element.removeEventListener('blur', () => {});
                element.removeEventListener('keydown', () => {});
            }
        });
    }
}