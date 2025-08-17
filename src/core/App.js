/**
 * App.js - Main Application Controller
 * This is the central orchestrator for the RGLR GNRTR application, managing all major components including
 * the scene, state management, animation loop, MIDI integration, and GUI. It handles initialization of all
 * subsystems, coordinates communication between modules, manages MIDI event routing, and provides the main
 * interface for external interactions with the application. Now includes shape morphing capabilities for
 * dynamic visual effects.
 */

import { Scene } from './Scene.js';
import { AnimationLoop } from './AnimationLoop.js';
import { StateManager } from './StateManager.js';
import { MIDIManager } from '../midi-manager.js';
import { MIDIControlManager } from '../midi-controls.js';
import { AudioMappingManager } from '../audio-mapping.js';
import { GUIManager } from '../ui/GUIManager.js';
import { ShapeMorphingSystem } from '../modules/ShapeMorphingSystem.js';
import { AudioManager } from '../modules/AudioManager.js';
import { MIDIClockManager } from '../modules/MIDIClockManager.js';
import { DOMCache } from '../modules/DOMCache.js';
import { ParameterMapper } from '../modules/ParameterMapper.js';
import { MIDIEventHandler } from '../modules/MIDIEventHandler.js';
import { DrawerManager } from '../modules/DrawerManager.js';
import { PresetManager } from '../modules/PresetManager.js';
import { SceneManager } from '../modules/SceneManager.js';
import { LayerManager } from '../modules/LayerManager.js';
import { LayerPanel } from '../ui/LayerPanel.js';
import { P5CodeEditor } from '../ui/P5CodeEditor.js';
import { ShaderCodeEditor } from '../ui/ShaderCodeEditor.js';

export class App {
    constructor() {
        this.state = new StateManager();
        this.scene = new Scene(this.state, this);
        
        // Initialize DOM cache for performance optimization
        this.domCache = new DOMCache();
        
        // Initialize MIDI clock manager first
        this.midiClockManager = new MIDIClockManager(this);
        
        // Initialize animation loop with clock manager
        this.animationLoop = new AnimationLoop(this.scene, this.state, this.midiClockManager);
        
        this.midiManager = new MIDIManager(this);
        this.controlManager = null;
        this.guiManager = null;
        
        // Initialize morphing system
        this.morphingSystem = new ShapeMorphingSystem();
        
        // Initialize morphing state cache for performance optimization
        this.morphingStateCache = {
            morphableShapes: [],
            filteredPairs: {},
            availableShapes: [],
            lastUpdate: 0,
            cacheValid: false
        };
        
        // Initialize debounced audio update for performance optimization
        this.debouncedAudioUpdate = null;
        
        // Initialize abort controllers for async operation cancellation
        this.abortControllers = new Map();
        
        // Initialize event listener tracking for cleanup
        this.eventListeners = [];
        

        
        // Initialize audio manager
        this.audioManager = new AudioManager(this.state);
        
        // Initialize MIDI event handler
        this.midiEventHandler = new MIDIEventHandler(this);
        
        // Initialize drawer manager
        this.drawerManager = new DrawerManager(this);
        
        // Initialize preset manager
        this.presetManager = new PresetManager(this);
        
        // Initialize scene manager
        this.sceneManager = new SceneManager(this);
        
        // Initialize layer manager
        this.layerManager = new LayerManager(this);
        
        // Initialize layer panel
        this.layerPanel = new LayerPanel(this);
        
        // Initialize P5 Code Editor
        this.p5CodeEditor = new P5CodeEditor(this);
        
        // Initialize Shader Code Editor
        this.shaderCodeEditor = new ShaderCodeEditor(this);
        
        this.init();
    }

    // App readiness state
    isReady = false;

