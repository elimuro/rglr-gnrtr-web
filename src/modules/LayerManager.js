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
    }

    /**
     * Initialize the layer manager
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async initialize(context) {
        this.context = context;
        
        // Initialize compositor for layer blending
        this.initializeCompositor();
        
        // Initialize layer-specific systems (grid is handled separately)
        await this.initializeLayerSystems();
        
        // Set up state listeners
        this.setupStateListeners();
        
        console.log('LayerManager initialized with', this.layers.size, 'layers');
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
        // GridManager is handled separately as the foundation
        // This method is reserved for initializing additional layer types
        console.log('LayerManager ready for additional layers (P5, Shader, Video, etc.)');
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
        
        console.log(`Added layer: ${layer.id} (${layer.constructor.name})`);
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
        
        console.log(`Removed layer: ${layerId}`);
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
        
        // Update state
        this.state.set('layerOrder', [...this.layerOrder]);
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
        if (config.layerOrder) {
            this.setLayerOrder(config.layerOrder);
        }
        
        if (config.layers) {
            // Update existing layers
            Object.entries(config.layers).forEach(([layerId, layerConfig]) => {
                const layer = this.layers.get(layerId);
                if (layer) {
                    layer.setConfig(layerConfig);
                }
            });
        }
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
        
        console.log('LayerManager disposed');
    }
}
