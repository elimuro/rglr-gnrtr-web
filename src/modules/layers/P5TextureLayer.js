/**
 * P5TextureLayer.js - P5.js Texture Layer Implementation
 * This layer renders p5.js sketches to off-screen canvases and applies them as textures
 * to Three.js planes. It preserves all existing P5Layer functionality while integrating
 * seamlessly with the Three.js layer system for better performance and 3D capabilities.
 */

import * as THREE from 'three';
import { LayerBase } from './LayerBase.js';

export class P5TextureLayer extends LayerBase {
    constructor(id, config = {}) {
        super(id, config);
        
        // P5 rendering properties
        this.p5Instance = null;
        this.offscreenCanvas = null;
        this.canvasContext = null;
        
        // Layer dimensions
        this.width = config.width || window.innerWidth;
        this.height = config.height || window.innerHeight;
        
        // Preserve existing P5Layer properties for compatibility
        this.parameters = new Map(); // name -> { value, min, max, step, label, defaultValue }
        this.exposedParameters = {}; // for LayerBase compatibility
        
        // Sketch code and state
        this.sketchCode = config.code || '';
        this.isRunning = false;
        this.hasError = false;
        this.lastError = null;
        
        // Runtime helpers
        this.p5ParamHelper = null;
        
        // Performance settings
        this.targetFPS = config.targetFPS || 60;
        this.pauseWhenHidden = config.pauseWhenHidden !== undefined ? config.pauseWhenHidden : true;
        
        // Texture update tracking
        this.needsTextureUpdate = false;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.targetFPS;
    }

