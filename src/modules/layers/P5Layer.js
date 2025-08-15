/**
 * P5Layer.js - P5.js Layer Implementation
 * This layer creates a p5.js canvas overlay that renders on top of the Three.js scene.
 * It provides parameter exposure through p5Param() helper and integrates with MIDI/audio mapping.
 */

import { LayerBase } from './LayerBase.js';

export class P5Layer extends LayerBase {
    constructor(id, config = {}) {
        super(id, config);
        
        // P5 instance and canvas
        this.p5Instance = null;
        this.p5Canvas = null;
        this.canvasElement = null;
        
        // Parameter registry
        this.parameters = new Map(); // name -> { value, min, max, step, label, defaultValue }
        this.exposedParameters = {}; // for LayerBase compatibility
        
        // Sketch code and state
        this.sketchCode = config.code || this.getDefaultSketch();
        this.isRunning = false;
        this.hasError = false;
        this.lastError = null;
        
        // Runtime helpers
        this.p5ParamHelper = null;
        
        // Performance settings
        this.targetFPS = 60;
        this.pauseWhenHidden = true;
    }

    /**
     * Get default p5 sketch code
     * @returns {string} Default sketch code
     */
    getDefaultSketch() {
        return `function setup() {
  createCanvas(windowWidth, windowHeight);
  console.log('P5 sketch setup complete, canvas size:', width, 'x', height);
}

function draw() {
  // Semi-transparent black background for trails
  background(0, 20);
  
  // Expose parameters using p5Param helper
  const size = p5Param('ballSize', 80, { min: 20, max: 200, label: 'Ball Size' });
  const speed = p5Param('speed', 1, { min: 0.1, max: 5, label: 'Animation Speed' });
  const hue = p5Param('color', 180, { min: 0, max: 360, label: 'Color Hue' });
  
  // Simple bright circle that should be very visible
  fill(255, 0, 0); // Bright red
  stroke(255, 255, 0); // Yellow stroke
  strokeWeight(4);
  
  const x = width/2 + cos(frameCount * 0.02 * speed) * 150;
  const y = height/2 + sin(frameCount * 0.02 * speed) * 150;
  
  circle(x, y, size);
  
  // Static elements for debugging
  fill(0, 255, 0); // Bright green
  noStroke();
  circle(width/2, height/2, 30);
  
  // Text
  fill(255, 255, 0); // Yellow
  textSize(32);
  textAlign(CENTER);
  text('P5 LAYER WORKING!', width/2, height/2 + 150);
  text('Frame: ' + frameCount, width/2, height/2 + 200);
}`;
    }

