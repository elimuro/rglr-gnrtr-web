/**
 * audio-mapping.js - Audio Frequency to Parameter Mapping
 * This module manages audio frequency analysis and mapping to visual parameters.
 * It handles frequency band analysis, parameter mapping, and dynamic control creation
 * for audio-reactive visual effects.
 */

// Audio Mapping Configuration
const AUDIO_MAPPING_CONFIGS = {
    frequency: {
        label: 'Frequency Mapping',
        defaultValue: 'overall',
        inputType: 'Frequency',
        inputPlaceholder: 'Frequency Band',
        targets: [
            { value: 'animationSpeed', label: 'Animation Speed' },
            { value: 'movementAmplitude', label: 'Movement Amplitude' },
            { value: 'rotationAmplitude', label: 'Rotation Amplitude' },
            { value: 'scaleAmplitude', label: 'Scale Amplitude' },
            { value: 'randomness', label: 'Randomness' },
            { value: 'cellSize', label: 'Cell Size' },
            { value: 'movementFrequency', label: 'Movement Frequency' },
            { value: 'rotationFrequency', label: 'Rotation Frequency' },
            { value: 'scaleFrequency', label: 'Scale Frequency' },
            { value: 'gridWidth', label: 'Grid Width' },
            { value: 'gridHeight', label: 'Grid Height' },
            { value: 'compositionWidth', label: 'Composition Width' },
            { value: 'compositionHeight', label: 'Composition Height' },
            { value: 'animationType', label: 'Animation Type' },
            { value: 'sphereRefraction', label: 'Sphere Refraction' },
            { value: 'sphereTransparency', label: 'Sphere Transparency' },
            { value: 'sphereTransmission', label: 'Sphere Transmission' },
            { value: 'sphereRoughness', label: 'Sphere Roughness' },
            { value: 'sphereMetalness', label: 'Sphere Metalness' },
            { value: 'sphereScale', label: 'Sphere Scale' },
            { value: 'sphereClearcoat', label: 'Sphere Clearcoat' },
            { value: 'sphereClearcoatRoughness', label: 'Sphere Clearcoat Roughness' },
            { value: 'sphereEnvMapIntensity', label: 'Sphere Environment Map Intensity' },
            { value: 'bloomStrength', label: 'Bloom Strength' },
            { value: 'bloomRadius', label: 'Bloom Radius' },
            { value: 'bloomThreshold', label: 'Bloom Threshold' },
            { value: 'chromaticIntensity', label: 'Chromatic Aberration' },
            { value: 'vignetteIntensity', label: 'Vignette Intensity' },
            { value: 'vignetteRadius', label: 'Vignette Radius' },
            { value: 'vignetteSoftness', label: 'Vignette Softness' },
            { value: 'grainIntensity', label: 'Film Grain' },
            { value: 'colorHue', label: 'Color Hue' },
            { value: 'colorSaturation', label: 'Color Saturation' },
            { value: 'colorBrightness', label: 'Color Brightness' },
            { value: 'colorContrast', label: 'Color Contrast' },
            { value: 'ambientLightIntensity', label: 'Ambient Light' },
            { value: 'directionalLightIntensity', label: 'Directional Light' },
            { value: 'pointLight1Intensity', label: 'Point Light 1' },
            { value: 'pointLight2Intensity', label: 'Point Light 2' },
            { value: 'rimLightIntensity', label: 'Rim Light' },
            { value: 'accentLightIntensity', label: 'Accent Light' },
            { value: 'centerScalingEnabled', label: 'Center Scaling' },
            { value: 'centerScalingIntensity', label: 'Center Scaling Intensity' },
            { value: 'centerScalingCurve', label: 'Center Scaling Curve' },
            { value: 'centerScalingRadius', label: 'Center Scaling Radius' },
            { value: 'centerScalingDirection', label: 'Center Scaling Direction' },
            { value: 'centerScalingAnimation', label: 'Center Scaling Animation' },
            { value: 'centerScalingAnimationSpeed', label: 'Center Scaling Animation Speed' },
            { value: 'centerScalingAnimationType', label: 'Center Scaling Animation Type' }
        ],
        frequencyBands: [
            { value: 'overall', label: 'Overall' },
            { value: 'bass', label: 'Bass (20-250Hz)' },
            { value: 'lowMid', label: 'Low Mid (250-500Hz)' },
            { value: 'mid', label: 'Mid (500-2000Hz)' },
            { value: 'highMid', label: 'High Mid (2-4kHz)' },
            { value: 'treble', label: 'Treble (4-20kHz)' },
            { value: 'rms', label: 'RMS' },
            { value: 'peak', label: 'Peak' },
            { value: 'frequency', label: 'Dominant Frequency' }
        ]
    }
};

