/**
 * SphereLayer.js - Dedicated Refractive Spheres Layer
 * This layer handles only refractive spheres in a grid layout, separate from other shapes.
 * Enables independent control over sphere materials, positioning, and effects.
 */

import { LayerBase } from './LayerBase.js';
import * as THREE from 'three';
import { ANIMATION_CONSTANTS } from '../../config/AnimationConstants.js';

export class SphereLayer extends LayerBase {
    constructor(id, config = {}) {
        super(id, config);
        
        // Sphere grid properties
        this.spheres = [];
        this.gridWidth = config.gridWidth || 10;
        this.gridHeight = config.gridHeight || 6;
        this.cellSize = config.cellSize || 1.0;
        this.sphereScale = config.sphereScale || 1.0;
        
        // Sphere material properties
        this.refraction = config.refraction || 1.67;
        this.transparency = config.transparency || 1.0;
        this.roughness = config.roughness || 0.04;
        this.metalness = config.metalness || 1.0;
        this.transmission = config.transmission || 1.0;
        this.clearcoat = config.clearcoat || 0.09;
        this.clearcoatRoughness = config.clearcoatRoughness || 0.05;
        this.envMapIntensity = config.envMapIntensity || 0.28;
        
        // Animation properties
        this.animationEnabled = config.animationEnabled || false;
        this.rotationSpeed = config.rotationSpeed || 0.5;
        this.floatAmplitude = config.floatAmplitude || 0.1;
        this.floatSpeed = config.floatSpeed || 1.0;
        
        // Wave animation properties
        this.waveAnimationEnabled = config.waveAnimationEnabled || false;
        this.zWaveAmplitude = config.zWaveAmplitude || 5.0; // Much larger default amplitude for visibility
        this.zWaveSpeed = config.zWaveSpeed || ANIMATION_CONSTANTS.waveSpeed.default;
        this.zWaveFrequency = config.zWaveFrequency || 1.0;
        this.zWaveDirection = config.zWaveDirection || 'horizontal'; // 'horizontal', 'vertical', 'radial'
        this.zWavePhase = config.zWavePhase || 0.0;
        
        // Scene and material references
        this.scene = null;
        this.materialManager = null;
        this.state = null;
        
        // Animation state
        this.animationTime = 0;
    }

    async onInitialize(context) {
        this.scene = context.scene;
        this.state = context.state;
        
        // Get material manager from app
        if (context.app && context.app.scene && context.app.scene.materialManager) {
            this.materialManager = context.app.scene.materialManager;
        } else {
            throw new Error('MaterialManager not available in context');
        }
        
        // Initialize sphere parameters from state
        this.gridWidth = this.state.get('sphereGridWidth') || this.gridWidth;
        this.gridHeight = this.state.get('sphereGridHeight') || this.gridHeight;
        this.cellSize = this.state.get('sphereCellSize') || this.cellSize;
        this.sphereScale = this.state.get('sphereScale') || this.sphereScale;
        
        // Initialize material parameters from state
        this.refraction = this.state.get('sphereRefraction') || this.refraction;
        this.transparency = this.state.get('sphereTransparency') || this.transparency;
        this.roughness = this.state.get('sphereRoughness') || this.roughness;
        this.metalness = this.state.get('sphereMetalness') || this.metalness;
        this.transmission = this.state.get('sphereTransmission') || this.transmission;
        this.clearcoat = this.state.get('sphereClearcoat') || this.clearcoat;
        this.clearcoatRoughness = this.state.get('sphereClearcoatRoughness') || this.clearcoatRoughness;
        this.envMapIntensity = this.state.get('sphereEnvMapIntensity') || this.envMapIntensity;
        
        // Initialize animation parameters from state
        this.animationEnabled = this.state.get('sphereAnimationEnabled') || this.animationEnabled;
        this.rotationSpeed = this.state.get('sphereRotationSpeed') || this.rotationSpeed;
        this.floatAmplitude = this.state.get('sphereFloatAmplitude') || this.floatAmplitude;
        this.floatSpeed = this.state.get('sphereFloatSpeed') || this.floatSpeed;
        
        // Initialize wave animation parameters from state
        this.waveAnimationEnabled = this.state.get('sphereWaveAnimationEnabled') || this.waveAnimationEnabled;
        this.zWaveAmplitude = this.state.get('sphereZWaveAmplitude') || this.zWaveAmplitude;
        this.zWaveSpeed = this.state.get('sphereZWaveSpeed') || this.zWaveSpeed;
        this.zWaveFrequency = this.state.get('sphereZWaveFrequency') || this.zWaveFrequency;
        this.zWaveDirection = this.state.get('sphereZWaveDirection') || this.zWaveDirection;
        this.zWavePhase = this.state.get('sphereZWavePhase') || this.zWavePhase;
        
        // Initialize z-offset from state
        this.zOffset = this.state.get('sphereLayerZOffset') || 0;
        
        // Set animation flags so the layer gets updated
        this.isAnimated = true;
        this.needsUpdate = true;
        
        this.createSphereGrid();
    }