    /**
     * Initialize the P5 layer
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async onInitialize(context) {
        try {
            console.log(`P5Layer ${this.id}: Starting initialization...`);
            
            // Load p5.js if not already loaded
            console.log(`P5Layer ${this.id}: Loading p5.js...`);
            await this.loadP5();
            console.log(`P5Layer ${this.id}: p5.js loaded successfully`);
            
            // Create the p5Param helper
            console.log(`P5Layer ${this.id}: Creating p5Param helper...`);
            this.createP5ParamHelper();
            
            // Compile and run the initial sketch
            console.log(`P5Layer ${this.id}: Compiling initial sketch...`);
            await this.compileAndRun(this.sketchCode);
            
            console.log(`P5Layer ${this.id} initialized successfully`);
        } catch (error) {
            console.error(`Failed to initialize P5Layer ${this.id}:`, error);
            this.hasError = true;
            this.lastError = error.message;
            throw error;
        }
    }

    /**
     * Load p5.js library
     */
    async loadP5() {
        // Check if p5 is already loaded
        if (typeof window.p5 !== 'undefined') {
            console.log('p5.js already loaded, version:', window.p5.VERSION);
            return;
        }
        
        console.log('Loading p5.js from CDN...');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js';
            script.onload = () => {
                console.log('p5.js loaded successfully, version:', window.p5?.VERSION);
                // Wait a moment for p5 to fully initialize
                setTimeout(() => resolve(), 100);
            };
            script.onerror = () => {
                console.error('Failed to load p5.js from CDN');
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
        
        console.log(`Registered P5 parameter: ${name}`, param);
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
            console.log(`P5Layer ${this.id}: Compiling sketch...`);
            
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
            
            // Create sketch function
            const sketchFunction = this.createSketchFunction(code);
            
            // Create p5 instance with canvas overlay
            this.p5Instance = new window.p5(sketchFunction);
            
            this.isRunning = true;
            console.log(`P5Layer ${this.id} sketch compiled and running`);
            
            // Refresh MIDI parameter dropdowns after compilation
            this.refreshMIDIControls();
            
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
            console.log('P5 sketch function called with p:', p);
            
            // Store reference to p5 instance
            this.p5Canvas = p;
            
            // Inject p5Param helper into global scope for this sketch
            const originalP5Param = window.p5Param;
            window.p5Param = this.p5ParamHelper;
            
            try {
                console.log('Creating sketch function from code...');
                
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
                    }
                `);
                
                // Execute the sketch function
                sketchFunc.call(this, p, this.p5ParamHelper);
                
                console.log('Sketch functions defined, setup:', typeof p.setup, 'draw:', typeof p.draw);
                
                // Set up canvas positioning after setup
                const originalSetup = p.setup;
                p.setup = () => {
                    console.log('P5 setup() called, canvas will be created...');
                    if (originalSetup) {
                        originalSetup.call(p);
                    }
                    // Delay canvas setup to ensure canvas is created
                    setTimeout(() => {
                        console.log('Setting up canvas overlay...');
                        this.setupCanvasOverlay();
                    }, 100);
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
     * Setup canvas overlay positioning
     */
    setupCanvasOverlay() {
        if (!this.p5Canvas || !this.p5Canvas.canvas) return;
        
        this.canvasElement = this.p5Canvas.canvas;
        
        // Position canvas as overlay
        this.canvasElement.style.position = 'fixed';
        this.canvasElement.style.top = '0';
        this.canvasElement.style.left = '0';
        this.canvasElement.style.width = '100vw';
        this.canvasElement.style.height = '100vh';
        this.canvasElement.style.zIndex = '10'; // Under UI (which uses z-40, z-50)
        this.canvasElement.style.pointerEvents = 'none'; // Allow clicks to pass through
        this.canvasElement.style.opacity = this.opacity;
        
        console.log('P5 Canvas overlay positioned:', this.canvasElement);
        
        // Make canvas responsive
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Resize canvas to match window
     */
    resizeCanvas() {
        if (this.p5Canvas && typeof this.p5Canvas.resizeCanvas === 'function') {
            this.p5Canvas.resizeCanvas(window.innerWidth, window.innerHeight);
        }
    }

    /**
     * Stop the current sketch
     */
    stop() {
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
            this.p5Canvas = null;
        }
        
        if (this.canvasElement && this.canvasElement.parentNode) {
            this.canvasElement.parentNode.removeChild(this.canvasElement);
            this.canvasElement = null;
        }
        
        this.isRunning = false;
    }

    /**
     * Render the P5 layer (no-op since p5 handles its own rendering)
     */
    onRender2D(renderer, camera, deltaTime) {
        // P5 handles its own rendering loop
        // We just need to update visibility and opacity
        if (this.canvasElement) {
            this.canvasElement.style.display = this.visible ? 'block' : 'none';
            this.canvasElement.style.opacity = this.opacity;
        }
    }

    /**
     * Update the P5 layer
     */
    onUpdate(deltaTime) {
        // P5 handles its own update loop
        // We could add performance monitoring here if needed
    }

    /**
     * Set parameter value
     */
    onSetParameter(name, value) {
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
            console.log(`P5Layer ${this.id} parameter ${name} set to ${actualValue} (from normalized ${value})`);
        } else {
            console.warn(`P5Layer ${this.id}: Parameter ${name} not found`);
        }
    }

    /**
     * Get parameter value
     */
    onGetParameter(name) {
        const param = this.parameters.get(name);
        return param ? param.value : null;
    }

    /**
     * Get exposed parameters
     */
    onGetExposedParameters() {
        return this.exposedParameters;
    }

    /**
     * Get layer configuration
     */
    onGetConfig() {
        return {
            code: this.sketchCode,
            targetFPS: this.targetFPS,
            pauseWhenHidden: this.pauseWhenHidden,
            parameters: Object.fromEntries(this.parameters)
        };
    }

    /**
     * Set layer configuration
     */
    onSetConfig(config) {
        if (config.code && config.code !== this.sketchCode) {
            this.compileAndRun(config.code);
        }
        
        if (config.targetFPS) this.targetFPS = config.targetFPS;
        if (config.pauseWhenHidden !== undefined) this.pauseWhenHidden = config.pauseWhenHidden;
        
        if (config.parameters) {
            Object.entries(config.parameters).forEach(([name, paramConfig]) => {
                if (paramConfig && typeof paramConfig === 'object') {
                    this.parameters.set(name, paramConfig);
                }
            });
        }
    }

    /**
     * Dispose of the P5 layer
     */
    onDispose() {
        this.stop();
        this.parameters.clear();
        this.exposedParameters = {};
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
        return this.sketchCode || this.getDefaultSketch();
    }
    
    /**
     * Get current sketch code (alias for getSketchCode for consistency)
     */
    getCurrentSketchCode() {
        return this.getSketchCode();
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
