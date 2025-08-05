/**
 * StateManager.js - Application State Management
 * This module provides centralized state management for the entire application, handling all parameters,
 * settings, and configuration data. It includes features like undo/redo functionality, state history,
 * interpolation between states, scene import/export, and reactive updates to ensure all components
 * stay synchronized when state changes occur.
 */

import { gsap } from 'gsap';

export class StateManager {
    constructor() {
        this.state = {};
        this.listeners = new Map();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.interpolationTimeline = null; // Track active interpolation
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            this.state = await this.getInitialState();
        } catch (error) {
            console.warn('Failed to load initial state, using fallback:', error);
            this.state = this.getFallbackState();
        }
        
        this.initialized = true;
    }

    async reloadDefaultScene() {
        const newState = await this.getInitialState();
        if (newState) {
            // Update all state properties
            Object.keys(newState).forEach(key => {
                if (this.state.hasOwnProperty(key)) {
                    const oldValue = this.state[key];
                    const newValue = newState[key];
                    this.state[key] = newValue;
                    this.notifyListeners(key, newValue, oldValue);
                }
            });
        } else {
            console.warn('Failed to reload default scene');
        }
    }

    async getInitialState() {
        // Try to load the default scene from the JSON file
        const loadedState = await this.loadDefaultScene();
        return loadedState || this.getFallbackState();
    }

    async loadDefaultScene() {
        const paths = ['/default-scene.json', './default-scene.json', '/public/default-scene.json'];
        
        for (const path of paths) {
            try {
                const response = await fetch(path);
                
                if (!response.ok) {
                    console.warn(`Could not load from ${path}, trying next path...`);
                    continue;
                }
                
                const data = await response.json();
                
                // Start with the default scene settings
                const initialState = { ...data.settings };
                
                // Add MIDI parameters that aren't in the scene data
                initialState.midiEnabled = false;
                initialState.midiChannel = 0;
                initialState.midiCCMappings = {};
                initialState.midiNoteMappings = {};
                initialState.midiStopStopsAnimation = false;
                
                // Add sphereDistortionStrength if not present
                if (!initialState.hasOwnProperty('sphereDistortionStrength')) {
                    initialState.sphereDistortionStrength = 0.1;
                }
                

                
                return initialState;
            } catch (error) {
                console.warn(`Error loading from ${path}:`, error.message);
                continue;
            }
        }
        
        console.warn('Failed to load from all paths, using fallback state');
        return null;
    }

    getFallbackState() {
        // Fallback state if JSON file can't be loaded
        return {
            "globalBPM": 120,
            "animationType": 0,
            "animationSpeed": 1.89,
            "enableShapeCycling": false,
            "enableSizeAnimation": true,
            "movementAmplitude": 0.08,
            "movementFrequency": 0.7000000000000001,
            "rotationAmplitude": 0.5,
            "rotationFrequency": 0.3,
            "scaleAmplitude": 0.2,
            "scaleFrequency": 0.4,
            "shapeCyclingSpeed": 0.4,
            "shapeCyclingPattern": 0,
            "shapeCyclingDirection": 0,
            "shapeCyclingSync": 0,
            "shapeCyclingIntensity": 1,
            "shapeCyclingTrigger": 0,
            "morphingEnabled": false,
            "morphingSpeed": 0.5,
            "morphingEasing": "power2.inOut",
            "autoMorphing": true,
            "crossCategoryMorphing": true,
            "morphingAggressiveness": 1,
            "currentMorphProgress": 0.72,
            "morphingPreset": "geometric_evolution",
            "randomMorphing": true,
            "morphingTargetShape": null,
            "gridWidth": 19,
            "gridHeight": 6,
            "cellSize": 0.76,
            "compositionWidth": 30,
            "compositionHeight": 30,
            "showGrid": false,
            "randomness": 1,
            "shapeColor": "#5cff00",
            "backgroundColor": "#000000",
            "enabledShapes": {
                "Basic Shapes": true,
                "Triangles": true,
                "Rectangles": true,
                "Ellipses": true,
                "Refractive Spheres": true
            },
            "sphereRefraction": 1.67,
            "sphereTransparency": 1,
            "sphereRoughness": 0.04,
            "sphereMetalness": 1,
            "sphereTransmission": 1,
            "sphereScale": 3,
            "sphereClearcoat": 0.09,
            "sphereClearcoatRoughness": 0.05,
            "sphereEnvMapIntensity": 0.28,
            "sphereWaterDistortion": true,
            "sphereDistortionStrength": 0.1,
            "sphereHighPerformanceMode": false,
            "postProcessingEnabled": false,
            "bloomEnabled": true,
            "bloomStrength": 0.41,
            "bloomRadius": 1.18,
            "bloomThreshold": 0,
            "chromaticAberrationEnabled": false,
            "chromaticIntensity": 0.5,
            "vignetteEnabled": true,
            "vignetteIntensity": 1,
            "vignetteRadius": 0.53,
            "vignetteSoftness": 0.36,
            "grainEnabled": true,
            "grainIntensity": 0.1,
            "colorGradingEnabled": false,
            "colorHue": 0,
            "colorSaturation": 1,
            "colorBrightness": 1,
            "colorContrast": 1,
            "fxaaEnabled": true,
            "ambientLightIntensity": 0.97,
            "directionalLightIntensity": 0.04,
            "pointLight1Intensity": 2.94,
            "pointLight2Intensity": 3,
            "rimLightIntensity": 3,
            "accentLightIntensity": 2.97,
            "enableFrustumCulling": true,
            "centerScalingEnabled": false,
            "centerScalingIntensity": 0.5,
            "centerScalingCurve": 0,
            "centerScalingRadius": 1.0,
            "centerScalingDirection": 0,
            "centerScalingAnimation": false,
            "centerScalingAnimationSpeed": 1.0,
            "centerScalingAnimationType": 0,
            "shapeCyclingDivision": "quarter",
            "movementDivision": "8th",
            "rotationDivision": "16th",
            "scaleDivision": "half",
            "morphingDivision": "quarter",
            "centerScalingDivision": "quarter",
            "midiEnabled": false,
            "midiChannel": 0,
            "midiCCMappings": {},
            "midiNoteMappings": {},
            "midiStopStopsAnimation": false,
            "audioMappings": {},
            
            // Audio reactivity parameters
            "audioEnabled": false,
            "audioListening": false,
            "audioAvailable": false,
            "audioReactivityEnabled": false,
            "audioSensitivity": 1.0,
            "audioSmoothing": 0.8,
            "audioActiveChannel": 0,
            "audioAffectsSize": true,
            "audioAffectsMorphing": true,
            "audioAffectsColors": true,
            "audioAffectsAnimation": true,
            
            // Audio interface data
            "availableAudioInterfaces": [],
            "audioInterfaceCount": 0,
            "selectedAudioInterface": null,
            "selectedAudioChannels": [],
            
            // Audio data (will be updated by AudioManager)
            "audioOverall": 0,
            "audioRMS": 0,
            "audioPeak": 0,
            "audioFrequency": 0
        };
    }

    get(key) {
        if (!this.initialized || !this.state) {
            console.warn(`StateManager not initialized, returning undefined for key: ${key}`);
            return undefined;
        }
        return this.state[key];
    }

    isInitialized() {
        return this.initialized && this.state !== null;
    }

    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Add to history if value actually changed
        if (oldValue !== value) {
            this.addToHistory(key, oldValue, value);
            this.notifyListeners(key, value, oldValue);
        }
    }

    addToHistory(key, oldValue, newValue) {
        // Remove any future history if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new entry
        this.history.push({
            key,
            oldValue,
            newValue,
            timestamp: Date.now()
        });
        
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    notifyListeners(key, newValue, oldValue) {
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }
    }

    // Undo/Redo functionality
    undo() {
        if (this.historyIndex >= 0) {
            const entry = this.history[this.historyIndex];
            this.state[entry.key] = entry.oldValue;
            this.notifyListeners(entry.key, entry.oldValue, entry.newValue);
            this.historyIndex--;
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const entry = this.history[this.historyIndex];
            this.state[entry.key] = entry.newValue;
            this.notifyListeners(entry.key, entry.newValue, entry.oldValue);
            return true;
        }
        return false;
    }

    canUndo() {
        return this.historyIndex >= 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    // Batch updates for performance
    batchUpdate(updates) {
        const oldValues = {};
        
        // Collect all changes
        Object.keys(updates).forEach(key => {
            oldValues[key] = this.state[key];
            this.state[key] = updates[key];
        });
        
        // Add to history as single entry
        this.addToHistory('batch', oldValues, updates);
        
        // Notify listeners
        Object.keys(updates).forEach(key => {
            this.notifyListeners(key, updates[key], oldValues[key]);
        });
    }

    // Export/Import state
    exportState() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            state: { ...this.state }
        };
    }

    importState(data) {
        if (data.state) {
            const oldState = { ...this.state };
            this.state = { ...this.state, ...data.state };
            
            // Notify all listeners of the change
            Object.keys(this.state).forEach(key => {
                if (oldState[key] !== this.state[key]) {
                    this.notifyListeners(key, this.state[key], oldState[key]);
                }
            });
            
            // Clear history after import
            this.history = [];
            this.historyIndex = -1;
        }
    }

    // Reset to initial state
    reset() {
        const oldState = { ...this.state };
        this.state = this.getInitialState();
        
        // Notify all listeners
        Object.keys(this.state).forEach(key => {
            if (oldState[key] !== this.state[key]) {
                this.notifyListeners(key, this.state[key], oldState[key]);
            }
        });
        
        // Clear history
        this.history = [];
        this.historyIndex = -1;
    }

    // Get all state keys
    getKeys() {
        return Object.keys(this.state);
    }

    // Check if a key exists
    has(key) {
        return key in this.state;
    }

    // Get multiple values at once
    getMultiple(keys) {
        const result = {};
        keys.forEach(key => {
            if (this.has(key)) {
                result[key] = this.get(key);
            }
        });
        return result;
    }

    // Set multiple values at once
    setMultiple(updates) {
        this.batchUpdate(updates);
    }
    
    // Scene management methods
    exportScene() {
        // Export all visual settings (excluding MIDI mappings)
        const sceneData = {
            name: 'Custom Scene',
            timestamp: new Date().toISOString(),
            version: '1.0',
            settings: {
                // Global BPM parameter
                globalBPM: this.state.globalBPM,
                
                // Animation parameters
                animationType: this.state.animationType,
                animationSpeed: this.state.animationSpeed,
                enableShapeCycling: this.state.enableShapeCycling,
                enableSizeAnimation: this.state.enableSizeAnimation,
                movementAmplitude: this.state.movementAmplitude,
                movementFrequency: this.state.movementFrequency,
                rotationAmplitude: this.state.rotationAmplitude,
                rotationFrequency: this.state.rotationFrequency,
                scaleAmplitude: this.state.scaleAmplitude,
                scaleFrequency: this.state.scaleFrequency,
                
                // Division parameters
                movementDivision: this.state.movementDivision,
                rotationDivision: this.state.rotationDivision,
                scaleDivision: this.state.scaleDivision,
                shapeCyclingDivision: this.state.shapeCyclingDivision,
                morphingDivision: this.state.morphingDivision,
                centerScalingDivision: this.state.centerScalingDivision,
                
                // Shape cycling parameters
                shapeCyclingSpeed: this.state.shapeCyclingSpeed,
                shapeCyclingPattern: this.state.shapeCyclingPattern,
                shapeCyclingDirection: this.state.shapeCyclingDirection,
                shapeCyclingSync: this.state.shapeCyclingSync,
                shapeCyclingIntensity: this.state.shapeCyclingIntensity,
                shapeCyclingTrigger: this.state.shapeCyclingTrigger,
                
                // Morphing parameters
                morphingEnabled: this.state.morphingEnabled,
                morphingSpeed: this.state.morphingSpeed,
                morphingEasing: this.state.morphingEasing,
                autoMorphing: this.state.autoMorphing,
                crossCategoryMorphing: this.state.crossCategoryMorphing,
                morphingAggressiveness: this.state.morphingAggressiveness,
                currentMorphProgress: this.state.currentMorphProgress,
                morphingPreset: this.state.morphingPreset,
                randomMorphing: this.state.randomMorphing,
                morphingTargetShape: this.state.morphingTargetShape,
                
                // Grid parameters
                gridWidth: this.state.gridWidth,
                gridHeight: this.state.gridHeight,
                cellSize: this.state.cellSize,
                compositionWidth: this.state.compositionWidth,
                compositionHeight: this.state.compositionHeight,
                showGrid: this.state.showGrid,
                gridColor: this.state.gridColor,
                randomness: this.state.randomness,
                
                // Color parameters
                shapeColor: this.state.shapeColor,
                backgroundColor: this.state.backgroundColor,
                
                // Shape selection
                enabledShapes: { ...this.state.enabledShapes },
                
                // Sphere parameters
                sphereRefraction: this.state.sphereRefraction,
                sphereTransparency: this.state.sphereTransparency,
                sphereRoughness: this.state.sphereRoughness,
                sphereMetalness: this.state.sphereMetalness,
                sphereTransmission: this.state.sphereTransmission,
                sphereScale: this.state.sphereScale,
                sphereClearcoat: this.state.sphereClearcoat,
                sphereClearcoatRoughness: this.state.sphereClearcoatRoughness,
                sphereEnvMapIntensity: this.state.sphereEnvMapIntensity,
                sphereWaterDistortion: this.state.sphereWaterDistortion,
                sphereDistortionStrength: this.state.sphereDistortionStrength,
                sphereHighPerformanceMode: this.state.sphereHighPerformanceMode,
                
                // Post-processing parameters
                postProcessingEnabled: this.state.postProcessingEnabled,
                bloomEnabled: this.state.bloomEnabled,
                bloomStrength: this.state.bloomStrength,
                bloomRadius: this.state.bloomRadius,
                bloomThreshold: this.state.bloomThreshold,
                chromaticAberrationEnabled: this.state.chromaticAberrationEnabled,
                chromaticIntensity: this.state.chromaticIntensity,
                vignetteEnabled: this.state.vignetteEnabled,
                vignetteIntensity: this.state.vignetteIntensity,
                vignetteRadius: this.state.vignetteRadius,
                vignetteSoftness: this.state.vignetteSoftness,
                grainEnabled: this.state.grainEnabled,
                grainIntensity: this.state.grainIntensity,
                colorGradingEnabled: this.state.colorGradingEnabled,
                colorHue: this.state.colorHue,
                colorSaturation: this.state.colorSaturation,
                colorBrightness: this.state.colorBrightness,
                colorContrast: this.state.colorContrast,
                fxaaEnabled: this.state.fxaaEnabled,
                
                // Lighting parameters
                ambientLightIntensity: this.state.ambientLightIntensity,
                directionalLightIntensity: this.state.directionalLightIntensity,
                pointLight1Intensity: this.state.pointLight1Intensity,
                pointLight2Intensity: this.state.pointLight2Intensity,
                rimLightIntensity: this.state.rimLightIntensity,
                accentLightIntensity: this.state.accentLightIntensity,
                
                // Performance parameters
                enableFrustumCulling: this.state.enableFrustumCulling,
                
                // Center scaling animation parameters
                centerScalingEnabled: this.state.centerScalingEnabled,
                centerScalingIntensity: this.state.centerScalingIntensity,
                centerScalingCurve: this.state.centerScalingCurve,
                centerScalingRadius: this.state.centerScalingRadius,
                centerScalingDirection: this.state.centerScalingDirection,
                centerScalingAnimation: this.state.centerScalingAnimation,
                centerScalingAnimationSpeed: this.state.centerScalingAnimationSpeed,
                centerScalingAnimationType: this.state.centerScalingAnimationType
            }
        };
        
        return sceneData;
    }
    
    importScene(sceneData) {
        try {
            if (!sceneData || !sceneData.settings) {
                throw new Error('Invalid scene data format');
            }
            
            // Use interpolation instead of immediate update
            return this.importSceneWithInterpolation(sceneData);
        } catch (error) {
            console.error('Error loading scene:', error);
            return false;
        }
    }

    importSceneWithInterpolation(sceneData, duration = 2.0, easing = "power2.inOut") {
        try {
            if (!sceneData || !sceneData.settings) {
                throw new Error('Invalid scene data format');
            }
            
            const settings = sceneData.settings;
            
            // Kill any existing interpolation
            if (this.interpolationTimeline) {
                this.interpolationTimeline.kill();
            }
            
            // Check for large changes and suggest better settings
            const suggestions = this.suggestInterpolationSettings(sceneData, this.state);
            
            // Create a new timeline for the interpolation
            this.interpolationTimeline = gsap.timeline({
                onComplete: () => {
                    this.interpolationTimeline = null;
                    
                    // Trigger grid recreation after interpolation is complete
                    // This ensures smooth transition without jarring grid changes
                    if (this.state.gridWidth !== currentState.gridWidth || 
                        this.state.gridHeight !== currentState.gridHeight ||
                        this.state.compositionWidth !== currentState.compositionWidth ||
                        this.state.compositionHeight !== currentState.compositionHeight ||
                        JSON.stringify(this.state.enabledShapes) !== JSON.stringify(currentState.enabledShapes) ||
                        this.state.randomness !== currentState.randomness) {
                        
                        // Notify all grid-related changes at once
                        this.notifyListeners('gridWidth', this.state.gridWidth, currentState.gridWidth);
                        this.notifyListeners('gridHeight', this.state.gridHeight, currentState.gridHeight);
                        this.notifyListeners('compositionWidth', this.state.compositionWidth, currentState.compositionWidth);
                        this.notifyListeners('compositionHeight', this.state.compositionHeight, currentState.compositionHeight);
                        this.notifyListeners('enabledShapes', this.state.enabledShapes, currentState.enabledShapes);
                        this.notifyListeners('randomness', this.state.randomness, currentState.randomness);
                    }
                }
            });
            
            // Store current state for interpolation
            const currentState = { ...this.state };
            
            // Create interpolation targets for all numeric values
            const interpolationTargets = {};
            const skippedParameters = [];
            const immediateParameters = [];
            
            // Helper function to add interpolation for a parameter
            const addInterpolation = (key, targetValue, currentValue) => {
                if (typeof targetValue === 'number' && typeof currentValue === 'number') {
                    // Special handling for grid dimensions - don't trigger immediate recreation
                    if (key === 'gridWidth' || key === 'gridHeight' || 
                        key === 'compositionWidth' || key === 'compositionHeight') {
                        interpolationTargets[key] = targetValue;
                        // Don't notify listeners immediately for grid dimensions
                    } else {
                        interpolationTargets[key] = targetValue;
                    }
                } else if (targetValue !== undefined) {
                    // For non-numeric values, set immediately
                    this.state[key] = targetValue;
                    this.notifyListeners(key, targetValue, currentValue);
                    immediateParameters.push(`${key}: ${currentValue} -> ${targetValue}`);
                } else {
                    skippedParameters.push(`${key}: undefined target`);
                }
            };
            
            // Animation parameters
            addInterpolation('animationType', settings.animationType, currentState.animationType);
            addInterpolation('animationSpeed', settings.animationSpeed, currentState.animationSpeed);
            addInterpolation('enableShapeCycling', settings.enableShapeCycling, currentState.enableShapeCycling);
            addInterpolation('enableSizeAnimation', settings.enableSizeAnimation, currentState.enableSizeAnimation);
            addInterpolation('movementAmplitude', settings.movementAmplitude, currentState.movementAmplitude);
            addInterpolation('movementFrequency', settings.movementFrequency, currentState.movementFrequency);
            addInterpolation('rotationAmplitude', settings.rotationAmplitude, currentState.rotationAmplitude);
            addInterpolation('rotationFrequency', settings.rotationFrequency, currentState.rotationFrequency);
            addInterpolation('scaleAmplitude', settings.scaleAmplitude, currentState.scaleAmplitude);
            addInterpolation('scaleFrequency', settings.scaleFrequency, currentState.scaleFrequency);
            
            // Shape cycling parameters
            addInterpolation('shapeCyclingSpeed', settings.shapeCyclingSpeed, currentState.shapeCyclingSpeed);
            addInterpolation('shapeCyclingPattern', settings.shapeCyclingPattern, currentState.shapeCyclingPattern);
            addInterpolation('shapeCyclingDirection', settings.shapeCyclingDirection, currentState.shapeCyclingDirection);
            addInterpolation('shapeCyclingSync', settings.shapeCyclingSync, currentState.shapeCyclingSync);
            addInterpolation('shapeCyclingIntensity', settings.shapeCyclingIntensity, currentState.shapeCyclingIntensity);
            addInterpolation('shapeCyclingTrigger', settings.shapeCyclingTrigger, currentState.shapeCyclingTrigger);
            
            // Morphing parameters
            addInterpolation('morphingEnabled', settings.morphingEnabled, currentState.morphingEnabled);
            addInterpolation('morphingSpeed', settings.morphingSpeed, currentState.morphingSpeed);
            addInterpolation('morphingEasing', settings.morphingEasing, currentState.morphingEasing);
            addInterpolation('autoMorphing', settings.autoMorphing, currentState.autoMorphing);
            addInterpolation('crossCategoryMorphing', settings.crossCategoryMorphing, currentState.crossCategoryMorphing);
            addInterpolation('morphingAggressiveness', settings.morphingAggressiveness, currentState.morphingAggressiveness);
            addInterpolation('currentMorphProgress', settings.currentMorphProgress, currentState.currentMorphProgress);
            addInterpolation('morphingPreset', settings.morphingPreset, currentState.morphingPreset);
            addInterpolation('randomMorphing', settings.randomMorphing, currentState.randomMorphing);
            addInterpolation('morphingTargetShape', settings.morphingTargetShape, currentState.morphingTargetShape);
            
            // Grid parameters
            addInterpolation('gridWidth', settings.gridWidth, currentState.gridWidth);
            addInterpolation('gridHeight', settings.gridHeight, currentState.gridHeight);
            addInterpolation('cellSize', settings.cellSize, currentState.cellSize);
            addInterpolation('compositionWidth', settings.compositionWidth, currentState.compositionWidth);
            addInterpolation('compositionHeight', settings.compositionHeight, currentState.compositionHeight);
            addInterpolation('showGrid', settings.showGrid, currentState.showGrid);
            addInterpolation('randomness', settings.randomness, currentState.randomness);
            
            // Grid color (handle as color interpolation)
            if (settings.gridColor && settings.gridColor !== currentState.gridColor) {
                this.interpolateColor('gridColor', currentState.gridColor, settings.gridColor, duration, easing);
            }
            
            // Color parameters (handle colors specially)
            if (settings.shapeColor && settings.shapeColor !== currentState.shapeColor) {
                this.interpolateColor('shapeColor', currentState.shapeColor, settings.shapeColor, duration, easing);
            }
            if (settings.backgroundColor && settings.backgroundColor !== currentState.backgroundColor) {
                this.interpolateColor('backgroundColor', currentState.backgroundColor, settings.backgroundColor, duration, easing);
            }
            
            // Shape selection and randomness (defer until interpolation complete)
            if (settings.enabledShapes) {
                this.state.enabledShapes = { ...settings.enabledShapes };
                // Don't notify immediately - will be handled in onComplete
            }
            
            // Sphere parameters
            addInterpolation('sphereRefraction', settings.sphereRefraction, currentState.sphereRefraction);
            addInterpolation('sphereTransparency', settings.sphereTransparency, currentState.sphereTransparency);
            addInterpolation('sphereRoughness', settings.sphereRoughness, currentState.sphereRoughness);
            addInterpolation('sphereMetalness', settings.sphereMetalness, currentState.sphereMetalness);
            addInterpolation('sphereTransmission', settings.sphereTransmission, currentState.sphereTransmission);
            addInterpolation('sphereScale', settings.sphereScale, currentState.sphereScale);
            addInterpolation('sphereClearcoat', settings.sphereClearcoat, currentState.sphereClearcoat);
            addInterpolation('sphereClearcoatRoughness', settings.sphereClearcoatRoughness, currentState.sphereClearcoatRoughness);
            addInterpolation('sphereEnvMapIntensity', settings.sphereEnvMapIntensity, currentState.sphereEnvMapIntensity);
            addInterpolation('sphereWaterDistortion', settings.sphereWaterDistortion, currentState.sphereWaterDistortion);
            addInterpolation('sphereHighPerformanceMode', settings.sphereHighPerformanceMode, currentState.sphereHighPerformanceMode);
            
            // Post-processing parameters
            addInterpolation('postProcessingEnabled', settings.postProcessingEnabled, currentState.postProcessingEnabled);
            addInterpolation('bloomEnabled', settings.bloomEnabled, currentState.bloomEnabled);
            addInterpolation('bloomStrength', settings.bloomStrength, currentState.bloomStrength);
            addInterpolation('bloomRadius', settings.bloomRadius, currentState.bloomRadius);
            addInterpolation('bloomThreshold', settings.bloomThreshold, currentState.bloomThreshold);
            addInterpolation('chromaticAberrationEnabled', settings.chromaticAberrationEnabled, currentState.chromaticAberrationEnabled);
            addInterpolation('chromaticIntensity', settings.chromaticIntensity, currentState.chromaticIntensity);
            addInterpolation('vignetteEnabled', settings.vignetteEnabled, currentState.vignetteEnabled);
            addInterpolation('vignetteIntensity', settings.vignetteIntensity, currentState.vignetteIntensity);
            addInterpolation('vignetteRadius', settings.vignetteRadius, currentState.vignetteRadius);
            addInterpolation('vignetteSoftness', settings.vignetteSoftness, currentState.vignetteSoftness);
            addInterpolation('grainEnabled', settings.grainEnabled, currentState.grainEnabled);
            addInterpolation('grainIntensity', settings.grainIntensity, currentState.grainIntensity);
            addInterpolation('colorGradingEnabled', settings.colorGradingEnabled, currentState.colorGradingEnabled);
            addInterpolation('colorHue', settings.colorHue, currentState.colorHue);
            addInterpolation('colorSaturation', settings.colorSaturation, currentState.colorSaturation);
            addInterpolation('colorBrightness', settings.colorBrightness, currentState.colorBrightness);
            addInterpolation('colorContrast', settings.colorContrast, currentState.colorContrast);
            addInterpolation('fxaaEnabled', settings.fxaaEnabled, currentState.fxaaEnabled);
            
            // Lighting parameters
            addInterpolation('ambientLightIntensity', settings.ambientLightIntensity, currentState.ambientLightIntensity);
            addInterpolation('directionalLightIntensity', settings.directionalLightIntensity, currentState.directionalLightIntensity);
            addInterpolation('pointLight1Intensity', settings.pointLight1Intensity, currentState.pointLight1Intensity);
            addInterpolation('pointLight2Intensity', settings.pointLight2Intensity, currentState.pointLight2Intensity);
            addInterpolation('rimLightIntensity', settings.rimLightIntensity, currentState.rimLightIntensity);
            addInterpolation('accentLightIntensity', settings.accentLightIntensity, currentState.accentLightIntensity);
            
            // Performance parameters
            addInterpolation('enableFrustumCulling', settings.enableFrustumCulling, currentState.enableFrustumCulling);
            
            // Center scaling animation parameters
            addInterpolation('centerScalingEnabled', settings.centerScalingEnabled, currentState.centerScalingEnabled);
            addInterpolation('centerScalingIntensity', settings.centerScalingIntensity, currentState.centerScalingIntensity);
            addInterpolation('centerScalingCurve', settings.centerScalingCurve, currentState.centerScalingCurve);
            addInterpolation('centerScalingRadius', settings.centerScalingRadius, currentState.centerScalingRadius);
            addInterpolation('centerScalingDirection', settings.centerScalingDirection, currentState.centerScalingDirection);
            addInterpolation('centerScalingAnimation', settings.centerScalingAnimation, currentState.centerScalingAnimation);
            addInterpolation('centerScalingAnimationSpeed', settings.centerScalingAnimationSpeed, currentState.centerScalingAnimationSpeed);
            addInterpolation('centerScalingAnimationType', settings.centerScalingAnimationType, currentState.centerScalingAnimationType);
            
            // Sphere distortion parameter
            addInterpolation('sphereDistortionStrength', settings.sphereDistortionStrength, currentState.sphereDistortionStrength);
            

            
            // Create the interpolation animation
            this.interpolationTimeline.to(this.state, {
                ...interpolationTargets,
                duration: duration,
                ease: easing,
                onUpdate: () => {
                    // Debug: Track interpolation progress
                    const progress = this.interpolationTimeline.progress();
                    const time = this.interpolationTimeline.time();
                    
                    // Log progress every 10% or if there's a significant change
                    if (Math.floor(progress * 10) !== Math.floor((progress - 0.01) * 10)) {
                        console.log(`Interpolation progress: ${(progress * 100).toFixed(1)}% (${time.toFixed(2)}s)`);
                    }
                    
                    // Notify listeners for each interpolated value
                    Object.keys(interpolationTargets).forEach(key => {
                        // Skip grid dimension notifications during interpolation
                        if (key !== 'gridWidth' && key !== 'gridHeight' && 
                            key !== 'compositionWidth' && key !== 'compositionHeight') {
                            const oldValue = currentState[key];
                            const newValue = this.state[key];
                            
                            // Check for significant changes that might cause skips
                            if (typeof newValue === 'number' && typeof oldValue === 'number') {
                                const change = Math.abs(newValue - oldValue);
                                const changePercent = (change / Math.abs(oldValue)) * 100;
                                
                                // Log large changes that might cause visual skips
                                if (changePercent > 50) {
                                    console.warn(`Large change detected for ${key}: ${oldValue} -> ${newValue} (${changePercent.toFixed(1)}% change)`);
                                    
                                    // Special handling for animation speed changes
                                    if (key === 'animationSpeed' && changePercent > 200) {
                                        console.warn(`⚠️  EXTREME animation speed change detected! Consider using a longer duration or different easing curve.`);
                                        console.warn(`   Current: ${oldValue} -> Target: ${newValue} (${changePercent.toFixed(1)}% change)`);
                                        console.warn(`   Suggestion: Try 'expo.inOut' or 'back.inOut' easing for smoother transitions`);
                                    }
                                    
                                    // Special handling for grid dimension changes
                                    if ((key === 'gridWidth' || key === 'gridHeight') && changePercent > 100) {
                                        console.warn(`⚠️  Large grid dimension change: ${oldValue} -> ${newValue}`);
                                        console.warn(`   This may cause visual skips during grid recreation`);
                                    }
                                }
                            }
                            
                            this.notifyListeners(key, newValue, oldValue);
                        }
                    });
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error loading scene with interpolation:', error);
            return false;
        }
    }

    interpolateColor(key, fromColor, toColor, duration, easing = "power2.inOut") {
        // Convert hex colors to RGB for interpolation
        const fromRGB = this.hexToRgb(fromColor);
        const toRGB = this.hexToRgb(toColor);
        
        if (!fromRGB || !toRGB) {
            // If color conversion fails, set immediately
            this.state[key] = toColor;
            this.notifyListeners(key, toColor, fromColor);
            return;
        }
        
        // Create a temporary object for interpolation
        const colorObj = { r: fromRGB.r, g: fromRGB.g, b: fromRGB.b };
        
        this.interpolationTimeline.to(colorObj, {
            r: toRGB.r,
            g: toRGB.g,
            b: toRGB.b,
            duration: duration,
            ease: easing,
            onUpdate: () => {
                const interpolatedColor = this.rgbToHex(Math.round(colorObj.r), Math.round(colorObj.g), Math.round(colorObj.b));
                this.state[key] = interpolatedColor;
                this.notifyListeners(key, interpolatedColor, fromColor);
            }
        }, 0); // Start at the same time as other interpolations
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Method to stop any active interpolation
    stopInterpolation() {
        if (this.interpolationTimeline) {
            this.interpolationTimeline.kill();
            this.interpolationTimeline = null;
        }
    }
    
    // Method to get interpolation debugging information
    getInterpolationDebugInfo() {
        if (!this.interpolationTimeline) {
            return {
                isActive: false,
                progress: 0,
                time: 0,
                duration: 0,
                easing: null
            };
        }
        
        return {
            isActive: true,
            progress: this.interpolationTimeline.progress(),
            time: this.interpolationTimeline.time(),
            duration: this.interpolationTimeline.duration(),
            easing: this.interpolationTimeline.vars.ease,
            totalTime: this.interpolationTimeline.totalDuration()
        };
    }
    
    // Method to log current state for debugging
    logCurrentState() {
        // Log some key parameters
        const keyParams = ['animationSpeed', 'movementAmplitude', 'rotationAmplitude', 'scaleAmplitude', 
                          'gridWidth', 'gridHeight', 'cellSize', 'shapeColor', 'backgroundColor'];
        keyParams.forEach(key => {
            if (this.state.hasOwnProperty(key)) {
                // Log key parameters for debugging
            }
        });
    }
    
    // Method to suggest better interpolation settings for large changes
    suggestInterpolationSettings(sceneData, currentState) {
        const suggestions = [];
        const settings = sceneData.settings;
        
        Object.keys(settings).forEach(key => {
            if (typeof settings[key] === 'number' && typeof currentState[key] === 'number') {
                const change = Math.abs(settings[key] - currentState[key]);
                const changePercent = (change / Math.abs(currentState[key])) * 100;
                
                if (changePercent > 200) {
                    suggestions.push({
                        parameter: key,
                        change: `${currentState[key]} -> ${settings[key]} (${changePercent.toFixed(1)}%)`,
                        suggestion: this.getSuggestionForParameter(key, changePercent)
                    });
                }
            }
        });
        
        if (suggestions.length > 0) {
            // Large changes detected. Consider these adjustments
            suggestions.forEach(s => {
                // Log suggestions for debugging
            });
        }
        
        return suggestions;
    }
    
    getSuggestionForParameter(key, changePercent) {
        switch (key) {
            case 'animationSpeed':
                return changePercent > 500 ? 
                    'Use "expo.inOut" easing with 3-4s duration' :
                    'Use "back.inOut" easing with 2-3s duration';
            
            case 'gridWidth':
            case 'gridHeight':
                return 'Use "power3.inOut" easing with 2.5s duration (grid recreation)';
            
            case 'movementAmplitude':
            case 'rotationAmplitude':
            case 'scaleAmplitude':
                return changePercent > 300 ? 
                    'Use "elastic.inOut" easing with 3s duration' :
                    'Use "power2.inOut" easing with 2s duration';
            
            default:
                return 'Use "power2.inOut" easing with 2s duration';
        }
    }
} 