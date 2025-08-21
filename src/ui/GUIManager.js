/**
 * GUIManager.js - User Interface and Control Management
 * This module manages the dat.GUI interface and all user controls for the application, including
 * parameter sliders, color pickers, folder organization, and real-time UI updates. It handles
 * the creation and management of all GUI elements, ensures proper parameter binding to the state
 * system, and provides an intuitive interface for controlling all application features.
 * Now supports tabbed interface with separate GUI instances for better organization.
 */

import { GUI } from 'dat.gui';
import { GUI_CONTROL_CONFIGS, ConfigHelpers } from '../config/index.js';

export class GUIManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.mainGui = null;
        this.gridLinesGui = null;
        this.controllers = new Map();
        this.gridLinesControllers = new Map();
        
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
            // Clean up existing GUIs
            if (this.mainGui) this.mainGui.destroy();
            if (this.gridLinesGui) this.gridLinesGui.destroy();
            
            // Create main GUI container
            const mainContainer = document.getElementById('gui-container');
            if (!mainContainer) {
                console.error('GUI container not found');
                return;
            }

            // Create tabbed interface
            this.createTabbedInterface(mainContainer);
            
            console.log('Setting up GUI controls...');
            
            // Setup main GUI controls
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
            try { this.setupLayerControls(); console.log('Layer controls OK'); } catch (e) { console.error('Layer controls failed:', e); }
            
            // Setup grid lines GUI controls
            try { this.setupGridLinesControls(); console.log('Grid lines controls OK'); } catch (e) { console.error('Grid lines controls failed:', e); }
            
            // Setup sphere layer GUI controls
            try { this.setupSphereLayerControls(); console.log('Sphere layer controls OK'); } catch (e) { console.error('Sphere layer controls failed:', e); }
            
            // Collapse all folders by default
            this.collapseAllFolders();
            console.log('GUI initialization complete');
        } catch (error) {
            console.error('Error during GUI initialization:', error);
        }
    }

    /**
     * Create tabbed interface with main and grid lines tabs
     */
    createTabbedInterface(container) {
        // Clear container
        container.innerHTML = '';
        
        // Create tab container
        const tabContainer = document.createElement('div');
        tabContainer.className = 'gui-tabs';
        tabContainer.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            border-left: 1px solid #333;
            display: flex;
            flex-direction: column;
        `;
        
        // Create tab buttons
        const tabButtons = document.createElement('div');
        tabButtons.style.cssText = `
            display: flex;
            border-bottom: 1px solid #333;
            background: rgba(0, 0, 0, 0.9);
        `;
        
        const mainTab = document.createElement('button');
        mainTab.textContent = 'Main Controls';
        mainTab.className = 'gui-tab active';
        mainTab.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            background: #2a2a2a;
            color: #fff;
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        `;
        
        const gridLinesTab = document.createElement('button');
        gridLinesTab.textContent = 'Grid Lines';
        gridLinesTab.className = 'gui-tab';
        gridLinesTab.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            background: #1a1a1a;
            color: #ccc;
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        `;
        
        // Create content containers
        const mainContent = document.createElement('div');
        mainContent.id = 'main-gui-container';
        mainContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
            display: block;
        `;
        
        const gridLinesContent = document.createElement('div');
        gridLinesContent.id = 'grid-lines-gui-container';
        gridLinesContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
            display: none;
        `;
        
        // Add event listeners
        mainTab.addEventListener('click', () => {
            this.switchTab('main', mainTab, gridLinesTab, mainContent, gridLinesContent);
        });
        
        gridLinesTab.addEventListener('click', () => {
            this.switchTab('grid-lines', gridLinesTab, mainTab, gridLinesContent, mainContent);
        });
        
        // Assemble the interface
        tabButtons.appendChild(mainTab);
        tabButtons.appendChild(gridLinesTab);
        tabContainer.appendChild(tabButtons);
        tabContainer.appendChild(mainContent);
        tabContainer.appendChild(gridLinesContent);
        container.appendChild(tabContainer);
        
        // Create GUI instances
        this.mainGui = new GUI({ container: mainContent });
        this.gridLinesGui = new GUI({ container: gridLinesContent });
    }

    /**
     * Switch between tabs
     */
    switchTab(activeTab, activeButton, inactiveButton, activeContent, inactiveContent) {
        // Update button styles
        activeButton.style.background = '#2a2a2a';
        activeButton.style.color = '#fff';
        inactiveButton.style.background = '#1a1a1a';
        inactiveButton.style.color = '#ccc';
        
        // Update content visibility
        activeContent.style.display = 'block';
        inactiveContent.style.display = 'none';
        
        // Update button classes
        activeButton.className = 'gui-tab active';
        inactiveButton.className = 'gui-tab';
    }
    
    collapseAllFolders() {
        // This method ensures all folders start collapsed
    }

    setupShapeControls() {
        const shapeFolder = this.mainGui.addFolder('Shapes');
        
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
        const compositionFolder = this.mainGui.addFolder('Composition');
        
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
        const colorFolder = this.mainGui.addFolder('Colors');
        
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
        const sphereFolder = this.mainGui.addFolder('Refractive Spheres');
        
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
        const animationFolder = this.mainGui.addFolder('Animation');
        
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
        const morphingFolder = this.mainGui.addFolder('Shape Morphing');
        
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
        const performanceFolder = this.mainGui.addFolder('Performance');
        
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
        const postProcessingFolder = this.mainGui.addFolder('Post Processing');
        
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
            const lightingFolder = this.mainGui.addFolder('Lighting');
            
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
        if (this.mainGui) {
            this.mainGui.destroy();
            this.mainGui = null;
        }
        if (this.gridLinesGui) {
            this.gridLinesGui.destroy();
            this.gridLinesGui = null;
        }
        this.controllers.clear();
        this.gridLinesControllers.clear();
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
        const cameraFolder = this.mainGui.addFolder('Camera');
        
        // Ensure camera parameters exist in state
        if (!this.state.has('cameraRotationX')) {
            this.state.set('cameraRotationX', GUI_CONTROL_CONFIGS.cameraRotationX.default);
        }
        if (!this.state.has('cameraRotationY')) {
            this.state.set('cameraRotationY', GUI_CONTROL_CONFIGS.cameraRotationY.default);
        }
        if (!this.state.has('cameraRotationZ')) {
            this.state.set('cameraRotationZ', GUI_CONTROL_CONFIGS.cameraRotationZ.default);
        }
        if (!this.state.has('cameraDistance')) {
            this.state.set('cameraDistance', GUI_CONTROL_CONFIGS.cameraDistance.default);
        }
        if (!this.state.has('isometricEnabled')) {
            this.state.set('isometricEnabled', GUI_CONTROL_CONFIGS.isometricEnabled.default);
        }
        
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
        
        // Isometric preset button
        const toggleIsometric = () => {
            const currentValue = this.state.get('isometricEnabled');
            const newValue = !currentValue;
            this.state.set('isometricEnabled', newValue);
            this.app.scene.setIsometricView();
        };
        cameraFolder.add({ toggleIsometric }, 'toggleIsometric').name('Toggle Isometric View');
        
        // Reset camera button
        const resetCamera = () => {
            this.state.set('cameraRotationX', GUI_CONTROL_CONFIGS.cameraRotationX.default);
            this.state.set('cameraRotationY', GUI_CONTROL_CONFIGS.cameraRotationY.default);
            this.state.set('cameraRotationZ', GUI_CONTROL_CONFIGS.cameraRotationZ.default);
            this.state.set('cameraDistance', GUI_CONTROL_CONFIGS.cameraDistance.default);
            this.state.set('isometricEnabled', GUI_CONTROL_CONFIGS.isometricEnabled.default);
            this.app.scene.updateCameraRotation();
        };
        
        cameraFolder.add({ resetCamera }, 'resetCamera').name('Reset Camera');
    }

    setupLayerControls() {
        const layerFolder = this.mainGui.addFolder('Layers');
        
        // Ensure layer parameters exist in state
        if (!this.state.has('layerSpacing')) {
            this.state.set('layerSpacing', GUI_CONTROL_CONFIGS.layerSpacing.default);
        }
        if (!this.state.has('maxLayers')) {
            this.state.set('maxLayers', GUI_CONTROL_CONFIGS.maxLayers.default);
        }
        if (!this.state.has('autoArrangeLayers')) {
            this.state.set('autoArrangeLayers', GUI_CONTROL_CONFIGS.autoArrangeLayers.default);
        }
        
        // Layer spacing control
        this.addConfiguredController(layerFolder, 'layerSpacing', 'Layer Spacing', () => {
            this.state.set('layerSpacing', this.state.get('layerSpacing'));
            // Update layer positions when spacing changes
            if (this.app.layerManager) {
                this.app.layerManager.updateLayerZPositions();
            }
        });
        
        // Max layers control
        this.addConfiguredController(layerFolder, 'maxLayers', 'Max Layers', () => {
            this.state.set('maxLayers', this.state.get('maxLayers'));
            // Could add logic here to limit actual layer count
        });
        
        // Auto-arrange button
        const toggleAutoArrange = () => {
            const currentValue = this.state.get('autoArrangeLayers');
            const newValue = !currentValue;
            this.state.set('autoArrangeLayers', newValue);
            // Re-arrange layers if auto-arrange is enabled
            if (newValue && this.app.layerManager) {
                this.app.layerManager.updateLayerZPositions();
            }
        };
        layerFolder.add({ toggleAutoArrange }, 'toggleAutoArrange').name('Toggle Auto-arrange Layers');
        
        // Manual layer arrangement button
        const arrangeLayers = () => {
            if (this.app.layerManager) {
                this.app.layerManager.updateLayerZPositions();
            }
        };
        
        layerFolder.add({ arrangeLayers }, 'arrangeLayers').name('Arrange Layers Now');
        
        // Layer info display
        if (this.app.layerManager) {
            const layerCount = this.app.layerManager.layers.size;
            const layerInfo = { info: `${layerCount} layers active` };
            layerFolder.add(layerInfo, 'info').name('Layer Status');
        }
    }
    
    setupGridLinesControls() {
        const gridLinesFolder = this.gridLinesGui.addFolder('Grid Lines');
        
        // Ensure grid lines parameters exist in state
        if (!this.state.has('gridLineColor')) {
            this.state.set('gridLineColor', '#ff0000');
        }
        if (!this.state.has('gridLineWidth')) {
            this.state.set('gridLineWidth', 1);
        }
        if (!this.state.has('gridLineOpacity')) {
            this.state.set('gridLineOpacity', 1.0);
        }
        if (!this.state.has('showGridLines')) {
            this.state.set('showGridLines', true);
        }
        if (!this.state.has('gridLineDisplacementEnabled')) {
            this.state.set('gridLineDisplacementEnabled', false);
        }
        if (!this.state.has('gridLineDisplacementAmount')) {
            this.state.set('gridLineDisplacementAmount', 0.1);
        }
        if (!this.state.has('gridLineDisplacementSpeed')) {
            this.state.set('gridLineDisplacementSpeed', 1.0);
        }
        if (!this.state.has('gridLineDisplacementType')) {
            this.state.set('gridLineDisplacementType', 'wave');
        }
        
        // Grid line color control
        this.addColorController(gridLinesFolder, 'gridLineColor', 'Grid Line Color', () => {
            this.state.set('gridLineColor', this.state.get('gridLineColor'));
            this.updateGridLinesLayer();
        });
        
        // Grid line width control
        this.addController(gridLinesFolder, 'gridLineWidth', 0.1, 5.0, 0.1, 'Line Width', () => {
            this.state.set('gridLineWidth', this.state.get('gridLineWidth'));
            this.updateGridLinesLayer();
        });
        
        // Grid line opacity control
        this.addController(gridLinesFolder, 'gridLineOpacity', 0.0, 1.0, 0.01, 'Opacity', () => {
            this.state.set('gridLineOpacity', this.state.get('gridLineOpacity'));
            this.updateGridLinesLayer();
        });
        
        // Grid line visibility control
        gridLinesFolder.add(this.state.state, 'showGridLines').name('Show Grid Lines').onChange(() => {
            this.state.set('showGridLines', this.state.get('showGridLines'));
            this.updateGridLinesLayer();
        });
        
        // Displacement controls
        const displacementFolder = this.gridLinesGui.addFolder('Displacement Effects');
        
        // Displacement enable toggle
        displacementFolder.add(this.state.state, 'gridLineDisplacementEnabled').name('Enable Displacement').onChange(() => {
            this.state.set('gridLineDisplacementEnabled', this.state.get('gridLineDisplacementEnabled'));
            this.updateGridLinesLayer();
        });
        
        // Displacement amount
        this.addController(displacementFolder, 'gridLineDisplacementAmount', 0.0, 1.0, 0.01, 'Displacement Amount', () => {
            this.state.set('gridLineDisplacementAmount', this.state.get('gridLineDisplacementAmount'));
            this.updateGridLinesLayer();
        });
        
        // Displacement speed
        this.addController(displacementFolder, 'gridLineDisplacementSpeed', 0.1, 5.0, 0.1, 'Displacement Speed', () => {
            this.state.set('gridLineDisplacementSpeed', this.state.get('gridLineDisplacementSpeed'));
            this.updateGridLinesLayer();
        });
        
        // Displacement type
        displacementFolder.add(this.state.state, 'gridLineDisplacementType', ['wave', 'noise', 'spiral']).name('Displacement Type').onChange(() => {
            this.state.set('gridLineDisplacementType', this.state.get('gridLineDisplacementType'));
            this.updateGridLinesLayer();
        });
    }
    
    /**
     * Update grid lines layer with current state parameters
     */
    updateGridLinesLayer() {
        if (this.app.layerManager) {
            const gridLinesLayer = this.app.layerManager.layers.get('grid-lines');
            if (gridLinesLayer) {
                gridLinesLayer.setGridColor(this.state.get('gridLineColor'));
                gridLinesLayer.setLineThickness(this.state.get('gridLineWidth'));
                gridLinesLayer.setOpacity(this.state.get('gridLineOpacity'));
                gridLinesLayer.setDisplacementEnabled(this.state.get('gridLineDisplacementEnabled'));
                gridLinesLayer.setDisplacementAmount(this.state.get('gridLineDisplacementAmount'));
                gridLinesLayer.setDisplacementSpeed(this.state.get('gridLineDisplacementSpeed'));
                gridLinesLayer.setDisplacementType(this.state.get('gridLineDisplacementType'));
                
                // Update layer visibility
                gridLinesLayer.visible = this.state.get('showGridLines');
            }
        }
    }

    /**
     * Setup sphere layer controls
     */
    setupSphereLayerControls() {
        // Ensure sphere layer parameters exist in state
        if (!this.state.has('sphereGridWidth')) {
            this.state.set('sphereGridWidth', 10);
        }
        if (!this.state.has('sphereGridHeight')) {
            this.state.set('sphereGridHeight', 6);
        }
        if (!this.state.has('sphereCellSize')) {
            this.state.set('sphereCellSize', 1.0);
        }


        const sphereLayerFolder = this.mainGui.addFolder('Sphere Layer');
        
        // Grid Layout Controls
        const gridFolder = sphereLayerFolder.addFolder('Grid Layout');
        
        this.addConfiguredController(gridFolder, 'sphereGridWidth', 'Grid Width', () => {
            this.state.set('sphereGridWidth', this.state.get('sphereGridWidth'));
            this.updateSphereLayer();
        });
        
        this.addConfiguredController(gridFolder, 'sphereGridHeight', 'Grid Height', () => {
            this.state.set('sphereGridHeight', this.state.get('sphereGridHeight'));
            this.updateSphereLayer();
        });
        
        this.addConfiguredController(gridFolder, 'sphereCellSize', 'Cell Size', () => {
            this.state.set('sphereCellSize', this.state.get('sphereCellSize'));
            this.updateSphereLayer();
        });
    }

    /**
     * Update sphere layer with current state parameters
     */
    updateSphereLayer() {
        if (this.app.layerManager) {
            const sphereLayer = this.app.layerManager.layers.get('sphere-layer');
            if (sphereLayer) {
                // Update grid properties
                sphereLayer.setGridSize(
                    this.state.get('sphereGridWidth'),
                    this.state.get('sphereGridHeight')
                );
                sphereLayer.setCellSize(this.state.get('sphereCellSize'));
            }
        }
    }
} 