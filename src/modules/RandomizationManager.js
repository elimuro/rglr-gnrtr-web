/**
 * RandomizationManager.js - Visual Parameter Randomization
 * This module handles all randomization functionality including focused randomization
 * of colors, shapes, animations, shaders, post-processing, and materials.
 * Extracted from SceneManager.js to improve modularity and separation of concerns.
 */

import { ParameterMapper } from './ParameterMapper.js';

export class RandomizationManager {
    constructor(app) {
        this.app = app;
        this.domCache = app.domCache;
        this.state = app.state;
    }

    /**
     * Set up event listeners for randomization controls
     */
    setupRandomizationListeners() {
        // Randomize buttons
        const randomizeAllButton = this.domCache.getElement('randomize-all-button');
        if (randomizeAllButton) {
            randomizeAllButton.addEventListener('click', () => {
                this.randomizeVisualParameters();
            });
        }

        const randomizeColorsButton = this.domCache.getElement('randomize-colors-button');
        if (randomizeColorsButton) {
            randomizeColorsButton.addEventListener('click', () => {
                this.randomizeColors();
            });
        }

        const randomizeShapesButton = this.domCache.getElement('randomize-shapes-button');
        if (randomizeShapesButton) {
            randomizeShapesButton.addEventListener('click', () => {
                this.randomizeShapes();
            });
        }

        const randomizeAnimationsButton = this.domCache.getElement('randomize-animations-button');
        if (randomizeAnimationsButton) {
            randomizeAnimationsButton.addEventListener('click', () => {
                this.randomizeAnimations();
            });
        }

        const randomizeShadersButton = this.domCache.getElement('randomize-shaders-button');
        if (randomizeShadersButton) {
            randomizeShadersButton.addEventListener('click', () => {
                this.randomizeShaders();
            });
        }

        const randomizePostProcessingButton = this.domCache.getElement('randomize-postprocessing-button');
        if (randomizePostProcessingButton) {
            randomizePostProcessingButton.addEventListener('click', () => {
                this.randomizePostProcessing();
            });
        }

        const randomizeMaterialsButton = this.domCache.getElement('randomize-materials-button');
        if (randomizeMaterialsButton) {
            randomizeMaterialsButton.addEventListener('click', () => {
                this.randomizeMaterials();
            });
        }
    }

    /**
     * Randomize all visual parameters
     */
    randomizeVisualParameters() {
        try {
            const availableParameters = ParameterMapper.getAvailableParameters();
            const excludedParameters = [
                'enabledShapes', // This is an object, not a simple parameter
                'randomness' // Shape selection randomness - keep consistent for better shape distribution
            ];
            const parametersToRandomize = availableParameters.filter(param =>
                !excludedParameters.includes(param)
            );

            console.log('🎲 Randomizing visual parameters:', parametersToRandomize.length, 'parameters');

            // Randomize each parameter
            parametersToRandomize.forEach(paramName => {
                this.randomizeParameter(paramName);
            });

            // Randomize shape selection toggles
            this.randomizeShapeSelection();

            // Randomize layer parameters (blend modes, shader presets, etc.)
            this.randomizeLayerParameters();

            this.showRandomizationFeedback();
        } catch (error) {
            console.error('Error randomizing visual parameters:', error);
        }
    }

    /**
     * Randomize a specific parameter based on its type
     * @param {string} paramName - Parameter name to randomize
     */
    randomizeParameter(paramName) {
        const config = ParameterMapper.getParameterConfig(paramName);
        if (!config) return;

        if (paramName === 'morphingEasing') {
            // Randomize easing function
            const easingOptions = [
                'power2.inOut',
                'power1.inOut',
                'power3.inOut',
                'power4.inOut',
                'sine.inOut',
                'back.inOut',
                'elastic.inOut',
                'bounce.inOut',
                'circ.inOut',
                'expo.inOut',
                'none'
            ];
            const randomEasing = easingOptions[Math.floor(Math.random() * easingOptions.length)];
            this.state.set(paramName, randomEasing);
        } else {
            const randomValue = Math.random();
            ParameterMapper.handleParameterUpdate(
                paramName,
                randomValue,
                this.state,
                this.app.scene,
                'randomize'
            );
        }
    }

    /**
     * Randomize only color-related parameters
     */
    randomizeColors() {
        try {
            console.log('🎨 Randomizing colors...');
            
            // Color-related parameters
            const colorParameters = [
                'shapeColor',
                'backgroundColor', 
                'gridColor',
                'lightColour',
                'colorHue',
                'colorSaturation',
                'colorBrightness',
                'colorContrast'
            ];
            
            // Randomize each color parameter
            colorParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('🎨 Colors randomized!');
            
        } catch (error) {
            console.error('Error randomizing colors:', error);
        }
    }

