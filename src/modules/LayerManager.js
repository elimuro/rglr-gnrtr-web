/**
 * LayerManager.js - Layer System Coordinator
 * This module manages the layer system, handling layer ordering, rendering sequence,
 * visibility, performance, and providing a unified parameter interface for all layers.
 * It coordinates between the existing grid system and new layer types.
 */

import { LayerBase } from './layers/LayerBase.js';
import * as THREE from 'three';

export class LayerManager {
    constructor(app) {
        this.app = app;
        this.state = app.state;
        
        // Layer registry
        this.layers = new Map();
        this.layerOrder = [];
        
        // Three.js layer container
        this.layerScene = new THREE.Group(); // Container for all layers
        this.layerSpacing = 0.1; // Z-spacing between layers (will be updated from state)
        
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
        
        // Performance optimization caches
        this.cachedVisibleLayers = [];
        this.cachedLayerOrder = [];
        this.lastOrderUpdate = 0;
        this.lastVisibilityCheck = 0;
        
        // Render optimization flags
        this.needsOrderUpdate = true;
        this.needsVisibilityUpdate = true;
        
        // Batch operations queue
        this.batchedOperations = [];
        this.batchTimer = null;
    }

    /**
     * Initialize the layer manager
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async initialize(context) {
        this.context = context;
        
        // Add app reference to context for layers that need it
        this.context.app = this.app;
        
        // Add layer scene to main scene
        if (this.context.scene) {
            this.context.scene.add(this.layerScene);
            console.log('LayerManager: Layer scene added to main scene');
        } else {
            console.warn('LayerManager: No scene in context, cannot add layer scene');
        }
        
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
        // Enhanced compositor with proper blend mode support
        this.compositor = {
            blendLayers: (layers, renderer, camera) => {
                // Render each layer with its specific blend mode
                // (Main scene with grid is rendered separately by Scene.render())
                layers.forEach(layer => {
                    if (layer.visible && layer.opacity > 0) {
                        // Ensure blend mode is applied to material before rendering
                        if (layer.needsBlendModeUpdate) {
                            layer.applyBlendModeToMaterial();
                        }
                        
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
        // Create the grid layers automatically
        await this.createGridLayers();
    }

    /**
     * Create the grid layers automatically
     */
    async createGridLayers() {
        // Create shapes layer
        if (!this.layers.has('grid')) {
            const { GridLayer } = await import('./layers/GridLayer.js');
            
            const gridLayer = new GridLayer('grid', {
                visible: true,
                opacity: 1.0,
                blendMode: 'normal',
                gridVisible: true,
                shapesVisible: true,
                gridLinesVisible: false // Disable grid lines in shapes layer since we have a separate layer
            });
            
            await this.addLayer(gridLayer);
        }
        
        // Create grid lines layer
        if (!this.layers.has('grid-lines')) {
            const { GridLinesLayer } = await import('./layers/GridLinesLayer.js');
            
            const gridLinesLayer = new GridLinesLayer('grid-lines', {
                visible: true,
                opacity: 1.0,
                blendMode: 'normal',
                gridColor: '#ff0000',
                lineThickness: 1,
                displacementEnabled: false,
                displacementAmount: 0.1,
                displacementSpeed: 1.0,
                displacementType: 'wave'
            });
            
            await this.addLayer(gridLinesLayer);
        }
        
        // Create sphere layer
        if (!this.layers.has('sphere-layer')) {
            const { SphereLayer } = await import('./layers/SphereLayer.js');
            
            const sphereLayer = new SphereLayer('sphere-layer', {
                visible: true,
                opacity: 1.0,
                blendMode: 'normal',
                gridWidth: 10,
                gridHeight: 6,
                cellSize: 1.0,
                sphereScale: 1.0,
                animationEnabled: false,
                rotationSpeed: 0.5,
                floatAmplitude: 0.1,
                floatSpeed: 1.0
            });
            
            await this.addLayer(sphereLayer);
        }
        
        // Ensure proper layer ordering: grid-lines behind grid-shapes, sphere layer in front
        this.setLayerOrder(['grid-lines', 'grid', 'sphere-layer', ...this.layerOrder.filter(id => !id.startsWith('grid') && id !== 'sphere-layer')]);
    }

