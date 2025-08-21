/**
 * GUIManager.js - User Interface and Control Management
 * This module manages the dat.GUI interface and all user controls for the application, including
 * parameter sliders, color pickers, folder organization, and real-time UI updates. It handles
 * the creation and management of all GUI elements, ensures proper parameter binding to the state
 * system, and provides an intuitive interface for controlling all application features.
 */

import { GUI } from 'dat.gui';
import { GUI_CONTROL_CONFIGS, ConfigHelpers } from '../config/index.js';

export class GUIManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.gui = null;
        this.controllers = new Map();
        
        this.init();
    }

    /**
     * Get available division names from BPMTimingManager
     */
    getAvailableDivisionNames() {
        const bpmTimingManager = this.app.midiClockManager?.getBPMTimingManager();
        if (bpmTimingManager) {
            // Get divisions from BPMTimingManager and convert to display names
            const divisions = bpmTimingManager.getAvailableDivisions();
            return divisions.map(division => this.getDivisionDisplayName(division));
        }
        // Fallback if BPMTimingManager not available
        return ['64th', '32nd', '16th', '8th', 'Quarter', 'Half', 'Whole', '1 Bar', '2 Bars', '4 Bars', '8 Bars'];
    }

    /**
     * Create a reusable division dropdown
     */
    createDivisionDropdown(folder, parameterName, defaultValue, displayName, icon) {
        const divisionNames = this.getAvailableDivisionNames();
        const currentDivision = this.getDivisionDisplayName(this.state.get(parameterName) || defaultValue);
        return folder.add({ [parameterName]: currentDivision }, parameterName, divisionNames)
            .name(`${displayName} ${icon}`)
            .onChange((value) => {
                const division = this.getDivisionFromDisplayName(value);
                this.state.set(parameterName, division);
            });
    }

    init() {
        try {
            if (this.gui) this.gui.destroy();
            
            this.gui = new GUI({ container: document.getElementById('gui-container') });
            
            // Check if GUI container exists
            const container = document.getElementById('gui-container');
            if (!container) {
                console.error('GUI container not found');
                return;
            }

            console.log('Setting up GUI controls...');
            
            try { this.setupPerformanceControls(); console.log('Performance controls OK'); } catch (e) { console.error('Performance controls failed:', e); }
            try { this.setupShapeControls(); console.log('Shape controls OK'); } catch (e) { console.error('Shape controls failed:', e); }
            try { this.setupCompositionControls(); console.log('Composition controls OK'); } catch (e) { console.error('Composition controls failed:', e); }
            try { this.setupColorControls(); console.log('Color controls OK'); } catch (e) { console.error('Color controls failed:', e); }
            try { this.setupSphereControls(); console.log('Sphere controls OK'); } catch (e) { console.error('Sphere controls failed:', e); }
            try { this.setupAnimationControls(); console.log('Animation controls OK'); } catch (e) { console.error('Animation controls failed:', e); }
            try { this.setupMorphingControls(); console.log('Morphing controls OK'); } catch (e) { console.error('Morphing controls failed:', e); }
            try { this.setupPostProcessingControls(); console.log('Post-processing controls OK'); } catch (e) { console.error('Post-processing controls failed:', e); }
            try { this.setupLightingControls(); console.log('Lighting controls OK'); } catch (e) { console.error('Lighting controls failed:', e); }
            try { this.setupCameraControls(); console.log('Camera controls OK'); } catch (e) { console.error('Camera controls failed:', e); }
            
            // Collapse all folders by default
            this.collapseAllFolders();
            console.log('GUI initialization complete');
        } catch (error) {
            console.error('Error during GUI initialization:', error);
        }
    }
    
    collapseAllFolders() {
        // This method ensures all folders start collapsed
    }

    setupShapeControls() {
        const shapeFolder = this.gui.addFolder('Shapes');
        
        // Grid size controls using configuration constants
        this.addConfiguredController(shapeFolder, 'gridWidth', 'Display Width', () => {
            this.state.set('gridWidth', this.state.get('gridWidth'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addConfiguredController(shapeFolder, 'gridHeight', 'Display Height', () => {
            this.state.set('gridHeight', this.state.get('gridHeight'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addConfiguredController(shapeFolder, 'cellSize', 'Cell Size', () => {
            this.state.set('cellSize', this.state.get('cellSize'));
            this.app.scene.updateCellSize();
        });
        
        this.addConfiguredController(shapeFolder, 'randomness', 'Randomness', () => {
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
        
        this.addConfiguredController(compositionFolder, 'compositionWidth', 'Composition Width', () => {
            this.state.set('compositionWidth', this.state.get('compositionWidth'));
            this.app.scene.createGrid();
            if (this.state.get('enableShapeCycling') || this.state.get('enableSizeAnimation')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addConfiguredController(compositionFolder, 'compositionHeight', 'Composition Height', () => {
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
        
        // Material Properties Folder
        const materialFolder = sphereFolder.addFolder('Material Properties');
        
        this.addConfiguredController(materialFolder, 'sphereRefraction', 'Refraction Index', () => {
            this.state.set('sphereRefraction', this.state.get('sphereRefraction'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addConfiguredController(materialFolder, 'sphereTransparency', 'Transparency', () => {
            this.state.set('sphereTransparency', this.state.get('sphereTransparency'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addConfiguredController(materialFolder, 'sphereTransmission', 'Transmission', () => {
            this.state.set('sphereTransmission', this.state.get('sphereTransmission'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addConfiguredController(materialFolder, 'sphereRoughness', 'Roughness', () => {
            this.state.set('sphereRoughness', this.state.get('sphereRoughness'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addConfiguredController(materialFolder, 'sphereMetalness', 'Metalness', () => {
            this.state.set('sphereMetalness', this.state.get('sphereMetalness'));
            this.app.scene.updateSphereMaterials();
        });
        
        // Clearcoat Properties Folder
        const clearcoatFolder = sphereFolder.addFolder('Clearcoat Properties');
        
        this.addConfiguredController(clearcoatFolder, 'sphereClearcoat', 'Intensity', () => {
            this.state.set('sphereClearcoat', this.state.get('sphereClearcoat'));
            this.app.scene.updateSphereMaterials();
        });
        
        this.addConfiguredController(clearcoatFolder, 'sphereClearcoatRoughness', 'Smoothness', () => {
            this.state.set('sphereClearcoatRoughness', this.state.get('sphereClearcoatRoughness'));
            this.app.scene.updateSphereMaterials();
        });
        
        // Environment & Effects Folder
        const effectsFolder = sphereFolder.addFolder('Environment & Effects');
        
        this.addConfiguredController(effectsFolder, 'sphereEnvMapIntensity', 'Environment Map Intensity', () => {
            this.state.set('sphereEnvMapIntensity', this.state.get('sphereEnvMapIntensity'));
            this.app.scene.updateSphereMaterials();
        });
        
        // Water distortion toggle
        effectsFolder.add(this.state.state, 'sphereWaterDistortion').name('Water Effect').onChange(() => {
            this.state.set('sphereWaterDistortion', this.state.get('sphereWaterDistortion'));
            this.app.scene.updateSphereMaterials();
        });
        
        // Distortion strength control
        this.addConfiguredController(effectsFolder, 'sphereDistortionStrength', 'Distortion Strength', () => {
            this.state.set('sphereDistortionStrength', this.state.get('sphereDistortionStrength'));
            this.app.scene.updateSphereMaterials();
        });
        
        // Size & Performance Folder
        const sizeFolder = sphereFolder.addFolder('Size');
        
        this.addConfiguredController(sizeFolder, 'sphereScale', 'Scale', () => {
            this.state.set('sphereScale', this.state.get('sphereScale'));
            this.app.scene.updateSphereScales();
        });
    }

    setupAnimationControls() {
        const animationFolder = this.gui.addFolder('Animation');
        
        // Ensure new animation toggle parameters exist in state
        if (!this.state.has('enableMovementAnimation')) {
            this.state.set('enableMovementAnimation', false);
        }
        if (!this.state.has('enableRotationAnimation')) {
            this.state.set('enableRotationAnimation', false);
        }
        if (!this.state.has('enableScaleAnimation')) {
            this.state.set('enableScaleAnimation', false);
        }
        
        // Main controls
        this.addConfiguredController(animationFolder, 'globalBPM', 'Global BPM');
        
        // Effect toggles
        this.addController(animationFolder, 'enableShapeCycling', false, true, false, 'Shape Cycling', () => {
            this.state.set('enableShapeCycling', this.state.get('enableShapeCycling'));
            if (!this.state.get('enableShapeCycling')) {
                this.app.animationLoop.resetAnimationTime();
            }
        });
        
        this.addController(animationFolder, 'centerScalingEnabled', false, true, false, 'Center Scaling', () => {
            this.state.set('centerScalingEnabled', this.state.get('centerScalingEnabled'));
            this.app.scene.updateCenterScaling();
        });
        
        // Individual animation toggles
        animationFolder.add(this.state.state, 'enableMovementAnimation').name('Movement Animation').onChange(() => {
            this.state.set('enableMovementAnimation', this.state.get('enableMovementAnimation'));
        });
        
        animationFolder.add(this.state.state, 'enableRotationAnimation').name('Rotation Animation').onChange(() => {
            this.state.set('enableRotationAnimation', this.state.get('enableRotationAnimation'));
        });
        
        animationFolder.add(this.state.state, 'enableScaleAnimation').name('Scale Animation').onChange(() => {
            this.state.set('enableScaleAnimation', this.state.get('enableScaleAnimation'));
        });
        
        // Movement Animation Folder
        const movementFolder = animationFolder.addFolder('Movement Animations');
        
        this.addConfiguredController(movementFolder, 'movementAmplitude', 'Amplitude');
        
        // Movement division selector
        this.createDivisionDropdown(movementFolder, 'movementDivision', '8th', 'Division', '♪');
        
        // Rotation Animation Folder
        const rotationFolder = animationFolder.addFolder('Rotation Animations');
        
        this.addConfiguredController(rotationFolder, 'rotationAmplitude', 'Amplitude');
        
        // Rotation division selector
        this.createDivisionDropdown(rotationFolder, 'rotationDivision', '16th', 'Division', '♩');
        
        // Scale Animation Folder
        const scaleFolder = animationFolder.addFolder('Scale Animations');
        
        this.addConfiguredController(scaleFolder, 'scaleAmplitude', 'Amplitude');
        
        // Scale division selector
        this.createDivisionDropdown(scaleFolder, 'scaleDivision', 'half', 'Division', '♬');
        
        // Shape Cycling Folder
        const shapeCyclingFolder = animationFolder.addFolder('Shape Cycling');
        
        // Shape cycling division selector
        this.createDivisionDropdown(shapeCyclingFolder, 'shapeCyclingDivision', 'quarter', 'Division', '♩');
        
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
        
        this.addConfiguredController(shapeCyclingFolder, 'shapeCyclingIntensity', 'Intensity');
        
        const triggerNames = ['Time-based', 'Movement-triggered', 'Rotation-triggered', 'Manual'];
        const currentTrigger = triggerNames[this.state.get('shapeCyclingTrigger')] || triggerNames[0];
        shapeCyclingFolder.add({ trigger: currentTrigger }, 'trigger', triggerNames)
            .name('Trigger')
            .onChange((value) => {
                const index = triggerNames.indexOf(value);
                this.state.set('shapeCyclingTrigger', index);
            });
        
        // Center Scaling Folder
        const centerScalingFolder = animationFolder.addFolder('Center Scaling');
        
        this.addConfiguredController(centerScalingFolder, 'centerScalingIntensity', 'Intensity', () => {
            this.state.set('centerScalingIntensity', this.state.get('centerScalingIntensity'));
            this.app.scene.updateCenterScaling();
        });
        
        const curveNames = ['Linear', 'Exponential', 'Logarithmic', 'Sine Wave'];
        const currentCurve = curveNames[this.state.get('centerScalingCurve')] || curveNames[0];
        centerScalingFolder.add({ curve: currentCurve }, 'curve', curveNames)
            .name('Curve')
            .onChange((value) => {
                const index = curveNames.indexOf(value);
                this.state.set('centerScalingCurve', index);
                this.app.scene.updateCenterScaling();
            });
        
        this.addConfiguredController(centerScalingFolder, 'centerScalingRadius', 'Radius', () => {
            this.state.set('centerScalingRadius', this.state.get('centerScalingRadius'));
            this.app.scene.updateCenterScaling();
        });
        
        const scalingDirectionNames = ['Convex (Center Larger)', 'Concave (Center Smaller)'];
        const currentScalingDirection = scalingDirectionNames[this.state.get('centerScalingDirection')] || scalingDirectionNames[0];
        centerScalingFolder.add({ direction: currentScalingDirection }, 'direction', scalingDirectionNames)
            .name('Direction')
            .onChange((value) => {
                const index = scalingDirectionNames.indexOf(value);
                this.state.set('centerScalingDirection', index);
                this.app.scene.updateCenterScaling();
            });
        
        // Center scaling division selector
        this.createDivisionDropdown(centerScalingFolder, 'centerScalingDivision', 'quarter', 'Division', '♬');
        
        // Center scaling animation speed
        this.addConfiguredController(centerScalingFolder, 'centerScalingAnimationSpeed', 'Animation Speed', () => {
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
    }

    setupMorphingControls() {
        const morphingFolder = this.gui.addFolder('Shape Morphing');
        
        // Morphing division selector
        this.createDivisionDropdown(morphingFolder, 'morphingDivision', 'quarter', 'Division', '♩');
        

        
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
        
        const morphAllToSameSimultaneouslyButton = { execute: () => {
            this.app.triggerMorphAllToSameSimultaneously();
        }};
        
        // Add individual morph buttons
        morphingFolder.add(randomMorphButton, 'execute').name('Random Morph');
        morphingFolder.add(morphAllButton, 'execute').name('Morph All Shapes');
        morphingFolder.add(morphAllToSameButton, 'execute').name('Morph All to Same');
        morphingFolder.add(morphAllSimultaneouslyButton, 'execute').name('Morph All Simultaneously');
        morphingFolder.add(morphAllToSameSimultaneouslyButton, 'execute').name('Morph All to Same Simultaneously');
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
        
        // Add optimization toggles
        performanceFolder.add({ enableFrustumCulling: true }, 'enableFrustumCulling')
            .name('Enable Frustum Culling')
            .onChange((value) => {
                this.state.set('enableFrustumCulling', value);
            });
            
        // Sphere performance mode toggle
        performanceFolder.add(this.state.state, 'sphereHighPerformanceMode')
            .name('High Performance')
            .onChange(() => {
                this.state.set('sphereHighPerformanceMode', this.state.get('sphereHighPerformanceMode'));
                this.app.scene.updateSphereMaterials();
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
        this.addConfiguredController(bloomFolder, 'bloomStrength', 'Strength', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(bloomFolder, 'bloomRadius', 'Radius', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(bloomFolder, 'bloomThreshold', 'Threshold', () => {
            this.app.scene.updatePostProcessing();
        });
        
        // Chromatic aberration controls
        const chromaticFolder = postProcessingFolder.addFolder('Chromatic Aberration');
        chromaticFolder.add(this.state.state, 'chromaticAberrationEnabled').name('Enable Chromatic Aberration').onChange(() => {
            this.state.set('chromaticAberrationEnabled', this.state.get('chromaticAberrationEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(chromaticFolder, 'chromaticIntensity', 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        
        // Vignette controls
        const vignetteFolder = postProcessingFolder.addFolder('Vignette');
        vignetteFolder.add(this.state.state, 'vignetteEnabled').name('Enable Vignette').onChange(() => {
            this.state.set('vignetteEnabled', this.state.get('vignetteEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(vignetteFolder, 'vignetteIntensity', 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(vignetteFolder, 'vignetteRadius', 'Radius', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(vignetteFolder, 'vignetteSoftness', 'Softness', () => {
            this.app.scene.updatePostProcessing();
        });
        
        // Film grain controls
        const grainFolder = postProcessingFolder.addFolder('Film Grain');
        grainFolder.add(this.state.state, 'grainEnabled').name('Enable Film Grain').onChange(() => {
            this.state.set('grainEnabled', this.state.get('grainEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(grainFolder, 'grainIntensity', 'Intensity', () => {
            this.app.scene.updatePostProcessing();
        });
        
        // Color grading controls
        const colorGradingFolder = postProcessingFolder.addFolder('Color Grading');
        colorGradingFolder.add(this.state.state, 'colorGradingEnabled').name('Enable Color Grading').onChange(() => {
            this.state.set('colorGradingEnabled', this.state.get('colorGradingEnabled'));
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(colorGradingFolder, 'colorHue', 'Hue Shift', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(colorGradingFolder, 'colorSaturation', 'Saturation', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(colorGradingFolder, 'colorBrightness', 'Brightness', () => {
            this.app.scene.updatePostProcessing();
        });
        this.addConfiguredController(colorGradingFolder, 'colorContrast', 'Contrast', () => {
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
            
            // Light color control
            this.addColorController(lightingFolder, 'lightColour', 'Light Colour', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Ambient & Directional Lights Folder
            const ambientDirectionalFolder = lightingFolder.addFolder('Ambient & Directional');
            
            // Ambient light control
            this.addConfiguredController(ambientDirectionalFolder, 'ambientLightIntensity', 'Ambient Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Directional light control
            this.addConfiguredController(ambientDirectionalFolder, 'directionalLightIntensity', 'Directional Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Point Lights Folder
            const pointLightsFolder = lightingFolder.addFolder('Point Lights');
            
            // Point light 1 control
            this.addConfiguredController(pointLightsFolder, 'pointLight1Intensity', 'Point Light 1', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Point light 2 control
            this.addConfiguredController(pointLightsFolder, 'pointLight2Intensity', 'Point Light 2', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Special Effects Lights Folder
            const effectsLightsFolder = lightingFolder.addFolder('Special Effects');
            
            // Rim light control
            this.addConfiguredController(effectsLightsFolder, 'rimLightIntensity', 'Rim Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
            
            // Accent light control
            this.addConfiguredController(effectsLightsFolder, 'accentLightIntensity', 'Accent Light', () => {
                if (this.app && this.app.scene) {
                    this.app.scene.updateLighting();
                }
            });
        } catch (error) {
            console.error('Error setting up lighting controls:', error);
        }
    }

    addController(folder, key, min, max, step, name, onChange = null) {
        const controller = folder.add(this.state.state, key, min, max, step).name(name);
        
        if (onChange) {
            controller.onChange((value) => {
                this.state.set(key, value);
                onChange(value);
            });
        } else {
            controller.onChange((value) => {
                this.state.set(key, value);
            });
        }
        
        this.controllers.set(key, controller);
        return controller;
    }

    /**
     * Add controller using configuration constants
     * Automatically looks up min, max, step from GUI_CONTROL_CONFIGS
     */
    addConfiguredController(folder, key, name, onChange = null) {
        const config = GUI_CONTROL_CONFIGS[key];
        if (!config) {
            console.warn(`No GUI config found for parameter: ${key}, using default values`);
            return this.addController(folder, key, 0, 1, 0.01, name, onChange);
        }
        
        return this.addController(folder, key, config.min, config.max, config.step, name, onChange);
    }

    addColorController(folder, key, name, onChange = null) {
        const controller = folder.addColor(this.state.state, key).name(name);
        
        if (onChange) {
            controller.onChange((value) => {
                this.state.set(key, value);
                onChange(value);
            });
        } else {
            controller.onChange((value) => {
                this.state.set(key, value);
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
            '64th': '64th',
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
            '64th': '64th',
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

    setupCameraControls() {
        console.log('Setting up camera controls...');
        const cameraFolder = this.gui.addFolder('Camera');
        
        // Debug: Check if GUI_CONTROL_CONFIGS has camera parameters
        console.log('GUI_CONTROL_CONFIGS cameraRotationX:', GUI_CONTROL_CONFIGS.cameraRotationX);
        console.log('GUI_CONTROL_CONFIGS cameraRotationY:', GUI_CONTROL_CONFIGS.cameraRotationY);
        console.log('GUI_CONTROL_CONFIGS cameraRotationZ:', GUI_CONTROL_CONFIGS.cameraRotationZ);
        console.log('GUI_CONTROL_CONFIGS cameraDistance:', GUI_CONTROL_CONFIGS.cameraDistance);
        
        // Ensure camera parameters exist in state
        if (!this.state.has('cameraRotationX')) {
            this.state.set('cameraRotationX', 0);
        }
        if (!this.state.has('cameraRotationY')) {
            this.state.set('cameraRotationY', 0);
        }
        if (!this.state.has('cameraRotationZ')) {
            this.state.set('cameraRotationZ', 0);
        }
        if (!this.state.has('cameraDistance')) {
            this.state.set('cameraDistance', 10);
        }
        if (!this.state.has('isometricEnabled')) {
            this.state.set('isometricEnabled', false);
        }
        
        console.log('Camera parameters in state:', {
            cameraRotationX: this.state.get('cameraRotationX'),
            cameraRotationY: this.state.get('cameraRotationY'),
            cameraRotationZ: this.state.get('cameraRotationZ'),
            cameraDistance: this.state.get('cameraDistance'),
            isometricEnabled: this.state.get('isometricEnabled')
        });
        
        // Camera rotation controls
        this.addConfiguredController(cameraFolder, 'cameraRotationX', 'Rotation X (Pitch)', () => {
            this.state.set('cameraRotationX', this.state.get('cameraRotationX'));
            this.app.scene.updateCameraRotation();
        });
        
        this.addConfiguredController(cameraFolder, 'cameraRotationY', 'Rotation Y (Yaw)', () => {
            this.state.set('cameraRotationY', this.state.get('cameraRotationY'));
            this.app.scene.updateCameraRotation();
        });
        
        this.addConfiguredController(cameraFolder, 'cameraRotationZ', 'Rotation Z (Roll)', () => {
            this.state.set('cameraRotationZ', this.state.get('cameraRotationZ'));
            this.app.scene.updateCameraRotation();
        });
        
        // Camera distance control
        this.addConfiguredController(cameraFolder, 'cameraDistance', 'Distance (Zoom)', () => {
            this.state.set('cameraDistance', this.state.get('cameraDistance'));
            this.app.scene.updateCameraRotation();
        });
        
        // Isometric preset toggle
        cameraFolder.add(this.state.state, 'isometricEnabled').name('Isometric View').onChange(() => {
            this.state.set('isometricEnabled', this.state.get('isometricEnabled'));
            this.app.scene.setIsometricView();
        });
        
        // Reset camera button
        const resetCamera = () => {
            this.state.set('cameraRotationX', 0);
            this.state.set('cameraRotationY', 0);
            this.state.set('cameraRotationZ', 0);
            this.state.set('cameraDistance', 10);
            this.state.set('isometricEnabled', false);
            this.app.scene.updateCameraRotation();
        };
        
        cameraFolder.add({ resetCamera }, 'resetCamera').name('Reset Camera');
        
        console.log('Camera controls setup complete');
    }
    
} 