    /**
     * Randomize only shape-related parameters
     */
    randomizeShapes() {
        try {
            console.log('🔷 Randomizing shapes...');
            
            // Shape-related parameters
            const shapeParameters = [
                'gridWidth',
                'gridHeight',
                'cellSize',
                'compositionWidth',
                'compositionHeight'
            ];
            
            // Randomize each shape parameter
            shapeParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize shape selection
            this.randomizeShapeSelection();
            
            this.showRandomizationFeedback('🔷 Shapes randomized!');
            
        } catch (error) {
            console.error('Error randomizing shapes:', error);
        }
    }

    /**
     * Randomize only animation-related parameters
     */
    randomizeAnimations() {
        try {
            console.log('⚡ Randomizing animations...');
            
            // Animation-related parameters
            const animationParameters = [
                'globalBPM',
                'animationSpeed',
                'movementAmplitude',
                'movementFrequency',
                'rotationAmplitude',
                'rotationFrequency',
                'scaleAmplitude',
                'scaleFrequency',
                'shapeCyclingSpeed',
                'shapeCyclingIntensity',
                'centerScalingIntensity',
                'centerScalingRadius',
                'centerScalingAnimationSpeed',
                'morphingIntensity',
                'morphingSpeed',
                'morphingEasing'
            ];
            
            // Animation boolean toggles
            const animationBooleans = [
                'enableShapeCycling',
                'enableSizeAnimation',
                'enableMovementAnimation',
                'enableRotationAnimation',
                'enableScaleAnimation',
                'centerScalingAnimation'
            ];
            
            // Randomize each animation parameter
            animationParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize animation booleans
            animationBooleans.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('⚡ Animations randomized!');
            
        } catch (error) {
            console.error('Error randomizing animations:', error);
        }
    }

    /**
     * Randomize only shader-related parameters
     */
    randomizeShaders() {
        try {
            console.log('🌊 Randomizing shaders...');
            
            // Randomize layer parameters (which includes shader presets)
            this.randomizeLayerParameters();
            
            this.showRandomizationFeedback('🌊 Shaders randomized!');
            
        } catch (error) {
            console.error('Error randomizing shaders:', error);
        }
    }

    /**
     * Randomize only post-processing parameters
     */
    randomizePostProcessing() {
        try {
            console.log('✨ Randomizing post-processing...');
            
            // Post-processing parameters
            const postProcessingParameters = [
                'bloomStrength',
                'bloomThreshold',
                'bloomRadius',
                'vignetteIntensity',
                'vignetteRadius',
                'vignetteSoftness',
                'chromaticIntensity',
                'grainIntensity'
            ];
            
            // Post-processing boolean toggles
            const postProcessingBooleans = [
                'postProcessingEnabled',
                'bloomEnabled',
                'vignetteEnabled',
                'chromaticAberrationEnabled',
                'grainEnabled'
            ];
            
            // Randomize each post-processing parameter
            postProcessingParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize post-processing booleans
            postProcessingBooleans.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('✨ Post-processing randomized!');
            
        } catch (error) {
            console.error('Error randomizing post-processing:', error);
        }
    }

    /**
     * Randomize only material-related parameters
     */
    randomizeMaterials() {
        try {
            console.log('💎 Randomizing materials...');
            
            // Material parameters
            const materialParameters = [
                'sphereRefraction',
                'sphereTransparency',
                'sphereTransmission',
                'sphereRoughness',
                'sphereMetalness',
                'sphereScale',
                'sphereClearcoat',
                'sphereClearcoatRoughness',
                'sphereEnvMapIntensity',
                'sphereDistortionStrength',
                'sphereHighPerformanceMode'
            ];
            
            // Material boolean toggles
            const materialBooleans = [
                'sphereWaterDistortion',
                'sphereHighPerformanceMode'
            ];
            
            // Randomize each material parameter
            materialParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize material booleans
            materialBooleans.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('💎 Materials randomized!');
            
        } catch (error) {
            console.error('Error randomizing materials:', error);
        }
    }

    /**
     * Randomize shape selection toggles
     */
    randomizeShapeSelection() {
        try {
            const currentEnabledShapes = this.state.get('enabledShapes') || {};
            const shapeTypes = ['Basic Shapes', 'Triangles', 'Rectangles', 'Ellipses', 'Refractive Spheres'];
            
            const newEnabledShapes = {};
            let hasEnabledShape = false;
            
            // Randomize each shape type (70% chance to be enabled)
            shapeTypes.forEach(shapeType => {
                const shouldEnable = Math.random() > 0.3; // 70% chance
                newEnabledShapes[shapeType] = shouldEnable;
                if (shouldEnable) hasEnabledShape = true;
            });
            
            // Ensure at least one shape is enabled
            if (!hasEnabledShape) {
                const randomShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
                newEnabledShapes[randomShape] = true;
            }
            
            this.state.set('enabledShapes', newEnabledShapes);
            
            // Update the scene grid to reflect new shape selection
            if (this.app.scene && this.app.scene.createGrid) {
                this.app.scene.createGrid();
            }
            
            console.log('🎲 Shape selection randomized:', newEnabledShapes);
        } catch (error) {
            console.error('Error randomizing shape selection:', error);
        }
    }

