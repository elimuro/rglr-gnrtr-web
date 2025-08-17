/**
 * LayerBase.js - Enhanced Abstract Base Class for All Layers
 * This module provides the foundation for all layer types in the layer system.
 * Enhanced to support Three.js mesh integration, 3D positioning, and advanced layer management.
 * It defines the common interface, lifecycle methods, and state management that all layers must implement.
 */

import * as THREE from 'three';

export class LayerBase {
    constructor(id, config = {}) {
        this.id = id;
        this.visible = config.visible !== undefined ? config.visible : true;
        this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
        this.blendMode = config.blendMode || 'normal';
        this.zOffset = config.zOffset !== undefined ? config.zOffset : 0; // Z-space distance from camera
        this.renderTarget = null;
        
        // Enhanced: Three.js integration
        this.mesh = null; // THREE.Mesh for this layer
        this.geometry = null; // THREE.Geometry for this layer
        this.material = null; // THREE.Material for this layer
        this.texture = null; // THREE.Texture for this layer (if applicable)
        
        // 3D transformation properties
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.scale = new THREE.Vector3(1, 1, 1);
        
        // Layer state
        this.initialized = false;
        this.disposed = false;
        
        // Performance tracking
        this.lastRenderTime = 0;
        this.renderCount = 0;
        
        // Parameter cache for performance
        this.parameterCache = new Map();
        
        // Event listeners
        this.eventListeners = [];
        
        // Layer manager reference (set by LayerManager)
        this.layerManager = null;
    }

    /**
     * Initialize the layer
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async initialize(context) {
        if (this.initialized || this.disposed) return;
        
        try {
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
     * Dispose of the layer and clean up resources (enhanced with Three.js cleanup)
     */
    dispose() {
        if (this.disposed) return;
        
        try {
            this.onDispose();
            
            // Enhanced: Clean up Three.js resources
            if (this.texture) {
                this.texture.dispose();
                this.texture = null;
            }
            
            if (this.material) {
                this.material.dispose();
                this.material = null;
            }
            
            if (this.geometry) {
                this.geometry.dispose();
                this.geometry = null;
            }
            
            // Note: mesh cleanup is handled by LayerManager when removing from scene
            this.mesh = null;
            
            // Clean up event listeners
            this.eventListeners.forEach(({ element, event, handler }) => {
                if (element && element.removeEventListener) {
                    element.removeEventListener(event, handler);
                }
            });
            this.eventListeners = [];
            
            // Clear parameter cache
            this.parameterCache.clear();
            
            this.disposed = true;
            this.initialized = false;
            
            console.log(`LayerBase: Disposed layer ${this.id} with Three.js cleanup`);
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
            this.parameterCache.set(name, value);
        } catch (error) {
            console.error(`Error setting parameter ${name} on layer ${this.id}:`, error);
        }
    }