// HTML Templates for Audio Mapping Controls
const AUDIO_MAPPING_TEMPLATES = {
    frequency: `
        <div class="flex items-center gap-2 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <label class="text-xs font-medium text-gray-300 min-w-16 flex-shrink-0">{label} {index}:</label>
            
            <div class="flex items-center gap-1 flex-1">
                <select class="frequency-band-select px-1 py-0.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green focus:border-midi-green focus:outline-none min-w-20">
                    {frequencyBandOptions}
                </select>
                
                <span class="text-xs text-gray-400 mx-1">→</span>
                
                <select class="target-select px-1 py-0.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green focus:border-midi-green focus:outline-none flex-1">
                    {targetOptions}
                </select>
            </div>
            
            <div class="flex items-center gap-1">
                <button class="learn-button px-1 py-0.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green">Learn</button>
                <button class="remove-button px-1 py-0.5 bg-red-600 bg-opacity-30 text-red-400 border border-red-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-red-400">×</button>
            </div>
        </div>
    `
};

export class AudioMappingControl {
    constructor(type, index, container, app) {
        this.type = type;
        this.index = index;
        this.container = container;
        this.app = app;
        this.controlId = this.generateControlId();
        this.element = null;
        this.isLearning = false;
        this.mapping = {
            frequencyBand: 'overall',
            target: 'animationSpeed',
            minValue: 0,
            maxValue: 1,
            curve: 'linear'
        };
        
        this.render();
        
        // Set up continuous audio mapping
        this.setupContinuousAudioMapping();
    }
    
    generateControlId() {
        return `audio-mapping-${this.type}-${this.index}`;
    }
    
    render() {
        const config = AUDIO_MAPPING_CONFIGS[this.type];
        const template = AUDIO_MAPPING_TEMPLATES[this.type];
        
        if (!config || !template) {
            console.error(`No config or template found for audio mapping type: ${this.type}`);
            return;
        }
        
        const html = this.interpolateTemplate(template, config);
        this.element = this.createElement(html);
        this.container.appendChild(this.element);
        this.setupListeners();
    }
    
    interpolateTemplate(template, config) {
        return template
            .replace('{controlId}', this.controlId)
            .replace('{label}', config.label)
            .replace('{index}', this.index)
            .replace('{frequencyBandOptions}', this.generateFrequencyBandOptions(config.frequencyBands))
            .replace('{targetOptions}', this.generateTargetOptions(config.targets));
    }
    
    generateFrequencyBandOptions(bands) {
        return bands.map(band => 
            `<option value="${band.value}">${band.label}</option>`
        ).join('');
    }
    
    generateTargetOptions(targets) {
        return targets.map(target => 
            `<option value="${target.value}">${target.label}</option>`
        ).join('');
    }
    
