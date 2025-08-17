/**
 * BlendModeConstants.js - Blend Mode Configuration and Constants
 * Defines blend modes for layer compositing with Three.js blending constants
 * and WebGL blend equations for proper layer mixing.
 */

import * as THREE from 'three';

/**
 * Available blend modes for layers
 */
export const BLEND_MODES = {
    NORMAL: 'normal',
    MULTIPLY: 'multiply',
    SCREEN: 'screen',
    OVERLAY: 'overlay',
    DARKEN: 'darken',
    LIGHTEN: 'lighten',
    COLOR_DODGE: 'color-dodge',
    COLOR_BURN: 'color-burn',
    HARD_LIGHT: 'hard-light',
    SOFT_LIGHT: 'soft-light',
    DIFFERENCE: 'difference',
    EXCLUSION: 'exclusion',
    HUE: 'hue',
    SATURATION: 'saturation',
    COLOR: 'color',
    LUMINOSITY: 'luminosity',
    ADD: 'add',
    SUBTRACT: 'subtract'
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
    [BLEND_MODES.OVERLAY]: {
        label: 'Overlay',
        description: 'Combines multiply and screen',
        category: 'contrast'
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
    [BLEND_MODES.COLOR_DODGE]: {
        label: 'Color Dodge',
        description: 'Brightens based on blend color',
        category: 'lighten'
    },
    [BLEND_MODES.COLOR_BURN]: {
        label: 'Color Burn',
        description: 'Darkens based on blend color',
        category: 'darken'
    },
    [BLEND_MODES.HARD_LIGHT]: {
        label: 'Hard Light',
        description: 'Strong overlay effect',
        category: 'contrast'
    },
    [BLEND_MODES.SOFT_LIGHT]: {
        label: 'Soft Light',
        description: 'Gentle overlay effect',
        category: 'contrast'
    },
    [BLEND_MODES.DIFFERENCE]: {
        label: 'Difference',
        description: 'Subtracts colors',
        category: 'special'
    },
    [BLEND_MODES.EXCLUSION]: {
        label: 'Exclusion',
        description: 'Similar to difference but softer',
        category: 'special'
    },
    [BLEND_MODES.HUE]: {
        label: 'Hue',
        description: 'Blend hue only',
        category: 'color'
    },
    [BLEND_MODES.SATURATION]: {
        label: 'Saturation',
        description: 'Blend saturation only',
        category: 'color'
    },
    [BLEND_MODES.COLOR]: {
        label: 'Color',
        description: 'Blend hue and saturation',
        category: 'color'
    },
    [BLEND_MODES.LUMINOSITY]: {
        label: 'Luminosity',
        description: 'Blend lightness only',
        category: 'color'
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
    }
};

/**
 * Map blend modes to Three.js blending constants
 * Some modes require custom shader implementation
 */
export const THREE_BLEND_MAPPING = {
    // ✅ WORKING - Native Three.js blend modes
    [BLEND_MODES.NORMAL]: {
        blending: THREE.NormalBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor
    },
    [BLEND_MODES.ADD]: {
        blending: THREE.AdditiveBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor
    },
    [BLEND_MODES.SUBTRACT]: {
        blending: THREE.SubtractiveBlending,
        blendEquation: THREE.SubtractEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor
    },
    [BLEND_MODES.MULTIPLY]: {
        blending: THREE.MultiplyBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.DstColorFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor
    },
    
    // ✅ WORKING - Custom WebGL blend equations
    [BLEND_MODES.SCREEN]: {
        // Screen: 1 - (1-src)*(1-dst) = src + dst - src*dst
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcColorFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor
    },
    [BLEND_MODES.DARKEN]: {
        // Darken: min(src, dst) - uses MIN equation
        blending: THREE.CustomBlending,
        blendEquation: THREE.MinEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneFactor
    },
    [BLEND_MODES.LIGHTEN]: {
        // Lighten: max(src, dst) - uses MAX equation  
        blending: THREE.CustomBlending,
        blendEquation: THREE.MaxEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneFactor
    },
    [BLEND_MODES.DIFFERENCE]: {
        // Difference: |src - dst| - approximate with reverse subtract
        blending: THREE.CustomBlending,
        blendEquation: THREE.ReverseSubtractEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneFactor
    }
};

/**
 * Blend modes that require custom shader implementation
 * These can't be achieved with simple Three.js blending modes
 */
export const CUSTOM_SHADER_BLEND_MODES = new Set([
    BLEND_MODES.OVERLAY,
    BLEND_MODES.COLOR_DODGE,
    BLEND_MODES.COLOR_BURN,
    BLEND_MODES.HARD_LIGHT,
    BLEND_MODES.SOFT_LIGHT,
    BLEND_MODES.EXCLUSION,
    BLEND_MODES.HUE,
    BLEND_MODES.SATURATION,
    BLEND_MODES.COLOR,
    BLEND_MODES.LUMINOSITY
]);

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
        material.blendEquation = mapping.blendEquation;
        material.blendSrc = mapping.blendSrc;
        material.blendDst = mapping.blendDst;
        
        // Apply alpha blend factors if specified
        if (mapping.blendSrcAlpha !== undefined) {
            material.blendSrcAlpha = mapping.blendSrcAlpha;
        }
        if (mapping.blendDstAlpha !== undefined) {
            material.blendDstAlpha = mapping.blendDstAlpha;
        }
        
        material.needsUpdate = true;
        console.log(`✅ Applied ${blendMode} blend mode using Three.js blending`);
    } else {
        console.log(`⚠️ Blend mode ${blendMode} requires custom shader implementation - using normal for now`);
        // Fallback to normal blending for unsupported modes
        const normalMapping = THREE_BLEND_MAPPING[BLEND_MODES.NORMAL];
        material.blending = normalMapping.blending;
        material.blendEquation = normalMapping.blendEquation;
        material.blendSrc = normalMapping.blendSrc;
        material.blendDst = normalMapping.blendDst;
        material.needsUpdate = true;
    }
}

