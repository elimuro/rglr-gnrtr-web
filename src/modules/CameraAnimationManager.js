/**
 * CameraAnimationManager.js - MIDI-Controlled Camera Animations
 * This module provides MIDI-targetable camera animations that affect all layers simultaneously.
 * It integrates with the BPM timing system for musical synchronization and supports various
 * easing functions for smooth, professional camera movements.
 */

import { gsap } from 'gsap';
import { MUSICAL_CONSTANTS } from '../config/index.js';

export class CameraAnimationManager {
    constructor(app) {
        this.app = app;
        this.state = app.state;
        this.bpmTimingManager = null; // Will be set by MIDIClockManager
        
        // Animation state
        this.activeAnimations = new Map(); // parameter -> GSAP timeline
        this.animationTargets = {}; // Current animation target values
        
        // Manual control values (separate from animated values)
        this.manualValues = {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            distance: 10
        };
        
        // Animation parameters
        this.parameters = {
            // Rotation animations
            rotationXEnabled: false,
            rotationXAmplitude: Math.PI / 4, // 45 degrees
            rotationXDivision: 'quarter',
            rotationXEasing: 'power2.inOut',
            rotationXDirection: 1, // 1 or -1
            
            rotationYEnabled: false,
            rotationYAmplitude: Math.PI / 4,
            rotationYDivision: 'quarter',
            rotationYEasing: 'power2.inOut',
            rotationYDirection: 1,
            
            rotationZEnabled: false,
            rotationZAmplitude: Math.PI / 6, // 30 degrees
            rotationZDivision: 'quarter',
            rotationZEasing: 'power2.inOut',
            rotationZDirection: 1,
            
            // Orbital rotation (around origin)
            orbitalEnabled: false,
            orbitalAmplitude: Math.PI * 2, // Full rotation
            orbitalDivision: '2bars',
            orbitalEasing: 'power2.inOut',
            orbitalAxis: 'y', // 'x', 'y', 'z'
            orbitalDirection: 1,
            
            // Distance/zoom animations
            distanceEnabled: false,
            distanceAmplitude: 5, // Distance variation
            distanceCenter: 10, // Base distance
            distanceDivision: 'half',
            distanceEasing: 'power2.inOut',
            
            // Multi-axis complex rotation
            complexRotationEnabled: false,
            complexRotationDivision: '4bars',
            complexRotationEasing: 'power2.inOut',
            complexRotationIntensity: 0.5 // 0-1 scale
        };
        
        // Easing function mapping (compatible with GSAP)
        this.easingMap = {
            'power2.inOut': 'power2.inOut',
            'power2.in': 'power2.in',
            'power2.out': 'power2.out',
            'power3.inOut': 'power3.inOut',
            'power3.in': 'power3.in',
            'power3.out': 'power3.out',
            'back.inOut': 'back.inOut',
            'back.in': 'back.in',
            'back.out': 'back.out',
            'elastic.inOut': 'elastic.inOut',
            'elastic.in': 'elastic.in',
            'elastic.out': 'elastic.out',
            'bounce.inOut': 'bounce.inOut',
            'bounce.in': 'bounce.in',
            'bounce.out': 'bounce.out',
            'linear': 'none'
        };
        
        // Initialize animation targets
        this.resetAnimationTargets();
        
        // Bind methods
        this.update = this.update.bind(this);
    }
    
    /**
     * Initialize the camera animation manager
     */
    initialize() {
        // Get reference to BPM timing manager from MIDIClockManager
        if (this.app.midiClockManager && this.app.midiClockManager.bpmTimingManager) {
            this.bpmTimingManager = this.app.midiClockManager.bpmTimingManager;
        }
        
        // Initialize state parameters
        this.initializeStateParameters();
        
        console.log('CameraAnimationManager: Initialized');
    }
    
    /**
     * Initialize state parameters for camera animations
     */
    initializeStateParameters() {
        // Set default values in state if they don't exist
        Object.entries(this.parameters).forEach(([key, defaultValue]) => {
            const stateKey = `cameraAnim_${key}`;
            if (!this.state.has(stateKey)) {
                this.state.set(stateKey, defaultValue);
            }
        });
    }
    
    /**
     * Reset animation targets to current camera state
     */
    resetAnimationTargets() {
        // Initialize manual values from current state
        this.manualValues.rotationX = this.state.get('cameraRotationX') || 0;
        this.manualValues.rotationY = this.state.get('cameraRotationY') || 0;
        this.manualValues.rotationZ = this.state.get('cameraRotationZ') || 0;
        this.manualValues.distance = this.state.get('cameraDistance') || 10;
        
        // Set animation targets to manual values (no offset initially)
        this.animationTargets = {
            rotationX: this.manualValues.rotationX,
            rotationY: this.manualValues.rotationY,
            rotationZ: this.manualValues.rotationZ,
            distance: this.manualValues.distance
        };
        
        // Store base values for animation calculations
        this.baseValues = {
            rotationX: this.manualValues.rotationX,
            rotationY: this.manualValues.rotationY,
            rotationZ: this.manualValues.rotationZ,
            distance: this.manualValues.distance
        };
    }
    