    onUpdate(deltaTime) {
        // Handle undefined deltaTime gracefully
        const safeDeltaTime = deltaTime || 0.016; // Default to 60 FPS if undefined
        
        // Debug: log when update is called
        if (this.animationTime % 60 === 0) {
            console.log('SphereLayer onUpdate called:', {
                deltaTime: safeDeltaTime.toFixed(3),
                animationTime: this.animationTime.toFixed(3),
                isAnimated: this.isAnimated,
                needsUpdate: this.needsUpdate
            });
        }
        
        this.animationTime += safeDeltaTime;
        
        if (this.animationEnabled) {
            this.updateSphereAnimations();
        }
        
        if (this.waveAnimationEnabled) {
            this.updateWaveAnimations();
            // Debug: log when wave animation is running
            if (this.animationTime % 60 === 0) {
                console.log('Wave animation is RUNNING. Current state:', {
                    waveAnimationEnabled: this.waveAnimationEnabled,
                    zWaveAmplitude: this.zWaveAmplitude,
                    zWaveSpeed: this.zWaveSpeed,
                    animationTime: this.animationTime
                });
            }
        } else {
            // Debug: log when wave animation is disabled
            if (this.animationTime % 120 === 0) {
                console.log('Wave animation is DISABLED. Current state:', {
                    waveAnimationEnabled: this.waveAnimationEnabled,
                    zWaveAmplitude: this.zWaveAmplitude,
                    zWaveSpeed: this.zWaveSpeed
                });
            }
        }
        
        // Debug: log animation state every 120 frames
        if (this.animationTime % 120 === 0) {
            console.log('SphereLayer Animation State:', {
                animationEnabled: this.animationEnabled,
                waveAnimationEnabled: this.waveAnimationEnabled,
                animationTime: this.animationTime,
                sphereCount: this.spheres.length
            });
        }
    }

    /**
     * Render the sphere layer
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     * @param {number} deltaTime - Time since last frame
     */
    onRender2D(renderer, camera, deltaTime) {
        // Spheres are 3D objects already in the scene, so this is a no-op
        // The spheres will be rendered automatically by Three.js
    }

