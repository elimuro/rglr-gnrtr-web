/**
 * MIDIEventHandler.js - Centralized MIDI Event Processing
 * This module handles all MIDI event processing, including CC (Continuous Controller) and Note messages.
 * It provides a unified interface for MIDI event handling, parameter mapping, and action triggering.
 * Extracted from the scattered MIDI handling logic in App.js and midi-controls.js to improve modularity.
 */

import { ParameterMapper } from './ParameterMapper.js';
import { MIDI_CONSTANTS } from '../config/index.js';

export class MIDIEventHandler {
    constructor(app) {
        this.app = app;
        this.learnCCListeners = new Set();
        this.learnNoteListeners = new Set();
        this.ccHandlers = new Map(); // controller -> handler
        this.noteHandlers = new Map(); // note -> handler
        this.tempHandlers = new Map(); // temporary handlers for learning
    }

    /**
     * Handle MIDI CC (Continuous Controller) events
     * @param {number} controller - CC controller number (0-127)
     * @param {number} value - CC value (0-127)
     * @param {number} channel - MIDI channel (0-15)
     */
    onMIDICC(controller, value, channel) {
        // Call learn listeners for CC learning mode
        if (this.learnCCListeners.size > 0) {
            this.learnCCListeners.forEach(callback => {
                try {
                    callback(controller, value, channel);
                } catch (error) {
                    console.error('Error in CC learn listener:', error);
                }
            });
        }

        // Call registered CC handlers
        const handler = this.ccHandlers.get(controller);
        if (handler) {
            try {
                handler(controller, value, channel);
            } catch (error) {
                console.error('Error in CC handler:', error);
            }
        }

        // Process CC mappings from state
        this.processCCMappings(controller, value, channel);
    }

    /**
     * Handle MIDI Note events
     * @param {number} note - Note number (0-127)
     * @param {number} velocity - Note velocity (0-127)
     * @param {boolean} isNoteOn - Whether this is a note on event
     * @param {number} channel - MIDI channel (0-15)
     */
    onMIDINote(note, velocity, isNoteOn, channel) {
        // Call learn listeners for note learning mode
        if (this.learnNoteListeners.size > 0) {
            this.learnNoteListeners.forEach(callback => {
                try {
                    callback(note, velocity, isNoteOn, channel);
                } catch (error) {
                    console.error('Error in note learn listener:', error);
                }
            });
        }

        // Call registered note handlers
        const handler = this.noteHandlers.get(note);
        if (handler) {
            try {
                handler(note, velocity, isNoteOn, channel);
            } catch (error) {
                console.error('Error in note handler:', error);
            }
        }

        // Process note mappings from state
        this.processNoteMappings(note, velocity, isNoteOn, channel);
    }

    /**
     * Process CC mappings from the application state
     * @param {number} controller - CC controller number
     * @param {number} value - CC value
     * @param {number} channel - MIDI channel
     */
    processCCMappings(controller, value, channel) {
        const ccMappings = this.app.state.get('midiCCMappings') || {};
        
        Object.entries(ccMappings).forEach(([controlId, mapping]) => {
            if (mapping && mapping.channel === channel && mapping.value === controller) {
                this.handleCCMapping(controlId, mapping, value);
            }
        });
    }

    /**
     * Process note mappings from the application state
     * @param {number} note - Note number
     * @param {number} velocity - Note velocity
     * @param {boolean} isNoteOn - Whether this is a note on event
     * @param {number} channel - MIDI channel
     */
    processNoteMappings(note, velocity, isNoteOn, channel) {
        const noteMappings = this.app.state.get('midiNoteMappings') || {};
        
        Object.entries(noteMappings).forEach(([controlId, mapping]) => {
            if (mapping && mapping.channel === channel && mapping.value === note) {
                this.handleNoteMapping(controlId, mapping, velocity, isNoteOn);
            }
        });
    }

