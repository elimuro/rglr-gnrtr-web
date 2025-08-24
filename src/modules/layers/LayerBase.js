/**
 * LayerBase.js - Abstract Base Class for All Layers
 * This module provides the foundation for all layer types in the layer system.
 * It defines the common interface, lifecycle methods, and state management
 * that all layers must implement.
 */

import * as THREE from 'three';
import { 
    BLEND_MODES, 
    applyBlendModeToMaterial
} from '../../config/BlendModeConstants.js';

export class LayerBase {
    constructor(id, config = {}) {
        this.id = id;
        this.visible = config.visible !== undefined ? config.visible : true;
        this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
        this.blendMode = config.blendMode || BLEND_MODES.NORMAL;
        this.zOffset = config.zOffset !== undefined ? config.zOffset : 0; // Z-space distance from camera
        
        // Three.js mesh for 3D positioning (will be set by subclasses)
        this.mesh = null;
        
        // Layer state
        this.initialized = false;
        this.disposed = false;
        
        // Performance tracking
        this.lastRenderTime = 0;
        this.renderCount = 0;
        
        // Parameter cache for performance
        this.parameterCache = new Map();
        

        
        // Blend mode state
        this.needsBlendModeUpdate = true;
    }

    /**
     * Initialize the layer
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async initialize(context) {
        if (this.initialized || this.disposed) return;
        
        try {
            // Store context so subclasses can access renderer/scene/camera
            this.context = context;
            await this.onInitialize(context);
            this.initialized = true;
        } catch (error) {
            console.error(`Failed to initialize layer ${this.id}:`, error);
            throw error;
        }
    }

    /**
     * Abstract method for layer-specific initialization
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async onInitialize(context) {
        throw new Error('onInitialize must be implemented by subclass');
    }

    /**
     * Abstract method to ensure layer has a mesh property
     * This method must be called by subclasses after creating their mesh
     * @param {THREE.Mesh} mesh - The mesh object for this layer
     */
    setLayerMesh(mesh) {
        if (!mesh) {
            throw new Error(`Layer ${this.id} must provide a valid mesh object`);
        }
        
        this.mesh = mesh;
        
        // Ensure the layer mesh is completely invisible
        // This mesh is only used for layer-level effects, not visual rendering
        this.mesh.visible = false;
        
        // Apply current layer properties to the mesh
        this.mesh.position.z = this.zOffset;
        
        // Apply material properties if available
        if (this.mesh.material) {
            this.mesh.material.opacity = this.opacity;
            this.mesh.material.transparent = this.opacity < 1.0;
            
            // Apply blend mode if available
            if (this.blendMode) {
                this.applyBlendModeToMaterial();
            }
        }
        
        console.log(`LayerBase ${this.id}: Invisible layer mesh set successfully`);
    }

    /**
     * Render the layer in 2D mode
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     * @param {number} deltaTime - Time since last frame
     */
    render2D(renderer, camera, deltaTime) {
        if (!this.visible || !this.initialized || this.disposed) {
            return;
        }
        
        const startTime = performance.now();
        
        try {
            this.onRender2D(renderer, camera, deltaTime);
            this.renderCount++;
        } catch (error) {
            console.error(`Error rendering layer ${this.id}:`, error);
        } finally {
            this.lastRenderTime = performance.now() - startTime;
        }
    }

    /**
     * Abstract method for layer-specific 2D rendering
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     * @param {number} deltaTime - Time since last frame
     */
    onRender2D(renderer, camera, deltaTime) {
        throw new Error('onRender2D must be implemented by subclass');
    }

    /**
     * Update the layer (called every frame)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.initialized || this.disposed) return;
        
        try {
            this.onUpdate(deltaTime);
        } catch (error) {
            console.error(`Error updating layer ${this.id}:`, error);
        }
    }

    /**
     * Abstract method for layer-specific updates
     * @param {number} deltaTime - Time since last frame
     */
    onUpdate(deltaTime) {
        // Optional override
    }

    /**
     * Dispose of the layer and clean up resources
     */
    dispose() {
        if (this.disposed) return;
        
        try {
            this.onDispose();
            

            
            // Clear parameter cache
            this.parameterCache.clear();
            
            this.disposed = true;
            this.initialized = false;
        } catch (error) {
            console.error(`Error disposing layer ${this.id}:`, error);
        }
    }

    /**
     * Abstract method for layer-specific cleanup
     */
    onDispose() {
        // Optional override
    }