    async init() {
        try {
            // Initialize state manager first
            await this.state.initialize();
            
            // Initialize BPM from state
            this.midiClockManager.initializeFromState();
            
            // Initialize audio manager
            await this.audioManager.initialize();
            
            // Initialize audio status indicator
            this.audioManager.updateAudioStatus('No Audio Device', false);
            
            // Verify state is properly initialized
            if (!this.state.isInitialized()) {
                throw new Error('StateManager failed to initialize properly');
            }
            
            // Initialize scene
            this.scene.init();
            
            // Set BPM timing manager reference on scene
            this.scene.setBPMTimingManager(this.midiClockManager.getBPMTimingManager());
            
            // Initialize layer manager with scene context
            await this.layerManager.initialize({
                scene: this.scene.scene,
                renderer: this.scene.renderer,
                camera: this.scene.camera,
                state: this.state,
                shapeGenerator: this.scene.shapeGenerator,
                materialManager: this.scene.materialManager,
                objectPool: this.scene.objectPool,
                shapeAnimationManager: this.scene.shapeAnimationManager
            });
            
            // Add layerManager to state so StateManager can access it for scene export/import
            this.state.set('layerManager', this.layerManager);
            
            // Set up morphing system with shape generator
            this.scene.shapeGenerator.setMorphingSystem(this.morphingSystem);
            this.morphingSystem.setShapeGenerator(this.scene.shapeGenerator);
            
            // Initialize GUI
            this.guiManager = new GUIManager(this.state, this);
            this.guiManager.init();
            
            // Initialize layer panel
            this.layerPanel.init();
            
            // Initialize DOM cache after GUI is ready
            this.domCache.initializeCache();
            
            // Initialize MIDI
            this.setupMIDI();
            
            // Initialize control manager when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeControlManager();
                    this.initializeAudioMappingManager();
                    this.presetManager.loadAvailablePresets();
                });
            } else {
                this.initializeControlManager();
                this.initializeAudioMappingManager();
                this.presetManager.loadAvailablePresets();
            }
            
            // Start animation loop
            this.animationLoop.start();
            
            // Mark app as ready
            this.isReady = true;
            console.log('App initialization completed, ready for user interaction');
            
            // Set up window resize handler
            window.addEventListener('resize', () => {
                // Handle main scene resize
                this.scene.onWindowResize();
                // Handle layer resize coordination
                if (this.layerManager) {
                    this.layerManager.onWindowResize();
                }
            });
            
            // Set up keyboard shortcuts for testing
            window.addEventListener('keydown', (event) => this.handleKeyDown(event));
            
        } catch (error) {
            console.error('Error during App initialization:', error);
        }
    }

    setupMIDI() {
        // Set up drawer functionality
        this.drawerManager.setupDrawers();
        
        // Set up preset management
        this.presetManager.setupPresetManagement();
        
        // Set up scene management
        this.sceneManager.setupSceneManagement();
        
        // Set up MIDI UI event listeners using cached DOM elements
        this.domCache.getElement('midi-connect').addEventListener('click', () => {
            this.midiManager.connect();
        });
        
        this.domCache.getElement('midi-disconnect').addEventListener('click', () => {
            this.midiManager.disconnect();
        });
        
        // Set up audio interface UI event listeners
        this.setupAudioInterfaceUI();

        const refreshButton = this.domCache.getElement('midi-refresh');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.midiManager.refreshDevices();
            });
        }


        
        // Scene management is now handled by SceneManager
        
        // Add control buttons
        this.domCache.getElement('add-cc-control').addEventListener('click', () => {
            this.addCCControl();
        });
        
        this.domCache.getElement('add-note-control').addEventListener('click', () => {
            this.addNoteControl();
        });
        
        this.domCache.getElement('add-audio-mapping-control').addEventListener('click', () => {
            this.addAudioMappingControl();
        });
        
        // Mapping test button
        this.domCache.getElement('mapping-test').addEventListener('click', () => {
            this.testAudioMapping();
        });
        
        // Mapping save button
        this.domCache.getElement('mapping-save').addEventListener('click', () => {
            this.presetManager.savePreset();
        });
        
        // Mapping load button
        this.domCache.getElement('mapping-load').addEventListener('click', () => {
            this.domCache.getElement('preset-file-input').click();
        });
        
        // Test button for CC mapping
        this.domCache.getElement('mapping-test').addEventListener('click', () => {
            this.testCCValues();
        });
        
        // MIDI stop animation checkbox
        const midiStopAnimationCheckbox = this.domCache.getElement('midi-stop-animation');
        if (midiStopAnimationCheckbox) {
            // Set initial state
            midiStopAnimationCheckbox.checked = this.state.get('midiStopStopsAnimation') || false;
            
            // Add event listener
            midiStopAnimationCheckbox.addEventListener('change', (e) => {
                this.state.set('midiStopStopsAnimation', e.target.checked);
            });
        }
        
        // Scene management buttons are now handled by SceneManager
        

        
        // Interpolation duration slider
        const interpolationDurationInput = this.domCache.getElement('interpolation-duration');
        const interpolationDurationValue = this.domCache.getElement('interpolation-duration-value');
        
        if (interpolationDurationInput && interpolationDurationValue) {
            interpolationDurationInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                interpolationDurationValue.textContent = `${value.toFixed(1)}s`;
                this.state.set('interpolationDuration', value);
            });
        }
        
        // Interpolation easing selector
        const interpolationEasingSelect = this.domCache.getElement('interpolation-easing');
        if (interpolationEasingSelect) {
            interpolationEasingSelect.addEventListener('change', (e) => {
                this.state.set('interpolationEasing', e.target.value);
            });
        }
        
        // Debug interpolation button
        const debugInterpolationButton = this.domCache.getElement('debug-interpolation');
        if (debugInterpolationButton) {
            debugInterpolationButton.addEventListener('click', () => {
                this.debugInterpolation();
            });
        }
    }

    // Drawer management is now handled by DrawerManager

    // All MIDI activity tracking methods are now handled by DrawerManager

    // All remaining MIDI activity methods are now handled by DrawerManager
    
    // All drawer-related methods are now handled by DrawerManager

    // Drawer toggling is now handled by DrawerManager

    // Drawer closing is now handled by DrawerManager

    // All drawer management methods are now handled by DrawerManager
        
        // Removed setupCollapsibleSections() - new design uses cards instead

    initializeControlManager() {
        const ccContainer = this.domCache.getElement('cc-controls-container');
        const noteContainer = this.domCache.getElement('note-controls-container');
        
        if (!ccContainer || !noteContainer) {
            console.error('Could not find MIDI control containers');
            return;
        }
        
        this.controlManager = new MIDIControlManager(ccContainer, this);
        this.controlManager.noteContainer = noteContainer;
        
        this.presetManager.recreateControlsFromPreset();
    }
    
    initializeAudioMappingManager() {
        const audioMappingContainer = this.domCache.getElement('audio-mapping-controls-container');
        
        if (!audioMappingContainer) {
            console.error('Could not find audio mapping controls container');
            return;
        }
        
        this.audioMappingManager = new AudioMappingManager(audioMappingContainer, this);
        
        this.recreateAudioMappingControls();
    }
    
    toggleSection(toggle) {
        // Removed - new design uses cards instead of collapsible sections
    }
    
    saveCollapsibleState() {
        // Removed - new design uses cards instead of collapsible sections
    }
    
    loadCollapsibleState() {
        // Removed - new design uses cards instead of collapsible sections
    }

    // MIDI callback methods
    onMIDIConnected() {
        this.state.set('midiEnabled', true);
        this.midiManager.updateDeviceStatus();
        
        // Update drawer connection status if a mapping drawer is open
        if (this.drawerManager && this.drawerManager.isAnyDrawerOpen()) {
            this.drawerManager.checkDrawerConnectionStatus(this.drawerManager.getCurrentDrawer());
        }
    }

    onMIDIDisconnected() {
        this.state.set('midiEnabled', false);
        
        // Update drawer connection status if a mapping drawer is open
        if (this.drawerManager && this.drawerManager.isAnyDrawerOpen()) {
            this.drawerManager.checkDrawerConnectionStatus(this.drawerManager.getCurrentDrawer());
        }
    }

    onMIDICC(controller, value, channel) {
        // Delegate to the new MIDIEventHandler
        this.midiEventHandler.onMIDICC(controller, value, channel);
    }

    onMIDINote(note, velocity, isNoteOn, channel) {
        // Delegate to the new MIDIEventHandler
        this.midiEventHandler.onMIDINote(note, velocity, isNoteOn, channel);
    }



    updateAnimationParameter(target, value) {
        // Handle P5 layer parameters
        if (target.startsWith('p5:')) {
            const paramName = target.substring(3); // Remove 'p5:' prefix
            console.log(`App: Routing P5 parameter ${paramName} = ${value}`);
            const p5Layer = this.layerManager.getLayer('p5');
            if (p5Layer) {
                console.log(`App: Found P5 layer, setting parameter`);
                p5Layer.setParameter(paramName, value);
            } else {
                console.warn(`App: P5 layer not found`);
            }
            return;
        }
        
        // Handle shader layer parameters
        if (target.startsWith('shader:')) {
            const raw = target.substring(7); // Remove 'shader:' prefix
            // Support component addressing: uniform.x / uniform.y / uniform.both
            let paramName = raw;
            let component = null;
            if (raw.endsWith('.x')) { paramName = raw.slice(0, -2); component = 'x'; }
            else if (raw.endsWith('.y')) { paramName = raw.slice(0, -2); component = 'y'; }
            else if (raw.endsWith('.both')) { paramName = raw.slice(0, -5); component = 'both'; }
            console.log(`App: Routing shader parameter ${paramName}${component?'.'+component:''} = ${value}`);
            const shaderLayer = this.layerManager.getLayer('shader');
            if (shaderLayer) {
                console.log(`App: Found shader layer, setting parameter (normalized=${value.toFixed ? value.toFixed(3) : value})`);
                if (component === 'x' || component === 'y') {
                    const current = shaderLayer.getParameter(paramName) || { x: 0, y: 0 };
                    current[component] = value;
                    shaderLayer.setParameter(paramName, current);
                } else if (component === 'both') {
                    const current = shaderLayer.getParameter(paramName) || { x: 0, y: 0 };
                    current.x = value;
                    current.y = value;
                    shaderLayer.setParameter(paramName, current);
                } else {
                    shaderLayer.setParameter(paramName, value);
                }
                // Ensure visual update if animation is paused
                this.forceRenderWhenPaused();
            } else {
                console.warn(`App: Shader layer not found`);
            }
            return;
        }
        
        // Use the unified ParameterMapper to handle all other parameter updates
        ParameterMapper.handleParameterUpdate(target, value, this.state, this.scene, 'animation');
        
        // Ensure changes are visible even when animation is paused
        if (this.scene && !this.animationLoop.getRunningState()) {
            this.scene.render();
        }
    }

    handleNoteMapping(target) {
        // Delegate to the new MIDIEventHandler
        this.midiEventHandler.triggerNoteAction(target, 127); // Default velocity
    }

    /**
     * Add a P5 layer to the layer system
     * @param {Object} config - P5 layer configuration
     * @returns {Promise<P5TextureLayer>} The created P5 layer
     */
    async addP5Layer(config = {}) {
        return await this.layerManager.addP5Layer('p5', config);
    }

    /**
     * Add a shader layer to the layer system
     * @param {Object} config - Shader layer configuration
     * @returns {Promise<ShaderLayer>} The created shader layer
     */
    async addShaderLayer(config = {}) {
        if (!this.isReady) {
            throw new Error('Application not ready. Please wait for initialization to complete.');
        }
        
        console.log('App: Adding shader layer...');
        return await this.layerManager.addShaderLayer('shader', config);
    }

    /**
     * Get P5 layer parameters for MIDI/audio mapping
     * @returns {Array} Array of P5 parameter targets
     */
    getP5Parameters() {
        const p5Layer = this.layerManager.getLayer('p5');
        if (!p5Layer) return [];
        
        const params = p5Layer.getAllParameters();
        return Object.keys(params).map(name => ({
            target: `p5:${name}`,
            label: params[name].label || name,
            min: params[name].min,
            max: params[name].max
        }));
    }

    /**
     * Get shader layer parameters for MIDI/audio mapping with enhanced categorization
     * @returns {Array} Array of shader parameter targets organized by category
     */
    getShaderParameters() {
        const shaderLayer = this.layerManager.getLayer('shader');
        if (!shaderLayer) return [];
        
        const params = shaderLayer.getExposedParameters();
        const categorizedParams = {};
        
        // Group parameters by category
        Object.keys(params).forEach(name => {
            const param = params[name];
            const category = param.category || 'general';
            
            if (!categorizedParams[category]) {
                categorizedParams[category] = [];
            }
            
            categorizedParams[category].push({
                target: `shader:${name}`,
                label: param.label || this.generateFriendlyLabel(name),
                description: param.description || `${name} parameter`,
                min: param.min || 0,
                max: param.max || 1,
                defaultValue: param.defaultValue || 0.5,
                category: category,
                type: param.type || 'number'
            });
        });
        
        // Return flattened array with category information preserved
        const result = [];
        Object.keys(categorizedParams).sort().forEach(category => {
            // Add category header
            result.push({
                isCategory: true,
                category: category,
                label: this.formatCategoryLabel(category),
                count: categorizedParams[category].length
            });
            
            // Add parameters in this category
            categorizedParams[category]
                .sort((a, b) => a.label.localeCompare(b.label))
                .forEach(param => result.push(param));
        });
        
        return result;
    }
    
    /**
     * Get all layer parameters for MIDI/audio mapping
     * @returns {Array} Array of all available parameter targets
     */
    getAllLayerParameters() {
        const allParams = [];
        
        // Add shader parameters
        const shaderParams = this.getShaderParameters();
        if (shaderParams.length > 0) {
            allParams.push({
                isSection: true,
                label: '⚡ Shader Layer Parameters',
                icon: '⚡'
            });
            allParams.push(...shaderParams);
        }
        
        // Add P5 parameters (if any exist)
        const p5Params = this.getP5Parameters();
        if (p5Params.length > 0) {
            allParams.push({
                isSection: true,
                label: '🎨 P5.js Layer Parameters',
                icon: '🎨'
            });
            allParams.push(...p5Params);
        }
        
        // Add grid parameters
        const gridParams = this.getGridParameters();
        if (gridParams.length > 0) {
            allParams.push({
                isSection: true,
                label: '📐 Grid Layer Parameters',
                icon: '📐'
            });
            allParams.push(...gridParams);
        }
        
        return allParams;
    }
    
    /**
     * Get grid layer parameters for MIDI mapping
     * @returns {Array} Array of grid parameter targets
     */
    getGridParameters() {
        const gridLayer = this.layerManager.getLayer('grid');
        if (!gridLayer) return [];
        
        // Return common grid parameters that can be MIDI mapped
        return [
            {
                target: 'grid:visible',
                label: 'Grid Visibility',
                description: 'Show/hide grid layer',
                min: 0,
                max: 1,
                type: 'boolean',
                category: 'appearance'
            },
            {
                target: 'grid:opacity',
                label: 'Grid Opacity',
                description: 'Grid transparency level',
                min: 0,
                max: 1,
                defaultValue: 1,
                type: 'number',
                category: 'appearance'
            }
        ];
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
     * Format category label for display
     */
    formatCategoryLabel(category) {
        const categoryIcons = {
            'animation': '🎬 Animation',
            'transform': '🔄 Transform',
            'wave': '〰️ Wave',
            'appearance': '🎨 Appearance',
            'color': '🌈 Color',
            'pattern': '🔶 Pattern',
            'effect': '✨ Effect',
            'general': '⚙️ General'
        };
        
        return categoryIcons[category] || `📋 ${this.generateFriendlyLabel(category)}`;
    }

    /**
     * Test P5 layer functionality (for development)
     */
    async testP5Layer() {
        console.log('🧪 Testing P5 Layer...');
        
        try {
            // Check if p5 layer already exists
            let p5Layer = this.layerManager.getLayer('p5');
            
            if (!p5Layer) {
                console.log('➕ Creating P5 layer...');
                p5Layer = await this.addP5Layer();
                console.log('✅ P5 Layer created successfully');
            } else {
                console.log('ℹ️ P5 Layer already exists');
            }
            
            // Wait a moment for initialization
            console.log('⏳ Waiting for initialization...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Debug layer state
            console.log('🔍 P5 Layer state:');
            console.log('- ID:', p5Layer.id);
            console.log('- Visible:', p5Layer.visible);
            console.log('- Opacity:', p5Layer.opacity);
            console.log('- Running:', p5Layer.isRunning);
            console.log('- Has Error:', p5Layer.hasError);
            if (p5Layer.hasError) {
                console.log('- Error:', p5Layer.lastError);
            }
            console.log('- Off-screen Canvas:', p5Layer.offscreenCanvas);
            console.log('- P5 Instance:', p5Layer.p5Instance);
            
            // Check LayerManager state
            console.log('🔍 LayerManager state:');
            console.log('- Layer count:', this.layerManager.layers.size);
            console.log('- Layer order:', this.layerManager.getLayerOrder());
            
            // Test parameter setting
            console.log('⚙️ Testing parameters...');
            p5Layer.setParameter('ballSize', 100);
            p5Layer.setParameter('speed', 2);
            p5Layer.setParameter('color', 270);
            console.log('✅ Parameters set successfully');
            
            // Test MIDI routing
            console.log('🎛️ Testing MIDI routing...');
            this.updateAnimationParameter('p5:ballSize', 150);
            this.updateAnimationParameter('p5:speed', 3);
            console.log('✅ MIDI routing works');
            
            // Get parameters for mapping
            const params = this.getP5Parameters();
            console.log('✅ Available P5 parameters:', params);
            
            // Check if canvas is in DOM
            const canvasElements = document.querySelectorAll('canvas');
            console.log('🔍 Canvas elements in DOM:', canvasElements.length);
            canvasElements.forEach((canvas, i) => {
                console.log(`- Canvas ${i}:`, {
                    width: canvas.width,
                    height: canvas.height,
                    style: canvas.style.cssText,
                    parent: canvas.parentElement?.tagName
                });
            });
            
            console.log('🎉 P5 Layer test completed!');
            console.log('💡 If you don\'t see the overlay, check the canvas styling above');
            console.log('💡 Try: document.querySelector(\'canvas:last-child\').style.background = \'red\'');
            
        } catch (error) {
            console.error('❌ P5 Layer test failed:', error);
            console.error('Full error:', error);
        }
    }

    /**
     * Test shader layer functionality (for development)
     */
    async testShaderLayer() {
        console.log('🧪 Testing Shader Layer...');
        
        try {
            // Check if shader layer already exists
            let shaderLayer = this.layerManager.getLayer('shader');
            
            if (!shaderLayer) {
                console.log('➕ Creating shader layer...');
                shaderLayer = await this.addShaderLayer();
                console.log('✅ Shader Layer created successfully');
            } else {
                console.log('ℹ️ Shader Layer already exists');
            }
            
            // Wait a moment for initialization
            console.log('⏳ Waiting for initialization...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Debug layer state
            console.log('🔍 Shader Layer state:');
            console.log('- ID:', shaderLayer.id);
            console.log('- Visible:', shaderLayer.visible);
            console.log('- Opacity:', shaderLayer.opacity);
            console.log('- Compiled:', shaderLayer.isShaderCompiled());
            console.log('- Has Error:', shaderLayer.hasShaderError());
            if (shaderLayer.hasShaderError()) {
                console.log('- Error:', shaderLayer.getLastShaderError());
            }
            console.log('- Material:', shaderLayer.material);
            console.log('- Mesh:', shaderLayer.mesh);
            
            // Check LayerManager state
            console.log('🔍 LayerManager state:');
            console.log('- Layer count:', this.layerManager.layers.size);
            console.log('- Layer order:', this.layerManager.getLayerOrder());
            
            // Test parameter setting
            console.log('⚙️ Testing parameters...');
            shaderLayer.setParameter('agentCount', 5000);
            shaderLayer.setParameter('trailDecay', 0.98);
            shaderLayer.setParameter('sensorDistance', 20);
            console.log('✅ Parameters set successfully');
            
            // Test MIDI routing
            console.log('🎛️ Testing MIDI routing...');
            this.updateAnimationParameter('shader:agentCount', 10000);
            this.updateAnimationParameter('shader:trailDecay', 0.99);
            console.log('✅ MIDI routing works');
            
            // Get parameters for mapping
            const params = this.getShaderParameters();
            console.log('✅ Available shader parameters:', params);
            
            console.log('🎉 Shader Layer test completed!');
            
        } catch (error) {
            console.error('❌ Shader Layer test failed:', error);
            console.error('Full error:', error);
        }
    }

    triggerNoteAction(target) {
        // Delegate to the new MIDIEventHandler
        this.midiEventHandler.triggerNoteAction(target, 127); // Default velocity
    }

    addMIDIActivityMessage(message, category) {
        // Delegate to the drawer manager
        if (this.drawerManager) {
            this.drawerManager.addMIDIActivityMessage(message, category);
        }
    }

    // Preset delegation methods for backward compatibility
    validatePreset(preset) {
        return this.presetManager.validatePreset(preset);
    }

    applyPreset(preset) {
        this.presetManager.applyPreset(preset);
    }

    recreateControlsFromPreset(preset = null) {
        this.presetManager.recreateControlsFromPreset(preset);
    }

    // Scene delegation methods for backward compatibility
    saveScene() {
        this.sceneManager.saveScene();
    }

    loadScene() {
        this.sceneManager.loadScene();
    }

    async loadSceneFile(sceneData) {
        this.sceneManager.loadSceneFile(sceneData);
    }

    applyScenePreset(presetName) {
        return this.sceneManager.applyScenePreset(presetName);
    }

    validateScenePreset(sceneData) {
        return this.sceneManager.validateScenePreset(sceneData);
    }

    // Scene preset feedback and display names are now handled by SceneManager

    addCCControl() {
        if (!this.controlManager) return;
        
        const nextIndex = this.controlManager.getNextControlIndex('cc');
        const control = this.controlManager.addControl('cc', nextIndex);
        
        if (control) {
            // Add to state with empty target - user must select manually
            const ccMappings = this.state.get('midiCCMappings');
            ccMappings[control.controlId] = {
                channel: 0,
                cc: nextIndex,
                target: '' // Empty target - user must select manually
            };
            this.state.set('midiCCMappings', ccMappings);
        }
    }

    addNoteControl() {
        if (!this.controlManager) return;
        
        const nextIndex = this.controlManager.getNextControlIndex('note');
        const control = this.controlManager.addControl('note', nextIndex);
        
        if (control) {
            // Add to state with empty target - user must select manually
            const noteMappings = this.state.get('midiNoteMappings');
            
            noteMappings[control.controlId] = {
                channel: 0,
                note: 60 + nextIndex,
                target: '' // Empty target - user must select manually
            };
            this.state.set('midiNoteMappings', noteMappings);
        }
    }
    
    addAudioMappingControl() {
        if (!this.audioMappingManager) return;
        
        const nextIndex = this.audioMappingManager.getNextControlIndex('frequency');
        const control = this.audioMappingManager.addControl('frequency', nextIndex);
        
        if (control) {
            // Add to state with new frequency range system
            const audioMappings = this.state.get('audioMappings') || {};
            audioMappings[control.controlId] = {
                minFrequency: 250,
                maxFrequency: 2000,
                target: 'movementAmplitude',
                minValue: 0,
                maxValue: 1,
                curve: 'linear',
                sensitivity: 1.0
            };
            this.state.set('audioMappings', audioMappings);
        }
    }
    
    recreateAudioMappingControls() {
        if (!this.audioMappingManager) return;
        
        const audioMappings = this.state.get('audioMappings') || {};
        const controlsData = Object.values(audioMappings);
        
        if (controlsData.length > 0) {
            this.audioMappingManager.deserialize(controlsData);
        }
    }
    
    testAudioMapping() {
        // Get current audio values
        const overall = this.state.get('audioOverall') || 0;
        const rms = this.state.get('audioRMS') || 0;
        const peak = this.state.get('audioPeak') || 0;
        const frequency = this.state.get('audioFrequency') || 0;
        
        // Test each active audio mapping control
        if (this.audioMappingManager) {
            const controls = this.audioMappingManager.getAllControls();
            
            controls.forEach(control => {
                const mapping = control.getMapping();
                
                // Simulate audio input for testing
                const testValue = Math.random() * 0.5 + 0.25; // Random value between 0.25 and 0.75
                control.updateParameter(testValue);
            });
        }
        
        // Show feedback
        alert(`Audio mapping test completed!\nCurrent audio values:\nOverall: ${overall.toFixed(2)}\nRMS: ${rms.toFixed(2)}\nPeak: ${peak.toFixed(2)}\nFrequency: ${frequency.toFixed(0)}Hz`);
    }

    triggerNoteAction(target) {
        // Handle note actions directly for the new MIDI system
        switch (target) {
            case 'shapeCycling':
                this.state.set('enableShapeCycling', !this.state.get('enableShapeCycling'));
                if (!this.state.get('enableShapeCycling')) {
                    this.animationLoop.resetAnimationTime();
                }
                break;
            case 'showGrid':
                this.state.set('showGrid', !this.state.get('showGrid'));
                if (this.scene) this.scene.updateGridLines();
                break;
            case 'enableShapeCycling':
                this.state.set('enableShapeCycling', true);
                break;
            case 'enableMovementAnimation':
                this.state.set('enableMovementAnimation', !this.state.get('enableMovementAnimation'));
                break;
            case 'enableRotationAnimation':
                this.state.set('enableRotationAnimation', !this.state.get('enableRotationAnimation'));
                break;
            case 'enableScaleAnimation':
                this.state.set('enableScaleAnimation', !this.state.get('enableScaleAnimation'));
                break;
            case 'resetAnimation':
                this.animationLoop.resetAnimationTime();
                break;
            case 'togglePause':
                // Toggle pause functionality - implement as needed
                break;
            case 'toggleBasicShapes':
                const enabledShapes = this.state.get('enabledShapes');
                enabledShapes['Basic Shapes'] = !enabledShapes['Basic Shapes'];
                this.state.set('enabledShapes', enabledShapes);
                if (this.scene) this.scene.createGrid();
                break;
            case 'toggleTriangles':
                const enabledShapes2 = this.state.get('enabledShapes');
                enabledShapes2['Triangles'] = !enabledShapes2['Triangles'];
                this.state.set('enabledShapes', enabledShapes2);
                if (this.scene) this.scene.createGrid();
                break;
            case 'toggleRectangles':
                const enabledShapes3 = this.state.get('enabledShapes');
                enabledShapes3['Rectangles'] = !enabledShapes3['Rectangles'];
                this.state.set('enabledShapes', enabledShapes3);
                if (this.scene) this.scene.createGrid();
                break;
            case 'toggleEllipses':
                const enabledShapes4 = this.state.get('enabledShapes');
                enabledShapes4['Ellipses'] = !enabledShapes4['Ellipses'];
                this.state.set('enabledShapes', enabledShapes4);
                if (this.scene) this.scene.createGrid();
                break;
            case 'toggleRefractiveSpheres':
                const enabledShapes5 = this.state.get('enabledShapes');
                enabledShapes5['Refractive Spheres'] = !enabledShapes5['Refractive Spheres'];
                this.state.set('enabledShapes', enabledShapes5);
                if (this.scene) this.scene.createGrid();
                break;
            // Post-processing toggles
            case 'bloomEnabled':
                this.state.set('bloomEnabled', !this.state.get('bloomEnabled'));
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'chromaticAberrationEnabled':
                this.state.set('chromaticAberrationEnabled', !this.state.get('chromaticAberrationEnabled'));
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'vignetteEnabled':
                this.state.set('vignetteEnabled', !this.state.get('vignetteEnabled'));
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'grainEnabled':
                this.state.set('grainEnabled', !this.state.get('grainEnabled'));
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'colorGradingEnabled':
                this.state.set('colorGradingEnabled', !this.state.get('colorGradingEnabled'));
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'postProcessingEnabled':
                this.state.set('postProcessingEnabled', !this.state.get('postProcessingEnabled'));
                break;
            case 'fxaaEnabled':
                this.state.set('fxaaEnabled', !this.state.get('fxaaEnabled'));
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'enableFrustumCulling':
                this.state.set('enableFrustumCulling', !this.state.get('enableFrustumCulling'));
                break;
            case 'sphereWaterDistortion':
                this.state.set('sphereWaterDistortion', !this.state.get('sphereWaterDistortion'));
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'centerScalingEnabled':
                this.state.set('centerScalingEnabled', !this.state.get('centerScalingEnabled'));
                if (this.scene) this.scene.updateCenterScaling();
                break;
            // Morphing triggers
            case 'randomMorph':
                this.triggerRandomMorph();
                break;
            case 'morphAllShapes':
                this.triggerMorphAllShapes();
                break;
            case 'morphAllToSame':
                this.triggerMorphAllToSame();
                break;
            case 'morphAllSimultaneously':
                this.triggerMorphAllSimultaneously();
                break;
            case 'morphAllToSameSimultaneously':
                this.triggerMorphAllToSameSimultaneously();
                break;
        }
    }

    // Morphing trigger methods
    getMorphingDuration() {
        const morphingDivision = this.state.get('morphingDivision') || 'quarter';
        const globalBPM = this.state.get('globalBPM') || 120;
        
        // Get division beats
        const divisionBeats = this.getDivisionBeats(morphingDivision);
        
        // Calculate duration in seconds
        const secondsPerBeat = 60 / globalBPM;
        const duration = divisionBeats * secondsPerBeat;
        
        return duration;
    }

    getDivisionBeats(division) {
        const bpmTimingManager = this.midiClockManager.getBPMTimingManager();
        if (bpmTimingManager) {
            return bpmTimingManager.getDivisionBeats(division);
        }
        // Fallback if BPM timing manager not available
        const divisionMap = {
            '64th': 0.0625,   // 1/16 beat
            '32nd': 0.125,    // 1/8 beat
            '16th': 0.25,     // 1/4 beat
            '8th': 0.5,       // 1/2 beat
            'quarter': 1,      // 1 beat
            'half': 2,         // 2 beats
            'whole': 4,        // 4 beats
            '1bar': 4,         // 1 bar = 4 beats
            '2bars': 8,        // 2 bars = 8 beats
            '4bars': 16,       // 4 bars = 16 beats
            '8bars': 32        // 8 bars = 32 beats
        };
        return divisionMap[division] || 1;
    }

    getDivisionFromIndex(index) {
        // Map the full 0-127 range to musical divisions with more granular control
        // INVERTED: Higher MIDI values = faster divisions (more intuitive)
        const divisions = [
            '8bars',   // 0-11: 8 bars (slowest)
            '4bars',   // 12-23: 4 bars
            '2bars',   // 24-35: 2 bars
            '1bar',    // 36-47: 1 bar
            'whole',   // 48-59: whole notes
            'half',    // 60-71: half notes
            'quarter', // 72-83: quarter notes
            '8th',     // 84-95: 8th notes
            '16th',    // 96-107: 16th notes
            '32nd',    // 108-119: 32nd notes
            '64th'     // 120-127: 64th notes (fastest)
        ];
        
        // Map index to division with inverted distribution
        if (index <= 11) return '8bars';
        if (index <= 23) return '4bars';
        if (index <= 35) return '2bars';
        if (index <= 47) return '1bar';
        if (index <= 59) return 'whole';
        if (index <= 71) return 'half';
        if (index <= 83) return 'quarter';
        if (index <= 95) return '8th';
        if (index <= 107) return '16th';
        if (index <= 119) return '32nd';
        return '64th';
    }

    /**
     * Get consolidated morphing data with caching for performance optimization
     * Eliminates duplicate filtering logic across all morphing methods
     * @returns {Object} Cached morphing data or null if no valid data
     */
    getMorphingData() {
        const now = Date.now();
        
        // Cache for 100ms to avoid recalculation during rapid triggers
        if (this.morphingStateCache.cacheValid && 
            (now - this.morphingStateCache.lastUpdate) < 100) {
            return this.morphingStateCache;
        }
        
        // Validate scene and shapes exist
        if (!this.scene || !this.scene.shapes || this.scene.shapes.length === 0) {
            return null;
        }
        
        // Calculate morphable shapes (filtered by geometry type)
        const morphableShapes = this.scene.shapes.filter(shape => {
            return shape.geometry && shape.geometry.type === 'ShapeGeometry';
        });
        
        if (morphableShapes.length === 0) {
            return null;
        }
        
        // Get enabled shapes from state
        const enabledShapes = this.state.get('enabledShapes');
        const availableShapes = this.scene.shapeGenerator.getAvailableShapes(enabledShapes);
        
        if (availableShapes.length === 0) {
            return null;
        }
        
        // Filter morphable pairs to only include enabled shapes
        const allMorphablePairs = this.scene.shapeGenerator.getMorphableShapePairs();
        const filteredPairs = {};
        
        Object.entries(allMorphablePairs).forEach(([pairName, [shape1, shape2]]) => {
            if (availableShapes.includes(shape1) && availableShapes.includes(shape2)) {
                filteredPairs[pairName] = [shape1, shape2];
            }
        });
        
        const pairNames = Object.keys(filteredPairs);
        
        if (pairNames.length === 0) {
            return null;
        }
        
        // Update cache
        this.morphingStateCache = {
            morphableShapes,
            filteredPairs,
            availableShapes,
            pairNames,
            lastUpdate: now,
            cacheValid: true
        };
        
        return this.morphingStateCache;
    }

    /**
     * Invalidate the morphing cache when shapes change
     * Should be called when shapes are added, removed, or modified
     */
    invalidateMorphingCache() {
        this.morphingStateCache.cacheValid = false;
    }

    /**
     * Debounce utility for performance optimization
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Create and manage abort controller for async operations
     * @param {string} operationKey - Unique key for the operation
     * @returns {AbortController} The abort controller
     */
    createAbortController(operationKey) {
        // Cancel any previous operation with the same key
        if (this.abortControllers.has(operationKey)) {
            this.abortControllers.get(operationKey).abort();
        }
        
        // Create new controller
        const controller = new AbortController();
        this.abortControllers.set(operationKey, controller);
        
        return controller;
    }

    /**
     * Clean up abort controller after operation completes
     * @param {string} operationKey - Key of the operation to clean up
     */
    cleanupAbortController(operationKey) {
        if (this.abortControllers.has(operationKey)) {
            this.abortControllers.delete(operationKey);
        }
    }

    /**
     * Abort all ongoing operations
     */
    abortAllOperations() {
        this.abortControllers.forEach(controller => {
            controller.abort();
        });
        this.abortControllers.clear();
    }

    /**
     * Add tracked event listener for proper cleanup
     * @param {Element} element - DOM element to attach listener to
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     */
    addTrackedEventListener(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
            this.eventListeners.push({ element, event, handler, options });
        }
    }

    /**
     * Remove all tracked event listeners
     */
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element?.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
    }

    triggerRandomMorph() {
        const morphingData = this.getMorphingData();
        if (!morphingData) return;
        
        const randomShape = morphingData.morphableShapes[Math.floor(Math.random() * morphingData.morphableShapes.length)];
        const randomPair = morphingData.filteredPairs[morphingData.pairNames[Math.floor(Math.random() * morphingData.pairNames.length)]];
        this.scene.shapeGenerator.startShapeMorph(randomShape, randomPair[0], randomPair[1], this.getMorphingDuration());
    }

    triggerMorphAllShapes() {
        const morphingData = this.getMorphingData();
        if (!morphingData) return;
        
        // Get morphing division timing for the entire sequence
        const morphingDivision = this.state.get('morphingDivision') || 'quarter';
        const globalBPM = this.state.get('globalBPM') || 120;
        const divisionBeats = this.getDivisionBeats(morphingDivision);
        const secondsPerBeat = 60 / globalBPM;
        const totalSequenceTime = divisionBeats * secondsPerBeat;
        
        // Calculate delay per shape to distribute evenly across the musical division
        const delayPerShape = (totalSequenceTime * 1000) / Math.max(morphingData.morphableShapes.length - 1, 1); // Convert to milliseconds
        
        console.log(`Morph All Shapes: Using ${morphingDivision} division (${totalSequenceTime.toFixed(2)}s total, ${delayPerShape.toFixed(1)}ms delay per shape for ${morphingData.morphableShapes.length} shapes)`);
        
        morphingData.morphableShapes.forEach((shape, index) => {
            setTimeout(() => {
                const randomPair = morphingData.filteredPairs[morphingData.pairNames[Math.floor(Math.random() * morphingData.pairNames.length)]];
                this.scene.shapeGenerator.startShapeMorph(shape, randomPair[0], randomPair[1], this.getMorphingDuration());
            }, index * delayPerShape);
        });
    }

    triggerMorphAllToSame() {
        const morphingData = this.getMorphingData();
        if (!morphingData) return;
        
        const targetShape = morphingData.availableShapes[Math.floor(Math.random() * morphingData.availableShapes.length)];
        
        // Get morphing division timing for the entire sequence
        const morphingDivision = this.state.get('morphingDivision') || 'quarter';
        const globalBPM = this.state.get('globalBPM') || 120;
        const divisionBeats = this.getDivisionBeats(morphingDivision);
        const secondsPerBeat = 60 / globalBPM;
        const totalSequenceTime = divisionBeats * secondsPerBeat;
        
        // Calculate delay per shape to distribute evenly across the musical division
        const delayPerShape = (totalSequenceTime * 1000) / Math.max(morphingData.morphableShapes.length - 1, 1); // Convert to milliseconds
        
        console.log(`Morph All to Same: Using ${morphingDivision} division (${totalSequenceTime.toFixed(2)}s total, ${delayPerShape.toFixed(1)}ms delay per shape for ${morphingData.morphableShapes.length} shapes)`);
        
        morphingData.morphableShapes.forEach((shape, index) => {
            setTimeout(() => {
                // Get the current shape name from the mesh
                const currentShapeName = shape.userData.shapeName || 'triangle_UP';
                this.scene.shapeGenerator.startShapeMorph(shape, currentShapeName, targetShape, this.getMorphingDuration());
            }, index * delayPerShape);
        });
    }

    triggerMorphAllToSameSimultaneously() {
        const morphingData = this.getMorphingData();
        if (!morphingData) return;
        
        const targetShape = morphingData.availableShapes[Math.floor(Math.random() * morphingData.availableShapes.length)];
        
        // Morph all shapes to the same target simultaneously (no staggered timing)
        morphingData.morphableShapes.forEach(shape => {
            const currentShapeName = shape.userData.shapeName || 'triangle_UP';
            this.scene.shapeGenerator.startShapeMorph(shape, currentShapeName, targetShape, this.getMorphingDuration());
        });
    }

    triggerMorphAllSimultaneously() {
        const morphingData = this.getMorphingData();
        if (!morphingData) return;
        
        morphingData.morphableShapes.forEach(shape => {
            const randomPair = morphingData.filteredPairs[morphingData.pairNames[Math.floor(Math.random() * morphingData.pairNames.length)]];
            this.scene.shapeGenerator.startShapeMorph(shape, randomPair[0], randomPair[1], this.getMorphingDuration());
        });
    }
    
    debugInterpolation() {
        // Log current state
        this.state.logCurrentState();
        
        // Log interpolation info
        const debugInfo = this.state.getInterpolationDebugInfo();
        
        // Log recent state changes
        // Log current listeners
        // Check for any active animations
        // Log scene state
        
        // Create a summary
        const summary = {
            hasActiveInterpolation: debugInfo.isActive,
            interpolationProgress: debugInfo.progress,
            interpolationTime: debugInfo.time,
            totalDuration: debugInfo.duration,
            easing: debugInfo.easing,
            stateKeys: Object.keys(this.state.state).length,
            historySize: this.state.history.length
        };
        
        // Show alert with key info
        const message = `Interpolation Debug:
Active: ${debugInfo.isActive}
Progress: ${(debugInfo.progress * 100).toFixed(1)}%
Time: ${debugInfo.time.toFixed(2)}s / ${debugInfo.duration.toFixed(2)}s
State Keys: ${summary.stateKeys}
History: ${summary.historySize} entries`;
        
        alert(message);
    }

    setupAudioInterfaceUI() {
        
        // Audio interface selection
        const interfaceSelect = this.domCache.getElement('audio-interface-select');
        const channelsContainer = this.domCache.getElement('audio-channels-container');
        const connectButton = this.domCache.getElement('audio-connect');
        const disconnectButton = this.domCache.getElement('audio-disconnect');
        const refreshButton = this.domCache.getElement('audio-refresh-interfaces');
        const statusIndicator = this.domCache.getElement('audio-status-indicator');
        const statusText = this.domCache.getElement('audio-status-text');
        
        // Update interface dropdown
        this.updateAudioInterfaceDropdown = () => {
            const interfaces = this.audioManager.getAvailableInterfaces();
            const selectedInterface = this.audioManager.getSelectedInterface();
            
            interfaceSelect.innerHTML = '';
            
            if (interfaces.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No interfaces available';
                interfaceSelect.appendChild(option);
            } else {
                interfaces.forEach(audioInterface => {
                    const option = document.createElement('option');
                    option.value = audioInterface.id;
                    option.textContent = audioInterface.label;
                    if (selectedInterface && selectedInterface.id === audioInterface.id) {
                        option.selected = true;
                    }
                    interfaceSelect.appendChild(option);
                });
            }
        };
        
        // Update channels display
        this.updateAudioChannelsDisplay = async () => {
            const selectedInterface = this.audioManager.getSelectedInterface();
            const selectedChannels = this.audioManager.getSelectedChannels();
            
            channelsContainer.innerHTML = '';
            
            if (!selectedInterface) {
                channelsContainer.innerHTML = '<div class="text-xs text-gray-400">Select an interface first</div>';
                return;
            }
            
            try {
                const channels = await this.audioManager.getInterfaceChannels(selectedInterface.id);
                
                if (channels.length === 0) {
                    channelsContainer.innerHTML = '<div class="text-xs text-gray-400">No channels available</div>';
                    return;
                }
                
                channels.forEach(channel => {
                    const channelDiv = document.createElement('div');
                    channelDiv.className = 'flex items-center gap-2';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `audio-channel-${channel.id}`;
                    checkbox.className = 'w-3 h-3 text-midi-green bg-black border-gray-600 rounded focus:ring-midi-green focus:ring-1';
                    checkbox.checked = selectedChannels.some(c => c.id === channel.id);
                    
                    const label = document.createElement('label');
                    label.htmlFor = `audio-channel-${channel.id}`;
                    label.className = 'text-xs text-gray-300';
                    label.textContent = `${channel.label} (${channel.sampleRate}Hz)`;
                    
                    checkbox.addEventListener('change', () => {
                        const newSelectedChannels = [];
                        channels.forEach(c => {
                            const checkbox = document.getElementById(`audio-channel-${c.id}`);
                            if (checkbox && checkbox.checked) {
                                newSelectedChannels.push(c);
                            }
                        });
                        this.audioManager.selectChannels(newSelectedChannels);
                    });
                    
                    channelDiv.appendChild(checkbox);
                    channelDiv.appendChild(label);
                    channelsContainer.appendChild(channelDiv);
                });
                
            } catch (error) {
                console.error('Failed to get interface channels:', error);
                channelsContainer.innerHTML = '<div class="text-xs text-red-400">Failed to load channels</div>';
            }
        };
        
        // Update audio status
        this.updateAudioStatus = () => {
            const isListening = this.state.get('audioListening');
            const isAvailable = this.state.get('audioAvailable');
            
            if (isListening) {
                statusIndicator.className = 'w-2 h-2 rounded-full bg-green-500 transition-all duration-300';
                statusText.textContent = 'Connected';
                // Update top bar status with device name
                this.audioManager.updateAudioStatus(this.audioManager.getCurrentDeviceName(), true);
            } else if (isAvailable) {
                statusIndicator.className = 'w-2 h-2 rounded-full bg-yellow-500 transition-all duration-300';
                statusText.textContent = 'Available';
                // Update top bar status
                this.audioManager.updateAudioStatus('No Audio Device', false);
            } else {
                statusIndicator.className = 'w-2 h-2 rounded-full bg-red-500 transition-all duration-300';
                statusText.textContent = 'Unavailable';
                // Update top bar status
                this.audioManager.updateAudioStatus('No Audio Device', false);
            }
        };
        
        // Update audio analysis display
        this.updateAudioAnalysisDisplay = () => {
            const overall = this.state.get('audioOverall') || 0;
            const rms = this.state.get('audioRMS') || 0;
            const peak = this.state.get('audioPeak') || 0;
            const frequency = this.state.get('audioFrequency') || 0;
            
            // Update audio interface drawer elements
            const overallElement = document.getElementById('audio-overall-value');
            const rmsElement = document.getElementById('audio-rms-value');
            const peakElement = document.getElementById('audio-peak-value');
            const frequencyElement = document.getElementById('audio-frequency-value');
            
            if (overallElement) overallElement.textContent = overall.toFixed(2);
            if (rmsElement) rmsElement.textContent = rms.toFixed(2);
            if (peakElement) peakElement.textContent = peak.toFixed(2);
            if (frequencyElement) frequencyElement.textContent = frequency.toFixed(0);
            
            // Update audio mapping drawer elements
            const mappingOverallElement = document.getElementById('audio-mapping-overall-value');
            const mappingRMSElement = document.getElementById('audio-mapping-rms-value');
            const mappingPeakElement = document.getElementById('audio-mapping-peak-value');
            const mappingFrequencyElement = document.getElementById('audio-mapping-frequency-value');
            
            if (mappingOverallElement) mappingOverallElement.textContent = overall.toFixed(2);
            if (mappingRMSElement) mappingRMSElement.textContent = rms.toFixed(2);
            if (mappingPeakElement) mappingPeakElement.textContent = peak.toFixed(2);
            if (mappingFrequencyElement) mappingFrequencyElement.textContent = frequency.toFixed(0);
        };
        
        // Event listeners with tracking for cleanup
        this.addTrackedEventListener(interfaceSelect, 'change', (e) => {
            const interfaceId = e.target.value;
            const interfaces = this.audioManager.getAvailableInterfaces();
            const selectedInterface = interfaces.find(i => i.id === interfaceId);
            
            if (selectedInterface) {
                this.audioManager.selectInterface(selectedInterface);
                this.updateAudioChannelsDisplay();
            }
        });
        
        this.addTrackedEventListener(connectButton, 'click', async () => {
            try {
                await this.audioManager.startAudioCapture();
                this.updateAudioStatus();
            } catch (error) {
                console.error('Failed to connect audio:', error);
                alert('Failed to connect audio interface. Please check permissions and try again.');
            }
        });
        
        this.addTrackedEventListener(disconnectButton, 'click', () => {
            this.audioManager.stopAudioCapture();
            this.updateAudioStatus();
        });
        
        this.addTrackedEventListener(refreshButton, 'click', async () => {
            await this.audioManager.refreshInterfaces();
            this.updateAudioInterfaceDropdown();
            this.updateAudioStatus();
        });
        
        // Initialize debounced audio update for performance optimization
        this.debouncedAudioUpdate = this.debounce(() => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        }, 16); // ~60fps debouncing
        
        // Subscribe to state changes with optimized subscriptions
        this.state.subscribe('audioListening', () => {
            this.updateAudioStatus();
            // Update drawer connection status if a mapping drawer is open
            if (this.drawerManager && this.drawerManager.isAnyDrawerOpen()) {
                this.drawerManager.checkDrawerConnectionStatus(this.drawerManager.getCurrentDrawer());
            }
        });
        this.state.subscribe('audioAvailable', () => this.updateAudioStatus());
        
        // Single subscription for all audio values with debounced updates
        const audioValues = ['audioOverall', 'audioRMS', 'audioPeak', 'audioFrequency'];
        audioValues.forEach(key => {
            this.state.subscribe(key, () => {
                this.debouncedAudioUpdate();
            });
        });
        
        // Initial setup
        this.updateAudioInterfaceDropdown();
        this.updateAudioChannelsDisplay();
        this.updateAudioStatus();
        this.updateAudioAnalysisDisplay();
    }

    // MIDI Clock Event Handlers
    onMIDIClock() {
        this.midiClockManager.onMIDIClock();
    }

    onMIDIStart() {
        this.midiClockManager.onMIDIStart();
        
        // Check if MIDI stop should stop the animation loop (and restart it on start)
        if (this.state.get('midiStopStopsAnimation')) {
            this.animationLoop.start();
            console.log('Animation loop started by MIDI start message');
        }
    }

    onMIDIStop() {
        this.midiClockManager.onMIDIStop();
        
        // Check if MIDI stop should stop the animation loop
        if (this.state.get('midiStopStopsAnimation')) {
            this.animationLoop.stop();
            console.log('Animation loop stopped by MIDI stop message');
        }
    }

    onMIDIContinue() {
        this.midiClockManager.onMIDIContinue();
    }

    // MIDI Tempo Change Handler
    onMIDITempoChange(newBPM) {
        this.midiClockManager.onMIDITempoChange(newBPM);
    }

    // MIDI Tap Tempo Handler
    onMIDITempoTap() {
        this.midiClockManager.onMIDITempoTap();
    }

    isAnimationPaused() {
        return !this.animationLoop.getRunningState();
    }

    forceRenderWhenPaused() {
        if (this.scene && this.isAnimationPaused()) {
            this.scene.render();
        }
    }

    /**
     * Cleanup method to properly dispose of resources
     */
    cleanup() {
        // Clear DOM cache
        if (this.domCache) {
            this.domCache.clearCache();
        }
        
        // Invalidate morphing cache
        this.invalidateMorphingCache();
        
        // Clear debounced audio update
        if (this.debouncedAudioUpdate) {
            this.debouncedAudioUpdate = null;
        }
        
        // Abort all ongoing operations
        this.abortAllOperations();
        
        // Remove all tracked event listeners
        this.removeAllEventListeners();
        
        // Stop animation loop
        if (this.animationLoop) {
            this.animationLoop.stop();
        }
        
        // Disconnect MIDI
        if (this.midiManager) {
            this.midiManager.disconnect();
        }
        
        // Stop audio manager
        if (this.audioManager) {
            this.audioManager.stopAudioCapture();
        }
        
        console.log('App cleanup completed');
    }
} 