    createSphereGrid() {
        this.clearSpheres();
        
        const halfGridW = this.gridWidth / 2;
        const halfGridH = this.gridHeight / 2;
        
        // Get sphere material
        const material = this.materialManager.getSphereMaterial(this.state);
        
        console.log('Creating sphere grid with zOffset:', this.zOffset);
        
        // Create spheres in grid pattern
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                // Create sphere geometry
                const geometry = new THREE.SphereGeometry(0.5, 32, 32);
                const sphere = new THREE.Mesh(geometry, material);
                
                // Position sphere in grid
                sphere.position.x = (x - halfGridW + 0.5) * this.cellSize;
                sphere.position.y = (y - halfGridH + 0.5) * this.cellSize;
                sphere.position.z = this.zOffset || 0;
                
                // Apply sphere scale (independent of cell size)
                const scale = this.sphereScale;
                sphere.scale.set(scale, scale, scale);
                
                // Enable shadows
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                
                // Store animation data
                sphere.userData.originalY = sphere.position.y;
                sphere.userData.originalZ = sphere.position.z; // Store original Z for debugging
                sphere.userData.gridX = x;
                sphere.userData.gridY = y;
                
                // Add to scene and tracking array
                this.scene.add(sphere);
                this.spheres.push(sphere);
            }
        }
        
        console.log(`Created ${this.spheres.length} spheres with initial z-positions around ${this.zOffset}`);
    }

    updateSphereAnimations() {
        this.spheres.forEach((sphere, index) => {
            if (!sphere.userData) return;
            
            // Rotation animation
            sphere.rotation.x += this.rotationSpeed * 0.01;
            sphere.rotation.y += this.rotationSpeed * 0.015;
            
            // Floating animation
            const floatOffset = Math.sin(this.animationTime * this.floatSpeed + index * 0.5) * this.floatAmplitude;
            sphere.position.y = sphere.userData.originalY + floatOffset;
        });
    }

    /**
     * Update wave-based z-space animations
     * Creates rippling wave effects that move through the sphere grid
     */
    updateWaveAnimations() {
        // Debug: log wave animation parameters
        if (this.animationTime % 60 === 0) { // Log every 60 frames
            console.log('Wave Animation:', {
                enabled: this.waveAnimationEnabled,
                amplitude: this.zWaveAmplitude,
                speed: this.zWaveSpeed,
                frequency: this.zWaveFrequency,
                direction: this.zWaveDirection,
                phase: this.zWavePhase,
                zOffset: this.zOffset,
                sphereCount: this.spheres.length
            });
        }
        
        this.spheres.forEach(sphere => {
            if (!sphere.userData) return;

            const gridX = sphere.userData.gridX;
            const gridY = sphere.userData.gridY;
            const halfGridW = this.gridWidth / 2;
            const halfGridH = this.gridHeight / 2;

            let waveOffset = 0;
            
            // Calculate wave offset based on direction
            if (this.zWaveDirection === 0 || this.zWaveDirection === 'horizontal') {
                // Horizontal wave: ripples move left to right across the grid
                waveOffset = Math.sin(
                    this.animationTime * this.zWaveSpeed + 
                    gridX * this.zWaveFrequency + 
                    this.zWavePhase
                ) * this.zWaveAmplitude;
            } else if (this.zWaveDirection === 1 || this.zWaveDirection === 'vertical') {
                // Vertical wave: ripples move top to bottom across the grid
                waveOffset = Math.sin(
                    this.animationTime * this.zWaveSpeed + 
                    gridY * this.zWaveFrequency + 
                    this.zWavePhase
                ) * this.zWaveAmplitude;
            } else if (this.zWaveDirection === 2 || this.zWaveDirection === 'radial') {
                // Radial wave: ripples emanate from the center outward
                const distance = Math.sqrt(
                    Math.pow(gridX - halfGridW, 2) + 
                    Math.pow(gridY - halfGridH, 2)
                );
                waveOffset = Math.sin(
                    this.animationTime * this.zWaveSpeed + 
                    distance * this.zWaveFrequency + 
                    this.zWavePhase
                ) * this.zWaveAmplitude;
            }

            // Apply wave offset to z-position
            const newZ = this.zOffset + waveOffset;
            sphere.position.z = newZ;
            
            // Debug: log z-position changes for first few spheres
            if (gridX < 3 && gridY < 3 && this.animationTime % 30 === 0) {
                console.log(`Sphere [${gridX},${gridY}] z-movement:`, {
                    originalZ: sphere.userData.originalZ,
                    baseZ: this.zOffset,
                    waveOffset: waveOffset,
                    newZ: newZ,
                    change: newZ - sphere.userData.originalZ
                });
            }
            
        });
        
        // Debug: log overall z-range every 60 frames
        if (this.animationTime % 60 === 0) {
            const zPositions = this.spheres.map(s => s.position.z);
            const minZ = Math.min(...zPositions);
            const maxZ = Math.max(...zPositions);
            const avgZ = zPositions.reduce((a, b) => a + b, 0) / zPositions.length;
            
            console.log('Sphere Z-Range:', {
                minZ: minZ.toFixed(3),
                maxZ: maxZ.toFixed(3),
                avgZ: avgZ.toFixed(3),
                range: (maxZ - minZ).toFixed(3),
                sphereCount: this.spheres.length
            });
        }
    }

    updateSphereMaterials() {
        const material = this.materialManager.getSphereMaterial(this.state);
        
        this.spheres.forEach(sphere => {
            sphere.material = material;
        });
    }

    updateSphereScaling() {
        const scale = this.sphereScale;
        
        console.log('Updating sphere scaling:', { scale, sphereCount: this.spheres.length });
        
        this.spheres.forEach(sphere => {
            sphere.scale.set(scale, scale, scale);
        });
    }

    setGridSize(width, height) {
        this.gridWidth = width;
        this.gridHeight = height;
        this.createSphereGrid();
    }

    setCellSize(cellSize) {
        this.cellSize = cellSize;
        this.createSphereGrid();
    }

    setSphereScale(scale) {
        this.sphereScale = scale;
        console.log('Sphere scale updated:', { scale, sphereCount: this.spheres.length });
        this.updateSphereScaling();
    }

    setAnimationEnabled(enabled) {
        this.animationEnabled = enabled;
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    setFloatAmplitude(amplitude) {
        this.floatAmplitude = amplitude;
    }

    setFloatSpeed(speed) {
        this.floatSpeed = speed;
    }

    setWaveAnimationEnabled(enabled) {
        this.waveAnimationEnabled = enabled;
    }

    setZWaveAmplitude(amplitude) {
        this.zWaveAmplitude = amplitude;
    }

    setZWaveSpeed(speed) {
        this.zWaveSpeed = speed;
    }

    setZWaveFrequency(frequency) {
        this.zWaveFrequency = frequency;
    }

    setZWaveDirection(direction) {
        this.zWaveDirection = direction;
    }

    setZWavePhase(phase) {
        this.zWavePhase = phase;
    }
    
    /**
     * Update all wave animation parameters at once without recreating the grid
     * @param {Object} params - Wave animation parameters
     */
    updateWaveAnimationParameters(params) {
        if (params.waveEnabled !== undefined) this.waveAnimationEnabled = params.waveEnabled;
        if (params.amplitude !== undefined) this.zWaveAmplitude = params.amplitude;
        if (params.speed !== undefined) this.zWaveSpeed = params.speed;
        if (params.frequency !== undefined) this.zWaveFrequency = params.frequency;
        if (params.direction !== undefined) this.zWaveDirection = params.direction;
        if (params.phase !== undefined) this.zWavePhase = params.phase;
        
        // Update animation flags based on whether any animation is enabled
        this.isAnimated = this.animationEnabled || this.waveAnimationEnabled;
        this.needsUpdate = this.isAnimated;
        
        console.log('Wave animation parameters updated:', {
            waveEnabled: this.waveAnimationEnabled,
            amplitude: this.zWaveAmplitude,
            speed: this.zWaveSpeed,
            frequency: this.zWaveFrequency,
            direction: this.zWaveDirection,
            phase: this.zWavePhase,
            isAnimated: this.isAnimated,
            needsUpdate: this.needsUpdate
        });
    }

    clearSpheres() {
        this.spheres.forEach(sphere => {
            this.scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
        });
        this.spheres = [];
    }

    /**
     * Set z-offset value
     * @param {number} zOffset - New z-offset value
     */
    setZOffset(zOffset) {
        super.setZOffset(zOffset);
        
        // Update all spheres z-position
        this.spheres.forEach(sphere => {
            if (sphere && sphere.position) {
                sphere.position.z = zOffset;
            }
        });
    }

    /**
     * Get sphere grid info
     * @returns {Object} Sphere grid information
     */
    getSphereGridInfo() {
        return {
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            cellSize: this.cellSize,
            sphereScale: this.sphereScale,
            sphereCount: this.spheres.length,
            animationEnabled: this.animationEnabled,
            waveAnimationEnabled: this.waveAnimationEnabled,
            zWaveAmplitude: this.zWaveAmplitude,
            zWaveSpeed: this.zWaveSpeed,
            zWaveFrequency: this.zWaveFrequency,
            zWaveDirection: this.zWaveDirection
        };
    }

    destroy() {
        this.clearSpheres();
        this.scene = null;
        this.materialManager = null;
        this.state = null;
    }
}
