/**
 * ShaderCodeEditor.js - GLSL Shader Code Editor
 * This component provides a Monaco Editor for editing GLSL shader code with syntax highlighting,
 * real-time compilation, and parameter exposure for the shader layer system.
 */

export class ShaderCodeEditor {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.shaderLayer = null;
        this.onCodeChange = null;
        
        // Editor state
        this.editor = null;
        this.isMonacoLoaded = false;
        this.isInitialized = false;
        this.isVisible = false;
        
        // Shader presets (served from public/shaders). Fallbacks keep editor usable offline.
        this.shaderPresets = {
            'noise': {
                name: 'Animated Noise',
                description: 'Simple animated noise pattern',
                url: '/shaders/noise.frag',
                fallback: this.getNoiseShader()
            },
            'physarum': {
                name: 'Physarum Simulation',
                description: 'GPU-accelerated Physarum algorithm',
                url: '/shaders/physarum.frag',
                fallback: this.getPhysarumShader()
            },
            'flocking': {
                name: 'Flocking Behavior',
                description: 'GPU-accelerated flocking simulation',
                url: '/shaders/flocking.frag',
                fallback: this.getFlockingShader()
            },
            'reaction-diffusion': {
                name: 'Reaction-Diffusion',
                description: 'Chemical reaction-diffusion system',
                url: '/shaders/reaction-diffusion.frag',
                fallback: this.getReactionDiffusionShader()
            },
            'custom': {
                name: 'Custom Shader',
                description: 'Start with a blank shader',
                url: '/shaders/default.frag',
                fallback: this.getDefaultShader()
            }
        };
        