    /**
     * Add a P5 texture layer
     * @param {string} layerId - Layer ID
     * @param {Object} config - Layer configuration
     */
    async addP5Layer(layerId = 'p5', config = {}) {
        
        const { P5TextureLayer } = await import('./layers/P5TextureLayer.js');
        
        const p5Layer = new P5TextureLayer(layerId, {
            visible: true,
            opacity: 1.0,
            blendMode: 'normal',
            ...config
        });
        
        await this.addLayer(p5Layer);
        
        return p5Layer;
    }

    /**
     * Add a shader layer
     * @param {string} layerId - Layer ID
     * @param {Object} config - Layer configuration
     */
    async addShaderLayer(layerId = 'shader', config = {}) {
        // Check if LayerManager is ready
        if (!this.context) {
            throw new Error('LayerManager not initialized. Please wait for the application to fully load.');
        }
        
        if (!this.context.renderer || !this.context.scene) {
            throw new Error('Three.js not ready. Please wait for the scene to initialize.');
        }
        
        console.log('LayerManager: Adding shader layer with context:', {
            hasRenderer: !!this.context.renderer,
            hasScene: !!this.context.scene,
            hasCamera: !!this.context.camera
        });
        
        const { ShaderLayer } = await import('./layers/ShaderLayer.js');
        
        const shaderLayer = new ShaderLayer(layerId, {
            visible: true,
            opacity: 1.0,
            blendMode: 'normal',
            emergentType: 'custom',
            agentCount: 1000,
            trailDecay: 0.95,
            sensorDistance: 15,
            ...config
        });
        
        await this.addLayer(shaderLayer);
        
        return shaderLayer;
    }

    /**
     * Add a sphere layer
     * @param {string} layerId - Layer ID
     * @param {Object} config - Layer configuration
     */
    async addSphereLayer(layerId = 'sphere', config = {}) {
        // Check if LayerManager is ready
        if (!this.context) {
            throw new Error('LayerManager not initialized. Please wait for the application to fully load.');
        }
        
        if (!this.context.renderer || !this.context.scene) {
            throw new Error('Three.js not ready. Please wait for the scene to initialize.');
        }
        
        console.log('LayerManager: Adding sphere layer with context:', {
            hasRenderer: !!this.context.renderer,
            hasScene: !!this.context.scene,
            hasCamera: !!this.context.camera
        });
        
        const { SphereLayer } = await import('./layers/SphereLayer.js');
        
        const sphereLayer = new SphereLayer(layerId, {
            visible: true,
            opacity: 1.0,
            blendMode: 'normal',
            gridWidth: 10,
            gridHeight: 6,
            cellSize: 1.0,
            sphereScale: 1.0,
            animationEnabled: false,
            rotationSpeed: 0.5,
            floatAmplitude: 0.1,
            floatSpeed: 1.0,
            ...config
        });
        
        await this.addLayer(sphereLayer);
        
        return sphereLayer;
    }

