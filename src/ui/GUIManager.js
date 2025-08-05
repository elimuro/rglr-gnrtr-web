/**
 * GUIManager.js - User Interface and Control Management
 * This module manages the dat.GUI interface and all user controls for the application, including
 * parameter sliders, color pickers, folder organization, and real-time UI updates. It handles
 * the creation and management of all GUI elements, ensures proper parameter binding to the state
 * system, and provides an intuitive interface for controlling all application features.
 */

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
            
            // Check if GUI container exists
            const container = document.getElementById('gui-container');
            if (!container) {
                return;
            }

            this.setupPerformanceControls();
            this.setupShapeControls();
            this.setupCompositionControls();
            this.setupColorControls();
            this.setupSphereControls();
            this.setupAnimationControls();
            this.setupMorphingControls();
            this.setupPostProcessingControls();
            this.setupLightingControls();
            
            // Collapse all folders by default
            this.collapseAllFolders();
        } catch (error) {
            // Error during GUI initialization
        }
    }
    
    collapseAllFolders() {
        // This method ensures all folders start collapsed
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
        
        // Grid visibility control
        shapeFolder.add(this.state.state, 'showGrid').name('Show Grid').onChange(() => {
            this.state.set('showGrid', this.state.get('showGrid'));
            this.app.scene.updateGridLines();
        });
        
        // Grid color control
        this.addColorController(shapeFolder, 'gridColor', 'Grid Color', () => {
            this.state.set('gridColor', this.state.get('gridColor'));
            this.app.scene.updateGridLines();
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
    }

    setupAnimationControls() {
        const animationFolder = this.gui.addFolder('Animation');
        
        // Main controls
        this.addController(animationFolder, 'globalBPM', 60, 300, 1, 'Global BPM');
        
        // Animation type selector
        const mainAnimationTypeNames = ['Movement', 'Rotation', 'Scale', 'Combined'];
        const currentAnimationType = mainAnimationTypeNames[this.state.get('animationType')] || mainAnimationTypeNames[0];
        animationFolder.add({ animationType: currentAnimationType }, 'animationType', mainAnimationTypeNames).name('Animation Type').onChange((value) => {
            const index = mainAnimationTypeNames.indexOf(value);
            this.state.set('animationType', index);
        });
        
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
        this.addController(animationFolder, 'movementAmplitude', 0.01, 0.5, 0.01, 'Movement Amp');
        
        // Movement division selector
        const movementDivisionNames = ['32nd', '16th', '8th', 'Quarter', 'Half', 'Whole', '1 Bar', '2 Bars', '4 Bars', '8 Bars'];
        const currentMovementDivision = this.getDivisionDisplayName(this.state.get('movementDivision') || '8th');
        animationFolder.add({ movementDivision: currentMovementDivision }, 'movementDivision', movementDivisionNames)
            .name('Movement Division ♪')
            .onChange((value) => {
                const division = this.getDivisionFromDisplayName(value);
                this.state.set('movementDivision', division);
            });
        
        // Rotation parameters
        this.addController(animationFolder, 'rotationAmplitude', 0.01, 2, 0.01, 'Rotation Amp');
        
        // Rotation division selector
        const rotationDivisionNames = ['32nd', '16th', '8th', 'Quarter', 'Half', 'Whole', '1 Bar', '2 Bars', '4 Bars', '8 Bars'];
        const currentRotationDivision = this.getDivisionDisplayName(this.state.get('rotationDivision') || '16th');
        animationFolder.add({ rotationDivision: currentRotationDivision }, 'rotationDivision', rotationDivisionNames)
            .name('Rotation Division ♩')
            .onChange((value) => {
                const division = this.getDivisionFromDisplayName(value);
                this.state.set('rotationDivision', division);
            });
        
        // Scale parameters
        this.addController(animationFolder, 'scaleAmplitude', 0.01, 1, 0.01, 'Scale Amp');
        
        // Scale division selector
        const scaleDivisionNames = ['32nd', '16th', '8th', 'Quarter', 'Half', 'Whole', '1 Bar', '2 Bars', '4 Bars', '8 Bars'];
        const currentScaleDivision = this.getDivisionDisplayName(this.state.get('scaleDivision') || 'half');
        animationFolder.add({ scaleDivision: currentScaleDivision }, 'scaleDivision', scaleDivisionNames)
            .name('Scale Division ♬')
            .onChange((value) => {
                const division = this.getDivisionFromDisplayName(value);
                this.state.set('scaleDivision', division);
            });
        
        // Center Scaling controls
        const centerScalingFolder = animationFolder.addFolder('Center Scaling');
        
        this.addController(centerScalingFolder, 'centerScalingEnabled', false, true, false, 'Enable Center Scaling', () => {
            this.state.set('centerScalingEnabled', this.state.get('centerScalingEnabled'));
            this.app.scene.updateCenterScaling();
        });
        
        this.addController(centerScalingFolder, 'centerScalingIntensity', 0, 2, 0.01, 'Scaling Intensity', () => {
            this.state.set('centerScalingIntensity', this.state.get('centerScalingIntensity'));
            this.app.scene.updateCenterScaling();
        });
        
        const curveNames = ['Linear', 'Exponential', 'Logarithmic', 'Sine Wave'];
        const currentCurve = curveNames[this.state.get('centerScalingCurve')] || curveNames[0];
        centerScalingFolder.add({ curve: currentCurve }, 'curve', curveNames)
            .name('Scaling Curve')
            .onChange((value) => {
                const index = curveNames.indexOf(value);
                this.state.set('centerScalingCurve', index);
                this.app.scene.updateCenterScaling();
            });
        
        this.addController(centerScalingFolder, 'centerScalingRadius', 0.1, 5, 0.1, 'Scaling Radius', () => {
            this.state.set('centerScalingRadius', this.state.get('centerScalingRadius'));
            this.app.scene.updateCenterScaling();
        });
        
        const scalingDirectionNames = ['Convex (Center Larger)', 'Concave (Center Smaller)'];
        const currentScalingDirection = scalingDirectionNames[this.state.get('centerScalingDirection')] || scalingDirectionNames[0];
        centerScalingFolder.add({ direction: currentScalingDirection }, 'direction', scalingDirectionNames)
            .name('Scaling Direction')
            .onChange((value) => {
                const index = scalingDirectionNames.indexOf(value);
                this.state.set('centerScalingDirection', index);
                this.app.scene.updateCenterScaling();
            });
        
        this.addController(centerScalingFolder, 'centerScalingAnimation', false, true, false, 'Animated Scaling', () => {
            this.state.set('centerScalingAnimation', this.state.get('centerScalingAnimation'));
            this.app.scene.updateCenterScaling();
        });
        
        // Center scaling division selector
        const centerScalingDivisionNames = ['32nd', '16th', '8th', 'Quarter', 'Half', 'Whole', '1 Bar', '2 Bars', '4 Bars', '8 Bars'];
        const currentCenterScalingDivision = this.getDivisionDisplayName(this.state.get('centerScalingDivision') || 'quarter');
        centerScalingFolder.add({ centerScalingDivision: currentCenterScalingDivision }, 'centerScalingDivision', centerScalingDivisionNames)
            .name('Scaling Division ♬')
            .onChange((value) => {
                const division = this.getDivisionFromDisplayName(value);
                this.state.set('centerScalingDivision', division);
            });
        
        // Center scaling animation speed (keeping for backward compatibility)
        this.addController(centerScalingFolder, 'centerScalingAnimationSpeed', 0.1, 3, 0.1, 'Animation Speed', () => {
            this.state.set('centerScalingAnimationSpeed', this.state.get('centerScalingAnimationSpeed'));
            this.app.scene.updateCenterScaling();
        });
        
        const centerScalingAnimationTypeNames = ['Complex Wave', 'Radial Pulse', 'Spiral Effect', 'Chaos Pattern'];
        const currentCenterScalingAnimationType = centerScalingAnimationTypeNames[this.state.get('centerScalingAnimationType')] || centerScalingAnimationTypeNames[0];
        centerScalingFolder.add({ animationType: currentCenterScalingAnimationType }, 'animationType', centerScalingAnimationTypeNames)
            .name('Animation Type')
            .onChange((value) => {
                const index = centerScalingAnimationTypeNames.indexOf(value);
                this.state.set('centerScalingAnimationType', index);
                this.app.scene.updateCenterScaling();
            });
        
        // Shape cycling controls
        const shapeCyclingFolder = animationFolder.addFolder('Shape Cycling');
        
        // Shape cycling division selector
        const shapeCyclingDivisionNames = ['32nd', '16th', '8th', 'Quarter', 'Half', 'Whole', '1 Bar', '2 Bars', '4 Bars', '8 Bars'];
        const currentShapeCyclingDivision = this.getDivisionDisplayName(this.state.get('shapeCyclingDivision') || 'quarter');
        shapeCyclingFolder.add({ shapeCyclingDivision: currentShapeCyclingDivision }, 'shapeCyclingDivision', shapeCyclingDivisionNames)
            .name('Cycling Division ♩')
            .onChange((value) => {
                const division = this.getDivisionFromDisplayName(value);
                this.state.set('shapeCyclingDivision', division);
            });
        
        const patternNames = ['Sequential', 'Random', 'Wave', 'Pulse', 'Staggered'];
        const currentPattern = patternNames[this.state.get('shapeCyclingPattern')] || patternNames[0];
        shapeCyclingFolder.add({ pattern: currentPattern }, 'pattern', patternNames)
            .name('Pattern')
            .onChange((value) => {
                const index = patternNames.indexOf(value);
                this.state.set('shapeCyclingPattern', index);
            });
        
        const directionNames = ['Forward', 'Reverse', 'Ping-Pong', 'Random'];
        const currentDirection = directionNames[this.state.get('shapeCyclingDirection')] || directionNames[0];
        shapeCyclingFolder.add({ direction: currentDirection }, 'direction', directionNames)
            .name('Direction')
            .onChange((value) => {
                const index = directionNames.indexOf(value);
                this.state.set('shapeCyclingDirection', index);
            });
        
        const syncNames = ['Independent', 'Synchronized', 'Wave', 'Cluster'];
        const currentSync = syncNames[this.state.get('shapeCyclingSync')] || syncNames[0];
        shapeCyclingFolder.add({ sync: currentSync }, 'sync', syncNames)
            .name('Synchronization')
            .onChange((value) => {
                const index = syncNames.indexOf(value);
                this.state.set('shapeCyclingSync', index);
            });
        
        this.addController(shapeCyclingFolder, 'shapeCyclingIntensity', 0.1, 1, 0.1, 'Intensity');
        
        const triggerNames = ['Time-based', 'Movement-triggered', 'Rotation-triggered', 'Manual'];
        const currentTrigger = triggerNames[this.state.get('shapeCyclingTrigger')] || triggerNames[0];
        shapeCyclingFolder.add({ trigger: currentTrigger }, 'trigger', triggerNames)
            .name('Trigger')
            .onChange((value) => {
                const index = triggerNames.indexOf(value);
                this.state.set('shapeCyclingTrigger', index);
            });
    }

    setupMorphingControls() {
        const morphingFolder = this.gui.addFolder('Shape Morphing');
        
        // Morphing division selector
        const morphingDivisionNames = ['32nd', '16th', '8th', 'Quarter', 'Half', 'Whole', '1 Bar', '2 Bars', '4 Bars', '8 Bars'];
        const currentMorphingDivision = this.getDivisionDisplayName(this.state.get('morphingDivision') || 'quarter');
        morphingFolder.add({ morphingDivision: currentMorphingDivision }, 'morphingDivision', morphingDivisionNames)
            .name('Morphing Division ♩')
            .onChange((value) => {
                const division = this.getDivisionFromDisplayName(value);
                this.state.set('morphingDivision', division);
            });
        
        // Morphing speed (keeping for backward compatibility)
        this.addController(morphingFolder, 'morphingSpeed', 0.5, 5.0, 0.1, 'Morphing Speed', () => {
            this.state.set('morphingSpeed', this.state.get('morphingSpeed'));
        });
        
        // Morphing easing
        const easingOptions = {
            'Power 2 InOut': 'power2.inOut',
            'Power 2 In': 'power2.in',
            'Power 2 Out': 'power2.out',
            'Power 3 InOut': 'power3.inOut',
            'Power 3 In': 'power3.in',
            'Power 3 Out': 'power3.out',
            'Back InOut': 'back.inOut',
            'Back In': 'back.in',
            'Back Out': 'back.out',
            'Elastic InOut': 'elastic.inOut',
            'Elastic In': 'elastic.in',
            'Elastic Out': 'elastic.out',
            'Bounce InOut': 'bounce.inOut',
            'Bounce In': 'bounce.in',
            'Bounce Out': 'bounce.out'
        };
        
        // Find the current easing display name from the state value
        const currentEasingValue = this.state.get('morphingEasing');
        const currentEasingDisplayName = Object.keys(easingOptions).find(key => easingOptions[key] === currentEasingValue) || 'Power 2 InOut';
        
        const easingController = morphingFolder.add({ easing: currentEasingDisplayName }, 'easing', Object.keys(easingOptions)).name('Easing');
        easingController.onChange(() => {
            this.state.set('morphingEasing', easingOptions[easingController.getValue()]);
        });
        
        // Individual morph buttons
        const randomMorphButton = { execute: () => {
            this.app.triggerRandomMorph();
        }};
        
        const morphAllButton = { execute: () => {
            this.app.triggerMorphAllShapes();
        }};
        
        const morphAllToSameButton = { execute: () => {
            this.app.triggerMorphAllToSame();
        }};
        
        const morphAllSimultaneouslyButton = { execute: () => {
            this.app.triggerMorphAllSimultaneously();
        }};
        
        // Add individual morph buttons
        morphingFolder.add(randomMorphButton, 'execute').name('Random Morph');
        morphingFolder.add(morphAllButton, 'execute').name('Morph All Shapes');
        morphingFolder.add(morphAllToSameButton, 'execute').name('Morph All to Same');
        morphingFolder.add(morphAllSimultaneouslyButton, 'execute').name('Morph All Simultaneously');
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
        performanceFolder.add({ enableFrustumCulling: true }, 'enableFrustumCulling')
            .name('Enable Frustum Culling')
            .onChange((value) => {
                this.state.set('enableFrustumCulling', value);
            });
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
        
        // Chromatic aberration controls
        const chromaticFolder = postProcessingFolder.addFolder('Chromatic Aberration');
        chromaticFolder.add(this.state.state, 'chromaticAberrationEnabled').name('Enable Chromatic Aberration').onChange(() => {
            this.state.set('chromaticAberrationEnabled', this.state.get('chromaticAberrationEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addController(chromaticFolder, 'chromaticIntensity', 0, 1, 0.01, 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        
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
        
        // Film grain controls
        const grainFolder = postProcessingFolder.addFolder('Film Grain');
        grainFolder.add(this.state.state, 'grainEnabled').name('Enable Film Grain').onChange(() => {
            this.state.set('grainEnabled', this.state.get('grainEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addController(grainFolder, 'grainIntensity', 0, 0.5, 0.01, 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        
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
        
        // FXAA toggle
        postProcessingFolder.add(this.state.state, 'fxaaEnabled').name('Enable FXAA').onChange(() => {
            this.state.set('fxaaEnabled', this.state.get('fxaaEnabled'));
            this.app.scene.updatePostProcessing();
        });
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
        } catch (error) {
            // Error setting up lighting controls
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

    /**
     * Get display name for a musical division
     */
    getDivisionDisplayName(division) {
        const nameMap = {
            '32nd': '32nd',
            '16th': '16th', 
            '8th': '8th',
            'quarter': 'Quarter',
            'half': 'Half',
            'whole': 'Whole',
            '1bar': '1 Bar',
            '2bars': '2 Bars',
            '4bars': '4 Bars',
            '8bars': '8 Bars'
        };
        return nameMap[division] || division;
    }

    /**
     * Get division value from display name
     */
    getDivisionFromDisplayName(displayName) {
        const divisionMap = {
            '32nd': '32nd',
            '16th': '16th',
            '8th': '8th',
            'Quarter': 'quarter',
            'Half': 'half',
            'Whole': 'whole',
            '1 Bar': '1bar',
            '2 Bars': '2bars',
            '4 Bars': '4bars',
            '8 Bars': '8bars'
        };
        return divisionMap[displayName] || 'quarter';
    }
    
} 