    /**
     * Set a camera animation parameter
     * @param {string} paramName - Parameter name
     * @param {*} value - Parameter value
     */
    setParameter(paramName, value) {
        // Always update the parameter, even if it's not in the predefined list
        // This allows for dynamic parameter addition
        this.parameters[paramName] = value;
        const stateKey = `cameraAnim_${paramName}`;
        this.state.set(stateKey, value);
        
        // Determine which animation type this parameter affects
        let animationType = null;
        if (paramName.startsWith('rotationX')) {
            animationType = 'rotationX';
        } else if (paramName.startsWith('rotationY')) {
            animationType = 'rotationY';
        } else if (paramName.startsWith('rotationZ')) {
            animationType = 'rotationZ';
        } else if (paramName.startsWith('orbital')) {
            animationType = 'orbital';
        } else if (paramName.startsWith('distance')) {
            animationType = 'distance';
        } else if (paramName.startsWith('complexRotation')) {
            animationType = 'complexRotation';
        }
        
        // Restart animations if enabled parameters changed
        if (paramName.endsWith('Enabled')) {
            if (value && animationType) {
                this.startAnimation(animationType);
            } else if (!value && animationType) {
                this.stopAnimation(animationType);
            }
        }
        // Restart animations if timing/easing parameters changed and animation is active
        else if (animationType && (paramName.endsWith('Division') || paramName.endsWith('Easing') || 
                 paramName.endsWith('Amplitude') || paramName.endsWith('Direction') || 
                 paramName.endsWith('Intensity') || paramName.endsWith('Center') || 
                 paramName.endsWith('Axis'))) {
            const enabledKey = `${animationType}Enabled`;
            if (this.parameters[enabledKey]) {
                console.log(`CameraAnimationManager: Restarting ${animationType} animation due to ${paramName} change`);
                this.startAnimation(animationType);
            }
        }
    }
    
    /**
     * Get a camera animation parameter
     * @param {string} paramName - Parameter name
     * @returns {*} Parameter value
     */
    getParameter(paramName) {
        return this.parameters[paramName];
    }
    
    /**
     * Start a specific animation type
     * @param {string} animationType - Type of animation ('rotationX', 'rotationY', etc.)
     */
    startAnimation(animationType) {
        // Stop existing animation for this type
        this.stopAnimation(animationType);
        
        if (!this.bpmTimingManager) {
            console.warn('CameraAnimationManager: BPM timing manager not available');
            return;
        }
        
        const enabledKey = `${animationType}Enabled`;
        if (!this.parameters[enabledKey]) return;
        
        const division = this.parameters[`${animationType}Division`];
        const easing = this.parameters[`${animationType}Easing`];
        const amplitude = this.parameters[`${animationType}Amplitude`];
        const direction = this.parameters[`${animationType}Direction`] || 1;
        
        // Get animation duration from BPM timing
        const duration = this.bpmTimingManager.getTimeForDivision(division);
        
        console.log(`CameraAnimationManager: Starting ${animationType} animation - Division: ${division}, Duration: ${duration.toFixed(2)}s, BPM: ${this.bpmTimingManager.getBPM()}`);
        
        // Create GSAP timeline
        const timeline = gsap.timeline({ 
            repeat: -1, 
            ease: this.easingMap[easing] || 'power2.inOut'
        });
        
        // Configure animation based on type
        switch (animationType) {
            case 'rotationX':
                this.createRotationAnimation(timeline, 'rotationX', amplitude, direction, duration);
                break;
            case 'rotationY':
                this.createRotationAnimation(timeline, 'rotationY', amplitude, direction, duration);
                break;
            case 'rotationZ':
                this.createRotationAnimation(timeline, 'rotationZ', amplitude, direction, duration);
                break;
            case 'orbital':
                this.createOrbitalAnimation(timeline, duration);
                break;
            case 'distance':
                this.createDistanceAnimation(timeline, duration);
                break;
            case 'complexRotation':
                this.createComplexRotationAnimation(timeline, duration);
                break;
        }
        
        // Store the timeline
        this.activeAnimations.set(animationType, timeline);
        
        console.log(`CameraAnimationManager: Started ${animationType} animation (duration: ${duration.toFixed(2)}s)`);
    }
    
