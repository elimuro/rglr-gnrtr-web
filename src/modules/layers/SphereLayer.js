/**
 * SphereLayer.js - Dedicated Refractive Spheres Layer
 * This layer handles only refractive spheres in a grid layout, separate from other shapes.
 * Enables independent control over sphere materials, positioning, and effects.
 */

import { LayerBase } from './LayerBase.js';
import * as THREE from 'three';

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
        
        this.createSphereGrid();
    }

    onUpdate(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.animationEnabled) {
            this.updateSphereAnimations();
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
                
                // Apply sphere scale
                const scale = this.cellSize * this.sphereScale;
                sphere.scale.set(scale, scale, scale);
                
                // Enable shadows
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                
                // Store animation data
                sphere.userData.originalY = sphere.position.y;
                sphere.userData.gridX = x;
                sphere.userData.gridY = y;
                
                // Add to scene and tracking array
                this.scene.add(sphere);
                this.spheres.push(sphere);
            }
        }
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

    updateSphereMaterials() {
        const material = this.materialManager.getSphereMaterial(this.state);
        
        this.spheres.forEach(sphere => {
            sphere.material = material;
        });
    }

    updateSphereScaling() {
        const scale = this.cellSize * this.sphereScale;
        
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
            animationEnabled: this.animationEnabled
        };
    }

    destroy() {
        this.clearSpheres();
        this.scene = null;
        this.materialManager = null;
        this.state = null;
    }
}
