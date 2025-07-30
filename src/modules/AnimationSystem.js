/**
 * AnimationSystem.js - Advanced Animation Logic and Effects
 * This module provides sophisticated animation capabilities including shape cycling, movement patterns,
 * rotation effects, scaling animations, and complex animation sequences. It handles animation timing,
 * easing functions, and coordinates with the main animation loop to create smooth, performant
 * visual effects and transitions.
 */

import { gsap } from 'gsap';

export class AnimationSystem {
    constructor() {
        this.activeAnimations = new Map(); // mesh -> animation timeline
        this.animationDefaults = {
            duration: 2,
            ease: "power2.inOut",
            repeat: -1, // Infinite repeat
            yoyo: true // Reverse animation
        };
    }

    // Animate shape movement
    animateMovement(mesh, x, y, cellSize, amplitude, frequency) {
        const gridWidth = 8; // Get from state later
        const gridHeight = 8;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        const baseX = (x - halfGridW + 0.5) * cellSize;
        const baseY = (y - halfGridH + 0.5) * cellSize;
        
        // Kill existing animation
        this.killAnimation(mesh);
        
        // Create new animation timeline
        const timeline = gsap.timeline({
            repeat: -1,
            yoyo: true
        });
        
        // Animate position with sine wave
        timeline.to(mesh.position, {
            x: baseX + Math.sin(x * 0.5) * amplitude * cellSize,
            y: baseY + Math.cos(y * 0.5) * amplitude * cellSize,
            duration: 2 / frequency,
            ease: "sine.inOut"
        });
        
        this.activeAnimations.set(mesh, timeline);
    }

    // Animate shape rotation
    animateRotation(mesh, x, y, amplitude, frequency) {
        // Kill existing animation
        this.killAnimation(mesh);
        
        // Create new animation timeline
        const timeline = gsap.timeline({
            repeat: -1,
            yoyo: true
        });
        
        // Animate rotation
        timeline.to(mesh.rotation, {
            z: Math.sin(x * 0.3 + y * 0.3) * amplitude,
            duration: 2 / frequency,
            ease: "sine.inOut"
        });
        
        this.activeAnimations.set(mesh, timeline);
    }

    // Animate shape scaling
    animateScale(mesh, x, y, cellSize, amplitude, frequency, isSphere = false, sphereScale = 1) {
        // Kill existing animation
        this.killAnimation(mesh);
        
        // Create new animation timeline
        const timeline = gsap.timeline({
            repeat: -1,
            yoyo: true
        });
        
        // Calculate base scale
        const baseScale = isSphere ? cellSize * sphereScale : cellSize;
        const maxScale = baseScale * (1 + amplitude);
        const minScale = baseScale * (1 - amplitude);
        
        // Animate scale
        timeline.to(mesh.scale, {
            x: maxScale,
            y: maxScale,
            z: isSphere ? maxScale : 1,
            duration: 2 / frequency,
            ease: "sine.inOut"
        });
        
        this.activeAnimations.set(mesh, timeline);
    }

    // Animate combined effects
    animateCombined(mesh, x, y, cellSize, movementAmp, rotationAmp, scaleAmp, frequency) {
        // Kill existing animation
        this.killAnimation(mesh);
        
        // Create new animation timeline
        const timeline = gsap.timeline({
            repeat: -1,
            yoyo: true
        });
        
        const baseX = (x - 4 + 0.5) * cellSize;
        const baseY = (y - 4 + 0.5) * cellSize;
        const isSphere = mesh.geometry && mesh.geometry.type === 'SphereGeometry';
        const baseScale = isSphere ? cellSize * 1.5 : cellSize; // Assuming sphereScale = 1.5
        
        // Combined animation
        timeline.to(mesh.position, {
            x: baseX + Math.sin(x * 0.5) * movementAmp * cellSize,
            y: baseY + Math.cos(y * 0.5) * movementAmp * cellSize,
            duration: 2 / frequency,
            ease: "sine.inOut"
        }, 0);
        
        timeline.to(mesh.rotation, {
            z: Math.sin(x * 0.3 + y * 0.3) * rotationAmp,
            duration: 2 / frequency,
            ease: "sine.inOut"
        }, 0);
        
        timeline.to(mesh.scale, {
            x: baseScale * (1 + scaleAmp),
            y: baseScale * (1 + scaleAmp),
            z: isSphere ? baseScale * (1 + scaleAmp) : 1,
            duration: 2 / frequency,
            ease: "sine.inOut"
        }, 0);
        
        this.activeAnimations.set(mesh, timeline);
    }

    // Reset shape to original position
    resetShape(mesh, x, y, cellSize, isSphere = false, sphereScale = 1) {
        // Kill existing animation
        this.killAnimation(mesh);
        
        // Reset position and scale
        gsap.set(mesh.position, {
            x: (x - 4 + 0.5) * cellSize,
            y: (y - 4 + 0.5) * cellSize
        });
        
        gsap.set(mesh.rotation, { z: 0 });
        
        const baseScale = isSphere ? cellSize * sphereScale : cellSize;
        gsap.set(mesh.scale, {
            x: baseScale,
            y: baseScale,
            z: isSphere ? baseScale : 1
        });
    }

    // Kill animation for a specific mesh
    killAnimation(mesh) {
        const timeline = this.activeAnimations.get(mesh);
        if (timeline) {
            timeline.kill();
            this.activeAnimations.delete(mesh);
        }
    }

    // Kill all animations
    killAllAnimations() {
        for (const [mesh, timeline] of this.activeAnimations) {
            timeline.kill();
        }
        this.activeAnimations.clear();
    }

    // Get animation statistics
    getAnimationStats() {
        return {
            activeAnimations: this.activeAnimations.size,
            totalAnimations: this.activeAnimations.size
        };
    }

    // Update animation parameters for all active animations
    updateAnimationParameters(movementAmp, rotationAmp, scaleAmp, frequency) {
        // This would require recreating animations with new parameters
        // For now, we'll let existing animations continue and new ones will use updated params
        this.animationDefaults = {
            ...this.animationDefaults,
            duration: 2 / frequency
        };
    }
} 