/**
 * AnimationLoop.js - Animation System Controller
 * This module manages the main animation loop and timing system for the application, handling frame
 * updates, animation timing, shape animations, and coordinating between the scene rendering and state
 * updates. It provides smooth 60fps animation with proper timing controls and performance monitoring.
 */

import * as THREE from 'three';

export class AnimationLoop {
    constructor(scene, state) {
        this.scene = scene;
        this.state = state;
        this.clock = new THREE.Clock();
        this.animationTime = 0;
        this.pulseTime = 0;
        this.isRunning = false;
        this.animationId = null;
        
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
        
        // Update animation time based on sync source
        if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
            const syncSource = this.state.get('syncSource');
            const transportMode = this.state.get('transportMode');
            
            if (syncSource === 'midi' && this.scene.app.transportController && transportMode === 'playing') {
                // Use MIDI clock timing
                const midiAnimationTime = this.scene.app.transportController.getAnimationTime();
                this.animationTime = midiAnimationTime * this.state.get('animationSpeed');
            } else if (syncSource === 'internal' && this.scene.app.transportController && transportMode === 'playing') {
                // Use internal transport timing
                const internalAnimationTime = this.scene.app.transportController.getAnimationTime();
                this.animationTime = internalAnimationTime * this.state.get('animationSpeed');
            } else if (syncSource === 'internal' && transportMode === 'stopped') {
                // Use traditional Three.js clock when not using transport
                this.animationTime += this.clock.getDelta() * this.state.get('animationSpeed');
            }
            
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
        return this.clock.getDelta();
    }

    getElapsedTime() {
        return this.clock.getElapsedTime();
    }
} 