    /**
     * Stop a specific animation type
     * @param {string} animationType - Type of animation to stop
     */
    stopAnimation(animationType) {
        const timeline = this.activeAnimations.get(animationType);
        if (timeline) {
            timeline.kill();
            this.activeAnimations.delete(animationType);
            console.log(`CameraAnimationManager: Stopped ${animationType} animation`);
        }
    }
    
    /**
     * Create a rotation animation
     * @param {gsap.Timeline} timeline - GSAP timeline
     * @param {string} axis - Rotation axis ('rotationX', 'rotationY', 'rotationZ')
     * @param {number} amplitude - Animation amplitude in radians
     * @param {number} direction - Direction multiplier (1 or -1)
     * @param {number} duration - Animation duration in seconds
     */
    createRotationAnimation(timeline, axis, amplitude, direction, duration) {
        const baseValue = this.animationTargets[axis];
        const targetValue = baseValue + (amplitude * direction);
        
        timeline
            .to(this.animationTargets, {
                [axis]: targetValue,
                duration: duration / 2,
                ease: 'power2.out'
            })
            .to(this.animationTargets, {
                [axis]: baseValue - (amplitude * direction),
                duration: duration / 2,
                ease: 'power2.in'
            })
            .to(this.animationTargets, {
                [axis]: baseValue,
                duration: duration / 2,
                ease: 'power2.out'
            });
    }
    
    /**
     * Create an orbital rotation animation (camera orbits around origin)
     * @param {gsap.Timeline} timeline - GSAP timeline
     * @param {number} duration - Animation duration in seconds
     */
    createOrbitalAnimation(timeline, duration) {
        const axis = this.parameters.orbitalAxis;
        const amplitude = this.parameters.orbitalAmplitude;
        const direction = this.parameters.orbitalDirection;
        
        // Orbital rotation affects multiple axes depending on the orbital axis
        if (axis === 'y') {
            // Orbit around Y-axis (horizontal rotation)
            timeline.to(this.animationTargets, {
                rotationY: `+=${amplitude * direction}`,
                duration: duration,
                ease: 'none' // Linear for smooth orbital motion
            });
        } else if (axis === 'x') {
            // Orbit around X-axis (vertical rotation)
            timeline.to(this.animationTargets, {
                rotationX: `+=${amplitude * direction}`,
                duration: duration,
                ease: 'none'
            });
        } else if (axis === 'z') {
            // Orbit around Z-axis (roll rotation)
            timeline.to(this.animationTargets, {
                rotationZ: `+=${amplitude * direction}`,
                duration: duration,
                ease: 'none'
            });
        }
    }
    
    /**
     * Create a distance/zoom animation
     * @param {gsap.Timeline} timeline - GSAP timeline
     * @param {number} duration - Animation duration in seconds
     */
    createDistanceAnimation(timeline, duration) {
        const center = this.parameters.distanceCenter;
        const amplitude = this.parameters.distanceAmplitude;
        
        timeline
            .to(this.animationTargets, {
                distance: center + amplitude,
                duration: duration / 2,
                ease: 'power2.inOut'
            })
            .to(this.animationTargets, {
                distance: center - amplitude,
                duration: duration / 2,
                ease: 'power2.inOut'
            })
            .to(this.animationTargets, {
                distance: center,
                duration: duration / 2,
                ease: 'power2.inOut'
            });
    }
    
    /**
     * Create a complex multi-axis rotation animation
     * @param {gsap.Timeline} timeline - GSAP timeline
     * @param {number} duration - Animation duration in seconds
     */
    createComplexRotationAnimation(timeline, duration) {
        const intensity = this.parameters.complexRotationIntensity;
        const baseX = this.animationTargets.rotationX;
        const baseY = this.animationTargets.rotationY;
        const baseZ = this.animationTargets.rotationZ;
        
        // Create a complex figure-8 like motion
        timeline
            .to(this.animationTargets, {
                rotationX: baseX + (Math.PI / 4 * intensity),
                rotationY: baseY + (Math.PI / 6 * intensity),
                rotationZ: baseZ + (Math.PI / 8 * intensity),
                duration: duration / 4,
                ease: 'power2.inOut'
            })
            .to(this.animationTargets, {
                rotationX: baseX - (Math.PI / 6 * intensity),
                rotationY: baseY + (Math.PI / 4 * intensity),
                rotationZ: baseZ - (Math.PI / 6 * intensity),
                duration: duration / 4,
                ease: 'power2.inOut'
            })
            .to(this.animationTargets, {
                rotationX: baseX - (Math.PI / 4 * intensity),
                rotationY: baseY - (Math.PI / 6 * intensity),
                rotationZ: baseZ + (Math.PI / 4 * intensity),
                duration: duration / 4,
                ease: 'power2.inOut'
            })
            .to(this.animationTargets, {
                rotationX: baseX,
                rotationY: baseY,
                rotationZ: baseZ,
                duration: duration / 4,
                ease: 'power2.inOut'
            });
    }
    
