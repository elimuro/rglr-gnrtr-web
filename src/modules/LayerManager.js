/**
 * LayerManager.js - Layer System Coordinator
 * This module manages the layer system, handling layer ordering, rendering sequence,
 * visibility, performance, and providing a unified parameter interface for all layers.
 * It coordinates between the existing grid system and new layer types.
 */

import { LayerBase } from './layers/LayerBase.js';

export class LayerManager {
    constructor(app) {
        this.app = app;
        this.state = app.state;
        
        // Layer registry
        this.layers = new Map();
        this.layerOrder = [];
        
        // Rendering state
        this.renderTargets = new Map();
        this.compositor = null;
        
        // Performance tracking
        this.totalRenderTime = 0;
        this.layerRenderTimes = new Map();
        
        // Context for layer initialization
        this.context = null;
        
        // Event listeners
        this.eventListeners = [];
        
        // State change tracking
        this.lastStateHash = null;
        
        // Flag to prevent recursive calls during setConfig
        this.isSettingConfig = false;
    }

    /**
     * Initialize the layer manager
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async initialize(context) {
        this.context = context;
        
        // Add app reference to context for layers that need it
        this.context.app = this.app;
        
        // Initialize compositor for layer blending
        this.initializeCompositor();
        
        // Initialize layer-specific systems (grid is handled separately)
        await this.initializeLayerSystems();
        
        // Initialize all layers
        await Promise.all(Array.from(this.layers.values()).map(layer => 
            layer.initialize(this.context)
        ));
        
        // Set initial z-positions
        this.updateLayerZPositions();
        
        // Set up state listeners
        this.setupStateListeners();
    }

    /**
     * Initialize the compositor for layer blending
     */
    initializeCompositor() {
        // For now, we'll use a simple compositor
        // In the future, this could be enhanced with advanced blending modes
        this.compositor = {
            blendLayers: (layers, renderer, camera) => {
                // Simple alpha blending for additional layers only
                // (Main scene with grid is rendered separately by Scene.render())
                layers.forEach(layer => {
                    if (layer.visible && layer.opacity > 0) {
                        layer.render2D(renderer, camera, this.app.animationLoop.deltaTime);
                    }
                });
            }
        };
    }

    /**
     * Initialize layer-specific systems (no grid layer needed)
     */
    async initializeLayerSystems() {
        // Create the grid layer automatically
        await this.createGridLayer();
    }

    /**
     * Create the grid layer automatically
     */
    async createGridLayer() {
        if (this.layers.has('grid')) return; // Already exists
        
        const { GridLayer } = await import('./layers/GridLayer.js');
        
        const gridLayer = new GridLayer('grid', {
            visible: true,
            opacity: 1.0,
            blendMode: 'normal',
            gridVisible: true,
            shapesVisible: true,
            gridLinesVisible: true
        });
        
        await this.addLayer(gridLayer);
        
        // Grid layer is added to the end by default, but can be reordered
    }

    /**
     * Add a P5 layer
     * @param {string} layerId - Layer ID
     * @param {Object} config - Layer configuration
     */
    async addP5Layer(layerId = 'p5', config = {}) {
        
        const { P5Layer } = await import('./layers/P5Layer.js');
        
        const p5Layer = new P5Layer(layerId, {
            visible: true,
            opacity: 1.0,
            blendMode: 'normal',
            ...config
        });
        
        await this.addLayer(p5Layer);
        
        return p5Layer;
    }

    /**
     * Add a layer to the system
     * @param {LayerBase} layer - Layer instance
     */
    async addLayer(layer) {
        if (!(layer instanceof LayerBase)) {
            throw new Error('Layer must extend LayerBase');
        }
        
        if (this.layers.has(layer.id)) {
            console.warn(`Layer with id ${layer.id} already exists, replacing`);
            await this.removeLayer(layer.id);
        }
        
        // Set layer manager reference
        layer.layerManager = this;
        
        // Initialize the layer
        await layer.initialize(this.context);
        
        // Add to registry
        this.layers.set(layer.id, layer);
        
        // Add to order if not already present
        if (!this.layerOrder.includes(layer.id)) {
            this.layerOrder.push(layer.id);
        }
        
        // Set up parameter routing
        this.setupLayerParameterRouting(layer);
    }

    /**
     * Remove a layer from the system
     * @param {string} layerId - Layer ID
     */
    async removeLayer(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return;
        
        // Dispose the layer
        layer.dispose();
        
        // Remove from registry
        this.layers.delete(layerId);
        
        // Remove from order
        const orderIndex = this.layerOrder.indexOf(layerId);
        if (orderIndex !== -1) {
            this.layerOrder.splice(orderIndex, 1);
        }
        
        // Clean up render target
        if (this.renderTargets.has(layerId)) {
            const renderTarget = this.renderTargets.get(layerId);
            renderTarget.dispose();
            this.renderTargets.delete(layerId);
        }
    }

