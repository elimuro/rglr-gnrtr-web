import { gsap } from 'gsap';

export class StateManager {
    constructor() {
        this.state = this.getInitialState();
        this.listeners = new Map();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.interpolationTimeline = null; // Track active interpolation
    }

    getInitialState() {
        return {
            // Animation parameters
            animationType: 0,
            animationSpeed: 0.25,
            enableShapeCycling: false,
            enableSizeAnimation: false,
            movementAmplitude: 0.1,
            movementFrequency: 0.5,
            rotationAmplitude: 0.5,
            rotationFrequency: 0.3,
            scaleAmplitude: 0.2,
            scaleFrequency: 0.4,
            
            // Grid parameters
            gridWidth: 8,
            gridHeight: 8,
            cellSize: 1,
            compositionWidth: 30,
            compositionHeight: 30,
            showGrid: false,
            randomness: 1,
            
            // Color parameters
            shapeColor: '#ff9100',
            backgroundColor: '#000000',
            
            // Shape selection
            enabledShapes: {
                'Basic Shapes': true,
                'Triangles': true,
                'Rectangles': true,
                'Ellipses': true,
                'Refractive Spheres': true
            },
            
            // Sphere parameters
            sphereRefraction: 1.67,
            sphereTransparency: 0.93,
            sphereRoughness: 0.33,
            sphereMetalness: 0,
            sphereTransmission: 0.95,
            sphereScale: 1.3,
            sphereClearcoat: 0.66,
            sphereClearcoatRoughness: 0.05,
            sphereEnvMapIntensity: 0.28,
            sphereWaterDistortion: true,
            sphereDistortionStrength: 0.1, // Water distortion strength
            
            // Post-processing parameters
            postProcessingEnabled: true,
            bloomEnabled: true,
            bloomStrength: 0.25,
            bloomRadius: 0.25,
            bloomThreshold: 0.3,
            chromaticAberrationEnabled: false,
            chromaticIntensity: 0.5,
            vignetteEnabled: false,
            vignetteIntensity: 0.5,
            vignetteRadius: 0.8,
            vignetteSoftness: 0.3,
            grainEnabled: false,
            grainIntensity: 0.1,
            colorGradingEnabled: false,
            colorHue: 0,
            colorSaturation: 1,
            colorBrightness: 1,
            colorContrast: 1,
            fxaaEnabled: true,
            
            // MIDI parameters
            midiEnabled: false,
            midiChannel: 0,
            
            // Lighting parameters
            ambientLightIntensity: 0.4,
            directionalLightIntensity: 1,
            pointLight1Intensity: 1.5,
            pointLight2Intensity: 0.8,
            rimLightIntensity: 0.6,
            accentLightIntensity: 0.4,
            
            // Performance parameters
            enableFrustumCulling: true,
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
    }

    get(key) {
        return this.state[key];
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
                
                // Grid parameters
                gridWidth: this.state.gridWidth,
                gridHeight: this.state.gridHeight,
                cellSize: this.state.cellSize,
                compositionWidth: this.state.compositionWidth,
                compositionHeight: this.state.compositionHeight,
                showGrid: this.state.showGrid,
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
                enableFrustumCulling: this.state.enableFrustumCulling
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

    importSceneWithInterpolation(sceneData, duration = 2.0) {
        try {
            if (!sceneData || !sceneData.settings) {
                throw new Error('Invalid scene data format');
            }
            
            const settings = sceneData.settings;
            
            // Kill any existing interpolation
            if (this.interpolationTimeline) {
                this.interpolationTimeline.kill();
            }
            
            // Create a new timeline for the interpolation
            this.interpolationTimeline = gsap.timeline({
                onComplete: () => {
                    console.log(`Scene interpolation complete: ${sceneData.name || 'Unnamed Scene'}`);
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
            
            // Grid parameters
            addInterpolation('gridWidth', settings.gridWidth, currentState.gridWidth);
            addInterpolation('gridHeight', settings.gridHeight, currentState.gridHeight);
            addInterpolation('cellSize', settings.cellSize, currentState.cellSize);
            addInterpolation('compositionWidth', settings.compositionWidth, currentState.compositionWidth);
            addInterpolation('compositionHeight', settings.compositionHeight, currentState.compositionHeight);
            addInterpolation('showGrid', settings.showGrid, currentState.showGrid);
            addInterpolation('randomness', settings.randomness, currentState.randomness);
            
            // Color parameters (handle colors specially)
            if (settings.shapeColor && settings.shapeColor !== currentState.shapeColor) {
                this.interpolateColor('shapeColor', currentState.shapeColor, settings.shapeColor, duration);
            }
            if (settings.backgroundColor && settings.backgroundColor !== currentState.backgroundColor) {
                this.interpolateColor('backgroundColor', currentState.backgroundColor, settings.backgroundColor, duration);
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
            
            // Create the interpolation animation
            this.interpolationTimeline.to(this.state, {
                ...interpolationTargets,
                duration: duration,
                ease: "power2.inOut",
                onUpdate: () => {
                    // Notify listeners for each interpolated value
                    Object.keys(interpolationTargets).forEach(key => {
                        // Skip grid dimension notifications during interpolation
                        if (key !== 'gridWidth' && key !== 'gridHeight' && 
                            key !== 'compositionWidth' && key !== 'compositionHeight') {
                            this.notifyListeners(key, this.state[key], currentState[key]);
                        }
                    });
                }
            });
            
            console.log(`Scene interpolation started: ${sceneData.name || 'Unnamed Scene'}`);
            return true;
        } catch (error) {
            console.error('Error loading scene with interpolation:', error);
            return false;
        }
    }

    interpolateColor(key, fromColor, toColor, duration) {
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
            ease: "power2.inOut",
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
} 