/**
 * Configuration System - Main Export
 * 
 * Centralizes all configuration constants to eliminate hardcoded values
 * throughout the rglr_gnrtr_web codebase.
 * 
 * This system provides:
 * - Single source of truth for all configuration values
 * - Self-documenting configuration with inline comments
 * - Easy tuning and experimentation
 * - Foundation for preset systems
 */

// GUI Control Configurations
export { GUI_CONTROL_CONFIGS } from './GuiConstants.js';

// Performance System Constants
export { PERFORMANCE_CONSTANTS } from './PerformanceConstants.js';

// Audio and Musical Constants
export { MUSICAL_CONSTANTS, AUDIO_PROCESSING } from './AudioConstants.js';

// Animation and Mathematical Constants
export { ANIMATION_CONSTANTS } from './AnimationConstants.js';

// Lighting System Presets
export { LIGHTING_PRESETS } from './LightingPresets.js';

// Default Scene Configuration
export { DEFAULT_SCENE_CONFIG } from './DefaultSceneConfig.js';

// MIDI System Constants
export { MIDI_CONSTANTS } from './MidiConstants.js';

// Material System Constants
export { MATERIAL_CONSTANTS } from './MaterialConstants.js';



/**
 * Configuration Helper Utilities
 * Provides utility functions for working with configuration objects
 */
export class ConfigHelpers {
    /**
     * Get GUI control config with validation
     * @param {string} parameterName - Name of the parameter to get config for
     * @returns {object} Configuration object with min, max, step, default
     */
    static getGuiConfig(parameterName) {
        const config = GUI_CONTROL_CONFIGS[parameterName];
        if (!config) {
            console.warn(`No GUI config found for parameter: ${parameterName}`);
            return { min: 0, max: 1, step: 0.01, default: 0 };
        }
        return config;
    }
    
    /**
     * Validate value against config range
     * @param {string} parameterName - Name of the parameter to validate
     * @param {number} value - Value to validate
     * @returns {number} Clamped value within valid range
     */
    static validateValue(parameterName, value) {
        const config = this.getGuiConfig(parameterName);
        return Math.max(config.min, Math.min(config.max, value));
    }
}
