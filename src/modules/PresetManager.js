/**
 * PresetManager.js - Preset Loading and Management
 * This module handles all preset-related functionality including loading, saving,
 * validation, and discovery of MIDI control presets.
 * Extracted from App.js to improve modularity and separation of concerns.
 */

export class PresetManager {
    constructor(app) {
        this.app = app;
        this.domCache = app.domCache;
        this.state = app.state;
        
        // Known preset names for fallback discovery
        this.knownPresets = [
            'sample-multi-channel',
            'essential-controls',
            'animation-movement',
            'visual-effects',
            'lighting-materials',
            'grid-composition',
            'shape-controls',
            'morphing-transitions'
        ];
        
        // Display names for presets
        this.displayNames = {
            'sample-multi-channel': 'Sample Multi-Channel',
            'essential-controls': 'Essential Controls',
            'animation-movement': 'Animation & Movement',
            'visual-effects': 'Visual Effects',
            'lighting-materials': 'Lighting & Materials',
            'grid-composition': 'Grid & Composition',
            'shape-controls': 'Shape Controls',
            'morphing-transitions': 'Morphing & Transitions'
        };
    }

    /**
     * Initialize preset management functionality
     */
    setupPresetManagement() {
        this.setupEventListeners();
        this.loadAvailablePresets();
    }

