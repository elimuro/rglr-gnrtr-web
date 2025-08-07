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
// import { VideoRecorder } from '../modules/VideoRecorder.js';
import { AudioManager } from '../modules/AudioManager.js';
import { MIDIClockManager } from '../modules/MIDIClockManager.js';

export class App {
    // Unified parameter handler configuration to eliminate code duplication
    static PARAMETER_HANDLERS = new Map([
        ['movementAmplitude', { 
            setter: (state, value) => state.set('movementAmplitude', value * 0.5),
            requiresScene: false 
        }],
        ['rotationAmplitude', { 
            setter: (state, value) => state.set('rotationAmplitude', value * 2),
            requiresScene: false 
        }],
        ['scaleAmplitude', { 
            setter: (state, value) => state.set('scaleAmplitude', value),
            requiresScene: false 
        }],
        ['randomness', { 
            setter: (state, value) => state.set('randomness', value),
            requiresScene: false 
        }],
        ['cellSize', { 
            setter: (state, value, scene) => {
                state.set('cellSize', 0.5 + value * 1.5);
                scene?.updateCellSize();
            },
            requiresScene: true 
        }],
        ['movementFrequency', { 
            setter: (state, value) => state.set('movementFrequency', 0.1 + value * 2),
            requiresScene: false 
        }],
        ['rotationFrequency', { 
            setter: (state, value) => state.set('rotationFrequency', 0.1 + value * 2),
            requiresScene: false 
        }],
        ['scaleFrequency', { 
            setter: (state, value) => state.set('scaleFrequency', 0.1 + value * 2),
            requiresScene: false 
        }],
        ['gridWidth', { 
            setter: (state, value, scene) => {
                const newWidth = Math.floor(1 + value * 29);
                if (state.get('gridWidth') !== newWidth) {
                    state.set('gridWidth', newWidth);
                    scene?.createGrid();
                }
            },
            requiresScene: true 
        }],
        ['gridHeight', { 
            setter: (state, value, scene) => {
                const newHeight = Math.floor(1 + value * 29);
                if (state.get('gridHeight') !== newHeight) {
                    state.set('gridHeight', newHeight);
                    scene?.createGrid();
                }
            },
            requiresScene: true 
        }],
        ['compositionWidth', { 
            setter: (state, value, scene) => {
                const newCompWidth = Math.floor(1 + value * 29);
                if (state.get('compositionWidth') !== newCompWidth) {
                    state.set('compositionWidth', newCompWidth);
                    scene?.createGrid();
                }
            },
            requiresScene: true 
        }],
        ['compositionHeight', { 
            setter: (state, value, scene) => {
                const newCompHeight = Math.floor(1 + value * 29);
                if (state.get('compositionHeight') !== newCompHeight) {
                    state.set('compositionHeight', newCompHeight);
                    scene?.createGrid();
                }
            },
            requiresScene: true 
        }],
        ['animationType', { 
            setter: (state, value) => state.set('animationType', Math.floor(value * 4)),
            requiresScene: false 
        }],
        ['sphereRefraction', { 
            setter: (state, value, scene) => {
                state.set('sphereRefraction', value * 2);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereTransparency', { 
            setter: (state, value, scene) => {
                state.set('sphereTransparency', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereTransmission', { 
            setter: (state, value, scene) => {
                state.set('sphereTransmission', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereRoughness', { 
            setter: (state, value, scene) => {
                state.set('sphereRoughness', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereMetalness', { 
            setter: (state, value, scene) => {
                state.set('sphereMetalness', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereScale', { 
            setter: (state, value, scene) => {
                state.set('sphereScale', 0.5 + value * 2.5);
                scene?.updateSphereScales();
            },
            requiresScene: true 
        }],
        ['sphereClearcoat', { 
            setter: (state, value, scene) => {
                state.set('sphereClearcoat', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereClearcoatRoughness', { 
            setter: (state, value, scene) => {
                state.set('sphereClearcoatRoughness', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereEnvMapIntensity', { 
            setter: (state, value, scene) => {
                state.set('sphereEnvMapIntensity', value * 3);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereDistortionStrength', { 
            setter: (state, value, scene) => {
                state.set('sphereDistortionStrength', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereHighPerformanceMode', { 
            setter: (state, value, scene) => {
                state.set('sphereHighPerformanceMode', value > 0.5);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['sphereWaterDistortion', { 
            setter: (state, value, scene) => {
                state.set('sphereWaterDistortion', value > 0.5);
                scene?.updateSphereMaterials();
            },
            requiresScene: true 
        }],
        ['bloomStrength', { 
            setter: (state, value, scene) => {
                state.set('bloomStrength', value * 2);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['bloomRadius', { 
            setter: (state, value, scene) => {
                state.set('bloomRadius', value * 1.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['bloomThreshold', { 
            setter: (state, value, scene) => {
                state.set('bloomThreshold', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['chromaticIntensity', { 
            setter: (state, value, scene) => {
                state.set('chromaticIntensity', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['vignetteIntensity', { 
            setter: (state, value, scene) => {
                state.set('vignetteIntensity', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['vignetteRadius', { 
            setter: (state, value, scene) => {
                state.set('vignetteRadius', 0.3 + value * 0.7);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['vignetteSoftness', { 
            setter: (state, value, scene) => {
                state.set('vignetteSoftness', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['grainIntensity', { 
            setter: (state, value, scene) => {
                state.set('grainIntensity', value * 0.3);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['colorHue', { 
            setter: (state, value, scene) => {
                state.set('colorHue', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['colorSaturation', { 
            setter: (state, value, scene) => {
                state.set('colorSaturation', 0.1 + value * 2);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['colorBrightness', { 
            setter: (state, value, scene) => {
                state.set('colorBrightness', 0.5 + value);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['colorContrast', { 
            setter: (state, value, scene) => {
                state.set('colorContrast', 0.5 + value * 1.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['ambientLightIntensity', { 
            setter: (state, value, scene) => {
                state.set('ambientLightIntensity', value * 2);
                scene?.updateLighting();
            },
            requiresScene: true 
        }],
        ['directionalLightIntensity', { 
            setter: (state, value, scene) => {
                state.set('directionalLightIntensity', value * 2);
                scene?.updateLighting();
            },
            requiresScene: true 
        }],
        ['pointLight1Intensity', { 
            setter: (state, value, scene) => {
                state.set('pointLight1Intensity', value * 3);
                scene?.updateLighting();
            },
            requiresScene: true 
        }],
        ['pointLight2Intensity', { 
            setter: (state, value, scene) => {
                state.set('pointLight2Intensity', value * 3);
                scene?.updateLighting();
            },
            requiresScene: true 
        }],
        ['rimLightIntensity', { 
            setter: (state, value, scene) => {
                state.set('rimLightIntensity', value * 2);
                scene?.updateLighting();
            },
            requiresScene: true 
        }],
        ['accentLightIntensity', { 
            setter: (state, value, scene) => {
                state.set('accentLightIntensity', value * 2);
                scene?.updateLighting();
            },
            requiresScene: true 
        }],
        ['lightColour', { 
            setter: (state, value, scene, app) => {
                const hue = Math.floor(value * 360);
                const color = app.hsvToHex(hue, 100, 100);
                state.set('lightColour', color);
                scene?.updateLighting();
            },
            requiresScene: true,
            requiresApp: true
        }],
        ['shapeCyclingSpeed', { 
            setter: (state, value) => state.set('shapeCyclingSpeed', 0.1 + value * 5),
            requiresScene: false 
        }],
        ['shapeCyclingPattern', { 
            setter: (state, value) => state.set('shapeCyclingPattern', Math.floor(value * 5)),
            requiresScene: false 
        }],
        ['shapeCyclingDirection', { 
            setter: (state, value) => state.set('shapeCyclingDirection', Math.floor(value * 4)),
            requiresScene: false 
        }],
        ['shapeCyclingSync', { 
            setter: (state, value) => state.set('shapeCyclingSync', Math.floor(value * 4)),
            requiresScene: false 
        }],
        ['shapeCyclingIntensity', { 
            setter: (state, value) => state.set('shapeCyclingIntensity', value),
            requiresScene: false 
        }],
        ['shapeCyclingTrigger', { 
            setter: (state, value) => state.set('shapeCyclingTrigger', Math.floor(value * 4)),
            requiresScene: false 
        }],
        // Additional parameters from updateAnimationParameter
        ['globalBPM', { 
            setter: (state, value) => state.set('globalBPM', 60 + Math.floor(value * 240)),
            requiresScene: false 
        }],
        ['enableShapeCycling', { 
            setter: (state, value) => state.set('enableShapeCycling', value > 0.5),
            requiresScene: false 
        }],
        ['showGrid', { 
            setter: (state, value, scene) => {
                state.set('showGrid', value > 0.5);
                scene?.updateGridLines();
            },
            requiresScene: true 
        }],
        ['shapeColor', { 
            setter: (state, value, scene, app) => {
                const shapeHue = Math.floor(value * 360);
                const shapeColor = app.hsvToHex(shapeHue, 100, 100);
                state.set('shapeColor', shapeColor);
                scene?.updateShapeColors();
            },
            requiresScene: true,
            requiresApp: true
        }],
        ['backgroundColor', { 
            setter: (state, value, scene, app) => {
                const bgHue = Math.floor(value * 360);
                const bgColor = app.hsvToHex(bgHue, 100, 100);
                state.set('backgroundColor', bgColor);
                scene?.updateBackgroundColor();
            },
            requiresScene: true,
            requiresApp: true
        }],
        ['bloomEnabled', { 
            setter: (state, value, scene) => {
                state.set('bloomEnabled', value > 0.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['chromaticAberrationEnabled', { 
            setter: (state, value, scene) => {
                state.set('chromaticAberrationEnabled', value > 0.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['vignetteEnabled', { 
            setter: (state, value, scene) => {
                state.set('vignetteEnabled', value > 0.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['grainEnabled', { 
            setter: (state, value, scene) => {
                state.set('grainEnabled', value > 0.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['colorGradingEnabled', { 
            setter: (state, value, scene) => {
                state.set('colorGradingEnabled', value > 0.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['postProcessingEnabled', { 
            setter: (state, value, scene) => {
                state.set('postProcessingEnabled', value > 0.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['fxaaEnabled', { 
            setter: (state, value, scene) => {
                state.set('fxaaEnabled', value > 0.5);
                scene?.updatePostProcessing();
            },
            requiresScene: true 
        }],
        ['enableFrustumCulling', { 
            setter: (state, value) => state.set('enableFrustumCulling', value > 0.5),
            requiresScene: false 
        }],
        ['morphingEasing', { 
            setter: (state, value) => {
                const easingOptions = ['power2.inOut', 'power2.in', 'power2.out', 'power3.inOut', 'power3.in', 'power3.out'];
                const easingIndex = Math.floor(value * easingOptions.length);
                state.set('morphingEasing', easingOptions[easingIndex]);
            },
            requiresScene: false 
        }],
        ['gridColor', { 
            setter: (state, value, scene, app) => {
                const gridHue = Math.floor(value * 360);
                const gridColor = app.hsvToHex(gridHue, 100, 100);
                state.set('gridColor', gridColor);
                scene?.updateGridLines();
            },
            requiresScene: true,
            requiresApp: true
        }],
        ['centerScalingEnabled', { 
            setter: (state, value, scene) => {
                state.set('centerScalingEnabled', value > 0.5);
                scene?.updateCenterScaling();
            },
            requiresScene: true 
        }],
        ['centerScalingIntensity', { 
            setter: (state, value, scene) => {
                state.set('centerScalingIntensity', value * 2);
                scene?.updateCenterScaling();
            },
            requiresScene: true 
        }],
        ['centerScalingCurve', { 
            setter: (state, value, scene) => {
                state.set('centerScalingCurve', Math.floor(value * 4));
                scene?.updateCenterScaling();
            },
            requiresScene: true 
        }],
        ['centerScalingRadius', { 
            setter: (state, value, scene) => {
                state.set('centerScalingRadius', 0.1 + value * 5);
                scene?.updateCenterScaling();
            },
            requiresScene: true 
        }],
        ['centerScalingDirection', { 
            setter: (state, value, scene) => {
                state.set('centerScalingDirection', Math.floor(value * 2));
                scene?.updateCenterScaling();
            },
            requiresScene: true 
        }],
        ['centerScalingAnimationSpeed', { 
            setter: (state, value, scene) => {
                state.set('centerScalingAnimationSpeed', 0.1 + value * 3);
                scene?.updateCenterScaling();
            },
            requiresScene: true 
        }],
        ['centerScalingAnimationType', { 
            setter: (state, value, scene) => {
                state.set('centerScalingAnimationType', Math.floor(value * 4));
                scene?.updateCenterScaling();
            },
            requiresScene: true 
        }],
        ['movementDivision', { 
            setter: (state, value, scene, app) => {
                state.set('movementDivision', app.getDivisionFromIndex(value));
            },
            requiresScene: false,
            requiresApp: true
        }],
        ['rotationDivision', { 
            setter: (state, value, scene, app) => {
                state.set('rotationDivision', app.getDivisionFromIndex(value));
            },
            requiresScene: false,
            requiresApp: true
        }],
        ['scaleDivision', { 
            setter: (state, value, scene, app) => {
                state.set('scaleDivision', app.getDivisionFromIndex(value));
            },
            requiresScene: false,
            requiresApp: true
        }],
        ['shapeCyclingDivision', { 
            setter: (state, value, scene, app) => {
                state.set('shapeCyclingDivision', app.getDivisionFromIndex(value));
            },
            requiresScene: false,
            requiresApp: true
        }],
        ['morphingDivision', { 
            setter: (state, value, scene, app) => {
                state.set('morphingDivision', app.getDivisionFromIndex(value));
            },
            requiresScene: false,
            requiresApp: true
        }],
        ['centerScalingDivision', { 
            setter: (state, value, scene, app) => {
                state.set('centerScalingDivision', app.getDivisionFromIndex(value));
            },
            requiresScene: false,
            requiresApp: true
        }],
        ['enableMovementAnimation', { 
            setter: (state, value) => state.set('enableMovementAnimation', value > 0.5),
            requiresScene: false 
        }],
        ['enableRotationAnimation', { 
            setter: (state, value) => state.set('enableRotationAnimation', value > 0.5),
            requiresScene: false 
        }],
        ['enableScaleAnimation', { 
            setter: (state, value) => state.set('enableScaleAnimation', value > 0.5),
            requiresScene: false 
        }]
    ]);

    constructor() {
        this.state = new StateManager();
        this.scene = new Scene(this.state);
        
        // Initialize MIDI clock manager first
        this.midiClockManager = new MIDIClockManager(this);
        
        // Initialize animation loop with clock manager
        this.animationLoop = new AnimationLoop(this.scene, this.state, this.midiClockManager);
        
        this.midiManager = new MIDIManager(this);
        this.controlManager = null;
        this.guiManager = null;
        
        // Initialize morphing system
        this.morphingSystem = new ShapeMorphingSystem();
        
        // Initialize video recorder (temporarily disabled)
        // this.videoRecorder = new VideoRecorder(this);
        
        // Initialize audio manager
        this.audioManager = new AudioManager(this.state);
        
        // Performance optimization: DOM element caching
        this.domCache = new Map();
        this.domCacheInitialized = false;
        
        // Performance optimization: Async operation cancellation
        this.abortControllers = new Map();
        
                    // Performance optimization: Event listener tracking
            this.eventListeners = [];

            // Phase 2.1: Morphing state cache
            this.morphingStateCache = null;

            this.init();
    }

    // Performance optimization: Unified parameter handler
    handleParameterUpdate(target, value, source = 'midi') {
        const handler = App.PARAMETER_HANDLERS.get(target);
        if (handler) {
            if (handler.requiresApp) {
                handler.setter(this.state, value, this.scene, this);
            } else if (handler.requiresScene) {
                handler.setter(this.state, value, this.scene);
            } else {
                handler.setter(this.state, value);
            }
        } else {
            // For any other parameters, just set the value directly
            this.state.set(target, value);
        }
    }

    // Performance optimization: DOM element caching
    initializeDOMCache() {
        if (this.domCacheInitialized) return;
        
        const elementsToCache = [
            'midi-drawer-container',
            'audio-interface-select',
            'audio-channels-container',
            'audio-connect',
            'audio-disconnect',
            'audio-refresh-interfaces',
            'audio-status-indicator',
            'audio-status-text',
            'audio-overall-value',
            'audio-rms-value',
            'audio-peak-value',
            'audio-frequency-value',
            'audio-mapping-overall-value',
            'audio-mapping-rms-value',
            'audio-mapping-peak-value',
            'audio-mapping-frequency-value',
            'midi-connect',
            'midi-disconnect',
            'midi-refresh',
            'midi-preset-select',
            'scene-preset-select',
            'preset-file-input',
            'add-cc-control',
            'add-note-control',
            'add-audio-mapping-control',
            'mapping-test',
            'mapping-save',
            'mapping-load',
            'save-scene-button',
            'load-scene-button',
            'interpolation-duration',
            'interpolation-duration-value',
            'interpolation-easing',
            'debug-interpolation',
            'midi-activity-clear',
            'midi-activity-pause',
            'midi-activity-max',
            'midi-activity-autoscroll',
            'midi-activity-filter-clock',
            'midi-activity-stream',
            'midi-activity-count',
            'midi-cc-count',
            'midi-note-count',
            'midi-pitch-count',
            'midi-system-count',
            'midi-activity-status',
            'midi-activity-device',
            'midi-activity-rate',
            'midi-activity-last',
            'cc-connect-midi',
            'note-connect-midi',
            'audio-mapping-connect-audio',
            'cc-controls-container',
            'note-controls-container',
            'audio-mapping-controls-container'
        ];
        
        elementsToCache.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.domCache.set(id, element);
            }
        });
        
        this.domCacheInitialized = true;
    }

    getCachedElement(id) {
        if (!this.domCache.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.domCache.set(id, element);
            }
            return element;
        }
        return this.domCache.get(id);
    }

    // Performance optimization: Debounced function utility
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

    // Performance optimization: Event listener tracking
    addTrackedEventListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
        }
    }

    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element?.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    // Performance optimization: Cleanup method
    cleanup() {
        // Abort all pending requests
        this.abortControllers.forEach(controller => controller.abort());
        this.abortControllers.clear();
        
        // Remove event listeners
        this.removeAllEventListeners();
        
        // Stop managers
        this.animationLoop?.stop();
        this.audioManager?.stopAudioCapture();
        this.midiManager?.disconnect();
        
        // Clear caches
        this.domCache.clear();
        this.domCacheInitialized = false;
        if (this.morphingStateCache) {
            this.morphingStateCache.cacheValid = false;
        }
        
        // Phase 4.1: Clear color lookup cache
        this.constructor.HEX_LOOKUP.clear();
    }

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
            
            // Set up morphing system with shape generator
            this.scene.shapeGenerator.setMorphingSystem(this.morphingSystem);
            this.morphingSystem.setShapeGenerator(this.scene.shapeGenerator);
            
            // Initialize GUI
            this.guiManager = new GUIManager(this.state, this);
            this.guiManager.init();
            
            // Initialize MIDI
            this.setupMIDI();
            
            // Initialize control manager when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeControlManager();
                    this.initializeAudioMappingManager();
                    this.loadAvailablePresets();
                    this.loadAvailableScenePresets();
                });
            } else {
                this.initializeControlManager();
                this.initializeAudioMappingManager();
                this.loadAvailablePresets();
                this.loadAvailableScenePresets();
            }
            
            // Start animation loop
            this.animationLoop.start();
            
            // Performance optimization: Initialize DOM cache
            this.initializeDOMCache();
            
            // Set up window resize handler
            window.addEventListener('resize', () => this.onWindowResize());
            
            // Set up keyboard shortcuts for testing
            window.addEventListener('keydown', (event) => this.handleKeyDown(event));
            
        } catch (error) {
            console.error('Error during App initialization:', error);
        }
    }

    setupMIDI() {
        // Set up drawer functionality
        this.setupDrawers();
        
        // Set up MIDI UI event listeners using cached DOM elements
        this.addTrackedEventListener(this.getCachedElement('midi-connect'), 'click', () => {
            this.midiManager.connect();
        });
        
        this.addTrackedEventListener(this.getCachedElement('midi-disconnect'), 'click', () => {
            this.midiManager.disconnect();
        });
        
        // Set up audio interface UI event listeners
        this.setupAudioInterfaceUI();

        const refreshButton = this.getCachedElement('midi-refresh');
        if (refreshButton) {
            this.addTrackedEventListener(refreshButton, 'click', () => {
                this.midiManager.refreshDevices();
            });
        }

        // Preset selector
        this.addTrackedEventListener(this.getCachedElement('midi-preset-select'), 'change', (e) => {
            this.applyCCPreset(e.target.value);
        });
        
        // Scene preset selector
        this.addTrackedEventListener(this.getCachedElement('scene-preset-select'), 'change', (e) => {
            this.applyScenePreset(e.target.value);
        });
        
        // File input for loading presets and scenes
        this.addTrackedEventListener(this.getCachedElement('preset-file-input'), 'change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check if it's a scene file or MIDI preset by reading the content
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // Check if it's a scene file (has settings property)
                        if (data.settings) {
                            this.loadSceneFile(data);
                        } else {
                            // Assume it's a MIDI preset
                            this.loadPreset(file);
                        }
                    } catch (error) {
                        console.error('Error parsing file:', error);
                        alert('Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // Add control buttons
        this.addTrackedEventListener(this.getCachedElement('add-cc-control'), 'click', () => {
            this.addCCControl();
        });
        
        this.addTrackedEventListener(this.getCachedElement('add-note-control'), 'click', () => {
            this.addNoteControl();
        });
        
        this.addTrackedEventListener(this.getCachedElement('add-audio-mapping-control'), 'click', () => {
            this.addAudioMappingControl();
        });
        
        // Mapping test button
        this.addTrackedEventListener(this.getCachedElement('mapping-test'), 'click', () => {
            this.testAudioMapping();
        });
        
        // Mapping save button
        this.addTrackedEventListener(this.getCachedElement('mapping-save'), 'click', () => {
            this.savePreset();
        });
        
        // Mapping load button
        this.addTrackedEventListener(this.getCachedElement('mapping-load'), 'click', () => {
            this.getCachedElement('preset-file-input').click();
        });
        
        // Test button for CC mapping
        this.addTrackedEventListener(this.getCachedElement('mapping-test'), 'click', () => {
            this.testCCValues();
        });
        
        // MIDI stop animation checkbox
        const midiStopAnimationCheckbox = document.getElementById('midi-stop-animation');
        if (midiStopAnimationCheckbox) {
            // Set initial state
            midiStopAnimationCheckbox.checked = this.state.get('midiStopStopsAnimation') || false;
            
            // Add event listener
            this.addTrackedEventListener(midiStopAnimationCheckbox, 'change', (e) => {
                this.state.set('midiStopStopsAnimation', e.target.checked);
            });
        }
        
        // Scene management buttons
        this.addTrackedEventListener(this.getCachedElement('save-scene-button'), 'click', () => {
            this.saveScene();
        });
        
        this.addTrackedEventListener(this.getCachedElement('load-scene-button'), 'click', () => {
            this.getCachedElement('preset-file-input').click();
        });
        
        // Interpolation duration slider
        const interpolationDurationInput = this.getCachedElement('interpolation-duration');
        const interpolationDurationValue = this.getCachedElement('interpolation-duration-value');
        
        if (interpolationDurationInput && interpolationDurationValue) {
            this.addTrackedEventListener(interpolationDurationInput, 'input', (e) => {
                const value = parseFloat(e.target.value);
                interpolationDurationValue.textContent = `${value.toFixed(1)}s`;
                this.state.set('interpolationDuration', value);
            });
        }
        
        // Interpolation easing selector
        const interpolationEasingSelect = this.getCachedElement('interpolation-easing');
        if (interpolationEasingSelect) {
            this.addTrackedEventListener(interpolationEasingSelect, 'change', (e) => {
                this.state.set('interpolationEasing', e.target.value);
            });
        }
        
        // Debug interpolation button
        const debugInterpolationButton = this.getCachedElement('debug-interpolation');
        if (debugInterpolationButton) {
            this.addTrackedEventListener(debugInterpolationButton, 'click', () => {
                this.debugInterpolation();
            });
        }
    }

    setupDrawers() {
        // Drawer state management
        this.currentDrawer = null;
        this.drawerContainer = document.getElementById('midi-drawer-container');
        
        if (!this.drawerContainer) {
            console.error('Drawer container not found');
            return;
        }
        
        // Initialize MIDI activity tracking
        this.setupMIDIActivityTracking();
        
        // Ensure drawer is hidden initially
        this.hideDrawerContainer();
        
        // Set up drawer button event listeners
        const drawerButtons = [
            'drawer-connect',
            'drawer-mapping',
            'drawer-scene-management',
            'drawer-midi-activity'
        ];
        
        drawerButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleDrawer(buttonId.replace('drawer-', ''));
                });
            } else {
                console.warn(`Drawer button not found: ${buttonId}`);
            }
        });
        
        // Close drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (this.currentDrawer) {
                // Check if the click is within the drawer container or on drawer-related elements
                const isWithinDrawer = this.drawerContainer.contains(e.target);
                const clickedDrawerButton = e.target.closest('[id^="drawer-"]');
                const clickedInteractiveElement = e.target.closest('[data-drawer-interactive]');
                
                // Only close drawer if clicking outside AND not on any interactive drawer elements
                if (!isWithinDrawer && !clickedDrawerButton && !clickedInteractiveElement) {
                    this.closeDrawer();
                }
            }
        });
        
        // Close drawer on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentDrawer) {
                this.closeDrawer();
            }
        });
        
        // Handle window resize for drawer positioning
        window.addEventListener('resize', () => {
            if (this.currentDrawer) {
                // Re-apply the current drawer positioning based on new screen size
                this.toggleDrawer(this.currentDrawer);
            }
        });

        // Set up connection button event handlers
        this.setupConnectionButtonHandlers();
        
        // Set up mapping drawer tabs
        this.setupMappingTabs();
        
        // Set up connect drawer tabs
        this.setupConnectTabs();
    }

    setupMIDIActivityTracking() {
        // MIDI activity tracking state
        this.midiActivityState = {
            messages: [],
            maxMessages: 100,
            isPaused: false,
            filterClock: true, // Default to filtering clock messages
            messageCounts: {
                cc: 0,
                note: 0,
                pitch: 0,
                system: 0
            },
            lastActivity: null,
            messageRate: 0,
            rateTimer: null
        };

        // Set up MIDI activity drawer controls
        this.setupMIDIActivityControls();
        
        // Start periodic updates for MIDI activity rate
        setInterval(() => {
            this.updateMIDIActivityRate();
            this.updateMIDIActivityStats();
        }, 1000);
    }

    setupMIDIActivityControls() {
        // Clear button
        const clearButton = document.getElementById('midi-activity-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearMIDIActivity();
            });
        }

        // Pause button
        const pauseButton = document.getElementById('midi-activity-pause');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                this.toggleMIDIActivityPause();
            });
        }

        // Max messages selector
        const maxMessagesSelect = document.getElementById('midi-activity-max');
        if (maxMessagesSelect) {
            maxMessagesSelect.addEventListener('change', (e) => {
                this.midiActivityState.maxMessages = parseInt(e.target.value);
                this.trimMIDIActivityMessages();
            });
        }

        // Auto-scroll checkbox
        const autoscrollCheckbox = document.getElementById('midi-activity-autoscroll');
        if (autoscrollCheckbox) {
            autoscrollCheckbox.addEventListener('change', (e) => {
                this.midiActivityState.autoScroll = e.target.checked;
            });
        }

        // Filter clock checkbox
        const filterClockCheckbox = document.getElementById('midi-activity-filter-clock');
        if (filterClockCheckbox) {
            filterClockCheckbox.checked = this.midiActivityState.filterClock;
            filterClockCheckbox.addEventListener('change', (e) => {
                this.midiActivityState.filterClock = e.target.checked;
            });
        }
    }

    addMIDIActivityMessage(message, category) {
        if (this.midiActivityState.isPaused) return;

        // Filter out clock messages if filter is enabled
        if (this.midiActivityState.filterClock && message.includes('MIDI Clock')) {
            return;
        }

        const timestamp = new Date();
        const messageEntry = {
            timestamp,
            message,
            category,
            id: Date.now() + Math.random()
        };

        this.midiActivityState.messages.push(messageEntry);
        
        // Update message counts
        if (category && this.midiActivityState.messageCounts[category] !== undefined) {
            this.midiActivityState.messageCounts[category]++;
        }
        
        this.midiActivityState.lastActivity = timestamp;
        this.trimMIDIActivityMessages();
        this.updateMIDIActivityDisplay();
        this.updateMIDIActivityStats();
        this.updateMIDIActivityRate();
        
        // Update the activity status in the button
        this.updateMIDIActivityButtonStatus();
    }

    trimMIDIActivityMessages() {
        while (this.midiActivityState.messages.length > this.midiActivityState.maxMessages) {
            this.midiActivityState.messages.shift();
        }
    }

    updateMIDIActivityDisplay() {
        const streamContainer = document.getElementById('midi-activity-stream');
        if (!streamContainer) return;

        if (this.midiActivityState.messages.length === 0) {
            streamContainer.innerHTML = '<div class="text-gray-500 text-center py-8">No MIDI activity detected</div>';
            return;
        }

        const messagesHTML = this.midiActivityState.messages.map(entry => {
            const time = entry.timestamp.toLocaleTimeString();
            return `<div class="py-1 border-b border-gray-700 last:border-b-0">
                <div class="flex justify-between items-start">
                    <span class="text-gray-400 text-xs">${time}</span>
                    <span class="text-midi-green font-mono text-xs">${entry.message}</span>
                </div>
            </div>`;
        }).join('');

        streamContainer.innerHTML = messagesHTML;

        // Auto-scroll to bottom
        if (this.midiActivityState.autoScroll !== false) {
            streamContainer.scrollTop = streamContainer.scrollHeight;
        }
    }

    updateMIDIActivityStats() {
        // Update message count
        const countElement = document.getElementById('midi-activity-count');
        if (countElement) {
            countElement.textContent = this.midiActivityState.messages.length;
        }

        // Update message type counts
        const ccCount = document.getElementById('midi-cc-count');
        const noteCount = document.getElementById('midi-note-count');
        const pitchCount = document.getElementById('midi-pitch-count');
        const systemCount = document.getElementById('midi-system-count');

        if (ccCount) ccCount.textContent = this.midiActivityState.messageCounts.cc;
        if (noteCount) noteCount.textContent = this.midiActivityState.messageCounts.note;
        if (pitchCount) pitchCount.textContent = this.midiActivityState.messageCounts.pitch;
        if (systemCount) systemCount.textContent = this.midiActivityState.messageCounts.system;

        // Update connection status
        this.updateMIDIActivityConnectionStatus();
    }

    updateMIDIActivityConnectionStatus() {
        const statusElement = document.getElementById('midi-activity-status');
        const deviceElement = document.getElementById('midi-activity-device');
        const rateElement = document.getElementById('midi-activity-rate');
        const lastElement = document.getElementById('midi-activity-last');

        if (statusElement) {
            const isConnected = this.midiManager && this.midiManager.isConnected;
            statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
            statusElement.className = isConnected ? 'text-green-400' : 'text-red-400';
        }

        if (deviceElement) {
            const deviceInfo = this.midiManager ? this.midiManager.getCurrentDeviceInfo() : null;
            deviceElement.textContent = deviceInfo ? deviceInfo.name : 'None';
        }

        if (rateElement) {
            rateElement.textContent = this.midiActivityState.messageRate.toFixed(1);
        }

        if (lastElement) {
            if (this.midiActivityState.lastActivity) {
                const timeDiff = Date.now() - this.midiActivityState.lastActivity.getTime();
                if (timeDiff < 60000) { // Less than 1 minute
                    lastElement.textContent = `${Math.floor(timeDiff / 1000)}s ago`;
                } else {
                    lastElement.textContent = this.midiActivityState.lastActivity.toLocaleTimeString();
                }
            } else {
                lastElement.textContent = 'Never';
            }
        }
    }

    clearMIDIActivity() {
        this.midiActivityState.messages = [];
        this.midiActivityState.messageCounts = { cc: 0, note: 0, pitch: 0, system: 0 };
        this.midiActivityState.lastActivity = null;
        this.midiActivityState.messageRate = 0;
        this.updateMIDIActivityDisplay();
        this.updateMIDIActivityStats();
    }

    toggleMIDIActivityPause() {
        this.midiActivityState.isPaused = !this.midiActivityState.isPaused;
        const pauseButton = document.getElementById('midi-activity-pause');
        if (pauseButton) {
            pauseButton.textContent = this.midiActivityState.isPaused ? 'Resume' : 'Pause';
        }
    }

    updateMIDIActivityRate() {
        // Calculate messages per second over the last 5 seconds
        const now = Date.now();
        const recentMessages = this.midiActivityState.messages.filter(
            msg => now - msg.timestamp.getTime() < 5000
        );
        this.midiActivityState.messageRate = recentMessages.length / 5;
    }

    updateMIDIActivityButtonStatus() {
        // The text stays static now, only the activity bars indicate status
        // No need to update the text since it's always "MIDI Activity"
    }
    
    setupConnectTabs() {
        const tabs = ['connect-midi', 'connect-audio'];
        const sections = ['connect-midi-section', 'connect-audio-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = document.getElementById(`tab-${tab}`);
            const section = document.getElementById(sections[index]);
            
            if (tabButton && section) {
                tabButton.addEventListener('click', () => {
                    this.switchConnectTab(tab);
                });
            }
        });
        
        // Start with MIDI tab active
        this.switchConnectTab('connect-midi');
    }
    
    switchConnectTab(activeTab) {
        const tabs = ['connect-midi', 'connect-audio'];
        const sections = ['connect-midi-section', 'connect-audio-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = document.getElementById(`tab-${tab}`);
            const section = document.getElementById(sections[index]);
            
            if (tabButton && section) {
                if (tab === activeTab) {
                    tabButton.classList.add('active');
                    section.classList.add('active');
                    section.classList.remove('hidden');
                } else {
                    tabButton.classList.remove('active');
                    section.classList.remove('active');
                    section.classList.add('hidden');
                }
            }
        });
    }
    
    setupMappingTabs() {
        const tabs = ['cc', 'note', 'audio'];
        const sections = ['cc-mapping-section', 'note-mapping-section', 'audio-mapping-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = document.getElementById(`tab-${tab}`);
            const section = document.getElementById(sections[index]);
            
            if (tabButton && section) {
                tabButton.addEventListener('click', () => {
                    this.switchMappingTab(tab);
                });
            }
        });
        
        // Start with CC tab active
        this.switchMappingTab('cc');
    }
    
    switchMappingTab(activeTab) {
        const tabs = ['cc', 'note', 'audio'];
        const sections = ['cc-mapping-section', 'note-mapping-section', 'audio-mapping-section'];
        
        tabs.forEach((tab, index) => {
            const tabButton = document.getElementById(`tab-${tab}`);
            const section = document.getElementById(sections[index]);
            
            if (tabButton && section) {
                if (tab === activeTab) {
                    tabButton.classList.add('active');
                    section.classList.add('active');
                    section.classList.remove('hidden');
                } else {
                    tabButton.classList.remove('active');
                    section.classList.remove('active');
                    section.classList.add('hidden');
                }
            }
        });
    }

    setupConnectionButtonHandlers() {
        // MIDI connection buttons
        const ccConnectButton = document.getElementById('cc-connect-midi');
        const noteConnectButton = document.getElementById('note-connect-midi');
        
        if (ccConnectButton) {
            ccConnectButton.addEventListener('click', () => {
                // Open the connect drawer to help user connect MIDI
                this.toggleDrawer('connect');
            });
        }
        
        if (noteConnectButton) {
            noteConnectButton.addEventListener('click', () => {
                // Open the connect drawer to help user connect MIDI
                this.toggleDrawer('connect');
            });
        }
        
        // Audio connection button
        const audioConnectButton = document.getElementById('audio-mapping-connect-audio');
        
        if (audioConnectButton) {
            audioConnectButton.addEventListener('click', () => {
                // Open the connect drawer to help user connect audio
                this.toggleDrawer('connect');
            });
        }
    }

    toggleDrawer(drawerName) {
        const contentId = `drawer-${drawerName}-content`;
        const content = document.getElementById(contentId);
        
        if (!content) {
            console.error(`Drawer content not found: ${contentId}`);
            return;
        }
        
        // If clicking the same drawer, close it
        if (this.currentDrawer === drawerName) {
            this.closeDrawer();
            return;
        }
        
        // Close any open drawer first
        this.closeDrawer();
        
        // Show the new drawer
        this.currentDrawer = drawerName;
        content.classList.add('active');
        
        // Handle mobile vs desktop positioning
        if (window.innerWidth <= 768) {
            // On mobile, position the drawer to slide up from the bottom
            this.drawerContainer.style.position = 'fixed';
            this.drawerContainer.style.bottom = '0';
            this.drawerContainer.style.left = '0';
            this.drawerContainer.style.right = '0';
            this.drawerContainer.style.top = 'auto';
            this.drawerContainer.style.zIndex = '45';
            this.drawerContainer.classList.remove('translate-y-full');
            this.drawerContainer.classList.add('open');
        } else {
            // On desktop, let CSS handle the positioning
            this.drawerContainer.classList.remove('-translate-y-full');
            this.drawerContainer.classList.add('open');
            
            // Add specific class for drawer positioning
            if (drawerName === 'connect') {
                this.drawerContainer.classList.add('connect-drawer');
                this.drawerContainer.classList.remove('audio-interface-drawer', 'midi-activity-drawer');
            } else if (drawerName === 'audio-interface') {
                this.drawerContainer.classList.add('audio-interface-drawer');
                this.drawerContainer.classList.remove('connect-drawer', 'midi-activity-drawer');
            } else if (drawerName === 'midi-activity') {
                this.drawerContainer.classList.add('midi-activity-drawer');
                this.drawerContainer.classList.remove('connect-drawer', 'audio-interface-drawer');
            } else {
                this.drawerContainer.classList.remove('connect-drawer', 'audio-interface-drawer', 'midi-activity-drawer');
            }
        }
        
        // Remove hidden class when opening drawer
        this.drawerContainer.classList.remove('drawer-hidden');
        
        // Add staggered animation delays to drawer content elements
        this.addStaggeredAnimations(content);
        
        // Update button states
        this.updateDrawerButtonStates(drawerName);
        
        // Check connection status for mapping drawers
        this.checkDrawerConnectionStatus(drawerName);
    }

    closeDrawer() {
        if (this.currentDrawer) {
            const contentId = `drawer-${this.currentDrawer}-content`;
            const content = document.getElementById(contentId);
            
            if (content) {
                content.classList.remove('active');
            }
            
            this.hideDrawerContainer();
            this.currentDrawer = null;
            
            // Remove drawer-specific classes
            this.drawerContainer.classList.remove('connect-drawer', 'audio-interface-drawer', 'midi-activity-drawer');
            
            // Reset all button states
            this.updateDrawerButtonStates(null);
        }
    }

    hideDrawerContainer() {
        // Handle mobile vs desktop positioning
        if (window.innerWidth <= 768) {
            // On mobile, reset the positioning and hide
            this.drawerContainer.style.position = '';
            this.drawerContainer.style.top = '';
            this.drawerContainer.style.bottom = '';
            this.drawerContainer.style.left = '';
            this.drawerContainer.style.right = '';
            this.drawerContainer.style.zIndex = '';
            this.drawerContainer.classList.add('translate-y-full');
            this.drawerContainer.classList.remove('open');
        } else {
            // On desktop, let CSS handle the positioning
            this.drawerContainer.classList.add('-translate-y-full');
            this.drawerContainer.classList.remove('open');
        }
        
        // Add a hidden class to completely remove it from layout when not active
        this.drawerContainer.classList.add('drawer-hidden');
    }

    checkDrawerConnectionStatus(drawerName) {
        switch (drawerName) {
            case 'connect':
                // Connect drawer doesn't need connection status checking
                break;
            case 'mapping':
                // Check all mapping tab connection statuses
                this.checkMIDIConnectionStatus('cc-midi-connection-status', 'cc-controls-container');
                this.checkMIDIConnectionStatus('note-midi-connection-status', 'note-controls-container');
                this.checkAudioConnectionStatus('audio-mapping-connection-status', 'audio-mapping-controls-container');
                break;
            case 'cc-mapping':
                this.checkMIDIConnectionStatus('cc-midi-connection-status', 'cc-controls-container');
                break;
            case 'note-controls':
                this.checkMIDIConnectionStatus('note-midi-connection-status', 'note-controls-container');
                break;
            case 'audio-mapping':
                this.checkAudioConnectionStatus('audio-mapping-connection-status', 'audio-mapping-controls-container');
                break;
        }
    }

    checkMIDIConnectionStatus(statusElementId, controlsContainerId) {
        const statusElement = document.getElementById(statusElementId);
        const controlsContainer = document.getElementById(controlsContainerId);
        
        if (!statusElement || !controlsContainer) return;
        
        const isMIDIConnected = this.midiManager && this.midiManager.isConnected;
        
        if (!isMIDIConnected) {
            statusElement.classList.remove('hidden');
            controlsContainer.classList.add('opacity-50');
        } else {
            statusElement.classList.add('hidden');
            controlsContainer.classList.remove('opacity-50');
        }
    }

    checkAudioConnectionStatus(statusElementId, controlsContainerId) {
        const statusElement = document.getElementById(statusElementId);
        const controlsContainer = document.getElementById(controlsContainerId);
        
        if (!statusElement || !controlsContainer) return;
        
        const isAudioConnected = this.audioManager && this.audioManager.isListening;
        
        if (!isAudioConnected) {
            statusElement.classList.remove('hidden');
            controlsContainer.classList.add('opacity-50');
        } else {
            statusElement.classList.add('hidden');
            controlsContainer.classList.remove('opacity-50');
        }
    }

    addStaggeredAnimations(content) {
        // Get all animatable elements in the drawer content
        const animatableElements = content.querySelectorAll('button, input, select, .midi-control, label, h3');
        
        animatableElements.forEach((element, index) => {
            // Set CSS custom property for animation delay
            element.style.setProperty('--animation-order', index);
        });
    }

    updateDrawerButtonStates(activeDrawer) {
        const drawerButtons = [
            'drawer-connect',
            'drawer-mapping',
            'drawer-scene-management',
            'drawer-midi-activity'
        ];
        
        drawerButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const drawerName = buttonId.replace('drawer-', '');
                const isActive = drawerName === activeDrawer;
                
                // Remove all state classes
                button.classList.remove(
                    'bg-midi-green', 'bg-opacity-20', 'text-midi-green', 'border-midi-green',
                    'bg-black', 'bg-opacity-30', 'text-white', 'border-gray-600'
                );
                
                // Add appropriate classes
                if (isActive) {
                    button.classList.add('bg-midi-green', 'bg-opacity-20', 'text-midi-green', 'border-midi-green');
                } else {
                    button.classList.add('bg-black', 'bg-opacity-30', 'text-white', 'border-gray-600');
                }
            }
        });
    }
        
        // Removed setupCollapsibleSections() - new design uses cards instead

    initializeControlManager() {
        const ccContainer = document.getElementById('cc-controls-container');
        const noteContainer = document.getElementById('note-controls-container');
        
        if (!ccContainer || !noteContainer) {
            console.error('Could not find MIDI control containers');
            return;
        }
        
        this.controlManager = new MIDIControlManager(ccContainer, this);
        this.controlManager.noteContainer = noteContainer;
        
        this.recreateControlsFromPreset();
    }
    
    initializeAudioMappingManager() {
        const audioMappingContainer = document.getElementById('audio-mapping-controls-container');
        
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
        if (this.currentDrawer) {
            this.checkDrawerConnectionStatus(this.currentDrawer);
        }
    }

    onMIDIDisconnected() {
        this.state.set('midiEnabled', false);
        
        // Update drawer connection status if a mapping drawer is open
        if (this.currentDrawer) {
            this.checkDrawerConnectionStatus(this.currentDrawer);
        }
    }

    onMIDICC(controller, value, channel) {
        const normalizedValue = value / 127;
        
        // Find which parameter this channel/CC combination controls
        const ccMappings = this.state.get('midiCCMappings');
        Object.keys(ccMappings).forEach(param => {
            const mapping = ccMappings[param];
            if (mapping.channel === channel && mapping.cc === controller) {
                const controlElement = document.querySelector(`[data-control-id="${param}"]`);
                if (!controlElement) {
                    return;
                }
                
                // For division parameters, pass the raw MIDI value (0-127)
                // For other parameters, pass the normalized value (0-1)
                const isDivisionParameter = mapping.target.includes('Division');
                const valueToPass = isDivisionParameter ? value : normalizedValue;
                
                this.handleCCMapping(mapping.target, valueToPass);
            }
        });
    }

    onMIDINote(note, velocity, isNoteOn, channel) {
        let matchedMapping = null;
        let matchedMappingKey = null;
        
        const noteMappings = this.state.get('midiNoteMappings');
        Object.keys(noteMappings).forEach(mappingKey => {
            const mapping = noteMappings[mappingKey];
            if (mapping.note === note && mapping.channel === channel) {
                const controlElement = document.querySelector(`[data-control-id="${mappingKey}"]`);
                if (controlElement) {
                    matchedMapping = mapping;
                    matchedMappingKey = mappingKey;
                }
            }
        });
        
        if (matchedMapping && isNoteOn && velocity > 0) {
            this.handleNoteMapping(matchedMapping.target);
        }
    }



    // Phase 4.1: String Operation Optimization - Color lookup cache
    static HEX_LOOKUP = new Map();

    static getHexLookup(h, s, v) {
        const key = `${Math.round(h)}_${Math.round(s)}_${Math.round(v)}`;
        if (!this.HEX_LOOKUP.has(key)) {
            const color = this.calculateHSVToHex(h, s, v);
            this.HEX_LOOKUP.set(key, color);
        }
        return this.HEX_LOOKUP.get(key);
    }

    static calculateHSVToHex(h, s, v) {
        // Convert HSV to RGB, then to hex
        const c = v * s / 100;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        if (h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h < 240) {
            [r, g, b] = [0, x, c];
        } else if (h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    hsvToHex(h, s, v) {
        // Use cached color lookup for better performance
        return this.constructor.getHexLookup(h, s, v);
    }

    handleCCMapping(target, normalizedValue) {
        // Use unified parameter handler to eliminate code duplication
        this.handleParameterUpdate(target, normalizedValue, 'midi');
    }

    handleNoteMapping(target) {
        switch (target) {
            case 'shapeCycling':
                this.state.set('enableShapeCycling', !this.state.get('enableShapeCycling'));
                if (!this.state.get('enableShapeCycling')) {
                    this.animationLoop.resetAnimationTime();
                }
                break;
            case 'showGrid':
                this.state.set('showGrid', !this.state.get('showGrid'));
                this.scene.updateGridLines();
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
                this.scene.createGrid();
                break;
            case 'toggleTriangles':
                const enabledShapes2 = this.state.get('enabledShapes');
                enabledShapes2['Triangles'] = !enabledShapes2['Triangles'];
                this.state.set('enabledShapes', enabledShapes2);
                this.scene.createGrid();
                break;
            case 'toggleRectangles':
                const enabledShapes3 = this.state.get('enabledShapes');
                enabledShapes3['Rectangles'] = !enabledShapes3['Rectangles'];
                this.state.set('enabledShapes', enabledShapes3);
                this.scene.createGrid();
                break;
            case 'toggleEllipses':
                const enabledShapes4 = this.state.get('enabledShapes');
                enabledShapes4['Ellipses'] = !enabledShapes4['Ellipses'];
                this.state.set('enabledShapes', enabledShapes4);
                this.scene.createGrid();
                break;
            case 'toggleRefractiveSpheres':
                const enabledShapes5 = this.state.get('enabledShapes');
                enabledShapes5['Refractive Spheres'] = !enabledShapes5['Refractive Spheres'];
                this.state.set('enabledShapes', enabledShapes5);
                this.scene.createGrid();
                break;
            // Post-processing toggles
            case 'bloomEnabled':
                this.state.set('bloomEnabled', !this.state.get('bloomEnabled'));
                this.scene.updatePostProcessing();
                break;
            case 'chromaticAberrationEnabled':
                this.state.set('chromaticAberrationEnabled', !this.state.get('chromaticAberrationEnabled'));
                this.scene.updatePostProcessing();
                break;
            case 'vignetteEnabled':
                this.state.set('vignetteEnabled', !this.state.get('vignetteEnabled'));
                this.scene.updatePostProcessing();
                break;
            case 'grainEnabled':
                this.state.set('grainEnabled', !this.state.get('grainEnabled'));
                this.scene.updatePostProcessing();
                break;
            case 'colorGradingEnabled':
                this.state.set('colorGradingEnabled', !this.state.get('colorGradingEnabled'));
                this.scene.updatePostProcessing();
                break;
            case 'postProcessingEnabled':
                this.state.set('postProcessingEnabled', !this.state.get('postProcessingEnabled'));
                break;
            case 'fxaaEnabled':
                this.state.set('fxaaEnabled', !this.state.get('fxaaEnabled'));
                this.scene.updatePostProcessing();
                break;
            case 'enableFrustumCulling':
                this.state.set('enableFrustumCulling', !this.state.get('enableFrustumCulling'));
                break;
            case 'sphereWaterDistortion':
                this.state.set('sphereWaterDistortion', !this.state.get('sphereWaterDistortion'));
                this.scene.updateSphereMaterials();
                break;
            case 'centerScalingEnabled':
                this.state.set('centerScalingEnabled', !this.state.get('centerScalingEnabled'));
                this.scene.updateCenterScaling();
                break;

            case 'centerScalingAnimationSpeed':
                this.state.set('centerScalingAnimationSpeed', 0.1 + value * 3);
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

    handleKeyDown(event) {
        switch (event.key) {

            case '3':
                this.state.set('movementAmplitude', Math.min(0.5, this.state.get('movementAmplitude') + 0.05));
                break;
            case '4':
                this.state.set('movementAmplitude', Math.max(0, this.state.get('movementAmplitude') - 0.05));
                break;
            case '5':
                this.state.set('rotationAmplitude', Math.min(2, this.state.get('rotationAmplitude') + 0.1));
                break;
            case '6':
                this.state.set('rotationAmplitude', Math.max(0, this.state.get('rotationAmplitude') - 0.1));
                break;
            case '7':
                this.state.set('scaleAmplitude', Math.min(1, this.state.get('scaleAmplitude') + 0.05));
                break;
            case '8':
                this.state.set('scaleAmplitude', Math.max(0, this.state.get('scaleAmplitude') - 0.05));
                break;
            case 'a':
                this.state.set('enableMovementAnimation', !this.state.get('enableMovementAnimation'));
                break;
            case 'g':
                this.state.set('showGrid', !this.state.get('showGrid'));
                this.scene.updateGridLines();
                break;
            case 'r':
                this.state.set('randomness', Math.random());
                this.scene.createGrid();
                break;
            case 'R':
                // Reload default scene from JSON file
                this.state.reloadDefaultScene();
                break;
            case 'c':
                this.state.set('animationType', (this.state.get('animationType') + 1) % 4);
                break;
            case 't':
                // Test tap tempo functionality
                this.onMIDITempoTap();
                console.log('Tap tempo triggered via keyboard (T key)');
                break;
        }
    }

    onWindowResize() {
        this.scene.onWindowResize();
    }

    testCCValues() {
        const ccMappings = this.state.get('midiCCMappings');
        Object.keys(ccMappings).forEach(param => {
            const mapping = ccMappings[param];
            this.onMIDICC(mapping.cc, 64, mapping.channel);
        });
        
        const testButton = document.getElementById('mapping-test');
        if (testButton) {
            const originalText = testButton.textContent;
            testButton.textContent = 'Testing...';
            testButton.style.background = '#0f0';
            testButton.style.color = '#000';
            
            setTimeout(() => {
                testButton.textContent = originalText;
                testButton.style.background = '#444';
                testButton.style.color = '#fff';
            }, 1000);
        }
    }

    async loadAvailablePresets() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Cancel previous request
        if (this.abortControllers.has('presets')) {
            this.abortControllers.get('presets').abort();
        }
        
        const controller = new AbortController();
        this.abortControllers.set('presets', controller);
        
        try {
            // Try to load a list of available presets
            const response = await fetch('/presets/', { 
                signal: controller.signal 
            });
            if (response.ok) {
                const text = await response.text();
                // Parse the directory listing to find .json files
                const presetFiles = text.match(/href="([^"]+\.json)"/g);
                if (presetFiles) {
                    const presets = presetFiles.map(file => {
                        const match = file.match(/href="([^"]+\.json)"/);
                        return match ? match[1].replace('.json', '') : null;
                    }).filter(Boolean);
                    
                    this.updatePresetDropdown(presets);
                    return;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Cancelled
            }
            // Could not load preset list, trying individual preset discovery
        }
        
        // Fallback: Try to discover presets by attempting to load them
        const knownPresets = [
            'sample-multi-channel',
            'essential-controls',
            'animation-movement',
            'visual-effects',
            'lighting-materials',
            'grid-composition',
            'shape-controls',
            'morphing-transitions'
        ];
        
        const availablePresets = [];
        
        // Try to load each preset to see if it exists
        for (const preset of knownPresets) {
            try {
                const response = await fetch(`/presets/${preset}.json`, { 
                    signal: controller.signal 
                });
                if (response.ok) {
                    const presetData = await response.json();
                    if (this.validatePreset(presetData)) {
                        availablePresets.push(preset);
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return; // Cancelled
                }
                // Preset not found or invalid
            }
        }
        
        this.updatePresetDropdown(availablePresets);
        
        // Cleanup abort controller
        this.abortControllers.delete('presets');
    }

    async loadAvailableScenePresets() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use the proper discovery method that prioritizes index.json
        await this.discoverScenePresets();
    }

    async discoverScenePresets() {
        // Cancel previous request
        if (this.abortControllers.has('scene-discovery')) {
            this.abortControllers.get('scene-discovery').abort();
        }
        
        const controller = new AbortController();
        this.abortControllers.set('scene-discovery', controller);
        
        try {
            // First, try to load the index file which contains all available scenes
            const indexResponse = await fetch('/scenes/index.json', {
                signal: controller.signal
            });
            
            if (indexResponse.ok) {
                const indexData = await indexResponse.json();
                
                if (indexData.scenes && Array.isArray(indexData.scenes)) {
                    await this.validateAndUpdateScenePresets(indexData.scenes);
                    return;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Cancelled
            }
            // Scene index not available, trying directory listing
        }
        
        // Try to get a proper directory listing
        try {
            const response = await fetch('/scenes/', {
                signal: controller.signal
            });
            if (response.ok) {
                const text = await response.text();
                
                // Try multiple patterns to extract filenames from directory listing
                const patterns = [
                    /href="([^"]+\.json)"/g,           // Standard href pattern
                    /<a[^>]*>([^<]+\.json)<\/a>/g,    // Link text pattern
                    /([a-zA-Z0-9_-]+\.json)/g,         // Any .json filename
                    /"([^"]+\.json)"/g,                // Quoted filename pattern
                ];
                
                let foundFiles = [];
                
                for (const pattern of patterns) {
                    const matches = text.match(pattern);
                    if (matches) {
                        foundFiles = matches.map(match => {
                            // Extract just the filename without .json extension
                            const filename = match.replace(/href="|"|<a[^>]*>|<\/a>/g, '').replace('.json', '');
                            return filename;
                        }).filter(name => name.length > 0);
                        
                        if (foundFiles.length > 0) {
                            await this.validateAndUpdateScenePresets(foundFiles);
                            return;
                        }
                    }
                }
                
                // Alternative: try to parse the HTML structure
                const lines = text.split('\n');
                const jsonFiles = [];
                
                for (const line of lines) {
                    if (line.includes('.json')) {
                        // Extract filename from various HTML patterns
                        const filenameMatch = line.match(/([a-zA-Z0-9_-]+)\.json/);
                        if (filenameMatch) {
                            jsonFiles.push(filenameMatch[1]);
                        }
                    }
                }
                
                if (jsonFiles.length > 0) {
                    await this.validateAndUpdateScenePresets(jsonFiles);
                    return;
                }
            }
        } catch (error) {
            // Directory listing failed
        }
        
        // Fallback: try a systematic approach to find any .json files
        await this.systematicSceneDiscovery();
        
        // Cleanup abort controller
        this.abortControllers.delete('scene-discovery');
    }

    async systematicSceneDiscovery() {
        // Cancel previous request
        if (this.abortControllers.has('systematic-discovery')) {
            this.abortControllers.get('systematic-discovery').abort();
        }
        
        const controller = new AbortController();
        this.abortControllers.set('systematic-discovery', controller);
        
        try {
            // This is a more intelligent approach that tries to discover files
            // by attempting common patterns and learning from successful finds
            
            const foundPresets = [];
            const triedNames = new Set();
            
            // First, try the known existing files
            const knownFiles = ['ambient-dream', 'cyberpunk-night', 'minimalist-zen', 'mirage', 'meat'];
            for (const name of knownFiles) {
                triedNames.add(name);
                try {
                    const response = await fetch(`/scenes/${name}.json`, {
                        signal: controller.signal
                    });
                    if (response.ok) {
                        const sceneData = await response.json();
                        if (this.validateScenePreset(sceneData)) {
                            foundPresets.push(name);
                        }
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return; // Cancelled
                    }
                    // Silently continue
                }
            }
            
            // Try single letters (a-z)
            for (let i = 0; i < 26; i++) {
                const letter = String.fromCharCode(97 + i);
                triedNames.add(letter);
                try {
                    const response = await fetch(`/scenes/${letter}.json`, {
                        signal: controller.signal
                    });
                    if (response.ok) {
                        const sceneData = await response.json();
                        if (this.validateScenePreset(sceneData)) {
                            foundPresets.push(letter);
                        }
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return; // Cancelled
                    }
                    // Silently continue
                }
            }
            
            // Try common short names
            const shortNames = [
                'test', 'demo', 'new', 'old', 'temp', 'backup', 'copy', 'final', 'draft',
                'work', 'play', 'fun', 'run', 'walk', 'jump', 'fly', 'swim', 'dance',
                'red', 'blue', 'green', 'fire', 'water', 'earth', 'air', 'light', 'dark',
                'sun', 'moon', 'star', 'tree', 'rock', 'bird', 'fish', 'cat', 'dog',
                'car', 'bus', 'train', 'plane', 'boat', 'bike', 'road', 'path', 'door',
                'book', 'page', 'word', 'line', 'dot', 'spot', 'mark', 'sign', 'note'
            ];
            
            for (const name of shortNames) {
                if (!triedNames.has(name)) {
                    triedNames.add(name);
                    try {
                        const response = await fetch(`/scenes/${name}.json`, {
                            signal: controller.signal
                        });
                        if (response.ok) {
                            const sceneData = await response.json();
                            if (this.validateScenePreset(sceneData)) {
                                foundPresets.push(name);
                            }
                        }
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            return; // Cancelled
                        }
                        // Silently continue
                    }
                }
            }
            
            this.updateScenePresetDropdown(foundPresets);
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Cancelled
            }
            console.error('Systematic scene discovery failed:', error);
        } finally {
            // Cleanup abort controller
            this.abortControllers.delete('systematic-discovery');
        }
    }

    async validateAndUpdateScenePresets(sceneNames) {
        // Cancel previous request
        if (this.abortControllers.has('scene-validation')) {
            this.abortControllers.get('scene-validation').abort();
        }
        
        const controller = new AbortController();
        this.abortControllers.set('scene-validation', controller);
        
        try {
            const validScenePresets = [];
            
            for (const sceneName of sceneNames) {
                try {
                    const response = await fetch(`/scenes/${sceneName}.json`, {
                        signal: controller.signal
                    });
                    
                    if (response.ok) {
                        const sceneData = await response.json();
                        
                        if (this.validateScenePreset(sceneData)) {
                            validScenePresets.push(sceneName);
                        }
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return; // Cancelled
                    }
                    // Error validating scene preset
                }
            }
            
            this.updateScenePresetDropdown(validScenePresets);
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Cancelled
            }
            console.error('Scene validation failed:', error);
        } finally {
            // Cleanup abort controller
            this.abortControllers.delete('scene-validation');
        }
    }

    updatePresetDropdown(availablePresets) {
        const select = document.getElementById('midi-preset-select');
        if (!select) return;
        
        // Keep the "Custom" option
        const customOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (customOption) {
            select.appendChild(customOption);
        }
        
        // Phase 4.2: Array Operation Optimization - Replace forEach with for...of
        // Add available presets
        for (const preset of availablePresets) {
            const option = document.createElement('option');
            option.value = preset;
            option.textContent = this.getPresetDisplayName(preset);
            select.appendChild(option);
        }
    }

    async updateScenePresetDropdown(availableScenePresets) {
        const select = document.getElementById('scene-preset-select');
        if (!select) return;
        
        // Keep the "Custom" option
        const customOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (customOption) {
            select.appendChild(customOption);
        }
        
        // Add available scene presets with async display name resolution
        for (const scenePreset of availableScenePresets) {
            const option = document.createElement('option');
            option.value = scenePreset;
            
            try {
                const displayName = await this.getScenePresetDisplayNameFromFile(scenePreset);
                option.textContent = displayName;
            } catch (error) {
                // Fallback to formatted name
                option.textContent = this.formatScenePresetName(scenePreset);
            }
            
            select.appendChild(option);
        }
    }

    getPresetDisplayName(presetName) {
        const displayNames = {
            'sample-multi-channel': 'Sample Multi-Channel',
            'essential-controls': 'Essential Controls',
            'animation-movement': 'Animation & Movement',
            'visual-effects': 'Visual Effects',
            'lighting-materials': 'Lighting & Materials',
            'grid-composition': 'Grid & Composition',
            'shape-controls': 'Shape Controls',
            'morphing-transitions': 'Morphing & Transitions'
        };
        return displayNames[presetName] || presetName;
    }

    updateControlUI(control, mapping) {
        // Update the control's UI elements directly
        const channelInput = document.getElementById(`midi-${control.controlId}-channel`);
        const valueInput = document.getElementById(`midi-${control.controlId}-value`);
        const targetSelect = document.getElementById(`midi-${control.controlId}-target`);
        
        if (channelInput) channelInput.value = mapping.channel + 1;
        if (valueInput) valueInput.value = mapping.value;
        if (targetSelect) targetSelect.value = mapping.target;
        
        // Also update the control's internal mapping
        control.updateMapping(mapping);
    }

    async applyCCPreset(presetName) {
        if (!presetName) {
            // Clear mappings for "Custom" option
            this.state.set('midiCCMappings', {});
            this.state.set('midiNoteMappings', {});
            this.recreateControlsFromPreset();
            return;
        }

        // Cancel previous request
        if (this.abortControllers.has('preset-load')) {
            this.abortControllers.get('preset-load').abort();
        }
        
        const controller = new AbortController();
        this.abortControllers.set('preset-load', controller);

        try {
            // Load the preset file from the presets folder
            const response = await fetch(`/presets/${presetName}.json`, {
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Failed to load preset: ${response.statusText}`);
            }
            
            const preset = await response.json();
            
            if (this.validatePreset(preset)) {
                this.applyPreset(preset);
            } else {
                console.error('Invalid preset format:', preset);
                alert('Invalid preset file format. Please check the file structure.');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Cancelled
            }
            console.error('Failed to load preset:', error);
            alert(`Failed to load preset "${presetName}". Please check if the preset file exists.`);
        } finally {
            // Cleanup abort controller
            this.abortControllers.delete('preset-load');
        }
    }

    savePreset() {
        const ccMappings = this.state.get('midiCCMappings') || {};
        const noteMappings = this.state.get('midiNoteMappings') || {};
        const audioMappings = this.state.get('audioMappings') || {};
        
        const preset = {
            version: '1.0',
            timestamp: Date.now(),
            midiCCMappings: ccMappings,
            midiNoteMappings: noteMappings,
            audioMappings: audioMappings
        };
        
        const dataStr = JSON.stringify(preset, null, 2);
        
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `rglr-control-preset-${Date.now()}.json`;
        link.click();
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }

    loadPreset(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const preset = JSON.parse(e.target.result);
                
                // Handle both old and new preset formats for backward compatibility
                if (preset.mappings && preset.noteMappings) {
                    // Old format - convert to new format
                    const newPreset = {
                        midiCCMappings: preset.mappings,
                        midiNoteMappings: preset.noteMappings,
                        audioMappings: {}
                    };
                    this.applyPreset(newPreset);
                } else if (this.validatePreset(preset)) {
                    // New format (current state format)
                    this.applyPreset(preset);
                } else if (preset.midiCCMappings && preset.midiNoteMappings) {
                    // Format without audio mappings - add empty audio mappings
                    const newPreset = {
                        ...preset,
                        audioMappings: preset.audioMappings || {}
                    };
                    this.applyPreset(newPreset);
                } else {
                    console.error('Invalid preset format:', preset);
                    alert('Invalid preset file format. Please check the file structure.');
                    return;
                }
            } catch (error) {
                console.error('Failed to load preset:', error);
                alert('Failed to load preset file. Please check if the file is a valid JSON preset.');
            }
        };
        reader.onerror = () => {
            console.error('File reading error');
            alert('Failed to read the preset file.');
        };
        reader.readAsText(file);
    }

    validatePreset(preset) {
        return preset && 
               typeof preset === 'object' &&
               preset.midiCCMappings &&
               preset.midiNoteMappings &&
               (typeof preset.midiCCMappings === 'object') &&
               (typeof preset.midiNoteMappings === 'object') &&
               (preset.audioMappings === undefined || typeof preset.audioMappings === 'object');
    }

    applyPreset(preset) {
        if (preset.midiCCMappings) {
            this.state.set('midiCCMappings', preset.midiCCMappings);
        }
        if (preset.midiNoteMappings) {
            this.state.set('midiNoteMappings', preset.midiNoteMappings);
        }
        if (preset.audioMappings) {
            this.state.set('audioMappings', preset.audioMappings);
        }
        
        // Pass the preset data directly to recreateControlsFromPreset
        this.recreateControlsFromPreset(preset);
    }

    recreateControlsFromPreset(preset = null) {
        if (!this.controlManager) return;
        
        console.log('Recreating controls from preset:', preset);
        
        // Clear existing controls
        this.controlManager.clearAllControls();
        
        // Phase 4.2: Array Operation Optimization - Replace forEach with for...of
        // Recreate CC controls
        const ccMappings = preset ? preset.midiCCMappings : this.state.get('midiCCMappings');
        console.log('CC mappings to recreate:', ccMappings);
        if (ccMappings && typeof ccMappings === 'object') {
            for (const [controlId, mapping] of Object.entries(ccMappings)) {
                console.log('Creating CC control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "cc1" -> 1)
                const indexMatch = controlId.match(/cc(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : 1;
                console.log('Creating control with index:', controlIndex);
                
                const control = this.controlManager.addControl('cc', controlIndex);
                if (control) {
                    console.log('Control created successfully, updating UI...');
                    
                    // Update the control's UI elements directly
                    this.updateControlUI(control, {
                        channel: mapping.channel,
                        value: mapping.value,
                        target: mapping.target
                    });
                    
                    console.log('UI updated for control:', control.controlId);
                } else {
                    console.error('Failed to create control for:', controlId);
                }
            }
        }
        
        // Recreate Note controls
        const noteMappings = preset ? preset.midiNoteMappings : this.state.get('midiNoteMappings');
        console.log('Note mappings to recreate:', noteMappings);
        if (noteMappings && typeof noteMappings === 'object') {
            for (const [controlId, mapping] of Object.entries(noteMappings)) {
                console.log('Creating Note control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "note1" -> 1)
                const indexMatch = controlId.match(/note(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : 1;
                console.log('Creating note control with index:', controlIndex);
                
                const control = this.controlManager.addControl('note', controlIndex);
                if (control) {
                    console.log('Note control created successfully, updating UI...');
                    
                    // Update the control's UI elements directly
                    this.updateControlUI(control, {
                        channel: mapping.channel,
                        value: mapping.note,
                        target: mapping.target
                    });
                    
                    console.log('Note UI updated for control:', control.controlId);
                } else {
                    console.error('Failed to create note control for:', controlId);
                }
            }
        }
        
        // Recreate Audio Mapping controls
        const audioMappings = preset ? preset.audioMappings : this.state.get('audioMappings');
        console.log('Audio mappings to recreate:', audioMappings);
        if (audioMappings && typeof audioMappings === 'object') {
            // Clear existing audio mapping controls
            if (this.audioMappingManager) {
                this.audioMappingManager.clearAllControls();
            }
            
            for (const [controlId, mapping] of Object.entries(audioMappings)) {
                console.log('Creating Audio control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "audio1" -> 1)
                const indexMatch = controlId.match(/audio(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : 1;
                console.log('Creating audio control with index:', controlIndex);
                
                if (this.audioMappingManager) {
                    const control = this.audioMappingManager.addControl('frequency', controlIndex);
                    if (control) {
                        console.log('Audio control created successfully, updating mapping...');
                        
                        // Update the control's mapping
                        control.setMapping(mapping);
                        
                        console.log('Audio mapping updated for control:', control.controlId);
                    } else {
                        console.error('Failed to create audio control for:', controlId);
                    }
                }
            }
        }
        
        console.log('Finished recreating controls');
        console.log('Final CC mappings in state:', this.state.get('midiCCMappings'));
        console.log('Final Note mappings in state:', this.state.get('midiNoteMappings'));
        console.log('Final Audio mappings in state:', this.state.get('audioMappings'));
    }
    
    // Simple scene management methods
    saveScene() {
        try {
            const sceneData = this.state.exportScene();
            sceneData.name = 'Visual Settings';
            sceneData.timestamp = new Date().toISOString();
            
            // Create and download file (like MIDI preset system)
            const dataStr = JSON.stringify(sceneData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `rglr-visual-settings-${Date.now()}.json`;
            link.click();
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
            
            alert('Visual settings downloaded successfully!');
        } catch (error) {
            console.error('Error saving scene:', error);
            alert('Error saving scene. Please try again.');
        }
    }
    
    loadScene() {
        // Trigger file input for loading scene file
        document.getElementById('preset-file-input').click();
    }
    
    loadSceneFile(sceneData) {
        try {
            // Get interpolation duration from UI
            const interpolationDurationInput = document.getElementById('interpolation-duration');
            const duration = interpolationDurationInput ? parseFloat(interpolationDurationInput.value) : 2.0;
            
            // Get interpolation easing from UI
            const interpolationEasingSelect = document.getElementById('interpolation-easing');
            const easing = interpolationEasingSelect ? interpolationEasingSelect.value : 'power2.inOut';
            
            const success = this.state.importSceneWithInterpolation(sceneData, duration, easing);
            
            if (!success) {
                console.error('Error loading scene. Please check the file format.');
            }
        } catch (error) {
            console.error('Error loading scene file:', error);
            alert('Error loading scene file. Please check the file format.');
        }
    }

    async applyScenePreset(presetName) {
        if (!presetName) {
            return;
        }

        // Cancel previous request
        if (this.abortControllers.has('scene-preset-load')) {
            this.abortControllers.get('scene-preset-load').abort();
        }
        
        const controller = new AbortController();
        this.abortControllers.set('scene-preset-load', controller);

        try {
            // Try to load the scene preset
            const response = await fetch(`/scenes/${presetName}.json`, {
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Failed to load scene preset: ${response.statusText}`);
            }
            
            const sceneData = await response.json();
            
            // Validate the scene data
            if (!this.validateScenePreset(sceneData)) {
                throw new Error('Invalid scene preset format');
            }
            
            // Get interpolation duration from UI
            const interpolationDurationInput = document.getElementById('interpolation-duration');
            const duration = interpolationDurationInput ? parseFloat(interpolationDurationInput.value) : 2.0;
            
            // Get interpolation easing from UI
            const interpolationEasingSelect = document.getElementById('interpolation-easing');
            const easing = interpolationEasingSelect ? interpolationEasingSelect.value : 'power2.inOut';
            
            // Apply the scene preset with interpolation
            const success = this.state.importSceneWithInterpolation(sceneData, duration, easing);
            
            if (success) {
                await this.showScenePresetFeedback(presetName);
            } else {
                throw new Error('Failed to apply scene preset');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Cancelled
            }
            console.error('Error applying scene preset:', error);
            alert(`Error loading scene preset: ${error.message}`);
        } finally {
            // Cleanup abort controller
            this.abortControllers.delete('scene-preset-load');
        }
    }

    validateScenePreset(sceneData) {
        // Check if the scene data has the required structure
        if (!sceneData || typeof sceneData !== 'object') {
            return false;
        }
        
        if (!sceneData.settings || typeof sceneData.settings !== 'object') {
            return false;
        }
        
        // Check for some essential settings that actually exist in the scene files
        const requiredSettings = ['movementAmplitude', 'gridWidth', 'gridHeight'];
        for (const setting of requiredSettings) {
            if (typeof sceneData.settings[setting] === 'undefined') {
                return false;
            }
        }
        
        return true;
    }

    async showScenePresetFeedback(presetName) {
        // Get the display name
        const displayName = await this.getScenePresetDisplayName(presetName);
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transform transition-all duration-300';
        notification.textContent = `Scene preset "${displayName}" applied`;
        
        document.body.appendChild(notification);
        
        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    getScenePresetDisplayName(presetName) {
        // Try to get the display name from the scene file itself
        return this.getScenePresetDisplayNameFromFile(presetName).catch(() => {
            // Fallback to formatting the filename
            return this.formatScenePresetName(presetName);
        });
    }

    async getScenePresetDisplayNameFromFile(presetName) {
        // Cancel previous request
        if (this.abortControllers.has('display-name-load')) {
            this.abortControllers.get('display-name-load').abort();
        }
        
        const controller = new AbortController();
        this.abortControllers.set('display-name-load', controller);
        
        try {
            const response = await fetch(`/scenes/${presetName}.json`, {
                signal: controller.signal
            });
            if (response.ok) {
                const sceneData = await response.json();
                if (sceneData.name) {
                    return sceneData.name;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return this.formatScenePresetName(presetName); // Return fallback on cancel
            }
            // Fall back to formatting the filename
        } finally {
            // Cleanup abort controller
            this.abortControllers.delete('display-name-load');
        }
        
        return this.formatScenePresetName(presetName);
    }

    formatScenePresetName(presetName) {
        // Convert filename to display name
        // e.g., "ambient-dream" -> "Ambient Dream"
        // e.g., "scene1" -> "Scene 1"
        // e.g., "a" -> "A"
        
        if (presetName.startsWith('scene')) {
            const number = presetName.replace('scene', '');
            return `Scene ${number}`;
        }
        
        if (presetName.length === 1 && /[a-z]/.test(presetName)) {
            return presetName.toUpperCase();
        }
        
        // Convert kebab-case to Title Case
        return presetName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    addCCControl() {
        if (!this.controlManager) return;
        
        const nextIndex = this.controlManager.getNextControlIndex('cc');
        const control = this.controlManager.addControl('cc', nextIndex);
        
        if (control) {
            // Add to state
            const ccMappings = this.state.get('midiCCMappings');
            ccMappings[control.controlId] = {
                channel: 0,
                cc: nextIndex,
                target: 'movementAmplitude'
            };
            this.state.set('midiCCMappings', ccMappings);
        }
    }

    addNoteControl() {
        if (!this.controlManager) return;
        
        const nextIndex = this.controlManager.getNextControlIndex('note');
        const control = this.controlManager.addControl('note', nextIndex);
        
        if (control) {
            // Add to state with morphing targets as defaults
            const noteMappings = this.state.get('midiNoteMappings');
            const morphingTargets = ['randomMorph', 'morphAllShapes', 'morphAllToSame', 'morphAllSimultaneously', 'morphAllToSameSimultaneously'];
            const defaultTarget = morphingTargets[nextIndex % morphingTargets.length];
            
            noteMappings[control.controlId] = {
                channel: 0,
                note: 60 + nextIndex,
                target: defaultTarget
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

    updateAnimationParameter(target, value) {
        // Use unified parameter handler to eliminate code duplication
        this.handleParameterUpdate(target, value, 'animation');
    }

    triggerNoteAction(target) {
        this.handleNoteMapping(target);
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
        const divisionMap = {
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
            '8bars',   // 0-12: 8 bars (slowest)
            '4bars',   // 13-25: 4 bars
            '2bars',   // 26-38: 2 bars
            '1bar',    // 39-51: 1 bar
            'whole',   // 52-64: whole notes
            'half',    // 65-77: half notes
            'quarter', // 78-90: quarter notes
            '8th',     // 91-103: 8th notes
            '16th',    // 104-116: 16th notes
            '32nd'     // 117-127: 32nd notes (fastest)
        ];
        
        // Map index to division with inverted distribution
        if (index <= 12) return '8bars';
        if (index <= 25) return '4bars';
        if (index <= 38) return '2bars';
        if (index <= 51) return '1bar';
        if (index <= 64) return 'whole';
        if (index <= 77) return 'half';
        if (index <= 90) return 'quarter';
        if (index <= 103) return '8th';
        if (index <= 116) return '16th';
        return '32nd';
    }

    // Phase 2.1: Consolidated morphing logic with caching
    getMorphingState() {
        const now = Date.now();
        
        // Return cached state if valid (cache for 1 second)
        if (this.morphingStateCache?.cacheValid && 
            now - this.morphingStateCache.lastUpdate < 1000) {
            return this.morphingStateCache;
        }
        
        if (!this.scene || this.scene.shapes.length === 0) {
            return null;
        }
        
        // Get morphable shapes (shapes with ShapeGeometry)
        const morphableShapes = this.scene.shapes.filter(shape => 
            shape.geometry && shape.geometry.type === 'ShapeGeometry'
        );
        
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
        
        // Use for...of for better performance with large arrays
        for (const [pairName, [shape1, shape2]] of Object.entries(allMorphablePairs)) {
            if (availableShapes.includes(shape1) && availableShapes.includes(shape2)) {
                filteredPairs[pairName] = [shape1, shape2];
            }
        }
        
        const pairNames = Object.keys(filteredPairs);
        
        if (pairNames.length === 0) {
            return null;
        }
        
        // Cache the results
        this.morphingStateCache = {
            morphableShapes,
            availableShapes,
            filteredPairs,
            pairNames,
            lastUpdate: now,
            cacheValid: true
        };
        
        return this.morphingStateCache;
    }

    triggerRandomMorph() {
        const morphingState = this.getMorphingState();
        if (!morphingState) return;
        
        const { morphableShapes, filteredPairs, pairNames } = morphingState;
        const randomShape = morphableShapes[Math.floor(Math.random() * morphableShapes.length)];
        const randomPair = filteredPairs[pairNames[Math.floor(Math.random() * pairNames.length)]];
        
        this.scene.shapeGenerator.startShapeMorph(randomShape, randomPair[0], randomPair[1], this.getMorphingDuration());
    }

    triggerMorphAllShapes() {
        const morphingState = this.getMorphingState();
        if (!morphingState) return;
        
        const { morphableShapes, filteredPairs, pairNames } = morphingState;
        
        // Get morphing division timing for the entire sequence
        const morphingDivision = this.state.get('morphingDivision') || 'quarter';
        const globalBPM = this.state.get('globalBPM') || 120;
        const divisionBeats = this.getDivisionBeats(morphingDivision);
        const secondsPerBeat = 60 / globalBPM;
        const totalSequenceTime = divisionBeats * secondsPerBeat;
        
        // Calculate delay per shape to distribute evenly across the musical division
        const delayPerShape = (totalSequenceTime * 1000) / Math.max(morphableShapes.length - 1, 1);
        
        console.log(`Morph All Shapes: Using ${morphingDivision} division (${totalSequenceTime.toFixed(2)}s total, ${delayPerShape.toFixed(1)}ms delay per shape for ${morphableShapes.length} shapes)`);
        
        // Use for...of for better performance
        for (let i = 0; i < morphableShapes.length; i++) {
            setTimeout(() => {
                const randomPair = filteredPairs[pairNames[Math.floor(Math.random() * pairNames.length)]];
                this.scene.shapeGenerator.startShapeMorph(morphableShapes[i], randomPair[0], randomPair[1], this.getMorphingDuration());
            }, i * delayPerShape);
        }
    }

    triggerMorphAllToSame() {
        const morphingState = this.getMorphingState();
        if (!morphingState) return;
        
        const { morphableShapes, availableShapes } = morphingState;
        const targetShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        
        // Get morphing division timing for the entire sequence
        const morphingDivision = this.state.get('morphingDivision') || 'quarter';
        const globalBPM = this.state.get('globalBPM') || 120;
        const divisionBeats = this.getDivisionBeats(morphingDivision);
        const secondsPerBeat = 60 / globalBPM;
        const totalSequenceTime = divisionBeats * secondsPerBeat;
        
        // Calculate delay per shape to distribute evenly across the musical division
        const delayPerShape = (totalSequenceTime * 1000) / Math.max(morphableShapes.length - 1, 1);
        
        console.log(`Morph All to Same: Using ${morphingDivision} division (${totalSequenceTime.toFixed(2)}s total, ${delayPerShape.toFixed(1)}ms delay per shape for ${morphableShapes.length} shapes)`);
        
        // Use for...of for better performance
        for (let i = 0; i < morphableShapes.length; i++) {
            setTimeout(() => {
                const currentShapeName = morphableShapes[i].userData.shapeName || 'triangle_UP';
                this.scene.shapeGenerator.startShapeMorph(morphableShapes[i], currentShapeName, targetShape, this.getMorphingDuration());
            }, i * delayPerShape);
        }
    }

    triggerMorphAllToSameSimultaneously() {
        const morphingState = this.getMorphingState();
        if (!morphingState) return;
        
        const { morphableShapes, availableShapes } = morphingState;
        const targetShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        
        // Morph all shapes to the same target simultaneously (no staggered timing)
        for (const shape of morphableShapes) {
            const currentShapeName = shape.userData.shapeName || 'triangle_UP';
            this.scene.shapeGenerator.startShapeMorph(shape, currentShapeName, targetShape, this.getMorphingDuration());
        }
    }

    triggerMorphAllSimultaneously() {
        const morphingState = this.getMorphingState();
        if (!morphingState) return;
        
        const { morphableShapes, filteredPairs, pairNames } = morphingState;
        
        // Morph all shapes simultaneously with random pairs
        for (const shape of morphableShapes) {
            const randomPair = filteredPairs[pairNames[Math.floor(Math.random() * pairNames.length)]];
            this.scene.shapeGenerator.startShapeMorph(shape, randomPair[0], randomPair[1], this.getMorphingDuration());
        }
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
        const interfaceSelect = document.getElementById('audio-interface-select');
        const channelsContainer = document.getElementById('audio-channels-container');
        const connectButton = document.getElementById('audio-connect');
        const disconnectButton = document.getElementById('audio-disconnect');
        const refreshButton = document.getElementById('audio-refresh-interfaces');
        const statusIndicator = document.getElementById('audio-status-indicator');
        const statusText = document.getElementById('audio-status-text');
        
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
        
        // Event listeners
        interfaceSelect.addEventListener('change', (e) => {
            const interfaceId = e.target.value;
            const interfaces = this.audioManager.getAvailableInterfaces();
            const selectedInterface = interfaces.find(i => i.id === interfaceId);
            
            if (selectedInterface) {
                this.audioManager.selectInterface(selectedInterface);
                this.updateAudioChannelsDisplay();
            }
        });
        
        connectButton.addEventListener('click', async () => {
            try {
                await this.audioManager.startAudioCapture();
                this.updateAudioStatus();
            } catch (error) {
                console.error('Failed to connect audio:', error);
                alert('Failed to connect audio interface. Please check permissions and try again.');
            }
        });
        
        disconnectButton.addEventListener('click', () => {
            this.audioManager.stopAudioCapture();
            this.updateAudioStatus();
        });
        
        refreshButton.addEventListener('click', async () => {
            await this.audioManager.refreshInterfaces();
            this.updateAudioInterfaceDropdown();
            this.updateAudioChannelsDisplay();
        });
        
        // Phase 2.2: Optimized state subscriptions with debouncing
        // Single debounced update for all audio values
        this.debouncedAudioUpdate = this.debounce(() => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        }, 16); // ~60fps
        
        // Single subscription for all audio values
        const audioValues = ['audioOverall', 'audioRMS', 'audioPeak', 'audioFrequency'];
        audioValues.forEach(key => {
            this.state.subscribe(key, () => {
                this.debouncedAudioUpdate();
            });
        });
        
        // Optimized status subscriptions
        this.state.subscribe('audioListening', () => {
            this.updateAudioStatus();
            // Update drawer connection status if a mapping drawer is open
            if (this.currentDrawer) {
                this.checkDrawerConnectionStatus(this.currentDrawer);
            }
        });
        this.state.subscribe('audioAvailable', () => this.updateAudioStatus());
        
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
} 