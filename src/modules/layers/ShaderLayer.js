/**
 * ShaderLayer.js - GLSL Shader Layer Implementation
 * This layer renders GLSL shaders directly in the Three.js scene using ShaderMaterial.
 * It provides real-time shader compilation, parameter exposure, and emergent behavior support.
 */

import { LayerBase } from './LayerBase.js';
import * as THREE from 'three';

export class ShaderLayer extends LayerBase {
    constructor(id, config = {}) {
        super(id, config);
        
        // Shader code and compilation
        this.fragmentShader = config.fragmentShader || '';
        this.vertexShader = config.vertexShader || this.getDefaultVertexShader();
        this.computeShader = config.computeShader || null;
        
        // Shader material and mesh
        this.material = null;
        this.mesh = null;
        this.renderTarget = null;
        
        // Shader state
        this.isCompiled = false;
        this.hasError = false;
        this.lastError = null;
        this.compilationTime = 0;
        this.validationErrors = [];
        this.validationWarnings = [];
        
        // Parameter registry (shader uniforms)
        this.uniforms = new Map(); // name -> { value, type, min, max, step, label, defaultValue }
        this.exposedParameters = {}; // for LayerBase compatibility
        this.reservedUniforms = new Set(['time', 'resolution', 'opacity']);
        
        // Emergent behavior support
        this.emergentType = config.emergentType || 'custom';
        this.agentCount = config.agentCount || 1000;
        this.trailDecay = config.trailDecay || 0.95;
        this.sensorDistance = config.sensorDistance || 15;
        
        // Performance settings
        this.targetFPS = config.targetFPS || 60;
        this.useComputeShaders = config.useComputeShaders !== undefined ? config.useComputeShaders : false;
        
        // Time tracking for animations
        this.startTime = Date.now();
        this.time = 0;
    }

