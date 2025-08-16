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
        this.sketchCode = config.code || '';
        this.isRunning = false;
        this.hasError = false;
        this.lastError = null;
        
        // Runtime helpers
        this.p5ParamHelper = null;
        
        // Performance settings
        this.targetFPS = config.targetFPS || 60;
        this.pauseWhenHidden = config.pauseWhenHidden !== undefined ? config.pauseWhenHidden : true;
        
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
}

function draw() {
  background(0, 20);
  fill(255, 0, 0);
  circle(width/2, height/2, 100);
}`;
        }
    }

    /**
     * Initialize the P5 layer
     * @param {Object} context - Context object with scene, renderer, etc.
     */
    async onInitialize(context) {
        try {
            // Load p5.js if not already loaded
            await this.loadP5();
            
            // Create the p5Param helper
            this.createP5ParamHelper();
            
            // Load default sketch if none provided
            if (!this.sketchCode) {
                this.sketchCode = await this.getDefaultSketch();
            }
            
            // Compile and run the initial sketch
            await this.compileAndRun(this.sketchCode);
            
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
                    }
                `);
                
                // Execute the sketch function
                sketchFunc.call(this, p, this.p5ParamHelper);
                
                // Set up canvas positioning after setup
                const originalSetup = p.setup;
                p.setup = () => {
                    if (originalSetup) {
                        originalSetup.call(p);
                    }
                    // Delay canvas setup to ensure canvas is created
                    setTimeout(() => {
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
        
        // Ensure initial visibility state is correct
        this.forceCanvasVisibility(this.visible);
        
        // Make canvas responsive
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Check the actual computed visibility state of the canvas
     * @returns {Object} Object with computed visibility properties
     */
    getCanvasVisibilityState() {
        if (!this.canvasElement) return { error: 'Canvas element not available' };
        
        const computedStyle = window.getComputedStyle(this.canvasElement);
        return {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            left: computedStyle.left,
            top: computedStyle.top,
            zIndex: computedStyle.zIndex
        };
    }

    /**
     * Force canvas visibility to match layer visibility state
     * @param {boolean} isVisible - Whether the canvas should be visible
     */
    forceCanvasVisibility(isVisible) {
        if (!this.canvasElement) return;
        
        if (isVisible) {
            this.canvasElement.style.setProperty('display', 'block', 'important');
            this.canvasElement.style.setProperty('visibility', 'visible', 'important');
            this.canvasElement.style.setProperty('opacity', this.opacity.toString(), 'important');
            this.canvasElement.style.setProperty('width', '100vw', 'important');
            this.canvasElement.style.setProperty('height', '100vh', 'important');
            this.canvasElement.style.setProperty('position', 'fixed', 'important');
            this.canvasElement.style.setProperty('left', '0', 'important');
            this.canvasElement.style.setProperty('top', '0', 'important');
        } else {
            this.canvasElement.style.setProperty('display', 'none', 'important');
            this.canvasElement.style.setProperty('visibility', 'hidden', 'important');
            this.canvasElement.style.setProperty('opacity', '0', 'important');
            this.canvasElement.style.setProperty('width', '0px', 'important');
            this.canvasElement.style.setProperty('height', '0px', 'important');
            this.canvasElement.style.setProperty('position', 'absolute', 'important');
            this.canvasElement.style.setProperty('left', '-9999px', 'important');
            this.canvasElement.style.setProperty('top', '-9999px', 'important');
        }
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
     * Handle window resize events (called by LayerManager)
     */
    onWindowResize() {
        this.resizeCanvas();
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
            // Force visibility state to match layer visibility with aggressive styling
            this.forceCanvasVisibility(this.visible);
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
     * Handle visibility changes for P5 layer
     * @param {boolean} isVisible - New visibility state
     */
    onVisibilityChanged(isVisible) {
        // Immediately update canvas visibility with aggressive hiding
        this.forceCanvasVisibility(isVisible);
        
        if (this.pauseWhenHidden) {
            if (isVisible) {
                // Resume the sketch when becoming visible
                if (this.p5Instance && this.isRunning) {
                    this.resumeSketch();
                }
            } else {
                // Pause the sketch when becoming hidden
                if (this.p5Instance && this.isRunning) {
                    this.pauseSketch();
                }
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
            console.warn(`P5Layer ${this.id}: p5Instance or noLoop not available to pause sketch.`);
        }
    }

    /**
     * Resume the P5 sketch
     */
    resumeSketch() {
        if (this.p5Instance && typeof this.p5Instance.loop === 'function') {
            this.p5Instance.loop();
        } else {
            console.warn(`P5Layer ${this.id}: p5Instance or loop not available to resume sketch.`);
        }
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
        const config = {
            code: this.sketchCode,
            targetFPS: this.targetFPS,
            pauseWhenHidden: this.pauseWhenHidden,
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

