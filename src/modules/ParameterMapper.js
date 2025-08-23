/**
 * ParameterMapper - Unified parameter mapping system
 * 
 * This module centralizes all parameter mapping logic to eliminate code duplication
 * between MIDI controls, audio mapping, and other parameter sources. It provides
 * a single source of truth for parameter configurations and handling logic.
 */

import { GUI_CONTROL_CONFIGS } from '../config/index.js';

export class ParameterMapper {
    // Static parameter configurations - single source of truth
    static PARAMETER_CONFIGS = new Map([
        // Shape Controls
        ['gridWidth', { 
            min: 1, max: 30, step: 1,
            setter: (state, value, scene) => {
                const newWidth = Math.floor(value);
                if (state.get('gridWidth') !== newWidth) {
                    state.set('gridWidth', newWidth);
                    scene?.createGrid();
                }
            },
            requiresScene: true
        }],
        ['gridHeight', { 
            min: 1, max: 30, step: 1,
            setter: (state, value, scene) => {
                const newHeight = Math.floor(value);
                if (state.get('gridHeight') !== newHeight) {
                    state.set('gridHeight', newHeight);
                    scene?.createGrid();
                }
            },
            requiresScene: true
        }],
        ['cellSize', { 
            min: 0.5, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('cellSize', value);
                scene?.updateCellSize();
            },
            requiresScene: true
        }],
        ['randomness', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value) => state.set('randomness', value),
            requiresScene: false
        }],
        
        // Composition Controls
        ['compositionWidth', { 
            min: 1, max: 30, step: 1,
            setter: (state, value, scene) => {
                const newCompWidth = Math.floor(value);
                if (state.get('compositionWidth') !== newCompWidth) {
                    state.set('compositionWidth', newCompWidth);
                    scene?.createGrid();
                }
            },
            requiresScene: true
        }],
        ['compositionHeight', { 
            min: 1, max: 30, step: 1,
            setter: (state, value, scene) => {
                const newCompHeight = Math.floor(value);
                if (state.get('compositionHeight') !== newCompHeight) {
                    state.set('compositionHeight', newCompHeight);
                    scene?.createGrid();
                }
            },
            requiresScene: true
        }],
        
        // Color Controls (handled as colors, not numeric)
        ['shapeColor', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value) => {
                const hue = Math.floor(value * 360);
                const color = ParameterMapper.hsvToHex(hue, 100, 100);
                state.set('shapeColor', color);
            },
            requiresScene: false
        }],
        ['backgroundColor', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value) => {
                const hue = Math.floor(value * 360);
                const color = ParameterMapper.hsvToHex(hue, 100, 100);
                state.set('backgroundColor', color);
            },
            requiresScene: false
        }],
        ['gridColor', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value) => {
                const hue = Math.floor(value * 360);
                const color = ParameterMapper.hsvToHex(hue, 100, 100);
                state.set('gridColor', color);
            },
            requiresScene: false
        }],
        
        // Sphere Controls - Material Properties
        ['sphereRefraction', { 
            min: 0, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereRefraction', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereTransparency', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereTransparency', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereTransmission', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereTransmission', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereRoughness', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereRoughness', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereMetalness', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereMetalness', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereScale', { 
            min: 0.5, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereScale', value);
                scene?.updateSphereScales();
            },
            requiresScene: true
        }],
        
        // Sphere Controls - Clearcoat Properties
        ['sphereClearcoat', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereClearcoat', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereClearcoatRoughness', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereClearcoatRoughness', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        
        // Sphere Controls - Environment & Effects
        ['sphereEnvMapIntensity', { 
            min: 0, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereEnvMapIntensity', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereDistortionStrength', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('sphereDistortionStrength', value);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereHighPerformanceMode', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                state.set('sphereHighPerformanceMode', value > 0.5);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        
        // Animation Controls - Global
        ['globalBPM', { 
            min: 60, max: 300, step: 1,
            setter: (state, value) => state.set('globalBPM', value),
            requiresScene: false
        }],
        ['animationType', { 
            min: 0, max: 127, step: 1,
            setter: (state, value) => state.set('animationType', Math.floor(value)),
            requiresScene: false
        }],
        
        // Animation Controls - Movement
        ['movementAmplitude', { 
            min: 0.01, max: 0.5, step: 0.01,
            setter: (state, value) => state.set('movementAmplitude', value),
            requiresScene: false
        }],
        ['movementFrequency', { 
            min: 0.01, max: 2, step: 0.01,
            setter: (state, value) => state.set('movementFrequency', value),
            requiresScene: false
        }],
        ['movementDivision', { 
            min: 0, max: 127, step: 1,
            setter: (state, value) => state.set('movementDivision', Math.floor(value)),
            requiresScene: false
        }],
        
        // Animation Controls - Rotation
        ['rotationAmplitude', { 
            min: 0.01, max: 2, step: 0.01,
            setter: (state, value) => state.set('rotationAmplitude', value),
            requiresScene: false
        }],
        ['rotationFrequency', { 
            min: 0.01, max: 2, step: 0.01,
            setter: (state, value) => state.set('rotationFrequency', value),
            requiresScene: false
        }],
        ['rotationDivision', { 
            min: 0, max: 127, step: 1,
            setter: (state, value) => state.set('rotationDivision', Math.floor(value)),
            requiresScene: false
        }],
        
        // Animation Controls - Scale
        ['scaleAmplitude', { 
            min: 0.01, max: 1, step: 0.01,
            setter: (state, value) => state.set('scaleAmplitude', value),
            requiresScene: false
        }],
        ['scaleFrequency', { 
            min: 0.01, max: 2, step: 0.01,
            setter: (state, value) => state.set('scaleFrequency', value),
            requiresScene: false
        }],
        ['scaleDivision', { 
            min: 0, max: 127, step: 1,
            setter: (state, value) => state.set('scaleDivision', Math.floor(value)),
            requiresScene: false
        }],
        
        // Animation Controls - Shape Cycling
        ['shapeCyclingSpeed', { 
            min: 0.01, max: 2, step: 0.01,
            setter: (state, value) => state.set('shapeCyclingSpeed', value),
            requiresScene: false
        }],
        ['shapeCyclingPattern', { 
            min: 0, max: 4, step: 1,
            setter: (state, value) => state.set('shapeCyclingPattern', Math.floor(value)),
            requiresScene: false
        }],
        ['shapeCyclingDirection', { 
            min: 0, max: 3, step: 1,
            setter: (state, value) => state.set('shapeCyclingDirection', Math.floor(value)),
            requiresScene: false
        }],
        ['shapeCyclingSync', { 
            min: 0, max: 3, step: 1,
            setter: (state, value) => state.set('shapeCyclingSync', Math.floor(value)),
            requiresScene: false
        }],
        ['shapeCyclingIntensity', { 
            min: 0.1, max: 1, step: 0.01,
            setter: (state, value) => state.set('shapeCyclingIntensity', value),
            requiresScene: false
        }],
        ['shapeCyclingTrigger', { 
            min: 0, max: 3, step: 1,
            setter: (state, value) => state.set('shapeCyclingTrigger', Math.floor(value)),
            requiresScene: false
        }],
        ['shapeCyclingDivision', { 
            min: 0, max: 127, step: 1,
            setter: (state, value) => state.set('shapeCyclingDivision', Math.floor(value)),
            requiresScene: false
        }],
        
        // Animation Controls - Center Scaling
        ['centerScalingIntensity', { 
            min: 0, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('centerScalingIntensity', value);
                scene?.updateCenterScaling();
            },
            requiresScene: true
        }],
        ['centerScalingCurve', { 
            min: 0, max: 3, step: 1,
            setter: (state, value, scene) => {
                state.set('centerScalingCurve', Math.floor(value));
                scene?.updateCenterScaling();
            },
            requiresScene: true
        }],
        ['centerScalingRadius', { 
            min: 0.1, max: 5, step: 0.1,
            setter: (state, value, scene) => {
                state.set('centerScalingRadius', value);
                scene?.updateCenterScaling();
            },
            requiresScene: true
        }],
        ['centerScalingDirection', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                state.set('centerScalingDirection', Math.floor(value));
                scene?.updateCenterScaling();
            },
            requiresScene: true
        }],
        ['centerScalingAnimationSpeed', { 
            min: 0.1, max: 3, step: 0.1,
            setter: (state, value) => state.set('centerScalingAnimationSpeed', value),
            requiresScene: false
        }],
        ['centerScalingAnimationType', { 
            min: 0, max: 3, step: 1,
            setter: (state, value) => state.set('centerScalingAnimationType', Math.floor(value)),
            requiresScene: false
        }],
        ['centerScalingDivision', { 
            min: 0, max: 127, step: 1,
            setter: (state, value) => state.set('centerScalingDivision', Math.floor(value)),
            requiresScene: false
        }],
        
        // Morphing Controls
        ['morphingDivision', { 
            min: 0, max: 127, step: 1,
            setter: (state, value) => state.set('morphingDivision', Math.floor(value)),
            requiresScene: false
        }],
        ['morphingEasing', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value) => state.set('morphingEasing', value),
            requiresScene: false
        }],
        
        // Post Processing Controls - Bloom
        ['bloomStrength', { 
            min: 0, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('bloomStrength', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['bloomRadius', { 
            min: 0, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('bloomRadius', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['bloomThreshold', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('bloomThreshold', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        
        // Post Processing Controls - Chromatic Aberration
        ['chromaticIntensity', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('chromaticIntensity', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        
        // Post Processing Controls - Vignette
        ['vignetteIntensity', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('vignetteIntensity', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['vignetteRadius', { 
            min: 0.1, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('vignetteRadius', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['vignetteSoftness', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('vignetteSoftness', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        
        // Post Processing Controls - Film Grain
        ['grainIntensity', { 
            min: 0, max: 0.5, step: 0.01,
            setter: (state, value, scene) => {
                state.set('grainIntensity', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        
        // Post Processing Controls - Color Grading
        ['colorHue', { 
            min: -0.5, max: 0.5, step: 0.01,
            setter: (state, value, scene) => {
                state.set('colorHue', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['colorSaturation', { 
            min: 0, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('colorSaturation', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['colorBrightness', { 
            min: 0, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('colorBrightness', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['colorContrast', { 
            min: 0, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('colorContrast', value);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        
        // Lighting Controls
        ['lightColour', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                const hue = Math.floor(value * 360);
                const color = ParameterMapper.hsvToHex(hue, 100, 100);
                state.set('lightColour', color);
                scene?.updateLighting();
            },
            requiresScene: true
        }],
        
        // Boolean Parameters
        ['showGrid', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('showGrid', boolValue);
                scene?.updateGridLines();
            },
            requiresScene: true
        }],
        ['postProcessingEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value) => {
                const boolValue = value > 0.5;
                state.set('postProcessingEnabled', boolValue);
            },
            requiresScene: false
        }],
        ['bloomEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('bloomEnabled', boolValue);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['chromaticAberrationEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('chromaticAberrationEnabled', boolValue);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['vignetteEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('vignetteEnabled', boolValue);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['grainEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('grainEnabled', boolValue);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['colorGradingEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('colorGradingEnabled', boolValue);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['fxaaEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('fxaaEnabled', boolValue);
                scene?.updatePostProcessing();
            },
            requiresScene: true
        }],
        ['sphereWaterDistortion', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('sphereWaterDistortion', boolValue);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['sphereHighPerformanceMode', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('sphereHighPerformanceMode', boolValue);
                scene?.updateSphereMaterials();
            },
            requiresScene: true
        }],
        ['enableShapeCycling', { 
            min: 0, max: 1, step: 1,
            setter: (state, value) => {
                const boolValue = value > 0.5;
                state.set('enableShapeCycling', boolValue);
            },
            requiresScene: false
        }],
        ['enableSizeAnimation', { 
            min: 0, max: 1, step: 1,
            setter: (state, value) => {
                const boolValue = value > 0.5;
                state.set('enableSizeAnimation', boolValue);
            },
            requiresScene: false
        }],
        ['enableMovementAnimation', { 
            min: 0, max: 1, step: 1,
            setter: (state, value) => {
                const boolValue = value > 0.5;
                state.set('enableMovementAnimation', boolValue);
            },
            requiresScene: false
        }],
        ['enableRotationAnimation', { 
            min: 0, max: 1, step: 1,
            setter: (state, value) => {
                const boolValue = value > 0.5;
                state.set('enableRotationAnimation', boolValue);
            },
            requiresScene: false
        }],
        ['enableScaleAnimation', { 
            min: 0, max: 1, step: 1,
            setter: (state, value) => {
                const boolValue = value > 0.5;
                state.set('enableScaleAnimation', boolValue);
            },
            requiresScene: false
        }],
        ['centerScalingAnimation', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('centerScalingAnimation', boolValue);
                scene?.updateCenterScaling();
            },
            requiresScene: true
        }],
        ['ambientLightIntensity', { 
            min: 0, max: 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('ambientLightIntensity', value);
                scene?.updateLighting();
            },
            requiresScene: true
        }],
        ['directionalLightIntensity', { 
            min: 0, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('directionalLightIntensity', value);
                scene?.updateLighting();
            },
            requiresScene: true
        }],
        ['pointLight1Intensity', { 
            min: 0, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('pointLight1Intensity', value);
                scene?.updateLighting();
            },
            requiresScene: true
        }],
        ['pointLight2Intensity', { 
            min: 0, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('pointLight2Intensity', value);
                scene?.updateLighting();
            },
            requiresScene: true
        }],
        ['rimLightIntensity', { 
            min: 0, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('rimLightIntensity', value);
                scene?.updateLighting();
            },
            requiresScene: true
        }],
        ['accentLightIntensity', { 
            min: 0, max: 3, step: 0.01,
            setter: (state, value, scene) => {
                state.set('accentLightIntensity', value);
                scene?.updateLighting();
            },
            requiresScene: true
        }],

        // Camera Controls
        ['cameraRotationX', { 
            min: GUI_CONTROL_CONFIGS.cameraRotationX.min, 
            max: GUI_CONTROL_CONFIGS.cameraRotationX.max, 
            step: GUI_CONTROL_CONFIGS.cameraRotationX.step,
            setter: (state, value, scene) => {
                state.set('cameraRotationX', value);
                // Update manual value in camera animation manager
                scene?.app?.cameraAnimationManager?.updateManualValue('rotationX', value);
                scene?.updateCameraRotation();
            },
            requiresScene: true
        }],
        ['cameraRotationY', { 
            min: GUI_CONTROL_CONFIGS.cameraRotationY.min, 
            max: GUI_CONTROL_CONFIGS.cameraRotationY.max, 
            step: GUI_CONTROL_CONFIGS.cameraRotationY.step,
            setter: (state, value, scene) => {
                state.set('cameraRotationY', value);
                // Update manual value in camera animation manager
                scene?.app?.cameraAnimationManager?.updateManualValue('rotationY', value);
                scene?.updateCameraRotation();
            },
            requiresScene: true
        }],
        ['cameraRotationZ', { 
            min: GUI_CONTROL_CONFIGS.cameraRotationZ.min, 
            max: GUI_CONTROL_CONFIGS.cameraRotationZ.max, 
            step: GUI_CONTROL_CONFIGS.cameraRotationZ.step,
            setter: (state, value, scene) => {
                state.set('cameraRotationZ', value);
                // Update manual value in camera animation manager
                scene?.app?.cameraAnimationManager?.updateManualValue('rotationZ', value);
                scene?.updateCameraRotation();
            },
            requiresScene: true
        }],
        ['cameraDistance', { 
            min: GUI_CONTROL_CONFIGS.cameraDistance.min, 
            max: GUI_CONTROL_CONFIGS.cameraDistance.max, 
            step: GUI_CONTROL_CONFIGS.cameraDistance.step,
            setter: (state, value, scene) => {
                state.set('cameraDistance', value);
                // Update manual value in camera animation manager
                scene?.app?.cameraAnimationManager?.updateManualValue('distance', value);
                scene?.updateCameraRotation();
            },
            requiresScene: true
        }],
        ['isometricEnabled', { 
            min: GUI_CONTROL_CONFIGS.isometricEnabled.min, 
            max: GUI_CONTROL_CONFIGS.isometricEnabled.max, 
            step: GUI_CONTROL_CONFIGS.isometricEnabled.step,
            setter: (state, value, scene) => {
                // For MIDI notes, treat as momentary toggle (value > 0.5 = toggle)
                if (value > 0.5) {
                    const currentValue = state.get('isometricEnabled');
                    const newValue = !currentValue;
                    state.set('isometricEnabled', newValue);
                    scene?.setIsometricView();
                }
            },
            requiresScene: true
        }],

        // Camera Animation Controls
        ['cameraAnim_rotationXEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('cameraAnim_rotationXEnabled', boolValue);
                scene?.app?.cameraAnimationManager?.setParameter('rotationXEnabled', boolValue);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationXAmplitude', { 
            min: 0, max: Math.PI, step: 0.01,
            setter: (state, value, scene) => {
                state.set('cameraAnim_rotationXAmplitude', value);
                scene?.app?.cameraAnimationManager?.setParameter('rotationXAmplitude', value);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationXDirection', { 
            min: -1, max: 1, step: 2,
            setter: (state, value, scene) => {
                const direction = value > 0 ? 1 : -1;
                state.set('cameraAnim_rotationXDirection', direction);
                scene?.app?.cameraAnimationManager?.setParameter('rotationXDirection', direction);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationYEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('cameraAnim_rotationYEnabled', boolValue);
                scene?.app?.cameraAnimationManager?.setParameter('rotationYEnabled', boolValue);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationYAmplitude', { 
            min: 0, max: Math.PI, step: 0.01,
            setter: (state, value, scene) => {
                state.set('cameraAnim_rotationYAmplitude', value);
                scene?.app?.cameraAnimationManager?.setParameter('rotationYAmplitude', value);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationYDirection', { 
            min: -1, max: 1, step: 2,
            setter: (state, value, scene) => {
                const direction = value > 0 ? 1 : -1;
                state.set('cameraAnim_rotationYDirection', direction);
                scene?.app?.cameraAnimationManager?.setParameter('rotationYDirection', direction);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationZEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('cameraAnim_rotationZEnabled', boolValue);
                scene?.app?.cameraAnimationManager?.setParameter('rotationZEnabled', boolValue);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationZAmplitude', { 
            min: 0, max: Math.PI / 2, step: 0.01,
            setter: (state, value, scene) => {
                state.set('cameraAnim_rotationZAmplitude', value);
                scene?.app?.cameraAnimationManager?.setParameter('rotationZAmplitude', value);
            },
            requiresScene: true
        }],
        ['cameraAnim_rotationZDirection', { 
            min: -1, max: 1, step: 2,
            setter: (state, value, scene) => {
                const direction = value > 0 ? 1 : -1;
                state.set('cameraAnim_rotationZDirection', direction);
                scene?.app?.cameraAnimationManager?.setParameter('rotationZDirection', direction);
            },
            requiresScene: true
        }],
        ['cameraAnim_orbitalEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('cameraAnim_orbitalEnabled', boolValue);
                scene?.app?.cameraAnimationManager?.setParameter('orbitalEnabled', boolValue);
            },
            requiresScene: true
        }],
        ['cameraAnim_orbitalDirection', { 
            min: -1, max: 1, step: 2,
            setter: (state, value, scene) => {
                const direction = value > 0 ? 1 : -1;
                state.set('cameraAnim_orbitalDirection', direction);
                scene?.app?.cameraAnimationManager?.setParameter('orbitalDirection', direction);
            },
            requiresScene: true
        }],
        ['cameraAnim_distanceEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('cameraAnim_distanceEnabled', boolValue);
                scene?.app?.cameraAnimationManager?.setParameter('distanceEnabled', boolValue);
            },
            requiresScene: true
        }],
        ['cameraAnim_distanceAmplitude', { 
            min: 0, max: 20, step: 0.1,
            setter: (state, value, scene) => {
                state.set('cameraAnim_distanceAmplitude', value);
                scene?.app?.cameraAnimationManager?.setParameter('distanceAmplitude', value);
            },
            requiresScene: true
        }],
        ['cameraAnim_distanceCenter', { 
            min: 1, max: 50, step: 0.1,
            setter: (state, value, scene) => {
                state.set('cameraAnim_distanceCenter', value);
                scene?.app?.cameraAnimationManager?.setParameter('distanceCenter', value);
            },
            requiresScene: true
        }],
        ['cameraAnim_complexRotationEnabled', { 
            min: 0, max: 1, step: 1,
            setter: (state, value, scene) => {
                const boolValue = value > 0.5;
                state.set('cameraAnim_complexRotationEnabled', boolValue);
                scene?.app?.cameraAnimationManager?.setParameter('complexRotationEnabled', boolValue);
            },
            requiresScene: true
        }],
        ['cameraAnim_complexRotationIntensity', { 
            min: 0, max: 1, step: 0.01,
            setter: (state, value, scene) => {
                state.set('cameraAnim_complexRotationIntensity', value);
                scene?.app?.cameraAnimationManager?.setParameter('complexRotationIntensity', value);
            },
            requiresScene: true
        }],

        // Layer Controls
        ['layerSpacing', { 
            min: GUI_CONTROL_CONFIGS.layerSpacing.min, 
            max: GUI_CONTROL_CONFIGS.layerSpacing.max, 
            step: GUI_CONTROL_CONFIGS.layerSpacing.step,
            setter: (state, value, scene) => {
                state.set('layerSpacing', value);
                scene?.app?.layerManager?.updateLayerZPositions();
            },
            requiresScene: true
        }],
        ['maxLayers', { 
            min: GUI_CONTROL_CONFIGS.maxLayers.min, 
            max: GUI_CONTROL_CONFIGS.maxLayers.max, 
            step: GUI_CONTROL_CONFIGS.maxLayers.step,
            setter: (state, value, scene) => {
                state.set('maxLayers', value);
                // Could add logic here to limit actual layer count
            },
            requiresScene: false
        }],
        ['autoArrangeLayers', { 
            min: GUI_CONTROL_CONFIGS.autoArrangeLayers.min, 
            max: GUI_CONTROL_CONFIGS.autoArrangeLayers.max, 
            step: GUI_CONTROL_CONFIGS.autoArrangeLayers.step,
            setter: (state, value, scene) => {
                // For MIDI notes, treat as momentary toggle (value > 0.5 = toggle)
                if (value > 0.5) {
                    const currentValue = state.get('autoArrangeLayers');
                    const newValue = !currentValue;
                    state.set('autoArrangeLayers', newValue);
                    if (newValue && scene?.app?.layerManager) {
                        scene.app.layerManager.updateLayerZPositions();
                    }
                }
            },
            requiresScene: true
        }]
    ]);

    /**
     * Unified parameter update handler - replaces all individual parameter handling
     * @param {string} target - Parameter name
     * @param {number} value - Normalized value (0-1)
     * @param {StateManager} state - State manager instance
     * @param {Scene} scene - Scene instance (optional)
     * @param {string} source - Source of the parameter update ('midi', 'audio', etc.)
     */
    static handleParameterUpdate(target, value, state, scene, source = 'unknown') {
        // Debug logging for center scaling parameters
        if (target && target.startsWith('centerScaling')) {
            console.log(`🎛️ ParameterMapper ${source} ${target}:`, value);
        }

        const config = this.PARAMETER_CONFIGS.get(target);
        if (!config) {
            console.warn(`ParameterMapper: Unknown parameter '${target}' from ${source}`);
            return;
        }

        // Validate value range
        if (value < 0 || value > 1) {
            console.warn(`ParameterMapper: Value out of range for ${target}: ${value} (should be 0-1)`);
            return;
        }

        // Convert normalized value (0-1) to actual parameter value
        const actualValue = this.denormalizeValue(value, target);
        
        // Apply the parameter using the configured setter
        try {
            if (config.requiresScene) {
                config.setter(state, actualValue, scene);
            } else {
                config.setter(state, actualValue);
            }
        } catch (error) {
            console.error(`ParameterMapper: Error setting parameter ${target}:`, error);
        }
    }

    /**
     * Get parameter configuration
     * @param {string} target - Parameter name
     * @returns {Object|null} Parameter configuration
     */
    static getParameterConfig(target) {
        const config = this.PARAMETER_CONFIGS.get(target);
        if (config) {
            return {
                min: config.min,
                max: config.max,
                step: config.step,
                requiresScene: config.requiresScene
            };
        }
        return null;
    }

    /**
     * Normalize a value from a source range to 0-1
     * @param {number} value - Input value
     * @param {string} target - Parameter name
     * @param {Object} sourceConfig - Source configuration (min, max)
     * @returns {number} Normalized value (0-1)
     */
    static normalizeValue(value, target, sourceConfig = null) {
        const config = this.getParameterConfig(target);
        if (!config) {
            return Math.max(0, Math.min(1, value)); // Default to 0-1 range
        }

        // If source config is provided, use it for normalization
        if (sourceConfig && sourceConfig.min !== undefined && sourceConfig.max !== undefined) {
            return (value - sourceConfig.min) / (sourceConfig.max - sourceConfig.min);
        }

        // Otherwise, assume value is already in target range and normalize to 0-1
        return (value - config.min) / (config.max - config.min);
    }

    /**
     * Convert normalized value to target range
     * @param {number} normalizedValue - Normalized value (0-1)
     * @param {string} target - Parameter name
     * @returns {number} Value in target range
     */
    static denormalizeValue(normalizedValue, target) {
        const config = this.getParameterConfig(target);
        if (!config) {
            return normalizedValue; // Return as-is if no config
        }

        return config.min + (normalizedValue * (config.max - config.min));
    }

    /**
     * Get all available parameter names
     * @returns {string[]} Array of parameter names
     */
    static getAvailableParameters() {
        return Array.from(this.PARAMETER_CONFIGS.keys());
    }

    /**
     * Check if a parameter requires scene updates
     * @param {string} target - Parameter name
     * @returns {boolean} True if parameter requires scene
     */
    static requiresScene(target) {
        const config = this.PARAMETER_CONFIGS.get(target);
        return config ? config.requiresScene : false;
    }

    /**
     * HSV to Hex color conversion utility
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} v - Value (0-100)
     * @returns {string} Hex color string
     */
    static hsvToHex(h, s, v) {
        h = h / 360;
        s = s / 100;
        v = v / 100;

        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
}