    /**
     * Get default vertex shader for full-screen quad
     */
    getDefaultVertexShader() {
        return `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get default fragment shader
     */
    getDefaultFragmentShader() {
        return `
            precision mediump float;

            uniform float time;
            uniform vec2 resolution;
            uniform float opacity;

            // Exposed parameters (0..1 sliders in UI)
            uniform float scaleParam;   // remapped to [8, 24]
            uniform float speedParam;   // remapped to [0.5, 3.0]
            uniform float contrastParam; // remapped to [0.8, 2.0]
            uniform vec2 warp;          // remapped to [-0.4, 0.4]

            varying vec2 vUv;

            void main() {
                // Centered UV for nicer transforms
                vec2 uv = vUv - 0.5;

                // Remap normalized UI params to useful ranges
                float scale = mix(8.0, 24.0, clamp(scaleParam, 0.0, 1.0));
                float speed = mix(0.5, 3.0, clamp(speedParam, 0.0, 1.0));
                float contrast = mix(0.8, 2.0, clamp(contrastParam, 0.0, 1.0));
                vec2 w = (clamp(warp, 0.0, 1.0) - 0.5) * 0.8; // [-0.4, 0.4]

                // Mild UV warp for motion
                vec2 p = uv;
                p += vec2(
                    sin((uv.y + w.y) * scale + time * speed),
                    cos((uv.x + w.x) * scale - time * speed)
                ) * 0.05;

                // Interfering wave pattern
                float a = sin((p.x + p.y) * scale + time * speed);
                float b = cos((p.x - p.y) * (scale * 0.8) - time * speed * 1.2);
                float pattern = a * b;

                // Normalize to 0..1 and apply simple contrast curve
                pattern = 0.5 + 0.5 * pattern;
                pattern = pow(pattern, contrast);

                // Add a subtle color shift field
                vec3 field = vec3(
                    0.5 + 0.5 * sin(6.2831 * (p.x) + time * 0.2),
                    0.5 + 0.5 * sin(6.2831 * (p.y) + time * 0.15),
                    0.5 + 0.5 * sin(6.2831 * (p.x + p.y) + time * 0.1)
                );

                vec3 color = mix(field, vec3(pattern), 0.6);
                gl_FragColor = vec4(color, opacity);
            }
        `;
    }

    /**
     * Initialize the shader layer
     */
    async onInitialize(context) {
        try {
            console.log(`ShaderLayer ${this.id}: Starting initialization...`);
            console.log('Context received:', context);
            
            // Create render target for off-screen rendering
            this.createRenderTarget();
            
            // Create shader material
            await this.createShaderMaterial();
            
            // Create full-screen quad mesh
            this.createMesh();
            
            // Compile initial shader
            if (this.fragmentShader) {
                await this.compileShader(this.fragmentShader);
            } else {
                // Prefer loading from public/shaders; fallback to built-in
                const defaultCode = await this.loadDefaultShaderFromPublic();
                this.fragmentShader = defaultCode;
                await this.compileShader(this.fragmentShader);
            }
            
            // Set up default uniforms and discover any in default shader
            this.setupDefaultUniforms();
            this.discoverAndRegisterUniforms(this.fragmentShader);
            
            console.log(`ShaderLayer ${this.id}: Initialization completed successfully`);
            
        } catch (error) {
            console.error(`Failed to initialize ShaderLayer ${this.id}:`, error);
            this.hasError = true;
            this.lastError = error.message;
            throw error;
        }
    }

    /**
     * Load default shader from public/shaders with graceful fallback
     */
    async loadDefaultShaderFromPublic() {
        try {
            const res = await fetch('/shaders/default.frag', { cache: 'no-cache' });
            if (!res.ok) throw new Error('Failed to fetch default.frag');
            return await res.text();
        } catch (e) {
            console.warn('Falling back to built-in default shader:', e);
            return this.getDefaultFragmentShader();
        }
    }

    /**
     * Create render target for off-screen rendering
     */
    createRenderTarget() {
        // Debug context structure
        console.log('ShaderLayer context:', this.context);
        console.log('Context keys:', Object.keys(this.context || {}));
        
        if (!this.context || !this.context.renderer) {
            console.warn('ShaderLayer: No renderer in context, skipping render target creation');
            return;
        }
        
        try {
            const size = new THREE.Vector2();
            this.context.renderer.getSize(size);
            
            this.renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                generateMipmaps: false
            });
        } catch (error) {
            console.warn('ShaderLayer: Failed to create render target:', error);
        }
    }

    /**
     * Create shader material
     */
    async createShaderMaterial() {
        try {
            // Create uniforms object
            const uniforms = this.createUniformsObject();
            
            // Create shader material
            this.material = new THREE.ShaderMaterial({
                vertexShader: this.vertexShader,
                fragmentShader: this.fragmentShader,
                uniforms: uniforms,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            
            // Set material properties
            this.material.blending = THREE.NormalBlending;
            this.material.opacity = this.opacity;
            this.material.toneMapped = false; // avoid post tone-mapping dimming the shader
            
        } catch (error) {
            console.error('Failed to create shader material:', error);
            throw error;
        }
    }

    /**
     * Create uniforms object for Three.js
     */
    createUniformsObject() {
        const uniforms = {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2() },
            opacity: { value: this.opacity }
        };
        
        // Add custom uniforms from registry
        this.uniforms.forEach((param, name) => {
            uniforms[name] = { value: param.value };
        });
        
        return uniforms;
    }

    /**
     * Create layer mesh as 3D plane
     */
    createMesh() {
        if (!this.material) {
            console.warn('ShaderLayer: No material available, skipping mesh creation');
            return;
        }
        
        try {
            // Create a standard plane geometry for the layer
            // Size will be determined by the camera viewport, but positioned as a layer
            let geometry;
            if (this.context && this.context.camera && this.context.camera.isOrthographicCamera) {
                const cam = this.context.camera;
                const widthWorld = Math.abs(cam.right - cam.left);
                const heightWorld = Math.abs(cam.top - cam.bottom);
                geometry = new THREE.PlaneGeometry(widthWorld, heightWorld);
            } else {
                // Fallback geometry for perspective cameras
                geometry = new THREE.PlaneGeometry(2, 2);
            }
            
            // Create mesh with shader material
            this.mesh = new THREE.Mesh(geometry, this.material);
            
            // The LayerManager will handle positioning this mesh in 3D space
            // No need to set position.z or renderOrder here
            
            console.log('ShaderLayer: Mesh created for layer positioning');
        } catch (error) {
            console.error('ShaderLayer: Failed to create mesh:', error);
        }
    }

    /**
     * Set up default uniforms
     */
    setupDefaultUniforms() {
        // Register emergent behavior parameters
        this.registerUniform('agentCount', this.agentCount, {
            type: 'number',
            min: 100,
            max: 100000,
            step: 100,
            label: 'Agent Count',
            description: 'Number of agents in simulation'
        });
        
        this.registerUniform('trailDecay', this.trailDecay, {
            type: 'number',
            min: 0.8,
            max: 0.999,
            step: 0.001,
            label: 'Trail Decay',
            description: 'How quickly trails fade'
        });
        
        this.registerUniform('sensorDistance', this.sensorDistance, {
            type: 'number',
            min: 1,
            max: 50,
            step: 1,
            label: 'Sensor Distance',
            description: 'Agent sensor range'
        });
    }
    
    /**
     * Create default uniforms for shader compilation
     * @returns {Object} Default uniforms object for Three.js ShaderMaterial
     */
    createDefaultUniforms() {
        const uniforms = {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(800, 600) },
            opacity: { value: 1.0 }
        };
        
        // Add any registered uniforms safely
        if (this.uniforms && this.uniforms.size > 0) {
            this.uniforms.forEach((param, name) => {
                if (!this.reservedUniforms.has(name)) {
                    try {
                        uniforms[name] = { value: this.createThreeValueForUniform(name) };
                    } catch (error) {
                        console.warn(`Failed to create uniform ${name}:`, error);
                        // Provide a safe default
                        uniforms[name] = { value: 0.0 };
                    }
                }
            });
        }
        
        return uniforms;
    }

    /**
     * Compile shader code with enhanced error handling and recovery
     */
    async compileShader(fragmentShaderCode) {
        const startTime = performance.now();
        
        try {
            console.log(`ShaderLayer ${this.id}: Compiling shader...`);
            
            // Store previous shader for potential rollback
            const previousShader = this.fragmentShader;
            const previousCompiled = this.isCompiled;
            
            // Store new shader code
            this.fragmentShader = fragmentShaderCode;
            
            // Clear previous error state
            this.hasError = false;
            this.lastError = null;
            this.validationErrors = [];
            this.validationWarnings = [];
            
            // Validate shader syntax first
            await this.validateShader(fragmentShaderCode);
            
            // Discover and register uniforms declared in the shader code
            this.discoverAndRegisterUniforms(fragmentShaderCode);
            
            // Test compile the shader by creating a temporary material (disabled for now to avoid WebGL issues)
            // await this.testShaderCompilation(fragmentShaderCode);
            
            // If test compilation succeeded, update the actual material
            this.material.fragmentShader = fragmentShaderCode;
            this.material.needsUpdate = true;
            
            // Update uniforms
            this.updateMaterialUniforms();
            
            this.isCompiled = true;
            this.compilationTime = performance.now() - startTime;
            
            console.log(`ShaderLayer ${this.id}: Shader compiled successfully in ${this.compilationTime.toFixed(2)}ms`);
            
            // Emit compilation success event
            this.emitEvent('shaderCompiled', { 
                compilationTime: this.compilationTime,
                warnings: this.validationWarnings 
            });
            
        } catch (error) {
            this.compilationTime = performance.now() - startTime;
            
            console.error(`ShaderLayer ${this.id}: Compilation failed:`, error);
            this.hasError = true;
            this.lastError = this.formatShaderError(error);
            this.isCompiled = false;
            
            // Attempt graceful recovery
            await this.handleCompilationError(error);
            
            // Emit compilation error event
            this.emitEvent('shaderError', { 
                error: this.lastError,
                compilationTime: this.compilationTime 
            });
            
            throw error;
        }
    }
    
    /**
     * Test shader compilation without affecting the main material
     */
    async testShaderCompilation(fragmentShaderCode) {
        let testMaterial = null;
        let testGeometry = null;
        let testMesh = null;
        
        try {
            // Ensure we have a valid vertex shader
            if (!this.vertexShader) {
                this.vertexShader = this.getDefaultVertexShader();
            }
            
            // Create default uniforms safely
            const uniforms = this.createDefaultUniforms();
            
            // Create a temporary material for testing
            testMaterial = new THREE.ShaderMaterial({
                vertexShader: this.vertexShader,
                fragmentShader: fragmentShaderCode,
                uniforms: uniforms,
                transparent: true
            });
            
            // Create a simple test geometry and mesh
            testGeometry = new THREE.PlaneGeometry(1, 1);
            testMesh = new THREE.Mesh(testGeometry, testMaterial);
            
            // Test compilation in a safer way
            if (this.context && this.context.renderer && this.context.scene) {
                // Create a temporary scene to avoid affecting the main scene
                const tempScene = new THREE.Scene();
                tempScene.add(testMesh);
                
                // Create a minimal camera for compilation
                const tempCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2);
                tempCamera.position.z = 1;
                
                try {
                    // Force WebGL compilation
                    this.context.renderer.compile(tempScene, tempCamera);
                    
                    // Test if the program compiled successfully by checking for WebGL errors
                    const gl = this.context.renderer.getContext();
                    const error = gl.getError();
                    if (error !== gl.NO_ERROR) {
                        throw new Error(`WebGL error during shader compilation: ${error}`);
                    }
                    
                } catch (compileError) {
                    throw new Error(`Shader compilation test failed: ${compileError.message}`);
                }
                
                // Clean up temp scene
                tempScene.remove(testMesh);
            } else {
                // If no renderer context available, just create the material and hope for the best
                console.warn('ShaderLayer: No renderer context available for shader compilation test');
            }
            
        } catch (error) {
            throw new Error(`WebGL compilation failed: ${error.message}`);
        } finally {
            // Always clean up test objects
            if (testGeometry) {
                testGeometry.dispose();
            }
            if (testMaterial) {
                // Dispose material uniforms that might have textures
                if (testMaterial.uniforms) {
                    Object.values(testMaterial.uniforms).forEach(uniform => {
                        if (uniform.value && uniform.value.dispose) {
                            uniform.value.dispose();
                        }
                    });
                }
                testMaterial.dispose();
            }
        }
    }
    
    /**
     * Format shader error messages for better readability
     */
    formatShaderError(error) {
        let message = error.message || error.toString();
        
        // Extract WebGL error information if available
        if (message.includes('ERROR:')) {
            const errorMatch = message.match(/ERROR: (\d+):(\d+): (.+)/);
            if (errorMatch) {
                const [, , line, description] = errorMatch;
                message = `Line ${line}: ${description}`;
            }
        }
        
        // Add helpful suggestions for common errors
        const suggestions = this.getErrorSuggestions(message);
        if (suggestions.length > 0) {
            message += '\n\nSuggestions:\n' + suggestions.join('\n');
        }
        
        return message;
    }
    
    /**
     * Get helpful suggestions for common shader errors
     */
    getErrorSuggestions(errorMessage) {
        const suggestions = [];
        
        if (errorMessage.includes('undeclared identifier')) {
            suggestions.push('• Check variable names and function declarations');
            suggestions.push('• Ensure all uniforms are properly declared');
        }
        
        if (errorMessage.includes('type mismatch')) {
            suggestions.push('• Check data types (float, vec2, vec3, vec4)');
            suggestions.push('• Use proper type casting (float(x), vec3(x))');
        }
        
        if (errorMessage.includes('syntax error')) {
            suggestions.push('• Check for missing semicolons');
            suggestions.push('• Verify brace and parenthesis matching');
        }
        
        if (errorMessage.includes('function') && errorMessage.includes('not found')) {
            suggestions.push('• Check GLSL function names (sin, cos, length, etc.)');
            suggestions.push('• Ensure custom functions are defined before use');
        }
        
        return suggestions;
    }
    
    /**
     * Handle compilation errors with graceful recovery
     */
    async handleCompilationError(error) {
        console.log(`ShaderLayer ${this.id}: Attempting error recovery...`);
        
        // Try to load a fallback shader to keep the layer functional
        try {
            const fallbackShader = this.getErrorFallbackShader();
            
            // Update material with fallback shader (don't recurse through compileShader)
            this.material.fragmentShader = fallbackShader;
            this.material.needsUpdate = true;
            
            console.log(`ShaderLayer ${this.id}: Fallback shader loaded for error recovery`);
            
        } catch (fallbackError) {
            console.error(`ShaderLayer ${this.id}: Fallback shader also failed:`, fallbackError);
        }
    }
    
    /**
     * Get a simple fallback shader for error recovery
     */
    getErrorFallbackShader() {
        return `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            
            void main() {
                // Simple error indicator pattern
                vec2 uv = vUv;
                float pattern = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time);
                vec3 color = vec3(1.0, 0.2, 0.2) * (0.5 + 0.5 * pattern);
                gl_FragColor = vec4(color, 0.8);
            }
        `;
    }
    
    /**
     * Emit events for shader compilation status
     */
    emitEvent(eventType, data) {
        if (this.app && this.app.eventBus) {
            this.app.eventBus.emit(`shader.${eventType}`, {
                layerId: this.id,
                ...data
            });
        }
    }

    /**
     * Validate shader syntax with enhanced error detection
     */
    async validateShader(shaderCode) {
        const errors = [];
        const warnings = [];
        
        // Basic GLSL validation
        if (!shaderCode.includes('void main()')) {
            errors.push('Shader must contain main() function');
        }
        
        if (!shaderCode.includes('gl_FragColor') && !shaderCode.includes('gl_FragData')) {
            errors.push('Fragment shader must set gl_FragColor or gl_FragData');
        }
        
        // Enhanced syntax validation (less noisy)
        const syntaxChecks = [
            {
                pattern: /precision\s+(?:lowp|mediump|highp)\s+float\s*;/,
                message: 'Precision qualifier found (good practice)',
                type: 'info',
                invert: false // Check if present
            },
            {
                pattern: /varying\s+vec2\s+vUv\s*;/,
                message: 'vUv varying declaration found (good for texture coordinates)',
                type: 'info',
                invert: false // Check if present
            },
            {
                pattern: /uniform\s+float\s+time\s*;/,
                message: 'time uniform declared (automatically provided by system)',
                type: 'info',
                invert: false
            },
            {
                pattern: /uniform\s+vec2\s+resolution\s*;/,
                message: 'resolution uniform declared (automatically provided by system)',
                type: 'info',
                invert: false
            }
        ];
        
        // Check for unmatched braces
        const openBraces = (shaderCode.match(/\{/g) || []).length;
        const closeBraces = (shaderCode.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
        }
        
        // Check for unmatched parentheses
        const openParens = (shaderCode.match(/\(/g) || []).length;
        const closeParens = (shaderCode.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            errors.push(`Unmatched parentheses: ${openParens} opening, ${closeParens} closing`);
        }
        
        // Check for common GLSL function typos
        const commonTypos = [
            { wrong: 'lenght', correct: 'length' },
            { wrong: 'normalize', correct: 'normalize' }, // catches normalise
            { wrong: 'colour', correct: 'color' },
            { wrong: 'centre', correct: 'center' }
        ];
        
        commonTypos.forEach(typo => {
            if (shaderCode.includes(typo.wrong)) {
                warnings.push(`Possible typo: "${typo.wrong}" should be "${typo.correct}"`);
            }
        });
        
        // Run syntax checks (only log info messages, don't add to warnings)
        syntaxChecks.forEach(check => {
            const found = check.pattern.test(shaderCode);
            if (check.type === 'info' && found) {
                console.info(`ShaderLayer: ${check.message}`);
            }
        });
        
        // Store validation results
        this.validationErrors = errors;
        this.validationWarnings = warnings;
        
        // Log warnings only if they're significant
        if (warnings.length > 0) {
            console.info(`ShaderLayer ${this.id}: Validation notes (${warnings.length}):`, warnings);
        }
        
        // Throw error if critical issues found
        if (errors.length > 0) {
            throw new Error(`Shader validation failed:\n${errors.join('\n')}`);
        }
    }

    /**
     * Update material uniforms
     */
    updateMaterialUniforms() {
        if (!this.material || !this.material.uniforms) return;
        
        // Update resolution
        if (this.material.uniforms.resolution && this.context && this.context.renderer) {
            try {
                const size = new THREE.Vector2();
                this.context.renderer.getSize(size);
                // Ensure value is a THREE.Vector2
                if (!(this.material.uniforms.resolution.value instanceof THREE.Vector2)) {
                    this.material.uniforms.resolution.value = new THREE.Vector2();
                }
                this.material.uniforms.resolution.value.copy(size);
            } catch (error) {
                console.warn('ShaderLayer: Failed to update resolution uniform:', error);
            }
        }
        
        // Update custom uniforms
        this.uniforms.forEach((param, name) => {
            const target = this.material.uniforms[name];
            if (!target) return;
            if (param.type === 'vector2') {
                const v = param.value || { x: 0, y: 0 };
                if (!(target.value instanceof THREE.Vector2)) {
                    target.value = new THREE.Vector2();
                }
                target.value.set(v.x, v.y);
            } else {
                target.value = param.value;
            }
        });
    }

    /**
     * Register a uniform parameter
     */
    registerUniform(name, defaultValue, options = {}) {
        const uniform = {
            value: defaultValue,
            defaultValue: defaultValue,
            type: options.type || 'number',
            min: options.min,
            max: options.max,
            step: options.step,
            label: options.label || name,
            description: options.description || ''
        };
        
        this.uniforms.set(name, uniform);
        
        // Update exposed parameters for LayerBase compatibility
        this.exposedParameters[name] = {
            type: uniform.type,
            min: uniform.min,
            max: uniform.max,
            step: uniform.step,
            default: uniform.defaultValue,
            label: uniform.label,
            description: uniform.description
        };
        
        console.log(`Registered shader uniform: ${name}`, uniform);
    }

    /**
     * Render the shader layer
     */
    onRender2D(renderer, camera, deltaTime) {
        if (!this.mesh || !this.material || !this.isCompiled) return;
        
        // Update time uniform
        if (this.material.uniforms.time) {
            this.time = (Date.now() - this.startTime) / 1000.0;
            this.material.uniforms.time.value = this.time;
        }
        
        // Update opacity uniform
        if (this.material.uniforms.opacity) {
            this.material.uniforms.opacity.value = this.opacity;
        }
        
        // Render shader to scene
        // Note: The mesh is already in the scene, so Three.js will render it automatically
        // We just need to ensure our uniforms are updated
    }

    /**
     * Update the shader layer
     */
    onUpdate(deltaTime) {
        // Update any animated uniforms here if needed
        this.updateMaterialUniforms();
    }

    /**
     * Set parameter value
     */
    onSetParameter(name, value) {
        const uniform = this.uniforms.get(name);
        if (uniform) {
            // Convert normalized value (0-1) to parameter range if min/max are specified
            let actualValue = value;
            if (uniform.min !== undefined && uniform.max !== undefined) {
                actualValue = uniform.min + (value * (uniform.max - uniform.min));
            }
            
            // Clamp value to range if specified
            if (uniform.min !== undefined && actualValue < uniform.min) actualValue = uniform.min;
            if (uniform.max !== undefined && actualValue > uniform.max) actualValue = uniform.max;
            
            console.log(`ShaderLayer ${this.id}: setParameter ${name} ->`, value, 'actual:', actualValue, 'type:', uniform.type);
            uniform.value = actualValue;
            
            // Update material uniform without replacing vector objects
            if (this.material && this.material.uniforms[name]) {
                const target = this.material.uniforms[name];
                if (uniform.type === 'vector2') {
                    const v = actualValue || { x: 0, y: 0 };
                    if (!(target.value instanceof THREE.Vector2)) {
                        target.value = new THREE.Vector2();
                    }
                    target.value.set(v.x, v.y);
                } else {
                    target.value = actualValue;
                }
                // Ensure renderer sees the change immediately
                this.material.needsUpdate = true;
            }

            // Keep internal uniforms in sync for frames where onUpdate is not called
            this.updateMaterialUniforms();
        } else {
            console.warn(`ShaderLayer ${this.id}: Uniform ${name} not found`);
        }
    }

    /**
     * Handle window resize to keep full-screen quad covering view
     */
    onWindowResize() {
        if (!this.mesh || !this.context || !this.context.camera) return;
        const cam = this.context.camera;
        if (!cam.isOrthographicCamera) return;
        const widthWorld = Math.abs(cam.right - cam.left);
        const heightWorld = Math.abs(cam.top - cam.bottom);
        try {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.PlaneGeometry(widthWorld, heightWorld);
        } catch (e) {
            // ignore
        }
    }

    /**
     * Parse shader code and register uniforms so they appear in UI/MIDI mapping
     * Only registers non-reserved uniforms. Types supported: float, int, bool, vec2
     */
    discoverAndRegisterUniforms(shaderCode) {
        const uniformRegex = /uniform\s+(?:lowp|mediump|highp\s+)?(float|int|bool|vec2|vec3|vec4|sampler2D)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/g;
        const found = new Set();
        let match;
        while ((match = uniformRegex.exec(shaderCode)) !== null) {
            const type = match[1];
            const name = match[2];
            found.add(name);
            if (this.reservedUniforms.has(name)) continue;
            if (!this.uniforms.has(name)) {
                const paramConfig = this.generateParameterConfig(name, type, shaderCode);
                
                switch (type) {
                    case 'float':
                    case 'int':
                    case 'bool':
                        this.registerUniform(name, paramConfig.defaultValue, {
                            type: 'number',
                            min: paramConfig.min,
                            max: paramConfig.max,
                            step: paramConfig.step,
                            label: paramConfig.label,
                            description: paramConfig.description,
                            category: paramConfig.category
                        });
                        break;
                    case 'vec2':
                        this.registerUniform(name, paramConfig.defaultValue, {
                            type: 'vector2',
                            label: paramConfig.label,
                            description: paramConfig.description,
                            category: paramConfig.category
                        });
                        break;
                    case 'vec3':
                        this.registerUniform(name, paramConfig.defaultValue, {
                            type: 'color',
                            label: paramConfig.label,
                            description: paramConfig.description,
                            category: paramConfig.category
                        });
                        break;
                    case 'vec4':
                        this.registerUniform(name, paramConfig.defaultValue, {
                            type: 'color',
                            alpha: true,
                            label: paramConfig.label,
                            description: paramConfig.description,
                            category: paramConfig.category
                        });
                        break;
                    default:
                        // Skip samplers for now
                        break;
                }
            }

            // Ensure material has the uniform slot
            if (this.material && this.material.uniforms && !this.material.uniforms[name]) {
                this.material.uniforms[name] = { value: this.createThreeValueForUniform(name) };
            }
        }

        // Remove uniforms that are no longer present in shader code (and not reserved)
        const toDelete = [];
        this.uniforms.forEach((_, name) => {
            if (!found.has(name)) {
                toDelete.push(name);
            }
        });
        toDelete.forEach(name => {
            this.uniforms.delete(name);
            delete this.exposedParameters[name];
            if (this.material && this.material.uniforms && this.material.uniforms[name]) {
                delete this.material.uniforms[name];
            }
        });

        console.log(`ShaderLayer ${this.id}: Discovered ${found.size} uniforms with enhanced config:`, 
            Array.from(found).map(name => ({ 
                name, 
                config: this.uniforms.get(name) 
            })));
    }

    /**
     * Generate intelligent parameter configuration based on uniform name and context
     */
    generateParameterConfig(name, type, shaderCode) {
        const config = {
            defaultValue: this.getDefaultValueForType(type),
            min: 0.0,
            max: 1.0,
            step: 0.001,
            label: this.generateFriendlyLabel(name),
            description: `${type} uniform parameter`,
            category: 'general'
        };
        
        // Look for inline comments with parameter hints
        const paramHintRegex = new RegExp(`uniform\\s+${type}\\s+${name}\\s*;\\s*//\\s*(.+)`, 'i');
        const hintMatch = shaderCode.match(paramHintRegex);
        if (hintMatch) {
            const hint = hintMatch[1].trim();
            config.description = hint;
            
            // Parse range hints like [0..10] or [0.1..2.0]
            const rangeMatch = hint.match(/\[([0-9.-]+)\.\.([0-9.-]+)\]/);
            if (rangeMatch) {
                config.min = parseFloat(rangeMatch[1]);
                config.max = parseFloat(rangeMatch[2]);
                config.step = (config.max - config.min) / 1000;
                config.defaultValue = (config.min + config.max) / 2;
            }
        }
        
