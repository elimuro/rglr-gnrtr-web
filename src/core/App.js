/**
 * App.js - Main Application Controller
 * This is the central orchestrator for the RGLR GNRTR application, managing all major components including
 * the scene, state management, animation loop, MIDI integration, and GUI. It handles initialization of all
 * subsystems, coordinates communication between modules, manages MIDI event routing, and provides the main
 * interface for external interactions with the application.
 */

import { Scene } from './Scene.js';
import { AnimationLoop } from './AnimationLoop.js';
import { StateManager } from './StateManager.js';
import { MIDIManager } from '../midi-manager.js';
import { MIDIControlManager } from '../midi-controls.js';
import { GUIManager } from '../ui/GUIManager.js';

export class App {
    constructor() {
        console.log('Creating App...');
        this.state = new StateManager();
        console.log('State manager created');
        this.scene = new Scene(this.state);
        console.log('Scene created');
        this.animationLoop = new AnimationLoop(this.scene, this.state);
        console.log('Animation loop created');
        this.midiManager = new MIDIManager(this);
        console.log('MIDI manager created');
        this.controlManager = null;
        this.guiManager = null;
        
        this.init();
    }

    init() {
        try {
            console.log('Initializing App...');
            
            // Initialize scene
            this.scene.init();
            console.log('Scene initialized');
            
            // Initialize GUI
            this.guiManager = new GUIManager(this.state, this);
            this.guiManager.init();
            console.log('GUI initialized');
            
            // Initialize MIDI
            this.setupMIDI();
            console.log('MIDI setup complete');
            
            // Initialize control manager when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeControlManager();
                });
            } else {
                this.initializeControlManager();
            }
            
            // Start animation loop
            this.animationLoop.start();
            console.log('Animation loop started');
            
            // Set up window resize handler
            window.addEventListener('resize', () => this.onWindowResize());
            
            // Set up keyboard shortcuts for testing
            window.addEventListener('keydown', (event) => this.handleKeyDown(event));
            
            console.log('App initialization complete');
        } catch (error) {
            console.error('Error during App initialization:', error);
        }
    }

    setupMIDI() {
        // Set up MIDI UI event listeners
        document.getElementById('midi-connect').addEventListener('click', () => {
            this.midiManager.connect();
        });
        
        document.getElementById('midi-disconnect').addEventListener('click', () => {
            this.midiManager.disconnect();
        });

        const refreshButton = document.getElementById('midi-refresh');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.midiManager.refreshDevices();
            });
        }
        
        document.getElementById('midi-help').addEventListener('click', () => {
            window.open('midi-help.html', '_blank');
        });
        
        // Test CC values button
        document.getElementById('test-cc-button').addEventListener('click', () => {
            this.testCCValues();
        });
        
        // Preset selector
        document.getElementById('cc-preset-select').addEventListener('change', (e) => {
            this.applyCCPreset(e.target.value);
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
                            // It's a MIDI preset
                            this.loadPreset(file);
                        }
                    } catch (error) {
                        console.error('Error parsing file:', error);
                        alert('Invalid file format. Please check if the file is a valid JSON preset or scene.');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // Scene management buttons
        document.getElementById('save-scene-button').addEventListener('click', () => {
            this.saveScene();
        });
        
        document.getElementById('load-scene-button').addEventListener('click', () => {
            this.loadScene();
        });
        
        // Add new control buttons
        document.getElementById('add-cc-control').addEventListener('click', () => {
            this.addCCControl();
        });
        
        document.getElementById('add-note-control').addEventListener('click', () => {
            this.addNoteControl();
        });
        
        // Interpolation duration control
        const interpolationDurationInput = document.getElementById('interpolation-duration');
        const interpolationDurationValue = document.getElementById('interpolation-duration-value');
        
        if (interpolationDurationInput && interpolationDurationValue) {
            interpolationDurationInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                interpolationDurationValue.textContent = value.toFixed(1) + 's';
            });
        }
        
        // Interpolation easing control
        const interpolationEasingSelect = document.getElementById('interpolation-easing');
        if (interpolationEasingSelect) {
            // Set default value
            interpolationEasingSelect.value = 'power2.inOut';
        }
        
        // Debug interpolation button
        const debugInterpolationButton = document.getElementById('debug-interpolation');
        if (debugInterpolationButton) {
            debugInterpolationButton.addEventListener('click', () => {
                this.debugInterpolation();
            });
        }
        
        this.setupCollapsibleSections();
        

    }

    initializeControlManager() {
        console.log('Initializing control manager...');
        
        const ccContainer = document.querySelector('.midi-section-content[data-section="channel-mapping"]');
        const noteContainer = document.querySelector('.midi-section-content[data-section="note-controls"]');
        
        if (!ccContainer || !noteContainer) {
            console.error('Could not find MIDI control containers');
            return;
        }
        
        this.controlManager = new MIDIControlManager(ccContainer, this);
        this.controlManager.noteContainer = noteContainer;
        
        console.log('Control manager initialized successfully');
        console.log('MIDI CC mappings:', this.state.get('midiCCMappings'));
        console.log('MIDI Note mappings:', this.state.get('midiNoteMappings'));
        this.recreateControlsFromPreset();
    }

    setupCollapsibleSections() {
        const toggles = document.querySelectorAll('.midi-section-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSection(toggle);
            });
        });
        
        const headers = document.querySelectorAll('.midi-section h4');
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.classList.contains('midi-section-toggle')) {
                    return;
                }
                const toggle = header.querySelector('.midi-section-toggle');
                if (toggle) {
                    this.toggleSection(toggle);
                }
            });
        });
        
        this.loadCollapsibleState();
    }
    
    toggleSection(toggle) {
        const sectionName = toggle.getAttribute('data-section');
        const content = document.querySelector(`.midi-section-content[data-section="${sectionName}"]`);
        
        if (content) {
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
                content.classList.remove('collapsed');
                toggle.classList.remove('collapsed');
                toggle.textContent = '▼';
            } else {
                content.classList.add('collapsed');
                toggle.classList.add('collapsed');
                toggle.textContent = '▶';
            }
            
            this.saveCollapsibleState();
        }
    }
    
    saveCollapsibleState() {
        const state = {};
        const contents = document.querySelectorAll('.midi-section-content');
        
        contents.forEach(content => {
            const sectionName = content.getAttribute('data-section');
            state[sectionName] = content.classList.contains('collapsed');
        });
        
        localStorage.setItem('midi-sections-collapsed', JSON.stringify(state));
    }
    
    loadCollapsibleState() {
        const savedState = localStorage.getItem('midi-sections-collapsed');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                
                Object.keys(state).forEach(sectionName => {
                    const content = document.querySelector(`.midi-section-content[data-section="${sectionName}"]`);
                    const toggle = document.querySelector(`.midi-section-toggle[data-section="${sectionName}"]`);
                    
                    if (content && toggle && state[sectionName]) {
                        content.classList.add('collapsed');
                        toggle.classList.add('collapsed');
                        toggle.textContent = '▶';
                    }
                });
            } catch (error) {
                console.warn('Failed to load collapsible state:', error);
            }
        }
    }

    // MIDI callback methods
    onMIDIConnected() {
        this.state.set('midiEnabled', true);
        this.midiManager.updateDeviceStatus();
    }

    onMIDIDisconnected() {
        const statusElement = document.getElementById('midi-status');
        statusElement.textContent = 'MIDI: Disconnected';
        statusElement.className = 'midi-disconnected';
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
                console.log('Toggle pause functionality - implement as needed');
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
                console.log('Post-processing toggled:', this.state.get('postProcessingEnabled'));
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
            case 'c':
                this.state.set('animationType', (this.state.get('animationType') + 1) % 4);
                break;
        }
    }

    onWindowResize() {
        this.scene.onWindowResize();
    }

    testCCValues() {
        console.log('Testing CC values...');
        
        const ccMappings = this.state.get('midiCCMappings');
        Object.keys(ccMappings).forEach(param => {
            const mapping = ccMappings[param];
            this.onMIDICC(mapping.cc, 64, mapping.channel);
            console.log(`Tested Ch:${mapping.channel} CC:${mapping.cc} (${param}) with value 64`);
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

    applyCCPreset(presetName) {
        const presets = {
            standard: {
                cc1: { channel: 0, cc: 1, target: 'animationSpeed' },
                cc2: { channel: 0, cc: 2, target: 'movementAmplitude' },
                cc3: { channel: 0, cc: 3, target: 'rotationAmplitude' },
                cc4: { channel: 0, cc: 4, target: 'scaleAmplitude' },
                cc5: { channel: 0, cc: 5, target: 'sphereScale' }
            },
            multichannel: {
                cc1: { channel: 0, cc: 1, target: 'animationSpeed' },
                cc2: { channel: 1, cc: 1, target: 'movementAmplitude' },
                cc3: { channel: 2, cc: 1, target: 'rotationAmplitude' },
                cc4: { channel: 3, cc: 1, target: 'scaleAmplitude' },
                cc5: { channel: 4, cc: 1, target: 'sphereScale' }
            },
            shapeCycling: {
                cc1: { channel: 0, cc: 1, target: 'shapeCyclingSpeed' },
                cc2: { channel: 0, cc: 2, target: 'shapeCyclingPattern' },
                cc3: { channel: 0, cc: 3, target: 'shapeCyclingDirection' },
                cc4: { channel: 0, cc: 4, target: 'shapeCyclingSync' },
                cc5: { channel: 0, cc: 5, target: 'shapeCyclingIntensity' },
                cc6: { channel: 0, cc: 6, target: 'shapeCyclingTrigger' },
                cc7: { channel: 0, cc: 7, target: 'animationSpeed' },
                cc8: { channel: 0, cc: 8, target: 'movementAmplitude' },
                cc9: { channel: 0, cc: 9, target: 'rotationAmplitude' },
                cc10: { channel: 0, cc: 10, target: 'scaleAmplitude' },
                cc11: { channel: 0, cc: 11, target: 'sphereScale' }
            }
        };
        
        if (presets[presetName]) {
            this.state.set('midiCCMappings', presets[presetName]);
            this.recreateControlsFromPreset();
        }
    }

    savePreset() {
        const ccMappings = this.state.get('midiCCMappings') || {};
        const noteMappings = this.state.get('midiNoteMappings') || {};
        
        console.log('Current state before saving:');
        console.log('CC mappings:', ccMappings);
        console.log('Note mappings:', noteMappings);
        console.log('CC mappings keys:', Object.keys(ccMappings));
        console.log('Note mappings keys:', Object.keys(noteMappings));
        
        const preset = {
            version: '1.0',
            timestamp: Date.now(),
            midiCCMappings: ccMappings,
            midiNoteMappings: noteMappings
        };
        
        console.log('Saving preset:', preset);
        
        const dataStr = JSON.stringify(preset, null, 2);
        console.log('JSON string:', dataStr);
        
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
                console.log('Loading preset:', preset);
                
                if (this.validatePreset(preset)) {
                    this.applyPreset(preset);
                    console.log('Preset loaded successfully');
                } else {
                    console.error('Invalid preset format:', preset);
                    alert('Invalid preset file format. Please check the file structure.');
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
        console.log('Applying preset:', preset);
        
        if (preset.midiCCMappings) {
            console.log('Setting CC mappings:', preset.midiCCMappings);
            this.state.set('midiCCMappings', preset.midiCCMappings);
        }
        if (preset.midiNoteMappings) {
            console.log('Setting Note mappings:', preset.midiNoteMappings);
            this.state.set('midiNoteMappings', preset.midiNoteMappings);
        }
        
        console.log('State after applying preset:');
        console.log('CC mappings:', this.state.get('midiCCMappings'));
        console.log('Note mappings:', this.state.get('midiNoteMappings'));
        
        this.recreateControlsFromPreset();
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
                console.log('Extracted control index:', controlIndex, 'from controlId:', controlId);
                
                const control = this.controlManager.addControl('cc', controlIndex);
                if (control) {
                    console.log('Control created successfully, updating mapping...');
                    control.updateMapping(mapping);
                    console.log('Mapping updated for control:', control.controlId);
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
                console.log('Extracted control index:', controlIndex, 'from controlId:', controlId);
                
                const control = this.controlManager.addControl('note', controlIndex);
                if (control) {
                    console.log('Control created successfully, updating mapping...');
                    control.updateMapping(mapping);
                    console.log('Mapping updated for control:', control.controlId);
                } else {
                    console.error('Failed to create control for:', controlId);
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
            
            console.log('Scene downloaded successfully');
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
            console.log('Loading scene file:', sceneData);
            
            // Get interpolation duration from UI
            const interpolationDurationInput = document.getElementById('interpolation-duration');
            const duration = interpolationDurationInput ? parseFloat(interpolationDurationInput.value) : 2.0;
            
            // Get interpolation easing from UI
            const interpolationEasingSelect = document.getElementById('interpolation-easing');
            const easing = interpolationEasingSelect ? interpolationEasingSelect.value : 'power2.inOut';
            
            const success = this.state.importSceneWithInterpolation(sceneData, duration, easing);
            
            if (success) {
                console.log('Scene interpolation started');
            } else {
                console.error('Error loading scene. Please check the file format.');
            }
        } catch (error) {
            console.error('Error loading scene file:', error);
            alert('Error loading scene file. Please check the file format.');
        }
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

    updateAnimationParameter(target, value) {
        this.state.set(target, value);
    }

    triggerNoteAction(target) {
        this.handleNoteMapping(target);
    }
    
    debugInterpolation() {
        console.log('=== INTERPOLATION DEBUG ===');
        
        // Log current state
        this.state.logCurrentState();
        
        // Log interpolation info
        const debugInfo = this.state.getInterpolationDebugInfo();
        console.log('Interpolation debug info:', debugInfo);
        
        // Log recent state changes
        console.log('Recent state history:', this.state.history);
        
        // Log current listeners
        console.log('Active listeners:', this.state.listeners.size);
        
        // Check for any active animations
        if (this.animationLoop) {
            console.log('Animation loop active:', this.animationLoop.isAnimating());
            console.log('Animation time:', this.animationLoop.animationTime);
        }
        
        // Log scene state
        if (this.scene) {
            console.log('Scene performance metrics:', this.scene.getPerformanceMetrics());
        }
        
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
        
        console.log('Debug summary:', summary);
        
        // Show alert with key info
        const message = `Interpolation Debug:
Active: ${debugInfo.isActive}
Progress: ${(debugInfo.progress * 100).toFixed(1)}%
Time: ${debugInfo.time.toFixed(2)}s / ${debugInfo.duration.toFixed(2)}s
State Keys: ${summary.stateKeys}
History: ${summary.historySize} entries`;
        
        alert(message);
    }
} 