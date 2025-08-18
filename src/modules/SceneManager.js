/**
 * SceneManager.js - Scene Loading and Management
 * This module handles all scene-related functionality including loading, saving,
 * validation, and discovery of visual scene presets.
 * Extracted from App.js to improve modularity and separation of concerns.
 */

import { ParameterMapper } from './ParameterMapper.js';

export class SceneManager {
    constructor(app) {
        this.app = app;
        this.domCache = app.domCache;
        this.state = app.state;
        
        // Known scene files for fallback discovery
        this.knownSceneFiles = [
            'ambient-dream', 
            'cyberpunk-night', 
            'minimalist-zen', 
            'mirage', 
            'meat'
        ];
        
        // Short names to try during systematic discovery
        this.shortNames = [
            'test', 'demo', 'new', 'old', 'temp', 'backup', 'copy', 'final', 'draft',
            'work', 'play', 'fun', 'run', 'walk', 'jump', 'fly', 'swim', 'dance',
            'red', 'blue', 'green', 'fire', 'water', 'earth', 'air', 'light', 'dark',
            'sun', 'moon', 'star', 'tree', 'rock', 'bird', 'fish', 'cat', 'dog',
            'car', 'bus', 'train', 'plane', 'boat', 'bike', 'road', 'path', 'door',
            'book', 'page', 'word', 'line', 'dot', 'spot', 'mark', 'sign', 'note'
        ];
    }

    /**
     * Initialize scene management functionality
     */
    setupSceneManagement() {
        this.setupEventListeners();
        this.loadAvailableScenePresets();
    }

    /**
     * Set up event listeners for scene controls
     */
    setupEventListeners() {
        // Scene preset selector
        const scenePresetSelect = this.domCache.getElement('scene-preset-select');
        if (scenePresetSelect) {
            scenePresetSelect.addEventListener('change', (e) => {
                this.applyScenePreset(e.target.value);
            });
        }

        // Scene save/load buttons
        const saveSceneButton = this.domCache.getElement('save-scene-button');
        if (saveSceneButton) {
            saveSceneButton.addEventListener('click', () => {
                this.saveScene();
            });
        }

        const loadSceneButton = this.domCache.getElement('load-scene-button');
        if (loadSceneButton) {
            loadSceneButton.addEventListener('click', () => {
                this.loadScene();
            });
        }

        // Randomize buttons
        const randomizeAllButton = this.domCache.getElement('randomize-all-button');
        if (randomizeAllButton) {
            randomizeAllButton.addEventListener('click', () => {
                this.randomizeVisualParameters();
            });
        }

        const randomizeColorsButton = this.domCache.getElement('randomize-colors-button');
        if (randomizeColorsButton) {
            randomizeColorsButton.addEventListener('click', () => {
                this.randomizeColors();
            });
        }

        const randomizeShapesButton = this.domCache.getElement('randomize-shapes-button');
        if (randomizeShapesButton) {
            randomizeShapesButton.addEventListener('click', () => {
                this.randomizeShapes();
            });
        }

        const randomizeAnimationsButton = this.domCache.getElement('randomize-animations-button');
        if (randomizeAnimationsButton) {
            randomizeAnimationsButton.addEventListener('click', () => {
                this.randomizeAnimations();
            });
        }

        const randomizeShadersButton = this.domCache.getElement('randomize-shaders-button');
        if (randomizeShadersButton) {
            randomizeShadersButton.addEventListener('click', () => {
                this.randomizeShaders();
            });
        }

        const randomizePostProcessingButton = this.domCache.getElement('randomize-postprocessing-button');
        if (randomizePostProcessingButton) {
            randomizePostProcessingButton.addEventListener('click', () => {
                this.randomizePostProcessing();
            });
        }

        const randomizeMaterialsButton = this.domCache.getElement('randomize-materials-button');
        if (randomizeMaterialsButton) {
            randomizeMaterialsButton.addEventListener('click', () => {
                this.randomizeMaterials();
            });
        }
    }

