/**
 * midi-controls.js - MIDI Control Mapping and Configuration
 * This module manages MIDI control mapping, preset management, and dynamic control creation for
 * the application. It handles CC (Continuous Controller) and Note message routing, provides
 * preset configurations for different MIDI controllers, manages control element creation and
 * removal, and ensures proper parameter binding between MIDI inputs and application features.
 */

// MIDI Control Component System
// Replaces hardcoded HTML with dynamic component-based rendering

// Configuration for different control types
const CONTROL_CONFIGS = {
    cc: {
        label: 'CC Control',
        defaultValue: 1,
        inputType: 'CC',
        inputPlaceholder: 'CC',
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
        ]
    },
    note: {
        label: 'Note Control',
        defaultValue: 60,
        inputType: 'Note',
        inputPlaceholder: 'Note',
        targets: [
            { value: 'shapeCycling', label: 'Toggle Shape Cycling' },
            { value: 'sizeAnimation', label: 'Toggle Size Animation' },
            { value: 'showGrid', label: 'Toggle Grid' },
            { value: 'resetAnimation', label: 'Reset Animation' },
            { value: 'toggleBasicShapes', label: 'Toggle Basic Shapes' },
            { value: 'toggleTriangles', label: 'Toggle Triangles' },
            { value: 'toggleRectangles', label: 'Toggle Rectangles' },
            { value: 'toggleEllipses', label: 'Toggle Ellipses' },
            { value: 'toggleRefractiveSpheres', label: 'Toggle Refractive Spheres' },
            { value: 'bloomEnabled', label: 'Toggle Bloom' },
            { value: 'chromaticAberrationEnabled', label: 'Toggle Chromatic Aberration' },
            { value: 'vignetteEnabled', label: 'Toggle Vignette' },
            { value: 'grainEnabled', label: 'Toggle Film Grain' },
            { value: 'colorGradingEnabled', label: 'Toggle Color Grading' },
            { value: 'postProcessingEnabled', label: 'Toggle Post Processing' }
        ]
    }
};

// HTML Templates
const CONTROL_TEMPLATES = {
    cc: `
        <div class="flex items-center gap-2 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <label class="text-xs font-medium text-gray-300 min-w-8 flex-shrink-0">{index}:</label>
            <div class="flex gap-1 items-center flex-1">
                <input type="number" id="midi-{controlId}-channel" value="1" min="1" max="16" class="w-10 px-1 py-0.5 bg-midi-green bg-opacity-10 border border-midi-green border-opacity-30 text-midi-green rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="Ch">
                <input type="number" id="midi-{controlId}-value" value="{defaultValue}" min="0" max="127" class="w-12 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="{inputPlaceholder}">
                <select id="midi-{controlId}-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none">
                    {targetOptions}
                </select>
                <button id="midi-{controlId}-learn" class="px-2 py-0.5 bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 border-opacity-30 rounded text-xs font-medium transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50">Learn</button>
                <button id="midi-{controlId}-remove" class="px-1 py-0.5 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded text-xs font-bold transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50">×</button>
            </div>
        </div>
    `,
    note: `
        <div class="flex items-center gap-2 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <label class="text-xs font-medium text-gray-300 min-w-8 flex-shrink-0">{index}:</label>
            <div class="flex gap-1 items-center flex-1">
                <input type="number" id="midi-{controlId}-channel" value="1" min="1" max="16" class="w-10 px-1 py-0.5 bg-midi-green bg-opacity-10 border border-midi-green border-opacity-30 text-midi-green rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="Ch">
                <input type="number" id="midi-{controlId}-value" value="{defaultValue}" min="0" max="127" class="w-12 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="{inputPlaceholder}">
                <select id="midi-{controlId}-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none">
                    {targetOptions}
                </select>
                <button id="midi-{controlId}-learn" class="px-2 py-0.5 bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 border-opacity-30 rounded text-xs font-medium transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50">Learn</button>
                <button id="midi-{controlId}-remove" class="px-1 py-0.5 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded text-xs font-bold transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50">×</button>
            </div>
        </div>
    `
};

export class MIDIControl {
    constructor(type, index, container, app) {
        this.type = type;
        this.index = index;
        this.container = container;
        this.app = app;
        this.controlId = this.generateControlId();
        this.element = null;
        this.midiHandler = null;
        this.updateTimeout = null;
        this.tempMIDIHandler = null;
        
        this.config = CONTROL_CONFIGS[type];
        if (!this.config) {
            throw new Error(`Unknown control type: ${type}`);
        }
        
        this.render();
        this.setupListeners();
        this.setupMIDIHandling();
    }
    
    generateControlId() {
        const controlId = `${this.type}${this.index}`;
        return controlId;
    }
    