    /**
     * Set layer order (for front-to-back rendering)
     * @param {string[]} order - Array of layer IDs in desired order
     */
    setLayerOrder(order) {
        // Validate that all layers exist
        const validOrder = order.filter(id => this.layers.has(id));
        const missingLayers = order.filter(id => !this.layers.has(id));
        
        if (missingLayers.length > 0) {
            console.warn('Attempted to set order for non-existent layers:', missingLayers);
        }
        
        // Add any layers that weren't in the order
        this.layerOrder.forEach(id => {
            if (!validOrder.includes(id)) {
                validOrder.push(id);
            }
        });
        
        this.layerOrder = validOrder;
        
        // Update z-positions based on new order
        this.updateLayerZPositions();
        
        // Only update state if we're not in the middle of setConfig to prevent infinite recursion
        if (!this.isSettingConfig) {
            this.state.set('layerOrder', [...this.layerOrder]);
        }
    }

    /**
     * Get layer order
     * @returns {string[]} Array of layer IDs in current order
     */
    getLayerOrder() {
        return [...this.layerOrder];
    }

    /**
     * Set layer parameter
     * @param {string} layerId - Layer ID
     * @param {string} paramName - Parameter name
     * @param {*} value - Parameter value
     */
    setLayerParameter(layerId, paramName, value) {
        const layer = this.layers.get(layerId);
        if (!layer) {
            console.warn(`Layer ${layerId} not found for parameter ${paramName}`);
            return;
        }
        
        layer.setParameter(paramName, value);
    }

    /**
     * Get layer parameter
     * @param {string} layerId - Layer ID
     * @param {string} paramName - Parameter name
     * @returns {*} Parameter value
     */
    getLayerParameter(layerId, paramName) {
        const layer = this.layers.get(layerId);
        if (!layer) {
            console.warn(`Layer ${layerId} not found for parameter ${paramName}`);
            return null;
        }
        
        return layer.getParameter(paramName);
    }

    /**
     * Get all exposed parameters from all layers
     * @returns {Object} Object with layer parameters organized by layer
     */
    getAllExposedParameters() {
        const parameters = {};
        
        this.layers.forEach((layer, layerId) => {
            parameters[layerId] = layer.getExposedParameters();
        });
        
        return parameters;
    }

    /**
     * Render all layers in order
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     */
    render(renderer, camera) {
        const startTime = performance.now();
        
        // Get layers in order
        const layersToRender = this.layerOrder
            .map(id => this.layers.get(id))
            .filter(layer => layer && layer.visible && layer.opacity > 0);
        
        // Update all layers first
        layersToRender.forEach(layer => {
            layer.update(this.app.animationLoop.deltaTime);
        });
        
        // Render additional layers using compositor
        // (Main scene is already rendered by Scene.render())
        this.compositor.blendLayers(layersToRender, renderer, camera);
        
        // Track performance
        this.totalRenderTime = performance.now() - startTime;
    }

    /**
     * Set up parameter routing for a layer
     * @param {LayerBase} layer - Layer instance
     */
    setupLayerParameterRouting(layer) {
        // For now, we'll handle parameter routing through the existing state system
        // In the future, this could be enhanced with a more sophisticated parameter mapper
        const exposedParams = layer.getExposedParameters();
        
        // Store layer parameter metadata for future use
        if (!this.app.state.layerParameters) {
            this.app.state.layerParameters = {};
        }
        
        this.app.state.layerParameters[layer.id] = exposedParams;
    }

    /**
     * Set up state listeners for layer management
     */
    setupStateListeners() {
        // Listen for layer order changes
        this.state.subscribe('layerOrder', (newOrder) => {
            if (newOrder && Array.isArray(newOrder)) {
                this.setLayerOrder(newOrder);
            }
        });
        
        // Listen for layer configuration changes
        this.state.subscribe('layers', (newLayers) => {
            if (newLayers && typeof newLayers === 'object') {
                this.updateLayerConfigurations(newLayers);
            }
        });
    }

    /**
     * Update layer configurations from state
     * @param {Object} layerConfigs - Layer configurations
     */
    updateLayerConfigurations(layerConfigs) {
        Object.entries(layerConfigs).forEach(([layerId, config]) => {
            const layer = this.layers.get(layerId);
            if (layer) {
                layer.setConfig(config);
            }
        });
    }

    /**
     * Mark a layer as dirty (needs re-render)
     * @param {string} layerId - Layer ID to mark as dirty
     */
    markLayerDirty(layerId) {
        const layer = this.layers.get(layerId);
        if (layer) {
            // Force a re-render by updating the layer's last render time
            layer.lastRenderTime = 0;
            
            // Trigger a re-render if the app is running
            if (this.app.animationLoop && this.app.animationLoop.isRunning) {
                // The animation loop will pick up the change on the next frame
            }
        }
    }

