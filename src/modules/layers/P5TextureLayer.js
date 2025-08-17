/**
 * P5TextureLayer.js - P5.js Texture Layer Implementation
 * This layer renders p5.js sketches to an off-screen canvas and applies the result
 * as a texture to a 3D plane in the Three.js scene. This replaces the DOM overlay
 * approach with a unified Three.js rendering pipeline.
 */

import { LayerBase } from './LayerBase.js';
import * as THREE from 'three';
import p5 from 'p5';

export class P5TextureLayer extends LayerBase {
    constructor(id, config = {}) {
        super(id, config);
        
        // P5 instance and off-screen rendering
        this.p5Instance = null;
        this.offscreenCanvas = null;
        this.texture = null;
        this.material = null;
        // this.mesh inherited from LayerBase
        
        // Parameter registry
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
        
        // Canvas dimensions (will be set from camera viewport)
        this.canvasWidth = 800;
        this.canvasHeight = 600;
    }

    /**
     * Get default p5 sketch code
     * @returns {Promise<string>} Default sketch code loaded from file
     */
    async getDefaultSketchCode() {
        try {
            console.log('P5TextureLayer: Attempting to load default sketch from /sketches/default-sketch.js');
            const response = await fetch('/sketches/default-sketch.js');
            console.log('P5TextureLayer: Fetch response:', response.status, response.statusText);
            if (response.ok) {
                const code = await response.text();
                console.log('P5TextureLayer: Loaded default sketch code, length:', code.length);
                return code;
            } else {
                console.warn('P5TextureLayer: Failed to load default sketch, using fallback');
            }
        } catch (error) {
            console.warn('P5TextureLayer: Could not load default sketch:', error);
        }
        
        // Fallback default sketch - VERY SIMPLE TEST
        console.log('P5TextureLayer: Using fallback sketch');
        return `
function setup() {
    console.log('P5 SKETCH: Setup called!');
    createCanvas(windowWidth, windowHeight);
    console.log('P5 SKETCH: Canvas created, size:', width, height);
    background(255, 0, 0); // Bright red background
    console.log('P5 SKETCH: Red background set');
}

function draw() {
    if (frameCount < 5) {
        console.log('P5 SKETCH: Draw called, frame:', frameCount);
    }
    
    // Very simple - just fill with bright colors
    background(255, 0, 0); // Red
    fill(0, 255, 0); // Green
    ellipse(width/2, height/2, 200, 200);
    
    fill(255, 255, 0); // Yellow
    ellipse(width/2, height/2, 100, 100);
    
    if (frameCount < 5) {
        console.log('P5 SKETCH: Draw complete, frame:', frameCount);
    }
}
        `.trim();
    }

    /**
     * Initialize the P5 texture layer
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async onInitialize(context) {
        console.log('P5TextureLayer: Initializing layer', this.id);
        
        // Calculate canvas dimensions from camera viewport
        this.calculateCanvasDimensions();
        
        // Create off-screen canvas
        this.createOffscreenCanvas();
        
        // Create Three.js components
        await this.createThreeJSComponents();
        
        // Load sketch code if not provided
        if (!this.sketchCode) {
            this.sketchCode = await this.getDefaultSketchCode();
            console.log('P5TextureLayer: Loaded default sketch code, length:', this.sketchCode.length);
        } else {
            console.log('P5TextureLayer: Using provided sketch code, length:', this.sketchCode.length);
        }
        
        // Initialize p5 instance
        await this.initializeP5Instance();
        
        console.log('P5TextureLayer: Initialization complete');
    }

    /**
     * Calculate canvas dimensions from camera viewport
     */
    calculateCanvasDimensions() {
        if (this.context && this.context.camera && this.context.camera.isOrthographicCamera) {
            // Use camera viewport for orthographic cameras
            const cam = this.context.camera;
            this.canvasWidth = Math.abs(cam.right - cam.left) * 100; // Scale up for better resolution
            this.canvasHeight = Math.abs(cam.top - cam.bottom) * 100;
        } else if (this.context && this.context.renderer) {
            // Use renderer size for perspective cameras
            const size = this.context.renderer.getSize(new THREE.Vector2());
            this.canvasWidth = size.x;
            this.canvasHeight = size.y;
        }
        
        console.log(`P5TextureLayer: Canvas dimensions: ${this.canvasWidth}x${this.canvasHeight}`);
    }