    /**
     * Abstract method for layer-specific parameter setting
     * @param {string} name - Parameter name
     * @param {*} value - Parameter value
     */
    onSetParameter(name, value) {
        // Handle common parameters
        switch (name) {
            case 'visible':
                this.visible = Boolean(value);
                this.onVisibilityChanged(this.visible);
                break;
            case 'opacity':
                this.opacity = Math.max(0.0, Math.min(1.0, Number(value)));
                break;
            case 'blendMode':
                this.blendMode = String(value);
                break;
            case 'zOffset':
                this.zOffset = Number(value);
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
        // Handle common parameters
        switch (name) {
            case 'visible':
                return this.visible;
            case 'opacity':
                return this.opacity;
            case 'blendMode':
                return this.blendMode;
            case 'zOffset':
                return this.zOffset;
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
                options: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'],
                default: 'normal'
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
     * Set z-offset value (enhanced with mesh support)
     * @param {number} zOffset - New z-offset value
     */
    setZOffset(zOffset) {
        this.zOffset = zOffset;
        
        // Enhanced: Update mesh position if available
        if (this.mesh) {
            // Note: LayerManager handles z-positioning, this is for manual override
            this.mesh.position.z = -zOffset; // Negative for proper depth ordering
        }
    }

    /**
     * Set 3D position for this layer
     * @param {number|Object} x - X position or position object {x, y, z}
     * @param {number} y - Y position (if x is number)
     * @param {number} z - Z position (if x is number)
     */
    setPosition(x, y, z) {
        if (typeof x === 'object') {
            // Object notation: setPosition({x: 1, y: 2, z: 3})
            if (x.x !== undefined) this.position.x = x.x;
            if (x.y !== undefined) this.position.y = x.y;
            if (x.z !== undefined) this.position.z = x.z;
        } else {
            // Individual parameters: setPosition(1, 2, 3)
            if (x !== undefined) this.position.x = x;
            if (y !== undefined) this.position.y = y;
            if (z !== undefined) this.position.z = z;
        }
        
        // Update mesh if available
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    /**
     * Set 3D rotation for this layer
     * @param {number|Object} x - X rotation or rotation object {x, y, z}
     * @param {number} y - Y rotation (if x is number)
     * @param {number} z - Z rotation (if x is number)
     */
    setRotation(x, y, z) {
        if (typeof x === 'object') {
            // Object notation: setRotation({x: 0, y: Math.PI/2, z: 0})
            if (x.x !== undefined) this.rotation.x = x.x;
            if (x.y !== undefined) this.rotation.y = x.y;
            if (x.z !== undefined) this.rotation.z = x.z;
        } else {
            // Individual parameters: setRotation(0, Math.PI/2, 0)
            if (x !== undefined) this.rotation.x = x;
            if (y !== undefined) this.rotation.y = y;
            if (z !== undefined) this.rotation.z = z;
        }
        
        // Update mesh if available
        if (this.mesh) {
            this.mesh.rotation.copy(this.rotation);
        }
    }

    /**
     * Set 3D scale for this layer
     * @param {number|Object} x - X scale or scale object {x, y, z}
     * @param {number} y - Y scale (if x is number)
     * @param {number} z - Z scale (if x is number)
     */
    setScale(x, y, z) {
        if (typeof x === 'object') {
            // Object notation: setScale({x: 2, y: 2, z: 1})
            if (x.x !== undefined) this.scale.x = x.x;
            if (x.y !== undefined) this.scale.y = x.y;
            if (x.z !== undefined) this.scale.z = x.z;
        } else if (typeof x === 'number' && y === undefined && z === undefined) {
            // Uniform scale: setScale(2)
            this.scale.set(x, x, x);
        } else {
            // Individual parameters: setScale(2, 2, 1)
            if (x !== undefined) this.scale.x = x;
            if (y !== undefined) this.scale.y = y;
            if (z !== undefined) this.scale.z = z;
        }
        
        // Update mesh if available
        if (this.mesh) {
            this.mesh.scale.copy(this.scale);
        }
    }

    /**
     * Get current 3D position
     * @returns {THREE.Vector3} Current position
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * Get current 3D rotation
     * @returns {THREE.Euler} Current rotation
     */
    getRotation() {
        return this.rotation.clone();
    }

    /**
     * Get current 3D scale
     * @returns {THREE.Vector3} Current scale
     */
    getScale() {
        return this.scale.clone();
    }

    /**
     * Add event listener with automatic cleanup
     * @param {Element} element - DOM element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    addEventListener(element, event, handler) {
        if (element && element.addEventListener) {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
        }
    }

    /**
     * Remove event listener
     * @param {Element} element - DOM element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    removeEventListener(element, event, handler) {
        if (element && element.removeEventListener) {
            element.removeEventListener(event, handler);
        }
        
        const index = this.eventListeners.findIndex(
            listener => listener.element === element && 
                       listener.event === event && 
                       listener.handler === handler
        );
        
        if (index !== -1) {
            this.eventListeners.splice(index, 1);
        }
    }
}
