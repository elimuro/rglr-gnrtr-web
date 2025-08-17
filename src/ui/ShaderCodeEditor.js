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
            'default': {
                name: 'Default Pattern',
                description: 'Animated wave pattern with parameters',
                url: '/shaders/default.frag',
                fallback: this.getDefaultShader(),
                category: 'basic'
            },
            'noise': {
                name: 'Animated Noise',
                description: 'Simple animated noise pattern',
                url: '/shaders/noise.frag',
                fallback: this.getNoiseShader(),
                category: 'basic'
            },
            'plasma': {
                name: 'Plasma Effects',
                description: 'Colorful plasma waves with distortion',
                url: '/shaders/plasma.frag',
                fallback: this.getPlasmaShader(),
                category: 'visual'
            },
            'kaleidoscope': {
                name: 'Kaleidoscope',
                description: 'Symmetrical kaleidoscope patterns',
                url: '/shaders/kaleidoscope.frag',
                fallback: this.getKaleidoscopeShader(),
                category: 'visual'
            },
            'mandala': {
                name: 'Mandala Patterns',
                description: 'Radial mandala with pulsing animation',
                url: '/shaders/mandala.frag',
                fallback: this.getMandalaShader(),
                category: 'visual'
            },
            'voronoi': {
                name: 'Voronoi Cells',
                description: 'Animated cellular Voronoi diagram',
                url: '/shaders/voronoi.frag',
                fallback: this.getVoronoiShader(),
                category: 'generative'
            },
            'physarum': {
                name: 'Physarum Simulation',
                description: 'GPU-accelerated Physarum algorithm',
                url: '/shaders/physarum.frag',
                fallback: this.getPhysarumShader(),
                category: 'simulation'
            },
            'flocking': {
                name: 'Flocking Behavior',
                description: 'GPU-accelerated flocking simulation',
                url: '/shaders/flocking.frag',
                fallback: this.getFlockingShader(),
                category: 'simulation'
            },
            'reaction-diffusion': {
                name: 'Reaction-Diffusion',
                description: 'Chemical reaction-diffusion system',
                url: '/shaders/reaction-diffusion.frag',
                fallback: this.getReactionDiffusionShader(),
                category: 'simulation'
            },
            'blend-test': {
                name: 'Blend Mode Test',
                description: 'Test patterns for blend mode testing',
                url: '/shaders/blend-test.frag',
                fallback: this.getBlendTestShader(),
                category: 'basic'
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
                                <option value="plasma">Plasma Effects</option>
                                <option value="kaleidoscope">Kaleidoscope</option>
                                <option value="mandala">Mandala Patterns</option>
                                <option value="voronoi">Voronoi Cells</option>
                                <option value="physarum">Physarum</option>
                                <option value="flocking">Flocking</option>
                                <option value="reaction-diffusion">Reaction-Diffusion</option>
                                <option value="blend-test">Blend Mode Test</option>
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
            this.setupGLSLLanguage();
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
                    this.setupGLSLLanguage();
                    resolve();
                });
            };
            script.onerror = () => reject(new Error('Failed to load Monaco Editor'));
            document.head.appendChild(script);
        });
    }

    /**
     * Set up GLSL language definition and syntax highlighting
     */
    setupGLSLLanguage() {
        if (!window.monaco) return;
        
        // Register GLSL language if not already registered
        const languages = window.monaco.languages.getLanguages();
        const glslExists = languages.some(lang => lang.id === 'glsl');
        
        if (!glslExists) {
            // Register GLSL language
            window.monaco.languages.register({ id: 'glsl' });
            
            // Define GLSL tokens and syntax highlighting
            window.monaco.languages.setMonarchTokensProvider('glsl', {
                tokenizer: {
                    root: [
                        // Keywords
                        [/\b(attribute|const|uniform|varying|layout|centroid|flat|smooth|noperspective|patch|sample)\b/, 'keyword'],
                        [/\b(break|continue|do|for|while|switch|case|default|if|else|subroutine|in|out|inout|true|false|invariant|discard|return|lowp|mediump|highp|precision)\b/, 'keyword'],
                        
                        // Storage qualifiers
                        [/\b(const|attribute|uniform|varying|in|out|inout|centroid|patch|sample|buffer|shared|coherent|volatile|restrict|readonly|writeonly)\b/, 'keyword.storage'],
                        
                        // Types
                        [/\b(void|bool|int|uint|float|double|vec[234]|dvec[234]|bvec[234]|ivec[234]|uvec[234]|mat[234]|mat[234]x[234]|dmat[234]|dmat[234]x[234]|sampler[12]D|sampler3D|samplerCube|sampler[12]DArray|samplerCubeArray|samplerBuffer|sampler2DMS|sampler2DMSArray|samplerCubeShadow|sampler[12]DShadow|sampler[12]DArrayShadow|samplerCubeArrayShadow|isampler[12]D|isampler3D|isamplerCube|isampler[12]DArray|isamplerCubeArray|isamplerBuffer|isampler2DMS|isampler2DMSArray|usampler[12]D|usampler3D|usamplerCube|usampler[12]DArray|usamplerCubeArray|usamplerBuffer|usampler2DMS|usampler2DMSArray|image[12]D|image3D|imageCube|image[12]DArray|imageCubeArray|imageBuffer|image2DMS|image2DMSArray|iimage[12]D|iimage3D|iimageCube|iimage[12]DArray|iimageCubeArray|iimageBuffer|iimage2DMS|iimage2DMSArray|uimage[12]D|uimage3D|uimageCube|uimage[12]DArray|uimageCubeArray|uimageBuffer|uimage2DMS|uimage2DMSArray|atomic_uint)\b/, 'type'],
                        
                        // Built-in functions
                        [/\b(radians|degrees|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|pow|exp|log|exp2|log2|sqrt|inversesqrt|abs|sign|floor|trunc|round|roundEven|ceil|fract|mod|modf|min|max|clamp|mix|step|smoothstep|isnan|isinf|floatBitsToInt|floatBitsToUint|intBitsToFloat|uintBitsToFloat|fma|frexp|ldexp|packUnorm2x16|packSnorm2x16|packUnorm4x8|packSnorm4x8|unpackUnorm2x16|unpackSnorm2x16|unpackUnorm4x8|unpackSnorm4x8|packDouble2x32|unpackDouble2x32|packHalf2x16|unpackHalf2x16|length|distance|dot|cross|normalize|faceforward|reflect|refract|matrixCompMult|outerProduct|transpose|determinant|inverse|lessThan|lessThanEqual|greaterThan|greaterThanEqual|equal|notEqual|any|all|not|uaddCarry|usubBorrow|umulExtended|imulExtended|bitfieldExtract|bitfieldInsert|bitfieldReverse|bitCount|findLSB|findMSB|textureSize|textureQueryLod|textureQueryLevels|texture|textureProj|textureLod|textureOffset|texelFetch|texelFetchOffset|textureProjOffset|textureLodOffset|textureProjLod|textureProjLodOffset|textureGrad|textureGradOffset|textureProjGrad|textureProjGradOffset|textureGather|textureGatherOffset|textureGatherOffsets|texture2D|texture2DProj|texture2DLod|texture2DProjLod|textureCube|textureCubeLod|dFdx|dFdy|dFdxFine|dFdyFine|dFdxCoarse|dFdyCoarse|fwidth|fwidthFine|fwidthCoarse|interpolateAtCentroid|interpolateAtSample|interpolateAtOffset|noise1|noise2|noise3|noise4|EmitStreamVertex|EndStreamPrimitive|EmitVertex|EndPrimitive|barrier|memoryBarrier|memoryBarrierAtomicCounter|memoryBarrierBuffer|memoryBarrierShared|memoryBarrierImage|groupMemoryBarrier|atomicAdd|atomicMin|atomicMax|atomicAnd|atomicOr|atomicXor|atomicExchange|atomicCompSwap|imageLoad|imageStore|imageAtomicAdd|imageAtomicMin|imageAtomicMax|imageAtomicAnd|imageAtomicOr|imageAtomicXor|imageAtomicExchange|imageAtomicCompSwap|imageSize|imageSamples)\b/, 'predefined'],
                        
                        // Built-in variables
                        [/\b(gl_VertexID|gl_InstanceID|gl_DrawID|gl_BaseVertex|gl_BaseInstance|gl_Position|gl_PointSize|gl_ClipDistance|gl_CullDistance|gl_PrimitiveIDIn|gl_InvocationID|gl_PrimitiveID|gl_Layer|gl_ViewportIndex|gl_PatchVerticesIn|gl_TessLevelOuter|gl_TessLevelInner|gl_TessCoord|gl_FragCoord|gl_FrontFacing|gl_ClipDistance|gl_CullDistance|gl_PointCoord|gl_PrimitiveID|gl_SampleID|gl_SamplePosition|gl_SampleMaskIn|gl_Layer|gl_ViewportIndex|gl_FragColor|gl_FragData|gl_FragDepth|gl_SampleMask|gl_ClipVertex|gl_FrontColor|gl_BackColor|gl_FrontSecondaryColor|gl_BackSecondaryColor|gl_TexCoord|gl_FogFragCoord|gl_Color|gl_SecondaryColor|gl_Normal|gl_Vertex|gl_MultiTexCoord0|gl_MultiTexCoord1|gl_MultiTexCoord2|gl_MultiTexCoord3|gl_MultiTexCoord4|gl_MultiTexCoord5|gl_MultiTexCoord6|gl_MultiTexCoord7|gl_FogCoord|gl_ModelViewMatrix|gl_ProjectionMatrix|gl_ModelViewProjectionMatrix|gl_TextureMatrix|gl_NormalMatrix|gl_ModelViewMatrixInverse|gl_ProjectionMatrixInverse|gl_ModelViewProjectionMatrixInverse|gl_TextureMatrixInverse|gl_ModelViewMatrixTranspose|gl_ProjectionMatrixTranspose|gl_ModelViewProjectionMatrixTranspose|gl_TextureMatrixTranspose|gl_ModelViewMatrixInverseTranspose|gl_ProjectionMatrixInverseTranspose|gl_ModelViewProjectionMatrixInverseTranspose|gl_TextureMatrixInverseTranspose|gl_NormalScale|gl_DepthRange|gl_ClipPlane|gl_Point|gl_FrontMaterial|gl_BackMaterial|gl_LightSource|gl_LightModel|gl_FrontLightModelProduct|gl_BackLightModelProduct|gl_FrontLightProduct|gl_BackLightProduct|gl_TextureEnvColor|gl_EyePlaneS|gl_EyePlaneT|gl_EyePlaneR|gl_EyePlaneQ|gl_ObjectPlaneS|gl_ObjectPlaneT|gl_ObjectPlaneR|gl_ObjectPlaneQ|gl_Fog|gl_MaxLights|gl_MaxClipPlanes|gl_MaxTextureUnits|gl_MaxTextureCoords|gl_MaxVertexAttribs|gl_MaxVertexUniformComponents|gl_MaxVaryingFloats|gl_MaxVertexTextureImageUnits|gl_MaxTextureImageUnits|gl_MaxFragmentUniformComponents|gl_MaxCombinedTextureImageUnits|gl_MaxDrawBuffers|gl_MaxVertexUniformVectors|gl_MaxFragmentUniformVectors|gl_MaxVaryingVectors|gl_NumWorkGroups|gl_WorkGroupSize|gl_WorkGroupID|gl_LocalInvocationID|gl_GlobalInvocationID|gl_LocalInvocationIndex)\b/, 'variable.predefined'],
                        
                        // Numbers
                        [/\d*\.\d+([eE][\-+]?\d+)?[fFhH]?/, 'number.float'],
                        [/0[xX][0-9a-fA-F]+[uU]?/, 'number.hex'],
                        [/\d+[uU]?/, 'number'],
                        
                        // Strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],
                        
                        // Comments
                        [/\/\*/, 'comment', '@comment'],
                        [/\/\/.*$/, 'comment'],
                        
                        // Preprocessor
                        [/#\s*\w+/, 'keyword.preprocessor'],
                        
                        // Delimiters and operators
                        [/[{}()\[\]]/, '@brackets'],
                        [/[<>](?!@symbols)/, '@brackets'],
                        [/@symbols/, 'delimiter'],
                        
                        // Identifiers
                        [/[a-zA-Z_]\w*/, 'identifier']
                    ],
                    
                    comment: [
                        [/[^\/*]+/, 'comment'],
                        [/\*\//, 'comment', '@pop'],
                        [/[\/*]/, 'comment']
                    ],
                    
                    string: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape.invalid'],
                        [/"/, 'string', '@pop']
                    ]
                },
                
                symbols: /[=><!~?:&|+\-*\/\^%]+/
            });
            
            // Define custom theme for GLSL
            window.monaco.editor.defineTheme('glsl-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
                    { token: 'keyword.storage', foreground: '569cd6', fontStyle: 'bold' },
                    { token: 'keyword.preprocessor', foreground: '9b9b9b' },
                    { token: 'type', foreground: '4ec9b0', fontStyle: 'bold' },
                    { token: 'predefined', foreground: 'dcdcaa' },
                    { token: 'variable.predefined', foreground: '9cdcfe' },
                    { token: 'number', foreground: 'b5cea8' },
                    { token: 'number.float', foreground: 'b5cea8' },
                    { token: 'number.hex', foreground: 'b5cea8' },
                    { token: 'string', foreground: 'ce9178' },
                    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
                    { token: 'delimiter', foreground: 'dcdcdc' },
                    { token: 'identifier', foreground: 'd4d4d4' }
                ],
                colors: {
                    'editor.background': '#1e1e1e',
                    'editor.foreground': '#d4d4d4',
                    'editorLineNumber.foreground': '#858585',
                    'editorCursor.foreground': '#aeafad',
                    'editor.selectionBackground': '#264f78',
                    'editor.inactiveSelectionBackground': '#3a3d41'
                }
            });
            
            // Configure language features
            window.monaco.languages.setLanguageConfiguration('glsl', {
                comments: {
                    lineComment: '//',
                    blockComment: ['/*', '*/']
                },
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '"', close: '"', notIn: ['string'] },
                    { open: '/*', close: ' */', notIn: ['string'] }
                ],
                surroundingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '"', close: '"' }
                ],
                folding: {
                    markers: {
                        start: new RegExp('^\\s*//\\s*#?region\\b'),
                        end: new RegExp('^\\s*//\\s*#?endregion\\b')
                    }
                }
            });
        }
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
            theme: 'glsl-dark',
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
            wordWrap: 'on',
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: false,
            renderWhitespace: 'selection',
            renderControlCharacters: false,
            fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", "Monaco", monospace',
            fontLigatures: true,
            cursorStyle: 'line',
            cursorBlinking: 'blink',
            matchBrackets: 'always',
            autoIndent: 'advanced',
            formatOnPaste: true,
            formatOnType: true
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
     * Get plasma shader preset
     */
    getPlasmaShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float frequency;
uniform float amplitude;
uniform float speed;
uniform float distortion;
uniform float colorSpeed;

varying vec2 vUv;

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = vUv;
    
    float freq = mix(5.0, 15.0, clamp(frequency, 0.0, 1.0));
    float amp = mix(0.3, 1.0, clamp(amplitude, 0.0, 1.0));
    float spd = mix(1.0, 3.0, clamp(speed, 0.0, 1.0));
    
    float plasma = 0.0;
    plasma += sin(uv.x * freq + time * spd) * amp;
    plasma += sin(uv.y * freq * 1.2 + time * spd * 0.8) * amp;
    plasma += sin((uv.x + uv.y) * freq * 0.8 + time * spd * 1.2) * amp;
    
    plasma = plasma * 0.25 + 0.5;
    vec3 color = palette(plasma + time * 0.1);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get kaleidoscope shader preset
     */
    getKaleidoscopeShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float segments;
uniform float rotation;
uniform float zoom;

varying vec2 vUv;

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    
    float segs = mix(6.0, 12.0, clamp(segments, 0.0, 1.0));
    float rotSpeed = mix(-1.0, 1.0, clamp(rotation, 0.0, 1.0));
    float zoomLevel = mix(0.5, 2.0, clamp(zoom, 0.0, 1.0));
    
    float angle = atan(uv.y, uv.x) + time * rotSpeed;
    float radius = length(uv);
    
    angle = mod(angle, 2.0 * 3.14159 / segs);
    if (mod(floor(angle / (3.14159 / segs)), 2.0) == 1.0) {
        angle = (3.14159 / segs) - mod(angle, 3.14159 / segs);
    }
    
    vec2 pos = vec2(cos(angle), sin(angle)) * radius * zoomLevel;
    
    float pattern = sin(pos.x * 8.0 + time * 0.5) * cos(pos.y * 8.0 + time * 0.3);
    vec3 color = vec3(0.5 + 0.5 * pattern, 0.3 + 0.7 * abs(pattern), 0.8);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get mandala shader preset
     */
    getMandalaShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float complexity;
uniform float pulseSpeed;
uniform float innerRadius;

varying vec2 vUv;

void main() {
    vec2 uv = vUv - 0.5;
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    float comp = mix(3.0, 8.0, clamp(complexity, 0.0, 1.0));
    float pulse = mix(0.5, 2.0, clamp(pulseSpeed, 0.0, 1.0));
    float innerR = mix(0.1, 0.6, clamp(innerRadius, 0.0, 1.0));
    
    float mandala = 0.0;
    for (float i = 1.0; i <= 6.0; i++) {
        if (i > comp) break;
        
        float petals = sin(angle * i + time * pulse * 0.5) * 0.5 + 0.5;
        float waves = sin(radius * 10.0 - time * pulse) * 0.5 + 0.5;
        float layer = petals * waves * (1.0 / i);
        
        layer *= smoothstep(innerR, innerR + 0.1, radius);
        layer *= 1.0 - smoothstep(0.3, 0.5, radius);
        
        mandala += layer;
    }
    
    vec3 color = vec3(mandala * 0.8, mandala * 0.6, mandala);
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get voronoi shader preset
     */
    getVoronoiShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform float cellCount;
uniform float animSpeed;

varying vec2 vUv;

vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

void main() {
    vec2 uv = vUv;
    float cells = mix(6.0, 15.0, clamp(cellCount, 0.0, 1.0));
    float speed = mix(0.5, 1.5, clamp(animSpeed, 0.0, 1.0));
    
    vec2 scaledUV = uv * cells;
    vec2 gridPos = floor(scaledUV);
    vec2 localPos = fract(scaledUV);
    
    float minDist = 2.0;
    vec2 closestPoint;
    
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 cellCenter = neighbor + gridPos;
            
            vec2 offset = hash22(cellCenter);
            offset += 0.3 * sin(time * speed + cellCenter.x * 2.0);
            
            vec2 cellPos = neighbor + 0.5 + offset * 0.4;
            float dist = length(localPos - cellPos);
            
            if (dist < minDist) {
                minDist = dist;
                closestPoint = cellCenter;
            }
        }
    }
    
    float cellHash = fract(sin(dot(closestPoint, vec2(127.1, 311.7))) * 43758.5453);
    vec3 color = vec3(0.3 + 0.7 * cellHash, 0.5 + 0.5 * sin(cellHash * 6.28), 0.8);
    
    gl_FragColor = vec4(color, opacity);
}`;
    }

    /**
     * Get blend test shader preset
     */
    getBlendTestShader() {
        return `precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform float opacity;

