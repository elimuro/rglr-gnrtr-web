import * as THREE from 'three';

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
        const shapeColor = state.get('shapeColor');
        
        const cacheKey = `sphere_${sphereRefraction}_${sphereTransparency}_${sphereTransmission}_${sphereRoughness}_${sphereMetalness}_${sphereClearcoat}_${sphereClearcoatRoughness}_${sphereEnvMapIntensity}_${sphereWaterDistortion}_${shapeColor}`;
        
        console.log('Getting sphere material with refraction:', sphereRefraction, 'cache key:', cacheKey);
        
        if (this.materialCache.has(cacheKey)) {
            console.log('Using cached material');
            return this.materialCache.get(cacheKey);
        }
        
        // Water-like sphere material with enhanced distortion
        const material = new THREE.MeshPhysicalMaterial({
            color: shapeColor,
            transparent: true,
            opacity: sphereTransparency,
            roughness: sphereRoughness,
            metalness: sphereMetalness,
            ior: sphereRefraction, // Index of refraction (1.33 for water)
            transmission: sphereTransmission, // Transmission for refraction
            thickness: 0.5, // Increased thickness for more distortion
            envMap: this.envMap, // Environment map for refraction
            envMapIntensity: sphereEnvMapIntensity, // Configurable intensity
            side: THREE.DoubleSide,
            // Water-like properties
            clearcoat: sphereClearcoat, // Configurable clearcoat
            clearcoatRoughness: sphereClearcoatRoughness, // Configurable clearcoat roughness
            reflectivity: 0.9, // Very high reflectivity for water
            // Enhanced transmission properties for water effect
            attenuationDistance: 0.5, // Shorter distance for more intense effect
            attenuationColor: shapeColor,
            // Additional water properties
            premultipliedAlpha: false,
            // Enhanced for water-like appearance
            specularIntensity: 1.0,
            specularColor: new THREE.Color(0xffffff)
        });
        
        console.log('Creating new sphere material with IOR:', sphereRefraction);
        
        // Add water-like properties for better visual effect
        if (state.get('sphereWaterDistortion')) {
            // Adjust material properties for water-like appearance
            material.roughness = Math.max(0.05, material.roughness); // Very smooth
            material.metalness = 0.0; // No metalness for water
            material.transmission = Math.min(0.98, material.transmission); // High transmission
            material.thickness = 0.8; // Thicker for more distortion
            material.ior = 1.33; // Water refraction index
            material.clearcoat = 0.9; // High clearcoat for water shine
            material.clearcoatRoughness = 0.02; // Very smooth clearcoat
            
            console.log('Water-like properties applied');
        }
        
        this.materialCache.set(cacheKey, material);
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

} 