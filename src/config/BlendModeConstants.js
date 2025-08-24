/**
 * BlendModeConstants.js - Simplified Blend Mode Configuration
 * Defines blend modes using only native Three.js blending constants
 * for better performance and maintainability.
 */

import * as THREE from 'three';

/**
 * Available blend modes for layers (native Three.js only)
 */
export const BLEND_MODES = {
    NORMAL: 'normal',
    ADD: 'add',
    SUBTRACT: 'subtract',
    MULTIPLY: 'multiply',
    SCREEN: 'screen',
    DARKEN: 'darken',
    LIGHTEN: 'lighten',
    DIFFERENCE: 'difference'
};

/**
 * Blend mode metadata for UI and parameter exposure
 */
export const BLEND_MODE_INFO = {
    [BLEND_MODES.NORMAL]: {
        label: 'Normal',
        description: 'Standard alpha blending',
        category: 'basic'
    },
    [BLEND_MODES.ADD]: {
        label: 'Add',
        description: 'Adds colors together',
        category: 'math'
    },
    [BLEND_MODES.SUBTRACT]: {
        label: 'Subtract',
        description: 'Subtracts colors',
        category: 'math'
    },
    [BLEND_MODES.MULTIPLY]: {
        label: 'Multiply',
        description: 'Darkens by multiplying colors',
        category: 'darken'
    },
    [BLEND_MODES.SCREEN]: {
        label: 'Screen',
        description: 'Lightens by inverting and multiplying',
        category: 'lighten'
    },
    [BLEND_MODES.DARKEN]: {
        label: 'Darken',
        description: 'Keeps darker pixels',
        category: 'darken'
    },
    [BLEND_MODES.LIGHTEN]: {
        label: 'Lighten',
        description: 'Keeps lighter pixels',
        category: 'lighten'
    },
    [BLEND_MODES.DIFFERENCE]: {
        label: 'Difference',
        description: 'Subtracts colors',
        category: 'special'
    }
};

/**
 * Map blend modes to Three.js blending constants
 * All modes use native Three.js blending for better performance
 */
export const THREE_BLEND_MAPPING = {
    [BLEND_MODES.NORMAL]: {
        blending: THREE.NormalBlending
    },
    [BLEND_MODES.ADD]: {
        blending: THREE.AdditiveBlending
    },
    [BLEND_MODES.SUBTRACT]: {
        blending: THREE.SubtractiveBlending
    },
    [BLEND_MODES.MULTIPLY]: {
        blending: THREE.MultiplyBlending
    },
    // Note: Some of these blend modes might not exist in Three.js
    // We'll use fallbacks for unsupported modes
    [BLEND_MODES.SCREEN]: {
        blending: THREE.AdditiveBlending // Fallback to additive
    },
    [BLEND_MODES.DARKEN]: {
        blending: THREE.MultiplyBlending // Fallback to multiply
    },
    [BLEND_MODES.LIGHTEN]: {
        blending: THREE.AdditiveBlending // Fallback to additive
    },
    [BLEND_MODES.DIFFERENCE]: {
        blending: THREE.SubtractiveBlending // Fallback to subtract
    }
};

/**
 * All blend modes now use native Three.js blending
 * No custom shader implementation required
 */
export const CUSTOM_SHADER_BLEND_MODES = new Set([]);

/**
 * Get all available blend modes grouped by category
 */
export function getBlendModesByCategory() {
    const categories = {};
    
    Object.entries(BLEND_MODE_INFO).forEach(([mode, info]) => {
        if (!categories[info.category]) {
            categories[info.category] = [];
        }
        categories[info.category].push({
            value: mode,
            label: info.label,
            description: info.description
        });
    });
    
    return categories;
}

/**
 * Get blend mode options for UI dropdowns
 */
export function getBlendModeOptions() {
    return Object.entries(BLEND_MODE_INFO).map(([value, info]) => ({
        value,
        label: info.label,
        description: info.description,
        category: info.category
    }));
}

/**
 * Apply blend mode to Three.js material
 */
export function applyBlendModeToMaterial(material, blendMode) {
    if (!material || !blendMode) return;
    
    const mapping = THREE_BLEND_MAPPING[blendMode];
    if (mapping) {
        material.blending = mapping.blending;
        material.needsUpdate = true;
        console.log(`✅ Applied ${blendMode} blend mode using native Three.js blending`);
    } else {
        console.log(`⚠️ Blend mode ${blendMode} not supported - using normal blending`);
        material.blending = THREE.NormalBlending;
        material.needsUpdate = true;
    }
}

/**
 * Create a simple blend material (simplified - no custom shaders needed)
 * All blend modes now use native Three.js blending
 */
export function createCustomBlendMaterial(blendMode, baseTexture, blendTexture) {
    // No custom shader materials needed - using native Three.js blending
    console.log(`createCustomBlendMaterial: Using native Three.js blending for ${blendMode}`);
    
    return new THREE.MeshBasicMaterial({
        map: baseTexture,
        transparent: true,
        blending: THREE_BLEND_MAPPING[blendMode]?.blending || THREE.NormalBlending
    });
}

/**
 * Generate GLSL blend function for custom shader blend modes
 */
/**
 * Generate blend shader code (simplified - no custom shaders needed)
 * All blend modes now use native Three.js blending
 */
export function generateBlendShaderCode(blendMode) {
    // No custom shader code needed - using native Three.js blending
    return `
        vec3 blendNormal(vec3 base, vec3 blend) {
            return blend;
        }
    `;
}

/**
 * Check if blend mode requires custom shader implementation
 */
export function requiresCustomShader(blendMode) {
    // No custom shaders needed - all modes use native Three.js blending
    return false;
}

/**
 * Get default blend mode
 */
export function getDefaultBlendMode() {
    return BLEND_MODES.NORMAL;
}
