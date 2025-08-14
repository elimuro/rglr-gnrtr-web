/**
 * audio-mapping.js - Audio Frequency to Parameter Mapping
 * This module manages audio frequency analysis and mapping to visual parameters.
 * It handles frequency band analysis, parameter mapping, and dynamic control creation
 * for audio-reactive visual effects.
 * 
 * NEW FEATURE: Sensitivity Control
 * Each audio mapping now includes a sensitivity slider that controls the intensity
 * of the audio effect on the target parameter:
 * - 0.0 = No effect (audio input is ignored)
 * - 1.0 = Normal effect (default)
 * - 2.0 = Double effect (audio input is amplified)
 * 
 * The sensitivity is applied after the curve transformation but before the min/max
 * range mapping, allowing for fine-tuned control over audio reactivity.
 */

import { ParameterMapper } from './modules/ParameterMapper.js';

// Audio Mapping Configuration
const AUDIO_MAPPING_CONFIGS = {
    frequency: {
        label: 'Frequency Mapping',
        defaultValue: 'overall',
        inputType: 'Frequency',
        inputPlaceholder: 'Frequency Band',
        targets: [
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
            { value: 'centerScalingIntensity', label: 'Center Scaling Intensity' },
            { value: 'centerScalingCurve', label: 'Center Scaling Curve' },
            { value: 'centerScalingRadius', label: 'Center Scaling Radius' },
            { value: 'centerScalingDirection', label: 'Center Scaling Direction' },
            { value: 'centerScalingAnimationSpeed', label: 'Center Scaling Animation Speed' },
            { value: 'centerScalingAnimationType', label: 'Center Scaling Animation Type' },
            { value: 'shapeCyclingSpeed', label: 'Shape Cycling Speed' },
            { value: 'shapeCyclingPattern', label: 'Shape Cycling Pattern' },
            { value: 'shapeCyclingDirection', label: 'Shape Cycling Direction' },
            { value: 'shapeCyclingSync', label: 'Shape Cycling Sync' },
            { value: 'shapeCyclingIntensity', label: 'Shape Cycling Intensity' }
        ],
        frequencyBands: [
            { value: 'overall', label: 'Overall' },
            { value: 'rms', label: 'RMS' },
            { value: 'peak', label: 'Peak' },
            { value: 'frequency', label: 'Dominant Frequency' }
        ]
    }
};

