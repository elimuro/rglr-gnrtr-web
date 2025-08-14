/**
 * LightingManager.js - Scene Lighting Setup and Management
 * This module handles all lighting-related functionality including light creation,
 * intensity updates, color management, and shadow configuration.
 * Extracted from Scene.js to improve modularity and separation of concerns.
 */

import * as THREE from 'three';
import { LIGHTING_PRESETS } from '../config/LightingPresets.js';

export class LightingManager {
    constructor(state) {
        this.state = state;
        
        // Light references for dynamic updates
        this.lights = {
            ambient: null,
            directional: null,
            point1: null,
            point2: null,
            rim: null,
            accent: null
        };
        
        // Scene reference will be set by Scene.js
        this.scene = null;
        
        // Use centralized lighting presets instead of hardcoded defaults
        this.defaultIntensities = {
            ambientLightIntensity: LIGHTING_PRESETS.default.ambient.intensity,
            directionalLightIntensity: LIGHTING_PRESETS.default.directional.intensity,
            pointLight1Intensity: LIGHTING_PRESETS.default.pointLights.light1.intensity,
            pointLight2Intensity: LIGHTING_PRESETS.default.pointLights.light2.intensity,
            rimLightIntensity: LIGHTING_PRESETS.default.rim.intensity,
            accentLightIntensity: LIGHTING_PRESETS.default.accent.intensity
        };
        
        // Light configuration presets using centralized constants
        this.lightConfigs = {
            ambient: {
                type: 'AmbientLight',
                defaultColor: LIGHTING_PRESETS.default.ambient.color,
                position: null // Ambient lights don't have position
            },
            directional: {
                type: 'DirectionalLight',
                defaultColor: LIGHTING_PRESETS.default.directional.color,
                position: LIGHTING_PRESETS.default.directional.position,
                castShadow: true,
                shadowConfig: {
                    mapSize: LIGHTING_PRESETS.default.directional.shadow.mapSize,
                    camera: LIGHTING_PRESETS.default.directional.shadow.camera
                }
            },
            point1: {
                type: 'PointLight',
                defaultColor: LIGHTING_PRESETS.default.pointLights.light1.color,
                position: LIGHTING_PRESETS.default.pointLights.light1.position,
                distance: LIGHTING_PRESETS.default.pointLights.light1.distance
            },
            point2: {
                type: 'PointLight',
                defaultColor: LIGHTING_PRESETS.default.pointLights.light2.color,
                position: LIGHTING_PRESETS.default.pointLights.light2.position,
                distance: LIGHTING_PRESETS.default.pointLights.light2.distance,
                colorBlend: { color: LIGHTING_PRESETS.default.pointLights.light2.color, ratio: 0.7 }
            },
            rim: {
                type: 'DirectionalLight',
                defaultColor: LIGHTING_PRESETS.default.rim.color,
                position: LIGHTING_PRESETS.default.rim.position
            },
            accent: {
                type: 'PointLight',
                defaultColor: LIGHTING_PRESETS.default.accent.color,
                position: LIGHTING_PRESETS.default.accent.position,
                distance: LIGHTING_PRESETS.default.accent.distance,
                colorBlend: { color: LIGHTING_PRESETS.default.accent.color, ratio: 0.6 }
            }
        };
    }

    /**
     * Set the Three.js scene reference
     * @param {THREE.Scene} scene - The Three.js scene
     */
    setScene(scene) {
        this.scene = scene;
    }

    /**
     * Setup all lighting for the scene
     */
    setupLighting() {
        // Clear any existing lights
        this.clearLights();
        
        // Add safety check for state initialization
        if (!this.state.isInitialized()) {
            console.warn('StateManager not initialized, using default lighting values');
            this.setupDefaultLighting();
            return;
        }
        
        // Setup lights with state values
        this.setupStateLighting();
    }