    render() {
        const template = CONTROL_TEMPLATES[this.type];
        const html = this.interpolateTemplate(template);
        this.element = this.createElement(html);
        
        // Insert at the end of the container, before the "Add" button
        const addButton = this.container.querySelector('#add-cc-control, #add-note-control');
        if (addButton) {
            this.container.insertBefore(this.element, addButton.parentElement);
        } else {
            this.container.appendChild(this.element);
        }
    }
    
    interpolateTemplate(template) {
        const targetOptions = this.config.targets
            .map(target => `<option value="${target.value}">${target.label}</option>`)
            .join('');
        
        return template
            .replace(/{controlId}/g, this.controlId)
            .replace(/{index}/g, this.index)
            .replace(/{defaultValue}/g, this.config.defaultValue)
            .replace(/{inputPlaceholder}/g, this.config.inputPlaceholder)
            .replace(/{targetOptions}/g, targetOptions);
    }
    
    createElement(html) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstElementChild;
    }
    
    setupListeners() {
        // Check for existing elements with the same IDs
        const existingElements = document.querySelectorAll(`[id*="${this.controlId}"]`);
        
        const channelInput = document.getElementById(`midi-${this.controlId}-channel`);
        const valueInput = document.getElementById(`midi-${this.controlId}-value`);
        const targetSelect = document.getElementById(`midi-${this.controlId}-target`);
        const learnButton = document.getElementById(`midi-${this.controlId}-learn`);
        const removeButton = document.getElementById(`midi-${this.controlId}-remove`);
        
        if (!channelInput || !valueInput || !targetSelect || !learnButton || !removeButton) {
            console.error('Failed to find control elements for', this.controlId);
            return;
        }
        
        // Set initial values
        const mapping = this.getMapping();
        channelInput.value = mapping.channel + 1;
        valueInput.value = mapping.value;
        targetSelect.value = mapping.target;
        
        // Event listeners
        channelInput.addEventListener('change', (e) => {
            this.updateMapping({ channel: parseInt(e.target.value) - 1 });
        });
        
        valueInput.addEventListener('change', (e) => {
            this.updateMapping({ value: parseInt(e.target.value) });
        });
        
        targetSelect.addEventListener('change', (e) => {
            this.updateMapping({ target: e.target.value });
        });
        
        // Learn button
        learnButton.addEventListener('click', () => {
            this.startLearning(learnButton);
        });
        
        // Remove button
        removeButton.addEventListener('click', () => {
            this.destroy();
        });
    }
    
    setupMIDIHandling() {
        if (this.type === 'cc') {
            this.midiHandler = (controller, value, channel) => {
                if (this.matchesControl(controller, channel)) {
                    this.updateParameter(value);
                }
            };
            this.app.midiManager.onCC(this.midiHandler);
        } else if (this.type === 'note') {
            this.midiHandler = (note, velocity, isNoteOn, channel) => {
                if (this.matchesControl(note, channel)) {
                    this.triggerAction(isNoteOn);
                }
            };
            this.app.midiManager.onNote(this.midiHandler);
        }
    }
    
    matchesControl(value, channel) {
        const mapping = this.getMapping();
        return mapping.channel === channel && mapping.value === value;
    }
    
    updateParameter(midiValue) {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        
        this.updateTimeout = setTimeout(() => {
            const target = this.getMapping().target;
            const normalizedValue = this.normalizeValue(midiValue, target);
            this.app.updateAnimationParameter(target, normalizedValue);
        }, 16); // ~60fps debouncing
    }
    
    normalizeValue(midiValue, target) {
        // Convert 0-127 MIDI value to parameter range
        const paramConfig = this.getParameterConfig(target);
        if (paramConfig) {
            return paramConfig.min + (midiValue / 127) * (paramConfig.max - paramConfig.min);
        }
        return midiValue / 127; // Default to 0-1 range
    }
    
    getParameterConfig(target) {
        // Define parameter ranges for different targets
        const configs = {
            animationSpeed: { min: 0, max: 2 },
            movementAmplitude: { min: 0, max: 1 },
            rotationAmplitude: { min: 0, max: Math.PI * 2 },
            scaleAmplitude: { min: 0, max: 1 },
            randomness: { min: 0, max: 2 },
            cellSize: { min: 0.1, max: 3 },
            movementFrequency: { min: 0, max: 2 },
            rotationFrequency: { min: 0, max: 2 },
            scaleFrequency: { min: 0, max: 2 },
            gridWidth: { min: 1, max: 20 },
            gridHeight: { min: 1, max: 20 },
            compositionWidth: { min: 10, max: 100 },
            compositionHeight: { min: 10, max: 100 },
            sphereRefraction: { min: 1, max: 3 },
            sphereTransparency: { min: 0, max: 1 },
            sphereTransmission: { min: 0, max: 1 },
            sphereRoughness: { min: 0, max: 1 },
            sphereMetalness: { min: 0, max: 1 },
            sphereScale: { min: 0.1, max: 3 },
            centerScalingEnabled: { min: 0, max: 1 },
            centerScalingIntensity: { min: 0, max: 2 },
            centerScalingCurve: { min: 0, max: 3 },
            centerScalingRadius: { min: 0.1, max: 5 },
            centerScalingDirection: { min: 0, max: 1 },
            centerScalingAnimation: { min: 0, max: 1 },
            centerScalingAnimationSpeed: { min: 0.1, max: 3 },
            centerScalingAnimationType: { min: 0, max: 3 }
        };
        return configs[target];
    }
    
    triggerAction(isNoteOn) {
        if (!isNoteOn) return; // Only trigger on note on
        
        const target = this.getMapping().target;
        this.app.triggerNoteAction(target);
    }
    
    startLearning(learnButton) {
        // If already learning, stop learning
        if (learnButton.classList.contains('animate-pulse')) {
            this.stopLearning(learnButton);
            return;
        }
        
        // Add learning state classes
        learnButton.classList.remove('bg-yellow-500', 'bg-opacity-20', 'text-yellow-400', 'border-yellow-500', 'border-opacity-30');
        learnButton.classList.add('bg-yellow-500', 'bg-opacity-40', 'text-yellow-300', 'border-yellow-400', 'border-opacity-50', 'animate-pulse');
        learnButton.textContent = 'Learning';
        
        const onMIDI = (controller, value, channel) => {
            this.updateMapping({ value: controller, channel });
            
            const channelInput = document.getElementById(`midi-${this.controlId}-channel`);
            const valueInput = document.getElementById(`midi-${this.controlId}-value`);
            
            if (channelInput && valueInput) {
                channelInput.value = channel + 1;
                valueInput.value = controller;
            }
            
            // Remove learning state and add learned state
            learnButton.classList.remove('bg-yellow-500', 'bg-opacity-40', 'text-yellow-300', 'border-yellow-400', 'border-opacity-50', 'animate-pulse');
            learnButton.classList.add('bg-green-500', 'bg-opacity-20', 'text-green-400', 'border-green-500', 'border-opacity-30');
            learnButton.textContent = 'Learned';
            
            setTimeout(() => {
                learnButton.classList.remove('bg-green-500', 'bg-opacity-20', 'text-green-400', 'border-green-500', 'border-opacity-30');
                learnButton.classList.add('bg-yellow-500', 'bg-opacity-20', 'text-yellow-400', 'border-yellow-500', 'border-opacity-30');
                learnButton.textContent = 'Learn';
            }, 1500);
            
            // Remove the temporary listener
            if (this.type === 'cc') {
                this.app.midiManager.offCC(onMIDI);
            } else {
                this.app.midiManager.offNote(onMIDI);
            }
        };
        
        // Store the temporary handler for potential cancellation
        this.tempMIDIHandler = onMIDI;
        
        if (this.type === 'cc') {
            this.app.midiManager.onCC(onMIDI);
        } else {
            this.app.midiManager.onNote(onMIDI);
        }
    }
    
    stopLearning(learnButton) {
        // Remove learning state and return to default
        learnButton.classList.remove('bg-yellow-500', 'bg-opacity-40', 'text-yellow-300', 'border-yellow-400', 'border-opacity-50', 'animate-pulse');
        learnButton.classList.add('bg-yellow-500', 'bg-opacity-20', 'text-yellow-400', 'border-yellow-500', 'border-opacity-30');
        learnButton.textContent = 'Learn';
        
        // Remove any temporary MIDI listeners
        if (this.tempMIDIHandler) {
            if (this.type === 'cc') {
                this.app.midiManager.offCC(this.tempMIDIHandler);
            } else {
                this.app.midiManager.offNote(this.tempMIDIHandler);
            }
            this.tempMIDIHandler = null;
        }
    }
    
    getMapping() {
        const mappings = this.type === 'cc' ? this.app.state.get('midiCCMappings') : this.app.state.get('midiNoteMappings');
        const defaultMapping = {
            channel: 0,
            value: this.config.defaultValue,
            target: this.config.targets[0].value
        };
        return mappings[this.controlId] || defaultMapping;
    }
    
    updateMapping(updates) {
        const mappings = this.type === 'cc' ? this.app.state.get('midiCCMappings') : this.app.state.get('midiNoteMappings');
        
        if (!mappings[this.controlId]) {
            mappings[this.controlId] = this.getMapping();
        }
        
        Object.assign(mappings[this.controlId], updates);
        
        // Update the state
        if (this.type === 'cc') {
            this.app.state.set('midiCCMappings', mappings);
        } else {
            this.app.state.set('midiNoteMappings', mappings);
        }
    }
    
    serialize() {
        return {
            type: this.type,
            index: this.index,
            controlId: this.controlId,
            config: this.getMapping()
        };
    }
    
    deserialize(data) {
        if (data.config) {
            this.updateMapping(data.config);
            
            // Update UI elements
            const channelInput = document.getElementById(`midi-${this.controlId}-channel`);
            const valueInput = document.getElementById(`midi-${this.controlId}-value`);
            const targetSelect = document.getElementById(`midi-${this.controlId}-target`);
            
            if (channelInput) channelInput.value = data.config.channel + 1;
            if (valueInput) valueInput.value = data.config.value;
            if (targetSelect) targetSelect.value = data.config.target;
        }
    }
    
    destroy() {
        // Clean up MIDI handlers
        if (this.midiHandler) {
            if (this.type === 'cc') {
                this.app.midiManager.offCC(this.midiHandler);
            } else {
                this.app.midiManager.offNote(this.midiHandler);
            }
        }
        
        // Clear timeout
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        // Remove from mappings
        const mappings = this.type === 'cc' ? this.app.state.get('midiCCMappings') : this.app.state.get('midiNoteMappings');
        delete mappings[this.controlId];
        
        // Update the state
        if (this.type === 'cc') {
            this.app.state.set('midiCCMappings', mappings);
        } else {
            this.app.state.set('midiNoteMappings', mappings);
        }
        
        // Remove from DOM
        if (this.element) {
            this.element.remove();
        }
        
        // Don't call removeControl here to avoid circular reference
        // The manager will handle removing from its internal map
    }
}