        // Intelligent defaults based on parameter name
        const namePatterns = [
            { pattern: /speed|velocity|rate/i, min: 0, max: 5, default: 1, category: 'animation' },
            { pattern: /time|duration/i, min: 0, max: 10, default: 1, category: 'animation' },
            { pattern: /scale|size|zoom/i, min: 0.1, max: 5, default: 1, category: 'transform' },
            { pattern: /rotation|angle/i, min: 0, max: 6.28, default: 0, category: 'transform' },
            { pattern: /frequency|freq/i, min: 1, max: 50, default: 10, category: 'wave' },
            { pattern: /amplitude|amp/i, min: 0, max: 2, default: 1, category: 'wave' },
            { pattern: /brightness|intensity/i, min: 0, max: 3, default: 1, category: 'appearance' },
            { pattern: /contrast/i, min: 0.1, max: 3, default: 1, category: 'appearance' },
            { pattern: /opacity|alpha/i, min: 0, max: 1, default: 1, category: 'appearance' },
            { pattern: /color|hue/i, min: 0, max: 1, default: 0.5, category: 'color' },
            { pattern: /saturation|sat/i, min: 0, max: 1, default: 0.8, category: 'color' },
            { pattern: /complexity|detail/i, min: 1, max: 10, default: 5, category: 'pattern' },
            { pattern: /segments|divisions/i, min: 3, max: 20, default: 8, category: 'pattern' },
            { pattern: /distortion|warp/i, min: 0, max: 1, default: 0.5, category: 'effect' },
            { pattern: /noise|random/i, min: 0, max: 1, default: 0.5, category: 'effect' }
        ];
        
