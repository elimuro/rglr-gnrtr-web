import { GUI } from 'dat.gui';

export class GUIManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.gui = null;
        this.controllers = new Map();
        
        this.init();
    }

    init() {
        try {
            if (this.gui) this.gui.destroy();
            
            this.gui = new GUI({ container: document.getElementById('gui-container') });
            
            // Debug: Check if GUI container exists
            const container = document.getElementById('gui-container');
            if (!container) {
                console.error('GUI container not found!');
                return;
            }
            console.log('GUI setup started');

                    this.setupPerformanceControls();
        this.setupShapeControls();
        this.setupCompositionControls();
        this.setupGridControls();
        this.setupColorControls();
        this.setupSphereControls();
        this.setupAnimationControls();
        this.setupPostProcessingControls();
        this.setupLightingControls();
        this.setupMIDIControls();
        
                // Collapse all folders by default
        this.collapseAllFolders();
        
        console.log('GUI setup completed');
        } catch (error) {
            console.error('Error during GUI initialization:', error);
        }
    }
    
    collapseAllFolders() {
        // This method ensures all folders start collapsed
        // The .open() calls have been removed from individual setup methods
        // so folders will naturally start collapsed
    }

    setupShapeControls() {
        const shapeFolder = this.gui.addFolder('Shapes');
        
        // Grid size controls
        this.addController(shapeFolder, 'gridWidth', 1, 30, 1, 'Display Width', () => {
            this.state.set('gridWidth', this.state.get('gridWidth'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addController(shapeFolder, 'gridHeight', 1, 30, 1, 'Display Height', () => {
            this.state.set('gridHeight', this.state.get('gridHeight'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addController(shapeFolder, 'cellSize', 0.5, 2, 0.01, 'Cell Size', () => {
            this.state.set('cellSize', this.state.get('cellSize'));
            this.app.scene.updateCellSize();
        });
        
        this.addController(shapeFolder, 'randomness', 0, 1, 0.01, 'Randomness', () => {
            this.state.set('randomness', this.state.get('randomness'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        // Shape selection controls
        const shapeSelectionFolder = shapeFolder.addFolder('Shape Selection');
        const enabledShapes = this.state.get('enabledShapes');
        Object.keys(enabledShapes).forEach(shapeName => {
            shapeSelectionFolder.add(enabledShapes, shapeName).onChange(() => {
                this.state.set('enabledShapes', enabledShapes);
                this.app.scene.createGrid();
                if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                    this.app.animationLoop.resetAnimationTime();
                }
            });
        });
        // shapeSelectionFolder.open(); // Removed to keep collapsed by default
        
        // shapeFolder.open(); // Removed to keep collapsed by default
    }

    setupCompositionControls() {
        const compositionFolder = this.gui.addFolder('Composition');
        
        this.addController(compositionFolder, 'compositionWidth', 1, 30, 1, 'Composition Width', () => {
            this.state.set('compositionWidth', this.state.get('compositionWidth'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addController(compositionFolder, 'compositionHeight', 1, 30, 1, 'Composition Height', () => {
            this.state.set('compositionHeight', this.state.get('compositionHeight'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        // compositionFolder.open(); // Removed to keep collapsed by default
    }

    setupGridControls() {
        const gridFolder = this.gui.addFolder('Grid');
        
        this.addController(gridFolder, 'showGrid', false, true, false, 'Show Grid Lines', () => {
            this.state.set('showGrid', this.state.get('showGrid'));
            this.app.scene.updateGridLines();
        });
        
        // gridFolder.open(); // Removed to keep collapsed by default
    }

    setupColorControls() {
        const colorFolder = this.gui.addFolder('Colors');
        
        this.addColorController(colorFolder, 'shapeColor', 'Shape Color', () => {
            this.state.set('shapeColor', this.state.get('shapeColor'));
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                // Color will be updated in next animation frame
            } else {
                this.app.scene.updateShapeColors();
            }
        });
        
        this.addColorController(colorFolder, 'backgroundColor', 'Background', () => {
            this.state.set('backgroundColor', this.state.get('backgroundColor'));
            this.app.scene.updateBackgroundColor();
            this.app.scene.createGrid();
        });
        
        // colorFolder.open(); // Removed to keep collapsed by default
    }

    setupSphereControls() {
        const sphereFolder = this.gui.addFolder('Refractive Spheres');
        
        this.addController(sphereFolder, 'sphereRefraction', 0.0, 2.0, 0.01, 'Refraction Index', () => {
            this.state.set('sphereRefraction', this.state.get('sphereRefraction'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addController(sphereFolder, 'sphereTransparency', 0.0, 1.0, 0.01, 'Transparency', () => {
            this.state.set('sphereTransparency', this.state.get('sphereTransparency'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addController(sphereFolder, 'sphereTransmission', 0.0, 1.0, 0.01, 'Transmission', () => {
            this.state.set('sphereTransmission', this.state.get('sphereTransmission'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addController(sphereFolder, 'sphereRoughness', 0.0, 1.0, 0.01, 'Roughness', () => {
            this.state.set('sphereRoughness', this.state.get('sphereRoughness'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addController(sphereFolder, 'sphereMetalness', 0.0, 1.0, 0.01, 'Metalness', () => {
            this.state.set('sphereMetalness', this.state.get('sphereMetalness'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addController(sphereFolder, 'sphereScale', 0.5, 3.0, 0.1, 'Sphere Scale', () => {
            this.state.set('sphereScale', this.state.get('sphereScale'));
            this.app.scene.updateSphereScales();
        });
        
        this.addController(sphereFolder, 'sphereClearcoat', 0, 1, 0.01, 'Clearcoat', () => {
            this.state.set('sphereClearcoat', this.state.get('sphereClearcoat'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addController(sphereFolder, 'sphereClearcoatRoughness', 0, 1, 0.01, 'Clearcoat Roughness', () => {
            this.state.set('sphereClearcoatRoughness', this.state.get('sphereClearcoatRoughness'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addController(sphereFolder, 'sphereEnvMapIntensity', 0, 3, 0.01, 'Environment Map Intensity', () => {
            this.state.set('sphereEnvMapIntensity', this.state.get('sphereEnvMapIntensity'));
            this.app.scene.updateSphereMaterials();
        });
        
        // Water distortion toggle
        sphereFolder.add(this.state.state, 'sphereWaterDistortion').name('Water Effect').onChange(() => {
            this.state.set('sphereWaterDistortion', this.state.get('sphereWaterDistortion'));
            this.app.scene.updateSphereMaterials();
        });
        
        // sphereFolder.open(); // Removed to keep collapsed by default
    }

    setupAnimationControls() {
        const animationFolder = this.gui.addFolder('Animation');
        // animationFolder.open(); // Removed to keep collapsed by default
        
        // Main controls
        this.addController(animationFolder, 'animationSpeed', 0.01, 2, 0.01, 'Global Speed');
        
        // Animation type selector with dynamic parameter visibility
        const animationTypeController = animationFolder.add(this.state.state, 'animationType', 0, 3, 1).name('Animation Type');
        
        // Effect toggles
        this.addController(animationFolder, 'enableShapeCycling', false, true, false, 'Shape Cycling', () => {
            this.state.set('enableShapeCycling', this.state.get('enableShapeCycling'));
            if (!this.state.get('enableShapeCycling')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addController(animationFolder, 'enableSizeAnimation', false, true, false, 'Size/Movement', () => {
            this.state.set('enableSizeAnimation', this.state.get('enableSizeAnimation'));
            if (!this.state.get('enableSizeAnimation')) {
                this.app.scene.updateCellSize();
            }
        });
        
        // Movement parameters
        const movementAmpController = this.addController(animationFolder, 'movementAmplitude', 0.01, 0.5, 0.01, 'Movement Amp');
        const movementFreqController = this.addController(animationFolder, 'movementFrequency', 0.1, 2, 0.1, 'Movement Freq');
        
        // Rotation parameters
        const rotationAmpController = this.addController(animationFolder, 'rotationAmplitude', 0.01, 2, 0.01, 'Rotation Amp');
        const rotationFreqController = this.addController(animationFolder, 'rotationFrequency', 0.1, 2, 0.1, 'Rotation Freq');
        
        // Scale parameters
        const scaleAmpController = this.addController(animationFolder, 'scaleAmplitude', 0.01, 1, 0.01, 'Scale Amp');
        const scaleFreqController = this.addController(animationFolder, 'scaleFrequency', 0.1, 2, 0.1, 'Scale Freq');
        
        // Function to update parameter visibility based on animation type
        const updateParameterVisibility = () => {
            const animationType = this.state.get('animationType');
            
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
            this.state.set('animationType', this.state.get('animationType'));
            updateParameterVisibility();
        });
        
        // Initialize visibility
        updateParameterVisibility();
    }

    setupMIDIControls() {
        const midiFolder = this.gui.addFolder('MIDI');
        
        this.addController(midiFolder, 'midiEnabled', false, true, false, 'MIDI Enabled', (value) => {
            this.state.set('midiEnabled', value);
            if (value && this.app.midiManager) {
                this.app.midiManager.connect();
            } else if (this.app.midiManager) {
                this.app.midiManager.disconnect();
            }
        });
        
        this.addController(midiFolder, 'midiChannel', -1, 15, 1, 'MIDI Channel (-1 = All)');
        
        // midiFolder.open(); // Removed to keep collapsed by default
    }

    setupPerformanceControls() {
        const performanceFolder = this.gui.addFolder('Performance');
        
        // Performance metrics display
        const metrics = {
            totalShapes: 0,
            visibleShapes: 0,
            animatedShapes: 0,
            cullingRatio: '0%',
            fps: 0,
            pooledGeometries: 0,
            pooledMeshes: 0
        };
        
        // Update metrics every second
        setInterval(() => {
            if (this.app.scene) {
                const sceneMetrics = this.app.scene.getPerformanceMetrics();
                metrics.totalShapes = sceneMetrics.totalShapes;
                metrics.visibleShapes = sceneMetrics.visibleShapes;
                metrics.animatedShapes = sceneMetrics.animatedShapes;
                metrics.cullingRatio = (sceneMetrics.cullingRatio * 100).toFixed(1) + '%';
                metrics.pooledGeometries = sceneMetrics.poolStats?.totalGeometries || 0;
                metrics.pooledMeshes = sceneMetrics.poolStats?.totalMeshes || 0;
                
                if (this.app.animationLoop) {
                    const fps = this.app.animationLoop.getFPS();
                    metrics.fps = fps > 0 ? fps.toString() : 'Calculating...';
                }
            }
        }, 1000);
        
        // Add read-only displays
        performanceFolder.add(metrics, 'totalShapes').name('Total Shapes').listen();
        performanceFolder.add(metrics, 'visibleShapes').name('Visible Shapes').listen();
        performanceFolder.add(metrics, 'animatedShapes').name('Animated Shapes').listen();
        performanceFolder.add(metrics, 'cullingRatio').name('Culling Efficiency').listen();
        performanceFolder.add(metrics, 'fps').name('FPS').listen();
        performanceFolder.add(metrics, 'pooledGeometries').name('Pooled Geometries').listen();
        performanceFolder.add(metrics, 'pooledMeshes').name('Pooled Meshes').listen();
        
        // Add optimization toggle
        const optimizationController = performanceFolder.add({ enableFrustumCulling: true }, 'enableFrustumCulling')
            .name('Enable Frustum Culling')
            .onChange((value) => {
                this.state.set('enableFrustumCulling', value);
            });
        
        // performanceFolder.open(); // Removed to keep collapsed by default
    }

    setupPostProcessingControls() {
        const postProcessingFolder = this.gui.addFolder('Post Processing');
        
        // Main post-processing toggle
        postProcessingFolder.add(this.state.state, 'postProcessingEnabled').name('Enable Post Processing').onChange(() => {
            this.state.set('postProcessingEnabled', this.state.get('postProcessingEnabled'));
        });
        
        // Bloom controls
        const bloomFolder = postProcessingFolder.addFolder('Bloom');
        bloomFolder.add(this.state.state, 'bloomEnabled').name('Enable Bloom').onChange(() => {
            this.state.set('bloomEnabled', this.state.get('bloomEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addController(bloomFolder, 'bloomStrength', 0, 2, 0.01, 'Strength', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addController(bloomFolder, 'bloomRadius', 0, 2, 0.01, 'Radius', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addController(bloomFolder, 'bloomThreshold', 0, 1, 0.01, 'Threshold', () => {
            this.app.scene.updatePostProcessing();
        });
        // bloomFolder.open(); // Removed to keep collapsed by default
        
        // Chromatic aberration controls
        const chromaticFolder = postProcessingFolder.addFolder('Chromatic Aberration');
        chromaticFolder.add(this.state.state, 'chromaticAberrationEnabled').name('Enable Chromatic Aberration').onChange(() => {
            this.state.set('chromaticAberrationEnabled', this.state.get('chromaticAberrationEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addController(chromaticFolder, 'chromaticIntensity', 0, 1, 0.01, 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        // chromaticFolder.open(); // Removed to keep collapsed by default
        
        // Vignette controls
        const vignetteFolder = postProcessingFolder.addFolder('Vignette');
        vignetteFolder.add(this.state.state, 'vignetteEnabled').name('Enable Vignette').onChange(() => {
            this.state.set('vignetteEnabled', this.state.get('vignetteEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addController(vignetteFolder, 'vignetteIntensity', 0, 1, 0.01, 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addController(vignetteFolder, 'vignetteRadius', 0.1, 1, 0.01, 'Radius', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addController(vignetteFolder, 'vignetteSoftness', 0, 1, 0.01, 'Softness', () => {
            this.app.scene.updatePostProcessing();
        });
        // vignetteFolder.open(); // Removed to keep collapsed by default
        
        // Film grain controls
        const grainFolder = postProcessingFolder.addFolder('Film Grain');
        grainFolder.add(this.state.state, 'grainEnabled').name('Enable Film Grain').onChange(() => {
            this.state.set('grainEnabled', this.state.get('grainEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addController(grainFolder, 'grainIntensity', 0, 0.5, 0.01, 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        // grainFolder.open(); // Removed to keep collapsed by default
        
        // Color grading controls
        const colorGradingFolder = postProcessingFolder.addFolder('Color Grading');
        colorGradingFolder.add(this.state.state, 'colorGradingEnabled').name('Enable Color Grading').onChange(() => {
            this.state.set('colorGradingEnabled', this.state.get('colorGradingEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addController(colorGradingFolder, 'colorHue', -0.5, 0.5, 0.01, 'Hue Shift', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addController(colorGradingFolder, 'colorSaturation', 0, 3, 0.01, 'Saturation', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addController(colorGradingFolder, 'colorBrightness', 0, 2, 0.01, 'Brightness', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addController(colorGradingFolder, 'colorContrast', 0, 2, 0.01, 'Contrast', () => {
            this.app.scene.updatePostProcessing();
        });
        // colorGradingFolder.open(); // Removed to keep collapsed by default
        
        // FXAA toggle
        postProcessingFolder.add(this.state.state, 'fxaaEnabled').name('Enable FXAA').onChange(() => {
            this.state.set('fxaaEnabled', this.state.get('fxaaEnabled'));
            this.app.scene.updatePostProcessing();
        });
        
        // postProcessingFolder.open(); // Removed to keep collapsed by default
    }

    setupLightingControls() {
        try {
            const lightingFolder = this.gui.addFolder('Lighting');
            
            // Ambient light control
            this.addController(lightingFolder, 'ambientLightIntensity', 0, 2, 0.01, 'Ambient Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Directional light control
            this.addController(lightingFolder, 'directionalLightIntensity', 0, 3, 0.01, 'Directional Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Point light 1 control
            this.addController(lightingFolder, 'pointLight1Intensity', 0, 3, 0.01, 'Point Light 1', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Point light 2 control
            this.addController(lightingFolder, 'pointLight2Intensity', 0, 3, 0.01, 'Point Light 2', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Rim light control
            this.addController(lightingFolder, 'rimLightIntensity', 0, 3, 0.01, 'Rim Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Accent light control
            this.addController(lightingFolder, 'accentLightIntensity', 0, 3, 0.01, 'Accent Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
                    // lightingFolder.open(); // Removed to keep collapsed by default
    } catch (error) {
            console.error('Error setting up lighting controls:', error);
        }
    }

    addController(folder, key, min, max, step, name, onChange = null) {
        const controller = folder.add(this.state.state, key, min, max, step).name(name);
        
        if (onChange) {
            controller.onChange(() => {
                this.state.set(key, this.state.get(key));
                onChange(this.state.get(key));
            });
        } else {
            controller.onChange(() => {
                this.state.set(key, this.state.get(key));
            });
        }
        
        this.controllers.set(key, controller);
        return controller;
    }

    addColorController(folder, key, name, onChange = null) {
        const controller = folder.addColor(this.state.state, key).name(name);
        
        if (onChange) {
            controller.onChange(() => {
                this.state.set(key, this.state.get(key));
                onChange(this.state.get(key));
            });
        } else {
            controller.onChange(() => {
                this.state.set(key, this.state.get(key));
            });
        }
        
        this.controllers.set(key, controller);
        return controller;
    }

    updateController(key, value) {
        const controller = this.controllers.get(key);
        if (controller) {
            controller.setValue(value);
        }
    }

    destroy() {
        if (this.gui) {
            this.gui.destroy();
            this.gui = null;
        }
        this.controllers.clear();
    }
} 