    /**
     * Get default p5 sketch code
     * @returns {Promise<string>} Default sketch code loaded from file
     */
    async getDefaultSketch() {
        try {
            const response = await fetch('/sketches/default-sketch.js');
            if (!response.ok) {
                throw new Error(`Failed to load default sketch: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.warn('Failed to load default sketch file, using fallback:', error);
            // Fallback to a minimal sketch if file loading fails
            return `function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(0, 20);
  
  // Simple animated circle
  const hue = (frameCount * 2) % 360;
  fill(hue, 80, 100);
  noStroke();
  
  const x = width/2 + cos(frameCount * 0.02) * 100;
  const y = height/2 + sin(frameCount * 0.02) * 100;
  circle(x, y, 50);
}`;
        }
    }

    /**
     * Initialize the P5TextureLayer
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async onInitialize(context) {
        try {
            console.log(`P5TextureLayer ${this.id}: Initializing...`);
            
            // Load p5.js if not already loaded
            await this.loadP5();
            
            // Create Three.js components first
            await this.createThreeJSComponents();
            
            // Create the p5Param helper
            this.createP5ParamHelper();
            
            // Load default sketch if none provided
            if (!this.sketchCode) {
                this.sketchCode = await this.getDefaultSketch();
            }
            
            // Compile and run the initial sketch
            await this.compileAndRun(this.sketchCode);
            
            console.log(`P5TextureLayer ${this.id}: Initialized successfully`);
            
        } catch (error) {
            console.error(`Failed to initialize P5TextureLayer ${this.id}:`, error);
            this.hasError = true;
            this.lastError = error.message;
            throw error;
        }
    }

    /**
     * Create Three.js components (texture, material, geometry, mesh)
     */
    async createThreeJSComponents() {
        // Create off-screen canvas for P5 rendering
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.width;
        this.offscreenCanvas.height = this.height;
        this.canvasContext = this.offscreenCanvas.getContext('2d');
        
        // Create Three.js texture from canvas
        this.texture = new THREE.CanvasTexture(this.offscreenCanvas);
        this.texture.flipY = false; // P5 canvas is already correctly oriented
        this.texture.format = THREE.RGBAFormat;
        this.texture.generateMipmaps = false;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        
        // Create material with texture
        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            opacity: this.opacity,
            alphaTest: 0.01, // Avoid rendering completely transparent pixels
            side: THREE.DoubleSide // Visible from both sides
        });
        
        // Create plane geometry (sized for 2D-like appearance)
        const aspectRatio = this.width / this.height;
        const baseSize = 10; // Base size in 3D units
        this.geometry = new THREE.PlaneGeometry(
            baseSize * aspectRatio,
            baseSize
        );
        
        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.userData.layerId = this.id;
        this.mesh.userData.layerType = 'P5TextureLayer';
        
        // Position for 2D-like appearance (facing camera)
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        this.mesh.scale.copy(this.scale);
        
        console.log(`P5TextureLayer ${this.id}: Created Three.js components (${this.width}x${this.height})`);
    }

    /**
     * Load p5.js library
     */
    async loadP5() {
        // Check if p5 is already loaded
        if (typeof window.p5 !== 'undefined') {
            console.log('P5TextureLayer: p5.js already loaded, version:', window.p5.VERSION);
            return;
        }
        
        console.log('P5TextureLayer: Loading p5.js from CDN...');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js';
            script.onload = () => {
                console.log('P5TextureLayer: p5.js loaded successfully, version:', window.p5?.VERSION);
                // Wait a moment for p5 to fully initialize
                setTimeout(() => resolve(), 100);
            };
            script.onerror = () => {
                console.error('P5TextureLayer: Failed to load p5.js from CDN');
                reject(new Error('Failed to load p5.js'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Create the p5Param helper function
     */
    createP5ParamHelper() {
        this.p5ParamHelper = (name, defaultValue, options = {}) => {
            // Register parameter if not already registered
            if (!this.parameters.has(name)) {
                this.registerParam(name, {
                    defaultValue,
                    min: options.min,
                    max: options.max,
                    step: options.step,
                    label: options.label || name
                });
            }
            
            // Return current value
            const param = this.parameters.get(name);
            return param ? param.value : defaultValue;
        };
    }

    /**
     * Register a parameter
     * @param {string} name - Parameter name
     * @param {Object} config - Parameter configuration
     */
    registerParam(name, config) {
        const param = {
            value: config.defaultValue,
            defaultValue: config.defaultValue,
            min: config.min,
            max: config.max,
            step: config.step,
            label: config.label || name
        };
        
        this.parameters.set(name, param);
        
        // Update exposed parameters for LayerBase compatibility
        this.exposedParameters[name] = {
            type: 'number',
            min: param.min,
            max: param.max,
            default: param.defaultValue,
            description: param.label
        };
        
        console.log(`P5TextureLayer ${this.id}: Registered parameter: ${name}`, param);
    }
    
    /**
     * Refresh MIDI control dropdowns with current P5 parameters
     */
    refreshMIDIControls() {
        // Access the app through the layer manager
        const app = this.layerManager?.app;
        if (app && app.controlManager) {
            // Use setTimeout to ensure parameters are fully registered before refresh
            setTimeout(() => {
                app.controlManager.refreshP5Parameters();
            }, 100);
        }
    }

    /**
     * Compile and run p5 sketch
     * @param {string} code - Sketch code
     */
    async compileAndRun(code) {
        try {
            console.log(`P5TextureLayer ${this.id}: Compiling sketch...`);
            
            // Stop existing sketch
            this.stop();
            
            // Clear previous parameters
            this.parameters.clear();
            this.exposedParameters = {};
            
            // Store code
            this.sketchCode = code;
            
            // Clear previous error
            this.hasError = false;
            this.lastError = null;
            
            // Create sketch function that renders to off-screen canvas
            const sketchFunction = this.createSketchFunction(code);
            
            // Create p5 instance with off-screen canvas
            this.p5Instance = new window.p5(sketchFunction, this.offscreenCanvas);
            
            this.isRunning = true;
            
            // Refresh MIDI parameter dropdowns after compilation
            this.refreshMIDIControls();
            
            console.log(`P5TextureLayer ${this.id}: Sketch compiled and running`);
            
        } catch (error) {
            console.error(`Failed to compile P5 sketch:`, error);
            this.hasError = true;
            this.lastError = error.message;
            throw error;
        }
    }

    /**
     * Create sketch function with injected helpers
     * @param {string} code - Sketch code
     * @returns {Function} Sketch function
     */
    createSketchFunction(code) {
        return (p) => {
            // Store reference to p5 instance
            this.p5Canvas = p;
            
            // Inject p5Param helper into global scope for this sketch
            const originalP5Param = window.p5Param;
            window.p5Param = this.p5ParamHelper;
            
            try {
                // Create a function that properly defines setup and draw on the p5 instance
                const sketchFunc = new Function('p', 'p5Param', `
                    // Execute the user's sketch code within the p5 context
                    with(p) {
                        ${code}
                        
                        // Ensure setup and draw are assigned to p5 instance
                        if (typeof setup !== 'undefined') p.setup = setup;
                        if (typeof draw !== 'undefined') p.draw = draw;
                        if (typeof mousePressed !== 'undefined') p.mousePressed = mousePressed;
                        if (typeof keyPressed !== 'undefined') p.keyPressed = keyPressed;
                        if (typeof windowResized !== 'undefined') p.windowResized = windowResized;
                    }
                `);
                
                // Execute the sketch function
                sketchFunc.call(this, p, this.p5ParamHelper);
                
                // Override draw to update Three.js texture
                const originalDraw = p.draw;
                p.draw = () => {
                    // Throttle updates based on target FPS
                    const now = performance.now();
                    if (now - this.lastFrameTime >= this.frameInterval) {
                        if (originalDraw) {
                            originalDraw.call(p);
                        }
                        
                        // Mark texture for update
                        this.needsTextureUpdate = true;
                        this.lastFrameTime = now;
                    }
                };
                
                // Override setup to ensure proper canvas size
                const originalSetup = p.setup;
                p.setup = () => {
                    if (originalSetup) {
                        originalSetup.call(p);
                    } else {
                        // Default setup if none provided
                        p.createCanvas(this.width, this.height);
                    }
                    
                    // Ensure canvas matches our dimensions
                    if (p.canvas.width !== this.width || p.canvas.height !== this.height) {
                        p.resizeCanvas(this.width, this.height);
                    }
                };
                
            } catch (error) {
                console.error('Error creating P5 sketch function:', error);
                this.hasError = true;
                this.lastError = error.message;
            } finally {
                // Restore original p5Param
                if (originalP5Param) {
                    window.p5Param = originalP5Param;
                } else {
                    delete window.p5Param;
                }
            }
        };
    }

    /**
     * Stop the current sketch
     */
    stop() {
        if (this.p5Instance) {
            try {
                this.p5Instance.remove();
            } catch (error) {
                console.warn(`P5TextureLayer ${this.id}: Error removing p5 instance:`, error);
            }
            this.p5Instance = null;
            this.p5Canvas = null;
        }
        
        this.isRunning = false;
    }

    /**
     * Render the P5TextureLayer (updates texture from p5 canvas)
     */
    onRender2D(renderer, camera, deltaTime) {
        // Update Three.js texture if p5 has drawn a new frame
        if (this.needsTextureUpdate && this.texture && this.p5Instance) {
            this.texture.needsUpdate = true;
            this.needsTextureUpdate = false;
        }
        
        // Update material properties
        if (this.material) {
            this.material.opacity = this.opacity;
            this.material.visible = this.visible;
        }
        
        // Update mesh visibility
        if (this.mesh) {
            this.mesh.visible = this.visible;
        }
    }

    /**
     * Update the P5TextureLayer
     */
    onUpdate(deltaTime) {
        // P5 handles its own update loop
        // We could add performance monitoring here if needed
    }

    /**
     * Handle visibility changes
     * @param {boolean} isVisible - New visibility state
     */
    onVisibilityChanged(isVisible) {
        // Update mesh visibility
        if (this.mesh) {
            this.mesh.visible = isVisible;
        }
        
        if (this.material) {
            this.material.visible = isVisible;
        }
        
        // Pause/resume P5 sketch based on visibility
        if (this.pauseWhenHidden) {
            if (isVisible) {
                this.resumeSketch();
            } else {
                this.pauseSketch();
            }
        }
        
        // Call parent method
        super.onVisibilityChanged(isVisible);
    }

    /**
     * Pause the P5 sketch
     */
    pauseSketch() {
        if (this.p5Instance && typeof this.p5Instance.noLoop === 'function') {
            this.p5Instance.noLoop();
        } else {
            console.warn(`P5TextureLayer ${this.id}: p5Instance or noLoop not available to pause sketch.`);
        }
    }

    /**
     * Resume the P5 sketch
     */
    resumeSketch() {
        if (this.p5Instance && typeof this.p5Instance.loop === 'function') {
            this.p5Instance.loop();
        } else {
            console.warn(`P5TextureLayer ${this.id}: p5Instance or loop not available to resume sketch.`);
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        if (this.width !== newWidth || this.height !== newHeight) {
            this.width = newWidth;
            this.height = newHeight;
            
            // Resize off-screen canvas
            if (this.offscreenCanvas) {
                this.offscreenCanvas.width = this.width;
                this.offscreenCanvas.height = this.height;
            }
            
            // Resize P5 canvas
            if (this.p5Canvas && typeof this.p5Canvas.resizeCanvas === 'function') {
                this.p5Canvas.resizeCanvas(this.width, this.height);
            }
            
            // Update Three.js geometry
            if (this.geometry) {
                this.geometry.dispose();
                const aspectRatio = this.width / this.height;
                const baseSize = 10;
                this.geometry = new THREE.PlaneGeometry(
                    baseSize * aspectRatio,
                    baseSize
                );
                this.mesh.geometry = this.geometry;
            }
            
            // Update texture
            if (this.texture) {
                this.texture.needsUpdate = true;
            }
            
            console.log(`P5TextureLayer ${this.id}: Resized to ${this.width}x${this.height}`);
        }
    }

    /**
     * Set parameter value
     */
    onSetParameter(name, value) {
        // Handle base layer parameters
        super.onSetParameter(name, value);
        
        // Handle P5-specific parameters
        const param = this.parameters.get(name);
        if (param) {
            // Convert normalized value (0-1) to parameter range if min/max are specified
            let actualValue = value;
            if (param.min !== undefined && param.max !== undefined) {
                // Assume incoming value is normalized (0-1) and convert to parameter range
                actualValue = param.min + (value * (param.max - param.min));
            }
            
            // Clamp value to range if specified
            if (param.min !== undefined && actualValue < param.min) actualValue = param.min;
            if (param.max !== undefined && actualValue > param.max) actualValue = param.max;
            
            param.value = actualValue;
            console.log(`P5TextureLayer ${this.id}: Parameter ${name} set to ${actualValue} (from normalized ${value})`);
        }
    }

    /**
     * Get parameter value
     */
    onGetParameter(name) {
        // Check base layer parameters first
        const baseValue = super.onGetParameter(name);
        if (baseValue !== undefined) {
            return baseValue;
        }
        
        // Check P5-specific parameters
        const param = this.parameters.get(name);
        return param ? param.value : null;
    }

    /**
     * Get exposed parameters
     */
    onGetExposedParameters() {
        // Combine base layer parameters with P5-specific parameters
        return {
            ...super.onGetExposedParameters(),
            ...this.exposedParameters
        };
    }

    /**
     * Get layer configuration
     */
    onGetConfig() {
        const config = {
            code: this.sketchCode,
            targetFPS: this.targetFPS,
            pauseWhenHidden: this.pauseWhenHidden,
            width: this.width,
            height: this.height,
            parameters: Object.fromEntries(this.parameters)
        };
        
        return config;
    }

    /**
     * Set layer configuration
     */
    onSetConfig(config) {
        if (config.code && config.code !== this.sketchCode) {
            this.compileAndRun(config.code);
        }
        
        if (config.targetFPS) {
            this.targetFPS = config.targetFPS;
            this.frameInterval = 1000 / this.targetFPS;
        }
        
        if (config.pauseWhenHidden !== undefined) {
            this.pauseWhenHidden = config.pauseWhenHidden;
        }
        
        if (config.width && config.height) {
            this.width = config.width;
            this.height = config.height;
            this.onWindowResize(); // Update canvas and geometry
        }
        
        if (config.parameters) {
            Object.entries(config.parameters).forEach(([name, paramConfig]) => {
                if (paramConfig && typeof paramConfig === 'object') {
                    this.parameters.set(name, paramConfig);
                }
            });
        }
    }

    /**
     * Dispose of the P5TextureLayer
     */
    onDispose() {
        console.log(`P5TextureLayer ${this.id}: Disposing...`);
        
        this.stop();
        this.parameters.clear();
        this.exposedParameters = {};
        
        // Three.js cleanup is handled by parent LayerBase.dispose()
        console.log(`P5TextureLayer ${this.id}: Disposed`);
    }

    /**
     * Get all registered parameters
     */
    getAllParameters() {
        return Object.fromEntries(this.parameters);
    }

    /**
     * Get sketch code
     */
    getSketchCode() {
        return this.sketchCode || '';
    }
    
    /**
     * Get default sketch code (async version)
     */
    async getDefaultSketchCode() {
        return await this.getDefaultSketch();
    }
    
    /**
     * Get current sketch code (alias for getSketchCode for consistency)
     */
    getCurrentSketchCode() {
        return this.getSketchCode();
    }
    
    /**
     * Get current sketch code (async version that loads default if needed)
     */
    async getCurrentSketchCodeAsync() {
        if (!this.sketchCode) {
            return await this.getDefaultSketch();
        }
        return this.sketchCode;
    }

    /**
     * Check if sketch has error
     */
    hasSketchError() {
        return this.hasError;
    }

    /**
     * Get last error message
     */
    getLastError() {
        return this.lastError;
    }

    /**
     * Check if sketch is running
     */
    isSketchRunning() {
        return this.isRunning;
    }
}