import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { gsap } from 'gsap';
import { MIDIManager } from './midi-manager.js';
import { MIDIControlManager } from './midi-controls.js';

class RGLRGNRTR {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -200, window.innerWidth / 200,
            window.innerHeight / 200, window.innerHeight / -200,
            0.1, 1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        this.shapes = [];
        this.gridLines = [];
        this.shapeControls = null;
        this.pulseTime = 0;
        this.animationTime = 0;
        this.composition = []; // Store the composition for animation
        this.midiManager = null; // MIDI manager instance
        this.controlManager = null; // MIDI control manager instance
        
        // Map parameter names to HTML element IDs
        this.paramToElementId = {
            'animationSpeed': 'speed',
            'movementAmplitude': 'movement',
            'rotationAmplitude': 'rotation',
            'scaleAmplitude': 'scale',
            'randomness': 'randomness',
            'cellSize': 'cellsize',
            'movementFrequency': 'movementfrequency',
            'rotationFrequency': 'rotationfrequency',
            'scaleFrequency': 'scalefrequency',
            'gridWidth': 'gridwidth',
            'gridHeight': 'gridheight'
        };
        
        this.init();
        this.setupMIDI();
        this.setupGUI();
        this.createGrid();
        this.animate();
        
        // Initialize control manager when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeControlManager();
            });
        } else {
            this.initializeControlManager();
        }
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.z = 10;
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Add keyboard shortcuts for testing MIDI functionality
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));

        // Setup lighting for refractive materials
        this.setupLighting();

        // Initialize parameters
        this.params = {
            animationType: 0,
            animationSpeed: 0.25,
            enableShapeCycling: false, // Toggle for sine wave shape cycling
            enableSizeAnimation: false, // Toggle for size/movement/rotation animations
            // Movement animation parameters
            movementAmplitude: 0.1, // Movement animation intensity
            movementFrequency: 0.5, // Movement animation frequency
            // Rotation animation parameters
            rotationAmplitude: 0.5, // Rotation animation intensity
            rotationFrequency: 0.3, // Rotation animation frequency
            // Scale animation parameters
            scaleAmplitude: 0.2, // Scale animation intensity
            scaleFrequency: 0.4, // Scale animation frequency
            gridWidth: 8,
            gridHeight: 8,
            cellSize: 1,
            shapeColor: '#00ffff',
            backgroundColor: '#000000',
            showGrid: false,
            randomness: 1,
            compositionWidth: 30,
            compositionHeight: 30,
            enabledShapes: {
                'Basic Shapes': true,
                'Triangles': true,
                'Rectangles': true,
                'Ellipses': true,
                'Refractive Spheres': true
            },
            // Refractive sphere parameters
            sphereRefraction: 1.66, // Water-like refraction index
            sphereTransparency: 0.8,
            sphereRoughness: 0.32,
            sphereMetalness: 0.0,
            sphereTransmission: 0.8, // Added transmission control
            sphereScale: 1.5, // Scale factor for spheres to make refraction more visible
            // MIDI parameters
            midiEnabled: false,
            midiChannel: 0,
            midiCCMappings: {
                cc1: { channel: 0, cc: 1, target: 'animationSpeed' },
                cc2: { channel: 0, cc: 2, target: 'movementAmplitude' },
                cc3: { channel: 0, cc: 3, target: 'rotationAmplitude' },
                cc4: { channel: 0, cc: 4, target: 'scaleAmplitude' },
                cc5: { channel: 0, cc: 5, target: 'sphereScale' }
            },
            midiNoteMappings: {
                note1: { channel: 0, note: 60, target: 'shapeCycling' },
                note2: { channel: 0, note: 61, target: 'sizeAnimation' },
                note3: { channel: 0, note: 62, target: 'showGrid' },
                note4: { channel: 0, note: 63, target: 'enableShapeCycling' },
                note5: { channel: 0, note: 64, target: 'enableSizeAnimation' }
            }
        };
        
        // Apply the background color from params
        this.renderer.setClearColor(new THREE.Color(this.params.backgroundColor));
    }

    setupMIDI() {
        this.midiManager = new MIDIManager(this);
        
        // Set up MIDI UI event listeners
        document.getElementById('midi-connect').addEventListener('click', () => {
            this.midiManager.connect();
        });
        
        document.getElementById('midi-disconnect').addEventListener('click', () => {
            this.midiManager.disconnect();
        });

        // Add refresh devices button if it exists
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
        
        // File input for loading presets
        document.getElementById('preset-file-input').addEventListener('change', (e) => {
            this.loadPreset(e.target.files[0]);
        });
        
        // Set up CC mapping inputs and sliders (Channel/CC Mapping section)
        Object.keys(this.params.midiCCMappings).forEach(param => {
            const channelInput = document.getElementById(`midi-${param}-channel`);
            const ccInput = document.getElementById(`midi-${param}-value`);
            const targetSelect = document.getElementById(`midi-${param}-target`);
            const learnButton = document.getElementById(`midi-${param}-learn`);
            const learnStatus = document.getElementById(`midi-${param}-learn-status`);
            
            if (channelInput && ccInput && targetSelect && learnButton && learnStatus) {
                channelInput.value = this.params.midiCCMappings[param].channel + 1;
                ccInput.value = this.params.midiCCMappings[param].cc;
                targetSelect.value = this.params.midiCCMappings[param].target;
                
                channelInput.addEventListener('change', (e) => {
                    this.params.midiCCMappings[param].channel = parseInt(e.target.value) - 1;
                });
                ccInput.addEventListener('change', (e) => {
                    this.params.midiCCMappings[param].cc = parseInt(e.target.value);
                });
                targetSelect.addEventListener('change', (e) => {
                    this.params.midiCCMappings[param].target = e.target.value;
                });

                // Learn button logic for CC
                learnButton.addEventListener('click', () => {
                    if (learnButton.classList.contains('learning')) return;
                    learnButton.classList.add('learning');
                    learnStatus.textContent = 'Waiting for CC...';
                    const onCC = (controller, value, channel) => {
                        this.params.midiCCMappings[param].channel = channel;
                        this.params.midiCCMappings[param].cc = controller;
                        channelInput.value = channel + 1;
                        ccInput.value = controller;
                        learnButton.classList.remove('learning');
                        learnButton.classList.add('learned');
                        learnStatus.textContent = `Learned: Ch ${channel+1}, CC ${controller}`;
                        setTimeout(() => learnButton.classList.remove('learned'), 1500);
                        setTimeout(() => learnStatus.textContent = 'Click Learn', 2000);
                        this._learnCCHandler = null;
                        this.midiManager.offCC(onCC);
                    };
                    this._learnCCHandler = onCC;
                    this.midiManager.onCC(onCC);
                });
            }
        });
        
        // Set up note mapping inputs and learn buttons
        Object.keys(this.params.midiNoteMappings).forEach(param => {
            const channelInput = document.getElementById(`midi-${param}-channel`);
            const noteInput = document.getElementById(`midi-${param}-value`);
            const targetSelect = document.getElementById(`midi-${param}-target`);
            const learnButton = document.getElementById(`midi-${param}-learn`);
            const learnStatus = document.getElementById(`midi-${param}-learn-status`);
            
            if (channelInput && noteInput && targetSelect && learnButton && learnStatus) {
                // Convert internal channel (0-15) to UI channel (1-16)
                channelInput.value = this.params.midiNoteMappings[param].channel + 1;
                noteInput.value = this.params.midiNoteMappings[param].note;
                targetSelect.value = this.params.midiNoteMappings[param].target;
                
                channelInput.addEventListener('change', (e) => {
                    // Convert UI channel (1-16) to internal channel (0-15)
                    this.params.midiNoteMappings[param].channel = parseInt(e.target.value) - 1;
                });
                
                noteInput.addEventListener('change', (e) => {
                    this.params.midiNoteMappings[param].note = parseInt(e.target.value);
                });
                
                targetSelect.addEventListener('change', (e) => {
                    this.params.midiNoteMappings[param].target = e.target.value;
                });

                // Learn button logic for Note
                learnButton.addEventListener('click', () => {
                    if (learnButton.classList.contains('learning')) return;
                    learnButton.classList.add('learning');
                    learnStatus.textContent = 'Waiting for Note...';
                    const onNote = (note, velocity, isNoteOn, channel) => {
                        if (!isNoteOn) return;
                        this.params.midiNoteMappings[param].channel = channel;
                        this.params.midiNoteMappings[param].note = note;
                        channelInput.value = channel + 1;
                        noteInput.value = note;
                        learnButton.classList.remove('learning');
                        learnButton.classList.add('learned');
                        learnStatus.textContent = `Learned: Ch ${channel+1}, Note ${note}`;
                        setTimeout(() => learnButton.classList.remove('learned'), 1500);
                        setTimeout(() => learnStatus.textContent = 'Click Learn', 2000);
                        this._learnNoteHandler = null;
                        this.midiManager.offNote(onNote);
                    };
                    this._learnNoteHandler = onNote;
                    this.midiManager.onNote(onNote);
                });
            }
        });
        
        // Set up remove buttons for CC controls
        Object.keys(this.params.midiCCMappings).forEach(param => {
            const removeButton = document.getElementById(`midi-${param}-remove`);
            if (removeButton) {
                removeButton.addEventListener('click', () => {
                    this.removeCCControl(param);
                });
            }
        });
        
        // Set up remove buttons for Note controls
        Object.keys(this.params.midiNoteMappings).forEach(param => {
            const removeButton = document.getElementById(`midi-${param}-remove`);
            if (removeButton) {
                removeButton.addEventListener('click', () => {
                    this.removeNoteControl(param);
                });
            }
        });
        
        // Add new CC control button
        document.getElementById('add-cc-control').addEventListener('click', () => {
            this.addCCControl();
        });
        
        // Add new Note control button
        document.getElementById('add-note-control').addEventListener('click', () => {
            this.addNoteControl();
        });
        
        this.setupCollapsibleSections();
    }

    initializeControlManager() {
        console.log('Initializing control manager...');
        
        // Get the containers for CC and Note controls
        const ccSection = document.querySelector('[data-section="channel-mapping"]');
        const noteSection = document.querySelector('[data-section="note-controls"]');
        
        console.log('CC section found:', ccSection);
        console.log('Note section found:', noteSection);
        
        // The .midi-section-content divs have the data-section attribute directly
        const ccContainer = document.querySelector('.midi-section-content[data-section="channel-mapping"]');
        const noteContainer = document.querySelector('.midi-section-content[data-section="note-controls"]');
        
        console.log('CC container found:', ccContainer);
        console.log('Note container found:', noteContainer);
        
        if (!ccContainer || !noteContainer) {
            console.error('Could not find MIDI control containers');
            console.log('Available elements with data-section:');
            document.querySelectorAll('[data-section]').forEach(el => {
                console.log('-', el.getAttribute('data-section'), el);
            });
            return;
        }
        
        // Store containers for later use
        this.ccContainer = ccContainer;
        this.noteContainer = noteContainer;
        
        // Initialize the control manager with both containers
        this.controlManager = new MIDIControlManager(ccContainer, this);
        this.controlManager.noteContainer = noteContainer;
        
        console.log('Control manager initialized successfully');
        
        // Create initial controls from existing mappings
        this.recreateControlsFromPreset();
    }
    
    setupCollapsibleSections() {
        // Get all section toggles
        const toggles = document.querySelectorAll('.midi-section-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent header click event
                this.toggleSection(toggle);
            });
        });
        
        // Also allow clicking on the header to toggle
        const headers = document.querySelectorAll('.midi-section h4');
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                // Don't trigger if clicking on the toggle button
                if (e.target.classList.contains('midi-section-toggle')) {
                    return;
                }
                const toggle = header.querySelector('.midi-section-toggle');
                if (toggle) {
                    this.toggleSection(toggle);
                }
            });
        });
        
        // Load saved state from localStorage
        this.loadCollapsibleState();
    }
    
    toggleSection(toggle) {
        const sectionName = toggle.getAttribute('data-section');
        const content = document.querySelector(`.midi-section-content[data-section="${sectionName}"]`);
        
        if (content) {
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expand
                content.classList.remove('collapsed');
                toggle.classList.remove('collapsed');
                toggle.textContent = '▼';
            } else {
                // Collapse
                content.classList.add('collapsed');
                toggle.classList.add('collapsed');
                toggle.textContent = '▶';
            }
            
            // Save state to localStorage
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
        this.params.midiEnabled = true;
        this.midiManager.updateDeviceStatus();
    }

    onMIDIDisconnected() {
        const statusElement = document.getElementById('midi-status');
        statusElement.textContent = 'MIDI: Disconnected';
        statusElement.className = 'midi-disconnected';
        this.params.midiEnabled = false;
    }

    onMIDICC(controller, value, channel) {
        // Map MIDI CC values to parameters based on channel/CC pairs
        const normalizedValue = value / 127; // Normalize to 0-1
        
        // Find which parameter this channel/CC combination controls
        // Only check mappings that are currently visible in the UI
        Object.keys(this.params.midiCCMappings).forEach(param => {
            const mapping = this.params.midiCCMappings[param];
            if (mapping.channel === channel && mapping.cc === controller) {
                // Check if this mapping is currently visible in the UI
                const controlElement = document.querySelector(`[data-control-id="${param}"]`);
                if (!controlElement) {
                    // This mapping was removed from the UI, so ignore it
                    return;
                }
                
                // Handle the CC based on its target
                switch (mapping.target) {
                    case 'animationSpeed':
                        this.params.animationSpeed = 0.01 + normalizedValue * 2; // 0.01 to 2.01
                        break;
                    case 'movementAmplitude':
                        this.params.movementAmplitude = normalizedValue * 0.5; // 0 to 0.5
                        break;
                    case 'rotationAmplitude':
                        this.params.rotationAmplitude = normalizedValue * 2; // 0 to 2
                        break;
                    case 'scaleAmplitude':
                        this.params.scaleAmplitude = normalizedValue; // 0 to 1
                        break;
                    case 'randomness':
                        this.params.randomness = normalizedValue; // 0 to 1
                        // Don't regenerate grid - randomness only affects new shapes
                        break;
                    case 'cellSize':
                        this.params.cellSize = 0.5 + normalizedValue * 1.5; // 0.5 to 2
                        this.updateCellSize();
                        break;
                    case 'movementFrequency':
                        this.params.movementFrequency = 0.1 + normalizedValue * 2; // 0.1 to 2.1
                        break;
                    case 'rotationFrequency':
                        this.params.rotationFrequency = 0.1 + normalizedValue * 2; // 0.1 to 2.1
                        break;
                    case 'scaleFrequency':
                        this.params.scaleFrequency = 0.1 + normalizedValue * 2; // 0.1 to 2.1
                        break;
                    case 'gridWidth':
                        const newWidth = Math.floor(1 + normalizedValue * 29); // 1 to 30
                        if (this.params.gridWidth !== newWidth) {
                            this.params.gridWidth = newWidth;
                            this.createGrid();
                        }
                        break;
                    case 'gridHeight':
                        const newHeight = Math.floor(1 + normalizedValue * 29); // 1 to 30
                        if (this.params.gridHeight !== newHeight) {
                            this.params.gridHeight = newHeight;
                            this.createGrid();
                        }
                        break;
                    case 'compositionWidth':
                        const newCompWidth = Math.floor(1 + normalizedValue * 29); // 1 to 30
                        if (this.params.compositionWidth !== newCompWidth) {
                            this.params.compositionWidth = newCompWidth;
                            this.createGrid();
                        }
                        break;
                    case 'compositionHeight':
                        const newCompHeight = Math.floor(1 + normalizedValue * 29); // 1 to 30
                        if (this.params.compositionHeight !== newCompHeight) {
                            this.params.compositionHeight = newCompHeight;
                            this.createGrid();
                        }
                        break;
                    case 'animationType':
                        this.params.animationType = Math.floor(normalizedValue * 4); // 0 to 3
                        break;
                    case 'sphereRefraction':
                        this.params.sphereRefraction = normalizedValue * 2; // 0 to 2
                        this.updateSphereMaterials();
                        break;
                    case 'sphereTransparency':
                        this.params.sphereTransparency = normalizedValue; // 0 to 1
                        this.updateSphereMaterials();
                        break;
                    case 'sphereTransmission':
                        this.params.sphereTransmission = normalizedValue; // 0 to 1
                        this.updateSphereMaterials();
                        break;
                    case 'sphereRoughness':
                        this.params.sphereRoughness = normalizedValue; // 0 to 1
                        this.updateSphereMaterials();
                        break;
                    case 'sphereMetalness':
                        this.params.sphereMetalness = normalizedValue; // 0 to 1
                        this.updateSphereMaterials();
                        break;
                    case 'sphereScale':
                        this.params.sphereScale = 0.5 + normalizedValue * 2.5; // 0.5 to 3
                        this.updateSphereScales();
                        break;

                }
            }
        });
    }

    onMIDINote(note, velocity, isNoteOn, channel) {
        // Check if this note matches any of our configured note mappings
        let matchedMapping = null;
        let matchedMappingKey = null;
        
        Object.keys(this.params.midiNoteMappings).forEach(mappingKey => {
            const mapping = this.params.midiNoteMappings[mappingKey];
            if (mapping.note === note && mapping.channel === channel) {
                // Check if this mapping is currently visible in the UI
                const controlElement = document.querySelector(`[data-control-id="${mappingKey}"]`);
                if (controlElement) {
                    matchedMapping = mapping;
                    matchedMappingKey = mappingKey;
                }
            }
        });
        
        if (matchedMapping && isNoteOn && velocity > 0) {
            // Handle the note based on its target
            switch (matchedMapping.target) {
                case 'shapeCycling':
                    this.params.enableShapeCycling = !this.params.enableShapeCycling;
                    if (!this.params.enableShapeCycling) {
                        this.animationTime = 0;
                }
                break;
                case 'sizeAnimation':
                    this.params.enableSizeAnimation = !this.params.enableSizeAnimation;
                    if (!this.params.enableSizeAnimation) {
                        this.updateCellSize();
                }
                break;
                case 'showGrid':
                    this.params.showGrid = !this.params.showGrid;
                    this.updateGridLines();
                break;
                case 'enableShapeCycling':
                    this.params.enableShapeCycling = true;
                    break;
                case 'enableSizeAnimation':
                    this.params.enableSizeAnimation = true;
                    break;
                case 'enableMovementAnimation':
                    this.params.movementAmplitude = Math.max(0.1, this.params.movementAmplitude);
                    break;
                case 'enableRotationAnimation':
                    this.params.rotationAmplitude = Math.max(0.1, this.params.rotationAmplitude);
                    break;
                case 'enableScaleAnimation':
                    this.params.scaleAmplitude = Math.max(0.1, this.params.scaleAmplitude);
                    break;
                case 'resetAnimation':
                    this.animationTime = 0;
                    this.pulseTime = 0;
                    break;
                case 'togglePause':
                    // You could add a pause parameter to params if needed
                    console.log('Toggle pause functionality - implement as needed');
                    break;
                case 'toggleBasicShapes':
                    this.params.enabledShapes['Basic Shapes'] = !this.params.enabledShapes['Basic Shapes'];
                    this.createGrid();
                    break;
                case 'toggleTriangles':
                    this.params.enabledShapes['Triangles'] = !this.params.enabledShapes['Triangles'];
                    this.createGrid();
                    break;
                case 'toggleRectangles':
                    this.params.enabledShapes['Rectangles'] = !this.params.enabledShapes['Rectangles'];
                    this.createGrid();
                    break;
                case 'toggleEllipses':
                    this.params.enabledShapes['Ellipses'] = !this.params.enabledShapes['Ellipses'];
                    this.createGrid();
                    break;
                case 'toggleRefractiveSpheres':
                    this.params.enabledShapes['Refractive Spheres'] = !this.params.enabledShapes['Refractive Spheres'];
                    this.createGrid();
                    break;
            }
        } else if (isNoteOn && velocity > 0) {
                // Note received but no mapping found - do nothing
                // Removed automatic cell size control
        }
    }

    onMIDIPitchBend(value) {
        // Use pitch bend to control animation type
        const animationType = Math.floor(value * 4); // 0-3
        if (this.params.animationType !== animationType) {
            this.params.animationType = animationType;
        }
    }

    onMIDIAftertouch(value) {
        // Use aftertouch to control color intensity
        const intensity = Math.floor(value * 255);
        const color = `#${intensity.toString(16).padStart(2, '0')}${intensity.toString(16).padStart(2, '0')}${intensity.toString(16).padStart(2, '0')}`;
        this.params.shapeColor = color;
        // Removed createGrid() call to prevent composition regeneration
    }

    handleKeyDown(event) {
        // Keyboard shortcuts for testing MIDI functionality
        switch (event.key) {
            case '1':
                this.params.animationSpeed = Math.min(2, this.params.animationSpeed + 0.1);
                break;
            case '2':
                this.params.animationSpeed = Math.max(0.01, this.params.animationSpeed - 0.1);
                break;
            case '3':
                this.params.movementAmplitude = Math.min(0.5, this.params.movementAmplitude + 0.05);
                break;
            case '4':
                this.params.movementAmplitude = Math.max(0, this.params.movementAmplitude - 0.05);
                break;
            case '5':
                this.params.rotationAmplitude = Math.min(2, this.params.rotationAmplitude + 0.1);
                break;
            case '6':
                this.params.rotationAmplitude = Math.max(0, this.params.rotationAmplitude - 0.1);
                break;
            case '7':
                this.params.scaleAmplitude = Math.min(1, this.params.scaleAmplitude + 0.05);
                break;
            case '8':
                this.params.scaleAmplitude = Math.max(0, this.params.scaleAmplitude - 0.05);
                break;
            case 's':
                this.params.enableShapeCycling = !this.params.enableShapeCycling;
                if (!this.params.enableShapeCycling) {
                    this.animationTime = 0;
                }
                break;
            case 'a':
                this.params.enableSizeAnimation = !this.params.enableSizeAnimation;
                if (!this.params.enableSizeAnimation) {
                    this.updateCellSize();
                }
                break;
            case 'g':
                this.params.showGrid = !this.params.showGrid;
                this.updateGridLines();
                break;
            case 'r':
                this.params.randomness = Math.random();
                this.createGrid();
                break;
            case 'c':
                // Cycle through animation types
                this.params.animationType = (this.params.animationType + 1) % 4;
                break;
        }
    }

    setupGUI() {
        if (this.gui) this.gui.destroy();
        this.gui = new GUI({ container: document.getElementById('gui-container') });
        
        // Debug: Check if GUI container exists
        const container = document.getElementById('gui-container');
        if (!container) {
            console.error('GUI container not found!');
            return;
        }
        console.log('GUI setup started');

        // Shape controls
        const shapeFolder = this.gui.addFolder('Shapes');
        shapeFolder.add(this.params, 'gridWidth', 1, 30, 1).name('Display Width').onChange(() => {
            this.createGrid();
            // Reset animation time when grid changes to avoid visual jumps
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        shapeFolder.add(this.params, 'gridHeight', 1, 30, 1).name('Display Height').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        shapeFolder.add(this.params, 'cellSize', 0.5, 2, 0.01).name('Cell Size').onChange(() => this.updateCellSize());
        shapeFolder.add(this.params, 'randomness', 0, 1, 0.01).name('Randomness').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        
        // Composition controls
        const compositionFolder = this.gui.addFolder('Composition');
        compositionFolder.add(this.params, 'compositionWidth', 1, 30, 1).name('Composition Width').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        compositionFolder.add(this.params, 'compositionHeight', 1, 30, 1).name('Composition Height').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        compositionFolder.open();
        
        // Add shape selection controls
        const shapeSelectionFolder = shapeFolder.addFolder('Shape Selection');
        Object.keys(this.params.enabledShapes).forEach(shapeName => {
            shapeSelectionFolder.add(this.params.enabledShapes, shapeName).onChange(() => {
                // Recreate composition when shape categories change
                this.createGrid();
                if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                    this.animationTime = 0;
                }
            });
        });
        shapeSelectionFolder.open();
        
        shapeFolder.open();

        // Grid controls
        const gridFolder = this.gui.addFolder('Grid');
        gridFolder.add(this.params, 'showGrid').name('Show Grid Lines').onChange(() => this.updateGridLines());
        gridFolder.open();

        // Color controls
        const colorFolder = this.gui.addFolder('Colors');
        colorFolder.addColor(this.params, 'shapeColor').name('Shape Color').onChange(() => {
            // Update color immediately for animated shapes
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                // Color will be updated in next animation frame
            } else {
                this.updateShapeColors();
            }
        });
        colorFolder.addColor(this.params, 'backgroundColor').name('Background').onChange((v) => {
            this.renderer.setClearColor(new THREE.Color(v));
            this.createGrid();
        });
        colorFolder.open();

        // Refractive sphere controls
        const sphereFolder = this.gui.addFolder('Refractive Spheres');
        sphereFolder.add(this.params, 'sphereRefraction', 0.0, 2.0, 0.01).name('Refraction Index').onChange(() => {
            this.updateSphereMaterials();
        });
        sphereFolder.add(this.params, 'sphereTransparency', 0.0, 1.0, 0.01).name('Transparency').onChange(() => {
            this.updateSphereMaterials();
        });
        sphereFolder.add(this.params, 'sphereTransmission', 0.0, 1.0, 0.01).name('Transmission').onChange(() => {
            this.updateSphereMaterials();
        });
        sphereFolder.add(this.params, 'sphereRoughness', 0.0, 1.0, 0.01).name('Roughness').onChange(() => {
            this.updateSphereMaterials();
        });
        sphereFolder.add(this.params, 'sphereMetalness', 0.0, 1.0, 0.01).name('Metalness').onChange(() => {
            this.updateSphereMaterials();
        });
        sphereFolder.add(this.params, 'sphereScale', 0.5, 3.0, 0.1).name('Sphere Scale').onChange(() => {
            this.updateSphereScales();
        });
        sphereFolder.open();

        // Animation controls
        const animationFolder = this.gui.addFolder('Animation');
        animationFolder.open();
        
        // Main controls
        animationFolder.add(this.params, 'animationSpeed', 0.01, 2, 0.01).name('Global Speed');
        
        // Animation type selector with dynamic parameter visibility
        const animationTypeController = animationFolder.add(this.params, 'animationType', 0, 3, 1).name('Animation Type');
        
        // MIDI controls
        const midiFolder = this.gui.addFolder('MIDI');
        midiFolder.add(this.params, 'midiEnabled').name('MIDI Enabled').onChange((value) => {
            if (value && this.midiManager) {
                this.midiManager.connect();
            } else if (this.midiManager) {
                this.midiManager.disconnect();
            }
        });
        midiFolder.add(this.params, 'midiChannel', -1, 15, 1).name('MIDI Channel (-1 = All)');
        midiFolder.open();
        
        // Effect toggles
        animationFolder.add(this.params, 'enableShapeCycling').name('Shape Cycling').onChange(() => {
            this.animationTime = 0;
        });
        animationFolder.add(this.params, 'enableSizeAnimation').name('Size/Movement').onChange(() => {
            if (!this.params.enableSizeAnimation) {
                this.updateCellSize();
            }
        });
        
        // Movement parameters
        const movementAmpController = animationFolder.add(this.params, 'movementAmplitude', 0.01, 0.5, 0.01).name('Movement Amp');
        const movementFreqController = animationFolder.add(this.params, 'movementFrequency', 0.1, 2, 0.1).name('Movement Freq');
        
        // Rotation parameters
        const rotationAmpController = animationFolder.add(this.params, 'rotationAmplitude', 0.01, 2, 0.01).name('Rotation Amp');
        const rotationFreqController = animationFolder.add(this.params, 'rotationFrequency', 0.1, 2, 0.1).name('Rotation Freq');
        
        // Scale parameters
        const scaleAmpController = animationFolder.add(this.params, 'scaleAmplitude', 0.01, 1, 0.01).name('Scale Amp');
        const scaleFreqController = animationFolder.add(this.params, 'scaleFrequency', 0.1, 2, 0.1).name('Scale Freq');
        
        // Function to update parameter visibility based on animation type
        const updateParameterVisibility = () => {
            const animationType = this.params.animationType;
            
            // Movement parameters (visible for Movement and Combined)
            const showMovement = animationType === 0 || animationType === 3;
            if (movementAmpController.domElement) {
                const movementAmpRow = movementAmpController.domElement.parentElement.parentElement;
                movementAmpRow.style.display = showMovement ? 'flex' : 'none';
            }
            if (movementFreqController.domElement) {
                const movementFreqRow = movementFreqController.domElement.parentElement.parentElement;
                movementFreqRow.style.display = showMovement ? 'flex' : 'none';
            }
            
            // Rotation parameters (visible for Rotation and Combined)
            const showRotation = animationType === 1 || animationType === 3;
            if (rotationAmpController.domElement) {
                const rotationAmpRow = rotationAmpController.domElement.parentElement.parentElement;
                rotationAmpRow.style.display = showRotation ? 'flex' : 'none';
            }
            if (rotationFreqController.domElement) {
                const rotationFreqRow = rotationFreqController.domElement.parentElement.parentElement;
                rotationFreqRow.style.display = showRotation ? 'flex' : 'none';
            }
            
            // Scale parameters (visible for Scale and Combined)
            const showScale = animationType === 2 || animationType === 3;
            if (scaleAmpController.domElement) {
                const scaleAmpRow = scaleAmpController.domElement.parentElement.parentElement;
                scaleAmpRow.style.display = showScale ? 'flex' : 'none';
            }
            if (scaleFreqController.domElement) {
                const scaleFreqRow = scaleFreqController.domElement.parentElement.parentElement;
                scaleFreqRow.style.display = showScale ? 'flex' : 'none';
            }
        };
        
        // Set up the change listener for animation type
        animationTypeController.onChange(() => {
            updateParameterVisibility();
        });
        
        // Initialize visibility
        updateParameterVisibility();
        
        console.log('GUI setup completed');
    }

    createGrid() {
        // Remove old shapes
        for (const mesh of this.shapes) {
            this.scene.remove(mesh);
        }
        this.shapes = [];
        // Remove old grid lines
        if (this.gridLines) {
            for (const line of this.gridLines) {
                this.scene.remove(line);
            }
        }
        this.gridLines = [];

        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        const halfCompW = this.params.compositionWidth / 2;
        const halfCompH = this.params.compositionHeight / 2;
        const black = 0x000000;
        const material = new THREE.MeshBasicMaterial({ color: this.params.shapeColor, side: THREE.DoubleSide });
        const white = 0xffffff;

        // Helper: map OpenFrameworks ptX names to cell coordinates
        function getPt(name) {
            const c = 1; // Use fixed size of 1 for shape generation
            const map = {
                pt1: [-c/2, -c/2], pt1_25: [-c/2 + 0.25*c, -c/2], pt1_50: [-c/2 + 0.5*c, -c/2], pt1_75: [-c/2 + 0.75*c, -c/2],
                pt2: [c/2, -c/2], pt2_25: [c/2, -c/2 + 0.25*c], pt2_50: [c/2, -c/2 + 0.5*c], pt2_75: [c/2, -c/2 + 0.75*c],
                pt3: [c/2, c/2], pt3_25: [c/2 - 0.25*c, c/2], pt3_50: [c/2 - 0.5*c, c/2], pt3_75: [c/2 - 0.75*c, c/2],
                pt4: [-c/2, c/2], pt4_25: [-c/2, c/2 - 0.25*c], pt4_50: [-c/2, c/2 - 0.5*c], pt4_75: [-c/2, c/2 - 0.75*c],
                center: [0, 0],
            };
            return new THREE.Vector2(...map[name]);
        }

        // Complete set of shape generators for ofApp shapes
        const shapeGenerators = {
            // Triangles
            triangle_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3_50'), getPt('pt1')]),
            triangle_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2_50'), getPt('pt4')]),
            triangle_LEFT: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4_50'), getPt('pt2')]),
            triangle_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt2_50'), getPt('pt1')]),
            triangle_TL: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4'), getPt('pt1')]),
            triangle_BL: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt1')]),
            triangle_TR: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt1')]),
            triangle_BR: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt2')]),
            triangle_split_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt1_50'), getPt('pt3'), getPt('pt2'), getPt('pt1')]),
            triangle_split_DOWN: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt3_50'), getPt('pt1')]),
            triangle_split_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4_50'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_split_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt2_50'), getPt('pt1')]),
            triangle_IN_V: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4'), getPt('pt3'), getPt('pt1')]),
            triangle_IN_H: () => new THREE.Shape([getPt('pt1'), getPt('pt3'), getPt('pt2'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_IN_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt1_75'), getPt('center'), getPt('pt1_25'), getPt('pt1'), getPt('pt4')]),
            triangle_neg_IN_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt3_25'), getPt('center'), getPt('pt3_75'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_IN_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt4_25'), getPt('center'), getPt('pt4_75'), getPt('pt1')]),
            triangle_neg_IN_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt2_25'), getPt('center'), getPt('pt2_75'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('center'), getPt('pt1'), getPt('pt4')]),
            triangle_neg_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('center'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('center'), getPt('pt1')]),
            triangle_neg_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('center'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_bottom_LEFT: () => new THREE.Shape([getPt('pt4_75'), getPt('pt1_50'), getPt('pt3_50'), getPt('pt4_25'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt1'), getPt('pt4_75')]),
            triangle_bottom_DOWN: () => new THREE.Shape([getPt('pt3_75'), getPt('pt4_50'), getPt('pt2_50'), getPt('pt3_25'), getPt('pt3'), getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt3_75')]),
            triangle_bottom_RIGHT: () => new THREE.Shape([getPt('pt2_25'), getPt('pt1_50'), getPt('pt3_50'), getPt('pt2_75'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt2'), getPt('pt2_25')]),
            triangle_bottom_UP: () => new THREE.Shape([getPt('pt1_25'), getPt('pt4_50'), getPt('pt2_50'), getPt('pt1_75'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt1_25')]),
            triangle_edge_BOTTOM: () => new THREE.Shape([getPt('pt4_50'), getPt('pt3_50'), getPt('pt2_50'), getPt('pt3'), getPt('pt4'), getPt('pt4_50')]),
            triangle_edge_TOP: () => new THREE.Shape([getPt('pt4_50'), getPt('pt1_50'), getPt('pt2_50'), getPt('pt2'), getPt('pt1'), getPt('pt4_50')]),
            triangle_edge_LEFT: () => new THREE.Shape([getPt('pt4_50'), getPt('pt1_50'), getPt('pt1'), getPt('pt4'), getPt('pt3_50'), getPt('pt4_50')]),
            triangle_edge_RIGHT: () => new THREE.Shape([getPt('pt1_50'), getPt('pt2_50'), getPt('pt3_50'), getPt('pt3'), getPt('pt2'), getPt('pt1_50')]),
            // Rectangles
            Rect: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            longRect_V: () => new THREE.Shape([getPt('pt1_25'), getPt('pt1_75'), getPt('pt3_25'), getPt('pt3_75'), getPt('pt1_25')]),
            longRect_H: () => new THREE.Shape([getPt('pt4_75'), getPt('pt2_25'), getPt('pt2_75'), getPt('pt4_25'), getPt('pt4_75')]),
            rect_TL: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt4_50'), getPt('center'), getPt('pt1_50'), getPt('pt2')]),
            rect_TR: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt2_50'), getPt('center'), getPt('pt1_50'), getPt('pt1')]),
            rect_BL: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt3_50'), getPt('center'), getPt('pt4_50'), getPt('pt1')]),
            rect_BR: () => new THREE.Shape([getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt3_50'), getPt('center'), getPt('pt2_50'), getPt('pt2')]),
            rect_angled_TOP: () => new THREE.Shape([getPt('pt4_50'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt4_50')]),
            rect_angled_BOTTOM: () => new THREE.Shape([getPt('pt2_50'), getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt2_50')]),
            rect_angled_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt3_50'), getPt('pt3'), getPt('pt2'), getPt('pt1')]),
            rect_angled_RIGHT: () => new THREE.Shape([getPt('pt1_50'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt1_50')]),
            // Diamond
            diamond: () => new THREE.Shape([getPt('pt1_50'), getPt('pt2'), getPt('pt3_50'), getPt('pt4'), getPt('pt1_50')]),
            // Ellipses (approximate with circle or ellipse)
            ellipse: () => {
                const shape = new THREE.Shape();
                shape.absellipse(0, 0, 0.5, 0.5, 0, Math.PI * 2, false, 0);
                return shape;
            },
            // Negative ellipse (black square with circle cutout)
            ellipse_neg: () => {
                const shape = new THREE.Shape();
                // Create outer square boundary
                shape.moveTo(-0.5, -0.5);
                shape.lineTo(0.5, -0.5);
                shape.lineTo(0.5, 0.5);
                shape.lineTo(-0.5, 0.5);
                shape.lineTo(-0.5, -0.5);
                
                // Create inner circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
                shape.holes.push(hole);
                
                return shape;
            },
            // Quarter ellipses (solid, each corner)
            ellipse_BL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_BR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_TL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_TR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            // Semi-ellipses (solid, each direction)
            ellipse_semi_UP: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI, 0, false);
                shape.lineTo(0, 0);
                shape.lineTo(-0.5, 0);
                return shape;
            },
            ellipse_semi_DOWN: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, 0, Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0.5, 0);
                return shape;
            },
            ellipse_semi_LEFT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, 0.5);
                return shape;
            },
            ellipse_semi_RIGHT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, -0.5);
                return shape;
            },
            // Negative quarter ellipses (black with circle cutout, each corner)
            ellipse_neg_BL: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, Math.PI, 1.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_neg_BR: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 1.5 * Math.PI, 2 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_neg_TL: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0.5 * Math.PI, Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_neg_TR: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0, 0.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            // Negative semi-ellipses (black with circle cutout, each direction)
            ellipse_semi_neg_UP: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, Math.PI, 0, false);
                shape.lineTo(0, 0);
                shape.lineTo(-0.5, 0);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI, 0, false);
                hole.lineTo(0, 0);
                hole.lineTo(-0.35, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_DOWN: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, 0, Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0.5, 0);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, 0, Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0.35, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_LEFT: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, 0.5);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI/2, 1.5*Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, 0.35);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_RIGHT: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, -0.5);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, -Math.PI/2, Math.PI/2, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, -0.35);
                shape.holes.push(hole);
                
                return shape;
            },
            // Refractive sphere shapes
            sphere_full: () => new THREE.SphereGeometry(0.5, 32, 32),
            sphere_small: () => new THREE.SphereGeometry(0.3, 24, 24),
            sphere_large: () => new THREE.SphereGeometry(0.7, 48, 48),
            sphere_rough: () => new THREE.SphereGeometry(0.5, 16, 16),
            sphere_smooth: () => new THREE.SphereGeometry(0.5, 64, 64),
            sphere_water: () => new THREE.SphereGeometry(0.5, 48, 48),
            sphere_glass: () => new THREE.SphereGeometry(0.5, 32, 32),
            sphere_bubble: () => new THREE.SphereGeometry(0.4, 24, 24)
        };

        // List of shape names to use (from ofApp)
        const ofAppShapes = Object.keys(shapeGenerators);

        // Create the composition first
        this.composition = [];
        for (let x = 0; x < this.params.compositionWidth; x++) {
            for (let y = 0; y < this.params.compositionHeight; y++) {
                let shapeName;
                const enabledShapes = ofAppShapes.filter(shapeName => {
                    const category = this.getShapeCategory(shapeName);
                    return this.params.enabledShapes[category];
                });
                
                // Debug: Show available shapes
                if (x === 0 && y === 0) {
                    console.log('Available shapes:', enabledShapes);
                }
                
                if (enabledShapes.length === 0) {
                    shapeName = 'Rect'; // Default shape
                } else {
                    const useRandomShape = Math.random() < this.params.randomness;
                    shapeName = useRandomShape ? 
                        enabledShapes[Math.floor(Math.random() * enabledShapes.length)] :
                        enabledShapes[0];
                }
                this.composition.push(shapeName);
            }
        }

        // Now create the display grid
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                let mesh;
                // Map display coordinates to composition coordinates
                const compX = Math.floor((x / gridWidth) * this.params.compositionWidth);
                const compY = Math.floor((y / gridHeight) * this.params.compositionHeight);
                const shapeIndex = compY * this.params.compositionWidth + compX;
                const shapeName = this.composition[shapeIndex] || 'Rect'; // Fallback to Rect if undefined

                if (shapeGenerators[shapeName]) {
                    const shapeObj = shapeGenerators[shapeName]();
                    if (shapeObj instanceof THREE.Group) {
                        mesh = shapeObj;
                        mesh.traverse((child) => {
                            if (child.material && child.material.color) {
                                if (child.material.color.getHexString() !== 'ffffff') {
                                    child.material.color.set(this.params.shapeColor);
                                }
                            }
                        });
                    } else if (shapeObj instanceof THREE.Shape) {
                        mesh = new THREE.Mesh(
                            new THREE.ShapeGeometry(shapeObj),
                            material.clone()
                        );
                    } else if (shapeObj instanceof THREE.BufferGeometry) {
                        // Handle sphere geometries with refractive materials
                        let sphereMaterial;
                        if (shapeName.startsWith('sphere_')) {
                            const envMap = this.createEnvironmentMap();
                            sphereMaterial = new THREE.MeshPhysicalMaterial({
                                color: this.params.shapeColor,
                                transparent: true,
                                opacity: this.params.sphereTransparency,
                                roughness: this.params.sphereRoughness,
                                metalness: this.params.sphereMetalness,
                                ior: this.params.sphereRefraction, // Index of refraction
                                transmission: this.params.sphereTransmission, // Transmission for refraction
                                thickness: 0.5, // Material thickness
                                envMap: envMap, // Environment map for refraction
                                envMapIntensity: 1.0,
                                side: THREE.DoubleSide
                            });
                        } else {
                            sphereMaterial = material.clone();
                        }
                        mesh = new THREE.Mesh(shapeObj, sphereMaterial);
                        
                        // Enable shadows for spheres
                        if (shapeName.startsWith('sphere_')) {
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                            // Apply sphere scale
                            const cellSize = this.params.cellSize;
                            const sphereScale = cellSize * this.params.sphereScale;
                            mesh.scale.set(sphereScale, sphereScale, sphereScale);
                        }
                    } else {
                        mesh = new THREE.Mesh(
                            new THREE.PlaneGeometry(1, 1),
                            material.clone()
                        );
                    }
                } else {
                    mesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(1, 1),
                        material.clone()
                    );
                }

                // Position the shape
                mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                
                // Scale the shape
                if (shapeName.startsWith('sphere_')) {
                    // Apply sphere scale factor for spheres
                    const sphereScale = cellSize * this.params.sphereScale;
                    mesh.scale.set(sphereScale, sphereScale, sphereScale);
                } else {
                mesh.scale.set(cellSize, cellSize, 1);
                }

                this.scene.add(mesh);
                this.shapes.push(mesh);
            }
        }

        // Draw red grid lines for visual debugging if enabled
        if (this.params.showGrid) {
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
            // Vertical lines
            for (let i = 0; i <= gridWidth; i++) {
                const x = (i - halfGridW) * cellSize;
                const points = [
                    new THREE.Vector3(x, -halfGridH * cellSize, 1),
                    new THREE.Vector3(x, halfGridH * cellSize, 1)
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.scene.add(line);
                this.gridLines.push(line);
            }
            // Horizontal lines
            for (let j = 0; j <= gridHeight; j++) {
                const y = (j - halfGridH) * cellSize;
                const points = [
                    new THREE.Vector3(-halfGridW * cellSize, y, 1),
                    new THREE.Vector3(halfGridW * cellSize, y, 1)
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.scene.add(line);
                this.gridLines.push(line);
            }
        }

        // At the end of createGrid, call updateGridLines to ensure grid lines are correct
        this.updateGridLines();
        // After creating grid, update cell size to ensure positions/scales are correct
        this.updateCellSize();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update animation time
        if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
            this.animationTime += this.clock.getDelta() * this.params.animationSpeed;
            
            // Apply animations to shapes
            this.animateShapes();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    animateShapes() {
        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        // Get available shapes based on enabled categories
        const availableShapes = this.getAvailableShapes();
        if (availableShapes.length === 0) return;
        
        // Update material color for all shapes
        const material = new THREE.MeshBasicMaterial({ 
            color: this.params.shapeColor, 
            side: THREE.DoubleSide 
        });
        
        // Create refractive material for spheres with environment map
        const envMap = this.createEnvironmentMap();
        const sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: this.params.shapeColor,
            transparent: true,
            opacity: this.params.sphereTransparency,
            roughness: this.params.sphereRoughness,
            metalness: this.params.sphereMetalness,
            ior: this.params.sphereRefraction, // Index of refraction
            transmission: this.params.sphereTransmission, // Transmission for refraction
            thickness: 0.5, // Material thickness
            envMap: envMap, // Environment map for refraction
            envMapIntensity: 1.0,
            side: THREE.DoubleSide 
        });
        
        let shapeIndex = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[shapeIndex];
                if (mesh) {
                    // Update material based on shape type
                    if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                        mesh.material = sphereMaterial;
                    } else {
                    mesh.material = material;
                    }
                    
                    // Shape cycling (independent of size/movement animations)
                    if (this.params.enableShapeCycling) {
                        this.cycleShapeInCell(mesh, x, y, availableShapes);
                    }
                    
                    // Size/movement animations (independent of shape cycling)
                    if (this.params.enableSizeAnimation) {
                        // Apply different animation types
                        switch (this.params.animationType) {
                            case 0: // Movement
                                const xOffset = Math.sin(this.animationTime * this.params.movementFrequency + x * 0.5) * this.params.movementAmplitude * cellSize;
                                const yOffset = Math.cos(this.animationTime * this.params.movementFrequency + y * 0.5) * this.params.movementAmplitude * cellSize;
                                mesh.position.x = (x - halfGridW + 0.5) * cellSize + xOffset;
                                mesh.position.y = (y - halfGridH + 0.5) * cellSize + yOffset;
                                break;
                            case 1: // Rotation
                                mesh.rotation.z = Math.sin(this.animationTime * this.params.rotationFrequency + x * 0.3 + y * 0.3) * this.params.rotationAmplitude;
                                break;
                            case 2: // Scale
                                const scale = 1 + Math.sin(this.animationTime * this.params.scaleFrequency + x * 0.5 + y * 0.5) * this.params.scaleAmplitude;
                                if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                                    const sphereScale = cellSize * this.params.sphereScale * scale;
                                    mesh.scale.set(sphereScale, sphereScale, sphereScale);
                                } else {
                                mesh.scale.set(cellSize * scale, cellSize * scale, 1);
                                }
                                break;
                            case 3: // Combined effects
                                const combinedXOffset = Math.sin(this.animationTime * this.params.movementFrequency + x * 0.5) * this.params.movementAmplitude * cellSize;
                                const combinedYOffset = Math.cos(this.animationTime * this.params.movementFrequency + y * 0.5) * this.params.movementAmplitude * cellSize;
                                const combinedRotation = Math.sin(this.animationTime * this.params.rotationFrequency + x * 0.3 + y * 0.3) * this.params.rotationAmplitude;
                                const combinedScale = 1 + Math.sin(this.animationTime * this.params.scaleFrequency + x * 0.5 + y * 0.5) * this.params.scaleAmplitude;
                                mesh.position.x = (x - halfGridW + 0.5) * cellSize + combinedXOffset;
                                mesh.position.y = (y - halfGridH + 0.5) * cellSize + combinedYOffset;
                                mesh.rotation.z = combinedRotation;
                                if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                                    const sphereScale = cellSize * this.params.sphereScale * combinedScale;
                                    mesh.scale.set(sphereScale, sphereScale, sphereScale);
                                } else {
                                mesh.scale.set(cellSize * combinedScale, cellSize * combinedScale, 1);
                                }
                                break;
                        }
                    } else {
                        // Reset to original positions when size animation is disabled
                        mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                        mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                        mesh.rotation.z = 0;
                        if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                            const sphereScale = cellSize * this.params.sphereScale;
                            mesh.scale.set(sphereScale, sphereScale, sphereScale);
                        } else {
                        mesh.scale.set(cellSize, cellSize, 1);
                        }
                    }
                }
                shapeIndex++;
            }
        }
    }
    
    cycleShapeInCell(mesh, x, y, availableShapes) {
        let newShapeName;
        
        // For shape cycling, we want to cycle through available shapes over time
        // Use a combination of position and time to create unique cycling patterns
        const cellSeed = x * 1000 + y * 100;
        const timeOffset = this.animationTime * this.params.animationSpeed;
        const shapeIndex = Math.floor(
            Math.abs(Math.sin(timeOffset + cellSeed * 0.1)) * availableShapes.length
        ) % availableShapes.length;
        
        newShapeName = availableShapes[shapeIndex];
        
        // Only update if the shape has changed
        if (mesh.userData.currentShape !== newShapeName) {
            this.updateMeshShape(mesh, newShapeName);
            mesh.userData.currentShape = newShapeName;
        }
    }
    
    updateMeshShape(mesh, shapeName) {
        let material;
        
        // Use refractive materials for spheres
        if (shapeName.startsWith('sphere_')) {
            const envMap = this.createEnvironmentMap();
            material = new THREE.MeshPhysicalMaterial({
            color: this.params.shapeColor, 
                transparent: true,
                opacity: this.params.sphereTransparency,
                roughness: this.params.sphereRoughness,
                metalness: this.params.sphereMetalness,
                ior: this.params.sphereRefraction, // Index of refraction
                transmission: this.params.sphereTransmission, // Transmission for refraction
                thickness: 0.5, // Material thickness
                envMap: envMap, // Environment map for refraction
                envMapIntensity: 1.0,
            side: THREE.DoubleSide 
        });
        } else {
            material = new THREE.MeshBasicMaterial({ 
                color: this.params.shapeColor, 
                side: THREE.DoubleSide 
            });
        }
        
        // Use the same shape generation system as createGrid
        const shapeObj = this.generateShape(shapeName);
        
        if (shapeObj) {
            let newGeometry;
            
            if (shapeObj instanceof THREE.Group) {
                // For group shapes, use the first child's geometry
                newGeometry = shapeObj.children[0].geometry;
            } else if (shapeObj instanceof THREE.Shape) {
                newGeometry = new THREE.ShapeGeometry(shapeObj);
            } else if (shapeObj instanceof THREE.BufferGeometry) {
                // For sphere geometries
                newGeometry = shapeObj;
            } else {
                // Fallback to plane geometry
                newGeometry = new THREE.PlaneGeometry(1, 1);
            }
            
            // Update the mesh geometry
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            mesh.geometry = newGeometry;
            mesh.material = material;
            
            // Enable shadows for spheres
            if (shapeName.startsWith('sphere_')) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                // Apply sphere scale
                const cellSize = this.params.cellSize;
                const sphereScale = cellSize * this.params.sphereScale;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            }
        } else {
            // Fallback to plane geometry if shape generation fails
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            mesh.geometry = new THREE.PlaneGeometry(1, 1);
            mesh.material = material;
        }
    }
    
    generateShape(shapeName) {
        // Helper: map OpenFrameworks ptX names to cell coordinates
        function getPt(name) {
            const c = 1; // Use fixed size of 1 for shape generation
            const map = {
                pt1: [-c/2, -c/2], pt1_25: [-c/2 + 0.25*c, -c/2], pt1_50: [-c/2 + 0.5*c, -c/2], pt1_75: [-c/2 + 0.75*c, -c/2],
                pt2: [c/2, -c/2], pt2_25: [c/2, -c/2 + 0.25*c], pt2_50: [c/2, -c/2 + 0.5*c], pt2_75: [c/2, -c/2 + 0.75*c],
                pt3: [c/2, c/2], pt3_25: [c/2 - 0.25*c, c/2], pt3_50: [c/2 - 0.5*c, c/2], pt3_75: [c/2 - 0.75*c, c/2],
                pt4: [-c/2, c/2], pt4_25: [-c/2, c/2 - 0.25*c], pt4_50: [-c/2, c/2 - 0.5*c], pt4_75: [-c/2, c/2 - 0.75*c],
                center: [0, 0],
            };
            return new THREE.Vector2(...map[name]);
        }

        const shapeGenerators = {
            // Triangles
            triangle_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3_50'), getPt('pt1')]),
            triangle_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2_50'), getPt('pt4')]),
            triangle_LEFT: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4_50'), getPt('pt2')]),
            triangle_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt2_50'), getPt('pt1')]),
            triangle_TL: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4'), getPt('pt1')]),
            triangle_BL: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt1')]),
            triangle_TR: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt1')]),
            triangle_BR: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt2')]),
            triangle_split_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt1_50'), getPt('pt3'), getPt('pt2'), getPt('pt1')]),
            triangle_split_DOWN: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt3_50'), getPt('pt1')]),
            triangle_split_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4_50'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_split_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt2_50'), getPt('pt1')]),
            triangle_IN_V: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4'), getPt('pt3'), getPt('pt1')]),
            triangle_IN_H: () => new THREE.Shape([getPt('pt1'), getPt('pt3'), getPt('pt2'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_IN_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt1_75'), getPt('center'), getPt('pt1_25'), getPt('pt1'), getPt('pt4')]),
            triangle_neg_IN_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt3_25'), getPt('center'), getPt('pt3_75'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_IN_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt4_25'), getPt('center'), getPt('pt4_75'), getPt('pt1')]),
            triangle_neg_IN_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt2_25'), getPt('center'), getPt('pt2_75'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('center'), getPt('pt1'), getPt('pt4')]),
            triangle_neg_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('center'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('center'), getPt('pt1')]),
            triangle_neg_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('center'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_bottom_LEFT: () => new THREE.Shape([getPt('pt4_75'), getPt('pt1_50'), getPt('pt3_50'), getPt('pt4_25'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt1'), getPt('pt4_75')]),
            triangle_bottom_DOWN: () => new THREE.Shape([getPt('pt3_75'), getPt('pt4_50'), getPt('pt2_50'), getPt('pt3_25'), getPt('pt3'), getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt3_75')]),
            triangle_bottom_RIGHT: () => new THREE.Shape([getPt('pt2_25'), getPt('pt1_50'), getPt('pt3_50'), getPt('pt2_75'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt2'), getPt('pt2_25')]),
            triangle_bottom_UP: () => new THREE.Shape([getPt('pt1_25'), getPt('pt4_50'), getPt('pt2_50'), getPt('pt1_75'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt1_25')]),
            triangle_edge_BOTTOM: () => new THREE.Shape([getPt('pt4_50'), getPt('pt3_50'), getPt('pt2_50'), getPt('pt3'), getPt('pt4'), getPt('pt4_50')]),
            triangle_edge_TOP: () => new THREE.Shape([getPt('pt4_50'), getPt('pt1_50'), getPt('pt2_50'), getPt('pt2'), getPt('pt1'), getPt('pt4_50')]),
            triangle_edge_LEFT: () => new THREE.Shape([getPt('pt4_50'), getPt('pt1_50'), getPt('pt1'), getPt('pt4'), getPt('pt3_50'), getPt('pt4_50')]),
            triangle_edge_RIGHT: () => new THREE.Shape([getPt('pt1_50'), getPt('pt2_50'), getPt('pt3_50'), getPt('pt3'), getPt('pt2'), getPt('pt1_50')]),
            // Rectangles
            Rect: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            longRect_V: () => new THREE.Shape([getPt('pt1_25'), getPt('pt1_75'), getPt('pt3_25'), getPt('pt3_75'), getPt('pt1_25')]),
            longRect_H: () => new THREE.Shape([getPt('pt4_75'), getPt('pt2_25'), getPt('pt2_75'), getPt('pt4_25'), getPt('pt4_75')]),
            rect_TL: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt4_50'), getPt('center'), getPt('pt1_50'), getPt('pt2')]),
            rect_TR: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt2_50'), getPt('center'), getPt('pt1_50'), getPt('pt1')]),
            rect_BL: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt3_50'), getPt('center'), getPt('pt4_50'), getPt('pt1')]),
            rect_BR: () => new THREE.Shape([getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt3_50'), getPt('center'), getPt('pt2_50'), getPt('pt2')]),
            rect_angled_TOP: () => new THREE.Shape([getPt('pt4_50'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt4_50')]),
            rect_angled_BOTTOM: () => new THREE.Shape([getPt('pt2_50'), getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt2_50')]),
            rect_angled_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt3_50'), getPt('pt3'), getPt('pt2'), getPt('pt1')]),
            rect_angled_RIGHT: () => new THREE.Shape([getPt('pt1_50'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt1_50')]),
            // Diamond
            diamond: () => new THREE.Shape([getPt('pt1_50'), getPt('pt2'), getPt('pt3_50'), getPt('pt4'), getPt('pt1_50')]),
            // Ellipses
            ellipse: () => {
                const shape = new THREE.Shape();
                shape.absellipse(0, 0, 0.5, 0.5, 0, Math.PI * 2, false, 0);
                return shape;
            },
            ellipse_neg: () => {
                const shape = new THREE.Shape();
                shape.moveTo(-0.5, -0.5);
                shape.lineTo(0.5, -0.5);
                shape.lineTo(0.5, 0.5);
                shape.lineTo(-0.5, 0.5);
                shape.lineTo(-0.5, -0.5);
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_BL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_BR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_TL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_TR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_semi_UP: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI, 0, false);
                shape.lineTo(0, 0);
                shape.lineTo(-0.5, 0);
                return shape;
            },
            ellipse_semi_DOWN: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, 0, Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0.5, 0);
                return shape;
            },
            ellipse_semi_LEFT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, 0.5);
                return shape;
            },
            ellipse_semi_RIGHT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, -0.5);
                return shape;
            },
            ellipse_neg_BL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, Math.PI, 1.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_neg_BR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 1.5 * Math.PI, 2 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_neg_TL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0.5 * Math.PI, Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_neg_TR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0, 0.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            // Negative semi-ellipses (black with circle cutout, each direction)
            ellipse_semi_neg_UP: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, Math.PI, 0, false);
                shape.lineTo(0, 0);
                shape.lineTo(-0.5, 0);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI, 0, false);
                hole.lineTo(0, 0);
                hole.lineTo(-0.35, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_DOWN: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, 0, Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0.5, 0);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, 0, Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0.35, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_LEFT: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, 0.5);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI/2, 1.5*Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, 0.35);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_RIGHT: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, -0.5);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, -Math.PI/2, Math.PI/2, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, -0.35);
                shape.holes.push(hole);
                
                return shape;
            },
            // Refractive sphere shapes
            sphere_full: () => new THREE.SphereGeometry(0.5, 32, 32),
            sphere_small: () => new THREE.SphereGeometry(0.3, 24, 24),
            sphere_large: () => new THREE.SphereGeometry(0.7, 48, 48),
            sphere_rough: () => new THREE.SphereGeometry(0.5, 16, 16),
            sphere_smooth: () => new THREE.SphereGeometry(0.5, 64, 64),
            sphere_water: () => new THREE.SphereGeometry(0.5, 48, 48),
            sphere_glass: () => new THREE.SphereGeometry(0.5, 32, 32),
            sphere_bubble: () => new THREE.SphereGeometry(0.4, 24, 24)
        };
        
        return shapeGenerators[shapeName] ? shapeGenerators[shapeName]() : null;
    }
    
    getAvailableShapes() {
        // Get all available shape names from the generateShape function
        const allShapeNames = [
            'triangle_UP', 'triangle_DOWN', 'triangle_LEFT', 'triangle_RIGHT', 'triangle_TL', 'triangle_BL', 'triangle_TR', 'triangle_BR',
            'triangle_split_UP', 'triangle_split_DOWN', 'triangle_split_LEFT', 'triangle_split_RIGHT', 'triangle_IN_V', 'triangle_IN_H',
            'triangle_neg_IN_DOWN', 'triangle_neg_IN_UP', 'triangle_neg_IN_RIGHT', 'triangle_neg_IN_LEFT', 'triangle_neg_DOWN', 'triangle_neg_UP', 'triangle_neg_RIGHT', 'triangle_neg_LEFT',
            'triangle_bottom_LEFT', 'triangle_bottom_DOWN', 'triangle_bottom_RIGHT', 'triangle_bottom_UP',
            'triangle_edge_BOTTOM', 'triangle_edge_TOP', 'triangle_edge_LEFT', 'triangle_edge_RIGHT',
            'Rect', 'longRect_V', 'longRect_H', 'rect_TL', 'rect_TR', 'rect_BL', 'rect_BR', 'rect_angled_TOP', 'rect_angled_BOTTOM', 'rect_angled_LEFT', 'rect_angled_RIGHT',
            'diamond',
            'ellipse', 'ellipse_neg', 'ellipse_BL', 'ellipse_BR', 'ellipse_TL', 'ellipse_TR',
            'ellipse_semi_UP', 'ellipse_semi_DOWN', 'ellipse_semi_LEFT', 'ellipse_semi_RIGHT',
            'ellipse_neg_BL', 'ellipse_neg_BR', 'ellipse_neg_TL', 'ellipse_neg_TR',
            'ellipse_semi_neg_UP', 'ellipse_semi_neg_DOWN', 'ellipse_semi_neg_LEFT', 'ellipse_semi_neg_RIGHT',
            'sphere_full', 'sphere_small', 'sphere_large', 'sphere_rough', 'sphere_smooth', 'sphere_water', 'sphere_glass', 'sphere_bubble'
        ];
        
        const availableShapes = [];
        
        allShapeNames.forEach(shapeName => {
            const category = this.getShapeCategory(shapeName);
            if (this.params.enabledShapes[category]) {
                availableShapes.push(shapeName);
            }
        });
        
        return availableShapes;
    }

    onWindowResize() {
        this.camera.left = window.innerWidth / -200;
        this.camera.right = window.innerWidth / 200;
        this.camera.top = window.innerHeight / 200;
        this.camera.bottom = window.innerHeight / -200;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.createGrid();
    }



    // Update the helper method to determine shape category
    getShapeCategory(shapeName) {
        if (shapeName.startsWith('triangle_')) return 'Triangles';
        if (shapeName.startsWith('rect_') || shapeName === 'Rect' || shapeName === 'longRect_V' || shapeName === 'longRect_H') return 'Rectangles';
        if (shapeName.startsWith('ellipse_')) return 'Ellipses';
        if (shapeName.startsWith('sphere_')) return 'Refractive Spheres';
        return 'Basic Shapes';
    }

    updateGridLines() {
        // Remove old grid lines
        if (this.gridLines) {
            for (const line of this.gridLines) {
                this.scene.remove(line);
            }
        }
        this.gridLines = [];
        if (!this.params.showGrid) return;
        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        // Vertical lines
        for (let i = 0; i <= gridWidth; i++) {
            const x = (i - halfGridW) * cellSize;
            const points = [
                new THREE.Vector3(x, -halfGridH * cellSize, 1),
                new THREE.Vector3(x, halfGridH * cellSize, 1)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
            this.gridLines.push(line);
        }
        // Horizontal lines
        for (let j = 0; j <= gridHeight; j++) {
            const y = (j - halfGridH) * cellSize;
            const points = [
                new THREE.Vector3(-halfGridW * cellSize, y, 1),
                new THREE.Vector3(halfGridW * cellSize, y, 1)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
            this.gridLines.push(line);
        }
    }

    updateCellSize() {
        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        // Update shape positions and scales
        let i = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[i];
                if (mesh) {
                    mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                    mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                    mesh.scale.set(cellSize, cellSize, 1);
                    // Reset rotation when not animating
                    if (!this.params.enableSizeAnimation) {
                        mesh.rotation.z = 0;
                    }
                }
                i++;
            }
        }
        // Update grid lines
        this.updateGridLines();
    }

    testCCValues() {
        // Simulate MIDI CC messages to test the current mappings
        console.log('Testing CC values...');
        
        // Test each CC mapping with a value of 64 (middle)
        Object.keys(this.params.midiCCMappings).forEach(param => {
            const mapping = this.params.midiCCMappings[param];
            this.onMIDICC(mapping.cc, 64, mapping.channel);
            console.log(`Tested Ch:${mapping.channel} CC:${mapping.cc} (${param}) with value 64`);
        });
        
        // Show a brief visual feedback
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
                cc5: { channel: 0, cc: 5, target: 'randomness' },
                // cc6: { channel: 0, cc: 6, target: 'cellSize' }, // Removed default mapping
                cc7: { channel: 0, cc: 7, target: 'movementFrequency' },
                cc8: { channel: 0, cc: 8, target: 'rotationFrequency' },
                cc9: { channel: 0, cc: 9, target: 'scaleFrequency' },
                cc10: { channel: 0, cc: 10, target: 'gridWidth' },
                cc11: { channel: 0, cc: 11, target: 'gridHeight' }
            },
            multichannel: {
                cc1: { channel: 0, cc: 1, target: 'animationSpeed' },
                cc2: { channel: 1, cc: 1, target: 'movementAmplitude' },
                cc3: { channel: 2, cc: 1, target: 'rotationAmplitude' },
                cc4: { channel: 3, cc: 1, target: 'scaleAmplitude' },
                cc5: { channel: 4, cc: 1, target: 'randomness' },
                // cc6: { channel: 5, cc: 1, target: 'cellSize' }, // Removed default mapping
                cc7: { channel: 6, cc: 1, target: 'movementFrequency' },
                cc8: { channel: 7, cc: 1, target: 'rotationFrequency' },
                cc9: { channel: 8, cc: 1, target: 'scaleFrequency' },
                cc10: { channel: 9, cc: 1, target: 'gridWidth' },
                cc11: { channel: 10, cc: 1, target: 'gridHeight' }
            },
            modwheel: {
                cc1: { channel: 0, cc: 1, target: 'animationSpeed' },
                cc2: { channel: 0, cc: 2, target: 'movementAmplitude' },
                cc3: { channel: 0, cc: 4, target: 'rotationAmplitude' },
                cc4: { channel: 0, cc: 7, target: 'scaleAmplitude' },
                cc5: { channel: 0, cc: 11, target: 'randomness' },
                // cc6: { channel: 0, cc: 16, target: 'cellSize' }, // Removed default mapping
                cc7: { channel: 0, cc: 21, target: 'movementFrequency' },
                cc8: { channel: 0, cc: 22, target: 'rotationFrequency' },
                cc9: { channel: 0, cc: 23, target: 'scaleFrequency' },
                cc10: { channel: 0, cc: 24, target: 'gridWidth' },
                cc11: { channel: 0, cc: 25, target: 'gridHeight' }
            },
            knobs: {
                cc1: { channel: 0, cc: 16, target: 'animationSpeed' },
                cc2: { channel: 0, cc: 17, target: 'movementAmplitude' },
                cc3: { channel: 0, cc: 18, target: 'rotationAmplitude' },
                cc4: { channel: 0, cc: 19, target: 'scaleAmplitude' },
                cc5: { channel: 0, cc: 20, target: 'randomness' },
                // cc6: { channel: 0, cc: 21, target: 'cellSize' }, // Removed default mapping
                cc7: { channel: 0, cc: 22, target: 'movementFrequency' },
                cc8: { channel: 0, cc: 23, target: 'rotationFrequency' },
                cc9: { channel: 0, cc: 24, target: 'scaleFrequency' },
                cc10: { channel: 0, cc: 25, target: 'gridWidth' },
                cc11: { channel: 0, cc: 26, target: 'gridHeight' }
            },
            faders: {
                cc1: { channel: 0, cc: 28, target: 'animationSpeed' },
                cc2: { channel: 0, cc: 29, target: 'movementAmplitude' },
                cc3: { channel: 0, cc: 30, target: 'rotationAmplitude' },
                cc4: { channel: 0, cc: 31, target: 'scaleAmplitude' },
                cc5: { channel: 0, cc: 32, target: 'randomness' },
                // cc6: { channel: 0, cc: 33, target: 'cellSize' }, // Removed default mapping
                cc7: { channel: 0, cc: 34, target: 'movementFrequency' },
                cc8: { channel: 0, cc: 35, target: 'rotationFrequency' },
                cc9: { channel: 0, cc: 36, target: 'scaleFrequency' },
                cc10: { channel: 0, cc: 37, target: 'gridWidth' },
                cc11: { channel: 0, cc: 38, target: 'gridHeight' }
            }
        };

        if (presets[presetName]) {
            this.params.midiCCMappings = { ...presets[presetName] };
            
            // Update all UI elements
            this.updateAllUIElements();
            
            console.log(`Applied CC preset: ${presetName}`);
        }
    }

    savePreset() {
        const preset = {
            name: 'Custom MIDI Preset',
            description: 'Custom MIDI mapping configuration',
            mappings: this.params.midiCCMappings,
            noteMappings: this.params.midiNoteMappings,
            controlStructure: {
                ccControls: Object.keys(this.params.midiCCMappings),
                noteControls: Object.keys(this.params.midiNoteMappings)
            },
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `midi-preset-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    loadPreset(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const preset = JSON.parse(e.target.result);
                if (this.validatePreset(preset)) {
                    this.applyPreset(preset);
                    console.log('Preset loaded successfully:', preset.name);
                } else {
                    console.error('Invalid preset file format');
                    alert('Invalid preset file format. Please check the file and try again.');
                }
            } catch (error) {
                console.error('Error loading preset:', error);
                alert('Error loading preset file. Please check the file and try again.');
            }
        };
        reader.readAsText(file);
    }

    validatePreset(preset) {
        // Check basic structure
        if (!preset || typeof preset !== 'object') return false;
        if (!preset.mappings || typeof preset.mappings !== 'object') return false;
        
        // Validate CC mappings
        const validCCTargets = [
            'animationSpeed', 'movementAmplitude', 'rotationAmplitude', 'scaleAmplitude',
            'randomness', 'cellSize', 'movementFrequency', 'rotationFrequency',
            'scaleFrequency', 'gridWidth', 'gridHeight'
        ];
        
        for (const ccKey in preset.mappings) {
            const mapping = preset.mappings[ccKey];
            if (!mapping || 
                typeof mapping.channel !== 'number' || 
                typeof mapping.cc !== 'number' ||
                typeof mapping.target !== 'string' ||
                !validCCTargets.includes(mapping.target)) {
                return false;
        }
        
            // Validate ranges
            if (mapping.channel < 0 || mapping.channel > 15 || 
                mapping.cc < 0 || mapping.cc > 127) {
                return false;
            }
        }
        
        // Validate note mappings if they exist
        if (preset.noteMappings) {
            const validNoteTargets = [
                'shapeCycling', 'sizeAnimation', 'showGrid', 'enableShapeCycling',
                'enableSizeAnimation', 'enableMovementAnimation', 'enableRotationAnimation',
                'enableScaleAnimation', 'resetAnimation', 'togglePause'
            ];
            
            for (const noteKey in preset.noteMappings) {
                const noteMapping = preset.noteMappings[noteKey];
                if (!noteMapping || 
                    typeof noteMapping.channel !== 'number' || 
                    typeof noteMapping.note !== 'number' || 
                    typeof noteMapping.target !== 'string' ||
                    !validNoteTargets.includes(noteMapping.target)) {
                    return false;
                }
                
                // Validate ranges
                if (noteMapping.channel < 0 || noteMapping.channel > 15 || 
                    noteMapping.note < 0 || noteMapping.note > 127) {
                    return false;
                }
            }
        }
        
        // Validate control structure if it exists (for newer presets)
        if (preset.controlStructure) {
            if (typeof preset.controlStructure !== 'object') return false;
            
            // Validate CC control structure
            if (preset.controlStructure.ccControls) {
                if (!Array.isArray(preset.controlStructure.ccControls)) return false;
                // Check that all CC controls in the structure exist in mappings
                for (const controlId of preset.controlStructure.ccControls) {
                    if (!preset.mappings[controlId]) return false;
                }
            }
            
            // Validate Note control structure
            if (preset.controlStructure.noteControls) {
                if (!Array.isArray(preset.controlStructure.noteControls)) return false;
                // Check that all Note controls in the structure exist in noteMappings
                if (preset.noteMappings) {
                    for (const controlId of preset.controlStructure.noteControls) {
                        if (!preset.noteMappings[controlId]) return false;
                    }
                }
            }
        }
        
        return true;
    }

    applyPreset(preset) {
        // Completely clear all existing mappings first
        this.params.midiCCMappings = {};
        this.params.midiNoteMappings = {};
        
        console.log('Cleared all existing mappings');
        
        // Now apply the preset mappings
        Object.assign(this.params.midiCCMappings, preset.mappings);
        if (preset.noteMappings) {
            Object.assign(this.params.midiNoteMappings, preset.noteMappings);
        }
        
        console.log('Applied preset mappings:', Object.keys(this.params.midiCCMappings), Object.keys(this.params.midiNoteMappings));
        
        // Recreate the exact control structure from the preset
        this.recreateControlsFromPreset(preset);
        
        // Reset preset selector to "Custom"
        const presetSelect = document.getElementById('cc-preset-select');
        if (presetSelect) {
            presetSelect.value = '';
        }
        
        console.log('Preset applied. CC mappings:', Object.keys(this.params.midiCCMappings));
        console.log('Preset applied. Note mappings:', Object.keys(this.params.midiNoteMappings));
    }

    recreateControlsFromPreset(preset = null) {
        // If no preset provided, use current mappings
        const ccControlIds = preset ? (preset.controlStructure?.ccControls || Object.keys(preset.mappings)) : Object.keys(this.params.midiCCMappings);
        const noteControlIds = preset ? (preset.controlStructure?.noteControls || Object.keys(preset.noteMappings || {})) : Object.keys(this.params.midiNoteMappings);
        
        console.log('Recreating controls from preset:');
        console.log('CC Control IDs:', ccControlIds);
        console.log('Note Control IDs:', noteControlIds);
        
        // Debug: Check what's in the DOM
        console.log('All midi-sections:', document.querySelectorAll('.midi-section'));
        console.log('All data-section elements:', document.querySelectorAll('[data-section]'));
        
        // Get the containers with multiple selector attempts
        let ccContainer = document.querySelector('[data-section="channel-mapping"] .midi-section-content');
        let noteContainer = document.querySelector('[data-section="note-controls"] .midi-section-content');
        
        // If not found, try alternative selectors
        if (!ccContainer) {
            console.log('Trying alternative CC container selector...');
            ccContainer = document.querySelector('.midi-section:has([data-section="channel-mapping"]) .midi-section-content');
        }
        
        if (!noteContainer) {
            console.log('Trying alternative Note container selector...');
            noteContainer = document.querySelector('.midi-section:has([data-section="note-controls"]) .midi-section-content');
        }
        
        // If still not found, try finding by text content
        if (!ccContainer) {
            console.log('Trying to find CC container by text content...');
            const sections = document.querySelectorAll('.midi-section');
            for (const section of sections) {
                const h4 = section.querySelector('h4');
                if (h4 && h4.textContent.includes('Channel/CC Mapping')) {
                    ccContainer = section.querySelector('.midi-section-content');
                    break;
                }
            }
        }
        
        if (!noteContainer) {
            console.log('Trying to find Note container by text content...');
            const sections = document.querySelectorAll('.midi-section');
            for (const section of sections) {
                const h4 = section.querySelector('h4');
                if (h4 && h4.textContent.includes('Note Controls')) {
                    noteContainer = section.querySelector('.midi-section-content');
                    break;
                }
            }
        }
        
        if (!ccContainer) {
            console.error('Could not find CC container');
            console.log('Available sections:', Array.from(document.querySelectorAll('.midi-section')).map(s => s.querySelector('h4')?.textContent));
            return;
        }
        
        if (!noteContainer) {
            console.error('Could not find Note container');
            console.log('Available sections:', Array.from(document.querySelectorAll('.midi-section')).map(s => s.querySelector('h4')?.textContent));
            return;
        }
        
        console.log('Found containers:', ccContainer, noteContainer);
        
        // Store the preset buttons and controls that we want to keep
        const ccPresetButtons = ccContainer.querySelector('.midi-control.buttons');
        const ccPresetSelect = ccContainer.querySelector('.midi-control');
        const hasPresetSelect = ccPresetSelect && ccPresetSelect.querySelector('#cc-preset-select');
        
        // Clear all content from containers
        ccContainer.innerHTML = '';
        noteContainer.innerHTML = '';
        
        // Restore the preset buttons and controls
        if (ccPresetButtons) ccContainer.appendChild(ccPresetButtons);
        if (hasPresetSelect) ccContainer.appendChild(ccPresetSelect);
        
        // Recreate the add button containers
        const newAddCCContainer = document.createElement('div');
        newAddCCContainer.className = 'midi-control';
        newAddCCContainer.innerHTML = '<button id="add-cc-control" class="midi-add-button">+ Add New CC Control</button>';
        ccContainer.appendChild(newAddCCContainer);
        
        const newAddNoteContainer = document.createElement('div');
        newAddNoteContainer.className = 'midi-control';
        newAddNoteContainer.innerHTML = '<button id="add-note-control" class="midi-add-button">+ Add New Note Control</button>';
        noteContainer.appendChild(newAddNoteContainer);
        
        // Reattach event listeners to add buttons
        document.getElementById('add-cc-control').addEventListener('click', () => {
            this.addCCControl();
        });
        
        document.getElementById('add-note-control').addEventListener('click', () => {
            this.addNoteControl();
        });
        
        console.log('Cleared containers and recreated add buttons');
        
        // Recreate CC controls based on the preset structure
        ccControlIds.forEach((controlId, index) => {
            const controlIndex = index + 1;
            console.log('Creating CC control:', controlId, 'at index:', controlIndex);
            const controlElement = this.createCCControlElement(controlId, controlIndex);
            const addButton = document.getElementById('add-cc-control');
            if (addButton && addButton.parentElement && addButton.parentElement.parentElement) {
                addButton.parentElement.parentElement.insertBefore(controlElement, addButton.parentElement);
                this.setupCCControlListeners(controlId);
            }
        });
        
        // Recreate Note controls based on the preset structure
        noteControlIds.forEach((controlId, index) => {
            const controlIndex = index + 1;
            console.log('Creating Note control:', controlId, 'at index:', controlIndex);
            const controlElement = this.createNoteControlElement(controlId, controlIndex);
            const addButton = document.getElementById('add-note-control');
            if (addButton && addButton.parentElement && addButton.parentElement.parentElement) {
                addButton.parentElement.parentElement.insertBefore(controlElement, addButton.parentElement);
                this.setupNoteControlListeners(controlId);
            }
        });
        
        // Update all UI elements
        this.updateAllUIElements();
        
        console.log('After recreation - CC mappings:', Object.keys(this.params.midiCCMappings));
        console.log('After recreation - Note mappings:', Object.keys(this.params.midiNoteMappings));
    }

    updateAllUIElements() {
        // Update all CC mapping inputs
        Object.keys(this.params.midiCCMappings).forEach(param => {
            const channelInput = document.getElementById(`midi-${param}-channel`);
            const ccInput = document.getElementById(`midi-${param}-value`);
            const targetSelect = document.getElementById(`midi-${param}-target`);
            
            if (channelInput) channelInput.value = this.params.midiCCMappings[param].channel + 1; // Convert to UI channel (1-16)
            if (ccInput) ccInput.value = this.params.midiCCMappings[param].cc;
            if (targetSelect) targetSelect.value = this.params.midiCCMappings[param].target;
        });
        
        // Update note mapping inputs
        Object.keys(this.params.midiNoteMappings).forEach(param => {
            const channelInput = document.getElementById(`midi-${param}-channel`);
            const noteInput = document.getElementById(`midi-${param}-value`);
            const targetSelect = document.getElementById(`midi-${param}-target`);
            
            if (channelInput) channelInput.value = this.params.midiNoteMappings[param].channel + 1; // Convert to UI channel (1-16)
            if (noteInput) noteInput.value = this.params.midiNoteMappings[param].note;
            if (targetSelect) targetSelect.value = this.params.midiNoteMappings[param].target;
        });
    }

    // Helper method to generate unique control IDs
    generateControlId(type, index) {
        return `${type}${index}`;
    }

    // Helper method to find the next available control index
    getNextControlIndex(type) {
        const mappings = type === 'cc' ? this.params.midiCCMappings : this.params.midiNoteMappings;
        const existingIndices = Object.keys(mappings).map(key => {
            const match = key.match(new RegExp(`^${type}(\\d+)$`));
            return match ? parseInt(match[1]) : 0;
        });
        return existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
    }

    // Add new CC control
    addCCControl() {
        console.log('Adding CC control...');
        if (!this.controlManager) {
            console.error('Control manager not initialized, trying to initialize...');
            this.initializeControlManager();
            if (!this.controlManager) {
                console.error('Failed to initialize control manager');
                return;
            }
        }
        
        const nextIndex = this.controlManager.getNextControlIndex('cc');
        console.log('Next CC index:', nextIndex);
        const control = this.controlManager.addControl('cc', nextIndex);
        
        if (control) {
            // Add to mappings
            const controlId = control.controlId;
            this.params.midiCCMappings[controlId] = {
                channel: 0,
                cc: nextIndex,
                target: 'animationSpeed'
            };
            console.log('Added CC control:', controlId);
        } else {
            console.error('Failed to create CC control');
        }
        
        return control;
    }

    // Add new Note control
    addNoteControl() {
        console.log('Adding Note control...');
        if (!this.controlManager) {
            console.error('Control manager not initialized, trying to initialize...');
            this.initializeControlManager();
            if (!this.controlManager) {
                console.error('Failed to initialize control manager');
                return;
            }
        }
        
        const nextIndex = this.controlManager.getNextControlIndex('note');
        console.log('Next Note index:', nextIndex);
        const control = this.controlManager.addControl('note', nextIndex);
        
        if (control) {
            // Add to mappings
            const controlId = control.controlId;
            this.params.midiNoteMappings[controlId] = {
                channel: 0,
                note: 60 + nextIndex - 1,
                target: 'shapeCycling'
            };
            console.log('Added Note control:', controlId);
        } else {
            console.error('Failed to create Note control');
        }
        
        return control;
    }

    // Remove CC control
    removeCCControl(controlId) {
        // Remove from mappings
        delete this.params.midiCCMappings[controlId];
        
        // Remove via control manager if it exists
        if (this.controlManager) {
            this.controlManager.removeControl(controlId);
        }
        
        // Also remove the DOM element for original controls
        const element = document.querySelector(`[data-control-id="${controlId}"]`);
        if (element) {
            element.remove();
        }
    }

    // Remove Note control
    removeNoteControl(controlId) {
        // Remove from mappings
        delete this.params.midiNoteMappings[controlId];
        
        // Remove via control manager if it exists
        if (this.controlManager) {
            this.controlManager.removeControl(controlId);
        }
        
        // Also remove the DOM element for original controls
        const element = document.querySelector(`[data-control-id="${controlId}"]`);
        if (element) {
            element.remove();
        }
    }

    // Create CC control element
    createCCControlElement(controlId, index) {
        const div = document.createElement('div');
        div.className = 'midi-control';
        div.setAttribute('data-control-id', controlId);
        
        div.innerHTML = `
            <label>CC Control ${index}:</label>
            <div class="inputs">
                <input type="number" id="midi-${controlId}-channel" value="1" min="1" max="16" class="midi-channel-input" placeholder="Ch">
                <input type="number" id="midi-${controlId}-value" value="${index}" min="0" max="127" class="midi-cc-input" placeholder="CC">
                <select id="midi-${controlId}-target" class="midi-select">
                    <option value="animationSpeed">Animation Speed</option>
                    <option value="movementAmplitude">Movement Amplitude</option>
                    <option value="rotationAmplitude">Rotation Amplitude</option>
                    <option value="scaleAmplitude">Scale Amplitude</option>
                    <option value="randomness">Randomness</option>
                    <option value="cellSize">Cell Size</option>
                    <option value="movementFrequency">Movement Frequency</option>
                    <option value="rotationFrequency">Rotation Frequency</option>
                    <option value="scaleFrequency">Scale Frequency</option>
                    <option value="gridWidth">Grid Width</option>
                    <option value="gridHeight">Grid Height</option>
                    <option value="compositionWidth">Composition Width</option>
                    <option value="compositionHeight">Composition Height</option>
                    <option value="animationType">Animation Type</option>
                    <option value="sphereRefraction">Sphere Refraction</option>
                    <option value="sphereTransparency">Sphere Transparency</option>
                    <option value="sphereTransmission">Sphere Transmission</option>
                    <option value="sphereRoughness">Sphere Roughness</option>
                    <option value="sphereMetalness">Sphere Metalness</option>
                    <option value="sphereScale">Sphere Scale</option>
                </select>
                <button id="midi-${controlId}-learn" class="midi-learn-button">Learn</button>
                <span id="midi-${controlId}-learn-status" class="midi-learn-status"></span>
                <button id="midi-${controlId}-remove" class="midi-remove-button">×</button>
            </div>
        `;
        
        return div;
    }

    // Create Note control element
    createNoteControlElement(controlId, index) {
        const div = document.createElement('div');
        div.className = 'midi-control';
        div.setAttribute('data-control-id', controlId);
        
        div.innerHTML = `
            <label>Note Control ${index}:</label>
            <div class="inputs">
                <input type="number" id="midi-${controlId}-channel" value="1" min="1" max="16" class="midi-channel-input" placeholder="Ch">
                <input type="number" id="midi-${controlId}-value" value="${60 + index - 1}" min="0" max="127" class="midi-cc-input" placeholder="Note">
                <select id="midi-${controlId}-target" class="midi-select">
                    <option value="shapeCycling">Toggle Shape Cycling</option>
                    <option value="sizeAnimation">Toggle Size Animation</option>
                    <option value="showGrid">Toggle Grid</option>
                    <option value="resetAnimation">Reset Animation</option>
                    <option value="toggleBasicShapes">Toggle Basic Shapes</option>
                    <option value="toggleTriangles">Toggle Triangles</option>
                    <option value="toggleRectangles">Toggle Rectangles</option>
                    <option value="toggleEllipses">Toggle Ellipses</option>
                    <option value="toggleRefractiveSpheres">Toggle Refractive Spheres</option>
                </select>
                <button id="midi-${controlId}-learn" class="midi-learn-button">Learn</button>
                <span id="midi-${controlId}-learn-status" class="midi-learn-status"></span>
                <button id="midi-${controlId}-remove" class="midi-remove-button">×</button>
            </div>
        `;
        
        return div;
    }

    // Set up event listeners for a CC control
    setupCCControlListeners(controlId) {
        const channelInput = document.getElementById(`midi-${controlId}-channel`);
        const ccInput = document.getElementById(`midi-${controlId}-value`);
        const targetSelect = document.getElementById(`midi-${controlId}-target`);
        const learnButton = document.getElementById(`midi-${controlId}-learn`);
        const learnStatus = document.getElementById(`midi-${controlId}-learn-status`);
        const removeButton = document.getElementById(`midi-${controlId}-remove`);
        
        if (channelInput && ccInput && targetSelect && learnButton && learnStatus && removeButton) {
            // Get mapping data, use defaults if not found
            const mapping = this.params.midiCCMappings[controlId] || {
                channel: 0,
                cc: parseInt(controlId.replace('cc', '')) || 1,
                target: 'animationSpeed'
            };
            
            // Set initial values
            channelInput.value = mapping.channel + 1;
            ccInput.value = mapping.cc;
            targetSelect.value = mapping.target;
            
            // Ensure the mapping exists in our data structure
            if (!this.params.midiCCMappings[controlId]) {
                this.params.midiCCMappings[controlId] = mapping;
            }
            
            // Event listeners
            channelInput.addEventListener('change', (e) => {
                this.params.midiCCMappings[controlId].channel = parseInt(e.target.value) - 1;
            });
            
            ccInput.addEventListener('change', (e) => {
                this.params.midiCCMappings[controlId].cc = parseInt(e.target.value);
            });
            
            targetSelect.addEventListener('change', (e) => {
                this.params.midiCCMappings[controlId].target = e.target.value;
            });

            // Learn button
            learnButton.addEventListener('click', () => {
                if (learnButton.classList.contains('learning')) return;
                learnButton.classList.add('learning');
                learnStatus.textContent = 'Waiting for CC...';
                const onCC = (controller, value, channel) => {
                    this.params.midiCCMappings[controlId].channel = channel;
                    this.params.midiCCMappings[controlId].cc = controller;
                    channelInput.value = channel + 1;
                    ccInput.value = controller;
                    learnButton.classList.remove('learning');
                    learnButton.classList.add('learned');
                    learnStatus.textContent = `Learned: Ch ${channel+1}, CC ${controller}`;
                    setTimeout(() => learnButton.classList.remove('learned'), 1500);
                    setTimeout(() => learnStatus.textContent = '', 2000);
                    this.midiManager.offCC(onCC);
                };
                this.midiManager.onCC(onCC);
            });

            // Remove button
            removeButton.addEventListener('click', () => {
                this.removeCCControl(controlId);
            });
        }
    }

    // Set up event listeners for a Note control
    setupNoteControlListeners(controlId) {
        const channelInput = document.getElementById(`midi-${controlId}-channel`);
        const noteInput = document.getElementById(`midi-${controlId}-value`);
        const targetSelect = document.getElementById(`midi-${controlId}-target`);
        const learnButton = document.getElementById(`midi-${controlId}-learn`);
        const learnStatus = document.getElementById(`midi-${controlId}-learn-status`);
        const removeButton = document.getElementById(`midi-${controlId}-remove`);
        
        if (channelInput && noteInput && targetSelect && learnButton && learnStatus && removeButton) {
            // Get mapping data, use defaults if not found
            const mapping = this.params.midiNoteMappings[controlId] || {
                channel: 0,
                note: 60 + (parseInt(controlId.replace('note', '')) || 1) - 1,
                target: 'shapeCycling'
            };
            
            // Set initial values
            channelInput.value = mapping.channel + 1;
            noteInput.value = mapping.note;
            targetSelect.value = mapping.target;
            
            // Ensure the mapping exists in our data structure
            if (!this.params.midiNoteMappings[controlId]) {
                this.params.midiNoteMappings[controlId] = mapping;
            }
            
            // Event listeners
            channelInput.addEventListener('change', (e) => {
                this.params.midiNoteMappings[controlId].channel = parseInt(e.target.value) - 1;
            });
            
            noteInput.addEventListener('change', (e) => {
                this.params.midiNoteMappings[controlId].note = parseInt(e.target.value);
            });
            
            targetSelect.addEventListener('change', (e) => {
                this.params.midiNoteMappings[controlId].target = e.target.value;
            });

            // Learn button
            learnButton.addEventListener('click', () => {
                if (learnButton.classList.contains('learning')) return;
                learnButton.classList.add('learning');
                learnStatus.textContent = 'Waiting for Note...';
                const onNote = (note, velocity, isNoteOn, channel) => {
                    if (!isNoteOn) return;
                    this.params.midiNoteMappings[controlId].channel = channel;
                    this.params.midiNoteMappings[controlId].note = note;
                    channelInput.value = channel + 1;
                    noteInput.value = note;
                    learnButton.classList.remove('learning');
                    learnButton.classList.add('learned');
                    learnStatus.textContent = `Learned: Ch ${channel+1}, Note ${note}`;
                    setTimeout(() => learnButton.classList.remove('learned'), 1500);
                    setTimeout(() => learnStatus.textContent = '', 2000);
                    this.midiManager.offNote(onNote);
                };
                this.midiManager.onNote(onNote);
            });

            // Remove button
            removeButton.addEventListener('click', () => {
                this.removeNoteControl(controlId);
            });
        }
    }

    setupLighting() {
        // Add ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Add directional light for highlights and shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Add point light for additional highlights
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-10, -10, 5);
        this.scene.add(pointLight);

        // Add a subtle rim light for better sphere definition
        const rimLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        rimLight.position.set(-5, 5, 10);
        this.scene.add(rimLight);

        // Store lights for potential animation
        this.lights = {
            ambient: ambientLight,
            directional: directionalLight,
            point: pointLight,
            rim: rimLight
        };
    }

    updateSphereMaterials() {
        // Create environment map for refraction
        const envMap = this.createEnvironmentMap();
        
        // Update materials for all existing spheres without regenerating the grid
        this.shapes.forEach(mesh => {
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                // Create new material with updated refraction properties
                const newMaterial = new THREE.MeshPhysicalMaterial({
                    color: this.params.shapeColor,
                    transparent: true,
                    opacity: this.params.sphereTransparency,
                    roughness: this.params.sphereRoughness,
                    metalness: this.params.sphereMetalness,
                    ior: this.params.sphereRefraction, // Index of refraction
                    transmission: 1.0, // Full transmission for refraction
                    thickness: 0.5, // Material thickness
                    envMap: envMap, // Environment map for refraction
                    envMapIntensity: 1.0,
                    side: THREE.DoubleSide
                });
                
                // Dispose of old material to prevent memory leaks
                if (mesh.material) {
                    mesh.material.dispose();
                }
                
                // Apply new material
                mesh.material = newMaterial;
            }
        });
    }

    createEnvironmentMap() {
        // Create a dynamic environment map from the background
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create a gradient background that matches the scene
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, this.params.backgroundColor);
        gradient.addColorStop(0.5, this.params.backgroundColor);
        gradient.addColorStop(1, this.params.backgroundColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a complex pattern for refraction to work with
        if (this.params.useBackgroundImage && this.backgroundTexture) {
            // Use the existing background texture
            return this.backgroundTexture;
        } else {
            // Create a complex pattern with multiple elements
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            
            // Grid pattern
            for (let i = 0; i < canvas.width; i += 50) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            for (let i = 0; i < canvas.height; i += 50) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }
            
            // Circles
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = 10 + Math.random() * 30;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 15; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
                ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
                ctx.stroke();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    updateShapeColors() {
        // Update colors for all shapes
        this.shapes.forEach(mesh => {
            if (mesh.material && mesh.material.color) {
                mesh.material.color.set(this.params.shapeColor);
            }
        });
    }

    updateSphereScales() {
        // Update scale for all spheres without regenerating the grid
        this.shapes.forEach(mesh => {
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                // Get the current cell size
                const cellSize = this.params.cellSize;
                // Apply sphere scale factor on top of the cell size
                const sphereScale = cellSize * this.params.sphereScale;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            }
        });
    }
    
    // Method for updating animation parameters from MIDI controls
    updateAnimationParameter(target, value) {
        if (this.params.hasOwnProperty(target)) {
            this.params[target] = value;
            
            // Update GUI if it exists
            if (this.shapeControls && this.shapeControls.getController(target)) {
                this.shapeControls.getController(target).setValue(value);
            }
            
            // Handle specific parameter updates
            switch (target) {
                case 'gridWidth':
                case 'gridHeight':
                    this.createGrid();
                    break;
                case 'cellSize':
                    this.updateCellSize();
                    break;
                case 'sphereRefraction':
                case 'sphereTransparency':
                case 'sphereTransmission':
                case 'sphereRoughness':
                case 'sphereMetalness':
                    this.updateSphereMaterials();
                    break;
                case 'sphereScale':
                    this.updateSphereScales();
                    break;
            }
        }
    }
    
    // Method for triggering note actions from MIDI controls
    triggerNoteAction(target) {
        switch (target) {
            case 'shapeCycling':
                this.params.enableShapeCycling = !this.params.enableShapeCycling;
                break;
            case 'sizeAnimation':
                this.params.enableSizeAnimation = !this.params.enableSizeAnimation;
                break;
            case 'showGrid':
                this.params.showGrid = !this.params.showGrid;
                this.updateGridLines();
                break;
            case 'resetAnimation':
                this.animationTime = 0;
                this.pulseTime = 0;
                break;
            case 'toggleBasicShapes':
                this.params.enabledShapes['Basic Shapes'] = !this.params.enabledShapes['Basic Shapes'];
                this.createGrid();
                break;
            case 'toggleTriangles':
                this.params.enabledShapes['Triangles'] = !this.params.enabledShapes['Triangles'];
                this.createGrid();
                break;
            case 'toggleRectangles':
                this.params.enabledShapes['Rectangles'] = !this.params.enabledShapes['Rectangles'];
                this.createGrid();
                break;
            case 'toggleEllipses':
                this.params.enabledShapes['Ellipses'] = !this.params.enabledShapes['Ellipses'];
                this.createGrid();
                break;
            case 'toggleRefractiveSpheres':
                this.params.enabledShapes['Refractive Spheres'] = !this.params.enabledShapes['Refractive Spheres'];
                this.createGrid();
                break;
        }
        
        // Update GUI if it exists
        if (this.shapeControls) {
            this.updateAllUIElements();
        }
    }
}

// Initialize the application
new RGLRGNRTR(); 