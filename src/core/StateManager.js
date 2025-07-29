export class StateManager {
    constructor() {
        this.state = this.getInitialState();
        this.listeners = new Map();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
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
            
            const settings = sceneData.settings;
            
            // Apply all visual settings
            this.batchUpdate({
                // Animation parameters
                animationType: settings.animationType ?? this.state.animationType,
                animationSpeed: settings.animationSpeed ?? this.state.animationSpeed,
                enableShapeCycling: settings.enableShapeCycling ?? this.state.enableShapeCycling,
                enableSizeAnimation: settings.enableSizeAnimation ?? this.state.enableSizeAnimation,
                movementAmplitude: settings.movementAmplitude ?? this.state.movementAmplitude,
                movementFrequency: settings.movementFrequency ?? this.state.movementFrequency,
                rotationAmplitude: settings.rotationAmplitude ?? this.state.rotationAmplitude,
                rotationFrequency: settings.rotationFrequency ?? this.state.rotationFrequency,
                scaleAmplitude: settings.scaleAmplitude ?? this.state.scaleAmplitude,
                scaleFrequency: settings.scaleFrequency ?? this.state.scaleFrequency,
                
                // Grid parameters
                gridWidth: settings.gridWidth ?? this.state.gridWidth,
                gridHeight: settings.gridHeight ?? this.state.gridHeight,
                cellSize: settings.cellSize ?? this.state.cellSize,
                compositionWidth: settings.compositionWidth ?? this.state.compositionWidth,
                compositionHeight: settings.compositionHeight ?? this.state.compositionHeight,
                showGrid: settings.showGrid ?? this.state.showGrid,
                randomness: settings.randomness ?? this.state.randomness,
                
                // Color parameters
                shapeColor: settings.shapeColor ?? this.state.shapeColor,
                backgroundColor: settings.backgroundColor ?? this.state.backgroundColor,
                
                // Shape selection
                enabledShapes: settings.enabledShapes ?? this.state.enabledShapes,
                
                // Sphere parameters
                sphereRefraction: settings.sphereRefraction ?? this.state.sphereRefraction,
                sphereTransparency: settings.sphereTransparency ?? this.state.sphereTransparency,
                sphereRoughness: settings.sphereRoughness ?? this.state.sphereRoughness,
                sphereMetalness: settings.sphereMetalness ?? this.state.sphereMetalness,
                sphereTransmission: settings.sphereTransmission ?? this.state.sphereTransmission,
                sphereScale: settings.sphereScale ?? this.state.sphereScale,
                sphereClearcoat: settings.sphereClearcoat ?? this.state.sphereClearcoat,
                sphereClearcoatRoughness: settings.sphereClearcoatRoughness ?? this.state.sphereClearcoatRoughness,
                sphereEnvMapIntensity: settings.sphereEnvMapIntensity ?? this.state.sphereEnvMapIntensity,
                sphereWaterDistortion: settings.sphereWaterDistortion ?? this.state.sphereWaterDistortion,
                
                // Post-processing parameters
                postProcessingEnabled: settings.postProcessingEnabled ?? this.state.postProcessingEnabled,
                bloomEnabled: settings.bloomEnabled ?? this.state.bloomEnabled,
                bloomStrength: settings.bloomStrength ?? this.state.bloomStrength,
                bloomRadius: settings.bloomRadius ?? this.state.bloomRadius,
                bloomThreshold: settings.bloomThreshold ?? this.state.bloomThreshold,
                chromaticAberrationEnabled: settings.chromaticAberrationEnabled ?? this.state.chromaticAberrationEnabled,
                chromaticIntensity: settings.chromaticIntensity ?? this.state.chromaticIntensity,
                vignetteEnabled: settings.vignetteEnabled ?? this.state.vignetteEnabled,
                vignetteIntensity: settings.vignetteIntensity ?? this.state.vignetteIntensity,
                vignetteRadius: settings.vignetteRadius ?? this.state.vignetteRadius,
                vignetteSoftness: settings.vignetteSoftness ?? this.state.vignetteSoftness,
                grainEnabled: settings.grainEnabled ?? this.state.grainEnabled,
                grainIntensity: settings.grainIntensity ?? this.state.grainIntensity,
                colorGradingEnabled: settings.colorGradingEnabled ?? this.state.colorGradingEnabled,
                colorHue: settings.colorHue ?? this.state.colorHue,
                colorSaturation: settings.colorSaturation ?? this.state.colorSaturation,
                colorBrightness: settings.colorBrightness ?? this.state.colorBrightness,
                colorContrast: settings.colorContrast ?? this.state.colorContrast,
                fxaaEnabled: settings.fxaaEnabled ?? this.state.fxaaEnabled,
                
                // Lighting parameters
                ambientLightIntensity: settings.ambientLightIntensity ?? this.state.ambientLightIntensity,
                directionalLightIntensity: settings.directionalLightIntensity ?? this.state.directionalLightIntensity,
                pointLight1Intensity: settings.pointLight1Intensity ?? this.state.pointLight1Intensity,
                pointLight2Intensity: settings.pointLight2Intensity ?? this.state.pointLight2Intensity,
                rimLightIntensity: settings.rimLightIntensity ?? this.state.rimLightIntensity,
                accentLightIntensity: settings.accentLightIntensity ?? this.state.accentLightIntensity,
                
                // Performance parameters
                enableFrustumCulling: settings.enableFrustumCulling ?? this.state.enableFrustumCulling
            });
            
            console.log(`Scene loaded: ${sceneData.name || 'Unnamed Scene'}`);
            return true;
        } catch (error) {
            console.error('Error loading scene:', error);
            return false;
        }
    }
} 