    /**
     * Get layer by ID
     * @param {string} layerId - Layer ID
     * @returns {LayerBase|null} Layer instance or null
     */
    getLayer(layerId) {
        return this.layers.get(layerId) || null;
    }

    /**
     * Get all layers
     * @returns {Map<string, LayerBase>} Map of all layers
     */
    getAllLayers() {
        return new Map(this.layers);
    }

    /**
     * Get layer performance metrics
     * @returns {Object} Performance metrics for all layers
     */
    getPerformanceMetrics() {
        const metrics = {
            totalRenderTime: this.totalRenderTime,
            layerCount: this.layers.size,
            layers: {}
        };
        
        this.layers.forEach((layer, layerId) => {
            metrics.layers[layerId] = layer.getPerformanceMetrics();
        });
        
        return metrics;
    }

    /**
     * Get layer configuration for serialization
     * @returns {Object} Layer system configuration
     */
    getConfig() {
        const config = {
            layerOrder: [...this.layerOrder],
            layers: {}
        };
        
        this.layers.forEach((layer, layerId) => {
            config.layers[layerId] = layer.getConfig();
        });
        
        return config;
    }

    /**
     * Set layer configuration from serialization
     * @param {Object} config - Layer system configuration
     */
    async setConfig(config) {
        if (this.isSettingConfig) {
            console.warn('Skipping state update during setConfig to prevent infinite recursion.');
            return;
        }
        this.isSettingConfig = true;

        if (config.layerOrder) {
            this.setLayerOrder(config.layerOrder);
        }
        
        if (config.layers) {
            // Update existing layers or create new ones
            for (const [layerId, layerConfig] of Object.entries(config.layers)) {
                let layer = this.layers.get(layerId);
                
                if (layer) {
                    // Layer exists, update its configuration
                    layer.setConfig(layerConfig);
                } else {
                    // Layer doesn't exist, create it based on type
                    if (layerConfig.type === 'P5Layer' || layerId === 'p5') {
                        try {
                            layer = await this.addP5Layer(layerId, layerConfig);
                            // After creating the layer, call setConfig to restore the full configuration
                            if (layer) {
                                layer.setConfig(layerConfig);
                            }
                        } catch (error) {
                            console.error(`Failed to create P5 layer ${layerId}:`, error);
                        }
                    }
                    // Add other layer types here as they're implemented
                    // else if (layerConfig.type === 'ShaderLayer') { ... }
                }
            }
        }
        this.isSettingConfig = false;
    }

    /**
     * Handle window resize events for all layers
     */
    onWindowResize() {
        // Notify all layers about the resize event
        this.layers.forEach(layer => {
            if (layer.onWindowResize && typeof layer.onWindowResize === 'function') {
                try {
                    layer.onWindowResize();
                } catch (error) {
                    console.warn(`Error in layer ${layer.id} resize handler:`, error);
                }
            }
        });
    }

    /**
     * Dispose of the layer manager and all layers
     */
    dispose() {
        // Dispose all layers
        this.layers.forEach(layer => {
            layer.dispose();
        });
        
        // Clear registries
        this.layers.clear();
        this.layerOrder = [];
        
        // Dispose render targets
        this.renderTargets.forEach(renderTarget => {
            renderTarget.dispose();
        });
        this.renderTargets.clear();
        
        // Clean up event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler);
            }
        });
        this.eventListeners = [];
    }

    /**
     * Update z-positions of all layers based on their order
     * This ensures proper depth separation and prevents z-fighting
     */
    updateLayerZPositions() {
        const baseZSpacing = 10; // Distance between layers in z-space
        
        this.layerOrder.forEach((layerId, index) => {
            const layer = this.layers.get(layerId);
            if (layer) {
                // Calculate z-position: first layer is closest, last layer is farthest
                const zPosition = index * baseZSpacing;
                layer.setZOffset(zPosition);
                
                // Update 3D objects if this is a grid layer
                if (layerId === 'grid' && this.app.scene && this.app.scene.gridManager) {
                    this.updateGridZPosition(zPosition);
                }
            }
        });
    }

    /**
     * Update grid objects z-positions
     * @param {number} zPosition - New z-position for grid
     */
    updateGridZPosition(zPosition) {
        const gridManager = this.app.scene.gridManager;
        if (!gridManager) return;
        
        // Update all grid shapes
        const shapes = gridManager.getAllShapes();
        shapes.forEach(mesh => {
            if (mesh && mesh.position) {
                mesh.position.z = zPosition;
            }
        });
        
        // Update grid lines
        const gridLines = gridManager.getAllGridLines();
        gridLines.forEach(line => {
            if (line && line.position) {
                line.position.z = zPosition;
            }
        });
    }
}
