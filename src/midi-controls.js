/**
 * midi-controls.js - MIDI Control Mapping and Configuration
 * This module manages MIDI control mapping, preset management, and dynamic control creation for
 * the application. It handles CC (Continuous Controller) and Note message routing, provides
 * preset configurations for different MIDI controllers, manages control element creation and
 * removal, and ensures proper parameter binding between MIDI inputs and application features.
 */

import { ParameterMapper } from './modules/ParameterMapper.js';
import { MIDI_CONSTANTS } from './config/index.js';

// MIDI Control Component System
// Replaces hardcoded HTML with dynamic component-based rendering

// Configuration for different control types
const CONTROL_CONFIGS = {
    cc: {
        label: 'CC Control',
        defaultValue: MIDI_CONSTANTS.defaults.controller,
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
            { value: 'accentLightIntensity', label: 'Accent Light Intensity' },

            // Camera Controls
            { value: 'cameraRotationX', label: 'Camera Rotation X (Pitch)' },
            { value: 'cameraRotationY', label: 'Camera Rotation Y (Yaw)' },
            { value: 'cameraRotationZ', label: 'Camera Rotation Z (Roll)' },
            { value: 'cameraDistance', label: 'Camera Distance (Zoom)' },
            { value: 'isometricEnabled', label: 'Isometric View Toggle' },

            // Layer Controls
            { value: 'layerSpacing', label: 'Layer Spacing' },
            { value: 'maxLayers', label: 'Max Layers' },
            { value: 'autoArrangeLayers', label: 'Auto-arrange Layers' }
        ]
    },
    note: {
        label: 'Note Control',
        defaultValue: MIDI_CONSTANTS.defaults.note,
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
            { value: 'morphAllToSameSimultaneously', label: 'Morph All to Same Simultaneously' },

            // Camera toggles
            { value: 'isometricEnabled', label: 'Toggle Isometric View' },
            { value: 'resetCamera', label: 'Reset Camera' },
            
            // Layer toggles
            { value: 'autoArrangeLayers', label: 'Toggle Auto-arrange Layers' }
        ]
    }
};

