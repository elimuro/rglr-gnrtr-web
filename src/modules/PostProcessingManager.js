/**
 * PostProcessingManager.js - Visual Effects and Post-Processing
 * This module manages all post-processing effects and visual enhancements including bloom, chromatic
 * aberration, vignette, grain, color grading, and anti-aliasing. It handles the creation and
 * configuration of post-processing passes, manages effect parameters, and ensures optimal
 * rendering performance while maintaining high visual quality.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// Custom shaders for additional effects
const ChromaticAberrationShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'offset': { value: new THREE.Vector2(0.001, 0.001) },
        'intensity': { value: 0.5 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 offset;
        uniform float intensity;
        varying vec2 vUv;
        
        void main() {
            vec2 uv = vUv;
            vec4 color = vec4(0.0);
            
            // Red channel
            color.r = texture2D(tDiffuse, uv + offset * intensity).r;
            // Green channel
            color.g = texture2D(tDiffuse, uv).g;
            // Blue channel
            color.b = texture2D(tDiffuse, uv - offset * intensity).b;
            color.a = 1.0;
            
            gl_FragColor = color;
        }
    `
};

const VignetteShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'intensity': { value: 0.5 },
        'radius': { value: 0.8 },
        'softness': { value: 0.3 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float intensity;
        uniform float radius;
        uniform float softness;
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float vignette = smoothstep(radius, radius - softness, dist);
            vignette = mix(1.0, vignette, intensity);
            gl_FragColor = color * vignette;
        }
    `
};

const GrainShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'intensity': { value: 0.1 },
        'time': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float intensity;
        uniform float time;
        varying vec2 vUv;
        
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            float noise = random(vUv + time) * 2.0 - 1.0;
            color.rgb += noise * intensity;
            gl_FragColor = color;
        }
    `
};

const ColorGradingShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'hue': { value: 0.0 },
        'saturation': { value: 1.0 },
        'brightness': { value: 1.0 },
        'contrast': { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float hue;
        uniform float saturation;
        uniform float brightness;
        uniform float contrast;
        varying vec2 vUv;
        
        vec3 rgb2hsv(vec3 c) {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        
        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Convert to HSV
            vec3 hsv = rgb2hsv(color.rgb);
            
            // Apply hue shift
            hsv.x = mod(hsv.x + hue, 1.0);
            
            // Apply saturation
            hsv.y = clamp(hsv.y * saturation, 0.0, 1.0);
            
            // Convert back to RGB
            color.rgb = hsv2rgb(hsv);
            
            // Apply brightness and contrast
            color.rgb = (color.rgb - 0.5) * contrast + 0.5;
            color.rgb *= brightness;
            
            gl_FragColor = color;
        }
    `
};

export class PostProcessingManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.composer = null;
        this.effects = new Map();
        this.enabledEffects = new Set();
        this.effectOrder = [];
        
        this.init();
    }

    init() {
        // Create effect composer
        this.composer = new EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Initialize effects
        this.setupEffects();
        
        // Set default enabled effects
        this.enabledEffects.add('bloom');
        this.enabledEffects.add('fxaa');
        
        // Update effect chain
        this.updateEffectChain();
    }

    setupEffects() {
        // Bloom effect
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.effects.set('bloom', bloomPass);
        
        // FXAA anti-aliasing
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * this.renderer.getPixelRatio());
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * this.renderer.getPixelRatio());
        this.effects.set('fxaa', fxaaPass);
        
        // Chromatic aberration
        const chromaticPass = new ShaderPass(ChromaticAberrationShader);
        this.effects.set('chromaticAberration', chromaticPass);
        
        // Vignette
        const vignettePass = new ShaderPass(VignetteShader);
        this.effects.set('vignette', vignettePass);
        
        // Film grain
        const grainPass = new ShaderPass(GrainShader);
        this.effects.set('grain', grainPass);
        
        // Color grading
        const colorGradingPass = new ShaderPass(ColorGradingShader);
        this.effects.set('colorGrading', colorGradingPass);
        
        // Set default effect order
        this.effectOrder = [
            'bloom',
            'chromaticAberration',
            'vignette',
            'grain',
            'colorGrading',
            'fxaa'
        ];
    }

    updateEffectChain() {
        // Clear all passes except render pass
        while (this.composer.passes.length > 1) {
            this.composer.removePass(this.composer.passes[1]);
        }
        
        // Add enabled effects in order
        for (const effectName of this.effectOrder) {
            if (this.enabledEffects.has(effectName)) {
                const effect = this.effects.get(effectName);
                if (effect) {
                    this.composer.addPass(effect);
                }
            }
        }
    }

    enableEffect(effectName) {
        if (this.effects.has(effectName)) {
            this.enabledEffects.add(effectName);
            this.updateEffectChain();
        }
    }

    disableEffect(effectName) {
        this.enabledEffects.delete(effectName);
        this.updateEffectChain();
    }

    toggleEffect(effectName) {
        if (this.enabledEffects.has(effectName)) {
            this.disableEffect(effectName);
        } else {
            this.enableEffect(effectName);
        }
    }

    isEffectEnabled(effectName) {
        return this.enabledEffects.has(effectName);
    }

    getEnabledEffects() {
        return Array.from(this.enabledEffects);
    }

    getAvailableEffects() {
        return Array.from(this.effects.keys());
    }

    // Effect parameter setters
    setBloomParameters(strength, radius, threshold) {
        const bloomPass = this.effects.get('bloom');
        if (bloomPass) {
            bloomPass.strength = strength;
            bloomPass.radius = radius;
            bloomPass.threshold = threshold;
        }
    }

    setChromaticAberrationParameters(offset, intensity) {
        const chromaticPass = this.effects.get('chromaticAberration');
        if (chromaticPass) {
            chromaticPass.material.uniforms.offset.value.copy(offset);
            chromaticPass.material.uniforms.intensity.value = intensity;
        }
    }

    setVignetteParameters(intensity, radius, softness) {
        const vignettePass = this.effects.get('vignette');
        if (vignettePass) {
            vignettePass.material.uniforms.intensity.value = intensity;
            vignettePass.material.uniforms.radius.value = radius;
            vignettePass.material.uniforms.softness.value = softness;
        }
    }

    setGrainParameters(intensity) {
        const grainPass = this.effects.get('grain');
        if (grainPass) {
            grainPass.material.uniforms.intensity.value = intensity;
        }
    }

    setColorGradingParameters(hue, saturation, brightness, contrast) {
        const colorGradingPass = this.effects.get('colorGrading');
        if (colorGradingPass) {
            colorGradingPass.material.uniforms.hue.value = hue;
            colorGradingPass.material.uniforms.saturation.value = saturation;
            colorGradingPass.material.uniforms.brightness.value = brightness;
            colorGradingPass.material.uniforms.contrast.value = contrast;
        }
    }

    updateGrainTime(time) {
        const grainPass = this.effects.get('grain');
        if (grainPass) {
            grainPass.material.uniforms.time.value = time;
        }
    }

    onWindowResize() {
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // Update FXAA resolution
        const fxaaPass = this.effects.get('fxaa');
        if (fxaaPass) {
            fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * this.renderer.getPixelRatio());
            fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * this.renderer.getPixelRatio());
        }
    }

    render() {
        if (this.composer) {
            this.composer.render();
        }
    }

    getComposer() {
        return this.composer;
    }

    // Get effect parameters for MIDI mapping
    getEffectParameters() {
        const params = {};
        
        // Bloom parameters
        const bloomPass = this.effects.get('bloom');
        if (bloomPass) {
            params.bloomStrength = bloomPass.strength;
            params.bloomRadius = bloomPass.radius;
            params.bloomThreshold = bloomPass.threshold;
        }
        
        // Chromatic aberration parameters
        const chromaticPass = this.effects.get('chromaticAberration');
        if (chromaticPass) {
            params.chromaticOffset = chromaticPass.material.uniforms.offset.value;
            params.chromaticIntensity = chromaticPass.material.uniforms.intensity.value;
        }
        
        // Vignette parameters
        const vignettePass = this.effects.get('vignette');
        if (vignettePass) {
            params.vignetteIntensity = vignettePass.material.uniforms.intensity.value;
            params.vignetteRadius = vignettePass.material.uniforms.radius.value;
            params.vignetteSoftness = vignettePass.material.uniforms.softness.value;
        }
        
        // Grain parameters
        const grainPass = this.effects.get('grain');
        if (grainPass) {
            params.grainIntensity = grainPass.material.uniforms.intensity.value;
        }
        
        // Color grading parameters
        const colorGradingPass = this.effects.get('colorGrading');
        if (colorGradingPass) {
            params.colorHue = colorGradingPass.material.uniforms.hue.value;
            params.colorSaturation = colorGradingPass.material.uniforms.saturation.value;
            params.colorBrightness = colorGradingPass.material.uniforms.brightness.value;
            params.colorContrast = colorGradingPass.material.uniforms.contrast.value;
        }
        
        return params;
    }

    // Set effect parameters from MIDI
    setEffectParameters(params) {
        if (params.bloomStrength !== undefined) {
            this.setBloomParameters(params.bloomStrength, params.bloomRadius || 0.4, params.bloomThreshold || 0.85);
        }
        if (params.chromaticIntensity !== undefined) {
            this.setChromaticAberrationParameters(params.chromaticOffset || new THREE.Vector2(0.001, 0.001), params.chromaticIntensity);
        }
        if (params.vignetteIntensity !== undefined) {
            this.setVignetteParameters(params.vignetteIntensity, params.vignetteRadius || 0.8, params.vignetteSoftness || 0.3);
        }
        if (params.grainIntensity !== undefined) {
            this.setGrainParameters(params.grainIntensity);
        }
        if (params.colorHue !== undefined || params.colorSaturation !== undefined || params.colorBrightness !== undefined || params.colorContrast !== undefined) {
            this.setColorGradingParameters(
                params.colorHue || 0.0,
                params.colorSaturation || 1.0,
                params.colorBrightness || 1.0,
                params.colorContrast || 1.0
            );
        }
    }
} 