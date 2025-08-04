/**
 * AnimationLoop.js - Animation System Controller
 * This module manages the main animation loop and timing system for the application, handling frame
 * updates, animation timing, shape animations, and coordinating between the scene rendering and state
 * updates. It provides smooth 60fps animation with proper timing controls and performance monitoring.
 * Now includes MIDI clock synchronization for external timing sources.
 */

import * as THREE from 'three';

export class AnimationLoop {
    constructor(scene, state, midiClockManager = null) {
        this.scene = scene;
        this.state = state;
        this.midiClockManager = midiClockManager;
        this.clock = new THREE.Clock();
        this.animationTime = 0;
        this.pulseTime = 0;
        this.isRunning = false;
        this.animationId = null;
        
        // Clock sync properties
        this.lastClockTime = 0;
        this.clockDelta = 0;
        this.syncMode = 'auto'; // 'auto', 'manual', 'off'
        this.useExternalClock = false;
        
        // Manual FPS calculation
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Subscribe to animation state changes
        this.state.subscribe('enableShapeCycling', () => {
            if (!this.state.get('enableShapeCycling')) {
                this.animationTime = 0;
            }
        });
        
        this.state.subscribe('enableSizeAnimation', () => {
            if (!this.state.get('enableSizeAnimation')) {
                this.scene.updateCellSize();
            }
        });
    }

    setMIDIClockManager(midiClockManager) {
        this.midiClockManager = midiClockManager;
    }

    start() {
        if (this.isRunning) return;
        
        console.log('Starting animation loop...');
        this.isRunning = true;
        this.clock.start();
        this.animate();
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clock.stop();
    }

    getClockDelta() {
        // Determine timing source based on clock manager state
        if (this.midiClockManager) {
            const clockManager = this.midiClockManager;
            this.syncMode = clockManager.syncMode;
            
            // Check if we should use external clock
            if (this.syncMode === 'off') {
                this.useExternalClock = false;
            } else if (this.syncMode === 'auto') {
                this.useExternalClock = clockManager.isExternalClockActive();
            } else if (this.syncMode === 'manual') {
                this.useExternalClock = clockManager.isExternalClockActive() && clockManager.isPlaying;
            }
            
            if (this.useExternalClock && clockManager.isExternalClockActive()) {
                // Use MIDI clock timing
                const currentClockTime = clockManager.getClockTime();
                this.clockDelta = currentClockTime - this.lastClockTime;
                this.lastClockTime = currentClockTime;
                
                // Convert from quarter notes to seconds based on BPM
                const bpm = clockManager.getBPM();
                const secondsPerQuarter = 60 / bpm;
                const deltaSeconds = this.clockDelta * secondsPerQuarter;
                
                // Debug logging (only occasionally to avoid spam)
                if (Math.random() < 0.001) { // 0.1% chance per frame
                    console.log(`Clock Sync: External clock active, BPM: ${bpm.toFixed(1)}, Delta: ${deltaSeconds.toFixed(4)}s`);
                }
                
                return deltaSeconds;
            } else {
                // Fallback to internal timing
                this.useExternalClock = false;
                this.lastClockTime = 0;
                const internalDelta = this.clock.getDelta();
                
                // Debug logging (only occasionally)
                if (Math.random() < 0.001) {
                    console.log(`Clock Sync: Using internal timing, Delta: ${internalDelta.toFixed(4)}s`);
                }
                
                return internalDelta;
            }
        } else {
            // No clock manager available, use internal timing
            this.useExternalClock = false;
            return this.clock.getDelta();
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update FPS calculation
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastFpsUpdate >= 1000) { // Update FPS every second
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
        
        // Get clock-aware delta time
        const deltaTime = this.getClockDelta();
        
        // Update animation time
        if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation') || this.state.get('centerScalingEnabled')) {
            this.animationTime += deltaTime * this.state.get('animationSpeed');
            
            // Apply animations to shapes
            this.scene.animateShapes(this.animationTime, this.state.get('animationSpeed'));
        }
        
        // Update post-processing grain time
        if (this.scene.postProcessingManager) {
            this.scene.postProcessingManager.updateGrainTime(this.animationTime);
        }
        
        // Note: Water distortion is now handled through material properties
        
        // Render the scene
        this.scene.render();
    }

    resetAnimationTime() {
        this.animationTime = 0;
        this.pulseTime = 0;
        this.lastClockTime = 0;
    }

    getAnimationTime() {
        return this.animationTime;
    }

    getPulseTime() {
        return this.pulseTime;
    }

    isAnimating() {
        return this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation');
    }

    getFPS() {
        // Use manual FPS calculation instead of Three.js clock
        return this.currentFps;
    }

    getDelta() {
        return this.getClockDelta();
    }

    getElapsedTime() {
        return this.clock.getElapsedTime();
    }

    // New methods for clock sync
    isUsingExternalClock() {
        return this.useExternalClock;
    }

    getSyncMode() {
        return this.syncMode;
    }

    getClockStatus() {
        if (!this.midiClockManager) {
            return 'no-clock-manager';
        }
        
        if (this.useExternalClock) {
            return 'external-clock';
        } else if (this.midiClockManager.isPlaying) {
            return 'internal-clock';
        } else {
            return 'stopped';
        }
    }
} 