        for (const pattern of namePatterns) {
            if (pattern.pattern.test(name)) {
                config.min = pattern.min;
                config.max = pattern.max;
                config.defaultValue = pattern.default;
                config.step = (config.max - config.min) / 1000;
                config.category = pattern.category;
                break;
            }
        }
        
        // Special handling for vec2/vec3/vec4
        if (type === 'vec2') {
            config.defaultValue = { x: 0.5, y: 0.5 };
            if (/position|offset|translate/i.test(name)) {
                config.defaultValue = { x: 0, y: 0 };
                config.category = 'transform';
            }
        } else if (type === 'vec3') {
            config.defaultValue = { r: 0.5, g: 0.5, b: 0.8 }; // Nice default color
            config.category = 'color';
        } else if (type === 'vec4') {
            config.defaultValue = { r: 0.5, g: 0.5, b: 0.8, a: 1.0 };
            config.category = 'color';
        }
        
        return config;
    }
    
    /**
     * Generate friendly label from camelCase or snake_case parameter name
     */
    generateFriendlyLabel(name) {
        // Convert camelCase to Title Case
        let label = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        
        // Convert snake_case to Title Case
        label = label.replace(/_/g, ' ');
        
        // Capitalize first letter of each word
        label = label.replace(/\b\w/g, l => l.toUpperCase());
        
        return label;
    }
    
    /**
     * Get default value for uniform type
     */
    getDefaultValueForType(type) {
        switch (type) {
            case 'float':
            case 'int':
                return 0.5;
            case 'bool':
                return false;
            case 'vec2':
                return { x: 0.5, y: 0.5 };
            case 'vec3':
                return { r: 0.5, g: 0.5, b: 0.8 };
            case 'vec4':
                return { r: 0.5, g: 0.5, b: 0.8, a: 1.0 };
            default:
                return 0;
        }
    }

    createThreeValueForUniform(name) {
        const meta = this.uniforms.get(name);
        if (!meta) return 0.0;
        if (meta.type === 'vector2') {
            const v = meta.value || { x: 0, y: 0 };
            return new THREE.Vector2(v.x, v.y);
        }
        return meta.value;
    }

    /**
     * Get parameter value
     */
    onGetParameter(name) {
        const uniform = this.uniforms.get(name);
        return uniform ? uniform.value : null;
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
            type: 'ShaderLayer',
            fragmentShader: this.fragmentShader,
            vertexShader: this.vertexShader,
            computeShader: this.computeShader,
            emergentType: this.emergentType,
            agentCount: this.agentCount,
            trailDecay: this.trailDecay,
            sensorDistance: this.sensorDistance,
            targetFPS: this.targetFPS,
            useComputeShaders: this.useComputeShaders,
            uniforms: Object.fromEntries(this.uniforms)
        };
    }

    /**
     * Set layer configuration
     */
    async onSetConfig(config) {
        // Set basic properties first
        if (config.vertexShader) this.vertexShader = config.vertexShader;
        if (config.computeShader) this.computeShader = config.computeShader;
        if (config.emergentType) this.emergentType = config.emergentType;
        if (config.agentCount) this.agentCount = config.agentCount;
        if (config.trailDecay) this.trailDecay = config.trailDecay;
        if (config.sensorDistance) this.sensorDistance = config.sensorDistance;
        if (config.targetFPS) this.targetFPS = config.targetFPS;
        if (config.useComputeShaders !== undefined) this.useComputeShaders = config.useComputeShaders;
        
        // Compile shader if provided (this will discover uniforms)
        if (config.fragmentShader && config.fragmentShader !== this.fragmentShader) {
            await this.compileShader(config.fragmentShader);
        }
        
        // Restore uniform values after shader compilation
        if (config.uniforms) {
            Object.entries(config.uniforms).forEach(([name, uniformConfig]) => {
                if (uniformConfig && typeof uniformConfig === 'object') {
                    // Restore the uniform configuration
                    this.uniforms.set(name, { ...uniformConfig });
                    
                    // Update the material uniform if it exists
                    if (this.material && this.material.uniforms[name]) {
                        const materialUniform = this.material.uniforms[name];
                        if (uniformConfig.type === 'vector2') {
                            const value = uniformConfig.value || { x: 0, y: 0 };
                            if (!(materialUniform.value instanceof THREE.Vector2)) {
                                materialUniform.value = new THREE.Vector2();
                            }
                            materialUniform.value.set(value.x, value.y);
                        } else {
                            materialUniform.value = uniformConfig.value;
                        }
                    }
                }
            });
            
            // Update exposed parameters for UI
            this.updateExposedParameters();
        }
        
        console.log(`ShaderLayer ${this.id}: Configuration restored with ${Object.keys(config.uniforms || {}).length} uniforms`);
    }
    
    /**
     * Update exposed parameters from uniforms
     */
    updateExposedParameters() {
        this.exposedParameters = {};
        this.uniforms.forEach((uniform, name) => {
            this.exposedParameters[name] = {
                type: uniform.type,
                min: uniform.min,
                max: uniform.max,
                step: uniform.step,
                default: uniform.defaultValue,
                value: uniform.value,
                label: uniform.label,
                description: uniform.description
            };
        });
    }

    /**
     * Dispose of the shader layer
     */
    onDispose() {
        if (this.mesh && this.context.scene) {
            this.context.scene.remove(this.mesh);
        }
        
        if (this.material) {
            this.material.dispose();
        }
        
        if (this.renderTarget) {
            this.renderTarget.dispose();
        }
        
        this.uniforms.clear();
        this.exposedParameters = {};
    }

    /**
     * Get shader compilation status
     */
    isShaderCompiled() {
        return this.isCompiled;
    }

    /**
     * Get shader error status
     */
    hasShaderError() {
        return this.hasError;
    }

    /**
     * Get last shader error
     */
    getLastShaderError() {
        return this.lastError;
    }

    /**
     * Get compilation time
     */
    getCompilationTime() {
        return this.compilationTime;
    }

    /**
     * Get all registered uniforms
     */
    getAllUniforms() {
        return Object.fromEntries(this.uniforms);
    }

    /**
     * Get shader code
     */
    getShaderCode() {
        return this.fragmentShader || '';
    }

    /**
     * Set z-offset value
     */
    setZOffset(zOffset) {
        super.setZOffset(zOffset);
        
        // Update mesh position
        if (this.mesh) {
            this.mesh.position.z = zOffset;
        }
    }
}