    /**
     * Create off-screen canvas for P5 rendering
     */
    createOffscreenCanvas() {
        // Create a div container for P5 to attach to
        this.p5Container = document.createElement('div');
        this.p5Container.style.display = 'none';
        this.p5Container.style.position = 'absolute';
        this.p5Container.style.left = '-9999px';
        document.body.appendChild(this.p5Container);
        
        // Also create our texture canvas
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvasWidth;
        this.offscreenCanvas.height = this.canvasHeight;
        this.offscreenCanvas.style.display = 'none';
        
        // Set willReadFrequently for better performance when copying canvas data
        const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
        
        console.log('P5TextureLayer: Off-screen canvas and container created');
        console.log('P5TextureLayer: Canvas dimensions set to:', this.offscreenCanvas.width, 'x', this.offscreenCanvas.height);
    }

    /**
     * Create Three.js texture, material, and mesh
     */
    async createThreeJSComponents() {
        try {
            // Create texture from off-screen canvas
            this.texture = new THREE.CanvasTexture(this.offscreenCanvas);
            this.texture.flipY = true; // Fix upside down issue - P5 and Three.js have different Y coordinates
            this.texture.needsUpdate = true;
            
            console.log('P5TextureLayer: Texture created from canvas:', this.offscreenCanvas);
            console.log('P5TextureLayer: Canvas has context:', !!this.offscreenCanvas.getContext('2d'));
            
            // Create material with the texture
            this.material = new THREE.MeshBasicMaterial({
                map: this.texture, // Re-enable texture
                transparent: true,
                opacity: this.opacity,
                side: THREE.DoubleSide, // Ensure it's visible from both sides
                // Remove color so texture shows through
                // color: 0xff0000 
            });
            
            // Apply initial blend mode
            this.applyBlendModeToMaterial();
            
            // Create geometry sized to camera viewport
            let geometry;
            if (this.context && this.context.camera && this.context.camera.isOrthographicCamera) {
                const cam = this.context.camera;
                const widthWorld = Math.abs(cam.right - cam.left);
                const heightWorld = Math.abs(cam.top - cam.bottom);
                
                console.log('P5TextureLayer: Camera bounds - width:', widthWorld, 'height:', heightWorld);
                console.log('P5TextureLayer: Camera position:', cam.position);
                
                // Make the plane slightly smaller than the full viewport to ensure it's visible
                geometry = new THREE.PlaneGeometry(widthWorld * 0.8, heightWorld * 0.8);
            } else {
                // Fallback geometry for perspective cameras
                geometry = new THREE.PlaneGeometry(2, 2);
            }
            
            console.log('P5TextureLayer: Plane geometry size:', geometry.parameters);
            
            // Create mesh
            this.mesh = new THREE.Mesh(geometry, this.material);
            
            // Position the mesh at origin initially (LayerManager will position it)
            this.mesh.position.set(0, 0, 0);
            
            console.log('P5TextureLayer: Three.js components created');
            console.log('P5TextureLayer: Mesh created:', this.mesh);
            console.log('P5TextureLayer: Mesh position:', this.mesh.position);
            console.log('P5TextureLayer: Mesh visible:', this.mesh.visible);
            console.log('P5TextureLayer: Material:', this.material);
            console.log('P5TextureLayer: Texture:', this.texture);
        } catch (error) {
            console.error('P5TextureLayer: Failed to create Three.js components:', error);
            throw error;
        }
    }