    /**
     * Handle CC mapping for a specific control
     * @param {string} controlId - Control identifier
     * @param {Object} mapping - Mapping configuration
     * @param {number} midiValue - Raw MIDI value (0-127)
     */
    handleCCMapping(controlId, mapping, midiValue) {
        try {
            console.log(`MIDIEventHandler: CC${controlId} Raw=${midiValue}`);
            
            // Handle primary target
            if (mapping.target && mapping.target.trim() !== '') {
                console.log(`→ Primary target: ${mapping.target}`);
                
                // Use existing normalization for grid parameters
                const normalizedValue = this.normalizeValue(midiValue, mapping.target);
                
                // Use ParameterMapper for grid parameters
                ParameterMapper.handleParameterUpdate(
                    mapping.target, 
                    normalizedValue, 
                    this.app.state, 
                    this.app.scene, 
                    'midi'
                );
            }
            
            // Handle P5 target
            if (mapping.p5Target && mapping.p5Target.trim() !== '') {
                console.log(`→ P5 target: ${mapping.p5Target}`);
                
                // Simple 0-1 normalization for P5 parameters
                const normalizedP5Value = midiValue / MIDI_CONSTANTS.ranges.controllers.max;
                console.log(`→ P5 normalized: ${normalizedP5Value.toFixed(3)}`);
                
                // Use App's updateAnimationParameter for P5 parameters
                this.app.updateAnimationParameter(mapping.p5Target, normalizedP5Value);
            }

            // Handle Shader target
            if (mapping.shaderTarget && mapping.shaderTarget.trim() !== '') {
                console.log(`→ Shader target: ${mapping.shaderTarget}`);
                
                // Simple 0-1 normalization for Shader parameters
                const normalizedShaderValue = midiValue / MIDI_CONSTANTS.ranges.controllers.max;
                console.log(`→ Shader normalized: ${normalizedShaderValue.toFixed(3)}`);
                
                // Use App's updateAnimationParameter for Shader parameters
                this.app.updateAnimationParameter(mapping.shaderTarget, normalizedShaderValue);
            }

            // Ensure changes are visible even when animation is paused
            if (this.app.scene && !this.app.animationLoop.getRunningState()) {
                this.app.scene.render();
            }

        } catch (error) {
            console.error(`Error handling CC mapping for ${controlId}:`, error);
        }
    }

    /**
     * Handle note mapping for a specific control
     * @param {string} controlId - Control identifier
     * @param {Object} mapping - Mapping configuration
     * @param {number} velocity - Note velocity
     * @param {boolean} isNoteOn - Whether this is a note on event
     */
    handleNoteMapping(controlId, mapping, velocity, isNoteOn) {
        try {
            if (!isNoteOn) return;

            // Primary target may be an action (e.g., tapTempo)
            if (mapping.target && mapping.target.trim() !== '') {
                this.triggerNoteAction(mapping.target, velocity);
            }

            // Toggle P5 boolean targets
            if (mapping.p5Target && mapping.p5Target.trim() !== '') {
                const current = this.app.getAnimationParameter(mapping.p5Target);
                const next = current > 0.5 ? 0.0 : 1.0;
                this.app.updateAnimationParameter(mapping.p5Target, next);
            }

            // Toggle Shader boolean targets
            if (mapping.shaderTarget && mapping.shaderTarget.trim() !== '') {
                const current = this.app.getAnimationParameter(mapping.shaderTarget);
                const next = current > 0.5 ? 0.0 : 1.0;
                this.app.updateAnimationParameter(mapping.shaderTarget, next);
            }
        } catch (error) {
            console.error(`Error handling note mapping for ${controlId}:`, error);
        }
    }

