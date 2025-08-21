/**
 * GridLinesLayer.js - Dedicated Grid Lines Layer
 * This layer handles only the grid lines visualization, separate from shapes.
 * Enables independent control, displacement effects, and advanced grid line animations.
 */

import { LayerBase } from './LayerBase.js';
import * as THREE from 'three';

export class GridLinesLayer extends LayerBase {
    constructor(id, config = {}) {
        super(id, config);
        
        // Grid lines specific properties
        this.gridLines = [];
        this.gridColor = config.gridColor || '#ff0000';
        this.lineThickness = config.lineThickness || 1;
        this.gridWidth = config.gridWidth || 19;
        this.gridHeight = config.gridHeight || 6;
        this.cellSize = config.cellSize || 0.76;
        
        // Displacement and animation properties
        this.displacementEnabled = config.displacementEnabled || false;
        this.displacementAmount = config.displacementAmount || 0.1;
        this.displacementSpeed = config.displacementSpeed || 1.0;
        this.displacementType = config.displacementType || 'wave'; // 'wave', 'noise', 'spiral'
        
        // Animation state
        this.animationTime = 0;
        
        // Scene reference
        this.scene = null;
        
        // State reference for parameter updates
        this.state = null;
    }

    async onInitialize(context) {
        this.scene = context.scene;
        this.state = context.state;
        
        // Initialize grid parameters from state
        this.gridWidth = this.state.get('gridWidth') || this.gridWidth;
        this.gridHeight = this.state.get('gridHeight') || this.gridHeight;
        this.cellSize = this.state.get('cellSize') || this.cellSize;
        this.gridColor = this.state.get('gridLineColor') || this.state.get('gridColor') || this.gridColor;
        
        // Initialize displacement parameters from state
        this.displacementEnabled = this.state.get('gridLineDisplacementEnabled') || this.displacementEnabled;
        this.displacementAmount = this.state.get('gridLineDisplacementAmount') || this.displacementAmount;
        this.displacementSpeed = this.state.get('gridLineDisplacementSpeed') || this.displacementSpeed;
        this.displacementType = this.state.get('gridLineDisplacementType') || this.displacementType;
        
        this.createGridLines();
    }

    onUpdate(deltaTime) {
        this.animationTime += deltaTime * this.displacementSpeed;
        
        if (this.displacementEnabled) {
            this.updateDisplacement();
        }
    }

    /**
     * Render the grid lines layer
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     * @param {number} deltaTime - Time since last frame
     */
    onRender2D(renderer, camera, deltaTime) {
        // Grid lines are 3D objects already in the scene, so this is a no-op
        // The lines will be rendered automatically by Three.js
    }

    createGridLines() {
        this.clearGridLines();
        
        const halfGridW = this.gridWidth / 2;
        const halfGridH = this.gridHeight / 2;
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: this.gridColor,
            linewidth: this.lineThickness
        });
        
        // Create vertical lines
        for (let i = 0; i <= this.gridWidth; i++) {
            const x = (i - halfGridW) * this.cellSize;
            const points = [
                new THREE.Vector3(x, -halfGridH * this.cellSize, 0),
                new THREE.Vector3(x, halfGridH * this.cellSize, 0)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
            this.gridLines.push(line);
        }
        
        // Create horizontal lines
        for (let j = 0; j <= this.gridHeight; j++) {
            const y = (j - halfGridH) * this.cellSize;
            const points = [
                new THREE.Vector3(-halfGridW * this.cellSize, y, 0),
                new THREE.Vector3(halfGridW * this.cellSize, y, 0)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
            this.gridLines.push(line);
        }
    }

    updateDisplacement() {
        this.gridLines.forEach((line, index) => {
            const geometry = line.geometry;
            const positions = geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                
                let displacement = 0;
                
                switch (this.displacementType) {
                    case 'wave':
                        displacement = Math.sin(x * 2 + this.animationTime) * 
                                     Math.cos(y * 2 + this.animationTime) * 
                                     this.displacementAmount;
                        break;
                    case 'noise':
                        displacement = (Math.sin(x * 10 + this.animationTime) + 
                                      Math.cos(y * 10 + this.animationTime)) * 
                                      this.displacementAmount * 0.5;
                        break;
                    case 'spiral':
                        const distance = Math.sqrt(x * x + y * y);
                        const angle = Math.atan2(y, x);
                        displacement = Math.sin(distance * 2 + angle + this.animationTime) * 
                                     this.displacementAmount;
                        break;
                }
                
                positions[i + 2] = displacement; // Z-axis displacement
            }
            
            geometry.attributes.position.needsUpdate = true;
        });
    }

    updateGridParameters(width, height, cellSize) {
        this.gridWidth = width;
        this.gridHeight = height;
        this.cellSize = cellSize;
        this.createGridLines();
    }

    setGridColor(color) {
        this.gridColor = color;
        // Convert hex string to number for Three.js
        const hexColor = color.startsWith('#') ? parseInt(color.slice(1), 16) : color;
        this.gridLines.forEach(line => {
            line.material.color.setHex(hexColor);
        });
    }

    setLineThickness(thickness) {
        this.lineThickness = thickness;
        this.gridLines.forEach(line => {
            line.material.linewidth = thickness;
        });
    }

    setOpacity(opacity) {
        this.opacity = opacity;
        this.gridLines.forEach(line => {
            if (line.material) {
                line.material.opacity = opacity;
                line.material.transparent = opacity < 1.0;
            }
        });
    }

    setDisplacementEnabled(enabled) {
        this.displacementEnabled = enabled;
        if (!enabled) {
            // Reset displacement
            this.gridLines.forEach(line => {
                const geometry = line.geometry;
                const positions = geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 2] = 0; // Reset Z to 0
                }
                geometry.attributes.position.needsUpdate = true;
            });
        }
    }

    setDisplacementAmount(amount) {
        this.displacementAmount = amount;
    }

    setDisplacementSpeed(speed) {
        this.displacementSpeed = speed;
    }

    setDisplacementType(type) {
        this.displacementType = type;
    }

    clearGridLines() {
        this.gridLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.gridLines = [];
    }

    /**
     * Set z-offset value
     * @param {number} zOffset - New z-offset value
     */
    setZOffset(zOffset) {
        super.setZOffset(zOffset);
        
        // Update all grid lines z-position
        this.gridLines.forEach(line => {
            if (line && line.position) {
                line.position.z = zOffset;
            }
        });
    }

    destroy() {
        this.clearGridLines();
        this.scene = null;
        this.state = null;
    }
}
