/**
 * P5CodeEditor.js - P5.js Code Editor with Syntax Highlighting
 * Provides a full-featured code editor for editing P5.js sketches with Monaco Editor
 */

export class P5CodeEditor {
    constructor(app) {
        this.app = app;
        this.isOpen = false;
        this.editor = null;
        this.currentP5Layer = null;
        
        // Editor configuration
        this.editorConfig = {
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            bracketMatching: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true
        };
        
        // Initialize event listeners
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    /**
     * Toggle editor visibility
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * Open the code editor
     */
    async open() {
        if (this.isOpen) return;
        
        console.log('P5CodeEditor: Opening editor...');
        
        // Check if there's a P5 layer to edit
        this.currentP5Layer = this.app.layerManager.getLayer('p5');
        console.log('P5CodeEditor: Current P5 layer:', this.currentP5Layer);
        
        if (!this.currentP5Layer) {
            // Create a P5 layer if none exists
            console.log('P5CodeEditor: No P5 layer found, creating one...');
            try {
                await this.app.addP5Layer();
                this.currentP5Layer = this.app.layerManager.getLayer('p5');
                console.log('P5CodeEditor: P5 layer created:', this.currentP5Layer);
            } catch (error) {
                console.error('P5CodeEditor: Failed to create P5 layer:', error);
                return;
            }
        }
        
        if (!this.currentP5Layer) {
            console.error('P5CodeEditor: Failed to get P5 layer for editing');
            return;
        }
        
        // Create editor overlay
        console.log('P5CodeEditor: Creating editor overlay...');
        this.createEditorOverlay();
        
        // Load Monaco Editor if not already loaded
        console.log('P5CodeEditor: Loading Monaco Editor...');
        await this.loadMonacoEditor();
        
        // Initialize the editor
        console.log('P5CodeEditor: Initializing editor...');
        this.initializeEditor();
        
        this.isOpen = true;
        console.log('P5CodeEditor: Editor opened successfully');
    }
    
    /**
     * Close the code editor
     */
    close() {
        if (!this.isOpen) return;
        
        // Save changes before closing
        this.saveChanges();
        
        // Remove editor overlay
        this.removeEditorOverlay();
        
        // Dispose of Monaco editor
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
        
        this.isOpen = false;
        console.log('P5 Code Editor closed');
    }
    
    /**
     * Create the editor overlay UI
     */
    createEditorOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'p5-code-editor-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4';
        
        overlay.innerHTML = `
            <div class="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-gray-600">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-midi-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 3h5v5"/>
                            <path d="M8 3H3v5"/>
                            <path d="M12 22v-7"/>
                            <path d="M3 12h18"/>
                            <path d="M8 21h8"/>
                            <path d="M8 3v4"/>
                            <path d="M16 3v4"/>
                        </svg>
                        <h2 class="text-lg font-semibold text-white">P5.js Code Editor</h2>
                        <span class="text-sm text-gray-400">Layer: ${this.currentP5Layer.id}</span>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <button id="p5-editor-run" class="btn btn-success btn-sm">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5,3 19,12 5,21"></polygon>
                            </svg>
                            Run
                        </button>
                        
                        <button id="p5-editor-reset" class="btn btn-secondary btn-sm">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                <path d="M21 3v5h-5"/>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                <path d="M3 21v-5h5"/>
                            </svg>
                            Reset
                        </button>
                        
                        <button id="p5-editor-close" class="btn btn-danger btn-sm">
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
                            <h3 class="text-sm font-medium text-gray-300">Sketch Code</h3>
                        </div>
                        <div id="p5-monaco-editor" class="flex-1"></div>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="w-80 border-l border-gray-600 bg-gray-850">
                        <div class="px-4 py-2 bg-gray-800 border-b border-gray-600">
                            <h3 class="text-sm font-medium text-gray-300">Parameters & Info</h3>
                        </div>
                        
                        <div class="p-4 space-y-4">
                            <!-- Parameter List -->
                            <div>
                                <h4 class="text-xs font-medium text-gray-400 mb-2">Exposed Parameters</h4>
                                <div id="p5-parameter-list" class="space-y-2 text-sm">
                                    <!-- Parameters will be populated here -->
                                </div>
                            </div>
                            
                            <!-- Quick Reference -->
                            <div>
                                <h4 class="text-xs font-medium text-gray-400 mb-2">Quick Reference</h4>
                                <div class="text-xs text-gray-500 space-y-1">
                                    <div><code class="text-midi-green">p5Param(name, default, options)</code></div>
                                    <div class="text-gray-400">Expose parameter for MIDI/audio control</div>
                                    <div><code class="text-midi-green">setup()</code> - Initialize canvas</div>
                                    <div><code class="text-midi-green">draw()</code> - Animation loop</div>
                                    <div><code class="text-midi-green">createCanvas(w, h)</code></div>
                                    <div><code class="text-midi-green">background(r, g, b)</code></div>
                                    <div><code class="text-midi-green">fill(r, g, b)</code></div>
                                    <div><code class="text-midi-green">circle(x, y, size)</code></div>
                                </div>
                            </div>
                            
                            <!-- Status -->
                            <div>
                                <h4 class="text-xs font-medium text-gray-400 mb-2">Status</h4>
                                <div id="p5-editor-status" class="text-sm">
                                    <div class="flex items-center gap-2">
                                        <div class="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span class="text-green-400">Running</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listeners for editor controls (with small delay to ensure DOM is ready)
        setTimeout(() => {
            const closeButton = document.getElementById('p5-editor-close');
            const runButton = document.getElementById('p5-editor-run');
            const resetButton = document.getElementById('p5-editor-reset');
            
            console.log('P5CodeEditor: Setting up button event listeners...');
            console.log('P5CodeEditor: Buttons found:', {
                close: !!closeButton,
                run: !!runButton,
                reset: !!resetButton
            });
            
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    console.log('P5CodeEditor: Close button clicked');
                    this.close();
                });
            }
            if (runButton) {
                runButton.addEventListener('click', () => {
                    console.log('P5CodeEditor: Run button clicked');
                    this.runCode();
                });
            }
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    console.log('P5CodeEditor: Reset button clicked');
                    this.resetCode();
                });
            }
        }, 10);
        
        // Close on overlay click (but not on editor click)
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.close();
            }
        });
    }
    
    /**
     * Remove the editor overlay
     */
    removeEditorOverlay() {
        const overlay = document.getElementById('p5-code-editor-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    /**
     * Load Monaco Editor library
     */
    async loadMonacoEditor() {
        console.log('P5CodeEditor: Loading Monaco Editor...');
        
        // Check if Monaco is already loaded
        if (typeof window.monaco !== 'undefined') {
            console.log('P5CodeEditor: Monaco Editor already loaded');
            return;
        }
        
        return new Promise((resolve, reject) => {
            console.log('P5CodeEditor: Loading Monaco Editor from CDN...');
            
            // Load Monaco Editor from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
            
            script.onload = () => {
                console.log('P5CodeEditor: Monaco loader script loaded');
                
                // Configure Monaco
                window.require.config({
                    paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' }
                });
                
                window.require(['vs/editor/editor.main'], () => {
                    console.log('P5CodeEditor: Monaco Editor loaded successfully');
                    resolve();
                });
            };
            
            script.onerror = (error) => {
                console.error('P5CodeEditor: Failed to load Monaco Editor:', error);
                reject(new Error('Failed to load Monaco Editor'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize the Monaco editor
     */
    initializeEditor() {
        console.log('P5CodeEditor: Initializing Monaco Editor...');
        
        const container = document.getElementById('p5-monaco-editor');
        console.log('P5CodeEditor: Editor container found:', !!container);
        
        if (!container) {
            console.error('P5CodeEditor: Editor container not found');
            return;
        }
        
        if (!window.monaco) {
            console.error('P5CodeEditor: Monaco Editor not loaded');
            return;
        }
        
        // Get current sketch code
        const currentCode = this.currentP5Layer.getSketchCode() || this.currentP5Layer.getDefaultSketch();
        console.log('P5CodeEditor: Current sketch code length:', currentCode.length);
        
        try {
            // Create the editor
            this.editor = window.monaco.editor.create(container, {
                value: currentCode,
                ...this.editorConfig
            });
            
            console.log('P5CodeEditor: Monaco Editor created successfully');
            
            // Add p5.js intellisense/autocomplete
            this.setupP5Intellisense();
            
            // Update parameter list
            this.updateParameterList();
            
            // Auto-save on changes (debounced)
            let saveTimeout;
            this.editor.onDidChangeModelContent(() => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.updateParameterList();
                }, 1000);
            });
            
            console.log('P5CodeEditor: Monaco Editor initialized with P5 sketch');
        } catch (error) {
            console.error('P5CodeEditor: Failed to initialize Monaco Editor:', error);
        }
    }
    
    /**
     * Setup P5.js autocomplete and intellisense
     */
    setupP5Intellisense() {
        if (!window.monaco) return;
        
        // Add p5.js function suggestions
        window.monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: (model, position) => {
                const suggestions = [
                    {
                        label: 'p5Param',
                        kind: window.monaco.languages.CompletionItemKind.Function,
                        insertText: 'p5Param(${1:name}, ${2:defaultValue}, { min: ${3:0}, max: ${4:100}, label: \'${5:Label}\' })',
                        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Expose a parameter for MIDI/audio control'
                    },
                    {
                        label: 'setup',
                        kind: window.monaco.languages.CompletionItemKind.Function,
                        insertText: 'function setup() {\n\t${1:createCanvas(windowWidth, windowHeight);}\n}',
                        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'p5.js setup function - called once at start'
                    },
                    {
                        label: 'draw',
                        kind: window.monaco.languages.CompletionItemKind.Function,
                        insertText: 'function draw() {\n\t${1:background(0);}\n}',
                        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'p5.js draw function - called every frame'
                    },
                    {
                        label: 'createCanvas',
                        kind: window.monaco.languages.CompletionItemKind.Function,
                        insertText: 'createCanvas(${1:windowWidth}, ${2:windowHeight})',
                        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Create a canvas for drawing'
                    }
                ];
                
                return { suggestions };
            }
        });
    }
    
    /**
     * Update the parameter list display
     */
    updateParameterList() {
        const parameterList = document.getElementById('p5-parameter-list');
        if (!parameterList || !this.currentP5Layer) return;
        
        const parameters = this.currentP5Layer.getAllParameters();
        
        if (Object.keys(parameters).length === 0) {
            parameterList.innerHTML = '<div class="text-gray-500 text-xs">No parameters exposed yet</div>';
            return;
        }
        
        parameterList.innerHTML = Object.entries(parameters).map(([name, param]) => `
            <div class="bg-gray-700 rounded p-2">
                <div class="font-medium text-white text-xs">${name}</div>
                <div class="text-gray-400 text-xs">${param.label || name}</div>
                <div class="text-xs text-gray-500">
                    Range: ${param.min ?? 'none'} - ${param.max ?? 'none'}
                </div>
                <div class="text-xs text-midi-green">Current: ${param.value ?? param.defaultValue}</div>
            </div>
        `).join('');
    }
    
    /**
     * Run the current code
     */
    async runCode() {
        if (!this.editor || !this.currentP5Layer) return;
        
        const code = this.editor.getValue();
        
        try {
            await this.currentP5Layer.compileAndRun(code);
            this.updateStatus('success', 'Sketch compiled and running');
            this.updateParameterList();
            console.log('P5 sketch updated from editor');
        } catch (error) {
            this.updateStatus('error', `Error: ${error.message}`);
            console.error('Failed to run P5 sketch:', error);
        }
    }
    
    /**
     * Reset code to default
     */
    resetCode() {
        if (!this.editor || !this.currentP5Layer) return;
        
        const defaultCode = this.currentP5Layer.getDefaultSketch();
        this.editor.setValue(defaultCode);
        this.updateStatus('info', 'Code reset to default');
    }
    
    /**
     * Save changes (auto-called)
     */
    saveChanges() {
        // Auto-save is handled by the run button for now
        // Could implement auto-save on close if needed
    }
    
    /**
     * Update status display
     */
    updateStatus(type, message) {
        const statusElement = document.getElementById('p5-editor-status');
        if (!statusElement) return;
        
        const colors = {
            success: 'text-green-400 bg-green-500',
            error: 'text-red-400 bg-red-500',
            info: 'text-blue-400 bg-blue-500',
            warning: 'text-yellow-400 bg-yellow-500'
        };
        
        const color = colors[type] || colors.info;
        
        statusElement.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full ${color.split(' ')[1]}"></div>
                <span class="${color.split(' ')[0]}">${message}</span>
            </div>
        `;
    }
}
