/**
 * GridManager.js - Grid Creation and Management
 * This module handles all grid-related functionality including grid creation, 
 * composition generation, grid line visualization, and cell size updates.
 * Extracted from Scene.js to improve modularity and separation of concerns.
 */

import * as THREE from 'three';

export class GridManager {
    constructor(state, shapeGenerator, materialManager, objectPool, shapeAnimationManager) {
        this.state = state;
        this.shapeGenerator = shapeGenerator;
        this.materialManager = materialManager;
        this.objectPool = objectPool;
        this.shapeAnimationManager = shapeAnimationManager;
        
        // Grid state
        this.shapes = [];
        this.composition = [];
        
        // Scene reference will be set by Scene.js
        this.scene = null;
    }

    /**
     * Set the Three.js scene reference
     * @param {THREE.Scene} scene - The Three.js scene
     */
    setScene(scene) {
        this.scene = scene;
    }

    /**
     * Create the entire grid including composition and shapes
     */
    createGrid() {
        // Return old shapes to pool
        this.clearExistingShapes();
        
        // Create the composition first
        this.generateComposition();

        // Now create the display grid
        this.createDisplayGrid();
        
        // Update cell size to ensure positions/scales are correct
        this.updateCellSize();
    }

    /**
     * Clear existing shapes and return them to the object pool
     */
    clearExistingShapes() {
        for (const mesh of this.shapes) {
            if (mesh && mesh.userData && mesh.userData.shapeName) {
                this.objectPool.returnMesh(mesh.userData.shapeName, mesh);
            }
        }
        this.shapes = [];
    }



    /**
     * Generate the composition pattern that determines shape placement
     */
    generateComposition() {
        this.composition = [];
        const compositionWidth = this.state.get('compositionWidth');
        const compositionHeight = this.state.get('compositionHeight');
        const enabledShapes = this.state.get('enabledShapes');
        const randomness = this.state.get('randomness');

        for (let x = 0; x < compositionWidth; x++) {
            for (let y = 0; y < compositionHeight; y++) {
                let shapeName;
                const availableShapes = this.shapeGenerator.getAvailableShapes(enabledShapes);
                
                if (availableShapes.length === 0) {
                    shapeName = 'Rect'; // Default shape
                } else {
                    const useRandomShape = Math.random() < randomness;
                    shapeName = useRandomShape ? 
                        availableShapes[Math.floor(Math.random() * availableShapes.length)] :
                        availableShapes[0];
                }
                this.composition.push(shapeName);
            }
        }
    }