    /**
     * Save current scene to file
     */
    saveScene() {
        try {
            const sceneData = this.state.exportScene();
            sceneData.name = 'Visual Settings';
            sceneData.timestamp = new Date().toISOString();
            
            // Create and download file (like MIDI preset system)
            const dataStr = JSON.stringify(sceneData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `rglr-visual-settings-${Date.now()}.json`;
            link.click();
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
            
            alert('Visual settings downloaded successfully!');
        } catch (error) {
            console.error('Error saving scene:', error);
            alert('Error saving scene. Please try again.');
        }
    }
    
    /**
     * Load scene from file
     */
    loadScene() {
        // Trigger file input for loading scene file
        this.domCache.getElement('preset-file-input').click();
    }
    
    /**
     * Load scene from file data
     * @param {Object} sceneData - The scene data to load
     */
    async loadSceneFile(sceneData) {
        try {
            // Get interpolation duration from UI
            const interpolationDurationInput = this.domCache.getElement('interpolation-duration');
            const duration = interpolationDurationInput ? parseFloat(interpolationDurationInput.value) : 2.0;
            
            // Get interpolation easing from UI
            const interpolationEasingSelect = this.domCache.getElement('interpolation-easing');
            const easing = interpolationEasingSelect ? interpolationEasingSelect.value : 'power2.inOut';
            
            const success = await this.state.importSceneWithInterpolation(sceneData, duration, easing);
            
            if (!success) {
                console.error('Error loading scene. Please check the file format.');
            }
        } catch (error) {
            console.error('Error loading scene file:', error);
            alert('Error loading scene file. Please check the file format.');
        }
    }

    /**
     * Apply a scene preset from the server
     * @param {string} presetName - Name of the scene preset to apply
     */
    async applyScenePreset(presetName) {
        if (!presetName) {
            return;
        }

        try {
            // Try to load the scene preset
            const response = await fetch(`/scenes/${presetName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load scene preset: ${response.statusText}`);
            }
            
            const sceneData = await response.json();
            
            // Validate the scene data
            if (!this.validateScenePreset(sceneData)) {
                throw new Error('Invalid scene preset format');
            }
            
            // Get interpolation duration from UI
            const interpolationDurationInput = this.domCache.getElement('interpolation-duration');
            const duration = interpolationDurationInput ? parseFloat(interpolationDurationInput.value) : 2.0;
            
            // Get interpolation easing from UI
            const interpolationEasingSelect = this.domCache.getElement('interpolation-easing');
            const easing = interpolationEasingSelect ? interpolationEasingSelect.value : 'power2.inOut';
            
            // Apply the scene preset with interpolation
            const success = this.state.importSceneWithInterpolation(sceneData, duration, easing);
            
            if (success) {
                await this.showScenePresetFeedback(presetName);
            } else {
                throw new Error('Failed to apply scene preset');
            }
            
        } catch (error) {
            console.error('Error applying scene preset:', error);
            alert(`Error loading scene preset: ${error.message}`);
        }
    }