    /**
     * Normalize MIDI value to 0-1 range for parameter mapping
     * @param {number} midiValue - Raw MIDI value (0-127)
     * @param {string} target - Target parameter name
     * @returns {number} Normalized value (0-1)
     */
    normalizeValue(midiValue, target) {
        // Get parameter configuration for custom normalization
        const config = ParameterMapper.getParameterConfig(target);
        
        if (config && config.normalizeValue) {
            return config.normalizeValue(midiValue);
        }
        
        // Default normalization: convert 0-127 to 0-1 using MIDI constants
        return midiValue / MIDI_CONSTANTS.ranges.controllers.max;
    }

    /**
     * Trigger a note action for a specific target
     * @param {string} target - Target parameter or action
     * @param {number} velocity - Note velocity (0-127)
     */
    triggerNoteAction(target, velocity) {
        // Delegate to the App's triggerNoteAction method which handles all note actions
        if (this.app && this.app.triggerNoteAction) {
            this.app.triggerNoteAction(target);
        } else {
            // Fallback for basic actions if App method is not available
            const normalizedVelocity = velocity / MIDI_CONSTANTS.ranges.velocity.max;
            
            switch (target) {
                case 'tapTempo':
                    if (this.app.onMIDITempoTap) {
                        this.app.onMIDITempoTap();
                    }
                    break;
                case 'randomness':
                    this.app.state.set('randomness', Math.random());
                    if (this.app.scene) {
                        this.app.scene.createGrid();
                    }
                    break;
                default:
                    // For other targets, use the ParameterMapper
                    ParameterMapper.handleParameterUpdate(
                        target, 
                        normalizedVelocity, 
                        this.app.state, 
                        this.app.scene, 
                        'note'
                    );
                    break;
            }
        }
    }

    /**
     * Register a CC handler for a specific controller
     * @param {number} controller - CC controller number
     * @param {Function} handler - Handler function
     */
    onCC(controller, handler) {
        this.ccHandlers.set(controller, handler);
    }

    /**
     * Unregister a CC handler
     * @param {number} controller - CC controller number
     */
    offCC(controller) {
        this.ccHandlers.delete(controller);
    }

    /**
     * Register a note handler for a specific note
     * @param {number} note - Note number
     * @param {Function} handler - Handler function
     */
    onNote(note, handler) {
        this.noteHandlers.set(note, handler);
    }

    /**
     * Unregister a note handler
     * @param {number} note - Note number
     */
    offNote(note) {
        this.noteHandlers.delete(note);
    }

    /**
     * Add a learn listener for CC events
     * @param {Function} callback - Learn callback function
     */
    addLearnCCListener(callback) {
        this.learnCCListeners.add(callback);
    }

    /**
     * Remove a learn listener for CC events
     * @param {Function} callback - Learn callback function
     */
    removeLearnCCListener(callback) {
        this.learnCCListeners.delete(callback);
    }

    /**
     * Add a learn listener for note events
     * @param {Function} callback - Learn callback function
     */
    addLearnNoteListener(callback) {
        this.learnNoteListeners.add(callback);
    }

    /**
     * Remove a learn listener for note events
     * @param {Function} callback - Learn callback function
     */
    removeLearnNoteListener(callback) {
        this.learnNoteListeners.delete(callback);
    }

    /**
     * Clear all learn listeners
     */
    clearLearnListeners() {
        this.learnCCListeners.clear();
        this.learnNoteListeners.clear();
    }

    /**
     * Test CC values by triggering all configured mappings
     */
    testCCValues() {
        const ccMappings = this.app.state.get('midiCCMappings') || {};
        
        Object.entries(ccMappings).forEach(([controlId, mapping]) => {
            if (mapping && mapping.target) {
                // Simulate a CC value of default velocity (middle value)
                this.handleCCMapping(controlId, mapping, MIDI_CONSTANTS.defaults.velocity);
            }
        });
    }

    /**
     * Clean up all handlers and listeners
     */
    destroy() {
        this.ccHandlers.clear();
        this.noteHandlers.clear();
        this.tempHandlers.clear();
        this.clearLearnListeners();
    }
}
