/**
 * TransportBar.js - Transport Controls UI Component
 * This module handles the creation and management of the transport bar UI,
 * including play/stop/reset controls, BPM display, clock status indicators,
 * and related UI elements. It delegates all clock operations to the MIDIClockManager.
 */

import { MIDI_CONSTANTS } from '../config/index.js';

export class TransportBar {
    constructor(midiClockManager) {
        this.midiClockManager = midiClockManager;
        this.transportBar = null;
        
        this.init();
    }

    init() {
        // Create bottom transport bar if it doesn't exist
        if (!document.getElementById('transport-bottom-bar')) {
            this.createTransportBar();
            this.setupEventListeners();
        }
    }

    createTransportBar() {
        const transportBar = document.createElement('div');
        transportBar.id = 'transport-bottom-bar';
        transportBar.className = 'fixed bottom-0 left-0 right-0 h-12 md:h-12 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white z-50 shadow-lg backdrop-blur-md border-t border-gray-700';
        
        transportBar.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center md:justify-between h-full px-4 py-1 md:py-0">
                <!-- All controls on the left side -->
                <div class="flex items-center justify-start gap-2 md:gap-4 mb-1 md:mb-0">
                    <button id="transport-play" class="btn btn-secondary btn-sm">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                        <span>Play</span>
                    </button>
                    
                    <button id="transport-stop" class="btn btn-secondary btn-sm">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                        <span>Stop</span>
                    </button>
                    
                    <button id="transport-reset" class="btn btn-secondary btn-sm">
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
                    
                    <button id="bpm-down" class="btn btn-secondary btn-xs">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    
                    <button id="bpm-up" class="btn btn-secondary btn-xs">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 15l6-6 6 6"/>
                        </svg>
                    </button>
                    
                    <button id="sync-toggle" class="btn btn-secondary btn-xs">
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
                
                <!-- Right side - P5 Code Editor and Help buttons -->
                <div class="flex items-center justify-end gap-2 md:gap-4 mb-1 md:mb-0">
                    <button id="p5-code-editor" class="btn btn-secondary btn-sm">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 3h5v5"/>
                            <path d="M8 3H3v5"/>
                            <path d="M12 22v-7"/>
                            <path d="M3 12h18"/>
                            <path d="M8 21h8"/>
                            <path d="M8 3v4"/>
                            <path d="M16 3v4"/>
                        </svg>
                        <span>P5 Code</span>
                    </button>
                    
                    <button id="shader-code-editor" class="btn btn-secondary btn-sm">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>Shader Code</span>
                    </button>
                    
                    <button id="midi-help" class="btn btn-secondary btn-sm">
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
        this.transportBar = transportBar;
    }

    setupEventListeners() {
        // Transport controls
        document.getElementById('transport-play').addEventListener('click', () => {
            this.midiClockManager.startInternalClock();
        });
        
        document.getElementById('transport-stop').addEventListener('click', () => {
            this.midiClockManager.stopInternalClock();
        });
        
        document.getElementById('transport-reset').addEventListener('click', () => {
            this.midiClockManager.resetClock();
        });
        
        // Sync mode toggle
        document.getElementById('sync-toggle').addEventListener('click', () => {
            this.midiClockManager.toggleSyncMode();
        });
        
        // BPM controls
        document.getElementById('bpm-up').addEventListener('click', () => {
            this.midiClockManager.increaseBPM();
        });
        
        document.getElementById('bpm-down').addEventListener('click', () => {
            this.midiClockManager.decreaseBPM();
        });
        
        // P5 Code Editor button - delegate to P5CodeEditor component
        document.getElementById('p5-code-editor').addEventListener('click', (event) => {
            console.log('TransportBar: P5 Code Editor button clicked');
            event.preventDefault();
            event.stopPropagation();
            if (this.midiClockManager.app.p5CodeEditor) {
                console.log('TransportBar: Calling P5CodeEditor.toggle()');
                this.midiClockManager.app.p5CodeEditor.toggle();
            } else {
                console.error('TransportBar: P5CodeEditor not available');
            }
        });
        
        // Shader Code Editor button - delegate to ShaderCodeEditor component
        document.getElementById('shader-code-editor').addEventListener('click', (event) => {
            console.log('TransportBar: Shader Code Editor button clicked');
            event.preventDefault();
            event.stopPropagation();
            if (this.midiClockManager.app.shaderCodeEditor) {
                console.log('TransportBar: Calling ShaderCodeEditor.toggle()');
                this.midiClockManager.app.shaderCodeEditor.toggle();
            } else {
                console.error('TransportBar: ShaderCodeEditor not available');
            }
        });
        
        // Help button
        document.getElementById('midi-help').addEventListener('click', () => {
            window.open('help.html', '_blank');
        });
    }

    updateTransportDisplay() {
        const playButton = document.getElementById('transport-play');
        const stopButton = document.getElementById('transport-stop');
        
        if (this.midiClockManager.isPlaying) {
            playButton.classList.add('active');
            stopButton.classList.remove('active');
        } else {
            playButton.classList.remove('active');
            stopButton.classList.add('active');
        }
    }

    updateClockDisplay() {
        const clockStatus = document.getElementById('clock-status');
        const statusDot = clockStatus.querySelector('.w-1\\.5');
        const statusText = clockStatus.querySelector('span');
        
        if (this.midiClockManager.isClockActive) {
            if (this.midiClockManager.clockSource === 'external') {
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-green-500 transition-all duration-300';
                statusText.textContent = 'External Clock';
            } else {
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-blue-500 transition-all duration-300';
                statusText.textContent = 'Internal Clock';
            }
        } else {
            statusDot.className = 'w-1.5 h-1.5 rounded-full bg-red-500 transition-all duration-300';
            statusText.textContent = 'Stopped';
        }
    }

    updateBPMDisplay() {
        const bpmValue = document.getElementById('bpm-value');
        if (bpmValue) {
            bpmValue.textContent = Math.round(this.midiClockManager.bpm);
        }
    }

    updateSyncModeDisplay() {
        const syncValue = document.getElementById('sync-value');
        const syncButtonText = document.getElementById('sync-button-text');
        
        if (syncValue) {
            syncValue.textContent = this.midiClockManager.syncMode;
        }
        if (syncButtonText) {
            syncButtonText.textContent = this.midiClockManager.syncMode;
        }
    }

    // Public method to update all displays
    updateAllDisplays() {
        this.updateTransportDisplay();
        this.updateClockDisplay();
        this.updateBPMDisplay();
        this.updateSyncModeDisplay();
    }

    // Method to get the transport bar element (for external access if needed)
    getTransportBar() {
        return this.transportBar;
    }
}