    /**
     * Initialize P5 instance with the sketch code
     */
    async initializeP5Instance() {
        if (this.p5Instance) {
            this.p5Instance.remove();
        }
        
        try {
            console.log('P5TextureLayer: Creating p5Param helper...');
            // Create p5Param helper for parameter exposure
            this.createP5ParamHelper();
            
            console.log('P5TextureLayer: Creating sketch function...');
            // Create the P5 sketch function
            const sketch = this.createSketchFunction();
            
            console.log('P5TextureLayer: Initializing P5 instance with container...', this.p5Container);
            // Initialize P5 instance with container div (P5 will create its own canvas)
            this.p5Instance = new p5(sketch, this.p5Container);
            
            // Verify P5 is using our canvas
            setTimeout(() => {
                console.log('P5TextureLayer: P5 canvas element:', this.p5Instance.canvas);
                console.log('P5TextureLayer: Canvas matches offscreen:', this.p5Instance.canvas === this.offscreenCanvas);
                console.log('P5TextureLayer: P5 canvas size:', this.p5Instance.width, 'x', this.p5Instance.height);
            }, 100);
            
            this.isRunning = true;
            this.hasError = false;
            this.lastError = null;
            
            console.log('P5TextureLayer: P5 instance initialized successfully, running:', this.isRunning);
        } catch (error) {
            console.error('P5TextureLayer: Failed to initialize P5 instance:', error);
            this.hasError = true;
            this.lastError = error;
            this.isRunning = false;
        }
    }

    /**
     * Create p5Param helper for parameter exposure
     */
    createP5ParamHelper() {
        this.p5ParamHelper = (name, defaultValue = 0.5, options = {}) => {
            const config = {
                value: defaultValue,
                min: options.min !== undefined ? options.min : 0,
                max: options.max !== undefined ? options.max : 1,
                step: options.step !== undefined ? options.step : 0.01,
                label: options.label || name,
                defaultValue: defaultValue
            };
            
            // Register parameter
            this.parameters.set(name, config);
            this.exposedParameters[name] = config;
            
            return config.value;
        };
    }

    /**
     * Create P5 sketch function from code
     */
    createSketchFunction() {
        const layer = this;
        
        return function(p) {
            // Expose p5Param helper to the sketch
            p.p5Param = layer.p5ParamHelper;
            
            // Provide canvas dimensions to the sketch
            p.windowWidth = layer.canvasWidth;
            p.windowHeight = layer.canvasHeight;
            
            // Override createCanvas to use our dimensions
            const originalCreateCanvas = p.createCanvas;
            p.createCanvas = function(w, h, renderer) {
                console.log('P5TextureLayer: createCanvas called with:', w, h);
                console.log('P5TextureLayer: Overriding to use:', layer.canvasWidth, layer.canvasHeight);
                return originalCreateCanvas.call(p, layer.canvasWidth, layer.canvasHeight, renderer);
            };
            
            // Store original functions for restoration
            const originalSetup = p.setup;
            const originalDraw = p.draw;
            
            try {
                // Execute the user's sketch code in the p5 context
                // We need to bind setup and draw to the p object explicitly
                const func = new Function('p', `
                    with (p) {
                        ${layer.sketchCode}
                    }
                    // Ensure setup and draw are bound to p
                    if (typeof setup !== 'undefined') p.setup = setup;
                    if (typeof draw !== 'undefined') p.draw = draw;
                `);
                func.call(p, p);
                
                console.log('P5TextureLayer: Sketch code executed, setup exists:', typeof p.setup);
                console.log('P5TextureLayer: Sketch code executed, draw exists:', typeof p.draw);
                
                // Wrap the setup function to add debugging
                const userSetup = p.setup;
                p.setup = function() {
                    console.log('P5TextureLayer: Setup function called');
                    if (userSetup) {
                        userSetup.call(p);
                    }
                    console.log('P5TextureLayer: Setup complete, canvas:', p.canvas);
                    console.log('P5TextureLayer: Setup complete, canvas size:', p.width, 'x', p.height);
                };
                
                // Wrap the draw function to update texture
                const userDraw = p.draw;
                let frameCount = 0; // Add frame counter for debugging
                p.draw = function() {
                    try {
                        if (userDraw) {
                            userDraw.call(p);
                        }
                        
                        // Copy P5 canvas content to our texture canvas
                        if (p.canvas && layer.offscreenCanvas) {
                            const ctx = layer.offscreenCanvas.getContext('2d');
                            ctx.clearRect(0, 0, layer.offscreenCanvas.width, layer.offscreenCanvas.height);
                            
                            try {
                                ctx.drawImage(p.canvas, 0, 0, layer.offscreenCanvas.width, layer.offscreenCanvas.height);
                            } catch (error) {
                                console.error('P5TextureLayer: Error copying canvas:', error);
                            }
                        }
                        
                        // Update texture after each frame
                        if (layer.texture) {
                            layer.texture.needsUpdate = true;
                        }
                        
                        // Update frame counter (kept for potential future use)
                        frameCount++;
                    } catch (error) {
                        console.error('P5TextureLayer: Error in draw function:', error);
                        layer.hasError = true;
                        layer.lastError = error;
                    }
                };
                
            } catch (error) {
                console.error('P5TextureLayer: Error compiling sketch:', error);
                layer.hasError = true;
                layer.lastError = error;
                
                // Fallback to a simple error display
                p.setup = function() {
                    p.createCanvas(layer.canvasWidth, layer.canvasHeight);
                };
                
                p.draw = function() {
                    p.background(50, 0, 0);
                    p.fill(255);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.text('Sketch Error', p.width/2, p.height/2);
                };
            }
        };
    }