// HTML Templates
const CONTROL_TEMPLATES = {
    cc: `
        <div class="flex flex-col gap-1 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <div class="flex items-center gap-2">
                <label class="text-xs font-medium text-gray-300 min-w-8 flex-shrink-0">{index}:</label>
                <div class="flex gap-1 items-center flex-1">
                    <input type="number" id="midi-{controlId}-channel" value="1" min="1" max="16" class="w-10 px-1 py-0.5 bg-midi-green bg-opacity-10 border border-midi-green border-opacity-30 text-purple-400 rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="Ch" data-drawer-interactive>
                    <input type="number" id="midi-{controlId}-value" value="{defaultValue}" min="{minValue}" max="{maxValue}" class="w-12 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="{inputPlaceholder}" data-drawer-interactive>
                    <select id="midi-{controlId}-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none" data-drawer-interactive>
                        {targetOptions}
                    </select>
                    <button id="midi-{controlId}-learn" class="btn btn-warning btn-xs btn-learn-default" data-drawer-interactive>Learn</button>
                    <button id="midi-{controlId}-remove" class="btn btn-danger btn-icon btn-xs" data-drawer-interactive>×</button>
                </div>
            </div>
            <div class="flex items-center gap-2 ml-10">
                <label class="text-xs font-medium text-blue-300 min-w-8 flex-shrink-0">P5:</label>
                <select id="midi-{controlId}-p5-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-blue-600 border-opacity-30 text-white rounded text-xs transition-all duration-300 focus:border-blue-400 focus:outline-none" data-drawer-interactive>
                    {p5TargetOptions}
                </select>
            </div>
            <div class="flex items-center gap-2 ml-10">
                <label class="text-xs font-medium text-orange-300 min-w-8 flex-shrink-0">Shader:</label>
                <select id="midi-{controlId}-shader-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-orange-600 border-opacity-30 text-white rounded text-xs transition-all duration-300 focus:border-orange-400 focus:outline-none" data-drawer-interactive>
                    {shaderTargetOptions}
                </select>
            </div>
        </div>
    `,
    note: `
        <div class="flex flex-col gap-1 p-2 bg-black bg-opacity-5 border border-gray-700 rounded mb-1 transition-all duration-300 hover:bg-opacity-10 hover:border-midi-green" data-control-id="{controlId}">
            <div class="flex items-center gap-2">
                <label class="text-xs font-medium text-gray-300 min-w-8 flex-shrink-0">{index}:</label>
                <div class="flex gap-1 items-center flex-1">
                    <input type="number" id="midi-{controlId}-channel" value="1" min="1" max="16" class="w-10 px-1 py-0.5 bg-midi-green bg-opacity-10 border border-midi-green border-opacity-30 text-purple-400 rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="Ch" data-drawer-interactive>
                    <input type="number" id="midi-{controlId}-value" value="{defaultValue}" min="{minValue}" max="{maxValue}" class="w-12 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs text-center transition-all duration-300 focus:border-opacity-50 focus:outline-none" placeholder="{inputPlaceholder}" data-drawer-interactive>
                    <select id="midi-{controlId}-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none" data-drawer-interactive>
                        {targetOptions}
                    </select>
                    <button id="midi-{controlId}-learn" class="btn btn-warning btn-xs btn-learn-default" data-drawer-interactive>Learn</button>
                    <button id="midi-{controlId}-remove" class="btn btn-danger btn-icon btn-xs" data-drawer-interactive>×</button>
                </div>
            </div>
            <div class="flex items-center gap-2 ml-10">
                <label class="text-xs font-medium text-blue-300 min-w-8 flex-shrink-0">P5:</label>
                <select id="midi-{controlId}-p5-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-blue-600 border-opacity-30 text-white rounded text-xs transition-all duration-300 focus:border-blue-400 focus:outline-none" data-drawer-interactive>
                    {p5TargetOptions}
                </select>
            </div>
            <div class="flex items-center gap-2 ml-10">
                <label class="text-xs font-medium text-orange-300 min-w-8 flex-shrink-0">Shader:</label>
                <select id="midi-{controlId}-shader-target" class="flex-1 px-1 py-0.5 bg-black bg-opacity-30 border border-orange-600 border-opacity-30 text-white rounded text-xs transition-all duration-300 focus:border-orange-400 focus:outline-none" data-drawer-interactive>
                    {shaderTargetOptions}
                </select>
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
        const targetOptions = `<option value="">Select a target</option>` + 
            this.config.targets
                .map(target => `<option value="${target.value}">${target.label}</option>`)
                .join('');
        
        const p5TargetOptions = this.generateP5Options();
        const shaderTargetOptions = this.generateShaderOptions();
        
        // Determine min/max values based on control type
        const minValue = this.type === 'cc' ? MIDI_CONSTANTS.ranges.controllers.min : MIDI_CONSTANTS.ranges.notes.min;
        const maxValue = this.type === 'cc' ? MIDI_CONSTANTS.ranges.controllers.max : MIDI_CONSTANTS.ranges.notes.max;
        
        return template
            .replace(/{controlId}/g, this.controlId)
            .replace(/{index}/g, this.index)
            .replace(/{defaultValue}/g, this.config.defaultValue)
            .replace(/{inputPlaceholder}/g, this.config.inputPlaceholder)
            .replace(/{minValue}/g, minValue)
            .replace(/{maxValue}/g, maxValue)
            .replace(/{targetOptions}/g, targetOptions)
            .replace(/{p5TargetOptions}/g, p5TargetOptions)
            .replace(/{shaderTargetOptions}/g, shaderTargetOptions);
    }
    
    generateP5Options() {
        try {
            const p5Layer = this.app.layerManager?.getLayer('p5');
            if (!p5Layer) {
                return '<option value="">No P5 Layer</option>';
            }
            
            const params = p5Layer.getAllParameters();
            if (!params || Object.keys(params).length === 0) {
                return '<option value="">No P5 Parameters</option>';
            }
            
            return '<option value="">No P5 Parameter</option>' + 
                   Object.entries(params).map(([name, param]) => 
                       `<option value="p5:${name}">${param.label || name}</option>`
                   ).join('');
        } catch (error) {
            console.warn('Error generating P5 options:', error);
            return '<option value="">P5 Error</option>';
        }
    }

    generateShaderOptions() {
        try {
            const shaderLayer = this.app.layerManager?.getLayer('shader');
            if (!shaderLayer) {
                return '<option value="">No Shader Layer</option>';
            }
            const params = shaderLayer.getExposedParameters();
            const keys = Object.keys(params || {});
            if (keys.length === 0) {
                return '<option value="">No Shader Parameters</option>';
            }
            
            // Filter parameters based on control type
            const filteredKeys = keys.filter(name => {
                const meta = params[name] || {};
                if (this.type === 'note') {
                    // For note controls, only show boolean parameters
                    return meta.type === 'bool' || meta.type === 'boolean';
                } else {
                    // For CC controls, show all parameters except booleans
                    return meta.type !== 'bool' && meta.type !== 'boolean';
                }
            });
            
            if (filteredKeys.length === 0) {
                return this.type === 'note' ? 
                    '<option value="">No Boolean Shader Parameters</option>' : 
                    '<option value="">No Shader Parameters</option>';
            }
            
            return '<option value="">No Shader Parameter</option>' + 
                   filteredKeys.map(name => {
                       const meta = params[name] || {};
                       const label = meta.label || name;
                       if (meta.type === 'vector2') {
                           return [
                               `<option value="shader:${name}.x">${label}.x</option>`,
                               `<option value="shader:${name}.y">${label}.y</option>`,
                               `<option value="shader:${name}.both">${label} (both)</option>`
                           ].join('');
                       }
                       return `<option value="shader:${name}">${label}</option>`;
                   }).join('');
        } catch (error) {
            console.warn('Error generating Shader options:', error);
            return '<option value="">Shader Error</option>';
        }
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
        const p5TargetSelect = document.getElementById(`midi-${this.controlId}-p5-target`);
        const shaderTargetSelect = document.getElementById(`midi-${this.controlId}-shader-target`);
        const learnButton = document.getElementById(`midi-${this.controlId}-learn`);
        const removeButton = document.getElementById(`midi-${this.controlId}-remove`);
        
        if (!channelInput || !valueInput || !targetSelect || !learnButton || !removeButton) {
            return;
        }
        
        // Set initial values
        const mapping = this.getMapping();
        channelInput.value = mapping.channel + 1;
        valueInput.value = mapping.value;
        targetSelect.value = mapping.target || ''; // Handle empty target
        
        // Set P5 target if available
        if (p5TargetSelect) {
            p5TargetSelect.value = mapping.p5Target || '';
        }
        // Set Shader target if available
        if (shaderTargetSelect) {
            shaderTargetSelect.value = mapping.shaderTarget || '';
        }
        
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
        
        // P5 target listener
        if (p5TargetSelect) {
            p5TargetSelect.addEventListener('change', (e) => {
                this.updateMapping({ p5Target: e.target.value });
            });
        }
        // Shader target listener
        if (shaderTargetSelect) {
            shaderTargetSelect.addEventListener('change', (e) => {
                this.updateMapping({ shaderTarget: e.target.value });
            });
        }
        
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
            // Use the new MIDIEventHandler instead of midiManager directly
            if (this.app.midiEventHandler) {
                this.app.midiEventHandler.onCC(this.getMapping().value, this.midiHandler);
            }
        } else if (this.type === 'note') {
            this.midiHandler = (note, velocity, isNoteOn, channel) => {
                if (this.matchesControl(note, channel)) {
                    this.triggerAction(isNoteOn);
                }
            };
            // Use the new MIDIEventHandler instead of midiManager directly
            if (this.app.midiEventHandler) {
                this.app.midiEventHandler.onNote(this.getMapping().value, this.midiHandler);
            }
        }
    }
    
    matchesControl(value, channel) {
        const mapping = this.getMapping();
        return mapping.channel === channel && mapping.value === value;
    }
    
    updateParameter(midiValue) {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        
        this.updateTimeout = setTimeout(() => {
            const mapping = this.getMapping();
            const normalizedValue = this.normalizeValue(midiValue);
            
            console.log(`MIDI CC ${this.controlId}: ch=${mapping.channel+1} ctrl=${mapping.value} Raw=${midiValue} → Norm=${normalizedValue.toFixed(3)} target=${mapping.target||'-'} p5=${mapping.p5Target||'-'} shader=${mapping.shaderTarget||'-'}`);
            console.log('Full mapping object:', JSON.stringify(mapping, null, 2));
            
            // Route to primary target
            if (mapping.target && mapping.target.trim() !== '') {
                console.log(`→ Primary target: ${mapping.target}`);
                this.app.updateAnimationParameter(mapping.target, normalizedValue);
            }
            
            // Route to P5 target
            if (mapping.p5Target && mapping.p5Target.trim() !== '') {
                console.log(`→ P5 target: ${mapping.p5Target}`);
                this.app.updateAnimationParameter(mapping.p5Target, normalizedValue);
            }
            // Route to Shader target
            if (mapping.shaderTarget && mapping.shaderTarget.trim() !== '') {
                console.log(`→ Shader target: ${mapping.shaderTarget}`);
                this.app.updateAnimationParameter(mapping.shaderTarget, normalizedValue);
            } else {
                console.log('No shader target set or empty shader target');
            }
        }, 16); // ~60fps debouncing
    }
    
    normalizeValue(midiValue) {
        // Convert MIDI value to normalized 0-1 range for ParameterMapper
        return midiValue / MIDI_CONSTANTS.ranges.controllers.max; // Always normalize to 0-1 range
    }
    
    getParameterConfig(target) {
        // Use the unified ParameterMapper for parameter configurations
        return ParameterMapper.getParameterConfig(target);
    }
    
    triggerAction(isNoteOn) {
        if (!isNoteOn) return; // Only trigger on note on
        
        const mapping = this.getMapping();
        
        // Check if any target is specified
        if ((!mapping.target || mapping.target.trim() === '') &&
            (!mapping.p5Target || mapping.p5Target.trim() === '') &&
            (!mapping.shaderTarget || mapping.shaderTarget.trim() === '')) {
            return; // No targets specified
        }
        
        // Route to primary target
        if (mapping.target && mapping.target.trim() !== '') {
            console.log(`🎵 MIDI Note primary target: ${mapping.target}`);
            this.app.triggerNoteAction(mapping.target);
        }
        
        // Route to P5 target (toggle boolean parameter)
        if (mapping.p5Target && mapping.p5Target.trim() !== '') {
            console.log(`🎵 MIDI Note P5 target: ${mapping.p5Target}`);
            // Get current value and toggle it
            const currentValue = this.app.getAnimationParameter(mapping.p5Target);
            const newValue = currentValue > 0.5 ? 0.0 : 1.0; // Toggle between 0 and 1
            this.app.updateAnimationParameter(mapping.p5Target, newValue);
        }
        
        // Route to Shader target (toggle boolean parameter)
        if (mapping.shaderTarget && mapping.shaderTarget.trim() !== '') {
            console.log(`🎵 MIDI Note shader target: ${mapping.shaderTarget}`);
            // Get current value and toggle it
            const currentValue = this.app.getAnimationParameter(mapping.shaderTarget);
            const newValue = currentValue > 0.5 ? 0.0 : 1.0; // Toggle between 0 and 1
            this.app.updateAnimationParameter(mapping.shaderTarget, newValue);
        }
    }
    
    startLearning(learnButton) {
        // If already learning, stop learning
        if (learnButton.classList.contains('animate-pulse')) {
            this.stopLearning(learnButton);
            return;
        }
        
        // Add learning state classes
        learnButton.classList.remove('btn-learn-default');
        learnButton.classList.add('btn-learn-learning');
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
                learnButton.classList.remove('btn-learn-learning');
                learnButton.classList.add('btn-learn-learned');
                learnButton.textContent = 'Learned';
                
                setTimeout(() => {
                    learnButton.classList.remove('btn-learn-learned');
                    learnButton.classList.add('btn-learn-default');
                    learnButton.textContent = 'Learn';
                }, 1500);
                
                // Remove the temporary listener
                if (this.app.midiEventHandler) {
                    this.app.midiEventHandler.removeLearnCCListener(onMIDI);
                }
            };
            
            // Store the temporary handler for potential cancellation
            this.tempMIDIHandler = onMIDI;
            // Use the new MIDIEventHandler for learning
            if (this.app.midiEventHandler) {
                this.app.midiEventHandler.addLearnCCListener(onMIDI);
            }
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
                learnButton.classList.remove('btn-learn-learning');
                learnButton.classList.add('btn-learn-learned');
                learnButton.textContent = 'Learned';
                
                setTimeout(() => {
                    learnButton.classList.remove('btn-learn-learned');
                    learnButton.classList.add('btn-learn-default');
                    learnButton.textContent = 'Learn';
                }, 1500);
                
                // Remove the temporary listener
                if (this.app.midiEventHandler) {
                    this.app.midiEventHandler.removeLearnNoteListener(onMIDI);
                }
            };
            
            // Store the temporary handler for potential cancellation
            this.tempMIDIHandler = onMIDI;
            // Use the new MIDIEventHandler for learning
            if (this.app.midiEventHandler) {
                this.app.midiEventHandler.addLearnNoteListener(onMIDI);
            }
        }
    }
    
    stopLearning(learnButton) {
        // Remove learning state and return to default
        learnButton.classList.remove('btn-learn-learning');
        learnButton.classList.add('btn-learn-default');
        learnButton.textContent = 'Learn';
        
        // Remove any temporary MIDI listeners
        if (this.tempMIDIHandler) {
            if (this.type === 'cc') {
                if (this.app.midiEventHandler) {
                    this.app.midiEventHandler.removeLearnCCListener(this.tempMIDIHandler);
                }
            } else {
                if (this.app.midiEventHandler) {
                    this.app.midiEventHandler.removeLearnNoteListener(this.tempMIDIHandler);
                }
            }
            this.tempMIDIHandler = null;
        }
    }
    
    getMapping() {
        const mappings = this.type === 'cc' ? this.app.state.get('midiCCMappings') : this.app.state.get('midiNoteMappings');
        const defaultMapping = {
            channel: 0,
            value: this.config.defaultValue,
            target: '', // Always start with empty target
            p5Target: '', // Always start with empty P5 target
            shaderTarget: '' // Always start with empty Shader target
        };
        
        // If there's an existing mapping, use it but ensure targets are empty if not explicitly set
        const existingMapping = mappings[this.controlId];
        if (existingMapping) {
            return {
                ...existingMapping,
                target: existingMapping.target || '', // Ensure target is empty if not set
                p5Target: existingMapping.p5Target || '', // Ensure P5 target is empty if not set
                shaderTarget: existingMapping.shaderTarget || '' // Ensure Shader target is empty if not set
            };
        }
        
        return defaultMapping;
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
            const p5TargetSelect = document.getElementById(`midi-${this.controlId}-p5-target`);
            
            if (channelInput) channelInput.value = data.config.channel + 1;
            if (valueInput) valueInput.value = data.config.value;
            if (targetSelect) targetSelect.value = data.config.target || ''; // Handle empty target
            if (p5TargetSelect) p5TargetSelect.value = data.config.p5Target || ''; // Handle empty P5 target
        }
    }
    
    destroy() {
        // Clean up MIDI handlers
        if (this.midiHandler) {
            if (this.type === 'cc') {
                if (this.app.midiEventHandler) {
                    this.app.midiEventHandler.offCC(this.getMapping().value);
                }
            } else {
                if (this.app.midiEventHandler) {
                    this.app.midiEventHandler.offNote(this.getMapping().value);
                }
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
                    if (control.app.midiEventHandler) {
                        control.app.midiEventHandler.offCC(control.getMapping().value);
                    }
                } else {
                    if (control.app.midiEventHandler) {
                        control.app.midiEventHandler.offNote(control.getMapping().value);
                    }
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
    
    /**
     * Refresh P5 parameter dropdowns when sketch changes
     */
    refreshP5Parameters() {
        console.log('Refreshing P5 parameters in MIDI controls...');
        
        this.controls.forEach(control => {
            if (control.type === 'cc' || control.type === 'note') {
                const p5TargetSelect = document.getElementById(`midi-${control.controlId}-p5-target`);
                if (p5TargetSelect) {
                    const currentValue = p5TargetSelect.value;
                    const newOptions = control.generateP5Options();
                    p5TargetSelect.innerHTML = newOptions;
                    
                    // Try to restore the previous selection if it still exists
                    if (currentValue && p5TargetSelect.querySelector(`option[value="${currentValue}"]`)) {
                        p5TargetSelect.value = currentValue;
                    } else if (currentValue) {
                        // Parameter no longer exists, clear the mapping
                        console.log(`P5 parameter ${currentValue} no longer exists, clearing mapping`);
                        control.updateMapping({ p5Target: '' });
                    }
                }
            }
        });
    }

    /**
     * Refresh Shader parameter dropdowns when shader uniforms change
     */
    refreshShaderParameters() {
        console.log('Refreshing Shader parameters in MIDI controls...');
        this.controls.forEach(control => {
            if (control.type === 'cc' || control.type === 'note') {
                const selectId = `midi-${control.controlId}-shader-target`;
                const shaderTargetSelect = document.getElementById(selectId);
                if (shaderTargetSelect) {
                    const currentValue = shaderTargetSelect.value;
                    const newOptions = control.generateShaderOptions();
                    shaderTargetSelect.innerHTML = newOptions;
                    // Restore if still present; otherwise clear mapping
                    if (currentValue && shaderTargetSelect.querySelector(`option[value="${currentValue}"]`)) {
                        shaderTargetSelect.value = currentValue;
                    } else if (currentValue) {
                        control.updateMapping({ shaderTarget: '' });
                    }
                }
            }
        });
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
