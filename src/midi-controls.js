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
            // Shape Controls
            { value: 'gridWidth', label: 'Grid Width' },
            { value: 'gridHeight', label: 'Grid Height' },
            { value: 'cellSize', label: 'Cell Size' },
            { value: 'randomness', label: 'Randomness' },
            
            // Composition Controls
            { value: 'compositionWidth', label: 'Composition Width' },
            { value: 'compositionHeight', label: 'Composition Height' },
            
            // Color Controls
            { value: 'shapeColor', label: 'Shape Color' },
            { value: 'backgroundColor', label: 'Background Color' },
            { value: 'gridColor', label: 'Grid Color' },
            
            // Sphere Controls - Material Properties
            { value: 'sphereRefraction', label: 'Sphere Refraction' },
            { value: 'sphereTransparency', label: 'Sphere Transparency' },
            { value: 'sphereTransmission', label: 'Sphere Transmission' },
            { value: 'sphereRoughness', label: 'Sphere Roughness' },
            { value: 'sphereMetalness', label: 'Sphere Metalness' },
            
            // Sphere Controls - Clearcoat Properties
            { value: 'sphereClearcoat', label: 'Sphere Clearcoat' },
            { value: 'sphereClearcoatRoughness', label: 'Sphere Clearcoat Roughness' },
            
            // Sphere Controls - Environment & Effects
            { value: 'sphereEnvMapIntensity', label: 'Sphere Environment Map Intensity' },
            { value: 'sphereDistortionStrength', label: 'Sphere Distortion Strength' },
            { value: 'sphereScale', label: 'Sphere Scale' },
            
            // Animation Controls - Global
            { value: 'globalBPM', label: 'Global BPM' },
            
            // Animation Controls - Movement
            { value: 'movementAmplitude', label: 'Movement Amplitude' },
            { value: 'movementDivision', label: 'Movement Division' },
            
            // Animation Controls - Rotation
            { value: 'rotationAmplitude', label: 'Rotation Amplitude' },
            { value: 'rotationDivision', label: 'Rotation Division' },
            
            // Animation Controls - Scale
            { value: 'scaleAmplitude', label: 'Scale Amplitude' },
            { value: 'scaleDivision', label: 'Scale Division' },
            
            // Animation Controls - Shape Cycling
            { value: 'shapeCyclingDivision', label: 'Shape Cycling Division' },
            { value: 'shapeCyclingPattern', label: 'Shape Cycling Pattern' },
            { value: 'shapeCyclingDirection', label: 'Shape Cycling Direction' },
            { value: 'shapeCyclingSync', label: 'Shape Cycling Sync' },
            { value: 'shapeCyclingIntensity', label: 'Shape Cycling Intensity' },
            { value: 'shapeCyclingTrigger', label: 'Shape Cycling Trigger' },
            
            // Animation Controls - Center Scaling
            { value: 'centerScalingIntensity', label: 'Center Scaling Intensity' },
            { value: 'centerScalingCurve', label: 'Center Scaling Curve' },
            { value: 'centerScalingRadius', label: 'Center Scaling Radius' },
            { value: 'centerScalingDirection', label: 'Center Scaling Direction' },
            { value: 'centerScalingDivision', label: 'Center Scaling Division' },
            { value: 'centerScalingAnimationSpeed', label: 'Center Scaling Animation Speed' },
            { value: 'centerScalingAnimationType', label: 'Center Scaling Animation Type' },
            
            // Morphing Controls
            { value: 'morphingDivision', label: 'Morphing Division' },
            { value: 'morphingEasing', label: 'Morphing Easing' },
            
            // Post Processing Controls - Bloom
            { value: 'bloomStrength', label: 'Bloom Strength' },
            { value: 'bloomRadius', label: 'Bloom Radius' },
            { value: 'bloomThreshold', label: 'Bloom Threshold' },
            
            // Post Processing Controls - Chromatic Aberration
            { value: 'chromaticIntensity', label: 'Chromatic Aberration Intensity' },
            
            // Post Processing Controls - Vignette
            { value: 'vignetteIntensity', label: 'Vignette Intensity' },
            { value: 'vignetteRadius', label: 'Vignette Radius' },
            { value: 'vignetteSoftness', label: 'Vignette Softness' },
            
            // Post Processing Controls - Film Grain
            { value: 'grainIntensity', label: 'Film Grain Intensity' },
            
            // Post Processing Controls - Color Grading
            { value: 'colorHue', label: 'Color Hue' },
            { value: 'colorSaturation', label: 'Color Saturation' },
            { value: 'colorBrightness', label: 'Color Brightness' },
            { value: 'colorContrast', label: 'Color Contrast' },
            
            // Lighting Controls
            { value: 'lightColour', label: 'Light Colour' },
            { value: 'ambientLightIntensity', label: 'Ambient Light Intensity' },
            { value: 'directionalLightIntensity', label: 'Directional Light Intensity' },
            { value: 'pointLight1Intensity', label: 'Point Light 1 Intensity' },
            { value: 'pointLight2Intensity', label: 'Point Light 2 Intensity' },
            { value: 'rimLightIntensity', label: 'Rim Light Intensity' },
            { value: 'accentLightIntensity', label: 'Accent Light Intensity' }
        ]
    },
    note: {
        label: 'Note Control',
        defaultValue: 60,
        inputType: 'Note',
        inputPlaceholder: 'Note',
        targets: [
            // Shape toggles
            { value: 'toggleBasicShapes', label: 'Toggle Basic Shapes' },
            { value: 'toggleTriangles', label: 'Toggle Triangles' },
            { value: 'toggleRectangles', label: 'Toggle Rectangles' },
            { value: 'toggleEllipses', label: 'Toggle Ellipses' },
            { value: 'toggleRefractiveSpheres', label: 'Toggle Refractive Spheres' },
            { value: 'showGrid', label: 'Toggle Grid' },
            
            // Animation toggles
            { value: 'shapeCycling', label: 'Toggle Shape Cycling' },
            { value: 'sizeAnimation', label: 'Toggle Size Animation' },
            { value: 'enableShapeCycling', label: 'Toggle Shape Cycling' },
            { value: 'centerScalingEnabled', label: 'Toggle Center Scaling' },
            { value: 'enableMovementAnimation', label: 'Toggle Movement Animation' },
            { value: 'enableRotationAnimation', label: 'Toggle Rotation Animation' },
            { value: 'enableScaleAnimation', label: 'Toggle Scale Animation' },
            { value: 'enableSizeAnimation', label: 'Toggle Size Animation' },
            { value: 'centerScalingAnimation', label: 'Toggle Center Scaling Animation' },
            { value: 'resetAnimation', label: 'Reset Animation' },
            
            // Post processing toggles
            { value: 'bloomEnabled', label: 'Toggle Bloom' },
            { value: 'chromaticAberrationEnabled', label: 'Toggle Chromatic Aberration' },
            { value: 'vignetteEnabled', label: 'Toggle Vignette' },
            { value: 'grainEnabled', label: 'Toggle Film Grain' },
            { value: 'colorGradingEnabled', label: 'Toggle Color Grading' },
            { value: 'postProcessingEnabled', label: 'Toggle Post Processing' },
            { value: 'fxaaEnabled', label: 'Toggle FXAA' },
            
            // Performance toggles
            { value: 'enableFrustumCulling', label: 'Toggle Frustum Culling' },
            { value: 'sphereHighPerformanceMode', label: 'Toggle Sphere High Performance' },
            
            // Sphere effects
            { value: 'sphereWaterDistortion', label: 'Toggle Sphere Water Distortion' },
            
            // Morphing triggers
            { value: 'randomMorph', label: 'Random Morph' },
            { value: 'morphAllShapes', label: 'Morph All Shapes' },
            { value: 'morphAllToSame', label: 'Morph All to Same' },
            { value: 'morphAllSimultaneously', label: 'Morph All Simultaneously' },
            { value: 'morphAllToSameSimultaneously', label: 'Morph All to Same Simultaneously' }
        ]
    }
};