    /**
     * Update the layer (called each frame)
     * @param {number} deltaTime - Time since last frame
     */
    onUpdate(deltaTime) {
        if (!this.visible || !this.isRunning || this.hasError) return;
        
        // Update material opacity
        if (this.material) {
            this.material.opacity = this.opacity;
        }
        
        // Apply blend mode if it needs updating
        if (this.needsBlendModeUpdate) {
            this.applyBlendModeToMaterial();
        }
        
        // P5 instance handles its own animation loop
        // Texture is updated in the draw function
    }

    /**
     * Render the layer in 2D mode (required by LayerBase)
     * For P5TextureLayer, the actual rendering happens in the P5 draw loop
     * @param {THREE.WebGLRenderer} renderer - Three.js renderer
     * @param {THREE.Camera} camera - Three.js camera
     * @param {number} deltaTime - Time since last frame
     */
    onRender2D(renderer, camera, deltaTime) {
        // P5TextureLayer doesn't need 2D rendering since it renders to texture
        // The mesh is rendered by Three.js in the main render loop
        // This method exists to satisfy the LayerBase interface
        
        if (!this.visible || !this.isRunning || this.hasError) return;
        
        // Update material properties if needed
        if (this.material) {
            this.material.opacity = this.opacity;
            this.material.visible = this.visible;
        }
        
        // Apply blend mode if it needs updating
        if (this.needsBlendModeUpdate) {
            this.applyBlendModeToMaterial();
        }
    }

    /**
     * Handle opacity changes for P5 texture layer
     * @param {number} newOpacity - New opacity value (0.0 to 1.0)
     */
    updateOpacityState(newOpacity) {
        // Update material opacity immediately
        if (this.material) {
            this.material.opacity = newOpacity;
            this.material.transparent = newOpacity < 1.0;
            this.material.needsUpdate = true;
        }
    }

    /**
     * Set sketch code and reinitialize P5 instance
     * @param {string} code - New sketch code
     */
    async setSketchCode(code) {
        this.sketchCode = code;
        await this.initializeP5Instance();
    }

