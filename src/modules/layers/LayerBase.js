/**
 * LayerBase.js - Abstract Base Class for All Layers
 * This module provides the foundation for all layer types in the layer system.
 * It defines the common interface, lifecycle methods, and state management
 * that all layers must implement.
 */

import * as THREE from 'three';

export class LayerBase {
    constructor(id, config = {}) {
        this.id = id;
        this.visible = config.visible !== undefined ? config.visible : true;
        this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
        this.blendMode = config.blendMode || 'normal';
        this.renderTarget = null;
        
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
        if (!this.visible || !this.initialized || this.disposed) return;
        
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
        // Optional override
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
        // Optional override
        return this.parameterCache.get(name);
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
        return {};
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