    /**
     * Add a layer to the system
     * @param {LayerBase} layer - Layer instance
     */
    async addLayer(layer) {
        if (!(layer instanceof LayerBase)) {
            throw new Error('Layer must extend LayerBase');
        }
        
        // Check if LayerManager is initialized
        if (!this.context) {
            throw new Error('LayerManager not initialized. Call initialize() first.');
        }
        
        // Check if required context properties are available
        if (!this.context.renderer || !this.context.scene) {
            throw new Error('LayerManager context missing required properties (renderer, scene). Ensure Three.js is initialized.');
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
        // New layers should appear on top (at the beginning of the array)
        if (!this.layerOrder.includes(layer.id)) {
            // Special handling for grid layer - always keep it at the back
            if (layer.id === 'grid') {
                this.layerOrder.push(layer.id); // Grid goes to the end (back)
            } else {
                this.layerOrder.unshift(layer.id); // Other layers go to the beginning (front)
            }
        }
        
        // Add layer mesh to layer scene if it exists
        if (layer.mesh && this.layerScene) {
            this.layerScene.add(layer.mesh);
            console.log(`LayerManager: Added layer ${layer.id} mesh to layer scene`);
        }
        
        // Update z-positions after adding layer
        this.updateLayerZPositions();
        
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
        
        // Remove layer mesh from layer scene if it exists
        if (layer.mesh && this.layerScene) {
            this.layerScene.remove(layer.mesh);
            console.log(`LayerManager: Removed layer ${layerId} mesh from layer scene`);
        }
        
        // Dispose the layer
        layer.dispose();
        
        // Remove from registry
        this.layers.delete(layerId);
        
        // Remove from order
        const orderIndex = this.layerOrder.indexOf(layerId);
        if (orderIndex !== -1) {
            this.layerOrder.splice(orderIndex, 1);
        }
        
        // Update z-positions after removing layer
        this.updateLayerZPositions();
        
        // Clean up render target
        if (this.renderTargets.has(layerId)) {
            const renderTarget = this.renderTargets.get(layerId);
            renderTarget.dispose();
            this.renderTargets.delete(layerId);
        }
    }

    /**
     * Set layer order (for front-to-back rendering) with optimization
     * @param {string[]} order - Array of layer IDs in desired order
     * @param {boolean} immediate - Whether to apply changes immediately or batch them
     */
    setLayerOrder(order, immediate = true) {
        // If not immediate, queue the operation for batching
        if (!immediate) {
            this.queueBatchedOperation({
                type: 'orderChanges',
                order: order
            });
            return;
        }
        
        // Validate that all layers exist
        const validOrder = order.filter(id => this.layers.has(id));
        const missingLayers = order.filter(id => !this.layers.has(id));
        
        if (missingLayers.length > 0) {
            console.warn('Attempted to set order for non-existent layers:', missingLayers);
        }
        
        // Check if order actually changed to avoid unnecessary work
        const orderChanged = !this.arraysEqual(this.layerOrder, validOrder);
        if (!orderChanged) return;
        
        // Add any layers that weren't in the order
        this.layerOrder.forEach(id => {
            if (!validOrder.includes(id)) {
                validOrder.push(id);
            }
        });
        
        this.layerOrder = validOrder;
        this.needsOrderUpdate = true;
        this.needsVisibilityUpdate = true;
        
        // Update z-positions based on new order
        this.updateLayerZPositions();
        
        // Only update state if we're not in the middle of setConfig to prevent infinite recursion
        if (!this.isSettingConfig) {
            this.state.set('layerOrder', [...this.layerOrder]);
        }
    }
    
    /**
     * Queue a batched operation for later processing
     * @param {Object} operation - Operation to queue
     */
    queueBatchedOperation(operation) {
        this.batchedOperations.push(operation);
        
        // Set up batch timer if not already set
        if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
                this.processBatchedOperations();
                this.batchTimer = null;
            }, 16); // Process at ~60fps
        }
    }
    
    /**
     * Optimized parameter setting with batching support
     * @param {string} layerId - Layer ID
     * @param {string} paramName - Parameter name
     * @param {*} value - Parameter value
     * @param {boolean} immediate - Whether to apply immediately or batch
     */
    setLayerParameterOptimized(layerId, paramName, value, immediate = false) {
        if (!immediate) {
            this.queueBatchedOperation({
                type: 'parameterUpdates',
                layerId,
                paramName,
                value
            });
            return;
        }
        
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.setParameter(paramName, value);
            
            // Mark visibility update needed if it's a visibility-related parameter
            if (paramName === 'visible' || paramName === 'opacity') {
                this.needsVisibilityUpdate = true;
            }
        }
    }
    
    /**
     * Check if two arrays are equal
     * @param {Array} a - First array
     * @param {Array} b - Second array
     * @returns {boolean} Whether arrays are equal
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
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
     * Set 3D position for a layer (advanced feature)
     * @param {string} layerId - Layer ID
     * @param {Object} position - Position object {x, y, z}
     */
    setLayer3DPosition(layerId, position) {
        const layer = this.layers.get(layerId);
        if (!layer) {
            console.warn(`Layer ${layerId} not found for 3D positioning`);
            return;
        }
        
        if (!layer.mesh) {
            console.warn(`Layer ${layerId} has no mesh for 3D positioning`);
            return;
        }
        
        if (position.x !== undefined) layer.mesh.position.x = position.x;
        if (position.y !== undefined) layer.mesh.position.y = position.y;
        if (position.z !== undefined) layer.mesh.position.z = position.z;
        
        console.log(`LayerManager: Set 3D position for layer ${layerId}:`, layer.mesh.position);
    }

    /**
     * Set 3D rotation for a layer (advanced feature)
     * @param {string} layerId - Layer ID
     * @param {Object} rotation - Rotation object {x, y, z} in radians
     */
    setLayer3DRotation(layerId, rotation) {
        const layer = this.layers.get(layerId);
        if (!layer) {
            console.warn(`Layer ${layerId} not found for 3D rotation`);
            return;
        }
        
        if (!layer.mesh) {
            console.warn(`Layer ${layerId} has no mesh for 3D rotation`);
            return;
        }
        
        if (rotation.x !== undefined) layer.mesh.rotation.x = rotation.x;
        if (rotation.y !== undefined) layer.mesh.rotation.y = rotation.y;
        if (rotation.z !== undefined) layer.mesh.rotation.z = rotation.z;
        
        console.log(`LayerManager: Set 3D rotation for layer ${layerId}:`, layer.mesh.rotation);
    }

    /**
     * Set 3D scale for a layer (advanced feature)
     * @param {string} layerId - Layer ID
     * @param {Object} scale - Scale object {x, y, z}
     */
    setLayer3DScale(layerId, scale) {
        const layer = this.layers.get(layerId);
        if (!layer) {
            console.warn(`Layer ${layerId} not found for 3D scaling`);
            return;
        }
        
        if (!layer.mesh) {
            console.warn(`Layer ${layerId} has no mesh for 3D scaling`);
            return;
        }
        
        if (scale.x !== undefined) layer.mesh.scale.x = scale.x;
        if (scale.y !== undefined) layer.mesh.scale.y = scale.y;
        if (scale.z !== undefined) layer.mesh.scale.z = scale.z;
        
        console.log(`LayerManager: Set 3D scale for layer ${layerId}:`, layer.mesh.scale);
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
     * Render all layers in order with performance optimizations
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     */
    render(renderer, camera) {
        const startTime = performance.now();
        
        // Process any batched operations first
        this.processBatchedOperations();
        
        // Get layers to render using cached results when possible
        const layersToRender = this.getCachedVisibleLayers();
        
        if (layersToRender.length === 0) {
            this.totalRenderTime = performance.now() - startTime;
            return;
        }
        
        // Update only layers that need updating
        const deltaTime = this.app.animationLoop.deltaTime;
        for (let i = 0; i < layersToRender.length; i++) {
            const layer = layersToRender[i];
            if (layer.needsUpdate || layer.isAnimated) {
                layer.update(deltaTime);
            }
        }
        
        // Render layers using optimized compositor
        this.compositor.blendLayers(layersToRender, renderer, camera);
        
        // Track performance with moving average
        const renderTime = performance.now() - startTime;
        this.totalRenderTime = this.totalRenderTime * 0.9 + renderTime * 0.1;
    }
    
    /**
     * Get visible layers with caching for performance
     * @returns {Array} Array of visible layers to render
     */
    getCachedVisibleLayers() {
        const now = performance.now();
        
        // Invalidate cache if order changed or enough time passed
        if (this.needsOrderUpdate || this.needsVisibilityUpdate || 
            now - this.lastVisibilityCheck > 100) { // Check every 100ms
            
            this.cachedVisibleLayers = this.layerOrder
                .map(id => this.layers.get(id))
                .filter(layer => layer && layer.visible && layer.opacity > 0);
            
            this.lastVisibilityCheck = now;
            this.needsVisibilityUpdate = false;
        }
        
        return this.cachedVisibleLayers;
    }
    
    /**
     * Process batched operations to reduce overhead
     */
    processBatchedOperations() {
        if (this.batchedOperations.length === 0) return;
        
        const operations = this.batchedOperations.splice(0);
        
        // Group operations by type for efficient batch processing
        const groups = {
            parameterUpdates: [],
            visibilityChanges: [],
            orderChanges: []
        };
        
        operations.forEach(op => {
            if (groups[op.type]) {
                groups[op.type].push(op);
            }
        });
        
        // Process parameter updates in batch
        if (groups.parameterUpdates.length > 0) {
            this.processBatchedParameterUpdates(groups.parameterUpdates);
        }
        
        // Process visibility changes
        if (groups.visibilityChanges.length > 0) {
            this.processBatchedVisibilityChanges(groups.visibilityChanges);
        }
        
        // Process order changes
        if (groups.orderChanges.length > 0) {
            this.processBatchedOrderChanges(groups.orderChanges);
        }
    }
    
    /**
     * Process batched parameter updates efficiently
     */
    processBatchedParameterUpdates(updates) {
        const layerUpdates = new Map();
        
        // Group updates by layer
        updates.forEach(({ layerId, paramName, value }) => {
            if (!layerUpdates.has(layerId)) {
                layerUpdates.set(layerId, {});
            }
            layerUpdates.get(layerId)[paramName] = value;
        });
        
        // Apply all updates for each layer at once
        layerUpdates.forEach((params, layerId) => {
            const layer = this.layers.get(layerId);
            if (layer) {
                layer.setBatchParameters(params);
            }
        });
    }
    
    /**
     * Process batched visibility changes
     */
    processBatchedVisibilityChanges(changes) {
        let needsUpdate = false;
        
        changes.forEach(({ layerId, visible }) => {
            const layer = this.layers.get(layerId);
            if (layer && layer.visible !== visible) {
                layer.visible = visible;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            this.needsVisibilityUpdate = true;
        }
    }
    
    /**
     * Process batched order changes
     */
    processBatchedOrderChanges(changes) {
        // Take the most recent order change
        const lastChange = changes[changes.length - 1];
        if (lastChange) {
            this.setLayerOrder(lastChange.order);
        }
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
                    await layer.setConfig(layerConfig);
                } else {
                    // Layer doesn't exist, create it based on type
                    if (layerConfig.type === 'P5TextureLayer' || layerId === 'p5') {
                        try {
                            layer = await this.addP5Layer(layerId, layerConfig);
                            // After creating the layer, call setConfig to restore the full configuration
                            if (layer) {
                                await layer.setConfig(layerConfig);
                            }
                        } catch (error) {
                            console.error(`Failed to create P5 layer ${layerId}:`, error);
                        }
                    } else if (layerConfig.type === 'ShaderLayer' || layerId === 'shader') {
                        try {
                            layer = await this.addShaderLayer(layerId, layerConfig);
                            // After creating the layer, call setConfig to restore the full configuration
                            if (layer) {
                                await layer.setConfig(layerConfig);
                            }
                        } catch (error) {
                            console.error(`Failed to create Shader layer ${layerId}:`, error);
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
     * Dispose of the layer manager and all layers with enhanced memory management
     */
    dispose() {
        // Clear any pending batch operations
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        this.batchedOperations = [];
        
        // Dispose all layers with error handling
        this.layers.forEach((layer, layerId) => {
            try {
                layer.dispose();
            } catch (error) {
                console.warn(`Error disposing layer ${layerId}:`, error);
            }
        });
        
        // Clear registries
        this.layers.clear();
        this.layerOrder = [];
        
        // Clear performance tracking
        this.layerRenderTimes.clear();
        this.totalRenderTime = 0;
        
        // Clear caches
        this.cachedVisibleLayers = [];
        this.cachedLayerOrder = [];
        
        // Remove layer scene from main scene
        if (this.layerScene && this.context && this.context.scene) {
            this.context.scene.remove(this.layerScene);
        }
        
        // Clear layer scene with proper disposal
        if (this.layerScene) {
            // Recursively dispose all children
            this.layerScene.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => this.disposeMaterial(material));
                    } else {
                        this.disposeMaterial(child.material);
                    }
                }
            });
            this.layerScene.clear();
            this.layerScene = null;
        }
        
        // Dispose render targets with error handling
        this.renderTargets.forEach((renderTarget, key) => {
            try {
                renderTarget.dispose();
            } catch (error) {
                console.warn(`Error disposing render target ${key}:`, error);
            }
        });
        this.renderTargets.clear();
        
        // Clean up event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            try {
                if (element && element.removeEventListener) {
                    element.removeEventListener(event, handler);
                }
            } catch (error) {
                console.warn('Error removing event listener:', error);
            }
        });
        this.eventListeners = [];
        
        // Clear context reference
        this.context = null;
        
        // Clear app reference to prevent memory leaks
        this.app = null;
        this.state = null;
    }
    
    /**
     * Dispose a Three.js material properly
     * @param {THREE.Material} material - Material to dispose
     */
    disposeMaterial(material) {
        if (!material) return;
        
        // Dispose textures
        if (material.map) material.map.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        if (material.roughnessMap) material.roughnessMap.dispose();
        if (material.metalnessMap) material.metalnessMap.dispose();
        if (material.alphaMap) material.alphaMap.dispose();
        if (material.envMap) material.envMap.dispose();
        if (material.lightMap) material.lightMap.dispose();
        if (material.aoMap) material.aoMap.dispose();
        if (material.emissiveMap) material.emissiveMap.dispose();
        if (material.displacementMap) material.displacementMap.dispose();
        
        // Dispose the material itself
        material.dispose();
    }
    
    /**
     * Get memory usage statistics
     * @returns {Object} Memory usage information
     */
    getMemoryUsage() {
        const stats = {
            layerCount: this.layers.size,
            renderTargetCount: this.renderTargets.size,
            cachedLayerCount: this.cachedVisibleLayers.length,
            batchedOperationCount: this.batchedOperations.length,
            eventListenerCount: this.eventListeners.length,
            totalRenderTime: this.totalRenderTime,
            layers: {}
        };
        
        // Get memory usage from each layer
        this.layers.forEach((layer, layerId) => {
            if (layer.getMemoryUsage) {
                stats.layers[layerId] = layer.getMemoryUsage();
            }
        });
        
        return stats;
    }
    
    /**
     * Perform garbage collection and optimization
     */
    performMaintenance() {
        // Clear old cached data
        const now = performance.now();
        if (now - this.lastVisibilityCheck > 1000) { // 1 second old
            this.needsVisibilityUpdate = true;
        }
        
        // Process any pending batched operations
        this.processBatchedOperations();
        
        // Clean up performance tracking data
        if (this.layerRenderTimes.size > 100) {
            // Keep only recent entries
            const entries = Array.from(this.layerRenderTimes.entries());
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            this.layerRenderTimes.clear();
            entries.slice(0, 50).forEach(([key, value]) => {
                this.layerRenderTimes.set(key, value);
            });
        }
        
        // Trigger layer-specific maintenance
        this.layers.forEach(layer => {
            if (layer.performMaintenance) {
                layer.performMaintenance();
            }
        });
    }

    /**
     * Update layer spacing from state
     */
    updateLayerSpacing() {
        if (this.state && this.state.has('layerSpacing')) {
            this.layerSpacing = this.state.get('layerSpacing');
            console.log(`LayerManager: Updated layer spacing to ${this.layerSpacing}`);
        }
    }

    /**
     * Update 3D positions of all layers based on their order
     * This ensures proper depth separation and layer ordering
     * Layers are centered around z=0 for balanced composition
     */
    updateLayerZPositions() {
        // Update spacing from state first
        this.updateLayerSpacing();
        
        const layerCount = this.layerOrder.length;
        if (layerCount === 0) return;
        
        // Calculate the center offset to distribute layers around z=0
        // For even number of layers: center between middle two layers
        // For odd number of layers: center on the middle layer
        const centerOffset = (layerCount - 1) * this.layerSpacing / 2;
        
        this.layerOrder.forEach((layerId, index) => {
            const layer = this.layers.get(layerId);
            if (layer) {
                // Calculate z-position: centered around z=0
                // First layer starts at +centerOffset, subsequent layers move toward -centerOffset
                const zPosition = centerOffset - (index * this.layerSpacing);
                
                // Use setZOffset for all layers - this ensures consistent positioning
                layer.setZOffset(zPosition);
                
                // Update mesh-specific properties if mesh exists
                if (layer.mesh) {
                    layer.mesh.renderOrder = this.layerOrder.length - index;
                    layer.mesh.layers.set(index);
                }
                
                console.log(`LayerManager: Updated layer ${layerId} z-offset = ${zPosition} (centered), renderOrder = ${layer.mesh ? layer.mesh.renderOrder : 'N/A'}`);
            }
        });
    }


}
