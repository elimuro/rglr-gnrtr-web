/**
 * GridLayer.js - Grid Layer Implementation
 * This layer wraps the existing GridManager to integrate it into the layer system.
 * It provides visibility, opacity, and blend mode controls for the grid.
 */

import { LayerBase } from './LayerBase.js';

export class GridLayer extends LayerBase {
    constructor(id, config = {}) {
        super(id, config);
        
        // Reference to the GridManager (will be set during initialization)
        this.gridManager = null;
        
        // Grid-specific properties
        this.gridVisible = config.gridVisible !== undefined ? config.gridVisible : true;
        this.shapesVisible = config.shapesVisible !== undefined ? config.shapesVisible : true;
        this.gridLinesVisible = config.gridLinesVisible !== undefined ? config.gridLinesVisible : true;
        
        // Performance tracking
        this.lastGridUpdate = 0;
        this.gridUpdateInterval = config.gridUpdateInterval || 1000; // Update every second
    }

    /**
     * Initialize the grid layer
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async onInitialize(context) {
        console.log(`GridLayer: Initializing layer ${this.id}`);
        console.log(`GridLayer: Context:`, context);
        console.log(`GridLayer: Context.app:`, context.app);
        console.log(`GridLayer: Context.app.scene:`, context.app?.scene);
        console.log(`GridLayer: Context.app.scene.gridManager:`, context.app?.scene?.gridManager);
        
        // Get reference to GridManager from the app
        if (context.app && context.app.scene && context.app.scene.gridManager) {
            this.gridManager = context.app.scene.gridManager;
            console.log(`GridLayer: Successfully got GridManager reference:`, this.gridManager);
        } else {
            console.error(`GridLayer: GridManager not available in context`);
            throw new Error('GridManager not available in context');
        }
        
        // Store context for later use
        this.context = context;
        console.log(`GridLayer: Initialization complete for layer ${this.id}`);
    }

    /**
     * Render the grid layer
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     * @param {number} deltaTime - Time since last frame
     */
    onRender2D(renderer, camera, deltaTime) {
        // Grid rendering is handled by Scene.js, so this is a no-op
        // The grid is always rendered first as the foundation layer
    }

    /**
     * Update the grid layer
     * @param {number} deltaTime - Time since last frame
     */
    onUpdate(deltaTime) {
        console.log(`GridLayer: onUpdate called for layer ${this.id}, deltaTime: ${deltaTime}`);
        
        if (!this.gridManager) {
            console.error(`GridLayer: No GridManager reference available in onUpdate`);
            return;
        }
        
        // Update grid visibility based on layer visibility
        this.updateGridVisibility();
        
        // Periodic grid updates for performance monitoring
        const now = performance.now();
        if (now - this.lastGridUpdate > this.gridUpdateInterval) {
            this.lastGridUpdate = now;
            this.updateGridMetrics();
        }
    }

    /**
     * Update grid visibility based on layer visibility
     */
    updateGridVisibility() {
        console.log(`GridLayer: updateGridVisibility called for layer ${this.id}, visible: ${this.visible}, shapesVisible: ${this.shapesVisible}, gridLinesVisible: ${this.gridLinesVisible}`);
        
        if (!this.gridManager) {
            console.error(`GridLayer: No GridManager reference available`);
            return;
        }
        
        // Get all shapes and grid lines
        const shapes = this.gridManager.getAllShapes();
        const gridLines = this.gridManager.getAllGridLines();
        
        console.log(`GridLayer: Found ${shapes.length} shapes and ${gridLines.length} grid lines`);
        
        // Update shapes visibility
        shapes.forEach((mesh, index) => {
            if (mesh) {
                const wasVisible = mesh.visible;
                mesh.visible = this.visible && this.shapesVisible;
                if (wasVisible !== mesh.visible) {
                    console.log(`GridLayer: Updated shape ${index} visibility: ${wasVisible} -> ${mesh.visible}`);
                }
                if (this.opacity !== 1.0) {
                    mesh.material.opacity = this.opacity;
                    mesh.material.transparent = this.opacity < 1.0;
                }
            }
        });
        
        // Update grid lines visibility
        gridLines.forEach((line, index) => {
            if (line) {
                const wasVisible = line.visible;
                line.visible = this.visible && this.gridLinesVisible;
                if (wasVisible !== line.visible) {
                    console.log(`GridLayer: Updated grid line ${index} visibility: ${wasVisible} -> ${line.visible}`);
                }
                if (line.material) {
                    line.material.opacity = this.opacity;
                    line.material.transparent = this.opacity < 1.0;
                }
            }
        });
        
        console.log(`GridLayer: Grid visibility update complete for layer ${this.id}`);
    }

