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
import { VideoRecorder } from '../modules/VideoRecorder.js';
import { AudioManager } from '../modules/AudioManager.js';
import { MIDIClockManager } from './MIDIClockManager.js';
import { TransportController } from './TransportController.js';
import { TransportUI } from '../ui/TransportUI.js';

export class App {
    constructor() {
        this.state = new StateManager();
        this.scene = new Scene(this.state);
        this.animationLoop = new AnimationLoop(this.scene, this.state);
        this.midiManager = new MIDIManager(this);
        this.controlManager = null;
        this.guiManager = null;
        
        // Initialize transport and timing systems
        this.midiClockManager = new MIDIClockManager(this);
        this.transportController = new TransportController(this);
        this.transportUI = null; // Will be initialized after DOM is ready
        
        // Initialize morphing system
        this.morphingSystem = new ShapeMorphingSystem();
        
        // Initialize video recorder
        this.videoRecorder = new VideoRecorder(this);
        
        // Initialize audio manager
        this.audioManager = new AudioManager(this.state);
        
        this.init();
    }

    async init() {
        try {
            // Initialize state manager first
            await this.state.initialize();
            
            // Initialize audio manager
            await this.audioManager.initialize();
            
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
                    this.initializeTransportUI();
                    this.loadAvailablePresets();
                    this.loadAvailableScenePresets();
                });
            } else {
                this.initializeControlManager();
                this.initializeAudioMappingManager();
                this.initializeTransportUI();
                this.loadAvailablePresets();
                this.loadAvailableScenePresets();
            }
            
            // Start animation loop
            this.animationLoop.start();
            
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
        
        // Set up MIDI UI event listeners
        document.getElementById('midi-connect').addEventListener('click', () => {
            this.midiManager.connect();
        });
        
        document.getElementById('midi-disconnect').addEventListener('click', () => {
            this.midiManager.disconnect();
        });
        
        // Set up audio interface UI event listeners
        this.setupAudioInterfaceUI();

        const refreshButton = document.getElementById('midi-refresh');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.midiManager.refreshDevices();
            });
        }

        const helpButton = document.getElementById('midi-help');
        if (helpButton) {
            helpButton.addEventListener('click', () => {
                window.open('midi-help.html', '_blank');
            });
        }
        
        // Test CC values button
        document.getElementById('test-cc-button').addEventListener('click', () => {
            this.testCCValues();
        });
        
        // Preset selector
        document.getElementById('midi-preset-select').addEventListener('change', (e) => {
            this.applyCCPreset(e.target.value);
        });
        
        // Scene preset selector
        document.getElementById('scene-preset-select').addEventListener('change', (e) => {
            this.applyScenePreset(e.target.value);
        });
        
        // Save preset button
        document.getElementById('save-preset-button').addEventListener('click', () => {
            this.savePreset();
        });
        
        // Load preset button
        document.getElementById('load-preset-button').addEventListener('click', () => {
            document.getElementById('preset-file-input').click();
        });
        
        // File input for loading presets and scenes
        document.getElementById('preset-file-input').addEventListener('change', (e) => {
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
        document.getElementById('add-cc-control').addEventListener('click', () => {
            this.addCCControl();
        });
        
        document.getElementById('add-note-control').addEventListener('click', () => {
            this.addNoteControl();
        });
        
        document.getElementById('add-audio-mapping-control').addEventListener('click', () => {
            this.addAudioMappingControl();
        });
        
        // Audio mapping test button
        document.getElementById('audio-mapping-test').addEventListener('click', () => {
            this.testAudioMapping();
        });
        
        // Scene management buttons
        document.getElementById('save-scene-button').addEventListener('click', () => {
            this.saveScene();
        });
        
        document.getElementById('load-scene-button').addEventListener('click', () => {
            document.getElementById('preset-file-input').click();
        });
        

        
        // Interpolation duration slider
        const interpolationDurationInput = document.getElementById('interpolation-duration');
        const interpolationDurationValue = document.getElementById('interpolation-duration-value');
        
        if (interpolationDurationInput && interpolationDurationValue) {
            interpolationDurationInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                interpolationDurationValue.textContent = `${value.toFixed(1)}s`;
                this.state.set('interpolationDuration', value);
            });
        }
        
        // Interpolation easing selector
        const interpolationEasingSelect = document.getElementById('interpolation-easing');
        if (interpolationEasingSelect) {
            interpolationEasingSelect.addEventListener('change', (e) => {
                this.state.set('interpolationEasing', e.target.value);
            });
        }
        
        // Debug interpolation button
        const debugInterpolationButton = document.getElementById('debug-interpolation');
        if (debugInterpolationButton) {
            debugInterpolationButton.addEventListener('click', () => {
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
        
        // Ensure drawer is hidden initially
        this.hideDrawerContainer();
        
        // Set up drawer button event listeners
        const drawerButtons = [
            'drawer-connection',
            'drawer-audio-interface',
            'drawer-cc-mapping',
            'drawer-note-controls',
            'drawer-scene-management',
            'drawer-audio-mapping'
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
            
            // Add specific class for connection drawer positioning
            if (drawerName === 'connection') {
                this.drawerContainer.classList.add('connection-drawer');
                this.drawerContainer.classList.remove('audio-interface-drawer');
            } else if (drawerName === 'audio-interface') {
                this.drawerContainer.classList.add('audio-interface-drawer');
                this.drawerContainer.classList.remove('connection-drawer');
            } else {
                this.drawerContainer.classList.remove('connection-drawer');
                this.drawerContainer.classList.remove('audio-interface-drawer');
            }
        }
        
        // Remove hidden class when opening drawer
        this.drawerContainer.classList.remove('drawer-hidden');
        
        // Add staggered animation delays to drawer content elements
        this.addStaggeredAnimations(content);
        
        // Update button states
        this.updateDrawerButtonStates(drawerName);
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
            this.drawerContainer.classList.remove('connection-drawer');
            this.drawerContainer.classList.remove('audio-interface-drawer');
            
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
            'drawer-connection',
            'drawer-audio-interface',
            'drawer-cc-mapping',
            'drawer-note-controls',
            'drawer-scene-management',
            'drawer-audio-mapping'
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
    
    initializeTransportUI() {
        try {
            this.transportUI = new TransportUI(this);
            console.log('Transport UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Transport UI:', error);
        }
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
    }

    onMIDIDisconnected() {
        this.state.set('midiEnabled', false);
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
                
                this.handleCCMapping(mapping.target, normalizedValue);
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

    onMIDIPitchBend(value) {
        const animationType = Math.floor(value * 4);
        this.state.set('animationType', animationType);
    }

    onMIDIAftertouch(value) {
        const intensity = Math.floor(value * 255);
        const color = `#${intensity.toString(16).padStart(2, '0')}${intensity.toString(16).padStart(2, '0')}${intensity.toString(16).padStart(2, '0')}`;
        this.state.set('shapeColor', color);
    }

    handleCCMapping(target, normalizedValue) {
        switch (target) {
            case 'animationSpeed':
                this.state.set('animationSpeed', 0.01 + normalizedValue * 2);
                break;
            case 'movementAmplitude':
                this.state.set('movementAmplitude', normalizedValue * 0.5);
                break;
            case 'rotationAmplitude':
                this.state.set('rotationAmplitude', normalizedValue * 2);
                break;
            case 'scaleAmplitude':
                this.state.set('scaleAmplitude', normalizedValue);
                break;
            case 'randomness':
                this.state.set('randomness', normalizedValue);
                break;
            case 'cellSize':
                this.state.set('cellSize', 0.5 + normalizedValue * 1.5);
                this.scene.updateCellSize();
                break;
            case 'movementFrequency':
                this.state.set('movementFrequency', 0.1 + normalizedValue * 2);
                break;
            case 'rotationFrequency':
                this.state.set('rotationFrequency', 0.1 + normalizedValue * 2);
                break;
            case 'scaleFrequency':
                this.state.set('scaleFrequency', 0.1 + normalizedValue * 2);
                break;
            case 'gridWidth':
                const newWidth = Math.floor(1 + normalizedValue * 29);
                if (this.state.get('gridWidth') !== newWidth) {
                    this.state.set('gridWidth', newWidth);
                    this.scene.createGrid();
                }
                break;
            case 'gridHeight':
                const newHeight = Math.floor(1 + normalizedValue * 29);
                if (this.state.get('gridHeight') !== newHeight) {
                    this.state.set('gridHeight', newHeight);
                    this.scene.createGrid();
                }
                break;
            case 'compositionWidth':
                const newCompWidth = Math.floor(1 + normalizedValue * 29);
                if (this.state.get('compositionWidth') !== newCompWidth) {
                    this.state.set('compositionWidth', newCompWidth);
                    this.scene.createGrid();
                }
                break;
            case 'compositionHeight':
                const newCompHeight = Math.floor(1 + normalizedValue * 29);
                if (this.state.get('compositionHeight') !== newCompHeight) {
                    this.state.set('compositionHeight', newCompHeight);
                    this.scene.createGrid();
                }
                break;
            case 'animationType':
                this.state.set('animationType', Math.floor(normalizedValue * 4));
                break;
            case 'sphereRefraction':
                this.state.set('sphereRefraction', normalizedValue * 2);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereTransparency':
                this.state.set('sphereTransparency', normalizedValue);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereTransmission':
                this.state.set('sphereTransmission', normalizedValue);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereRoughness':
                this.state.set('sphereRoughness', normalizedValue);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereMetalness':
                this.state.set('sphereMetalness', normalizedValue);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereScale':
                this.state.set('sphereScale', 0.5 + normalizedValue * 2.5);
                this.scene.updateSphereScales();
                break;
            case 'sphereClearcoat':
                this.state.set('sphereClearcoat', normalizedValue);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereClearcoatRoughness':
                this.state.set('sphereClearcoatRoughness', normalizedValue);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereEnvMapIntensity':
                this.state.set('sphereEnvMapIntensity', normalizedValue * 3);
                this.scene.updateSphereMaterials();
                break;
            case 'sphereDistortionStrength':
                this.state.set('sphereDistortionStrength', normalizedValue);
                this.scene.updateSphereMaterials();
                break;
            // Post-processing parameters
            case 'bloomStrength':
                this.state.set('bloomStrength', normalizedValue * 2);
                this.scene.updatePostProcessing();
                break;
            case 'bloomRadius':
                this.state.set('bloomRadius', normalizedValue * 1.5);
                this.scene.updatePostProcessing();
                break;
            case 'bloomThreshold':
                this.state.set('bloomThreshold', normalizedValue);
                this.scene.updatePostProcessing();
                break;
            case 'chromaticIntensity':
                this.state.set('chromaticIntensity', normalizedValue);
                this.scene.updatePostProcessing();
                break;
            case 'vignetteIntensity':
                this.state.set('vignetteIntensity', normalizedValue);
                this.scene.updatePostProcessing();
                break;
            case 'vignetteRadius':
                this.state.set('vignetteRadius', 0.3 + normalizedValue * 0.7);
                this.scene.updatePostProcessing();
                break;
            case 'vignetteSoftness':
                this.state.set('vignetteSoftness', normalizedValue);
                this.scene.updatePostProcessing();
                break;
            case 'grainIntensity':
                this.state.set('grainIntensity', normalizedValue * 0.3);
                this.scene.updatePostProcessing();
                break;
            case 'colorHue':
                this.state.set('colorHue', normalizedValue);
                this.scene.updatePostProcessing();
                break;
            case 'colorSaturation':
                this.state.set('colorSaturation', 0.1 + normalizedValue * 2);
                this.scene.updatePostProcessing();
                break;
            case 'colorBrightness':
                this.state.set('colorBrightness', 0.5 + normalizedValue);
                this.scene.updatePostProcessing();
                break;
            case 'colorContrast':
                this.state.set('colorContrast', 0.5 + normalizedValue * 1.5);
                this.scene.updatePostProcessing();
                break;
            // Lighting parameters
            case 'ambientLightIntensity':
                this.state.set('ambientLightIntensity', normalizedValue * 2);
                this.scene.updateLighting();
                break;
            case 'directionalLightIntensity':
                this.state.set('directionalLightIntensity', normalizedValue * 2);
                this.scene.updateLighting();
                break;
            case 'pointLight1Intensity':
                this.state.set('pointLight1Intensity', normalizedValue * 3);
                this.scene.updateLighting();
                break;
            case 'pointLight2Intensity':
                this.state.set('pointLight2Intensity', normalizedValue * 3);
                this.scene.updateLighting();
                break;
            case 'rimLightIntensity':
                this.state.set('rimLightIntensity', normalizedValue * 2);
                this.scene.updateLighting();
                break;
            case 'accentLightIntensity':
                this.state.set('accentLightIntensity', normalizedValue * 2);
                this.scene.updateLighting();
                break;
            // Shape cycling parameters
            case 'shapeCyclingSpeed':
                this.state.set('shapeCyclingSpeed', 0.1 + normalizedValue * 5);
                break;
            case 'shapeCyclingPattern':
                this.state.set('shapeCyclingPattern', Math.floor(normalizedValue * 5));
                break;
            case 'shapeCyclingDirection':
                this.state.set('shapeCyclingDirection', Math.floor(normalizedValue * 4));
                break;
            case 'shapeCyclingSync':
                this.state.set('shapeCyclingSync', Math.floor(normalizedValue * 4));
                break;
            case 'shapeCyclingIntensity':
                this.state.set('shapeCyclingIntensity', normalizedValue);
                break;
            case 'shapeCyclingTrigger':
                this.state.set('shapeCyclingTrigger', Math.floor(normalizedValue * 4));
                break;
        }
    }

    handleNoteMapping(target) {
        switch (target) {
            case 'shapeCycling':
                this.state.set('enableShapeCycling', !this.state.get('enableShapeCycling'));
                if (!this.state.get('enableShapeCycling')) {
                    this.animationLoop.resetAnimationTime();
                }
                break;
            case 'sizeAnimation':
                this.state.set('enableSizeAnimation', !this.state.get('enableSizeAnimation'));
                if (!this.state.get('enableSizeAnimation')) {
                    this.scene.updateCellSize();
                }
                break;
            case 'showGrid':
                this.state.set('showGrid', !this.state.get('showGrid'));
                this.scene.updateGridLines();
                break;
            case 'enableShapeCycling':
                this.state.set('enableShapeCycling', true);
                break;
            case 'enableSizeAnimation':
                this.state.set('enableSizeAnimation', true);
                break;
            case 'enableMovementAnimation':
                this.state.set('movementAmplitude', Math.max(0.1, this.state.get('movementAmplitude')));
                break;
            case 'enableRotationAnimation':
                this.state.set('rotationAmplitude', Math.max(0.1, this.state.get('rotationAmplitude')));
                break;
            case 'enableScaleAnimation':
                this.state.set('scaleAmplitude', Math.max(0.1, this.state.get('scaleAmplitude')));
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
        }
    }

    handleKeyDown(event) {
        switch (event.key) {
            case '1':
                this.state.set('animationSpeed', Math.min(2, this.state.get('animationSpeed') + 0.1));
                break;
            case '2':
                this.state.set('animationSpeed', Math.max(0.01, this.state.get('animationSpeed') - 0.1));
                break;
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
                this.state.set('enableSizeAnimation', !this.state.get('enableSizeAnimation'));
                if (!this.state.get('enableSizeAnimation')) {
                    this.scene.updateCellSize();
                }
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
        
        const testButton = document.getElementById('test-cc-button');
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

    async loadAvailablePresets() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            // Try to load a list of available presets
            const response = await fetch('/presets/');
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
            // Could not load preset list, trying individual preset discovery
        }
        
        // Fallback: Try to discover presets by attempting to load them
        const knownPresets = [
            'sample-multi-channel',
            'novation-launch-control',
            'akai-mpk-mini',
            'arturia-beatstep-pro',
            'elektron-analog-rytm-mk2'
        ];
        
        const availablePresets = [];
        
        // Try to load each preset to see if it exists
        for (const preset of knownPresets) {
            try {
                const response = await fetch(`/presets/${preset}.json`);
                if (response.ok) {
                    const presetData = await response.json();
                    if (this.validatePreset(presetData)) {
                        availablePresets.push(preset);
                    }
                }
            } catch (error) {
                // Preset not found or invalid
            }
        }
        
        this.updatePresetDropdown(availablePresets);
    }

    async loadAvailableScenePresets() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use the proper discovery method that prioritizes index.json
        await this.discoverScenePresets();
    }

    async discoverScenePresets() {
        // First, try to load the index file which contains all available scenes
        try {
            const indexResponse = await fetch('/scenes/index.json');
            if (indexResponse.ok) {
                const indexData = await indexResponse.json();
                if (indexData.scenes && Array.isArray(indexData.scenes)) {
                    await this.validateAndUpdateScenePresets(indexData.scenes);
                    return;
                }
            }
        } catch (error) {
            // Scene index not available, trying directory listing
        }
        
        // Try to get a proper directory listing
        try {
            const response = await fetch('/scenes/');
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
    }

    async systematicSceneDiscovery() {
        // This is a more intelligent approach that tries to discover files
        // by attempting common patterns and learning from successful finds
        
        const foundPresets = [];
        const triedNames = new Set();
        
        // First, try the known existing files
        const knownFiles = ['ambient-dream', 'cyberpunk-night', 'minimalist-zen', 'mirage', 'meat'];
        for (const name of knownFiles) {
            triedNames.add(name);
            try {
                const response = await fetch(`/scenes/${name}.json`);
                if (response.ok) {
                    const sceneData = await response.json();
                    if (this.validateScenePreset(sceneData)) {
                        foundPresets.push(name);
                    }
                }
            } catch (error) {
                // Silently continue
            }
        }
        
        // Try single letters (a-z)
        for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(97 + i);
            triedNames.add(letter);
            try {
                const response = await fetch(`/scenes/${letter}.json`);
                if (response.ok) {
                    const sceneData = await response.json();
                    if (this.validateScenePreset(sceneData)) {
                        foundPresets.push(letter);
                    }
                }
            } catch (error) {
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
                    const response = await fetch(`/scenes/${name}.json`);
                    if (response.ok) {
                        const sceneData = await response.json();
                        if (this.validateScenePreset(sceneData)) {
                            foundPresets.push(name);
                        }
                    }
                } catch (error) {
                    // Silently continue
                }
            }
        }
        
        this.updateScenePresetDropdown(foundPresets);
    }

    async validateAndUpdateScenePresets(sceneNames) {
        const validScenePresets = [];
        
        for (const sceneName of sceneNames) {
            try {
                const response = await fetch(`/scenes/${sceneName}.json`);
                if (response.ok) {
                    const sceneData = await response.json();
                    if (this.validateScenePreset(sceneData)) {
                        validScenePresets.push(sceneName);
                    }
                }
            } catch (error) {
                // Error validating scene preset
            }
        }
        
        this.updateScenePresetDropdown(validScenePresets);
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
        
        // Add available presets
        availablePresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset;
            option.textContent = this.getPresetDisplayName(preset);
            select.appendChild(option);
        });
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
            'novation-launch-control': 'Novation Launch Control XL',
            'akai-mpk-mini': 'Akai MPK Mini',
            'arturia-beatstep-pro': 'Arturia BeatStep Pro',
            'elektron-analog-rytm-mk2': 'Elektron Analog Rytm MK2'
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

        try {
            // Load the preset file from the presets folder
            const response = await fetch(`/presets/${presetName}.json`);
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
            console.error('Failed to load preset:', error);
            alert(`Failed to load preset "${presetName}". Please check if the preset file exists.`);
        }
    }

    savePreset() {
        const ccMappings = this.state.get('midiCCMappings') || {};
        const noteMappings = this.state.get('midiNoteMappings') || {};
        
        const preset = {
            version: '1.0',
            timestamp: Date.now(),
            midiCCMappings: ccMappings,
            midiNoteMappings: noteMappings
        };
        
        const dataStr = JSON.stringify(preset, null, 2);
        
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `rglr-midi-preset-${Date.now()}.json`;
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
                        midiNoteMappings: preset.noteMappings
                    };
                    this.applyPreset(newPreset);
                } else if (this.validatePreset(preset)) {
                    // New format (current state format)
                    this.applyPreset(preset);
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
               (typeof preset.midiNoteMappings === 'object');
    }

    applyPreset(preset) {
        if (preset.midiCCMappings) {
            this.state.set('midiCCMappings', preset.midiCCMappings);
        }
        if (preset.midiNoteMappings) {
            this.state.set('midiNoteMappings', preset.midiNoteMappings);
        }
        
        // Pass the preset data directly to recreateControlsFromPreset
        this.recreateControlsFromPreset(preset);
    }

    recreateControlsFromPreset(preset = null) {
        if (!this.controlManager) return;
        
        console.log('Recreating controls from preset:', preset);
        
        // Clear existing controls
        this.controlManager.clearAllControls();
        
        // Recreate CC controls
        const ccMappings = preset ? preset.midiCCMappings : this.state.get('midiCCMappings');
        console.log('CC mappings to recreate:', ccMappings);
        if (ccMappings && typeof ccMappings === 'object') {
            Object.keys(ccMappings).forEach((controlId, index) => {
                const mapping = ccMappings[controlId];
                console.log('Creating CC control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "cc1" -> 1)
                const indexMatch = controlId.match(/cc(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : index + 1;
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
            });
        }
        
        // Recreate Note controls
        const noteMappings = preset ? preset.midiNoteMappings : this.state.get('midiNoteMappings');
        console.log('Note mappings to recreate:', noteMappings);
        if (noteMappings && typeof noteMappings === 'object') {
            Object.keys(noteMappings).forEach((controlId, index) => {
                const mapping = noteMappings[controlId];
                console.log('Creating Note control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "note1" -> 1)
                const indexMatch = controlId.match(/note(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : index + 1;
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
            });
        }
        
        console.log('Finished recreating controls');
        console.log('Final CC mappings in state:', this.state.get('midiCCMappings'));
        console.log('Final Note mappings in state:', this.state.get('midiNoteMappings'));
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

        try {
            // Try to load the scene preset
            const response = await fetch(`/scenes/${presetName}.json`);
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
            console.error('Error applying scene preset:', error);
            alert(`Error loading scene preset: ${error.message}`);
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
        
        // Check for some essential settings
        const requiredSettings = ['animationSpeed', 'movementAmplitude', 'gridWidth', 'gridHeight'];
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
        try {
            const response = await fetch(`/scenes/${presetName}.json`);
            if (response.ok) {
                const sceneData = await response.json();
                if (sceneData.name) {
                    return sceneData.name;
                }
            }
        } catch (error) {
            // Fall back to formatting the filename
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
                target: 'animationSpeed'
            };
            this.state.set('midiCCMappings', ccMappings);
        }
    }

    addNoteControl() {
        if (!this.controlManager) return;
        
        const nextIndex = this.controlManager.getNextControlIndex('note');
        const control = this.controlManager.addControl('note', nextIndex);
        
        if (control) {
            // Add to state
            const noteMappings = this.state.get('midiNoteMappings');
            noteMappings[control.controlId] = {
                channel: 0,
                note: 60 + nextIndex,
                target: 'shapeCycling'
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
                target: 'animationSpeed',
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
        // Use the same logic as handleCCMapping for consistent parameter updates
        switch (target) {
            case 'animationSpeed':
                this.state.set('animationSpeed', 0.01 + value * 2);
                break;
            case 'movementAmplitude':
                this.state.set('movementAmplitude', value * 0.5);
                break;
            case 'rotationAmplitude':
                this.state.set('rotationAmplitude', value * 2);
                break;
            case 'scaleAmplitude':
                this.state.set('scaleAmplitude', value);
                break;
            case 'randomness':
                this.state.set('randomness', value);
                break;
            case 'cellSize':
                this.state.set('cellSize', 0.5 + value * 1.5);
                if (this.scene) this.scene.updateCellSize();
                break;
            case 'movementFrequency':
                this.state.set('movementFrequency', 0.1 + value * 2);
                break;
            case 'rotationFrequency':
                this.state.set('rotationFrequency', 0.1 + value * 2);
                break;
            case 'scaleFrequency':
                this.state.set('scaleFrequency', 0.1 + value * 2);
                break;
            case 'gridWidth':
                const newWidth = Math.floor(1 + value * 29);
                if (this.state.get('gridWidth') !== newWidth) {
                    this.state.set('gridWidth', newWidth);
                    if (this.scene) this.scene.createGrid();
                }
                break;
            case 'gridHeight':
                const newHeight = Math.floor(1 + value * 29);
                if (this.state.get('gridHeight') !== newHeight) {
                    this.state.set('gridHeight', newHeight);
                    if (this.scene) this.scene.createGrid();
                }
                break;
            case 'compositionWidth':
                const newCompWidth = Math.floor(1 + value * 29);
                if (this.state.get('compositionWidth') !== newCompWidth) {
                    this.state.set('compositionWidth', newCompWidth);
                    if (this.scene) this.scene.createGrid();
                }
                break;
            case 'compositionHeight':
                const newCompHeight = Math.floor(1 + value * 29);
                if (this.state.get('compositionHeight') !== newCompHeight) {
                    this.state.set('compositionHeight', newCompHeight);
                    if (this.scene) this.scene.createGrid();
                }
                break;
            case 'animationType':
                this.state.set('animationType', Math.floor(value * 4));
                break;
            case 'sphereRefraction':
                this.state.set('sphereRefraction', value * 2);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'sphereTransparency':
                this.state.set('sphereTransparency', value);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'sphereTransmission':
                this.state.set('sphereTransmission', value);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'sphereRoughness':
                this.state.set('sphereRoughness', value);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'sphereMetalness':
                this.state.set('sphereMetalness', value);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'sphereScale':
                this.state.set('sphereScale', 0.5 + value * 2.5);
                if (this.scene) this.scene.updateSphereScales();
                break;
            case 'sphereClearcoat':
                this.state.set('sphereClearcoat', value);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'sphereClearcoatRoughness':
                this.state.set('sphereClearcoatRoughness', value);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'sphereEnvMapIntensity':
                this.state.set('sphereEnvMapIntensity', value * 3);
                if (this.scene) this.scene.updateSphereMaterials();
                break;
            case 'bloomStrength':
                this.state.set('bloomStrength', value * 2);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'bloomRadius':
                this.state.set('bloomRadius', value * 2);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'bloomThreshold':
                this.state.set('bloomThreshold', value);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'chromaticIntensity':
                this.state.set('chromaticIntensity', value);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'vignetteIntensity':
                this.state.set('vignetteIntensity', value);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'vignetteRadius':
                this.state.set('vignetteRadius', value);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'vignetteSoftness':
                this.state.set('vignetteSoftness', value);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'grainIntensity':
                this.state.set('grainIntensity', value * 0.5);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'colorHue':
                this.state.set('colorHue', (value - 0.5) * 2);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'colorSaturation':
                this.state.set('colorSaturation', value * 3);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'colorBrightness':
                this.state.set('colorBrightness', value * 2);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'colorContrast':
                this.state.set('colorContrast', value * 2);
                if (this.scene) this.scene.updatePostProcessing();
                break;
            case 'ambientLightIntensity':
                this.state.set('ambientLightIntensity', value * 2);
                if (this.scene) this.scene.updateLighting();
                break;
            case 'directionalLightIntensity':
                this.state.set('directionalLightIntensity', value * 3);
                if (this.scene) this.scene.updateLighting();
                break;
            case 'pointLight1Intensity':
                this.state.set('pointLight1Intensity', value * 3);
                if (this.scene) this.scene.updateLighting();
                break;
            case 'pointLight2Intensity':
                this.state.set('pointLight2Intensity', value * 3);
                if (this.scene) this.scene.updateLighting();
                break;
            case 'rimLightIntensity':
                this.state.set('rimLightIntensity', value * 3);
                if (this.scene) this.scene.updateLighting();
                break;
            case 'accentLightIntensity':
                this.state.set('accentLightIntensity', value * 3);
                if (this.scene) this.scene.updateLighting();
                break;
            case 'centerScalingEnabled':
                this.state.set('centerScalingEnabled', value > 0.5);
                if (this.scene) this.scene.updateCenterScaling();
                break;
            case 'centerScalingIntensity':
                this.state.set('centerScalingIntensity', value * 2);
                if (this.scene) this.scene.updateCenterScaling();
                break;
            case 'centerScalingCurve':
                this.state.set('centerScalingCurve', Math.floor(value * 4));
                if (this.scene) this.scene.updateCenterScaling();
                break;
            case 'centerScalingRadius':
                this.state.set('centerScalingRadius', 0.1 + value * 5);
                if (this.scene) this.scene.updateCenterScaling();
                break;
            case 'centerScalingDirection':
                this.state.set('centerScalingDirection', Math.floor(value * 2));
                if (this.scene) this.scene.updateCenterScaling();
                break;
            case 'centerScalingAnimation':
                this.state.set('centerScalingAnimation', value > 0.5);
                if (this.scene) this.scene.updateCenterScaling();
                break;
            case 'centerScalingAnimationSpeed':
                this.state.set('centerScalingAnimationSpeed', 0.1 + value * 3);
                if (this.scene) this.scene.updateCenterScaling();
                break;
            case 'centerScalingAnimationType':
                this.state.set('centerScalingAnimationType', Math.floor(value * 4));
                if (this.scene) this.scene.updateCenterScaling();
                break;
            default:
                // For any other parameters, just set the value directly
                this.state.set(target, value);
                break;
        }
    }

    triggerNoteAction(target) {
        this.handleNoteMapping(target);
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
            } else if (isAvailable) {
                statusIndicator.className = 'w-2 h-2 rounded-full bg-yellow-500 transition-all duration-300';
                statusText.textContent = 'Available';
            } else {
                statusIndicator.className = 'w-2 h-2 rounded-full bg-red-500 transition-all duration-300';
                statusText.textContent = 'Unavailable';
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
        
        // Subscribe to state changes
        this.state.subscribe('audioListening', () => this.updateAudioStatus());
        this.state.subscribe('audioAvailable', () => this.updateAudioStatus());
        
        // Update audio analysis display for both audio interface and audio mapping drawers
        this.state.subscribe('audioOverall', () => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        });
        this.state.subscribe('audioRMS', () => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        });
        this.state.subscribe('audioPeak', () => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        });
        this.state.subscribe('audioFrequency', () => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        });
        this.state.subscribe('audioRMS', () => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        });
        this.state.subscribe('audioPeak', () => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        });
        this.state.subscribe('audioFrequency', () => {
            if (this.currentDrawer === 'audio-interface' || this.currentDrawer === 'audio-mapping') {
                this.updateAudioAnalysisDisplay();
            }
        });
        
        // Initial setup
        this.updateAudioInterfaceDropdown();
        this.updateAudioChannelsDisplay();
        this.updateAudioStatus();
        this.updateAudioAnalysisDisplay();
    }
} 