        // Don't auto-initialize, wait for open() call
        this.isInitialized = false;
    }

    /**
     * Open the shader code editor
     */
    async open() {
        if (this.isInitialized) {
            this.show();
            return;
        }

        // Get or create shader layer
        this.shaderLayer = this.app.layerManager.getLayer('shader');
        if (!this.shaderLayer) {
            try {
                this.shaderLayer = await this.app.addShaderLayer();
            } catch (error) {
                console.error('Failed to create shader layer:', error);
                return;
            }
        }

        // Set up code change handler
        this.onCodeChange = (code) => {
            if (this.shaderLayer) {
                this.shaderLayer.compileShader(code)
                    .then(() => {
                        this.updateParameterPanel();
                        this.showStatus('Auto-compiled', 'success');
                        try { this.app.controlManager?.refreshShaderParameters?.(); } catch (_) {}
                    })
                    .catch(error => {
                        console.error('Shader compilation failed:', error);
                        this.showStatus('Compilation failed', 'error');
                    });
            }
        };

        // Create editor overlay
        this.createEditorOverlay();
        
        // Initialize the editor
        await this.init();
        
        this.show();
    }

    /**
     * Create editor overlay
     */
    createEditorOverlay() {
        // Create overlay container to mirror P5 editor structure
        const overlay = document.createElement('div');
        overlay.id = 'shader-code-editor-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4';
        
        overlay.innerHTML = `
            <div class="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-gray-600">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <h2 class="text-lg font-semibold text-white">Shader Code Editor</h2>
                        <span class="text-sm text-gray-400">Layer: ${this.shaderLayer?.id || 'shader'}</span>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <!-- Preset Selector -->
                        <div class="flex items-center gap-2">
                            <label class="text-sm text-gray-300">Preset:</label>
                            <select id="shader-preset-selector" class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white">
                                <option value="">Select...</option>
                                <option value="noise">Animated Noise</option>
                                <option value="physarum">Physarum</option>
                                <option value="flocking">Flocking</option>
                                <option value="reaction-diffusion">Reaction-Diffusion</option>
                                <option value="custom">Custom</option>
                            </select>
                            <button id="shader-editor-load-preset" class="btn btn-primary btn-sm">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 4h6a2 2 0 0 1 2 2v14"/>
                                    <path d="M14 4h7a2 2 0 0 1 2 2v14"/>
                                </svg>
                                Load
                            </button>
                        </div>
                        
                        <button id="shader-editor-compile" class="btn btn-success btn-sm">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5,3 19,12 5,21"></polygon>
                            </svg>
                            Compile
                        </button>
                        
                        <button id="shader-editor-reset" class="btn btn-secondary btn-sm">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                <path d="M21 3v5h5"/>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                <path d="M3 21v-5h5"/>
                            </svg>
                            Reset
                        </button>
                        
                        <button id="shader-editor-close" class="btn btn-danger btn-sm">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18"/>
                                <path d="M6 6l12 12"/>
                            </svg>
                            Close
                        </button>
                    </div>
                </div>
                
                <!-- Editor Container -->
                <div class="flex-1 flex">
                    <!-- Code Editor -->
                    <div class="flex-1 flex flex-col">
                        <div class="px-4 py-2 bg-gray-800 border-b border-gray-600">
                            <h3 class="text-sm font-medium text-gray-300">Fragment Shader</h3>
                        </div>
                        <div id="shader-monaco-editor" class="flex-1"></div>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="w-80 border-l border-gray-600 bg-gray-850">
                        <div class="px-4 py-2 bg-gray-800 border-b border-gray-600">
                            <h3 class="text-sm font-medium text-gray-300">Parameters & Info</h3>
                        </div>
                        <div class="p-4 space-y-4">
                            <div>
                                <h4 class="text-xs font-medium text-gray-400 mb-2">Exposed Uniforms</h4>
                                <div id="shader-parameter-list" class="space-y-2 text-sm"></div>
                            </div>
                            <div>
                                <h4 class="text-xs font-medium text-gray-400 mb-2">Quick Reference</h4>
                                <div class="text-xs text-gray-500 space-y-1">
                                    <div><code class="text-orange-400">uniform float time;</code></div>
                                    <div><code class="text-orange-400">uniform vec2 resolution;</code></div>
                                    <div><code class="text-orange-400">varying vec2 vUv;</code></div>
                                    <div><code class="text-orange-400">void main() { gl_FragColor = ...; }</code></div>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-xs font-medium text-gray-400 mb-2">Status</h4>
                                <div id="shader-editor-status" class="text-sm">
                                    <div class="flex items-center gap-2">
                                        <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span class="text-yellow-400">Idle</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.container = overlay;
        
        // Hook up controls
        setTimeout(() => {
            const closeBtn = document.getElementById('shader-editor-close');
            const compileBtn = document.getElementById('shader-editor-compile');
            const resetBtn = document.getElementById('shader-editor-reset');
            const loadPresetBtn = document.getElementById('shader-editor-load-preset');
            const presetSelector = document.getElementById('shader-preset-selector');
            
            if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
            if (compileBtn) compileBtn.addEventListener('click', () => this.compileShader());
            if (resetBtn) resetBtn.addEventListener('click', () => this.resetShader());
            if (loadPresetBtn && presetSelector) {
                loadPresetBtn.addEventListener('click', () => {
                    const key = presetSelector.value;
                    if (key) this.loadPreset(key);
                });
            }
            
            // Close on overlay background click
            this.container.addEventListener('click', (event) => {
                if (event.target === this.container) this.hide();
            });
        }, 10);
    }

    /**
     * Initialize the shader code editor
     */
    async init() {
        try {
            // Load Monaco Editor
            await this.loadMonaco();
            
            // Initialize Monaco Editor (overlay HTML is already created)
            this.initMonacoEditor();
            
            // Load initial shader code
            await this.loadInitialShaderCode();
            // Populate parameter panel for current shader
            this.updateParameterPanel();
            
            // Global listeners (Escape to close)
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Failed to initialize ShaderCodeEditor:', error);
            this.showError('Failed to initialize shader editor: ' + error.message);
        }
    }

    /**
     * Load Monaco Editor from CDN
     */
    async loadMonaco() {
        if (window.monaco) {
            this.isMonacoLoaded = true;
            return;
        }
        
        return new Promise((resolve, reject) => {
            // Load Monaco Editor CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/editor/editor.main.css';
            document.head.appendChild(link);
            
            // Load Monaco Editor script
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
            script.onload = () => {
                // Configure Monaco loader
                window.require.config({
                    paths: {
                        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
                    }
                });
                
                // Load Monaco Editor
                window.require(['vs/editor/editor.main'], () => {
                    this.isMonacoLoaded = true;
                    resolve();
                });
            };
            script.onerror = () => reject(new Error('Failed to load Monaco Editor'));
            document.head.appendChild(script);
        });
    }

    /**
     * Create the editor UI
     */
    createEditorUI() {
        // Clear container
        this.container.innerHTML = '';
        
        // Add CSS styles
        this.addStyles();
        
        // Create header
        const header = document.createElement('div');
        header.className = 'shader-editor-header';
        header.innerHTML = `
            <div class="shader-editor-title">
                <h3>Shader Code Editor</h3>
                <span class="shader-status" id="shader-status">Ready</span>
            </div>
            <div class="shader-editor-controls">
                <select id="shader-preset-select" class="shader-preset-select">
                    <option value="">Load Preset...</option>
                </select>
                <button id="compile-shader-btn" class="compile-btn">Compile</button>
                <button id="reset-shader-btn" class="reset-btn">Reset</button>
                <button id="close-shader-editor-btn" class="close-btn">✕</button>
            </div>
        `;
        
        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.id = 'shader-editor-container';
        editorContainer.className = 'shader-editor-container';
        
        // Create error display
        const errorDisplay = document.createElement('div');
        errorDisplay.id = 'shader-error-display';
        errorDisplay.className = 'shader-error-display hidden';
        
        // Create parameter panel
        const parameterPanel = document.createElement('div');
        parameterPanel.id = 'shader-parameter-panel';
        parameterPanel.className = 'shader-parameter-panel';
        parameterPanel.innerHTML = '<h4>Shader Parameters</h4><div id="shader-parameters"></div>';
        
        // Add to container
        this.container.appendChild(header);
        this.container.appendChild(editorContainer);
        this.container.appendChild(errorDisplay);
        this.container.appendChild(parameterPanel);
        
        // Populate preset select
        this.populatePresetSelect();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Add CSS styles for the shader editor
     */
    addStyles() {
        if (document.getElementById('shader-editor-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'shader-editor-styles';
        style.textContent = `
            .shader-editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: rgba(255, 100, 0, 0.1);
                border-bottom: 1px solid rgba(255, 100, 0, 0.3);
            }
            
            .shader-editor-title h3 {
                margin: 0;
                color: #ff6600;
                font-size: 18px;
            }
            
            .shader-status {
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .shader-status.success { background: rgba(81, 207, 102, 0.2); color: #51cf66; }
            .shader-status.error { background: rgba(255, 107, 107, 0.2); color: #ff6b6b; }
            .shader-status.compiling { background: rgba(255, 214, 59, 0.2); color: #ffd43b; }
            
            .shader-editor-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .shader-preset-select, .compile-btn, .reset-btn, .close-btn {
                padding: 8px 12px;
                border: 1px solid rgba(255, 100, 0, 0.5);
                border-radius: 4px;
                background: rgba(255, 100, 0, 0.2);
                color: white;
                cursor: pointer;
                font-size: 12px;
            }
            
            .compile-btn { background: rgba(81, 207, 102, 0.3); border-color: rgba(81, 207, 102, 0.5); }
            .reset-btn { background: rgba(255, 214, 59, 0.3); border-color: rgba(255, 214, 59, 0.5); }
            .close-btn { background: rgba(255, 107, 107, 0.3); border-color: rgba(255, 107, 107, 0.5); }
            
            .shader-editor-container {
                flex: 1;
                min-height: 400px;
                margin: 15px;
            }
            
            .shader-error-display {
                margin: 15px;
                padding: 10px;
                border-radius: 4px;
                background: rgba(255, 107, 107, 0.2);
                border: 1px solid rgba(255, 107, 107, 0.5);
                color: #ff6b6b;
            }
            
            .shader-error-display.hidden {
                display: none;
            }
            
            .shader-parameter-panel {
                margin: 15px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .shader-parameter-panel h4 {
                margin: 0 0 15px 0;
                color: #ff6600;
                font-size: 14px;
            }
            
            .shader-parameter {
                margin-bottom: 10px;
                padding: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .shader-parameter label {
                display: block;
                margin-bottom: 5px;
                color: white;
                font-size: 12px;
            }
            
            .shader-parameter input[type="range"] {
                width: 100%;
                margin-bottom: 5px;
            }
            
            .vector2-inputs {
                display: flex;
                gap: 10px;
                margin-bottom: 5px;
            }
            
            .vector2-inputs input {
                flex: 1;
                padding: 4px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                color: white;
                font-size: 11px;
            }
            
            .param-value {
                font-family: monospace;
                font-size: 11px;
                color: #ff6600;
                margin-left: 10px;
            }
            
            .param-description {
                display: block;
                font-size: 10px;
                color: #888;
                margin-top: 3px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Populate the preset select dropdown
     */
    populatePresetSelect() {
        const select = document.getElementById('shader-preset-select');
        if (!select) return;
        
        // Clear existing options if any (keep first placeholder option)
        while (select.options.length > 1) select.remove(1);

        Object.entries(this.shaderPresets).forEach(([key, preset]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = preset.name;
            option.title = preset.description;
            select.appendChild(option);
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Preset selection
        const presetSelect = document.getElementById('shader-preset-select');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadPreset(e.target.value);
                    e.target.value = ''; // Reset selection
                }
            });
        }
        
        // Compile button
        const compileBtn = document.getElementById('compile-shader-btn');
        if (compileBtn) {
            compileBtn.addEventListener('click', () => this.compileShader());
        }
        
        // Reset button
        const resetBtn = document.getElementById('reset-shader-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetShader());
        }
        
        // Close button
        const closeBtn = document.getElementById('close-shader-editor-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
    }

    /**
     * Initialize Monaco Editor
     */
    initMonacoEditor() {
        if (!this.isMonacoLoaded) {
            console.error('Monaco Editor not loaded');
            return;
        }
        
        const editorContainer = document.getElementById('shader-monaco-editor');
        if (!editorContainer) return;
        
        // Create Monaco Editor (defer to layer/public file for initial content)
        this.editor = window.monaco.editor.create(editorContainer, {
            value: '',
            language: 'glsl',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
            },
            folding: true,
            wordWrap: 'on'
        });
        
        // Set up change listener
        this.editor.onDidChangeModelContent(() => {
            if (this.onCodeChange) {
                this.onCodeChange(this.editor.getValue());
            }
        });
        
        // Set up auto-compilation (optional)
        let compileTimeout;
        this.editor.onDidChangeModelContent(() => {
            clearTimeout(compileTimeout);
            compileTimeout = setTimeout(() => {
                this.autoCompile();
            }, 2000); // Auto-compile after 2 seconds of no typing
        });
    }

    /**
     * Load initial shader code
     */
    async loadInitialShaderCode() {
        if (!this.shaderLayer) return;
        
        try {
            const code = this.shaderLayer.getShaderCode();
            if (code && this.editor) {
                this.editor.setValue(code);
            }
            else if (this.editor) {
                try {
                    const res = await fetch('/shaders/default.frag', { cache: 'no-cache' });
                    if (res.ok) {
                        const text = await res.text();
                        this.editor.setValue(text);
                    } else {
                        this.editor.setValue(this.getDefaultShader());
                    }
                } catch (_) {
                    this.editor.setValue(this.getDefaultShader());
                }
            }
        } catch (error) {
            console.warn('Failed to load initial shader code:', error);
        }
    }

    /**
     * Load a shader preset
     */
    async loadPreset(presetKey) {
        const preset = this.shaderPresets[presetKey];
        if (!preset || !this.editor) return;
        try {
            if (preset.url) {
                const res = await fetch(preset.url, { cache: 'no-cache' });
                if (!res.ok) throw new Error(`Failed to load ${preset.url}`);
                const code = await res.text();
                this.editor.setValue(code);
            } else if (preset.fallback) {
                this.editor.setValue(preset.fallback);
            }
            this.showStatus(`Loaded preset: ${preset.name}`, 'success');
            setTimeout(() => this.compileShader(), 50);
        } catch (e) {
            console.warn('Failed to fetch preset, using fallback:', e);
            if (preset.fallback) {
                this.editor.setValue(preset.fallback);
                this.showStatus(`Loaded fallback: ${preset.name}`, 'info');
                setTimeout(() => this.compileShader(), 50);
            } else {
                this.showStatus('Failed to load preset', 'error');
            }
        }
    }

    /**
     * Compile the current shader code
     */
    async compileShader() {
        if (!this.editor || !this.shaderLayer) return;
        
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.showError('Shader code cannot be empty');
            return;
        }
        
        try {
            this.showStatus('Compiling shader...', 'compiling');
            
            // Compile shader through the layer
            await this.shaderLayer.compileShader(code);
            
            // Update status
            this.showStatus('Shader compiled successfully!', 'success');
            this.hideError();
            
            // Update parameter panel
            this.updateParameterPanel();
            
            // Notify parent of code change
            if (this.onCodeChange) {
                this.onCodeChange(code);
            }
            
        } catch (error) {
            console.error('Shader compilation failed:', error);
            this.showError('Shader compilation failed: ' + error.message);
            this.showStatus('Compilation failed', 'error');
        }
    }

    /**
     * Auto-compile shader (called after typing stops)
     */
    async autoCompile() {
        if (!this.editor || !this.shaderLayer) return;
        
        const code = this.editor.getValue();
        if (!code.trim()) return;
        
        try {
            await this.shaderLayer.compileShader(code);
            this.showStatus('Auto-compiled successfully', 'success');
            this.hideError();
            this.updateParameterPanel();
        } catch (error) {
            // Don't show error for auto-compilation, just log it
            console.warn('Auto-compilation failed:', error);
        }
    }

    /**
     * Reset shader to default
     */
    resetShader() {
        if (!this.editor) return;
        
        this.editor.setValue(this.getDefaultShader());
        this.showStatus('Reset to default shader', 'info');
        this.hideError();
    }

    /**
     * Update the parameter panel with current shader parameters
     */
    updateParameterPanel() {
        if (!this.shaderLayer) return;
        
        const parametersContainer = document.getElementById('shader-parameter-list');
        if (!parametersContainer) return;
        
        try {
            const parameters = this.shaderLayer.getExposedParameters();
            
            if (Object.keys(parameters).length === 0) {
                parametersContainer.innerHTML = '<p>No parameters exposed</p>';
                return;
            }
            
            let html = '';
            Object.entries(parameters).forEach(([name, param]) => {
                html += this.createParameterHTML(name, param);
            });
            
            parametersContainer.innerHTML = html;
            
            // Set up parameter change listeners
            this.setupParameterListeners();
            
        } catch (error) {
            console.error('Failed to update parameter panel:', error);
            parametersContainer.innerHTML = '<p>Failed to load parameters</p>';
        }
    }

    /**
     * Create HTML for a parameter
     */
    createParameterHTML(name, param) {
        const id = `shader-param-${name}`;
        
        switch (param.type) {
            case 'number':
                {
                const value = (param.value !== undefined ? param.value : (param.default !== undefined ? param.default : 0));
                return `
                    <div class="shader-parameter">
                        <label for="${id}">${param.label || name}</label>
                        <input type="range" 
                               id="${id}" 
                               min="${param.min || 0}" 
                               max="${param.max || 1}" 
                               step="${param.step || 0.01}" 
                               value="${value}"
                               data-param-name="${name}">
                        <span class="param-value">${value}</span>
                        <span class="param-description">${param.description || ''}</span>
                    </div>
                `;
                }
            
            case 'vector2':
                {
                const vx = (param.value?.x ?? param.default?.x ?? 0);
                const vy = (param.value?.y ?? param.default?.y ?? 0);
                const min = (param.min !== undefined ? param.min : 0);
                const max = (param.max !== undefined ? param.max : 1);
                const step = (param.step !== undefined ? param.step : 0.01);
                return `
                    <div class="shader-parameter">
                        <label>${param.label || name}</label>
                        <div class="vector2-inputs">
                            <input type="range" 
                                   id="${id}-x" 
                                   min="${min}" max="${max}" step="${step}"
                                   value="${vx}"
                                   data-param-name="${name}"
                                   data-param-component="x">
                            <input type="range" 
                                   id="${id}-y" 
                                   min="${min}" max="${max}" step="${step}"
                                   value="${vy}"
                                   data-param-name="${name}"
                                   data-param-component="y">
                        </div>
                        <span class="param-description">${param.description || ''}</span>
                    </div>
                `;
                }
            
            default:
                return `
                    <div class="shader-parameter">
                        <label>${param.label || name}</label>
                        <span class="param-value">${(param.value !== undefined ? param.value : (param.default !== undefined ? param.default : 'N/A'))}</span>
                        <span class="param-description">${param.description || ''}</span>
                    </div>
                `;
        }
    }

    /**
     * Set up parameter change listeners
     */
    setupParameterListeners() {
        // Range inputs
        document.querySelectorAll('input[type="range"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const name = e.target.dataset.paramName;
                const value = parseFloat(e.target.value);
                this.updateParameterValue(name, value);
                
                // Update display value
                const valueSpan = e.target.parentNode.querySelector('.param-value');
                if (valueSpan) {
                    valueSpan.textContent = value;
                }
            });
        });
        
        // Range inputs for vector2 components
        document.querySelectorAll('input[type="range"][data-param-component]').forEach(input => {
            input.addEventListener('input', (e) => {
                const name = e.target.dataset.paramName;
                const component = e.target.dataset.paramComponent;
                const value = parseFloat(e.target.value);
                this.updateParameterValue(name, value, component);
            });
        });
    }

    /**
     * Update a parameter value
     */
    updateParameterValue(name, value, component = null) {
        if (!this.shaderLayer) return;
        
        try {
            if (component) {
                // Vector component update
                const currentValue = this.shaderLayer.getParameter(name) || { x: 0, y: 0 };
                currentValue[component] = value;
                this.shaderLayer.setParameter(name, currentValue);
            } else {
                // Scalar update
                this.shaderLayer.setParameter(name, value);
            }
        } catch (error) {
            console.error(`Failed to update parameter ${name}:`, error);
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        const statusWrapper = document.getElementById('shader-editor-status');
        if (!statusWrapper) return;
        const dot = statusWrapper.querySelector('div.w-2');
        const text = statusWrapper.querySelector('span');
        if (text) text.textContent = message;
        if (dot) {
            dot.classList.remove('bg-green-500','bg-yellow-500','bg-red-500');
            if (type === 'success') dot.classList.add('bg-green-500');
            else if (type === 'error') dot.classList.add('bg-red-500');
            else dot.classList.add('bg-yellow-500');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showStatus(message, 'error');
    }

    /**
     * Hide error message
     */
    hideError() {
        this.showStatus('Ready', 'success');
    }

    /**
     * Get current shader code
     */
    getShaderCode() {
        return this.editor ? this.editor.getValue() : '';
    }

    /**
     * Set shader code
     */
    setShaderCode(code) {
        if (this.editor) {
            this.editor.setValue(code);
        }
    }

    /**
     * Get default shader code
     */
    getDefaultShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    
    // Simple animated pattern
    float pattern = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time);
    vec3 color = vec3(pattern * 0.5 + 0.5);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get noise shader preset
     */
    getNoiseShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

varying vec2 vUv;

// Simple hash function for noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth noise
float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec2 uv = vUv;
    
    // Animated noise
    float noise = smoothNoise(uv * 10.0 + time * 0.5);
    vec3 color = vec3(noise);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get Physarum shader preset
     */
    getPhysarumShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float agentCount;
uniform float trailDecay;
uniform float sensorDistance;

varying vec2 vUv;

// Physarum-inspired pattern
void main() {
    vec2 uv = vUv;
    
    // Create organic, branching patterns
    float pattern = 0.0;
    
    for (int i = 0; i < 5; i++) {
        float angle = float(i) * 2.0 * 3.14159 / 5.0;
        vec2 offset = vec2(cos(angle), sin(angle)) * 0.1;
        
        float branch = sin(uv.x * 20.0 + time * 0.5 + angle) * 
                      sin(uv.y * 20.0 + time * 0.3 + angle);
        
        pattern += branch * 0.2;
    }
    
    // Add some organic variation
    pattern += sin(uv.x * 50.0 + time * 0.2) * 0.1;
    pattern += sin(uv.y * 30.0 + time * 0.4) * 0.1;
    
    vec3 color = vec3(pattern * 0.5 + 0.5);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get flocking shader preset
     */
    getFlockingShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float agentCount;
uniform float sensorDistance;

varying vec2 vUv;

// Flocking-inspired pattern
void main() {
    vec2 uv = vUv;
    
    // Create flowing, flocking-like patterns
    float pattern = 0.0;
    
    // Multiple wave sources
    for (int i = 0; i < 3; i++) {
        float angle = float(i) * 2.0 * 3.14159 / 3.0;
        vec2 center = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.3;
        
        float dist = length(uv - center);
        float wave = sin(dist * 20.0 - time * 2.0) * exp(-dist * 3.0);
        
        pattern += wave * 0.3;
    }
    
    // Add flowing motion
    pattern += sin(uv.x * 15.0 + time * 1.5) * 0.2;
    pattern += sin(uv.y * 12.0 + time * 1.2) * 0.2;
    
    vec3 color = vec3(pattern * 0.5 + 0.5);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get reaction-diffusion shader preset
     */
    getReactionDiffusionShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float trailDecay;

varying vec2 vUv;

// Reaction-diffusion inspired pattern
void main() {
    vec2 uv = vUv;
    
    // Create chemical-like patterns
    float pattern = 0.0;
    
    // Base chemical concentration
    float chem1 = sin(uv.x * 25.0 + time * 0.8) * 0.5 + 0.5;
    float chem2 = sin(uv.y * 20.0 + time * 0.6) * 0.5 + 0.5;
    
    // Reaction between chemicals
    pattern = chem1 * chem2;
    
    // Add diffusion-like spreading
    pattern += sin(uv.x * 40.0 + time * 0.4) * 0.3;
    pattern += sin(uv.y * 35.0 + time * 0.5) * 0.3;
    
    // Create spots and patterns
    float spots = sin(uv.x * 60.0 + time * 0.3) * sin(uv.y * 45.0 + time * 0.4);
    pattern += spots * 0.2;
    
    vec3 color = vec3(pattern * 0.5 + 0.5);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Toggle the editor visibility
     */
    toggle() {
        // If not initialized or overlay not created yet, open editor
        if (!this.isInitialized || !this.container) {
            this.open();
            return;
        }
        // Otherwise toggle visibility
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show the editor
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * Hide the editor
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Dispose of the editor
     */
    dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
        
        this.isVisible = false;
        this.isInitialized = false;
    }
}