    /**
     * Randomize layer parameters (blend modes, shader presets, etc.)
     */
    randomizeLayerParameters() {
        try {
            const layers = this.app.layerManager.layers;
            if (!layers || layers.size === 0) {
                console.log('🌊 No layers to randomize');
                return;
            }

            // Available blend modes and shader presets
            const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
            const shaderPresets = ['default', 'noise', 'plasma', 'kaleidoscope', 'mandala', 'flocking', 'physarum', 'voronoi', 'reaction-diffusion', 'test-boolean', 'blend-test'];

            console.log(`🌊 Randomizing ${layers.size} layers...`);

            layers.forEach((layer, layerId) => {
                try {
                    console.log(`🎨 Randomizing layer ${layerId} (${layer.constructor.name})...`);

                    // Randomize blend mode
                    const randomBlendMode = blendModes[Math.floor(Math.random() * blendModes.length)];
                    this.app.layerManager.setLayerParameter(layerId, 'blendMode', randomBlendMode);

                    // Randomize visibility (80% chance to be visible)
                    const randomVisible = Math.random() > 0.2;
                    this.app.layerManager.setLayerParameter(layerId, 'visible', randomVisible);

                    // Randomize Z offset for depth variation
                    const randomZOffset = (Math.random() - 0.5) * 20; // -10 to 10
                    this.app.layerManager.setLayerParameter(layerId, 'zOffset', randomZOffset);

                    // For shader layers, randomize shader preset
                    if (layer.constructor.name === 'ShaderLayer' || layer.compileShader) {
                        console.log(`🎨 Found ShaderLayer ${layerId}, randomizing shader preset...`);
                        this.randomizeShaderLayerPreset(layerId, shaderPresets);
                    }

                    // For P5 layers, randomize some parameters
                    if (layer.constructor.name === 'P5TextureLayer' || layer.parameters) {
                        console.log(`🎨 Found P5TextureLayer ${layerId}, randomizing P5 parameters...`);
                        this.randomizeP5LayerParameters(layerId);
                    }

                } catch (error) {
                    console.warn(`Error randomizing layer ${layerId}:`, error);
                }
            });
        } catch (error) {
            console.error('Error randomizing layer parameters:', error);
        }
    }

    /**
     * Randomize shader layer preset
     * @param {string} layerId - Layer ID
     * @param {string[]} availablePresets - Available preset keys
     */
    async randomizeShaderLayerPreset(layerId, availablePresets) {
        try {
            const randomPresetKey = availablePresets[Math.floor(Math.random() * availablePresets.length)];
            
            // Load the shader preset
            const response = await fetch(`/shaders/${randomPresetKey}.frag`);
            if (response.ok) {
                const shaderCode = await response.text();
                
                // Compile the shader code on the layer
                const layer = this.app.layerManager.layers.get(layerId);
                if (layer && layer.compileShader) {
                    await layer.compileShader(shaderCode);
                    console.log(`🎨 Set shader preset "${randomPresetKey}" for layer ${layerId}`);
                } else {
                    console.warn(`Layer ${layerId} does not have compileShader method`);
                }
            } else {
                console.warn(`Failed to load shader preset ${randomPresetKey}: ${response.status}`);
            }
        } catch (error) {
            console.warn(`Error setting shader preset for layer ${layerId}:`, error);
        }
    }

    /**
     * Randomize P5 layer parameters
     * @param {string} layerId - Layer ID
     */
    randomizeP5LayerParameters(layerId) {
        try {
            const layer = this.app.layerManager.layers.get(layerId);
            if (!layer || !layer.parameters) return;

            // Randomize some common P5 parameters
            const p5Parameters = ['speed', 'intensity', 'radius', 'colorHue', 'colorSat', 'colorBright'];
            
            p5Parameters.forEach(paramName => {
                if (layer.parameters.has(paramName)) {
                    const randomValue = Math.random();
                    this.app.layerManager.setLayerParameter(layerId, paramName, randomValue);
                }
            });
        } catch (error) {
            console.warn(`Error randomizing P5 parameters for layer ${layerId}:`, error);
        }
    }

    /**
     * Show feedback notification for randomization
     * @param {string} message - Custom message to display
     */
    showRandomizationFeedback(message = '🎲 Visual parameters, shapes & layers randomized!') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-purple-500 text-white px-4 py-2 rounded shadow-lg z-50 transform transition-all duration-300';
        notification.textContent = message;
        
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

    /**
     * Clean up randomization manager resources
     */
    destroy() {
        // Clean up any ongoing operations
        // No specific cleanup needed for RandomizationManager currently
    }
}