    /**
     * Set a parameter value
     * @param {string} name - Parameter name
     * @param {*} value - Parameter value
     */
    setParameter(name, value) {
        if (this.disposed) return;
        
        try {
            this.onSetParameter(name, value);
            
            // Only cache parameters that aren't handled by direct property access
            // Common parameters (visible, opacity, blendMode, zOffset) are stored in actual properties
            if (!this.isCommonParameter(name)) {
                this.parameterCache.set(name, value);
            }
        } catch (error) {
            console.error(`Error setting parameter ${name} on layer ${this.id}:`, error);
        }
    }

    /**
     * Check if a parameter is handled by direct property access (not cached)
     * @param {string} name - Parameter name
     * @returns {boolean} True if parameter is handled directly
     */
    isCommonParameter(name) {
        return ['visible', 'opacity', 'blendMode', 'zOffset'].includes(name);
    }

    /**
     * Abstract method for layer-specific parameter setting
     * @param {string} name - Parameter name
     * @param {*} value - Parameter value
     */
    onSetParameter(name, value) {
        // Handle common parameters with direct Three.js property access
        switch (name) {
            case 'visible':
                this.visible = Boolean(value);
                if (this.mesh) {
                    this.mesh.visible = this.visible;
                }
                this.onVisibilityChanged(this.visible);
                break;
            case 'opacity':
                this.opacity = Math.max(0.0, Math.min(1.0, Number(value)));
                if (this.mesh && this.mesh.material) {
                    this.mesh.material.opacity = this.opacity;
                    this.mesh.material.transparent = this.opacity < 1.0;
                }
                this.onOpacityChanged(this.opacity);
                break;
            case 'blendMode':
                this.setBlendMode(String(value));
                break;
            case 'zOffset':
                this.zOffset = Number(value);
                if (this.mesh) {
                    this.mesh.position.z = this.zOffset;
                }
                break;
        }
    }

    /**
     * Get a parameter value
     * @param {string} name - Parameter name
     * @returns {*} Parameter value
     */
    getParameter(name) {
        if (this.disposed) return null;
        
        try {
            return this.onGetParameter(name);
        } catch (error) {
            console.error(`Error getting parameter ${name} from layer ${this.id}:`, error);
            return null;
        }
    }

    /**
     * Abstract method for layer-specific parameter getting
     * @param {string} name - Parameter name
     * @returns {*} Parameter value
     */
    onGetParameter(name) {
        // Handle common parameters with direct Three.js property access
        switch (name) {
            case 'visible':
                return this.mesh ? this.mesh.visible : this.visible;
            case 'opacity':
                return this.mesh && this.mesh.material ? this.mesh.material.opacity : this.opacity;
            case 'blendMode':
                return this.blendMode;
            case 'zOffset':
                return this.mesh ? this.mesh.position.z : this.zOffset;
            default:
                return this.parameterCache.get(name);
        }
    }

    /**
     * Get all exposed parameters for this layer
     * @returns {Object} Object with parameter names as keys and metadata as values
     */
    getExposedParameters() {
        if (this.disposed) return {};
        
        try {
            return this.onGetExposedParameters();
        } catch (error) {
            console.error(`Error getting exposed parameters for layer ${this.id}:`, error);
            return {};
        }
    }

    /**
     * Abstract method for layer-specific exposed parameters
     * @returns {Object} Object with parameter names as keys and metadata as values
     */
    onGetExposedParameters() {
        return {
            visible: {
                type: 'boolean',
                label: 'Visible',
                description: 'Show or hide this layer',
                default: true
            },
            opacity: {
                type: 'number',
                label: 'Opacity',
                description: 'Layer transparency (0.0 to 1.0)',
                min: 0.0,
                max: 1.0,
                step: 0.01,
                default: 1.0
            },
            blendMode: {
                type: 'select',
                label: 'Blend Mode',
                description: 'How this layer blends with layers below',
                options: getBlendModeOptions(),
                default: BLEND_MODES.NORMAL
            },
            zOffset: {
                type: 'number',
                label: 'Z Offset',
                description: 'Distance from camera in 3D space',
                min: -1000,
                max: 1000,
                step: 1,
                default: 0
            }
        };
    }

    /**
     * Handle visibility changes
     * @param {boolean} isVisible - New visibility state
     */
    onVisibilityChanged(isVisible) {
        if (isVisible && !this.initialized) {
            // Re-initialize if becoming visible and not initialized
            this.initialize(this.context).catch(error => {
                console.error(`Failed to initialize layer ${this.id} on visibility change:`, error);
            });
        }
        
        // Update any internal state that depends on visibility
        this.updateVisibilityState(isVisible);
    }
    
    /**
     * Update internal state based on visibility
     * @param {boolean} isVisible - Current visibility state
     */
    updateVisibilityState(isVisible) {
        // Override in subclasses if needed
    }

