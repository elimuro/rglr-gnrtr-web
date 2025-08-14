/**
 * MaterialManager.js - Material and Rendering Management
 * This module manages all material creation, configuration, and updates for 3D objects in the scene,
 * including standard materials, refractive materials for spheres, and dynamic material properties.
 * It handles material optimization, texture management, and ensures consistent rendering quality
 * across different shape types and lighting conditions.
 */

import * as THREE from 'three';
import { MATERIAL_CONSTANTS } from '../config/MaterialConstants.js';

export class MaterialManager {
    constructor() {
        this.materialCache = new Map();
        this.envMap = null;
        this.createEnvironmentMap();
    }

    createEnvironmentMap() {
        // Create a water-like environment map with underwater distortion
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Create underwater-like gradient
        const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, '#e6f7ff');
        gradient.addColorStop(0.4, '#b3e0ff');
        gradient.addColorStop(0.6, '#80c9ff');
        gradient.addColorStop(0.8, '#4da6ff');
        gradient.addColorStop(1, '#1a85e6');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Add underwater caustics (light patterns)
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const size = Math.random() * 60 + 20;
            const opacity = Math.random() * 0.6 + 0.2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            
            // Create caustic-like patterns
            if (Math.random() > 0.7) {
                // Elongated ellipses for caustics
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.random() * Math.PI);
                ctx.scale(1, Math.random() * 0.5 + 0.3);
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.restore();
            } else {
                // Regular circles
                ctx.arc(x, y, size, 0, Math.PI * 2);
            }
            ctx.fill();
        }
        
        // Add surface ripples and waves
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const width = Math.random() * 200 + 100;
            const height = Math.random() * 20 + 5;
            const opacity = Math.random() * 0.3 + 0.1;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add some blue-tinted highlights for underwater effect
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const size = Math.random() * 40 + 10;
            
            ctx.fillStyle = `rgba(173, 216, 230, 0.4)`; // Light blue
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this.envMap = texture;
    }

    getBasicMaterial(color) {
        const cacheKey = `basic_${color}`;
        
        if (this.materialCache.has(cacheKey)) {
            return this.materialCache.get(cacheKey);
        }
        
        const material = new THREE.MeshBasicMaterial({ 
            color: color, 
            side: THREE.DoubleSide 
        });
        
        this.materialCache.set(cacheKey, material);
        return material;
    }

    getSphereMaterial(state) {
        const sphereRefraction = state.get('sphereRefraction');
        const sphereTransparency = state.get('sphereTransparency');
        const sphereTransmission = state.get('sphereTransmission');
        const sphereRoughness = state.get('sphereRoughness');
        const sphereMetalness = state.get('sphereMetalness');
        const sphereClearcoat = state.get('sphereClearcoat');
        const sphereClearcoatRoughness = state.get('sphereClearcoatRoughness');
        const sphereEnvMapIntensity = state.get('sphereEnvMapIntensity');
        const sphereWaterDistortion = state.get('sphereWaterDistortion');
        const sphereDistortionStrength = state.get('sphereDistortionStrength');
        const shapeColor = state.get('shapeColor');
        
        // Check if high performance mode is enabled
        const useHighPerformance = state.get('sphereHighPerformanceMode') || false;
        
        const cacheKey = `sphere_${sphereRefraction}_${sphereTransparency}_${sphereTransmission}_${sphereRoughness}_${sphereMetalness}_${sphereClearcoat}_${sphereClearcoatRoughness}_${sphereEnvMapIntensity}_${sphereWaterDistortion}_${sphereDistortionStrength}_${shapeColor}_${useHighPerformance}`;
        
        if (this.materialCache.has(cacheKey)) {
            return this.materialCache.get(cacheKey);
        }
        
        let material;
        
        if (useHighPerformance) {
            // High-performance MeshStandardMaterial (3-5x faster than MeshPhysicalMaterial)
            material = this.createHighPerformanceSphereMaterial(state);
        } else {
            // Original MeshPhysicalMaterial for maximum visual quality
            material = this.createHighQualitySphereMaterial(state);
        }
        
        // Cache management - clear old entries if cache is too large
        this.clearOldestCacheEntries();
        
        this.materialCache.set(cacheKey, material);
        return material;
    }

    createHighPerformanceSphereMaterial(state) {
        const sphereTransparency = state.get('sphereTransparency');
        const sphereRoughness = state.get('sphereRoughness');
        const sphereMetalness = state.get('sphereMetalness');
        const sphereEnvMapIntensity = state.get('sphereEnvMapIntensity');
        const sphereWaterDistortion = state.get('sphereWaterDistortion');
        const sphereDistortionStrength = state.get('sphereDistortionStrength');
        const shapeColor = state.get('shapeColor');
        
        // Use MeshStandardMaterial for much better performance
        const material = new THREE.MeshStandardMaterial({
            color: shapeColor,
            transparent: true,
            opacity: sphereTransparency,
            roughness: sphereRoughness,
            metalness: sphereMetalness,
            envMap: this.envMap,
            envMapIntensity: sphereEnvMapIntensity,
            side: THREE.DoubleSide
        });
        
        // Apply water-like effects using standard material properties
        if (sphereWaterDistortion) {
            // Simulate water effect with standard material properties
            material.roughness = Math.max(MATERIAL_CONSTANTS.sphere.roughness.minSmooth, sphereRoughness); // Very smooth
            material.metalness = Math.min(MATERIAL_CONSTANTS.distortion.transmissionBoost, sphereMetalness); // Reduce metalness for water
            material.envMapIntensity = sphereEnvMapIntensity + (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.envMapIntensityBoost);
            
            // Enhance reflectivity for water-like appearance
            material.roughness = Math.max(MATERIAL_CONSTANTS.sphere.roughness.min, material.roughness - (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.roughnessReduction));
        }
        
        return material;
    }

    createHighQualitySphereMaterial(state) {
        const sphereRefraction = state.get('sphereRefraction');
        const sphereTransparency = state.get('sphereTransparency');
        const sphereTransmission = state.get('sphereTransmission');
        const sphereRoughness = state.get('sphereRoughness');
        const sphereMetalness = state.get('sphereMetalness');
        const sphereClearcoat = state.get('sphereClearcoat');
        const sphereClearcoatRoughness = state.get('sphereClearcoatRoughness');
        const sphereEnvMapIntensity = state.get('sphereEnvMapIntensity');
        const sphereWaterDistortion = state.get('sphereWaterDistortion');
        const sphereDistortionStrength = state.get('sphereDistortionStrength');
        const shapeColor = state.get('shapeColor');
        
        // Water-like sphere material with enhanced distortion
        const material = new THREE.MeshPhysicalMaterial({
            color: shapeColor,
            transparent: true,
            opacity: sphereTransparency,
            roughness: sphereRoughness,
            metalness: sphereMetalness,
            ior: sphereRefraction, // Index of refraction (1.33 for water)
            transmission: sphereTransmission, // Transmission for refraction
            thickness: MATERIAL_CONSTANTS.sphere.thickness.default, // Increased thickness for more distortion
            envMap: this.envMap, // Environment map for refraction
            envMapIntensity: sphereEnvMapIntensity, // Configurable intensity
            side: THREE.DoubleSide,
            // Water-like properties
            clearcoat: sphereClearcoat, // Configurable clearcoat
            clearcoatRoughness: sphereClearcoatRoughness, // Configurable clearcoat roughness
            reflectivity: MATERIAL_CONSTANTS.sphere.reflectivity.default, // Very high reflectivity for water
            // Enhanced transmission properties for water effect
            attenuationDistance: MATERIAL_CONSTANTS.sphere.attenuationDistance.default, // Shorter distance for more intense effect
            attenuationColor: shapeColor,
            // Additional water properties
            premultipliedAlpha: false,
            // Enhanced for water-like appearance
            specularIntensity: MATERIAL_CONSTANTS.sphere.specularIntensity.default,
            specularColor: new THREE.Color(0xffffff)
        });
        
        // Add water-like properties for better visual effect
        if (sphereWaterDistortion) {
            // Base water properties
            material.roughness = Math.max(MATERIAL_CONSTANTS.sphere.roughness.minSmooth, sphereRoughness); // Very smooth
            material.metalness = Math.min(MATERIAL_CONSTANTS.distortion.transmissionBoost, sphereMetalness); // Reduce metalness for water
            material.transmission = Math.min(MATERIAL_CONSTANTS.sphere.transmission.max, sphereTransmission); // High transmission
            material.thickness = MATERIAL_CONSTANTS.sphere.thickness.water; // Thicker for more distortion
            material.ior = sphereRefraction; // Use user's refraction index
            material.clearcoat = Math.max(MATERIAL_CONSTANTS.sphere.clearcoat.water, sphereClearcoat); // High clearcoat for water shine
            material.clearcoatRoughness = Math.min(MATERIAL_CONSTANTS.sphere.clearcoatRoughness.water, sphereClearcoatRoughness); // Very smooth clearcoat
            
            // Apply distortion strength to material properties
            if (sphereDistortionStrength > 0) {
                // Increase thickness for more distortion using constants
                material.thickness = MATERIAL_CONSTANTS.sphere.thickness.water + (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.thicknessMultiplier);
                
                // Adjust transmission based on distortion strength (higher = more transparent)
                material.transmission = Math.min(MATERIAL_CONSTANTS.sphere.transmission.max, material.transmission + (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.transmissionBoost));
                
                // Adjust IOR for more dramatic refraction (builds on base value)
                material.ior = sphereRefraction + (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.iorMultiplier);
                
                // Adjust clearcoat for more shine with distortion (capped at 1.0)
                material.clearcoat = Math.min(MATERIAL_CONSTANTS.sphere.clearcoat.max, material.clearcoat + (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.clearcoatBoost));
                
                // Adjust envMapIntensity for more dramatic environment reflection
                material.envMapIntensity = sphereEnvMapIntensity + (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.envMapIntensityBoost);
                
                // Add additional distortion effects for more comprehensive water-like appearance
                material.attenuationDistance = MATERIAL_CONSTANTS.sphere.attenuationDistance.default - (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.attenuationReduction); // Shorter distance for more intense effect
                material.specularIntensity = MATERIAL_CONSTANTS.sphere.specularIntensity.default + (sphereDistortionStrength * MATERIAL_CONSTANTS.distortion.specularBoost); // More specular highlights
            }
        }
        
        return material;
    }

    getLineMaterial(color = 0xff0000) {
        const cacheKey = `line_${color}`;
        
        if (this.materialCache.has(cacheKey)) {
            return this.materialCache.get(cacheKey);
        }
        
        const material = new THREE.LineBasicMaterial({ color: color });
        this.materialCache.set(cacheKey, material);
        return material;
    }

    clearCache() {
        // Dispose of all cached materials
        this.materialCache.forEach(material => {
            if (material.dispose) {
                material.dispose();
            }
        });
        this.materialCache.clear();
    }

    disposeMaterial(material) {
        if (material && material.dispose) {
            material.dispose();
        }
    }

    updateEnvironmentMap() {
        if (this.envMap) {
            this.envMap.dispose();
        }
        this.createEnvironmentMap();
        
        // Clear sphere material cache since env map changed
        const keysToRemove = [];
        this.materialCache.forEach((material, key) => {
            if (key.startsWith('sphere_')) {
                keysToRemove.push(key);
            }
        });
        
        keysToRemove.forEach(key => {
            const material = this.materialCache.get(key);
            this.disposeMaterial(material);
            this.materialCache.delete(key);
        });
    }

    getCacheSize() {
        return this.materialCache.size;
    }

    getCacheKeys() {
        return Array.from(this.materialCache.keys());
    }
    
    clearOldestCacheEntries() {
        const MAX_CACHE_SIZE = 100;
        if (this.materialCache.size > MAX_CACHE_SIZE) {
            // Remove oldest entries (simple FIFO approach)
            const keysToRemove = [];
            let count = 0;
            const removeCount = this.materialCache.size - MAX_CACHE_SIZE + 10; // Remove extra to make room
            
            for (const key of this.materialCache.keys()) {
                if (count >= removeCount) break;
                keysToRemove.push(key);
                count++;
            }
            
            keysToRemove.forEach(key => {
                const material = this.materialCache.get(key);
                this.disposeMaterial(material);
                this.materialCache.delete(key);
            });
            
            console.log(`Cleared ${keysToRemove.length} old cache entries. Cache size: ${this.materialCache.size}`);
        }
    }
    
    getCacheStats() {
        return {
            size: this.materialCache.size,
            keys: this.getCacheKeys(),
            maxSize: 100
        };
    }

} 