    createElement(html) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }
    
    setupListeners() {
        if (!this.element) return;
        
        // Frequency band selection
        const frequencySelect = this.element.querySelector('.frequency-band-select');
        if (frequencySelect) {
            frequencySelect.value = this.mapping.frequencyBand;
            frequencySelect.addEventListener('change', (e) => {
                this.mapping.frequencyBand = e.target.value;
                this.updateMapping();
            });
        }
        
        // Target selection
        const targetSelect = this.element.querySelector('.target-select');
        if (targetSelect) {
            targetSelect.value = this.mapping.target;
            targetSelect.addEventListener('change', (e) => {
                this.mapping.target = e.target.value;
                this.updateMapping();
            });
        }
        
        // Learn button
        const learnButton = this.element.querySelector('.learn-button');
        if (learnButton) {
            learnButton.addEventListener('click', () => {
                this.startLearning(learnButton);
            });
        }
        
        // Remove button
        const removeButton = this.element.querySelector('.remove-button');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                this.destroy();
            });
        }
    }
    
    startLearning(learnButton) {
        if (this.isLearning) {
            this.stopLearning(learnButton);
            return;
        }
        
        this.isLearning = true;
        learnButton.textContent = 'Stop';
        learnButton.classList.add('bg-midi-green', 'text-black');
        
        // Start listening for audio analysis
        this.setupAudioLearning();
    }
    
    stopLearning(learnButton) {
        this.isLearning = false;
        learnButton.textContent = 'Learn';
        learnButton.classList.remove('bg-midi-green', 'text-black');
        
        // Stop listening for audio analysis
        this.cleanupAudioLearning();
    }
    
    setupAudioLearning() {
        // Subscribe to audio analysis updates for learning/testing
        this.audioSubscription = (frequencyBand, value) => {
            if (this.isLearning && frequencyBand === this.mapping.frequencyBand) {
                this.updateParameter(value);
                
                // Update the UI to show the current audio value
                const learnButton = this.element.querySelector('.learn-button');
                if (learnButton) {
                    learnButton.textContent = `Stop (${value.toFixed(2)})`;
                }
            }
        };
        
        // Register this control for audio updates
        if (this.app && this.app.audioMappingManager) {
            this.app.audioMappingManager.registerAudioListener(this.controlId, this.audioSubscription);
        }
        
        console.log('Audio learning started for control:', this.controlId, 'frequency band:', this.mapping.frequencyBand);
    }
    
    setupContinuousAudioMapping() {
        // Set up continuous audio mapping (always active)
        this.continuousAudioSubscription = (frequencyBand, value) => {
            if (frequencyBand === this.mapping.frequencyBand) {
                this.updateParameter(value);
            }
        };
        
        // Register for continuous audio updates
        if (this.app && this.app.audioMappingManager) {
            this.app.audioMappingManager.registerAudioListener(this.controlId, this.continuousAudioSubscription);
        }
        
        console.log('Continuous audio mapping enabled for control:', this.controlId, 'frequency band:', this.mapping.frequencyBand);
    }
    
    cleanupAudioLearning() {
        // Unregister from audio updates
        if (this.app && this.app.audioMappingManager) {
            this.app.audioMappingManager.unregisterAudioListener(this.controlId);
        }
        
        this.audioSubscription = null;
        console.log('Audio learning stopped for control:', this.controlId);
    }
    
    cleanupContinuousAudioMapping() {
        // Unregister from continuous audio updates
        if (this.app && this.app.audioMappingManager) {
            this.app.audioMappingManager.unregisterAudioListener(this.controlId);
        }
        
        this.continuousAudioSubscription = null;
        console.log('Continuous audio mapping disabled for control:', this.controlId);
    }
    
    updateParameter(audioValue) {
        if (!this.app || !this.app.state) return;
        
        const normalizedValue = this.normalizeValue(audioValue, this.mapping.target);
        console.log(`Audio mapping: ${this.mapping.frequencyBand} (${audioValue.toFixed(3)}) -> ${this.mapping.target} (${normalizedValue.toFixed(3)})`);
        this.app.updateAnimationParameter(this.mapping.target, normalizedValue);
    }
    
    normalizeValue(audioValue, target) {
        // Apply the mapping curve
        let normalizedValue = audioValue;
        switch (this.mapping.curve) {
            case 'exponential':
                normalizedValue = Math.pow(audioValue, 2);
                break;
            case 'logarithmic':
                normalizedValue = Math.log(audioValue + 1) / Math.log(2);
                break;
            case 'sine':
                normalizedValue = Math.sin(audioValue * Math.PI);
                break;
            default: // linear
                normalizedValue = audioValue;
        }
        
        // Apply min/max range from the mapping
        normalizedValue = this.mapping.minValue + (normalizedValue * (this.mapping.maxValue - this.mapping.minValue));
        
        // Ensure the value is between 0 and 1 for the updateAnimationParameter method
        normalizedValue = Math.max(0, Math.min(1, normalizedValue));
        
        return normalizedValue;
    }
    
    getParameterConfig(target) {
        // This will be expanded to include all parameter configurations
        const configs = {
            animationSpeed: { min: 0.01, max: 2, step: 0.01 },
            movementAmplitude: { min: 0.01, max: 0.5, step: 0.01 },
            rotationAmplitude: { min: 0.01, max: 2, step: 0.01 },
            scaleAmplitude: { min: 0.01, max: 1, step: 0.01 },
            randomness: { min: 0, max: 1, step: 0.01 },
            cellSize: { min: 0.5, max: 2, step: 0.01 },
            // Add more parameter configurations as needed
        };
        
        return configs[target];
    }
    
    updateMapping() {
        // Save the mapping to the app's state
        if (this.app && this.app.state) {
            const audioMappings = this.app.state.get('audioMappings') || {};
            audioMappings[this.controlId] = this.mapping;
            this.app.state.set('audioMappings', audioMappings);
        }
    }
    
    getMapping() {
        return this.mapping;
    }
    
    setMapping(mapping) {
        this.mapping = { ...this.mapping, ...mapping };
        this.updateMapping();
        
        // Update UI elements
        if (this.element) {
            const frequencySelect = this.element.querySelector('.frequency-band-select');
            const targetSelect = this.element.querySelector('.target-select');
            
            if (frequencySelect) frequencySelect.value = this.mapping.frequencyBand;
            if (targetSelect) targetSelect.value = this.mapping.target;
        }
    }
    
    serialize() {
        return {
            type: this.type,
            index: this.index,
            controlId: this.controlId,
            mapping: this.mapping
        };
    }
    
    deserialize(data) {
        this.type = data.type;
        this.index = data.index;
        this.controlId = data.controlId;
        this.mapping = data.mapping;
        
        // Re-render with new data
        if (this.element) {
            this.element.remove();
        }
        this.render();
        
        // Set up continuous audio mapping for loaded controls
        this.setupContinuousAudioMapping();
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        // Clean up audio subscriptions
        this.cleanupAudioLearning();
        this.cleanupContinuousAudioMapping();
        
        // Remove from app's state
        if (this.app && this.app.state) {
            const audioMappings = this.app.state.get('audioMappings') || {};
            delete audioMappings[this.controlId];
            this.app.state.set('audioMappings', audioMappings);
        }
    }
}