    /**
     * Setup lighting with default values when state is not ready
     */
    setupDefaultLighting() {
        // Enhanced ambient light for better overall illumination
        const ambientLight = new THREE.AmbientLight(
            this.lightConfigs.ambient.defaultColor, 
            this.defaultIntensities.ambientLightIntensity
        );
        this.addLightToScene(ambientLight, 'ambient');

        // Main directional light for shadows and primary illumination
        const directionalLight = new THREE.DirectionalLight(
            this.lightConfigs.directional.defaultColor, 
            this.defaultIntensities.directionalLightIntensity
        );
        this.setupDirectionalLight(directionalLight, this.lightConfigs.directional);
        this.addLightToScene(directionalLight, 'directional');

        // Enhanced point light for refractive materials
        const pointLight = new THREE.PointLight(
            this.lightConfigs.point1.defaultColor, 
            this.defaultIntensities.pointLight1Intensity, 
            this.lightConfigs.point1.distance
        );
        this.setLightPosition(pointLight, this.lightConfigs.point1.position);
        this.addLightToScene(pointLight, 'point1');

        // Additional point light for better sphere illumination
        const pointLight2 = new THREE.PointLight(
            this.lightConfigs.point2.defaultColor, 
            this.defaultIntensities.pointLight2Intensity, 
            this.lightConfigs.point2.distance
        );
        this.setLightPosition(pointLight2, this.lightConfigs.point2.position);
        this.addLightToScene(pointLight2, 'point2');

        // Rim light for better sphere definition
        const rimLight = new THREE.DirectionalLight(
            this.lightConfigs.rim.defaultColor, 
            this.defaultIntensities.rimLightIntensity
        );
        this.setLightPosition(rimLight, this.lightConfigs.rim.position);
        this.addLightToScene(rimLight, 'rim');

        // Colored accent light for more interesting lighting
        const accentLight = new THREE.PointLight(
            this.lightConfigs.accent.defaultColor, 
            this.defaultIntensities.accentLightIntensity, 
            this.lightConfigs.accent.distance
        );
        this.setLightPosition(accentLight, this.lightConfigs.accent.position);
        this.addLightToScene(accentLight, 'accent');
    }

    /**
     * Setup lighting using state values
     */
    setupStateLighting() {
        // Get light color from state or use default
        const lightColor = this.state.get('lightColour') || '#ffffff';
        const lightColorHex = this.parseColor(lightColor);
        
        // Enhanced ambient light for better overall illumination
        const ambientLight = new THREE.AmbientLight(
            lightColorHex, 
            this.state.get('ambientLightIntensity')
        );
        this.addLightToScene(ambientLight, 'ambient');

        // Main directional light for shadows and primary illumination
        const directionalLight = new THREE.DirectionalLight(
            lightColorHex, 
            this.state.get('directionalLightIntensity')
        );
        this.setupDirectionalLight(directionalLight, this.lightConfigs.directional);
        this.addLightToScene(directionalLight, 'directional');

        // Enhanced point light for refractive materials
        const pointLight = new THREE.PointLight(
            lightColorHex, 
            this.state.get('pointLight1Intensity'), 
            this.lightConfigs.point1.distance
        );
        this.setLightPosition(pointLight, this.lightConfigs.point1.position);
        this.addLightToScene(pointLight, 'point1');

        // Additional point light for better sphere illumination (keep some blue tint)
        const pointLight2Color = this.blendColors(
            lightColorHex, 
            this.lightConfigs.point2.colorBlend.color, 
            this.lightConfigs.point2.colorBlend.ratio
        );
        const pointLight2 = new THREE.PointLight(
            pointLight2Color, 
            this.state.get('pointLight2Intensity'), 
            this.lightConfigs.point2.distance
        );
        this.setLightPosition(pointLight2, this.lightConfigs.point2.position);
        this.addLightToScene(pointLight2, 'point2');

        // Rim light for better sphere definition
        const rimLight = new THREE.DirectionalLight(
            lightColorHex, 
            this.state.get('rimLightIntensity')
        );
        this.setLightPosition(rimLight, this.lightConfigs.rim.position);
        this.addLightToScene(rimLight, 'rim');

        // Colored accent light for more interesting lighting (keep some red tint)
        const accentLightColor = this.blendColors(
            lightColorHex, 
            this.lightConfigs.accent.colorBlend.color, 
            this.lightConfigs.accent.colorBlend.ratio
        );
        const accentLight = new THREE.PointLight(
            accentLightColor, 
            this.state.get('accentLightIntensity'), 
            this.lightConfigs.accent.distance
        );
        this.setLightPosition(accentLight, this.lightConfigs.accent.position);
        this.addLightToScene(accentLight, 'accent');
    }