    /**
     * Handle opacity changes
     * @param {number} newOpacity - New opacity value (0.0 to 1.0)
     */
    onOpacityChanged(newOpacity) {
        // Update material opacity if available
        if (this.mesh && this.mesh.material) {
            const material = Array.isArray(this.mesh.material) 
                ? this.mesh.material[0] 
                : this.mesh.material;
                
            if (material) {
                material.opacity = newOpacity;
                material.transparent = newOpacity < 1.0;
                material.needsUpdate = true;
            }
        }
        
        // Override in subclasses for additional opacity handling
        this.updateOpacityState(newOpacity);
    }
    
    /**
     * Update internal state based on opacity - override in subclasses
     * @param {number} newOpacity - Current opacity value
     */
    updateOpacityState(newOpacity) {
        // Override in subclasses if needed
    }

    /**
     * Get layer configuration for serialization
     * @returns {Object} Layer configuration object
     */
    getConfig() {
        return {
            id: this.id,
            type: this.constructor.name,
            visible: this.visible,
            opacity: this.opacity,
            blendMode: this.blendMode,
            zOffset: this.zOffset,
            ...this.onGetConfig()
        };
    }

    /**
     * Abstract method for layer-specific configuration
     * @returns {Object} Layer-specific configuration
     */
    onGetConfig() {
        return {};
    }

    /**
     * Set layer configuration from serialization
     * @param {Object} config - Layer configuration object
     */
    setConfig(config) {
        if (config.visible !== undefined) this.visible = config.visible;
        if (config.opacity !== undefined) this.opacity = config.opacity;
        if (config.blendMode !== undefined) this.blendMode = config.blendMode;
        if (config.zOffset !== undefined) this.zOffset = config.zOffset;
        
        this.onSetConfig(config);
    }

    /**
     * Abstract method for layer-specific configuration setting
     * @param {Object} config - Layer configuration object
     */
    onSetConfig(config) {
        // Optional override
    }

    /**
     * Get layer performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            id: this.id,
            type: this.constructor.name,
            renderCount: this.renderCount,
            lastRenderTime: this.lastRenderTime,
            visible: this.visible,
            initialized: this.initialized,
            disposed: this.disposed
        };
    }

    /**
     * Get z-offset value
     * @returns {number} Z-offset value
     */
    getZOffset() {
        return this.zOffset;
    }

    /**
     * Set z-offset value
     * @param {number} zOffset - New z-offset value
     */
    setZOffset(zOffset) {
        this.zOffset = zOffset;
    }

    /**
     * Set blend mode and update material if available
     * @param {string} blendMode - New blend mode
     */
    setBlendMode(blendMode) {
        if (this.blendMode === blendMode) return;
        
        this.blendMode = blendMode;
        this.needsBlendModeUpdate = true;
        
        // Apply to material immediately if available
        this.applyBlendModeToMaterial();
        
        // Also apply to all child objects immediately
        this.applyBlendModeToChildren();
        
        // Notify subclasses of blend mode change
        this.onBlendModeChanged(blendMode);
    }

    /**
     * Apply current blend mode to the layer's material
     */
    applyBlendModeToMaterial() {
        if (!this.mesh || !this.mesh.material) return;
        
        const material = Array.isArray(this.mesh.material) 
            ? this.mesh.material[0] 
            : this.mesh.material;
            
        if (material) {
            applyBlendModeToMaterial(material, this.blendMode);
            this.needsBlendModeUpdate = false;
        }
        
        // Also apply blend mode to all child objects automatically
        this.applyBlendModeToChildren();
    }

    /**
     * Apply blend mode to all child objects in the layer
     * This ensures all objects within a layer inherit the parent's blend mode
     */
    applyBlendModeToChildren() {
        if (!this.blendMode || this.blendMode === 'normal') return;
        
        // Get all child objects from the layer
        const childObjects = this.getChildObjects();
        
        if (childObjects.length > 0) {
            console.log(`LayerBase ${this.id}: Applying ${this.blendMode} blend mode to ${childObjects.length} child objects`);
            
            childObjects.forEach(obj => {
                if (obj.material) {
                    const material = Array.isArray(obj.material) ? obj.material[0] : obj.material;
                    if (material) {
                        applyBlendModeToMaterial(material, this.blendMode);
                    }
                }
            });
        }
    }

    /**
     * Get all child objects that should inherit the layer's blend mode
     * Override this method in subclasses to return the actual objects
     * @returns {Array} Array of objects with materials
     */
    getChildObjects() {
        // Default implementation - override in subclasses
        return [];
    }



    /**
     * Called when blend mode changes - override in subclasses
     * @param {string} newBlendMode - The new blend mode
     */
    onBlendModeChanged(newBlendMode) {
        // Override in subclasses if needed
        console.log(`LayerBase ${this.id}: Blend mode changed to ${newBlendMode}`);
    }


}