export class AudioMappingManager {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.controls = new Map();
        this.nextIndex = 1;
        this.audioListeners = new Map();
        
        // Subscribe to audio analysis updates
        this.setupAudioAnalysisSubscription();
    }
    
    addControl(type = 'frequency') {
        const control = new AudioMappingControl(type, this.nextIndex, this.container, this.app);
        this.controls.set(control.controlId, control);
        this.nextIndex++;
        return control;
    }
    
    removeControl(controlId) {
        const control = this.controls.get(controlId);
        if (control) {
            control.destroy();
            this.controls.delete(controlId);
        }
    }
    
    getControl(controlId) {
        return this.controls.get(controlId);
    }
    
    getAllControls() {
        return Array.from(this.controls.values());
    }
    
    clearAllControls() {
        this.controls.forEach(control => control.destroy());
        this.controls.clear();
        this.nextIndex = 1;
    }
    
    generateControlId(type, index) {
        return `audio-mapping-${type}-${index}`;
    }
    
    getNextControlIndex(type) {
        let maxIndex = 0;
        this.controls.forEach(control => {
            if (control.type === type && control.index > maxIndex) {
                maxIndex = control.index;
            }
        });
        return maxIndex + 1;
    }
    
    serialize() {
        return Array.from(this.controls.values()).map(control => control.serialize());
    }
    
    deserialize(controlsData) {
        this.clearAllControls();
        
        controlsData.forEach(data => {
            const control = new AudioMappingControl(data.type, data.index, this.container, this.app);
            control.deserialize(data);
            this.controls.set(control.controlId, control);
            
            if (control.index >= this.nextIndex) {
                this.nextIndex = control.index + 1;
            }
        });
    }
    
    setupAudioAnalysisSubscription() {
        // Subscribe to audio analysis state changes
        if (this.app && this.app.state) {
            this.app.state.subscribe('audioOverall', () => this.broadcastAudioUpdate('overall'));
            this.app.state.subscribe('audioBass', () => this.broadcastAudioUpdate('bass'));
            this.app.state.subscribe('audioLowMid', () => this.broadcastAudioUpdate('lowMid'));
            this.app.state.subscribe('audioMid', () => this.broadcastAudioUpdate('mid'));
            this.app.state.subscribe('audioHighMid', () => this.broadcastAudioUpdate('highMid'));
            this.app.state.subscribe('audioTreble', () => this.broadcastAudioUpdate('treble'));
            this.app.state.subscribe('audioRMS', () => this.broadcastAudioUpdate('rms'));
            this.app.state.subscribe('audioPeak', () => this.broadcastAudioUpdate('peak'));
            this.app.state.subscribe('audioFrequency', () => this.broadcastAudioUpdate('frequency'));
        }
    }
    
    registerAudioListener(controlId, callback) {
        if (!this.audioListeners.has(controlId)) {
            this.audioListeners.set(controlId, []);
        }
        this.audioListeners.get(controlId).push(callback);
        console.log('Registered audio listener for control:', controlId);
    }
    
    unregisterAudioListener(controlId) {
        if (this.audioListeners.has(controlId)) {
            this.audioListeners.delete(controlId);
        }
        console.log('Unregistered audio listener for control:', controlId);
    }
    
    broadcastAudioUpdate(frequencyBand) {
        const value = this.app.state.get(`audio${frequencyBand.charAt(0).toUpperCase() + frequencyBand.slice(1)}`) || 0;
        
        // Broadcast to all registered listeners
        this.audioListeners.forEach((callbacks, controlId) => {
            callbacks.forEach(callback => {
                try {
                    callback(frequencyBand, value);
                } catch (error) {
                    console.error('Error in audio listener callback:', error);
                }
            });
        });
    }
} 