    /**
     * Setup directional light with shadow configuration
     * @param {THREE.DirectionalLight} light - The directional light
     * @param {Object} config - Light configuration
     */
    setupDirectionalLight(light, config) {
        this.setLightPosition(light, config.position);
        
        if (config.castShadow) {
            light.castShadow = true;
            light.shadow.mapSize.width = config.shadowConfig.mapSize.width;
            light.shadow.mapSize.height = config.shadowConfig.mapSize.height;
            light.shadow.camera.near = config.shadowConfig.camera.near;
            light.shadow.camera.far = config.shadowConfig.camera.far;
        }
    }

    /**
     * Set light position
     * @param {THREE.Light} light - The light object
     * @param {Object} position - Position object {x, y, z}
     */
    setLightPosition(light, position) {
        if (position && light.position) {
            light.position.set(position.x, position.y, position.z);
        }
    }

    /**
     * Add light to scene and store reference
     * @param {THREE.Light} light - The light object
     * @param {string} key - Light key for storage
     */
    addLightToScene(light, key) {
        if (this.scene) {
            this.scene.add(light);
        }
        this.lights[key] = light;
    }

    /**
     * Update lighting intensities and colors
     */
    updateLighting() {
        try {
            if (!this.lights) {
                console.warn('Lights not initialized yet');
                return;
            }
            
            // Get light color from state or use default
            const lightColor = this.state.get('lightColour') || '#ffffff';
            const lightColorHex = this.parseColor(lightColor);
            
            // Update all light intensities and colors
            this.updateIndividualLight('ambient', lightColorHex, this.state.get('ambientLightIntensity'));
            this.updateIndividualLight('directional', lightColorHex, this.state.get('directionalLightIntensity'));
            this.updateIndividualLight('point1', lightColorHex, this.state.get('pointLight1Intensity'));
            
            // Point light 2 with blue tint blend
            if (this.lights.point2) {
                this.lights.point2.intensity = this.state.get('pointLight2Intensity');
                const pointLight2Color = this.blendColors(lightColorHex, 0x87ceeb, 0.7);
                this.lights.point2.color.setHex(pointLight2Color);
            }
            
            this.updateIndividualLight('rim', lightColorHex, this.state.get('rimLightIntensity'));
            
            // Accent light with red tint blend
            if (this.lights.accent) {
                this.lights.accent.intensity = this.state.get('accentLightIntensity');
                const accentLightColor = this.blendColors(lightColorHex, 0xff6b6b, 0.6);
                this.lights.accent.color.setHex(accentLightColor);
            }
        } catch (error) {
            console.error('Error updating lighting:', error);
        }
    }

    /**
     * Update individual light intensity and color
     * @param {string} lightKey - Key of the light to update
     * @param {number} colorHex - Hex color value
     * @param {number} intensity - Light intensity
     */
    updateIndividualLight(lightKey, colorHex, intensity) {
        const light = this.lights[lightKey];
        if (light) {
            light.intensity = intensity;
            light.color.setHex(colorHex);
        }
    }

    /**
     * Blend two hex colors
     * @param {number} color1 - First color (hex)
     * @param {number} color2 - Second color (hex)
     * @param {number} ratio - Blend ratio (0-1)
     * @returns {number} Blended color (hex)
     */
    blendColors(color1, color2, ratio) {
        // Convert hex colors to RGB
        const r1 = (color1 >> 16) & 255;
        const g1 = (color1 >> 8) & 255;
        const b1 = color1 & 255;
        
        const r2 = (color2 >> 16) & 255;
        const g2 = (color2 >> 8) & 255;
        const b2 = color2 & 255;
        
        // Blend colors
        const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
        
        return (r << 16) | (g << 8) | b;
    }