    /**
     * Create the display grid with shapes
     */
    createDisplayGrid() {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        const compositionWidth = this.state.get('compositionWidth');
        const compositionHeight = this.state.get('compositionHeight');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;

        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                // Map display coordinates to composition coordinates
                const compX = Math.floor((x / gridWidth) * compositionWidth);
                const compY = Math.floor((y / gridHeight) * compositionHeight);
                const shapeIndex = compY * compositionWidth + compX;
                const shapeName = this.composition[shapeIndex] || 'Rect';

                // Create mesh for this grid cell
                const mesh = this.createShapeMesh(shapeName, cellSize);
                
                if (mesh) {
                    // Position the shape
                    mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                    mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                    
                    // Apply initial scaling
                    this.applyInitialScaling(mesh, shapeName, x, y, gridWidth, gridHeight, cellSize);

                    if (this.scene) {
                        this.scene.add(mesh);
                    }
                    this.shapes.push(mesh);
                }
            }
        }
    }

    /**
     * Create a shape mesh for a grid cell
     * @param {string} shapeName - Name of the shape to create
     * @param {number} cellSize - Size of the grid cell
     * @returns {THREE.Mesh|null} The created mesh
     */
    createShapeMesh(shapeName, cellSize) {
        // Get appropriate material
        let material;
        if (shapeName.startsWith('sphere_')) {
            material = this.materialManager.getSphereMaterial(this.state);
        } else {
            material = this.materialManager.getBasicMaterial(this.state.get('shapeColor'));
        }
        
        // Get mesh from pool or create new one
        const mesh = this.objectPool.getMesh(shapeName, material);
        
        if (mesh) {
            // Get geometry from pool or create new one
            const geometry = this.objectPool.getGeometry(shapeName, this.shapeGenerator);
            if (geometry) {
                mesh.geometry = geometry;
                
                // Store shape name for pooling
                mesh.userData.shapeName = shapeName;
                
                // Enable shadows for spheres
                if (shapeName.startsWith('sphere_')) {
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    // Apply sphere scale
                    const sphereScale = cellSize * this.state.get('sphereScale');
                    mesh.scale.set(sphereScale, sphereScale, sphereScale);
                }
                
                return mesh;
            }
        }
        
        return null;
    }

    /**
     * Apply initial scaling to a shape mesh
     * @param {THREE.Mesh} mesh - The mesh to scale
     * @param {string} shapeName - Name of the shape
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} gridWidth - Grid width
     * @param {number} gridHeight - Grid height
     * @param {number} cellSize - Cell size
     */
    applyInitialScaling(mesh, shapeName, x, y, gridWidth, gridHeight, cellSize) {
        // Calculate center scaling factor
        const centerScalingFactor = this.shapeAnimationManager.calculateCenterScaling(
            x, y, gridWidth, gridHeight, cellSize
        );
        
        // Scale the shape with center scaling applied
        if (shapeName.startsWith('sphere_')) {
            // Apply sphere scale factor for spheres
            const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
            mesh.scale.set(sphereScale, sphereScale, sphereScale);
        } else {
            const baseScale = cellSize * centerScalingFactor;
            mesh.scale.set(baseScale, baseScale, 1);
        }
    }







    /**
     * Update cell size and reposition/rescale all shapes
     */
    updateCellSize() {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        // Update shape positions and scales
        let i = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[i];
                if (mesh) {
                    // Update position
                    mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                    mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                    
                    // Update scaling
                    this.updateMeshScaling(mesh, x, y, gridWidth, gridHeight, cellSize);
                }
                i++;
            }
        }
    }

    /**
     * Update scaling for a specific mesh
     * @param {THREE.Mesh} mesh - The mesh to update
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} gridWidth - Grid width
     * @param {number} gridHeight - Grid height
     * @param {number} cellSize - Cell size
     */
    updateMeshScaling(mesh, x, y, gridWidth, gridHeight, cellSize) {
        // Calculate center scaling factor
        const centerScalingFactor = this.shapeAnimationManager.calculateCenterScaling(
            x, y, gridWidth, gridHeight, cellSize
        );
        
        if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
            const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
            mesh.scale.set(sphereScale, sphereScale, sphereScale);
        } else {
            const baseScale = cellSize * centerScalingFactor;
            mesh.scale.set(baseScale, baseScale, 1);
        }
    }

    /**
     * Get the current grid dimensions
     * @returns {Object} Grid dimensions object
     */
    getGridDimensions() {
        return {
            gridWidth: this.state.get('gridWidth'),
            gridHeight: this.state.get('gridHeight'),
            cellSize: this.state.get('cellSize'),
            compositionWidth: this.state.get('compositionWidth'),
            compositionHeight: this.state.get('compositionHeight')
        };
    }

    /**
     * Get grid position for world coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Grid position {x, y}
     */
    getGridPosition(worldX, worldY) {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        const gridX = Math.floor((worldX / cellSize) + halfGridW);
        const gridY = Math.floor((worldY / cellSize) + halfGridH);
        
        return {
            x: Math.max(0, Math.min(gridWidth - 1, gridX)),
            y: Math.max(0, Math.min(gridHeight - 1, gridY))
        };
    }

    /**
     * Get world position for grid coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} World position {x, y}
     */
    getWorldPosition(gridX, gridY) {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        return {
            x: (gridX - halfGridW + 0.5) * cellSize,
            y: (gridY - halfGridH + 0.5) * cellSize
        };
    }

    /**
     * Get shape at specific grid position
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {THREE.Mesh|null} The mesh at that position
     */
    getShapeAtPosition(gridX, gridY) {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        
        if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight) {
            return null;
        }
        
        const index = gridY * gridWidth + gridX;
        return this.shapes[index] || null;
    }

    /**
     * Get all shapes in the grid
     * @returns {THREE.Mesh[]} Array of all shape meshes
     */
    getAllShapes() {
        return [...this.shapes];
    }



    /**
     * Get the current composition pattern
     * @returns {string[]} Array of shape names in composition order
     */
    getComposition() {
        return [...this.composition];
    }

    /**
     * Update a specific shape in the grid
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {string} shapeName - New shape name
     */
    updateShapeAtPosition(gridX, gridY, shapeName) {
        const mesh = this.getShapeAtPosition(gridX, gridY);
        if (mesh && this.updateMeshShapeCallback) {
            this.updateMeshShapeCallback(mesh, shapeName);
        }
    }

    /**
     * Set callback for mesh shape updates
     * @param {Function} callback - Function to handle mesh shape updates
     */
    setUpdateMeshShapeCallback(callback) {
        this.updateMeshShapeCallback = callback;
    }

    /**
     * Regenerate the entire grid (convenience method)
     */
    regenerateGrid() {
        this.createGrid();
    }

    /**
     * Clean up grid manager resources
     */
    destroy() {
        this.clearExistingShapes();
        this.composition = [];
        this.scene = null;
    }
}
