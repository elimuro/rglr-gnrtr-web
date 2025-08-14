/**
 * Scene.js - 3D Scene Management
 * This module manages the Three.js 3D scene, including camera setup, renderer configuration, lighting,
 * shape generation, grid creation, and rendering pipeline. It handles all visual aspects of the application,
 * including shape animations, material updates, post-processing effects, and performance optimizations like
 * frustum culling and object pooling for efficient rendering.
 */

import * as THREE from 'three';
import { ShapeGenerator } from '../modules/ShapeGenerator.js';
import { MaterialManager } from '../modules/MaterialManager.js';
import { ObjectPool } from '../modules/ObjectPool.js';
import { AnimationSystem } from '../modules/AnimationSystem.js';
import { ShapeAnimationManager } from '../modules/ShapeAnimationManager.js';
import { GridManager } from '../modules/GridManager.js';
import { LightingManager } from '../modules/LightingManager.js';
import { PerformanceManager } from '../modules/PerformanceManager.js';
import { PostProcessingManager } from '../modules/PostProcessingManager.js';

export class Scene {
    constructor(state, app = null) {
        this.state = state;
        this.app = app;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        // Grid-related arrays are now managed by GridManager
        // Keep references for backward compatibility
        this.shapes = [];
        this.gridLines = [];
        this.composition = [];
        this.shapeGenerator = new ShapeGenerator();
        this.materialManager = new MaterialManager();
        this.objectPool = new ObjectPool();
        this.animationSystem = new AnimationSystem();
        this.shapeAnimationManager = new ShapeAnimationManager(state, this.shapeGenerator, this.materialManager);
        this.shapeAnimationManager.setObjectPool(this.objectPool);
        this.shapeAnimationManager.setUpdateMeshShapeCallback((mesh, shapeName) => {
            this.updateMeshShape(mesh, shapeName);
        });
        
        // Initialize grid manager
        this.gridManager = new GridManager(state, this.shapeGenerator, this.materialManager, this.objectPool, this.shapeAnimationManager);
        this.gridManager.setScene(this.scene);
        this.gridManager.setUpdateMeshShapeCallback((mesh, shapeName) => {
            this.updateMeshShape(mesh, shapeName);
        });
        
        // Initialize lighting manager
        this.lightingManager = new LightingManager(state);
        this.lightingManager.setScene(this.scene);
        
        // Initialize performance manager
        this.performanceManager = new PerformanceManager(state, this.objectPool);
        
        // BPM timing manager reference (will be set by App.js)
        this.bpmTimingManager = null;
        
        this.postProcessingManager = null;
        
        // Performance-related properties are now managed by PerformanceManager
        // Keep references for backward compatibility
        this.frustum = new THREE.Frustum();
        this.projectionMatrix = new THREE.Matrix4();
        this.viewMatrix = new THREE.Matrix4();
        this.visibleShapes = new Set();
        
        this.setupCamera();
        this.setupRenderer();
        
        // Light references are now managed by LightingManager
        // Keep reference for backward compatibility
        this.lights = {};
        
        this.setupEventListeners();
    }

    init() {
        try {
            this.createGrid();
            this.updateBackgroundColor();
            
            // Setup lighting after state is initialized
            this.setupLighting();
            
            // Setup performance manager references
            this.setupPerformanceManager();
            
            // Initialize post-processing
            this.postProcessingManager = new PostProcessingManager(this.scene, this.camera, this.renderer);
            
            // Apply initial post-processing settings
            this.updatePostProcessing();
        } catch (error) {
            console.error('Error during Scene initialization:', error);
        }
    }

    setupCamera() {
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -200, window.innerWidth / 200,
            window.innerHeight / 200, window.innerHeight / -200,
            0.1, 1000
        );
        this.camera.position.z = 10;
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2; // Slightly increased exposure
        this.renderer.physicallyCorrectLights = true; // Better for physical materials
        document.body.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        // Delegate to lighting manager
        this.lightingManager.setupLighting();
        