    /**
     * Parse color string to hex number
     * @param {string} colorString - Color string (e.g., '#ffffff')
     * @returns {number} Hex color value
     */
    parseColor(colorString) {
        if (typeof colorString === 'string' && colorString.startsWith('#')) {
            return parseInt(colorString.replace('#', ''), 16);
        }
        return 0xffffff; // Default to white
    }

    /**
     * Clear all existing lights from the scene
     */
    clearLights() {
        Object.keys(this.lights).forEach(key => {
            const light = this.lights[key];
            if (light && this.scene) {
                this.scene.remove(light);
            }
            this.lights[key] = null;
        });
    }

    /**
     * Get specific light by key
     * @param {string} lightKey - Key of the light to get
     * @returns {THREE.Light|null} The light object
     */
    getLight(lightKey) {
        return this.lights[lightKey] || null;
    }

    /**
     * Get all lights
     * @returns {Object} Object containing all light references
     */
    getAllLights() {
        return { ...this.lights };
    }

    /**
     * Set light intensity
     * @param {string} lightKey - Key of the light
     * @param {number} intensity - New intensity value
     */
    setLightIntensity(lightKey, intensity) {
        const light = this.lights[lightKey];
        if (light) {
            light.intensity = intensity;
        }
    }

    /**
     * Set light color
     * @param {string} lightKey - Key of the light
     * @param {number|string} color - Color (hex number or string)
     */
    setLightColor(lightKey, color) {
        const light = this.lights[lightKey];
        if (light) {
            const colorHex = typeof color === 'string' ? this.parseColor(color) : color;
            light.color.setHex(colorHex);
        }
    }

    /**
     * Enable/disable shadows for directional lights
     * @param {boolean} enabled - Whether shadows should be enabled
     */
    setShadowsEnabled(enabled) {
        if (this.lights.directional) {
            this.lights.directional.castShadow = enabled;
        }
        if (this.lights.rim) {
            this.lights.rim.castShadow = enabled;
        }
    }

    /**
     * Update shadow map size
     * @param {number} size - New shadow map size (width and height)
     */
    setShadowMapSize(size) {
        if (this.lights.directional && this.lights.directional.shadow) {
            this.lights.directional.shadow.mapSize.width = size;
            this.lights.directional.shadow.mapSize.height = size;
        }
    }

    /**
     * Get lighting configuration for saving/loading
     * @returns {Object} Lighting configuration object
     */
    getLightingConfig() {
        const config = {};
        Object.keys(this.lights).forEach(key => {
            const light = this.lights[key];
            if (light) {
                config[key] = {
                    intensity: light.intensity,
                    color: light.color.getHex(),
                    position: light.position ? {
                        x: light.position.x,
                        y: light.position.y,
                        z: light.position.z
                    } : null,
                    type: light.type
                };
            }
        });
        return config;
    }

    /**
     * Apply lighting configuration
     * @param {Object} config - Lighting configuration object
     */
    applyLightingConfig(config) {
        Object.keys(config).forEach(key => {
            const lightConfig = config[key];
            const light = this.lights[key];
            
            if (light && lightConfig) {
                light.intensity = lightConfig.intensity;
                light.color.setHex(lightConfig.color);
                
                if (lightConfig.position && light.position) {
                    light.position.set(
                        lightConfig.position.x,
                        lightConfig.position.y,
                        lightConfig.position.z
                    );
                }
            }
        });
    }

    /**
     * Setup lighting event listeners
     */
    setupLightingEventListeners() {
        if (!this.state) return;
        
        // Subscribe to lighting state changes
        this.state.subscribe('ambientLightIntensity', () => this.updateLighting());
        this.state.subscribe('directionalLightIntensity', () => this.updateLighting());
        this.state.subscribe('pointLight1Intensity', () => this.updateLighting());
        this.state.subscribe('pointLight2Intensity', () => this.updateLighting());
        this.state.subscribe('rimLightIntensity', () => this.updateLighting());
        this.state.subscribe('accentLightIntensity', () => this.updateLighting());
        this.state.subscribe('lightColour', () => this.updateLighting());
    }

    /**
     * Clean up lighting manager resources
     */
    destroy() {
        this.clearLights();
        this.scene = null;
    }
}