// HTML Templates for Audio Mapping Controls
const AUDIO_MAPPING_TEMPLATES = {
    frequency: `
        <div class="audio-mapping-control flex items-center gap-2 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <label class="text-xs font-medium text-gray-300 min-w-8 flex-shrink-0">{index}:</label>
            
            <div class="flex items-center gap-1 flex-1">
                <div class="frequency-slider-container flex-1 min-w-0" data-drawer-interactive></div>
                
                <span class="text-xs text-gray-400 mx-1">→</span>
                
                <select class="target-select px-1 py-0.5 bg-black bg-opacity-30 text-white border border-gray-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-midi-green focus:border-midi-green focus:outline-none flex-1" data-drawer-interactive>
                    {targetOptions}
                </select>
                
                <span class="text-xs text-gray-400 mx-1">×</span>
                
                <input type="range" class="sensitivity-slider w-20 h-6 appearance-none cursor-pointer slider-thumb" 
                       min="0" max="2" step="0.1" value="1" 
                       title="Sensitivity: 0 = no effect, 1 = normal, 2 = double effect"
                       data-drawer-interactive>
                <span class="sensitivity-value text-xs min-w-8 text-center">1.0</span>
            </div>
            
            <div class="flex items-center gap-1">
                <button class="remove-button px-1 py-0.5 bg-red-600 bg-opacity-30 text-red-400 border border-red-600 rounded text-xs transition-all duration-300 hover:bg-opacity-50 hover:border-red-400" data-drawer-interactive>×</button>
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
        this.frequencySlider = null;
        this.isLearning = false;
        this.mapping = {
            minFrequency: 250,
            maxFrequency: 2000,
            target: 'cellSize', // Set cellSize as default for better user visibility
            minValue: 0,
            maxValue: 1,
            curve: 'linear',
            sensitivity: 1.0
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
            return;
        }
        
        const html = this.interpolateTemplate(template, config);
        this.element = this.createElement(html);
        this.container.appendChild(this.element);
        
        // Create frequency range slider
        this.createFrequencySlider();
        
        this.setupListeners();
    }
    
    interpolateTemplate(template, config) {
        return template
            .replace('{controlId}', this.controlId)
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
        return `<option value="">Select a target</option>` + 
            targets.map(target => 
                `<option value="${target.value}">${target.label}</option>`
            ).join('');
    }
    
    createElement(html) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }
    
    createFrequencySlider() {
        const sliderContainer = this.element.querySelector('.frequency-slider-container');
        if (!sliderContainer) return;
        
        // Import and create the frequency range slider
        import('./ui/FrequencyRangeSlider.js').then(({ FrequencyRangeSlider }) => {
            // Get the container width to make slider responsive
            const containerWidth = sliderContainer.offsetWidth || 300;
            
            this.frequencySlider = new FrequencyRangeSlider(sliderContainer, {
                width: containerWidth,
                height: 24,
                defaultMin: this.mapping.minFrequency,
                defaultMax: this.mapping.maxFrequency
            });
            
            // Listen for frequency range changes
            this.frequencySlider.element.addEventListener('frequencyRangeChange', (e) => {
                this.mapping.minFrequency = e.detail.minFrequency;
                this.mapping.maxFrequency = e.detail.maxFrequency;
                this.updateMapping();
            });
            
            // Update audio data for visualization
            this.updateSliderAudioData();
        });
    }
    
    updateSliderAudioData() {
        if (!this.frequencySlider || !this.app) return;
        
        // Get current audio data from the app
        const audioData = {
            overall: this.app.state.get('audioOverall') || 0,
            rms: this.app.state.get('audioRMS') || 0,
            peak: this.app.state.get('audioPeak') || 0,
            frequency: this.app.state.get('audioFrequency') || 0
        };
        

        
        this.frequencySlider.setAudioData(audioData);
    }
    
    setupListeners() {
        if (!this.element) return;
        
        // Target selection
        const targetSelect = this.element.querySelector('.target-select');
        if (targetSelect) {
            targetSelect.value = this.mapping.target || ''; // Handle empty target
            targetSelect.addEventListener('change', (e) => {
                const selectedTarget = e.target.value;
                
                // Only update if a valid target is selected (not empty)
                if (selectedTarget && selectedTarget.trim() !== '') {
                    this.mapping.target = selectedTarget;
                    
                    // Update min/max values based on the selected target
                    const config = this.getParameterConfig(this.mapping.target);
                    if (config) {
                        this.mapping.minValue = config.min;
                        this.mapping.maxValue = config.max;
                    }
                    
                    this.updateMapping();
                } else {
                    // If empty target selected, revert to current value
                    targetSelect.value = this.mapping.target || '';
                }
            });
        }
        
        // Sensitivity slider
        const sensitivitySlider = this.element.querySelector('.sensitivity-slider');
        if (sensitivitySlider) {
            sensitivitySlider.value = this.mapping.sensitivity;
            sensitivitySlider.addEventListener('input', (e) => {
                this.mapping.sensitivity = parseFloat(e.target.value);
                this.updateSensitivityDisplay();
                this.updateMapping();
            });
            this.updateSensitivityDisplay();
        }
        

        
        // Remove button
        const removeButton = this.element.querySelector('.remove-button');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                this.destroy();
            });
        }
    }
    

    
    setupContinuousAudioMapping() {
        // Set up continuous audio mapping (always active)
        this.continuousAudioSubscription = () => {
            // Update slider audio data
            this.updateSliderAudioData();
            // Calculate average amplitude across the selected frequency range
            const averageAmplitude = this.calculateFrequencyRangeAverage();
            if (averageAmplitude !== null) {
                this.updateParameter(averageAmplitude);

            }
        };
        // Register for continuous audio updates
        if (this.app && this.app.audioMappingManager) {
            this.app.audioMappingManager.registerAudioListener(this.controlId, this.continuousAudioSubscription);
        }
        
        // Also set up a periodic update for the slider visualization
        this.audioUpdateInterval = setInterval(() => {
            this.updateSliderAudioData();
        }, 100); // Update every 100ms for smooth visualization
        
        // console.log('Continuous audio mapping enabled for control:', this.controlId, 'frequency range:', this.mapping.minFrequency, '-', this.mapping.maxFrequency);
    }

    calculateFrequencyRangeAverage() {
        if (!this.app || !this.app.audioManager) return null;
        
        // Check if audio manager is listening
        if (!this.app.audioManager.isListening) {
            return null;
        }
        
        const { frequencyData, sampleRate, fftSize } = this.app.audioManager.getRawFrequencyData();
        if (!frequencyData || !sampleRate) {
            return null;
        }
        
        // Calculate the frequency bins that correspond to our selected range
        // FFT bins represent frequencies from 0 to sampleRate/2 (Nyquist frequency)
        const nyquist = sampleRate / 2;
        const frequencyResolution = nyquist / frequencyData.length;
        
        const startBin = Math.floor(this.mapping.minFrequency / frequencyResolution);
        const endBin = Math.floor(this.mapping.maxFrequency / frequencyResolution);
        
        // Ensure bins are within valid range
        const validStartBin = Math.max(0, Math.min(startBin, frequencyData.length - 1));
        const validEndBin = Math.max(validStartBin, Math.min(endBin, frequencyData.length - 1));
        
        // Debug: Log the frequency bin calculation (only when significant activity)
        // console.log(`Freq: ${this.mapping.minFrequency}Hz-${this.mapping.maxFrequency}Hz -> Bins: ${validStartBin}-${validEndBin} (resolution: ${frequencyResolution.toFixed(1)}Hz)`);
        
        // Calculate average amplitude across the frequency range
        let sum = 0;
        let count = 0;
        for (let i = validStartBin; i <= validEndBin; i++) {
            sum += frequencyData[i];
            count++;
        }
        
        // Return normalized average (0-1)
        const average = count > 0 ? sum / count / 255 : 0;
        
        // Apply smoothing to avoid jittery values
        if (!this.lastAverage) {
            this.lastAverage = average;
        } else {
            this.lastAverage = this.lastAverage * 0.8 + average * 0.2;
        }
        
        // Only log when there's significant activity in the selected range
        // if (this.lastAverage > 0.1) {
        //     console.log(`🎵 ${this.mapping.minFrequency}Hz-${this.mapping.maxFrequency}Hz: ${(this.lastAverage * 100).toFixed(1)}%`);
        // }
        
        return this.lastAverage;
    }
    
    getFrequencyFromBand(frequencyBand) {
        // DISABLED: Old frequency band system - now using new frequency range system
        // This method is kept for compatibility but does nothing
        // console.log('getFrequencyFromBand disabled - using new frequency range system');
        return 1000; // Default fallback
    }
    

    
    cleanupContinuousAudioMapping() {
        // Unregister from continuous audio updates
        if (this.app && this.app.audioMappingManager) {
            this.app.audioMappingManager.unregisterAudioListener(this.controlId);
        }
        
        // Clear the periodic update interval
        if (this.audioUpdateInterval) {
            clearInterval(this.audioUpdateInterval);
            this.audioUpdateInterval = null;
        }
        
        this.continuousAudioSubscription = null;
        // console.log('Continuous audio mapping disabled for control:', this.controlId);
    }
    
    updateParameter(audioValue) {
        if (!this.app || !this.app.state) return;
        
        // Check if target is valid before proceeding
        if (!this.mapping.target || this.mapping.target.trim() === '') {
            return;
        }
        
        const normalizedValue = this.normalizeValue(audioValue, this.mapping.target);
        
        // Debug logging for center scaling parameters
        if (this.mapping.target && this.mapping.target.startsWith('centerScaling')) {
            console.log(`🎵 Audio mapping ${this.mapping.target}:`, {
                rawAudioValue: audioValue,
                normalizedValue: normalizedValue,
                minValue: this.mapping.minValue,
                maxValue: this.mapping.maxValue,
                sensitivity: this.mapping.sensitivity
            });
        }
        
        this.app.updateAnimationParameter(this.mapping.target, normalizedValue);
        
        // Ensure changes are visible even when animation is paused
        if (this.app.scene && !this.app.animationLoop.getRunningState()) {
            this.app.scene.render();
        }
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
        
        // Apply sensitivity
        normalizedValue *= this.mapping.sensitivity || 1;
        
        // Ensure the value is between 0 and 1 for the ParameterMapper
        normalizedValue = Math.max(0, Math.min(1, normalizedValue));
        
        return normalizedValue;
    }
    
    getParameterConfig(target) {
        // Use the unified ParameterMapper for parameter configurations
        return ParameterMapper.getParameterConfig(target);
    }
    
    updateSensitivityDisplay() {
        const sensitivityValue = this.element.querySelector('.sensitivity-value');
        if (sensitivityValue) {
            sensitivityValue.textContent = this.mapping.sensitivity.toFixed(1);
        }
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
        
        // Update min/max values based on the target if not already set
        if (this.mapping.target && (!this.mapping.minValue || !this.mapping.maxValue)) {
            const config = this.getParameterConfig(this.mapping.target);
            if (config) {
                this.mapping.minValue = config.min;
                this.mapping.maxValue = config.max;
            }
        }
        
        this.updateMapping();
        
        // Update UI elements
        if (this.element) {
            const targetSelect = this.element.querySelector('.target-select');
            if (targetSelect) targetSelect.value = this.mapping.target || ''; // Handle empty target
            
            // Update frequency slider if it exists
            if (this.frequencySlider) {
                this.frequencySlider.setRange(this.mapping.minFrequency, this.mapping.maxFrequency);
            }
            
            // Update sensitivity slider
            const sensitivitySlider = this.element.querySelector('.sensitivity-slider');
            if (sensitivitySlider) {
                sensitivitySlider.value = this.mapping.sensitivity;
                this.updateSensitivityDisplay();
            }
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
        
        // Clean up frequency slider
        if (this.frequencySlider) {
            this.frequencySlider.destroy();
            this.frequencySlider = null;
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
        // Subscribe to audio updates from the app's state
        if (this.app && this.app.state) {
            // Subscribe to overall audio changes
            this.app.state.subscribe('audioOverall', () => {
                this.broadcastAudioUpdate();
            });
            
            // Subscribe to RMS changes
            this.app.state.subscribe('audioRMS', () => {
                this.broadcastAudioUpdate();
            });
            
            // Subscribe to peak changes
            this.app.state.subscribe('audioPeak', () => {
                this.broadcastAudioUpdate();
            });
            
            // Subscribe to frequency changes
            this.app.state.subscribe('audioFrequency', () => {
                this.broadcastAudioUpdate();
            });
        }
    }
    
    registerAudioListener(controlId, callback) {
        if (!this.audioListeners.has(controlId)) {
            this.audioListeners.set(controlId, []);
        }
        this.audioListeners.get(controlId).push(callback);
    }
    
    unregisterAudioListener(controlId) {
        if (this.audioListeners.has(controlId)) {
            this.audioListeners.delete(controlId);
        }
    }
    
    broadcastAudioUpdate() {

        
        this.audioListeners.forEach((callbacks, controlId) => {
            callbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in audio listener callback:', error);
                }
            });
        });
    }
} 