/**
 * Create a custom blend material for complex blend modes
 * This creates a shader material that performs the blend operation
 */
export function createCustomBlendMaterial(blendMode, baseTexture, blendTexture) {
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        precision mediump float;
        uniform sampler2D baseTexture;
        uniform sampler2D blendTexture;
        uniform float opacity;
        varying vec2 vUv;
        
        ${generateBlendShaderCode(blendMode)}
        
        void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 blend = texture2D(blendTexture, vUv);
            
            vec3 result;
            ${getBlendFunctionCall(blendMode)}
            
            gl_FragColor = vec4(mix(base.rgb, result, blend.a * opacity), base.a);
        }
    `;
    
    return new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: baseTexture },
            blendTexture: { value: blendTexture },
            opacity: { value: 1.0 }
        },
        vertexShader,
        fragmentShader,
        transparent: true
    });
}

/**
 * Get the appropriate blend function call for the fragment shader
 */
function getBlendFunctionCall(blendMode) {
    switch (blendMode) {
        case BLEND_MODES.OVERLAY:
            return 'result = blendOverlay(base.rgb, blend.rgb);';
        case BLEND_MODES.COLOR_DODGE:
            return 'result = blendColorDodge(base.rgb, blend.rgb);';
        case BLEND_MODES.COLOR_BURN:
            return 'result = blendColorBurn(base.rgb, blend.rgb);';
        case BLEND_MODES.HARD_LIGHT:
            return 'result = blendHardLight(base.rgb, blend.rgb);';
        case BLEND_MODES.SOFT_LIGHT:
            return 'result = blendSoftLight(base.rgb, blend.rgb);';
        case BLEND_MODES.EXCLUSION:
            return 'result = blendExclusion(base.rgb, blend.rgb);';
        default:
            return 'result = blend.rgb;'; // Fallback to normal
    }
}

/**
 * Generate GLSL blend function for custom shader blend modes
 */
export function generateBlendShaderCode(blendMode) {
    switch (blendMode) {
        case BLEND_MODES.OVERLAY:
            return `
                vec3 blendOverlay(vec3 base, vec3 blend) {
                    return mix(
                        2.0 * base * blend,
                        1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
                        step(0.5, base)
                    );
                }
            `;
            
        case BLEND_MODES.DARKEN:
            return `
                vec3 blendDarken(vec3 base, vec3 blend) {
                    return min(base, blend);
                }
            `;
            
        case BLEND_MODES.LIGHTEN:
            return `
                vec3 blendLighten(vec3 base, vec3 blend) {
                    return max(base, blend);
                }
            `;
            
        case BLEND_MODES.COLOR_DODGE:
            return `
                vec3 blendColorDodge(vec3 base, vec3 blend) {
                    return base / (1.0 - blend + 0.001);
                }
            `;
            
        case BLEND_MODES.COLOR_BURN:
            return `
                vec3 blendColorBurn(vec3 base, vec3 blend) {
                    return 1.0 - (1.0 - base) / (blend + 0.001);
                }
            `;
            
        case BLEND_MODES.HARD_LIGHT:
            return `
                vec3 blendHardLight(vec3 base, vec3 blend) {
                    return mix(
                        2.0 * base * blend,
                        1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
                        step(0.5, blend)
                    );
                }
            `;
            
        case BLEND_MODES.SOFT_LIGHT:
            return `
                vec3 blendSoftLight(vec3 base, vec3 blend) {
                    return mix(
                        2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
                        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
                        step(0.5, blend)
                    );
                }
            `;
            
        case BLEND_MODES.DIFFERENCE:
            return `
                vec3 blendDifference(vec3 base, vec3 blend) {
                    return abs(base - blend);
                }
            `;
            
        case BLEND_MODES.EXCLUSION:
            return `
                vec3 blendExclusion(vec3 base, vec3 blend) {
                    return base + blend - 2.0 * base * blend;
                }
            `;
            
        default:
            return `
                vec3 blendNormal(vec3 base, vec3 blend) {
                    return blend;
                }
            `;
    }
}

/**
 * Check if blend mode requires custom shader implementation
 */
export function requiresCustomShader(blendMode) {
    return CUSTOM_SHADER_BLEND_MODES.has(blendMode);
}

/**
 * Get default blend mode
 */
export function getDefaultBlendMode() {
    return BLEND_MODES.NORMAL;
}