export class MIDIControlManager {
    constructor(ccContainer, app) {
        this.ccContainer = ccContainer;
        this.noteContainer = null; // Will be set later
        this.app = app;
        this.controls = new Map(); // controlId -> MIDIControl instance
    }
    
    addControl(type, index) {
        const controlId = this.generateControlId(type, index);
        
        // Check if control already exists
        if (this.controls.has(controlId)) {
            console.warn(`Control ${controlId} already exists`);
            return this.controls.get(controlId);
        }
        
        // Select the appropriate container based on type
        const container = type === 'cc' ? this.ccContainer : this.noteContainer;
        
        if (!container) {
            console.error(`No container found for ${type} controls`);
            return null;
        }
        
        const control = new MIDIControl(type, index, container, this.app);
        this.controls.set(controlId, control);
        
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
        this.controls.forEach(control => {
            // Don't call destroy() to avoid removing mappings from state
            // Just clean up the DOM and MIDI handlers
            if (control.midiHandler) {
                if (control.type === 'cc') {
                    control.app.midiManager.offCC(control.midiHandler);
                } else {
                    control.app.midiManager.offNote(control.midiHandler);
                }
            }
            
            // Clear timeout
            if (control.updateTimeout) {
                clearTimeout(control.updateTimeout);
            }
            
            // Remove from DOM
            if (control.element) {
                control.element.remove();
            }
        });
        this.controls.clear();
    }
    