    /**
     * Validate scene preset format
     * @param {Object} sceneData - The scene data to validate
     * @returns {boolean} True if valid
     */
    validateScenePreset(sceneData) {
        // Check if the scene data has the required structure
        if (!sceneData || typeof sceneData !== 'object') {
            return false;
        }
        
        if (!sceneData.settings || typeof sceneData.settings !== 'object') {
            return false;
        }
        
        // Check for some essential settings that actually exist in the scene files
        const requiredSettings = ['movementAmplitude', 'gridWidth', 'gridHeight'];
        for (const setting of requiredSettings) {
            if (typeof sceneData.settings[setting] === 'undefined') {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Show feedback notification for applied scene preset
     * @param {string} presetName - Name of the applied preset
     */
    async showScenePresetFeedback(presetName) {
        // Get the display name
        const displayName = await this.getScenePresetDisplayName(presetName);
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transform transition-all duration-300';
        notification.textContent = `Scene preset "${displayName}" applied`;
        
        document.body.appendChild(notification);
        
        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Get display name for a scene preset
     * @param {string} presetName - Internal preset name
     * @returns {Promise<string>} Display name
     */
    getScenePresetDisplayName(presetName) {
        // Try to get the display name from the scene file itself
        return this.getScenePresetDisplayNameFromFile(presetName).catch(() => {
            // Fallback to formatting the filename
            return this.formatScenePresetName(presetName);
        });
    }

    /**
     * Get display name from scene file
     * @param {string} presetName - Internal preset name
     * @returns {Promise<string>} Display name from file or formatted name
     */
    async getScenePresetDisplayNameFromFile(presetName) {
        try {
            const response = await fetch(`/scenes/${presetName}.json`);
            if (response.ok) {
                const sceneData = await response.json();
                if (sceneData.name) {
                    return sceneData.name;
                }
            }
        } catch (error) {
            // Fall back to formatting the filename
        }
        
        return this.formatScenePresetName(presetName);
    }

    /**
     * Format scene preset name for display
     * @param {string} presetName - Internal preset name
     * @returns {string} Formatted display name
     */
    formatScenePresetName(presetName) {
        // Convert filename to display name
        // e.g., "ambient-dream" -> "Ambient Dream"
        // e.g., "scene1" -> "Scene 1"
        // e.g., "a" -> "A"
        
        if (presetName.startsWith('scene')) {
            const number = presetName.replace('scene', '');
            return `Scene ${number}`;
        }
        
        if (presetName.length === 1 && /[a-z]/.test(presetName)) {
            return presetName.toUpperCase();
        }
        
        // Convert kebab-case to Title Case
        return presetName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Load available scene presets from server
     */
    async loadAvailableScenePresets() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use the proper discovery method that prioritizes index.json
        await this.discoverScenePresets();
    }

    /**
     * Discover available scene presets
     */
    async discoverScenePresets() {
        // First, try to load the index file which contains all available scenes
        try {
            const indexResponse = await fetch('/scenes/index.json');
            
            if (indexResponse.ok) {
                const indexData = await indexResponse.json();
                
                if (indexData.scenes && Array.isArray(indexData.scenes)) {
                    await this.validateAndUpdateScenePresets(indexData.scenes);
                    return;
                }
            }
        } catch (error) {
            // Scene index not available, trying directory listing
        }
        
        // Try to get a proper directory listing
        try {
            const response = await fetch('/scenes/');
            if (response.ok) {
                const text = await response.text();
                
                // Try multiple patterns to extract filenames from directory listing
                const patterns = [
                    /href="([^"]+\.json)"/g,           // Standard href pattern
                    /<a[^>]*>([^<]+\.json)<\/a>/g,    // Link text pattern
                    /([a-zA-Z0-9_-]+\.json)/g,         // Any .json filename
                    /"([^"]+\.json)"/g,                // Quoted filename pattern
                ];
                
                let foundFiles = [];
                
                for (const pattern of patterns) {
                    const matches = text.match(pattern);
                    if (matches) {
                        foundFiles = matches.map(match => {
                            // Extract just the filename without .json extension
                            const filename = match.replace(/href="|"|<a[^>]*>|<\/a>/g, '').replace('.json', '');
                            return filename;
                        }).filter(name => name.length > 0);
                        
                        if (foundFiles.length > 0) {
                            await this.validateAndUpdateScenePresets(foundFiles);
                            return;
                        }
                    }
                }
                
                // Alternative: try to parse the HTML structure
                const lines = text.split('\n');
                const jsonFiles = [];
                
                for (const line of lines) {
                    if (line.includes('.json')) {
                        // Extract filename from various HTML patterns
                        const filenameMatch = line.match(/([a-zA-Z0-9_-]+)\.json/);
                        if (filenameMatch) {
                            jsonFiles.push(filenameMatch[1]);
                        }
                    }
                }
                
                if (jsonFiles.length > 0) {
                    await this.validateAndUpdateScenePresets(jsonFiles);
                    return;
                }
            }
        } catch (error) {
            // Directory listing failed
        }
        
        // Fallback: try a systematic approach to find any .json files
        await this.systematicSceneDiscovery();
    }

    /**
     * Systematic scene discovery using known patterns
     */
    async systematicSceneDiscovery() {
        // This is a more intelligent approach that tries to discover files
        // by attempting common patterns and learning from successful finds
        
        const foundPresets = [];
        const triedNames = new Set();
        
        // First, try the known existing files
        for (const name of this.knownSceneFiles) {
            triedNames.add(name);
            try {
                const response = await fetch(`/scenes/${name}.json`);
                if (response.ok) {
                    const sceneData = await response.json();
                    if (this.validateScenePreset(sceneData)) {
                        foundPresets.push(name);
                    }
                }
            } catch (error) {
                // Silently continue
            }
        }
        
        // Try single letters (a-z)
        for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(97 + i);
            triedNames.add(letter);
            try {
                const response = await fetch(`/scenes/${letter}.json`);
                if (response.ok) {
                    const sceneData = await response.json();
                    if (this.validateScenePreset(sceneData)) {
                        foundPresets.push(letter);
                    }
                }
            } catch (error) {
                // Silently continue
            }
        }
        