    /**
     * Update grid performance metrics
     */
    updateGridMetrics() {
        if (!this.gridManager) return;
        
        // Update render time based on grid complexity
        const shapes = this.gridManager.getAllShapes();
        const gridLines = this.gridManager.getAllGridLines();
        
        // Estimate render time based on object count
        const estimatedRenderTime = (shapes.length * 0.1) + (gridLines.length * 0.05);
        this.lastRenderTime = estimatedRenderTime;
    }

    /**
     * Handle visibility changes for grid layer
     * @param {boolean} isVisible - New visibility state
     */
    onVisibilityChanged(isVisible) {
        console.log(`GridLayer: onVisibilityChanged called for layer ${this.id}, isVisible: ${isVisible}`);
        
        // Update grid visibility immediately
        this.updateGridVisibility();
        
        // Call parent method
        super.onVisibilityChanged(isVisible);
        
        console.log(`GridLayer: onVisibilityChanged complete for layer ${this.id}`);
    }

    /**
     * Handle opacity changes for grid layer
     * @param {number} newOpacity - New opacity value (0.0 to 1.0)
     */
    updateOpacityState(newOpacity) {
        // Update grid visibility immediately to apply new opacity
        this.updateGridVisibility();
    }

    /**
     * Get grid-specific configuration
     * @returns {Object} Grid-specific configuration
     */
    onGetConfig() {
        return {
            gridVisible: this.gridVisible,
            shapesVisible: this.shapesVisible,
            gridLinesVisible: this.gridLinesVisible,
            gridUpdateInterval: this.gridUpdateInterval
        };
    }

    /**
     * Set grid-specific configuration
     * @param {Object} config - Grid configuration object
     */
    onSetConfig(config) {
        if (config.gridVisible !== undefined) this.gridVisible = config.gridVisible;
        if (config.shapesVisible !== undefined) this.shapesVisible = config.shapesVisible;
        if (config.gridLinesVisible !== undefined) this.gridLinesVisible = config.gridLinesVisible;
        if (config.gridUpdateInterval !== undefined) this.gridUpdateInterval = config.gridUpdateInterval;
        
        // Update visibility immediately
        this.updateGridVisibility();
    }

    /**
     * Get grid performance metrics
     * @returns {Object} Grid performance metrics
     */
    getGridMetrics() {
        if (!this.gridManager) return {};
        
        const shapes = this.gridManager.getAllShapes();
        const gridLines = this.gridManager.getAllGridLines();
        
        return {
            shapeCount: shapes.length,
            gridLineCount: gridLines.length,
            totalObjects: shapes.length + gridLines.length,
            estimatedRenderTime: this.lastRenderTime
        };
    }

    /**
     * Toggle grid lines visibility
     */
    toggleGridLines() {
        this.gridLinesVisible = !this.gridLinesVisible;
        this.updateGridVisibility();
    }

    /**
     * Toggle shapes visibility
     */
    toggleShapes() {
        this.shapesVisible = !this.shapesVisible;
        this.updateGridVisibility();
    }

    /**
     * Get grid composition info
     * @returns {Object} Grid composition information
     */
    getGridInfo() {
        if (!this.gridManager) return {};
        
        return {
            compositionWidth: this.context.app.state.get('compositionWidth'),
            compositionHeight: this.context.app.state.get('compositionHeight'),
            cellSize: this.context.app.state.get('cellSize'),
            enabledShapes: this.context.app.state.get('enabledShapes'),
            randomness: this.context.app.state.get('randomness')
        };
    }

    /**
     * Set z-offset value
     * @param {number} zOffset - New z-offset value
     */
    setZOffset(zOffset) {
        super.setZOffset(zOffset);
        
        console.log(`GridLayer: Setting z-offset to ${zOffset}`);
        
        // Update grid objects z-position through GridManager
        if (this.gridManager) {
            // Update all grid shapes
            const shapes = this.gridManager.getAllShapes();
            console.log(`GridLayer: Updating ${shapes.length} shapes to z = ${zOffset}`);
            shapes.forEach(mesh => {
                if (mesh && mesh.position) {
                    mesh.position.z = zOffset;
                }
            });
            
            // Update grid lines
            const gridLines = this.gridManager.getAllGridLines();
            console.log(`GridLayer: Updating ${gridLines.length} grid lines to z = ${zOffset}`);
            gridLines.forEach(line => {
                if (line && line.position) {
                    line.position.z = zOffset;
                }
            });
        } else {
            console.warn('GridLayer: No GridManager available for z-offset update');
        }
    }

    /**
     * Dispose of the grid layer
     */
    onDispose() {
        // Don't dispose of the GridManager as it's managed by Scene
        this.gridManager = null;
    }
}