    generateControlId(type, index) {
        return `${type}${index}`;
    }
    
    getNextControlIndex(type) {
        // Get indices from managed controls
        const managedIndices = Array.from(this.controls.keys())
            .filter(id => id.startsWith(type))
            .map(id => parseInt(id.replace(type, '')))
            .filter(index => !isNaN(index));
        
        // Get indices from existing HTML controls
        const container = type === 'cc' ? this.ccContainer : this.noteContainer;
        const existingElements = container ? container.querySelectorAll('[data-control-id]') : [];
        const htmlIndices = Array.from(existingElements)
            .map(el => {
                const controlId = el.getAttribute('data-control-id');
                if (controlId && controlId.startsWith(type)) {
                    const index = parseInt(controlId.replace(type, ''));
                    return isNaN(index) ? 0 : index;
                }
                return 0;
            })
            .filter(index => index > 0);
        
        // Combine all indices
        const allIndices = [...managedIndices, ...htmlIndices];
        
        const nextIndex = allIndices.length > 0 ? Math.max(...allIndices) + 1 : 1;
        return nextIndex;
    }
    
    serialize() {
        return Array.from(this.controls.values()).map(control => control.serialize());
    }
    
    deserialize(controlsData) {
        this.clearAllControls();
        
        controlsData.forEach(controlData => {
            const control = this.addControl(controlData.type, controlData.index);
            control.deserialize(controlData);
        });
    }
} 