    /**
     * Set up event listeners for preset controls
     */
    setupEventListeners() {
        // MIDI preset selector
        const midiPresetSelect = this.domCache.getElement('midi-preset-select');
        if (midiPresetSelect) {
            midiPresetSelect.addEventListener('change', (e) => {
                this.applyCCPreset(e.target.value);
            });
        }

        // File input for loading presets
        const presetFileInput = this.domCache.getElement('preset-file-input');
        if (presetFileInput) {
            presetFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handlePresetFileLoad(file);
                }
            });
        }
    }

    /**
     * Handle preset file loading with format detection
     * @param {File} file - The file to load
     */
    handlePresetFileLoad(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Check if it's a scene file (has settings property)
                if (data.settings) {
                    // Delegate to scene management (App.js for now)
                    this.app.loadSceneFile(data);
                } else {
                    // Assume it's a MIDI preset
                    this.loadPreset(file);
                }
            } catch (error) {
                console.error('Error parsing file:', error);
                alert('Invalid file format');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Save current preset to file
     */
    savePreset() {
        const ccMappings = this.state.get('midiCCMappings') || {};
        const noteMappings = this.state.get('midiNoteMappings') || {};
        const audioMappings = this.state.get('audioMappings') || {};
        
        const preset = {
            version: '1.0',
            timestamp: Date.now(),
            midiCCMappings: ccMappings,
            midiNoteMappings: noteMappings,
            audioMappings: audioMappings
        };
        
        const dataStr = JSON.stringify(preset, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `rglr-control-preset-${Date.now()}.json`;
        link.click();
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }

    /**
     * Load preset from file
     * @param {File} file - The preset file to load
     */
    loadPreset(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const preset = JSON.parse(e.target.result);
                
                // Handle both old and new preset formats for backward compatibility
                if (preset.mappings && preset.noteMappings) {
                    // Old format - convert to new format
                    const newPreset = {
                        midiCCMappings: preset.mappings,
                        midiNoteMappings: preset.noteMappings,
                        audioMappings: {}
                    };
                    this.applyPreset(newPreset);
                } else if (this.validatePreset(preset)) {
                    // New format (current state format)
                    this.applyPreset(preset);
                } else if (preset.midiCCMappings && preset.midiNoteMappings) {
                    // Format without audio mappings - add empty audio mappings
                    const newPreset = {
                        ...preset,
                        audioMappings: preset.audioMappings || {}
                    };
                    this.applyPreset(newPreset);
                } else {
                    console.error('Invalid preset format:', preset);
                    alert('Invalid preset file format. Please check the file structure.');
                    return;
                }
            } catch (error) {
                console.error('Failed to load preset:', error);
                alert('Failed to load preset file. Please check if the file is a valid JSON preset.');
            }
        };
        reader.onerror = () => {
            console.error('File reading error');
            alert('Failed to read the preset file.');
        };
        reader.readAsText(file);
    }

    /**
     * Validate preset format
     * @param {Object} preset - The preset to validate
     * @returns {boolean} True if valid
     */
    validatePreset(preset) {
        return preset && 
               typeof preset === 'object' &&
               preset.midiCCMappings &&
               preset.midiNoteMappings &&
               (typeof preset.midiCCMappings === 'object') &&
               (typeof preset.midiNoteMappings === 'object') &&
               (preset.audioMappings === undefined || typeof preset.audioMappings === 'object');
    }

    /**
     * Apply preset to the application state
     * @param {Object} preset - The preset to apply
     */
    applyPreset(preset) {
        if (preset.midiCCMappings) {
            this.state.set('midiCCMappings', preset.midiCCMappings);
        }
        if (preset.midiNoteMappings) {
            this.state.set('midiNoteMappings', preset.midiNoteMappings);
        }
        if (preset.audioMappings) {
            this.state.set('audioMappings', preset.audioMappings);
        }
        
        // Pass the preset data directly to recreateControlsFromPreset
        this.recreateControlsFromPreset(preset);
    }

    /**
     * Recreate controls from preset data
     * @param {Object} preset - The preset data (optional, uses state if not provided)
     */
    recreateControlsFromPreset(preset = null) {
        if (!this.app.controlManager) return;
        
        console.log('Recreating controls from preset:', preset);
        
        // Clear existing controls
        this.app.controlManager.clearAllControls();
        
        // Recreate CC controls
        const ccMappings = preset ? preset.midiCCMappings : this.state.get('midiCCMappings');
        console.log('CC mappings to recreate:', ccMappings);
        if (ccMappings && typeof ccMappings === 'object') {
            Object.keys(ccMappings).forEach((controlId, index) => {
                const mapping = ccMappings[controlId];
                console.log('Creating CC control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "cc1" -> 1)
                const indexMatch = controlId.match(/cc(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : index + 1;
                console.log('Creating control with index:', controlIndex);
                
                const control = this.app.controlManager.addControl('cc', controlIndex);
                if (control) {
                    console.log('Control created successfully, updating UI...');
                    
                    // Update the control's UI elements directly
                    this.app.updateControlUI(control, {
                        channel: mapping.channel,
                        value: mapping.value,
                        target: mapping.target
                    });
                    
                    console.log('UI updated for control:', control.controlId);
                } else {
                    console.error('Failed to create control for:', controlId);
                }
            });
        }
        
        // Recreate Note controls
        const noteMappings = preset ? preset.midiNoteMappings : this.state.get('midiNoteMappings');
        console.log('Note mappings to recreate:', noteMappings);
        if (noteMappings && typeof noteMappings === 'object') {
            Object.keys(noteMappings).forEach((controlId, index) => {
                const mapping = noteMappings[controlId];
                console.log('Creating Note control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "note1" -> 1)
                const indexMatch = controlId.match(/note(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : index + 1;
                console.log('Creating note control with index:', controlIndex);
                
                const control = this.app.controlManager.addControl('note', controlIndex);
                if (control) {
                    console.log('Note control created successfully, updating UI...');
                    
                    // Update the control's UI elements directly
                    this.app.updateControlUI(control, {
                        channel: mapping.channel,
                        value: mapping.note,
                        target: mapping.target
                    });
                    
                    console.log('Note UI updated for control:', control.controlId);
                } else {
                    console.error('Failed to create note control for:', controlId);
                }
            });
        }
        
        // Recreate Audio Mapping controls
        const audioMappings = preset ? preset.audioMappings : this.state.get('audioMappings');
        console.log('Audio mappings to recreate:', audioMappings);
        if (audioMappings && typeof audioMappings === 'object') {
            // Clear existing audio mapping controls
            if (this.app.audioMappingManager) {
                this.app.audioMappingManager.clearAllControls();
            }
            
            Object.keys(audioMappings).forEach((controlId, index) => {
                const mapping = audioMappings[controlId];
                console.log('Creating Audio control:', controlId, 'with mapping:', mapping);
                
                // Extract the index from the control ID (e.g., "audio1" -> 1)
                const indexMatch = controlId.match(/audio(\d+)/);
                const controlIndex = indexMatch ? parseInt(indexMatch[1]) : index + 1;
                console.log('Creating audio control with index:', controlIndex);
                
                if (this.app.audioMappingManager) {
                    const control = this.app.audioMappingManager.addControl('frequency', controlIndex);
                    if (control) {
                        console.log('Audio control created successfully, updating mapping...');
                        
                        // Update the control's mapping
                        control.setMapping(mapping);
                        
                        console.log('Audio mapping updated for control:', control.controlId);
                    } else {
                        console.error('Failed to create audio control for:', controlId);
                    }
                }
            });
        }
        
        console.log('Finished recreating controls');
        console.log('Final CC mappings in state:', this.state.get('midiCCMappings'));
        console.log('Final Note mappings in state:', this.state.get('midiNoteMappings'));
    }

    /**
     * Load available presets from server
     */
    async loadAvailablePresets() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create abort controller for this operation
        const controller = this.app.createAbortController('presets');
        
        try {
            // Try to load a list of available presets
            const response = await fetch('/presets/', { 
                signal: controller.signal 
            });
            if (response.ok) {
                const text = await response.text();
                // Parse the directory listing to find .json files
                const presetFiles = text.match(/href="([^"]+\.json)"/g);
                if (presetFiles) {
                    const presets = presetFiles.map(file => {
                        const match = file.match(/href="([^"]+\.json)"/);
                        return match ? match[1].replace('.json', '') : null;
                    }).filter(Boolean);
                    
                    this.updatePresetDropdown(presets);
                    return;
                }
            }
            
            // Fallback: Try to discover presets by attempting to load them
            const availablePresets = [];
            
            // Try to load each preset to see if it exists
            for (const preset of this.knownPresets) {
                try {
                    const response = await fetch(`/presets/${preset}.json`, { 
                        signal: controller.signal 
                    });
                    if (response.ok) {
                        const presetData = await response.json();
                        if (this.validatePreset(presetData)) {
                            availablePresets.push(preset);
                        }
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.log('Preset discovery was cancelled');
                        return;
                    }
                    // Preset not found or invalid
                }
            }
            
            this.updatePresetDropdown(availablePresets);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Preset loading was cancelled');
                return;
            }
            console.error('Error loading presets:', error);
        } finally {
            // Clean up the abort controller
            this.app.cleanupAbortController('presets');
        }
    }

    /**
     * Update the preset dropdown with available presets
     * @param {string[]} availablePresets - Array of available preset names
     */
    updatePresetDropdown(availablePresets) {
        const select = this.domCache.getElement('midi-preset-select');
        if (!select) return;
        
        // Keep the "Custom" option
        const customOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (customOption) {
            select.appendChild(customOption);
        }
        
        // Add available presets
        availablePresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset;
            option.textContent = this.getPresetDisplayName(preset);
            select.appendChild(option);
        });
    }

    /**
     * Apply a CC preset from the server
     * @param {string} presetName - Name of the preset to apply
     */
    async applyCCPreset(presetName) {
        if (!presetName) {
            // Clear mappings for "Custom" option
            this.state.set('midiCCMappings', {});
            this.state.set('midiNoteMappings', {});
            this.recreateControlsFromPreset();
            return;
        }

        try {
            // Load the preset file from the presets folder
            const response = await fetch(`/presets/${presetName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load preset: ${response.statusText}`);
            }
            
            const preset = await response.json();
            
            if (this.validatePreset(preset)) {
                this.applyPreset(preset);
            } else {
                console.error('Invalid preset format:', preset);
                alert('Invalid preset file format. Please check the file structure.');
            }
        } catch (error) {
            console.error('Failed to load preset:', error);
            alert(`Failed to load preset "${presetName}". Please check if the preset file exists.`);
        }
    }

    /**
     * Get display name for a preset
     * @param {string} presetName - Internal preset name
     * @returns {string} Display name
     */
    getPresetDisplayName(presetName) {
        return this.displayNames[presetName] || presetName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Get current preset data
     * @returns {Object} Current preset data
     */
    getCurrentPreset() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            midiCCMappings: this.state.get('midiCCMappings') || {},
            midiNoteMappings: this.state.get('midiNoteMappings') || {},
            audioMappings: this.state.get('audioMappings') || {}
        };
    }

    /**
     * Check if current mappings match a known preset
     * @param {string} presetName - Name of preset to check
     * @returns {boolean} True if mappings match
     */
    async isCurrentPreset(presetName) {
        try {
            const response = await fetch(`/presets/${presetName}.json`);
            if (!response.ok) return false;
            
            const preset = await response.json();
            const current = this.getCurrentPreset();
            
            return JSON.stringify(preset.midiCCMappings) === JSON.stringify(current.midiCCMappings) &&
                   JSON.stringify(preset.midiNoteMappings) === JSON.stringify(current.midiNoteMappings);
        } catch (error) {
            return false;
        }
    }

    /**
     * Export preset data as JSON string
     * @returns {string} JSON string of current preset
     */
    exportPresetAsString() {
        const preset = this.getCurrentPreset();
        return JSON.stringify(preset, null, 2);
    }

    /**
     * Import preset from JSON string
     * @param {string} jsonString - JSON string of preset data
     * @returns {boolean} True if import was successful
     */
    importPresetFromString(jsonString) {
        try {
            const preset = JSON.parse(jsonString);
            if (this.validatePreset(preset)) {
                this.applyPreset(preset);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import preset from string:', error);
            return false;
        }
    }

    /**
     * Clear all preset data
     */
    clearPresets() {
        this.state.set('midiCCMappings', {});
        this.state.set('midiNoteMappings', {});
        this.state.set('audioMappings', {});
        this.recreateControlsFromPreset();
    }

    /**
     * Clean up preset manager resources
     */
    destroy() {
        // Clean up any ongoing operations
        this.app.cleanupAbortController('presets');
    }
}