    /**
     * Update manual camera values (called when GUI controls change)
     * @param {string} axis - Which axis to update ('rotationX', 'rotationY', 'rotationZ', 'distance')
     * @param {number} value - New manual value
     */
    updateManualValue(axis, value) {
        this.manualValues[axis] = value;
    }
    
    /**
     * Update camera animations (called from animation loop)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        let finalRotationX = this.manualValues.rotationX;
        let finalRotationY = this.manualValues.rotationY;
        let finalRotationZ = this.manualValues.rotationZ;
        let finalDistance = this.manualValues.distance;
        
        // Add animation offsets if animations are active
        if (this.activeAnimations.size > 0) {
            // Calculate animation offsets from base values
            const offsetX = this.animationTargets.rotationX - this.baseValues.rotationX;
            const offsetY = this.animationTargets.rotationY - this.baseValues.rotationY;
            const offsetZ = this.animationTargets.rotationZ - this.baseValues.rotationZ;
            const offsetDistance = this.animationTargets.distance - this.baseValues.distance;
            
            // Apply animation offsets to manual values
            finalRotationX += offsetX;
            finalRotationY += offsetY;
            finalRotationZ += offsetZ;
            finalDistance += offsetDistance;
        }
        
        // Update state with final values
        this.state.set('cameraRotationX', finalRotationX);
        this.state.set('cameraRotationY', finalRotationY);
        this.state.set('cameraRotationZ', finalRotationZ);
        this.state.set('cameraDistance', finalDistance);
        
        // Always trigger camera update
        if (this.app.scene && this.app.scene.updateCameraRotation) {
            this.app.scene.updateCameraRotation();
        }
    }
    
    /**
     * Handle BPM change - restart all active animations with new timing
     * @param {number} newBPM - New BPM value
     */
    onBPMChange(newBPM) {
        console.log(`CameraAnimationManager: BPM changed to ${newBPM}, restarting animations`);
        
        // Restart all active animations
        const activeTypes = Array.from(this.activeAnimations.keys());
        activeTypes.forEach(type => {
            if (this.parameters[`${type}Enabled`]) {
                this.startAnimation(type);
            }
        });
    }
    
    /**
     * Get all exposed parameters for MIDI mapping
     * @returns {Object} Parameter definitions
     */
    getExposedParameters() {
        return {
            // Rotation X
            'cameraAnim_rotationXEnabled': { min: 0, max: 1, step: 1, type: 'boolean' },
            'cameraAnim_rotationXAmplitude': { min: 0, max: Math.PI, step: 0.01, type: 'float' },
            'cameraAnim_rotationXDirection': { min: -1, max: 1, step: 2, type: 'integer' },
            
            // Rotation Y  
            'cameraAnim_rotationYEnabled': { min: 0, max: 1, step: 1, type: 'boolean' },
            'cameraAnim_rotationYAmplitude': { min: 0, max: Math.PI, step: 0.01, type: 'float' },
            'cameraAnim_rotationYDirection': { min: -1, max: 1, step: 2, type: 'integer' },
            
            // Rotation Z
            'cameraAnim_rotationZEnabled': { min: 0, max: 1, step: 1, type: 'boolean' },
            'cameraAnim_rotationZAmplitude': { min: 0, max: Math.PI / 2, step: 0.01, type: 'float' },
            'cameraAnim_rotationZDirection': { min: -1, max: 1, step: 2, type: 'integer' },
            
            // Orbital
            'cameraAnim_orbitalEnabled': { min: 0, max: 1, step: 1, type: 'boolean' },
            'cameraAnim_orbitalDirection': { min: -1, max: 1, step: 2, type: 'integer' },
            
            // Distance
            'cameraAnim_distanceEnabled': { min: 0, max: 1, step: 1, type: 'boolean' },
            'cameraAnim_distanceAmplitude': { min: 0, max: 20, step: 0.1, type: 'float' },
            'cameraAnim_distanceCenter': { min: 1, max: 50, step: 0.1, type: 'float' },
            
            // Complex rotation
            'cameraAnim_complexRotationEnabled': { min: 0, max: 1, step: 1, type: 'boolean' },
            'cameraAnim_complexRotationIntensity': { min: 0, max: 1, step: 0.01, type: 'float' }
        };
    }
    
    /**
     * Stop all animations
     */
    stopAllAnimations() {
        this.activeAnimations.forEach((timeline, type) => {
            timeline.kill();
        });
        this.activeAnimations.clear();
        console.log('CameraAnimationManager: Stopped all animations');
    }
    
    /**
     * Dispose of the camera animation manager
     */
    dispose() {
        this.stopAllAnimations();
        this.bpmTimingManager = null;
        this.app = null;
        this.state = null;
    }
}