// HTML Templates
const CONTROL_TEMPLATES = {
    cc: `
        <div class="flex items-center gap-2 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <label class="text-xs font-medium text-gray-300 min-w-8 flex-shrink-0">{index}:</label>
            <div class="flex gap-1 items-center flex-1">
                <input type="number" id="midi-{controlId}-channel" value="1" min="1" max="16" class="w-10 px-1 py-0.5 bg-midi-green bg-opacity-10 border border-midi-green border-opacity-30 text-midi-green rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="Ch" data-drawer-interactive>
                <input type="number" id="midi-{controlId}-value" value="{defaultValue}" min="0" max="127" class="w-12 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="{inputPlaceholder}" data-drawer-interactive>
                <select id="midi-{controlId}-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none" data-drawer-interactive>
                    {targetOptions}
                </select>
                <button id="midi-{controlId}-learn" class="px-2 py-0.5 bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 border-opacity-30 rounded text-xs font-medium transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50" data-drawer-interactive>Learn</button>
                <button id="midi-{controlId}-remove" class="px-1 py-0.5 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded text-xs font-bold transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50" data-drawer-interactive>×</button>
            </div>
        </div>
    `,
    note: `
        <div class="flex items-center gap-2 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <label class="text-xs font-medium text-gray-300 min-w-8 flex-shrink-0">{index}:</label>
            <div class="flex gap-1 items-center flex-1">
                <input type="number" id="midi-{controlId}-channel" value="1" min="1" max="16" class="w-10 px-1 py-0.5 bg-midi-green bg-opacity-10 border border-midi-green border-opacity-30 text-midi-green rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="Ch" data-drawer-interactive>
                <input type="number" id="midi-{controlId}-value" value="{defaultValue}" min="0" max="127" class="w-12 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="{inputPlaceholder}" data-drawer-interactive>
                <select id="midi-{controlId}-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none" data-drawer-interactive>
                    {targetOptions}
                </select>
                <button id="midi-{controlId}-learn" class="px-2 py-0.5 bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 border-opacity-30 rounded text-xs font-medium transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50" data-drawer-interactive>Learn</button>
                <button id="midi-{controlId}-remove" class="px-1 py-0.5 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded text-xs font-bold transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50" data-drawer-interactive>×</button>
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
            // Shape Controls
            gridWidth: { min: 1, max: 30 },
            gridHeight: { min: 1, max: 30 },
            cellSize: { min: 0.5, max: 2 },
            randomness: { min: 0, max: 1 },
            
            // Composition Controls
            compositionWidth: { min: 1, max: 30 },
            compositionHeight: { min: 1, max: 30 },
            
            // Color Controls (handled as colors, not numeric)
            shapeColor: { min: 0, max: 1 },
            backgroundColor: { min: 0, max: 1 },
            gridColor: { min: 0, max: 1 },
            
            // Sphere Controls - Material Properties
            sphereRefraction: { min: 0, max: 2 },
            sphereTransparency: { min: 0, max: 1 },
            sphereTransmission: { min: 0, max: 1 },
            sphereRoughness: { min: 0, max: 1 },
            sphereMetalness: { min: 0, max: 1 },
            
            // Sphere Controls - Clearcoat Properties
            sphereClearcoat: { min: 0, max: 1 },
            sphereClearcoatRoughness: { min: 0, max: 1 },
            
            // Sphere Controls - Environment & Effects
            sphereEnvMapIntensity: { min: 0, max: 3 },
            sphereDistortionStrength: { min: 0, max: 1 },
            sphereScale: { min: 0.5, max: 3 },
            
            // Animation Controls - Global
            globalBPM: { min: 60, max: 300 },
            
            // Animation Controls - Movement
            movementAmplitude: { min: 0.01, max: 0.5 },
            movementDivision: { min: 0, max: 127 },
            
            // Animation Controls - Rotation
            rotationAmplitude: { min: 0.01, max: 2 },
            rotationDivision: { min: 0, max: 127 },
            
            // Animation Controls - Scale
            scaleAmplitude: { min: 0.01, max: 1 },
            scaleDivision: { min: 0, max: 127 },
            
            // Animation Controls - Shape Cycling
            shapeCyclingDivision: { min: 0, max: 127 },
            shapeCyclingPattern: { min: 0, max: 4 },
            shapeCyclingDirection: { min: 0, max: 3 },
            shapeCyclingSync: { min: 0, max: 3 },
            shapeCyclingIntensity: { min: 0.1, max: 1 },
            shapeCyclingTrigger: { min: 0, max: 3 },
            
            // Animation Controls - Center Scaling
            centerScalingIntensity: { min: 0, max: 2 },
            centerScalingCurve: { min: 0, max: 3 },
            centerScalingRadius: { min: 0.1, max: 5 },
            centerScalingDirection: { min: 0, max: 1 },
            centerScalingDivision: { min: 0, max: 127 },
            centerScalingAnimationSpeed: { min: 0.1, max: 3 },
            centerScalingAnimationType: { min: 0, max: 3 },
            
            // Morphing Controls
            morphingDivision: { min: 0, max: 127 },
            morphingEasing: { min: 0, max: 1 },
            
            // Post Processing Controls - Bloom
            bloomStrength: { min: 0, max: 2 },
            bloomRadius: { min: 0, max: 2 },
            bloomThreshold: { min: 0, max: 1 },
            
            // Post Processing Controls - Chromatic Aberration
            chromaticIntensity: { min: 0, max: 1 },
            
            // Post Processing Controls - Vignette
            vignetteIntensity: { min: 0, max: 1 },
            vignetteRadius: { min: 0.1, max: 1 },
            vignetteSoftness: { min: 0, max: 1 },
            
            // Post Processing Controls - Film Grain
            grainIntensity: { min: 0, max: 0.5 },
            
            // Post Processing Controls - Color Grading
            colorHue: { min: -0.5, max: 0.5 },
            colorSaturation: { min: 0, max: 3 },
            colorBrightness: { min: 0, max: 2 },
            colorContrast: { min: 0, max: 2 },
            
            // Lighting Controls
            lightColour: { min: 0, max: 1 },
            ambientLightIntensity: { min: 0, max: 2 },
            directionalLightIntensity: { min: 0, max: 3 },
            pointLight1Intensity: { min: 0, max: 3 },
            pointLight2Intensity: { min: 0, max: 3 },
            rimLightIntensity: { min: 0, max: 3 },
            accentLightIntensity: { min: 0, max: 3 }
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
        
        if (this.type === 'cc') {
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
                this.app.midiManager.offCC(onMIDI);
            };
            
            // Store the temporary handler for potential cancellation
            this.tempMIDIHandler = onMIDI;
            this.app.midiManager.onCC(onMIDI);
        } else {
            // For notes, the callback signature is (note, velocity, isNoteOn, channel)
            const onMIDI = (note, velocity, isNoteOn, channel) => {
                this.updateMapping({ value: note, channel });
                
                const channelInput = document.getElementById(`midi-${this.controlId}-channel`);
                const valueInput = document.getElementById(`midi-${this.controlId}-value`);
                
                if (channelInput && valueInput) {
                    channelInput.value = channel + 1;
                    valueInput.value = note;
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
                this.app.midiManager.offNote(onMIDI);
            };
            
            // Store the temporary handler for potential cancellation
            this.tempMIDIHandler = onMIDI;
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
            return this.controls.get(controlId);
        }
        
        // Select the appropriate container based on type
        const container = type === 'cc' ? this.ccContainer : this.noteContainer;
        
        if (!container) {
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