// Simple test parameters for blend mode testing
uniform float colorShift;    // [0..1] - shifts through rainbow colors
uniform float pattern;       // [0..1] - changes pattern type
uniform float intensity;     // [0..1] - brightness multiplier

varying vec2 vUv;

void main() {
    // Centered UV coordinates
    vec2 uv = vUv - 0.5;
    
    // Create different test patterns based on the pattern parameter
    float patternValue = 0.0;
    
    if (pattern < 0.25) {
        // Radial gradient
        patternValue = length(uv);
    } else if (pattern < 0.5) {
        // Horizontal stripes
        patternValue = sin(uv.y * 20.0 + time) * 0.5 + 0.5;
    } else if (pattern < 0.75) {
        // Checkerboard
        vec2 grid = floor(uv * 10.0);
        patternValue = mod(grid.x + grid.y, 2.0);
    } else {
        // Circular waves
        patternValue = sin(length(uv) * 15.0 - time * 3.0) * 0.5 + 0.5;
    }
    
    // Create rainbow colors based on colorShift
    float hue = colorShift + patternValue * 0.5;
    vec3 color = vec3(
        sin(hue * 6.28318) * 0.5 + 0.5,
        sin((hue + 0.33) * 6.28318) * 0.5 + 0.5,
        sin((hue + 0.66) * 6.28318) * 0.5 + 0.5
    );
    
    // Apply intensity
    color *= mix(0.3, 1.0, intensity);
    
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