        // Update local reference for backward compatibility
        this.lights = this.lightingManager.getAllLights();
    }

    setupPerformanceManager() {
        // Set scene references for performance manager
        this.performanceManager.setSceneReferences(this.shapes, this.camera, this.renderer, this.scene);
        
        // Update local references for backward compatibility
        this.frustum = this.performanceManager.frustum;
        this.projectionMatrix = this.performanceManager.projectionMatrix;
        this.viewMatrix = this.performanceManager.viewMatrix;
        this.visibleShapes = this.performanceManager.getVisibleShapes();
    }

    // Legacy method - kept for backward compatibility
    setupLightingLegacy() {
        // Add safety check for state initialization
        if (!this.state.isInitialized()) {
            console.warn('StateManager not initialized, using default lighting values');
            // Use default values if state is not ready
            const defaultIntensities = {
                ambientLightIntensity: 0.97,
                directionalLightIntensity: 0.04,
                pointLight1Intensity: 2.94,
                pointLight2Intensity: 3,
                rimLightIntensity: 3,
                accentLightIntensity: 2.97
            };
            
            // Enhanced ambient light for better overall illumination
            const ambientLight = new THREE.AmbientLight(0x404040, defaultIntensities.ambientLightIntensity);
            this.scene.add(ambientLight);
            this.lights.ambient = ambientLight;

            // Main directional light for shadows and primary illumination
            const directionalLight = new THREE.DirectionalLight(0xffffff, defaultIntensities.directionalLightIntensity);
            directionalLight.position.set(10, 10, 5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            this.scene.add(directionalLight);
            this.lights.directional = directionalLight;

            // Enhanced point light for refractive materials
            const pointLight = new THREE.PointLight(0xffffff, defaultIntensities.pointLight1Intensity, 100);
            pointLight.position.set(0, 0, 10);
            this.scene.add(pointLight);
            this.lights.point1 = pointLight;

            // Additional point light for better sphere illumination
            const pointLight2 = new THREE.PointLight(0x87ceeb, defaultIntensities.pointLight2Intensity, 80);
            pointLight2.position.set(-5, 5, 8);
            this.scene.add(pointLight2);
            this.lights.point2 = pointLight2;

            // Rim light for better sphere definition
            const rimLight = new THREE.DirectionalLight(0xffffff, defaultIntensities.rimLightIntensity);
            rimLight.position.set(-8, -8, 3);
            this.scene.add(rimLight);
            this.lights.rim = rimLight;

            // Colored accent light for more interesting lighting
            const accentLight = new THREE.PointLight(0xff6b6b, defaultIntensities.accentLightIntensity, 60);
            accentLight.position.set(8, -5, 6);
            this.scene.add(accentLight);
            this.lights.accent = accentLight;
            
            return;
        }
        
        // Get light color from state or use default
        const lightColor = this.state.get('lightColour') || '#ffffff';
        const lightColorHex = parseInt(lightColor.replace('#', ''), 16);
        
        // Enhanced ambient light for better overall illumination
        const ambientLight = new THREE.AmbientLight(lightColorHex, this.state.get('ambientLightIntensity'));
        this.scene.add(ambientLight);
        this.lights.ambient = ambientLight;

        // Main directional light for shadows and primary illumination
        const directionalLight = new THREE.DirectionalLight(lightColorHex, this.state.get('directionalLightIntensity'));
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
        this.lights.directional = directionalLight;

        // Enhanced point light for refractive materials
        const pointLight = new THREE.PointLight(lightColorHex, this.state.get('pointLight1Intensity'), 100);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);
        this.lights.point1 = pointLight;

        // Additional point light for better sphere illumination (keep some blue tint)
        const pointLight2Color = this.blendColors(lightColorHex, 0x87ceeb, 0.7);
        const pointLight2 = new THREE.PointLight(pointLight2Color, this.state.get('pointLight2Intensity'), 80);
        pointLight2.position.set(-5, 5, 8);
        this.scene.add(pointLight2);
        this.lights.point2 = pointLight2;

        // Rim light for better sphere definition
        const rimLight = new THREE.DirectionalLight(lightColorHex, this.state.get('rimLightIntensity'));
        rimLight.position.set(-8, -8, 3);
        this.scene.add(rimLight);
        this.lights.rim = rimLight;

        // Colored accent light for more interesting lighting (keep some red tint)
        const accentLightColor = this.blendColors(lightColorHex, 0xff6b6b, 0.6);
        const accentLight = new THREE.PointLight(accentLightColor, this.state.get('accentLightIntensity'), 60);
        accentLight.position.set(8, -5, 6);
        this.scene.add(accentLight);
        this.lights.accent = accentLight;
    }

    setupEventListeners() {
        // Subscribe to state changes
        this.state.subscribe('backgroundColor', () => this.updateBackgroundColor());
        this.state.subscribe('gridWidth', () => this.createGrid());
        this.state.subscribe('gridHeight', () => this.createGrid());
        this.state.subscribe('compositionWidth', () => this.createGrid());
        this.state.subscribe('compositionHeight', () => this.createGrid());
        this.state.subscribe('enabledShapes', () => this.createGrid());
        this.state.subscribe('randomness', () => this.createGrid());
        this.state.subscribe('showGrid', () => this.updateGridLines());
        this.state.subscribe('gridColor', () => this.updateGridLines());
        this.state.subscribe('cellSize', () => this.updateCellSize());
        this.state.subscribe('shapeColor', () => this.updateShapeColors());
        this.state.subscribe('sphereRefraction', () => this.updateSphereMaterials());
        this.state.subscribe('sphereTransparency', () => this.updateSphereMaterials());
        this.state.subscribe('sphereTransmission', () => this.updateSphereMaterials());
        this.state.subscribe('sphereRoughness', () => this.updateSphereMaterials());
        this.state.subscribe('sphereMetalness', () => this.updateSphereMaterials());
        this.state.subscribe('sphereScale', () => this.updateSphereScales());
        this.state.subscribe('sphereClearcoat', () => this.updateSphereMaterials());
        this.state.subscribe('sphereClearcoatRoughness', () => this.updateSphereMaterials());
        this.state.subscribe('sphereEnvMapIntensity', () => this.updateSphereMaterials());
        this.state.subscribe('sphereWaterDistortion', () => this.updateSphereMaterials());
        
        // Lighting state subscriptions are now handled by LightingManager
        this.lightingManager.setupLightingEventListeners();
        
        // Post-processing state subscriptions
        this.state.subscribe('bloomEnabled', () => this.updatePostProcessing());
        this.state.subscribe('bloomStrength', () => this.updatePostProcessing());
        this.state.subscribe('bloomRadius', () => this.updatePostProcessing());
        this.state.subscribe('bloomThreshold', () => this.updatePostProcessing());
        this.state.subscribe('chromaticAberrationEnabled', () => this.updatePostProcessing());
        this.state.subscribe('chromaticIntensity', () => this.updatePostProcessing());
        this.state.subscribe('vignetteEnabled', () => this.updatePostProcessing());
        this.state.subscribe('vignetteIntensity', () => this.updatePostProcessing());
        this.state.subscribe('vignetteRadius', () => this.updatePostProcessing());
        this.state.subscribe('vignetteSoftness', () => this.updatePostProcessing());
        this.state.subscribe('grainEnabled', () => this.updatePostProcessing());
        this.state.subscribe('grainIntensity', () => this.updatePostProcessing());
        this.state.subscribe('colorGradingEnabled', () => this.updatePostProcessing());
        this.state.subscribe('colorHue', () => this.updatePostProcessing());
        this.state.subscribe('colorSaturation', () => this.updatePostProcessing());
        this.state.subscribe('colorBrightness', () => this.updatePostProcessing());
        this.state.subscribe('colorContrast', () => this.updatePostProcessing());
        
        // Center scaling state subscriptions
        this.state.subscribe('centerScalingEnabled', () => this.updateCenterScaling());
        this.state.subscribe('centerScalingIntensity', () => this.updateCenterScaling());
        this.state.subscribe('centerScalingCurve', () => this.updateCenterScaling());
        this.state.subscribe('centerScalingRadius', () => this.updateCenterScaling());
        this.state.subscribe('centerScalingDirection', () => this.updateCenterScaling());
        this.state.subscribe('centerScalingAnimationSpeed', () => this.updateCenterScaling());
        this.state.subscribe('centerScalingAnimationType', () => this.updateCenterScaling());
    }

    updateBackgroundColor() {
        const backgroundColor = this.state.get('backgroundColor');
        this.renderer.setClearColor(new THREE.Color(backgroundColor));
    }

    createGrid() {
        // Delegate to grid manager
        this.gridManager.createGrid();
        
        // Update local references for backward compatibility
        this.shapes = this.gridManager.getAllShapes();
        this.gridLines = this.gridManager.getAllGridLines();
        this.composition = this.gridManager.getComposition();
    }

    // Legacy method - kept for backward compatibility
    createGridLegacy() {
        // Return old shapes to pool
        for (const mesh of this.shapes) {
            if (mesh && mesh.userData && mesh.userData.shapeName) {
                this.objectPool.returnMesh(mesh.userData.shapeName, mesh);
            }
        }
        this.shapes = [];

        // Remove old grid lines
        if (this.gridLines) {
            for (const line of this.gridLines) {
                this.scene.remove(line);
            }
        }
        this.gridLines = [];

        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;

        // Create the composition first
        this.composition = [];
        const compositionWidth = this.state.get('compositionWidth');
        const compositionHeight = this.state.get('compositionHeight');
        const enabledShapes = this.state.get('enabledShapes');
        const randomness = this.state.get('randomness');

        for (let x = 0; x < compositionWidth; x++) {
            for (let y = 0; y < compositionHeight; y++) {
                let shapeName;
                const availableShapes = this.shapeGenerator.getAvailableShapes(enabledShapes);
                
                if (availableShapes.length === 0) {
                    shapeName = 'Rect'; // Default shape
                } else {
                    const useRandomShape = Math.random() < randomness;
                    shapeName = useRandomShape ? 
                        availableShapes[Math.floor(Math.random() * availableShapes.length)] :
                        availableShapes[0];
                }
                this.composition.push(shapeName);
            }
        }

        // Now create the display grid
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                let mesh;
                
                // Map display coordinates to composition coordinates
                const compX = Math.floor((x / gridWidth) * compositionWidth);
                const compY = Math.floor((y / gridHeight) * compositionHeight);
                const shapeIndex = compY * compositionWidth + compX;
                const shapeName = this.composition[shapeIndex] || 'Rect';

                // Get mesh from pool or create new one
                let material;
                if (shapeName.startsWith('sphere_')) {
                    material = this.materialManager.getSphereMaterial(this.state);
                } else {
                    material = this.materialManager.getBasicMaterial(this.state.get('shapeColor'));
                }
                
                mesh = this.objectPool.getMesh(shapeName, material);
                
                if (mesh) {
                    // Get geometry from pool or create new one
                    const geometry = this.objectPool.getGeometry(shapeName, this.shapeGenerator);
                    if (geometry) {
                        mesh.geometry = geometry;
                        
                        // Store shape name for pooling
                        mesh.userData.shapeName = shapeName;
                        
                        // Enable shadows for spheres
                        if (shapeName.startsWith('sphere_')) {
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                            // Apply sphere scale
                            const sphereScale = cellSize * this.state.get('sphereScale');
                            mesh.scale.set(sphereScale, sphereScale, sphereScale);
                        }
                    }
                }

                // Position the shape
                mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                
                // Calculate center scaling factor
                const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize);
                
                // Scale the shape with center scaling applied
                if (shapeName.startsWith('sphere_')) {
                    // Apply sphere scale factor for spheres
                    const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                    mesh.scale.set(sphereScale, sphereScale, sphereScale);
                } else {
                    const baseScale = cellSize * centerScalingFactor;
                    mesh.scale.set(baseScale, baseScale, 1);
                }

                this.scene.add(mesh);
                this.shapes.push(mesh);
            }
        }

        // Draw grid lines if enabled
        this.updateGridLines();
        
        // Update cell size to ensure positions/scales are correct
        this.updateCellSize();
    }

    updateGridLines() {
        // Delegate to grid manager
        this.gridManager.updateGridLines();
        
        // Update local reference for backward compatibility
        this.gridLines = this.gridManager.getAllGridLines();
    }

    // Legacy method - kept for backward compatibility
    updateGridLinesLegacy() {
        // Remove old grid lines
        if (this.gridLines) {
            for (const line of this.gridLines) {
                this.scene.remove(line);
            }
        }
        this.gridLines = [];
        
        if (!this.state.get('showGrid')) return;
        
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        const gridColor = this.state.get('gridColor') || '#ff0000';
        const lineMaterial = new THREE.LineBasicMaterial({ color: gridColor });
        
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
        // Delegate to grid manager
        this.gridManager.updateCellSize();
        
        // Update local references for backward compatibility
        this.shapes = this.gridManager.getAllShapes();
        this.gridLines = this.gridManager.getAllGridLines();
    }

    // Legacy method - kept for backward compatibility
    updateCellSizeLegacy() {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
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
                    
                    // Calculate center scaling factor
                    const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize);
                    
                    if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                        const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                        mesh.scale.set(sphereScale, sphereScale, sphereScale);
                    } else {
                        const baseScale = cellSize * centerScalingFactor;
                        mesh.scale.set(baseScale, baseScale, 1);
                    }
                }
                i++;
            }
        }
        
        // Update grid lines
        this.updateGridLines();
    }

    updateShapeColors() {
        const shapeColor = this.state.get('shapeColor');
        this.shapes.forEach(mesh => {
            if (mesh.material && mesh.material.color) {
                mesh.material.color.set(shapeColor);
            }
        });
    }

    updateSphereMaterials() {
        this.shapes.forEach(mesh => {
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                mesh.material = this.materialManager.getSphereMaterial(this.state);
            }
        });
    }

    updateSphereScales() {
        const cellSize = this.state.get('cellSize');
        const sphereScale = this.state.get('sphereScale');
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        
        let shapeIndex = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[shapeIndex];
                if (mesh && mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                    const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize);
                    const finalScale = sphereScale * cellSize * centerScalingFactor;
                    mesh.scale.set(finalScale, finalScale, finalScale);
                }
                shapeIndex++;
            }
        }
    }

    updateCenterScaling() {
        const cellSize = this.state.get('cellSize');
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        
        // Debug: Check if center scaling is enabled
        const isEnabled = this.state.get('centerScalingEnabled');
        if (isEnabled) {
            console.log('Center scaling is enabled, updating shapes...');
            console.log('Center scaling settings:', {
                intensity: this.state.get('centerScalingIntensity'),
                curve: this.state.get('centerScalingCurve'),
                radius: this.state.get('centerScalingRadius'),
                direction: this.state.get('centerScalingDirection'),
                animation: this.state.get('centerScalingAnimation'),
                animationSpeed: this.state.get('centerScalingAnimationSpeed'),
                animationType: this.state.get('centerScalingAnimationType')
            });
        }
        
        let shapeIndex = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[shapeIndex];
                if (mesh) {
                    const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize);
                    
                    // Debug: Log scaling factors for a few shapes
                    if (x === 0 && y === 0) {
                        console.log('Center shape scaling factor:', centerScalingFactor);
                    } else if (x === gridWidth - 1 && y === gridHeight - 1) {
                        console.log('Corner shape scaling factor:', centerScalingFactor);
                    }
                    
                    if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                        const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                        mesh.scale.set(sphereScale, sphereScale, sphereScale);
                    } else {
                        const baseScale = cellSize * centerScalingFactor;
                        mesh.scale.set(baseScale, baseScale, 1);
                    }
                }
                shapeIndex++;
            }
        }
    }

    updatePostProcessing() {
        if (!this.postProcessingManager) {
            console.warn('PostProcessingManager not initialized');
            return;
        }
        
        // Update effect enabled states
        if (this.state.get('bloomEnabled')) {
            this.postProcessingManager.enableEffect('bloom');
        } else {
            this.postProcessingManager.disableEffect('bloom');
        }
        
        if (this.state.get('chromaticAberrationEnabled')) {
            this.postProcessingManager.enableEffect('chromaticAberration');
        } else {
            this.postProcessingManager.disableEffect('chromaticAberration');
        }
        
        if (this.state.get('vignetteEnabled')) {
            this.postProcessingManager.enableEffect('vignette');
        } else {
            this.postProcessingManager.disableEffect('vignette');
        }
        
        if (this.state.get('grainEnabled')) {
            this.postProcessingManager.enableEffect('grain');
        } else {
            this.postProcessingManager.disableEffect('grain');
        }
        
        if (this.state.get('colorGradingEnabled')) {
            this.postProcessingManager.enableEffect('colorGrading');
        } else {
            this.postProcessingManager.disableEffect('colorGrading');
        }
        
        if (this.state.get('fxaaEnabled')) {
            this.postProcessingManager.enableEffect('fxaa');
        } else {
            this.postProcessingManager.disableEffect('fxaa');
        }
        
        // Update effect parameters
        this.postProcessingManager.setBloomParameters(
            this.state.get('bloomStrength'),
            this.state.get('bloomRadius'),
            this.state.get('bloomThreshold')
        );
        
        this.postProcessingManager.setChromaticAberrationParameters(
            new THREE.Vector2(0.001, 0.001),
            this.state.get('chromaticIntensity')
        );
        
        this.postProcessingManager.setVignetteParameters(
            this.state.get('vignetteIntensity'),
            this.state.get('vignetteRadius'),
            this.state.get('vignetteSoftness')
        );
        
        this.postProcessingManager.setGrainParameters(
            this.state.get('grainIntensity')
        );
        
        this.postProcessingManager.setColorGradingParameters(
            this.state.get('colorHue'),
            this.state.get('colorSaturation'),
            this.state.get('colorBrightness'),
            this.state.get('colorContrast')
        );
    }

    updateLighting() {
        // Delegate to lighting manager
        this.lightingManager.updateLighting();
        
        // Update local reference for backward compatibility
        this.lights = this.lightingManager.getAllLights();
    }

    // Delegation method for backward compatibility
    blendColors(color1, color2, ratio) {
        return this.lightingManager.blendColors(color1, color2, ratio);
    }

    // Legacy method - kept for backward compatibility
    updateLightingLegacy() {
        try {
            if (!this.lights) {
                console.warn('Lights not initialized yet');
                return;
            }
            
            // Get light color from state or use default
            const lightColor = this.state.get('lightColour') || '#ffffff';
            const lightColorHex = parseInt(lightColor.replace('#', ''), 16);
            
            // Update all light intensities and colors
            if (this.lights.ambient) {
                this.lights.ambient.intensity = this.state.get('ambientLightIntensity');
                this.lights.ambient.color.setHex(lightColorHex);
            }
            if (this.lights.directional) {
                this.lights.directional.intensity = this.state.get('directionalLightIntensity');
                this.lights.directional.color.setHex(lightColorHex);
            }
            if (this.lights.point1) {
                this.lights.point1.intensity = this.state.get('pointLight1Intensity');
                this.lights.point1.color.setHex(lightColorHex);
            }
            if (this.lights.point2) {
                this.lights.point2.intensity = this.state.get('pointLight2Intensity');
                // Blend with blue tint
                const pointLight2Color = this.blendColors(lightColorHex, 0x87ceeb, 0.7);
                this.lights.point2.color.setHex(pointLight2Color);
            }
            if (this.lights.rim) {
                this.lights.rim.intensity = this.state.get('rimLightIntensity');
                this.lights.rim.color.setHex(lightColorHex);
            }
            if (this.lights.accent) {
                this.lights.accent.intensity = this.state.get('accentLightIntensity');
                // Blend with red tint
                const accentLightColor = this.blendColors(lightColorHex, 0xff6b6b, 0.6);
                this.lights.accent.color.setHex(accentLightColor);
            }
        } catch (error) {
            console.error('Error updating lighting:', error);
        }
    }

    blendColors(color1, color2, ratio) {
        // Convert hex colors to RGB
        const r1 = (color1 >> 16) & 255;
        const g1 = (color1 >> 8) & 255;
        const b1 = color1 & 255;
        
        const r2 = (color2 >> 16) & 255;
        const g2 = (color2 >> 8) & 255;
        const b2 = color2 & 255;
        
        // Blend colors
        const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
        
        return (r << 16) | (g << 8) | b;
    }

    onWindowResize() {
        this.camera.left = window.innerWidth / -200;
        this.camera.right = window.innerWidth / 200;
        this.camera.top = window.innerHeight / 200;
        this.camera.bottom = window.innerHeight / -200;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update post-processing on resize
        if (this.postProcessingManager) {
            this.postProcessingManager.onWindowResize();
        }
        
        // Removed this.createGrid() - grid should not be regenerated on window resize
    }

    updateFrustumCulling() {
        // Delegate to performance manager
        this.performanceManager.updateFrustumCulling();
        
        // Update local reference for backward compatibility
        this.visibleShapes = this.performanceManager.getVisibleShapes();
    }

    // Legacy method - kept for backward compatibility
    updateFrustumCullingLegacy() {
        // Implement proper frustum culling using camera viewport
        this.visibleShapes.clear();
        
        // Get camera viewport dimensions
        const camera = this.camera;
        const aspect = window.innerWidth / window.innerHeight;
        
        // Calculate viewport bounds (for orthographic camera)
        const viewportWidth = camera.right - camera.left;
        const viewportHeight = camera.top - camera.bottom;
        
        // Add some margin to account for shape size
        const margin = 2;
        const bounds = {
            left: camera.left - margin,
            right: camera.right + margin,
            top: camera.top + margin,
            bottom: camera.bottom - margin
        };
        
        for (const shape of this.shapes) {
            if (shape && shape.position) {
                const x = shape.position.x;
                const y = shape.position.y;
                
                // Check if shape is within viewport bounds
                const isVisible = x >= bounds.left && x <= bounds.right && 
                                y >= bounds.bottom && y <= bounds.top;
                
                if (isVisible) {
                    shape.visible = true;
                    this.visibleShapes.add(shape);
                } else {
                    shape.visible = false;
                }
            }
        }
        
        // Debug: Log performance metrics
        if (this.shapes.length > 0) {
            const visibleCount = this.visibleShapes.size;
            const totalCount = this.shapes.length;
            const cullingRatio = totalCount > 0 ? visibleCount / totalCount : 0;
        }
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            // Delegate performance optimization to performance manager
            this.performanceManager.optimizeRendering();
            
            // Update local reference for backward compatibility
            this.visibleShapes = this.performanceManager.getVisibleShapes();
            
            // Use post-processing if enabled
            if (this.postProcessingManager && this.state.get('postProcessingEnabled')) {
                this.postProcessingManager.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
            
            // Render additional layers on top if LayerManager has any
            if (this.app && this.app.layerManager && this.app.layerManager.layers.size > 0) {
                this.app.layerManager.render(this.renderer, this.camera);
            }
        } else {
            console.error('Cannot render: renderer, scene, or camera is null');
        }
    }

    getShapes() {
        return this.shapes;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    getComposition() {
        return this.composition;
    }

    getPerformanceMetrics() {
        // Delegate to performance manager
        return this.performanceManager.getPerformanceMetrics();
    }

    calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime = null, globalBPM = null) {
        if (!this.state.get('centerScalingEnabled')) {
            return 1.0; // No scaling if disabled
        }

        const intensity = this.state.get('centerScalingIntensity');
        const curve = this.state.get('centerScalingCurve');
        const radius = this.state.get('centerScalingRadius');
        const direction = this.state.get('centerScalingDirection');
        const centerScalingDivision = this.state.get('centerScalingDivision') || 'quarter';
        const animationType = this.state.get('centerScalingAnimationType');

        // Calculate distance from center (0,0)
        const centerX = (gridWidth - 1) / 2;
        const centerY = (gridHeight - 1) / 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow((x - centerX) * cellSize, 2) + 
            Math.pow((y - centerY) * cellSize, 2)
        );

        // Normalize distance to 0-1 range based on radius
        const maxDistance = Math.sqrt(
            Math.pow(centerX * cellSize, 2) + 
            Math.pow(centerY * cellSize, 2)
        ) * radius;
        
        // Prevent division by zero and ensure valid normalized distance
        const normalizedDistance = maxDistance > 0 ? Math.min(distanceFromCenter / maxDistance, 1.0) : 0;

        // Apply curve function
        let curveFactor;
        switch (Math.floor(curve)) {
            case 0: // Linear
                curveFactor = normalizedDistance;
                break;
            case 1: // Exponential
                curveFactor = Math.pow(normalizedDistance, 2);
                break;
            case 2: // Logarithmic
                curveFactor = normalizedDistance > 0 ? Math.log(normalizedDistance + 1) / Math.log(2) : 0;
                break;
            case 3: // Sine wave
                curveFactor = Math.sin(normalizedDistance * Math.PI);
                break;
            default:
                curveFactor = normalizedDistance;
        }

        // Always apply animation when center scaling is enabled
        let animationOffset = 0;
        let time;
        if (animationTime !== null && globalBPM !== null) {
            // Use musical timing
            const divisionBeats = this.getDivisionBeats(centerScalingDivision);
            time = animationTime / divisionBeats;
        } else {
            // Fallback to old timing system
            const animationSpeed = this.state.get('centerScalingAnimationSpeed');
            time = Date.now() * 0.001 * animationSpeed;
        }
        
        // Different animation types for more dramatic effects
        switch (Math.floor(animationType)) {
            case 0: // Complex Wave
                const wave1 = Math.sin(time + x * 0.3 + y * 0.2) * 0.4;
                const wave2 = Math.cos(time * 0.7 + x * 0.4 + y * 0.1) * 0.3;
                const pulse = Math.sin(time * 2 + (x + y) * 0.1) * 0.3;
                animationOffset = wave1 + wave2 + pulse;
                break;
                
            case 1: // Radial Pulse
                const radialDistance = Math.sqrt(x * x + y * y);
                const radialWave = Math.sin(time * 3 + radialDistance * 0.5) * 0.5;
                animationOffset = radialWave;
                break;
                
            case 2: // Spiral Effect
                const angle = Math.atan2(y - centerY, x - centerX);
                const spiralWave = Math.sin(time * 2 + angle * 3 + distanceFromCenter * 0.2) * 0.4;
                animationOffset = spiralWave;
                break;
                
            case 3: // Chaos Pattern
                const chaos1 = Math.sin(time * 1.5 + x * 0.8 + y * 0.6) * 0.3;
                const chaos2 = Math.cos(time * 0.8 + x * 0.4 + y * 0.9) * 0.3;
                const chaos3 = Math.sin(time * 2.2 + (x + y) * 0.7) * 0.2;
                animationOffset = chaos1 + chaos2 + chaos3;
                break;
                
            default:
                // Simple wave as fallback
                animationOffset = Math.sin(time + x * 0.5 + y * 0.3) * 0.3;
        }

        // Clamp animation offset to prevent extreme scaling
        const clampedAnimationOffset = Math.max(-0.5, Math.min(0.5, animationOffset));
        
        // Calculate scaling factor with more dramatic range
        let scalingFactor = 1.0 + (curveFactor * intensity + clampedAnimationOffset);
        
        // Apply direction (convex vs concave)
        if (direction === 1) { // Concave (center smaller)
            scalingFactor = 2.0 - scalingFactor; // Invert the scaling
        }
        
        return Math.max(0.1, scalingFactor); // Ensure minimum scale
    }

    // Animation helpers - delegated to ShapeAnimationManager
    animateShapes(animationTime, globalBPM) {
        // Delegate to the shape animation manager
        this.shapeAnimationManager.animateShapes(this.shapes, this.visibleShapes, animationTime, globalBPM);
        
        // Update our performance metrics from the animation manager
        this.lastPerformanceMetrics = this.shapeAnimationManager.getPerformanceMetrics();
    }

    // Delegation methods for backward compatibility
    cycleShapeInCell(mesh, x, y, availableShapes, animationTime, globalBPM) {
        return this.shapeAnimationManager.cycleShapeInCell(mesh, x, y, availableShapes, animationTime, globalBPM);
    }

    animateShapeTransformations(mesh, x, y, animationTime, globalBPM) {
        return this.shapeAnimationManager.animateShapeTransformations(mesh, x, y, animationTime, globalBPM);
    }

    calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime = null, globalBPM = null) {
        return this.shapeAnimationManager.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime, globalBPM);
    }

    /**
     * Set BPM timing manager reference
     */
    setBPMTimingManager(bpmTimingManager) {
        this.bpmTimingManager = bpmTimingManager;
        // Pass to shape animation manager as well
        this.shapeAnimationManager.setBPMTimingManager(bpmTimingManager);
    }

    getDivisionBeats(division) {
        if (this.bpmTimingManager) {
            return this.bpmTimingManager.getDivisionBeats(division);
        }
        // Fallback to shape animation manager if BPM timing manager not available
        return this.shapeAnimationManager.getDivisionBeats(division);
    }

    animateShapeWithGSAP(mesh, x, y, cellSize) {
        return this.shapeAnimationManager.animateShapeWithGSAP(mesh, x, y, cellSize);
    }

    // Legacy method - kept for backward compatibility
    animateShapesLegacy(animationTime, globalBPM) {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        // Get available shapes based on enabled categories
        const availableShapes = this.shapeGenerator.getAvailableShapes(this.state.get('enabledShapes'));
        if (availableShapes.length === 0) return;
        
        // Update material color for all shapes
        const material = this.materialManager.getBasicMaterial(this.state.get('shapeColor'));
        
        // Create refractive material for spheres with environment map
        const sphereMaterial = this.materialManager.getSphereMaterial(this.state);
        
        let shapeIndex = 0;
        let animatedCount = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[shapeIndex];
                if (mesh) {
                    // Only animate visible shapes for better performance
                    const isVisible = this.visibleShapes.has(mesh);
                    let isAnimated = false;
                    
                    // Update material based on shape type
                    if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                        mesh.material = sphereMaterial;
                    } else {
                        mesh.material = material;
                    }
                    
                    // Shape cycling (independent of size/movement animations)
                    if (this.state.get('enableShapeCycling')) {
                        this.cycleShapeInCell(mesh, x, y, availableShapes, animationTime, globalBPM);
                        isAnimated = true;
                    }
                    
                    // Size/movement animations (using manual calculations for now)
                    if (this.state.get('enableMovementAnimation') || this.state.get('enableRotationAnimation') || this.state.get('enableScaleAnimation')) {
                        this.animateShapeTransformations(mesh, x, y, animationTime, globalBPM);
                        isAnimated = true;
                    } else {
                        // Reset to original positions when no animations are enabled
                        const halfGridW = gridWidth / 2;
                        const halfGridH = gridHeight / 2;
                        mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                        mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                        mesh.rotation.z = 0;
                    }
                    
                    // Always apply center scaling animation when enabled (independent of other animations)
                    if (this.state.get('centerScalingEnabled')) {
                        const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime, globalBPM);
                        
                        if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                            const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                            mesh.scale.set(sphereScale, sphereScale, sphereScale);
                        } else {
                            const baseScale = cellSize * centerScalingFactor;
                            mesh.scale.set(baseScale, baseScale, 1);
                        }
                        isAnimated = true;
                    }
                    
                    // Count animated shapes (both shape cycling and size/movement)
                    if (isAnimated && isVisible) {
                        animatedCount++;
                    }
                }
                shapeIndex++;
            }
        }
        
        // Store performance metrics
        this.lastPerformanceMetrics = {
            totalShapes: this.shapes.length,
            visibleShapes: this.visibleShapes.size,
            animatedShapes: animatedCount,
            cullingRatio: this.shapes.length > 0 ? this.visibleShapes.size / this.shapes.length : 0
        };
    }

    cycleShapeInCell(mesh, x, y, availableShapes, animationTime, globalBPM) {
        if (availableShapes.length === 0) return;
        
        const shapeCyclingDivision = this.state.get('shapeCyclingDivision') || 'quarter';
        const shapeCyclingPattern = this.state.get('shapeCyclingPattern');
        const shapeCyclingDirection = this.state.get('shapeCyclingDirection');
        const shapeCyclingSync = this.state.get('shapeCyclingSync');
        const shapeCyclingIntensity = this.state.get('shapeCyclingIntensity');
        const shapeCyclingTrigger = this.state.get('shapeCyclingTrigger');
        
        // Check if shape cycling should be triggered
        let shouldCycle = true;
        if (shapeCyclingTrigger === 1) { // Movement-triggered
            const movementAmp = this.state.get('movementAmplitude');
            shouldCycle = movementAmp > 0.1;
        } else if (shapeCyclingTrigger === 2) { // Rotation-triggered
            const rotationAmp = this.state.get('rotationAmplitude');
            shouldCycle = rotationAmp > 0.1;
        } else if (shapeCyclingTrigger === 3) { // Manual
            shouldCycle = false; // Manual triggers would be handled elsewhere
        }
        
        if (!shouldCycle) return;
        
        // Calculate effective animation time using musical divisions
        const secondsPerBeat = 60 / globalBPM;
        const divisionBeats = this.getDivisionBeats(shapeCyclingDivision);
        // Invert the timing: smaller divisions = faster cycling
        const timeOffset = animationTime / divisionBeats;
        
        // Calculate shape index based on pattern and sync
        let shapeIndex = 0;
        const cellSeed = x * 1000 + y * 100;
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        
        // Apply synchronization
        let syncOffset = 0;
        if (shapeCyclingSync === 1) { // Synchronized
            syncOffset = 0;
        } else if (shapeCyclingSync === 2) { // Wave
            const waveSpeed = 2.0;
            syncOffset = Math.sin(timeOffset * waveSpeed + (x + y) * 0.5) * 1000;
        } else if (shapeCyclingSync === 3) { // Cluster
            const clusterSize = 3;
            const clusterX = Math.floor(x / clusterSize);
            const clusterY = Math.floor(y / clusterSize);
            syncOffset = (clusterX + clusterY) * 500;
        } else { // Independent (default)
            syncOffset = cellSeed * 0.1;
        }
        
        // Calculate base time with sync
        const baseTime = timeOffset + syncOffset;
        
        // Apply direction
        let directionMultiplier = 1;
        if (shapeCyclingDirection === 1) { // Reverse
            directionMultiplier = -1;
        } else if (shapeCyclingDirection === 2) { // Ping-Pong
            directionMultiplier = Math.sin(baseTime * 0.5) > 0 ? 1 : -1;
        } else if (shapeCyclingDirection === 3) { // Random
            directionMultiplier = Math.sin(baseTime * 0.3) > 0 ? 1 : -1;
        }
        
        // Calculate shape index based on pattern
        switch (shapeCyclingPattern) {
            case 0: // Sequential
                shapeIndex = Math.floor(Math.abs(Math.sin(baseTime * directionMultiplier)) * availableShapes.length) % availableShapes.length;
                break;
            case 1: // Random
                const randomSeed = Math.sin(baseTime * 0.5 + cellSeed * 0.01);
                shapeIndex = Math.floor(Math.abs(randomSeed) * availableShapes.length) % availableShapes.length;
                break;
            case 2: // Wave
                const waveX = Math.sin(baseTime + x * 0.5) * 0.5 + 0.5;
                const waveY = Math.cos(baseTime + y * 0.5) * 0.5 + 0.5;
                const waveValue = (waveX + waveY) / 2;
                shapeIndex = Math.floor(waveValue * availableShapes.length) % availableShapes.length;
                break;
            case 3: // Pulse
                const pulseValue = Math.sin(baseTime * 2) * 0.5 + 0.5;
                shapeIndex = Math.floor(pulseValue * availableShapes.length) % availableShapes.length;
                break;
            case 4: // Staggered
                const staggerOffset = (x + y) * 0.3;
                const staggerValue = Math.sin(baseTime + staggerOffset) * 0.5 + 0.5;
                shapeIndex = Math.floor(staggerValue * availableShapes.length) % availableShapes.length;
                break;
        }
        
        // Apply intensity (limit the number of shapes to cycle through)
        const maxShapes = Math.max(1, Math.floor(availableShapes.length * shapeCyclingIntensity));
        shapeIndex = shapeIndex % maxShapes;
        
        const newShapeName = availableShapes[shapeIndex];
        
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
            material = this.materialManager.getSphereMaterial(this.state);
        } else {
            material = this.materialManager.getBasicMaterial(this.state.get('shapeColor'));
        }
        
        // Return old geometry to pool
        if (mesh.geometry && mesh.userData && mesh.userData.shapeName) {
            this.objectPool.returnGeometry(mesh.userData.shapeName, mesh.geometry);
        }
        
        // Get new geometry from pool or create new one
        const newGeometry = this.objectPool.getGeometry(shapeName, this.shapeGenerator);
        
        if (newGeometry) {
            mesh.geometry = newGeometry;
            mesh.material = material;
            mesh.userData.shapeName = shapeName;
            
            // Reset scale for all shapes to prevent scaling issues during cycling
            const cellSize = this.state.get('cellSize');
            
            if (shapeName.startsWith('sphere_')) {
                // Enable shadows for spheres
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                // Apply sphere scale
                const sphereScale = cellSize * this.state.get('sphereScale');
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            } else {
                // Reset to base scale for non-sphere shapes
                mesh.scale.set(cellSize, cellSize, 1);
            }
        } else {
            // Fallback to plane geometry if shape generation fails
            mesh.geometry = new THREE.PlaneGeometry(1, 1);
            mesh.material = material;
            mesh.userData.shapeName = 'Rect'; // Default shape name
            // Reset to base scale for fallback shapes
            const cellSize = this.state.get('cellSize');
            mesh.scale.set(cellSize, cellSize, 1);
        }
    }

    animateShapeTransformations(mesh, x, y, animationTime, globalBPM) {
        const cellSize = this.state.get('cellSize');
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        // Calculate center scaling factor
        const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime, globalBPM);
        
        // Get musical divisions for animations
        const movementDivision = this.state.get('movementDivision') || '8th';
        const rotationDivision = this.state.get('rotationDivision') || '16th';
        const scaleDivision = this.state.get('scaleDivision') || 'half';
        
        // Check individual animation toggles
        const enableMovement = this.state.get('enableMovementAnimation');
        const enableRotation = this.state.get('enableRotationAnimation');
        const enableScale = this.state.get('enableScaleAnimation');
        
        // Apply movement animation if enabled
        if (enableMovement) {
            const movementBeats = this.getDivisionBeats(movementDivision);
            const movementTime = animationTime / movementBeats;
            const xOffset = Math.sin(movementTime + x * 0.5) * this.state.get('movementAmplitude') * cellSize;
            const yOffset = Math.cos(movementTime + y * 0.5) * this.state.get('movementAmplitude') * cellSize;
            mesh.position.x = (x - halfGridW + 0.5) * cellSize + xOffset;
            mesh.position.y = (y - halfGridH + 0.5) * cellSize + yOffset;
        } else {
            // Reset to original position if movement is disabled
            mesh.position.x = (x - halfGridW + 0.5) * cellSize;
            mesh.position.y = (y - halfGridH + 0.5) * cellSize;
        }
        
        // Apply rotation animation if enabled
        if (enableRotation) {
            const rotationBeats = this.getDivisionBeats(rotationDivision);
            const rotationTime = animationTime / rotationBeats;
            mesh.rotation.z = Math.sin(rotationTime + x * 0.3 + y * 0.3) * this.state.get('rotationAmplitude');
        } else {
            // Reset rotation if disabled
            mesh.rotation.z = 0;
        }
        
        // Apply scale animation if enabled
        if (enableScale) {
            const scaleBeats = this.getDivisionBeats(scaleDivision);
            const scaleTime = animationTime / scaleBeats;
            const scale = 1 + Math.sin(scaleTime + x * 0.5 + y * 0.5) * this.state.get('scaleAmplitude');
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                const sphereScale = cellSize * this.state.get('sphereScale') * scale * centerScalingFactor;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            } else {
                const baseScale = cellSize * scale * centerScalingFactor;
                mesh.scale.set(baseScale, baseScale, 1);
            }
        } else {
            // Reset scale if disabled
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            } else {
                const baseScale = cellSize * centerScalingFactor;
                mesh.scale.set(baseScale, baseScale, 1);
            }
        }
        
        // Apply center scaling if enabled (independent of other animations)
        if (this.state.get('centerScalingEnabled')) {
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            } else {
                const baseScale = cellSize * centerScalingFactor;
                mesh.scale.set(baseScale, baseScale, 1);
            }
        }
    }



    animateShapeWithGSAP(mesh, x, y, cellSize) {
        const animationType = this.state.get('animationType');
        const isSphere = mesh.geometry && mesh.geometry.type === 'SphereGeometry';
        const sphereScale = this.state.get('sphereScale');
        
        // Get animation parameters
        const movementAmp = this.state.get('movementAmplitude');
        const rotationAmp = this.state.get('rotationAmplitude');
        const scaleAmp = this.state.get('scaleAmplitude');
        const frequency = this.state.get('animationSpeed');
        
        // Apply different animation types using GSAP
        switch (animationType) {
            case 0: // Movement
                this.animationSystem.animateMovement(mesh, x, y, cellSize, movementAmp, frequency);
                break;
            case 1: // Rotation
                this.animationSystem.animateRotation(mesh, x, y, rotationAmp, frequency);
                break;
            case 2: // Scale
                this.animationSystem.animateScale(mesh, x, y, cellSize, scaleAmp, frequency, isSphere, sphereScale);
                break;
            case 3: // Combined effects
                this.animationSystem.animateCombined(mesh, x, y, cellSize, movementAmp, rotationAmp, scaleAmp, frequency);
                break;
        }
    }
} 