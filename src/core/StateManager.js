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
            shapeColor: '#00ffff',
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
            sphereRefraction: 1.33, // Water-like refraction index
            sphereTransparency: 0.9,
            sphereRoughness: 0.1, // Much smoother for water
            sphereMetalness: 0.0,
            sphereTransmission: 0.95, // Higher transmission for water
            sphereScale: 1.5,
            sphereClearcoat: 0.8, // Higher clearcoat for water shine
            sphereClearcoatRoughness: 0.05, // Very smooth clearcoat
            sphereEnvMapIntensity: 1.5, // Higher environment map intensity
            sphereWaterDistortion: true, // Enable water distortion
            sphereDistortionStrength: 0.1, // Water distortion strength
            
            // Post-processing parameters
            postProcessingEnabled: true,
            bloomEnabled: true,
            bloomStrength: 0.5,
            bloomRadius: 0.4,
            bloomThreshold: 0.85,
            chromaticAberrationEnabled: false,
            chromaticIntensity: 0.5,
            vignetteEnabled: false,
            vignetteIntensity: 0.5,
            vignetteRadius: 0.8,
            vignetteSoftness: 0.3,
            grainEnabled: false,
            grainIntensity: 0.1,
            colorGradingEnabled: false,
            colorHue: 0.0,
            colorSaturation: 1.0,
            colorBrightness: 1.0,
            colorContrast: 1.0,
            fxaaEnabled: true,
            
            // MIDI parameters
            midiEnabled: false,
            midiChannel: 0,
            
            // Lighting parameters
            ambientLightIntensity: 0.4,
            directionalLightIntensity: 1.0,
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
} 