    /**
     * Get current sketch code
     * @returns {string} Current sketch code
     */
    getSketchCode() {
        return this.sketchCode;
    }

    /**
     * Get default sketch code (for compatibility with P5CodeEditor)
     * @returns {Promise<string>} Default sketch code
     */
    async getDefaultSketch() {
        return await this.getDefaultSketchCode();
    }

    /**
     * Compile and run sketch code (for compatibility with P5CodeEditor)
     * @param {string} code - Sketch code to compile and run
     */
    async compileAndRun(code) {
        console.log('P5TextureLayer: compileAndRun called with code length:', code.length);
        await this.setSketchCode(code);
    }

    /**
     * Get all parameters (for compatibility with P5CodeEditor)
     * @returns {Object} All parameters exposed by p5Param() calls
     */
    getAllParameters() {
        const params = {};
        this.parameters.forEach((config, name) => {
            params[name] = config;
        });
        return params;
    }

    /**
     * Set parameter value
     * @param {string} name - Parameter name
     * @param {*} value - Parameter value
     */
    setParameter(name, value) {
        if (this.parameters.has(name)) {
            const param = this.parameters.get(name);
            param.value = value;
            this.exposedParameters[name] = param;
        } else {
            // Handle base layer parameters
            super.setParameter(name, value);
        }
    }

    /**
     * Get parameter value
     * @param {string} name - Parameter name
     * @returns {*} Parameter value
     */
    getParameter(name) {
        if (this.parameters.has(name)) {
            return this.parameters.get(name).value;
        }
        return super.getParameter(name);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        // Recalculate canvas dimensions
        this.calculateCanvasDimensions();
        
        // Resize off-screen canvas
        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = this.canvasWidth;
            this.offscreenCanvas.height = this.canvasHeight;
        }
        
        // Recreate Three.js components with new dimensions
        this.createThreeJSComponents();
        
        // Reinitialize P5 instance
        this.initializeP5Instance();
    }

    /**
     * Get layer configuration for serialization
     * @returns {Object} Layer configuration
     */
    getConfig() {
        return {
            ...super.getConfig(),
            type: 'P5TextureLayer',
            code: this.sketchCode,
            targetFPS: this.targetFPS,
            pauseWhenHidden: this.pauseWhenHidden
        };
    }

    /**
     * Set layer configuration from serialization
     * @param {Object} config - Layer configuration
     */
    async setConfig(config) {
        await super.setConfig(config);
        
        if (config.code !== undefined) {
            await this.setSketchCode(config.code);
        }
        
        if (config.targetFPS !== undefined) {
            this.targetFPS = config.targetFPS;
        }
        
        if (config.pauseWhenHidden !== undefined) {
            this.pauseWhenHidden = config.pauseWhenHidden;
        }
    }

    /**
     * Dispose of the layer
     */
    onDispose() {
        console.log('P5TextureLayer: Disposing layer', this.id);
        
        // Stop P5 instance
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }
        
        // Clean up Three.js resources
        if (this.material) {
            this.material.dispose();
        }
        
        if (this.texture) {
            this.texture.dispose();
        }
        
        if (this.mesh && this.mesh.geometry) {
            this.mesh.geometry.dispose();
        }
        
        // Remove off-screen canvas and P5 container
        if (this.offscreenCanvas) {
            this.offscreenCanvas.remove();
        }
        
        if (this.p5Container && this.p5Container.parentNode) {
            this.p5Container.parentNode.removeChild(this.p5Container);
        }
        
        // Clear parameter registry
        this.parameters.clear();
        this.exposedParameters = {};
        
        this.isRunning = false;
        
        console.log('P5TextureLayer: Disposal complete');
    }

    /**
     * Get layer performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...super.getPerformanceMetrics(),
            isRunning: this.isRunning,
            hasError: this.hasError,
            parameterCount: this.parameters.size,
            canvasDimensions: `${this.canvasWidth}x${this.canvasHeight}`
        };
    }
}