        // Try common short names
        for (const name of this.shortNames) {
            if (!triedNames.has(name)) {
                triedNames.add(name);
                try {
                    const response = await fetch(`/scenes/${name}.json`);
                    if (response.ok) {
                        const sceneData = await response.json();
                        if (this.validateScenePreset(sceneData)) {
                            foundPresets.push(name);
                        }
                    }
                } catch (error) {
                    // Silently continue
                }
            }
        }
        
        this.updateScenePresetDropdown(foundPresets);
    }

    /**
     * Validate and update scene presets
     * @param {string[]} sceneNames - Array of scene names to validate
     */
    async validateAndUpdateScenePresets(sceneNames) {
        const validScenePresets = [];
        
        for (const sceneName of sceneNames) {
            try {
                const response = await fetch(`/scenes/${sceneName}.json`);
                
                if (response.ok) {
                    const sceneData = await response.json();
                    
                    if (this.validateScenePreset(sceneData)) {
                        validScenePresets.push(sceneName);
                    }
                }
            } catch (error) {
                // Error validating scene preset
            }
        }
        
        this.updateScenePresetDropdown(validScenePresets);
    }

    /**
     * Update the scene preset dropdown with available presets
     * @param {string[]} availableScenePresets - Array of available scene preset names
     */
    async updateScenePresetDropdown(availableScenePresets) {
        const select = this.domCache.getElement('scene-preset-select');
        if (!select) return;
        
        // Store current selection to restore after update
        const currentValue = select.value;
        
        // Clear all options
        select.innerHTML = '';
        
        // Add the default "Custom" option first
        const customOption = document.createElement('option');
        customOption.value = '';
        customOption.textContent = 'Custom';
        select.appendChild(customOption);
        
        // Add available scene presets with async display name resolution
        for (const scenePreset of availableScenePresets) {
            const option = document.createElement('option');
            option.value = scenePreset;
            
            try {
                const displayName = await this.getScenePresetDisplayNameFromFile(scenePreset);
                option.textContent = displayName;
            } catch (error) {
                // Fallback to formatted name
                option.textContent = this.formatScenePresetName(scenePreset);
            }
            
            select.appendChild(option);
        }
        
        // Restore the previous selection if it still exists
        if (currentValue && [...select.options].some(option => option.value === currentValue)) {
            select.value = currentValue;
        }
    }

    /**
     * Get current scene data
     * @returns {Object} Current scene data
     */
    getCurrentScene() {
        const sceneData = this.state.exportScene();
        sceneData.name = 'Visual Settings';
        sceneData.timestamp = new Date().toISOString();
        return sceneData;
    }

    /**
     * Export scene data as JSON string
     * @returns {string} JSON string of current scene
     */
    exportSceneAsString() {
        const sceneData = this.getCurrentScene();
        return JSON.stringify(sceneData, null, 2);
    }

    /**
     * Import scene from JSON string
     * @param {string} jsonString - JSON string of scene data
     * @returns {Promise<boolean>} True if import was successful
     */
    async importSceneFromString(jsonString) {
        try {
            const sceneData = JSON.parse(jsonString);
            if (this.validateScenePreset(sceneData)) {
                await this.loadSceneFile(sceneData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import scene from string:', error);
            return false;
        }
    }

    /**
     * Check if current scene matches a known preset
     * @param {string} presetName - Name of preset to check
     * @returns {Promise<boolean>} True if scenes match
     */
    async isCurrentScenePreset(presetName) {
        try {
            const response = await fetch(`/scenes/${presetName}.json`);
            if (!response.ok) return false;
            
            const presetData = await response.json();
            const currentData = this.getCurrentScene();
            
            // Compare the settings objects (excluding timestamps)
            const presetSettings = presetData.settings || {};
            const currentSettings = currentData.settings || {};
            
            return JSON.stringify(presetSettings) === JSON.stringify(currentSettings);
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear current scene to default state
     */
    clearScene() {
        // This would reset the scene to default values
        // Implementation depends on StateManager's capabilities
        if (this.state.resetToDefault) {
            this.state.resetToDefault();
        }
    }

    /**
     * Randomize all visual parameters
     */
    randomizeVisualParameters() {
        try {
            // Get all available parameters from ParameterMapper
            const availableParameters = ParameterMapper.getAvailableParameters();
            
            // Parameters to exclude from randomization (complex objects)
            const excludedParameters = [
                'enabledShapes', // This is an object, not a simple parameter
                'randomness' // Shape selection randomness - keep consistent for better shape distribution
            ];
            
            // Filter out excluded parameters
            const parametersToRandomize = availableParameters.filter(param => 
                !excludedParameters.includes(param)
            );
            
            console.log('🎲 Randomizing visual parameters:', parametersToRandomize.length, 'parameters');
            
            // Randomize each parameter
            parametersToRandomize.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize shape selection toggles
            this.randomizeShapeSelection();
            
            // Randomize layer parameters (blend modes, shader presets, etc.)
            this.randomizeLayerParameters();
            
            // Show feedback notification
            this.showRandomizationFeedback();
            
        } catch (error) {
            console.error('Error randomizing visual parameters:', error);
            alert('Error randomizing parameters. Please try again.');
        }
    }

    /**
     * Randomize a specific parameter based on its type
     * @param {string} paramName - Parameter name to randomize
     */
    randomizeParameter(paramName) {
        const config = ParameterMapper.getParameterConfig(paramName);
        if (!config) return;

        // Handle easing function separately since it's not numeric
        if (paramName === 'morphingEasing') {
            // Randomize easing function
            const easingOptions = [
                'power2.inOut', 'power1.inOut', 'power3.inOut', 'power4.inOut',
                'sine.inOut', 'back.inOut', 'elastic.inOut', 'bounce.inOut',
                'circ.inOut', 'expo.inOut'
            ];
            const randomEasing = easingOptions[Math.floor(Math.random() * easingOptions.length)];
            this.state.set(paramName, randomEasing);
            
        } else {
            // Handle all other parameters (including booleans) using ParameterMapper
            const randomValue = Math.random();
            ParameterMapper.handleParameterUpdate(
                paramName, 
                randomValue, 
                this.state, 
                this.app.scene, 
                'randomize'
            );
        }
    }

    /**
     * Randomize only color-related parameters
     */
    randomizeColors() {
        try {
            console.log('🎨 Randomizing colors...');
            
            // Color-related parameters
            const colorParameters = [
                'shapeColor',
                'backgroundColor', 
                'gridColor',
                'lightColour',
                'colorHue',
                'colorSaturation',
                'colorBrightness',
                'colorContrast'
            ];
            
            // Randomize each color parameter
            colorParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('🎨 Colors randomized!');
            
        } catch (error) {
            console.error('Error randomizing colors:', error);
        }
    }

    /**
     * Randomize only shape-related parameters
     */
    randomizeShapes() {
        try {
            console.log('🔷 Randomizing shapes...');
            
            // Shape-related parameters
            const shapeParameters = [
                'gridWidth',
                'gridHeight',
                'cellSize',
                'compositionWidth',
                'compositionHeight'
            ];
            
            // Randomize each shape parameter
            shapeParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize shape selection
            this.randomizeShapeSelection();
            
            this.showRandomizationFeedback('🔷 Shapes randomized!');
            
        } catch (error) {
            console.error('Error randomizing shapes:', error);
        }
    }

    /**
     * Randomize only animation-related parameters
     */
    randomizeAnimations() {
        try {
            console.log('⚡ Randomizing animations...');
            
            // Animation-related parameters
            const animationParameters = [
                'globalBPM',
                'animationSpeed',
                'movementAmplitude',
                'movementFrequency',
                'rotationAmplitude',
                'rotationFrequency',
                'scaleAmplitude',
                'scaleFrequency',
                'shapeCyclingSpeed',
                'shapeCyclingIntensity',
                'centerScalingIntensity',
                'centerScalingRadius',
                'centerScalingAnimationSpeed',
                'morphingIntensity',
                'morphingSpeed',
                'morphingEasing'
            ];
            
            // Animation boolean toggles
            const animationBooleans = [
                'enableShapeCycling',
                'enableSizeAnimation',
                'enableMovementAnimation',
                'enableRotationAnimation',
                'enableScaleAnimation',
                'centerScalingAnimation'
            ];
            
            // Randomize each animation parameter
            animationParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize animation booleans
            animationBooleans.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('⚡ Animations randomized!');
            
        } catch (error) {
            console.error('Error randomizing animations:', error);
        }
    }

    /**
     * Randomize only shader-related parameters
     */
    randomizeShaders() {
        try {
            console.log('🌊 Randomizing shaders...');
            
            // Randomize layer parameters (which includes shader presets)
            this.randomizeLayerParameters();
            
            this.showRandomizationFeedback('🌊 Shaders randomized!');
            
        } catch (error) {
            console.error('Error randomizing shaders:', error);
        }
    }

    /**
     * Randomize only post-processing parameters
     */
    randomizePostProcessing() {
        try {
            console.log('✨ Randomizing post-processing...');
            
            // Post-processing parameters
            const postProcessingParameters = [
                'bloomStrength',
                'bloomThreshold',
                'bloomRadius',
                'vignetteIntensity',
                'vignetteRadius',
                'vignetteSoftness',
                'chromaticIntensity',
                'grainIntensity'
            ];
            
            // Post-processing boolean toggles
            const postProcessingBooleans = [
                'postProcessingEnabled',
                'bloomEnabled',
                'vignetteEnabled',
                'chromaticAberrationEnabled',
                'grainEnabled'
            ];
            
            // Randomize each post-processing parameter
            postProcessingParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize post-processing booleans
            postProcessingBooleans.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('✨ Post-processing randomized!');
            
        } catch (error) {
            console.error('Error randomizing post-processing:', error);
        }
    }

    /**
     * Randomize only material-related parameters
     */
    randomizeMaterials() {
        try {
            console.log('💎 Randomizing materials...');
            
            // Material parameters
            const materialParameters = [
                'sphereRefraction',
                'sphereTransparency',
                'sphereTransmission',
                'sphereRoughness',
                'sphereMetalness',
                'sphereScale',
                'sphereClearcoat',
                'sphereClearcoatRoughness',
                'sphereEnvMapIntensity',
                'sphereDistortionStrength',
                'sphereHighPerformanceMode'
            ];
            
            // Material boolean toggles
            const materialBooleans = [
                'sphereWaterDistortion',
                'sphereHighPerformanceMode'
            ];
            
            // Randomize each material parameter
            materialParameters.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            // Randomize material booleans
            materialBooleans.forEach(paramName => {
                this.randomizeParameter(paramName);
            });
            
            this.showRandomizationFeedback('💎 Materials randomized!');
            
        } catch (error) {
            console.error('Error randomizing materials:', error);
        }
    }

    /**
     * Randomize shape selection toggles
     */
    randomizeShapeSelection() {
        try {
            const currentEnabledShapes = this.state.get('enabledShapes');
            if (!currentEnabledShapes) {
                console.warn('No enabledShapes found in state');
                return;
            }

            console.log('🎲 Randomizing shape selection...');

            // Available shape types
            const shapeTypes = [
                'Basic Shapes',
                'Triangles', 
                'Rectangles',
                'Ellipses',
                'Refractive Spheres'
            ];

            // Create new enabled shapes object
            const newEnabledShapes = {};

            // Randomize each shape type (70% chance to be enabled)
            shapeTypes.forEach(shapeType => {
                const randomEnabled = Math.random() > 0.3;
                newEnabledShapes[shapeType] = randomEnabled;
            });

            // Ensure at least one shape type is enabled
            const enabledCount = Object.values(newEnabledShapes).filter(Boolean).length;
            if (enabledCount === 0) {
                // If none enabled, enable a random one
                const randomShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
                newEnabledShapes[randomShape] = true;
                console.log(`🎲 No shapes enabled, enabling ${randomShape}`);
            }

            // Set the new enabled shapes
            this.state.set('enabledShapes', newEnabledShapes);

            // Trigger grid recreation to apply the new shape selection
            if (this.app.scene && this.app.scene.createGrid) {
                this.app.scene.createGrid();
            }

            console.log('🎲 Shape selection randomized:', newEnabledShapes);

        } catch (error) {
            console.error('Error randomizing shape selection:', error);
        }
    }

    /**
     * Randomize layer parameters (blend modes, shader presets, etc.)
     */
    randomizeLayerParameters() {
        if (!this.app.layerManager) {
            console.warn('LayerManager not available for layer parameter randomization');
            return;
        }

        const layers = this.app.layerManager.layers;
        console.log('🔍 LayerManager state:', {
            hasLayerManager: !!this.app.layerManager,
            layerCount: layers ? layers.size : 0,
            layerIds: layers ? Array.from(layers.keys()) : []
        });
        
        if (!layers || layers.size === 0) {
            console.log('No layers found for randomization');
            return;
        }

        console.log('🎨 Randomizing layer parameters for', layers.size, 'layers');

        // Available blend modes
        const blendModes = [
            'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
            'color-dodge', 'color-burn', 'hard-light', 'soft-light',
            'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity',
            'add', 'subtract'
        ];

        // Available shader presets
        const shaderPresets = [
            'default', 'noise', 'plasma', 'kaleidoscope', 'mandala',
            'voronoi', 'physarum', 'flocking', 'reaction-diffusion',
            'blend-test', 'test-boolean'
        ];

        // Randomize each layer
        layers.forEach((layer, layerId) => {
            try {
                console.log(`🎨 Randomizing layer ${layerId} (type: ${layer.constructor.name})`);
                
                // Randomize blend mode
                const randomBlendMode = blendModes[Math.floor(Math.random() * blendModes.length)];
                this.app.layerManager.setLayerParameter(layerId, 'blendMode', randomBlendMode);

                // Randomize visibility (80% chance to be visible)
                const randomVisible = Math.random() > 0.2;
                this.app.layerManager.setLayerParameter(layerId, 'visible', randomVisible);

                // Randomize Z offset for depth variation
                const randomZOffset = (Math.random() - 0.5) * 20; // -10 to 10
                this.app.layerManager.setLayerParameter(layerId, 'zOffset', randomZOffset);

                // For shader layers, randomize shader preset
                if (layer.constructor.name === 'ShaderLayer' || layer.compileShader) {
                    console.log(`🎨 Found ShaderLayer ${layerId}, randomizing shader preset...`);
                    this.randomizeShaderLayerPreset(layerId, shaderPresets);
                }

                // For P5 layers, randomize some parameters
                if (layer.constructor.name === 'P5TextureLayer' || layer.parameters) {
                    console.log(`🎨 Found P5TextureLayer ${layerId}, randomizing P5 parameters...`);
                    this.randomizeP5LayerParameters(layerId);
                }

            } catch (error) {
                console.warn(`Error randomizing layer ${layerId}:`, error);
            }
        });
    }

    /**
     * Randomize shader layer preset
     * @param {string} layerId - Layer ID
     * @param {string[]} availablePresets - Available preset keys
     */
    async randomizeShaderLayerPreset(layerId, availablePresets) {
        try {
            const randomPresetKey = availablePresets[Math.floor(Math.random() * availablePresets.length)];
            
            // Load the shader preset
            const response = await fetch(`/shaders/${randomPresetKey}.frag`);
            if (response.ok) {
                const shaderCode = await response.text();
                
                // Compile the shader code on the layer
                const layer = this.app.layerManager.layers.get(layerId);
                if (layer && layer.compileShader) {
                    await layer.compileShader(shaderCode);
                    console.log(`🎨 Set shader preset "${randomPresetKey}" for layer ${layerId}`);
                } else {
                    console.warn(`Layer ${layerId} does not have compileShader method`);
                }
            } else {
                console.warn(`Failed to load shader preset ${randomPresetKey}: ${response.status}`);
            }
        } catch (error) {
            console.warn(`Error setting shader preset for layer ${layerId}:`, error);
        }
    }

    /**
     * Randomize P5 layer parameters
     * @param {string} layerId - Layer ID
     */
    randomizeP5LayerParameters(layerId) {
        try {
            const layer = this.app.layerManager.layers.get(layerId);
            if (!layer || !layer.parameters) return;

            // Randomize some common P5 parameters
            const p5Parameters = ['speed', 'intensity', 'radius', 'colorHue', 'colorSat', 'colorBright'];
            
            p5Parameters.forEach(paramName => {
                if (layer.parameters.has(paramName)) {
                    const randomValue = Math.random();
                    this.app.layerManager.setLayerParameter(layerId, paramName, randomValue);
                }
            });
        } catch (error) {
            console.warn(`Error randomizing P5 parameters for layer ${layerId}:`, error);
        }
    }

    /**
     * Show feedback notification for randomization
     * @param {string} message - Custom message to display
     */
    showRandomizationFeedback(message = '🎲 Visual parameters, shapes & layers randomized!') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-purple-500 text-white px-4 py-2 rounded shadow-lg z-50 transform transition-all duration-300';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Clean up scene manager resources
     */
    destroy() {
        // Clean up any ongoing operations
        // No specific cleanup needed for SceneManager currently
    }
}
