/**
 * LayerPanel.js - Layer Management UI
 * This module provides the UI for managing layers in the layer system.
 * It displays layer information, controls, and allows layer manipulation.
 */

import { getBlendModeOptions, THREE_BLEND_MAPPING } from '../config/BlendModeConstants.js';

export class LayerPanel {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.isVisible = false;
    }

    /**
     * Initialize the layer panel
     */
    init() {
        this.createPanel();
        this.setupEventListeners();
        this.updatePanel();
    }

    /**
     * Get layer icon for display
     * @param {string} layerType - Layer class name
     * @returns {string} Icon emoji
     */
    getLayerIcon(layerType) {
        switch (layerType) {
            case 'P5TextureLayer':
                return '🎨';
            case 'ShaderLayer':
                return '⚡';
            case 'GridLayer':
                return '📐';
            default:
                return '🔷';
        }
    }

    /**
     * Get friendly layer type name for display
     * @param {string} layerType - Layer class name
     * @returns {string} Friendly name
     */
    getLayerTypeName(layerType) {
        switch (layerType) {
            case 'P5TextureLayer':
                return 'P5.js Sketch';
            case 'ShaderLayer':
                return 'GLSL Shader';
            case 'GridLayer':
                return 'Grid System';
            default:
                return layerType;
        }
    }

    /**
     * Create the layer panel DOM elements
     */
    createPanel() {
        // Use existing layer panel container from the drawer
        this.container = document.getElementById('layer-panel');
        
        if (!this.container) {
            console.error('Layer panel container not found');
            return;
        }

        // Create layer list container
        this.layerList = document.createElement('div');
        this.layerList.id = 'layer-list';
        this.layerList.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: 15px;
        `;
        
        // Add reordering instructions
        const reorderInstructions = document.createElement('div');
        reorderInstructions.style.cssText = `
            font-size: 9px;
            color: #888;
            text-align: center;
            margin-bottom: 8px;
            padding: 4px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        `;
        reorderInstructions.textContent = 'Use ↑↓ buttons to reorder layers (z-distance controls coming soon)';
        this.layerList.appendChild(reorderInstructions);
        this.container.appendChild(this.layerList);

        // Create performance info
        this.performanceInfo = document.createElement('div');
        this.performanceInfo.style.cssText = `
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #333;
            font-size: 10px;
            opacity: 0.7;
        `;
        this.container.appendChild(this.performanceInfo);
    }

    /**
     * Refresh all layer checkbox states to ensure synchronization
     */
    refreshCheckboxStates() {
        if (!this.container || !this.app.layerManager) return;
        
        const layers = this.app.layerManager.getAllLayers();
        const layerItems = this.layerList.querySelectorAll('.layer-item');
        
        layerItems.forEach(item => {
            const nameElement = item.querySelector('div[style*="font-weight: bold"]');
            if (nameElement) {
                const layerId = nameElement.textContent; // Extract layer ID directly
                const layer = layers.get(layerId);
                
                if (layer) {
                    const visibilityToggle = item.querySelector('input[type="checkbox"]');
                    if (visibilityToggle && visibilityToggle.checked !== layer.visible) {
                        visibilityToggle.checked = layer.visible;
                    }
                }
            }
        });
    }

    /**
     * Check if a blend mode is supported by Three.js
     * @param {string} blendMode - Blend mode to check
     * @returns {boolean} True if supported
     */
    isBlendModeSupported(blendMode) {
        return THREE_BLEND_MAPPING.hasOwnProperty(blendMode);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add keyboard shortcut to toggle panel
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                // Trigger the layers drawer button
                const layersButton = document.getElementById('drawer-layers');
                if (layersButton) {
                    layersButton.click();
                }
            }
        });
        
        // Update panel when layers drawer is opened
        const layersButton = document.getElementById('drawer-layers');
        if (layersButton) {
            layersButton.addEventListener('click', () => {
                // Small delay to ensure drawer is open
                setTimeout(() => this.updatePanel(), 100);
            });
        }
        
        // Periodically refresh checkbox states to ensure synchronization
        setInterval(() => {
            if (this.isVisible && this.container) {
                this.refreshCheckboxStates();
            }
        }, 2000); // Refresh every 2 seconds when visible
    }

    /**
     * Update the layer panel content
     */
    updatePanel() {
        if (!this.container || !this.app.layerManager) return;

        // Clear layer list
        this.layerList.innerHTML = '';

        // Get all layers
        const layers = this.app.layerManager.getAllLayers();
        const layerOrder = this.app.layerManager.getLayerOrder();

        // Create layer items
        layerOrder.forEach(layerId => {
            const layer = layers.get(layerId);
            if (layer) {
                const layerItem = this.createLayerItem(layer);
                this.layerList.appendChild(layerItem);
            }
        });
        
        // P5 layer creation temporarily hidden - functionality preserved in code
        // if (!layers.has('p5')) {
        //     const addP5Button = this.createAddP5Button();
        //     this.layerList.appendChild(addP5Button);
        // }

        // Add button to create shader layer if none exists
        if (!layers.has('shader')) {
            const addShaderButton = this.createAddShaderButton();
            this.layerList.appendChild(addShaderButton);
        }

        // Update performance info
        this.updatePerformanceInfo();
    }

    /**
     * Create a layer item element
     * @param {LayerBase} layer - Layer instance
     * @returns {HTMLElement} Layer item element
     */
    createLayerItem(layer) {
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.style.cssText = `
            margin-bottom: 8px;
            padding: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
        `;
        
        // Add hover effects
        item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(255, 255, 255, 0.15)';
            item.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'rgba(255, 255, 255, 0.1)';
            item.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });

        // Main row with layer info and controls
        const mainRow = document.createElement('div');
        mainRow.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        // Layer name and type
        const nameSection = document.createElement('div');
        nameSection.style.cssText = `
            flex: 1;
            min-width: 0;
        `;
        
        const name = document.createElement('div');
        name.textContent = layer.id;
        name.style.cssText = `
            font-weight: bold;
            font-size: 12px;
            color: white;
            margin-bottom: 2px;
        `;
        
        const type = document.createElement('div');
        const layerIcon = this.getLayerIcon(layer.constructor.name);
        const layerType = this.getLayerTypeName(layer.constructor.name);
        type.innerHTML = `${layerIcon} ${layerType}`;
        type.style.cssText = `
            font-size: 10px;
            color: #888;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        
        nameSection.appendChild(name);
        nameSection.appendChild(type);

        // Visibility toggle
        const visibilityToggle = document.createElement('input');
        visibilityToggle.type = 'checkbox';
        visibilityToggle.checked = layer.visible;
        visibilityToggle.style.cssText = `
            margin: 0;
            cursor: pointer;
        `;
        visibilityToggle.title = 'Toggle visibility';
        visibilityToggle.onchange = (e) => {
            // Verify the layer still exists in the layer manager
            const currentLayer = this.app.layerManager.getLayer(layer.id);
            if (!currentLayer) {
                console.error(`LayerPanel: Layer ${layer.id} no longer exists in layer manager!`);
                return;
            }
            
            if (currentLayer !== layer) {
                console.warn(`LayerPanel: Layer object reference changed for ${layer.id}, using current reference`);
                layer = currentLayer;
            }
            
            layer.visible = e.target.checked;
            
            // Force layer to update its internal state
            if (layer.onVisibilityChanged) {
                layer.onVisibilityChanged(e.target.checked);
            }
            
            // Update the layer info display
            this.updateLayerInfo(layer);
            
            // Force a re-render by updating the layer manager
            if (this.app.layerManager) {
                this.app.layerManager.markLayerDirty(layer.id);
            }
        };

        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${layer.initialized ? '#51cf66' : '#ffd43b'};
            flex-shrink: 0;
        `;
        statusIndicator.title = layer.initialized ? 'Ready' : 'Initializing';

        // Opacity control
        const opacityContainer = document.createElement('div');
        opacityContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 80px;
        `;

        const opacityLabel = document.createElement('span');
        opacityLabel.textContent = 'Opacity';
        opacityLabel.style.cssText = `
            font-size: 9px;
            color: #888;
            min-width: 45px;
        `;

        const opacitySlider = document.createElement('input');
        opacitySlider.type = 'range';
        opacitySlider.min = '0';
        opacitySlider.max = '1';
        opacitySlider.step = '0.01';
        opacitySlider.value = layer.opacity;
        opacitySlider.style.cssText = `
            width: 60px;
            height: 3px;
            cursor: pointer;
        `;
        opacitySlider.title = `Opacity: ${(layer.opacity * 100).toFixed(0)}%`;
        opacitySlider.oninput = (e) => {
            const newOpacity = parseFloat(e.target.value);
            // Use the proper parameter system instead of direct assignment
            layer.setParameter('opacity', newOpacity);
            opacitySlider.title = `Opacity: ${(newOpacity * 100).toFixed(0)}%`;
            
            // Force layer to update its rendering
            if (this.app.layerManager) {
                this.app.layerManager.markLayerDirty(layer.id);
            }
            
            this.updateLayerInfo(layer);
        };

        opacityContainer.appendChild(opacityLabel);
        opacityContainer.appendChild(opacitySlider);

        // Blend mode control
        const blendModeContainer = document.createElement('div');
        blendModeContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 100px;
        `;

        const blendModeLabel = document.createElement('span');
        blendModeLabel.textContent = 'Blend';
        blendModeLabel.style.cssText = `
            font-size: 9px;
            color: #888;
            min-width: 30px;
        `;

        const blendModeSelect = document.createElement('select');
        blendModeSelect.style.cssText = `
            background: var(--color-input-bg);
            border: 1px solid var(--color-input-border);
            border-radius: var(--radius-sm);
            color: var(--color-text-primary);
            font-size: 9px;
            padding: 2px 4px;
            cursor: pointer;
            width: 70px;
            transition: all 0.2s ease;
        `;
        
        // Add focus and hover effects
        blendModeSelect.addEventListener('focus', () => {
            blendModeSelect.style.borderColor = 'var(--color-primary)';
            blendModeSelect.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.1)';
        });
        
        blendModeSelect.addEventListener('blur', () => {
            blendModeSelect.style.borderColor = 'var(--color-input-border)';
            blendModeSelect.style.boxShadow = 'none';
        });
        
        blendModeSelect.addEventListener('mouseenter', () => {
            blendModeSelect.style.borderColor = 'var(--color-border-quaternary)';
        });
        
        blendModeSelect.addEventListener('mouseleave', () => {
            if (document.activeElement !== blendModeSelect) {
                blendModeSelect.style.borderColor = 'var(--color-input-border)';
            }
        });
        
        // Get blend mode options
        const blendModeOptions = getBlendModeOptions();
        
        // Add options grouped by category
        const categories = {};
        blendModeOptions.forEach(option => {
            if (!categories[option.category]) {
                categories[option.category] = [];
            }
            categories[option.category].push(option);
        });
        
        // Add options to select
        Object.entries(categories).forEach(([category, options]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category.charAt(0).toUpperCase() + category.slice(1);
            optgroup.style.cssText = `
                background: var(--color-input-bg);
                color: var(--color-text-secondary);
                font-weight: bold;
            `;
            
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                optionElement.title = option.description;
                optionElement.style.cssText = `
                    background: var(--color-input-bg-dark);
                    color: var(--color-text-primary);
                `;
                if (option.value === layer.blendMode) {
                    optionElement.selected = true;
                }
                optgroup.appendChild(optionElement);
            });
            
            blendModeSelect.appendChild(optgroup);
        });
        
        blendModeSelect.onchange = (e) => {
            layer.setBlendMode(e.target.value);
            this.updateLayerInfo(layer);
        };

        blendModeContainer.appendChild(blendModeLabel);
        blendModeContainer.appendChild(blendModeSelect);

        // Add all elements to main row
        mainRow.appendChild(nameSection);
        mainRow.appendChild(statusIndicator);
        mainRow.appendChild(opacityContainer);
        mainRow.appendChild(blendModeContainer);
        mainRow.appendChild(visibilityToggle);
        
        // Add reorder buttons for all layers
        const reorderButtons = this.createReorderButtons(layer);
        mainRow.appendChild(reorderButtons);
        
        item.appendChild(mainRow);

        // Compact info row
        const infoRow = document.createElement('div');
        infoRow.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 6px;
            font-size: 9px;
            color: #888;
        `;

        const renderTime = document.createElement('span');
        renderTime.textContent = `Render: ${layer.lastRenderTime.toFixed(1)}ms`;
        
        const blendMode = document.createElement('span');
        // Add visual indicator for blend mode support
        const isSupported = this.isBlendModeSupported(layer.blendMode);
        const indicator = isSupported ? '✅' : '⚠️';
        blendMode.textContent = `${indicator} Blend: ${layer.blendMode}`;
        blendMode.title = isSupported ? 
            'This blend mode is fully supported' : 
            'This blend mode requires custom shader (fallback to normal)';

        infoRow.appendChild(renderTime);
        infoRow.appendChild(blendMode);

        // Add P5-specific info if it's a P5 layer
        if (layer.constructor.name === 'P5TextureLayer') {
            const p5Status = document.createElement('span');
            if (layer.hasSketchError && layer.hasSketchError()) {
                p5Status.textContent = '❌ Error';
                p5Status.style.color = '#ff6b6b';
            } else if (layer.isSketchRunning && layer.isSketchRunning()) {
                p5Status.textContent = '✅ Running';
                p5Status.style.color = '#51cf66';
            } else {
                p5Status.textContent = '⏸️ Stopped';
                p5Status.style.color = '#ffd43b';
            }
            infoRow.appendChild(p5Status);
        }

        // Add shader-specific info if it's a shader layer
        if (layer.constructor.name === 'ShaderLayer') {
            const shaderStatus = document.createElement('span');
            if (layer.hasShaderError && layer.hasShaderError()) {
                shaderStatus.textContent = '❌ Error';
                shaderStatus.style.color = '#ff6b6b';
            } else if (layer.isShaderCompiled && layer.isShaderCompiled()) {
                shaderStatus.textContent = '✅ Compiled';
                shaderStatus.style.color = '#51cf66';
            } else {
                shaderStatus.textContent = '⏸️ Stopped';
                shaderStatus.style.color = '#ffd43b';
            }
            infoRow.appendChild(shaderStatus);
        }

        item.appendChild(infoRow);

        // Add P5-specific controls in a compact row
        if (layer.constructor.name === 'P5TextureLayer') {
            const p5Controls = this.createCompactP5Controls(layer);
            item.appendChild(p5Controls);
        }
        
        // Add shader-specific controls in a compact row
        if (layer.constructor.name === 'ShaderLayer') {
            const shaderControls = this.createCompactShaderControls(layer);
            item.appendChild(shaderControls);
        }
        
        // Add grid-specific controls
        if (layer.constructor.name === 'GridLayer') {
            const gridControls = this.createGridControls(layer);
            item.appendChild(gridControls);
        }

        return item;
    }

    /**
     * Create button to add P5 layer
     * @returns {HTMLElement} Add P5 button element
     */
    createAddP5Button() {
        const button = document.createElement('button');
        button.className = 'add-p5-layer-btn';
        button.style.cssText = `
            width: 100%;
            padding: 15px;
            background: rgba(0, 150, 255, 0.2);
            border: 2px dashed rgba(0, 150, 255, 0.5);
            border-radius: 8px;
            color: #00aaff;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 10px;
        `;
        button.innerHTML = '🎨 + Add P5.js Sketch Layer';
        
        button.addEventListener('mouseover', () => {
            button.style.background = 'rgba(0, 150, 255, 0.3)';
            button.style.borderColor = 'rgba(0, 150, 255, 0.8)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.background = 'rgba(0, 150, 255, 0.2)';
            button.style.borderColor = 'rgba(0, 150, 255, 0.5)';
        });
        
        button.onclick = async () => {
            try {
                await this.app.addP5Layer();
                this.updatePanel(); // Refresh to show new layer
            } catch (error) {
                console.error('Failed to add P5 layer:', error);
                alert('Failed to add P5 layer. Check console for details.');
            }
        };
        
        return button;
    }

    /**
     * Create button to add shader layer
     * @returns {HTMLElement} Add shader button element
     */
    createAddShaderButton() {
        const button = document.createElement('button');
        button.className = 'add-shader-layer-btn';
        button.style.cssText = `
            width: 100%;
            padding: 15px;
            background: rgba(255, 100, 0, 0.2);
            border: 2px dashed rgba(255, 100, 0, 0.5);
            border-radius: 8px;
            color: #ff6600;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 10px;
        `;
        button.innerHTML = '⚡ + Add GLSL Shader Layer';
        
        button.addEventListener('mouseover', () => {
            button.style.background = 'rgba(255, 100, 0, 0.3)';
            button.style.borderColor = 'rgba(255, 100, 0, 0.8)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.background = 'rgba(255, 100, 0, 0.2)';
            button.style.borderColor = 'rgba(255, 100, 0, 0.5)';
        });
        
        button.onclick = async () => {
            try {
                // Check if LayerManager is ready
                if (!this.app.layerManager || !this.app.layerManager.context) {
                    alert('Please wait for the application to fully load before adding layers.');
                    return;
                }
                
                await this.app.addShaderLayer();
                this.updatePanel(); // Refresh to show new layer
            } catch (error) {
                console.error('Failed to add shader layer:', error);
                
                // Provide user-friendly error message
                let userMessage = 'Failed to add shader layer. ';
                if (error.message.includes('not ready')) {
                    userMessage += 'Please wait for the application to fully load and try again.';
                } else if (error.message.includes('Three.js not ready')) {
                    userMessage += 'Please wait for the 3D scene to initialize and try again.';
                } else {
                    userMessage += 'Check console for details.';
                }
                
                alert(userMessage);
            }
        };
        
        return button;
    }

    /**
     * Create P5-specific controls
     * @param {P5TextureLayer} layer - P5 layer instance
     * @returns {HTMLElement} P5 controls element
     */
    createP5Controls(layer) {
        const controls = document.createElement('div');
        controls.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        `;

        // Sketch status
        const status = document.createElement('div');
        status.style.cssText = `
            font-size: 10px;
            margin-bottom: 5px;
        `;
        
        if (layer.hasSketchError()) {
            status.innerHTML = `<span style="color: #ff6b6b;">❌ Error: ${layer.getLastError()}</span>`;
        } else if (layer.isSketchRunning()) {
            status.innerHTML = `<span style="color: #51cf66;">✅ Running</span>`;
        } else {
            status.innerHTML = `<span style="color: #ffd43b;">⏸️ Stopped</span>`;
        }
        controls.appendChild(status);

        // Parameters list
        const params = layer.getAllParameters();
        if (Object.keys(params).length > 0) {
            const paramsList = document.createElement('div');
            paramsList.style.cssText = `
                margin-top: 5px;
                font-size: 10px;
            `;
            
            const paramsTitle = document.createElement('div');
            paramsTitle.textContent = 'P5 Parameters:';
            paramsTitle.style.cssText = `
                font-weight: bold;
                margin-bottom: 5px;
                color: #00aaff;
            `;
            paramsList.appendChild(paramsTitle);
            
            Object.entries(params).forEach(([name, param]) => {
                const paramRow = document.createElement('div');
                paramRow.style.cssText = `
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 3px;
                    padding: 2px 5px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                `;
                
                const paramInfo = document.createElement('span');
                paramInfo.textContent = `${param.label}: ${param.value.toFixed(2)}`;
                paramInfo.style.flex = '1';
                
                const midiTarget = document.createElement('span');
                midiTarget.textContent = `p5:${name}`;
                midiTarget.style.cssText = `
                    font-family: monospace;
                    font-size: 9px;
                    color: #888;
                `;
                
                paramRow.appendChild(paramInfo);
                paramRow.appendChild(midiTarget);
                paramsList.appendChild(paramRow);
            });
            
            controls.appendChild(paramsList);
        }

        // Code editor button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit Sketch';
        editButton.style.cssText = `
            margin-top: 5px;
            padding: 5px 10px;
            background: rgba(0, 150, 255, 0.3);
            border: 1px solid rgba(0, 150, 255, 0.5);
            border-radius: 4px;
            color: white;
            font-size: 10px;
            cursor: pointer;
        `;
        
        editButton.onclick = () => {
            this.openP5Editor(layer);
        };
        
        controls.appendChild(editButton);

        return controls;
    }

    /**
     * Create compact P5-specific controls
     * @param {P5TextureLayer} layer - P5 layer instance
     * @returns {HTMLElement} Compact P5 controls element
     */
    createCompactP5Controls(layer) {
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // Status indicator for P5TextureLayer
        const hasError = layer.hasError;
        const isRunning = layer.isRunning;
        
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${hasError ? '#ff6b6b' : (isRunning ? '#51cf66' : '#ffd43b')};
            flex-shrink: 0;
        `;
        statusIndicator.title = hasError ? 'Error' : (isRunning ? 'Running' : 'Stopped');

        // Status text
        const statusText = document.createElement('span');
        statusText.textContent = hasError ? '❌ Error' : (isRunning ? '✅ Running' : '⏸️ Stopped');
        statusText.style.cssText = `
            font-size: 9px;
            color: ${hasError ? '#ff6b6b' : (isRunning ? '#51cf66' : '#ffd43b')};
        `;

        // Add status indicator and text
        controls.appendChild(statusIndicator);
        controls.appendChild(statusText);

        // Parameters list
        const params = layer.getAllParameters();
        if (Object.keys(params).length > 0) {
            const paramsList = document.createElement('div');
            paramsList.style.cssText = `
                font-size: 9px;
                color: #888;
            `;
            
            const paramsTitle = document.createElement('div');
            paramsTitle.textContent = 'P5 Params:';
            paramsTitle.style.cssText = `
                font-weight: bold;
                margin-bottom: 3px;
                color: #00aaff;
            `;
            paramsList.appendChild(paramsTitle);
            
            Object.entries(params).forEach(([name, param]) => {
                const paramRow = document.createElement('div');
                paramRow.style.cssText = `
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 2px;
                    padding: 1px 5px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 2px;
                `;
                
                const paramInfo = document.createElement('span');
                paramInfo.textContent = `${param.label}: ${param.value.toFixed(2)}`;
                paramInfo.style.flex = '1';
                
                const midiTarget = document.createElement('span');
                midiTarget.textContent = `p5:${name}`;
                midiTarget.style.cssText = `
                    font-family: monospace;
                    font-size: 8px;
                    color: #888;
                `;
                
                paramRow.appendChild(paramInfo);
                paramRow.appendChild(midiTarget);
                paramsList.appendChild(paramRow);
            });
            
            controls.appendChild(paramsList);
        }

        // Code editor button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit Sketch';
        editButton.style.cssText = `
            padding: 3px 8px;
            background: rgba(0, 150, 255, 0.3);
            border: 1px solid rgba(0, 150, 255, 0.5);
            border-radius: 3px;
            color: white;
            font-size: 9px;
            cursor: pointer;
        `;
        
        editButton.onclick = () => {
            this.openP5Editor(layer);
        };
        
        controls.appendChild(editButton);

        return controls;
    }

    /**
     * Create compact shader-specific controls
     * @param {ShaderLayer} layer - Shader layer instance
     * @returns {HTMLElement} Compact shader controls element
     */
    createCompactShaderControls(layer) {
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${layer.hasShaderError() ? '#ff6b6b' : (layer.isShaderCompiled() ? '#51cf66' : '#ffd43b')};
            flex-shrink: 0;
        `;
        statusIndicator.title = layer.hasShaderError() ? 'Error' : (layer.isShaderCompiled() ? 'Compiled' : 'Not Compiled');

        // Status text
        const statusText = document.createElement('span');
        statusText.textContent = layer.hasShaderError() ? '❌ Error' : (layer.isShaderCompiled() ? '✅ Compiled' : '⏸️ Not Compiled');
        statusText.style.cssText = `
            font-size: 9px;
            color: ${layer.hasShaderError() ? '#ff6b6b' : (layer.isShaderCompiled() ? '#51cf66' : '#ffd43b')};
        `;

        // Parameters list
        const params = layer.getExposedParameters();
        if (Object.keys(params).length > 0) {
            const paramsList = document.createElement('div');
            paramsList.style.cssText = `
                font-size: 9px;
                color: #888;
            `;
            
            const paramsTitle = document.createElement('div');
            paramsTitle.textContent = 'Shader Params:';
            paramsTitle.style.cssText = `
                font-weight: bold;
                margin-bottom: 3px;
                color: #ff6600;
            `;
            paramsList.appendChild(paramsTitle);
            
            Object.entries(params).forEach(([name, param]) => {
                const paramRow = document.createElement('div');
                paramRow.style.cssText = `
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 2px;
                    padding: 1px 5px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 2px;
                `;
                
                const paramInfo = document.createElement('span');
                paramInfo.textContent = `${param.label || name}: ${param.default}`;
                paramInfo.style.flex = '1';
                
                const midiTarget = document.createElement('span');
                midiTarget.textContent = `shader:${name}`;
                midiTarget.style.cssText = `
                    font-family: monospace;
                    font-size: 8px;
                    color: #888;
                `;
                
                paramRow.appendChild(paramInfo);
                paramRow.appendChild(midiTarget);
                paramsList.appendChild(paramRow);
            });
            
            controls.appendChild(paramsList);
        }

        // Code editor button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit Shader';
        editButton.style.cssText = `
            padding: 3px 8px;
            background: rgba(255, 100, 0, 0.3);
            border: 1px solid rgba(255, 100, 0, 0.5);
            border-radius: 3px;
            color: white;
            font-size: 9px;
            cursor: pointer;
        `;
        
        editButton.onclick = () => {
            this.openShaderEditor(layer);
        };
        
        controls.appendChild(editButton);

        return controls;
    }

    /**
     * Create grid-specific controls
     * @param {GridLayer} layer - Grid layer instance
     * @returns {HTMLElement} Grid controls element
     */
    createGridControls(layer) {
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // Grid info display
        const gridInfo = document.createElement('div');
        gridInfo.style.cssText = `
            font-size: 9px;
            color: #888;
            flex: 1;
        `;
        
        const gridMetrics = layer.getGridMetrics();
        const gridComposition = layer.getGridInfo();
        
        gridInfo.innerHTML = `
            <div style="font-weight: bold; color: #00aaff; margin-bottom: 3px;">Grid Info:</div>
            <div>Shapes: ${gridMetrics.shapeCount || 0}</div>
            <div>Size: ${gridComposition.compositionWidth || 0}×${gridComposition.compositionHeight || 0}</div>
            <div>Cell: ${gridComposition.cellSize || 0}</div>
        `;
        
        controls.appendChild(gridInfo);



        return controls;
    }

    /**
     * Open P5 sketch editor using the P5CodeEditor
     * @param {P5Layer} layer - P5 layer instance
     */
    openP5Editor(layer) {
        // Use the existing P5CodeEditor to edit the sketch
        if (this.app.p5CodeEditor) {
            this.app.p5CodeEditor.open();
        } else {
            console.error('P5CodeEditor not available');
            // Fallback to prompt if P5CodeEditor is not available
            const code = layer.getSketchCode();
            const newCode = prompt('Edit P5 Sketch Code:', code);
            
            if (newCode && newCode !== code) {
                layer.compileAndRun(newCode).then(() => {
                    this.updatePanel(); // Refresh to show changes
                }).catch(error => {
                    alert(`Sketch error: ${error.message}`);
                });
            }
        }
    }

    /**
     * Open shader editor using the ShaderCodeEditor
     * @param {ShaderLayer} layer - Shader layer instance
     */
    openShaderEditor(layer) {
        // Use the existing ShaderCodeEditor to edit the shader
        if (this.app.shaderCodeEditor) {
            this.app.shaderCodeEditor.open();
        } else {
            console.error('ShaderCodeEditor not available');
            // Fallback to prompt if ShaderCodeEditor is not available
            const code = layer.getShaderCode();
            const newCode = prompt('Edit Shader Code:', code);
            
            if (newCode && newCode !== code) {
                layer.compileShader(newCode).then(() => {
                    this.updatePanel(); // Refresh to show changes
                    try { this.app.controlManager?.refreshShaderParameters?.(); } catch (_) {}
                    try { this.app.audioMappingManager?.refreshShaderParameters?.(); } catch (_) {}
                }).catch(error => {
                    alert(`Shader error: ${error.message}`);
                });
            }
        }
    }

    /**
     * Update specific layer information without full re-render
     * @param {LayerBase} layer - Layer to update
     */
    updateLayerInfo(layer) {
        // Find the layer item in the DOM
        const layerItems = this.layerList.querySelectorAll('.layer-item');
        
        layerItems.forEach(item => {
            const nameElement = item.querySelector('div[style*="font-weight: bold"]');
            if (nameElement && nameElement.textContent === layer.id) {
                // Update status indicator
                const statusIndicator = item.querySelector('div[style*="border-radius: 50%"]');
                if (statusIndicator) {
                    statusIndicator.style.background = layer.initialized ? '#51cf66' : '#ffd43b';
                    statusIndicator.title = layer.initialized ? 'Ready' : 'Initializing';
                }
                
                // Update opacity slider value
                const opacitySlider = item.querySelector('input[type="range"]');
                if (opacitySlider) {
                    opacitySlider.value = layer.opacity;
                    opacitySlider.title = `Opacity: ${(layer.opacity * 100).toFixed(0)}%`;
                }
                
                // Update visibility checkbox to ensure it's in sync
                const visibilityToggle = item.querySelector('input[type="checkbox"]');
                if (visibilityToggle && visibilityToggle.checked !== layer.visible) {
                    visibilityToggle.checked = layer.visible;
                }
                
                // Update render time and blend mode
                const renderTimeElement = item.querySelector('span[style*="font-size: 9px"]');
                if (renderTimeElement && renderTimeElement.textContent.startsWith('Render:')) {
                    renderTimeElement.textContent = `Render: ${layer.lastRenderTime.toFixed(1)}ms`;
                }
                
                // Update P5-specific controls if it's a P5 layer
                if (layer.constructor.name === 'P5TextureLayer') {
                    this.updateCompactP5LayerInfo(item, layer);
                }
                
                // Update grid-specific controls if it's a grid layer
                if (layer.constructor.name === 'GridLayer') {
                    this.updateGridLayerInfo(item, layer);
                }
            }
        });
        
        // Update performance info only
        this.updatePerformanceInfo();
    }

    /**
     * Update P5-specific layer information
     * @param {HTMLElement} layerItem - Layer item DOM element
     * @param {P5TextureLayer} layer - P5 layer instance
     */
    updateCompactP5LayerInfo(layerItem, layer) {
        // Update P5 status in the info row
        const p5StatusElement = layerItem.querySelector('span[style*="font-size: 9px"][style*="color"]');
        if (p5StatusElement && (p5StatusElement.textContent.includes('❌') || p5StatusElement.textContent.includes('✅') || p5StatusElement.textContent.includes('⏸️'))) {
            if (layer.hasError) {
                p5StatusElement.innerHTML = '❌ Error';
                p5StatusElement.style.color = '#ff6b6b';
            } else if (layer.isRunning) {
                p5StatusElement.innerHTML = '✅ Running';
                p5StatusElement.style.color = '#51cf66';
            } else {
                p5StatusElement.innerHTML = '⏸️ Stopped';
                p5StatusElement.style.color = '#ffd43b';
            }
        }
        
        // Update P5 controls if they exist
        const p5Controls = layerItem.querySelector('div[style*="border-top: 1px solid rgba(255, 255, 255, 0.1)"]');
        if (p5Controls) {
            // Update status indicator in P5 controls
            const statusIndicator = p5Controls.querySelector('div[style*="border-radius: 50%"]');
            if (statusIndicator) {
                if (layer.hasError) {
                    statusIndicator.style.background = '#ff6b6b';
                    statusIndicator.title = 'Error';
                } else if (layer.isRunning) {
                    statusIndicator.style.background = '#51cf66';
                    statusIndicator.title = 'Running';
                } else {
                    statusIndicator.style.background = '#ffd43b';
                    statusIndicator.title = 'Stopped';
                }
            }
            
            // Update status text in P5 controls
            const statusText = p5Controls.querySelector('span[style*="font-size: 9px"][style*="color"]');
            if (statusText) {
                if (layer.hasError) {
                    statusText.textContent = '❌ Error';
                    statusText.style.color = '#ff6b6b';
                } else if (layer.isRunning) {
                    statusText.textContent = '✅ Running';
                    statusText.style.color = '#51cf66';
                } else {
                    statusText.textContent = '⏸️ Stopped';
                    statusText.style.color = '#ffd43b';
                }
            }
            
            // Update parameters list if it exists
            const paramsList = p5Controls.querySelector('div[style*="font-size: 9px"][style*="color: #888"]');
            if (paramsList) {
                const params = layer.getAllParameters();
                if (Object.keys(params).length > 0) {
                    // Find the parameters container (skip the title)
                    const paramsContainer = paramsList.children[1];
                    if (paramsContainer) {
                        // Clear and rebuild parameters
                        paramsContainer.innerHTML = '';
                        
                        Object.entries(params).forEach(([name, param]) => {
                            const paramRow = document.createElement('div');
                            paramRow.style.cssText = `
                                display: flex;
                                justify-content: between;
                                align-items: center;
                                margin-bottom: 2px;
                                padding: 1px 5px;
                                background: rgba(255, 255, 255, 0.05);
                                border-radius: 2px;
                            `;
                            
                            const paramInfo = document.createElement('span');
                            paramInfo.textContent = `${param.label}: ${param.value.toFixed(2)}`;
                            paramInfo.style.flex = '1';
                            
                            const midiTarget = document.createElement('span');
                            midiTarget.textContent = `p5:${name}`;
                            midiTarget.style.cssText = `
                                font-family: monospace;
                                font-size: 8px;
                                color: #888;
                            `;
                            
                            paramRow.appendChild(paramInfo);
                            paramRow.appendChild(midiTarget);
                            paramsContainer.appendChild(paramRow);
                        });
                    }
                }
            }
        }
    }

    /**
     * Update grid-specific layer information
     * @param {HTMLElement} layerItem - Layer item DOM element
     * @param {GridLayer} layer - Grid layer instance
     */
    updateGridLayerInfo(layerItem, layer) {
        // Update grid info display
        const gridInfo = layerItem.querySelector('div[style*="font-size: 9px"][style*="color: #888"]');
        if (gridInfo) {
            const gridMetrics = layer.getGridMetrics();
            const gridComposition = layer.getGridInfo();
            gridInfo.innerHTML = `
                <div style="font-weight: bold; color: #00aaff; margin-bottom: 3px;">Grid Info:</div>
                <div>Shapes: ${gridMetrics.shapeCount || 0}</div>
                <div>Size: ${gridComposition.compositionWidth || 0}×${gridComposition.compositionHeight || 0}</div>
                <div>Cell: ${gridComposition.cellSize || 0}</div>
            `;
        }


    }

    /**
     * Update performance information
     */
    updatePerformanceInfo() {
        if (!this.app.layerManager) return;

        const metrics = this.app.layerManager.getPerformanceMetrics();
        this.performanceInfo.innerHTML = `
            Total render time: ${metrics.totalRenderTime.toFixed(2)}ms<br>
            Layer count: ${metrics.layerCount}<br>
            FPS: ${this.app.animationLoop ? this.app.animationLoop.getFPS().toFixed(1) : 'N/A'}
        `;
    }

    /**
     * Show the layer panel (for compatibility)
     */
    show() {
        this.updatePanel();
    }

    /**
     * Hide the layer panel (for compatibility)
     */
    hide() {
        // Panel visibility is controlled by the drawer system
    }

    /**
     * Toggle the layer panel visibility (for compatibility)
     */
    toggle() {
        // Toggle is handled by the drawer system
        const layersButton = document.getElementById('drawer-layers');
        if (layersButton) {
            layersButton.click();
        }
    }

    /**
     * Dispose of the layer panel
     */
    dispose() {
        // Clear the container content but don't remove the container itself
        // since it's part of the drawer system
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.container = null;
    }

    /**
     * Create reorder buttons for a layer
     * @param {LayerBase} layer - Layer instance
     * @returns {HTMLElement} Reorder buttons container
     */
    createReorderButtons(layer) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-left: 8px;
        `;

        // Up button
        const upButton = document.createElement('button');
        upButton.innerHTML = '↑';
        upButton.title = 'Move layer up';
        upButton.style.cssText = `
            width: 20px;
            height: 16px;
            padding: 0;
            background: rgba(0, 150, 255, 0.3);
            border: 1px solid rgba(0, 150, 255, 0.5);
            border-radius: 2px;
            color: white;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        
        upButton.addEventListener('mouseenter', () => {
            upButton.style.background = 'rgba(0, 150, 255, 0.5)';
            upButton.style.borderColor = 'rgba(0, 150, 255, 0.8)';
        });
        
        upButton.addEventListener('mouseleave', () => {
            upButton.style.background = 'rgba(0, 150, 255, 0.3)';
            upButton.style.borderColor = 'rgba(0, 150, 255, 0.5)';
        });
        
        upButton.onclick = () => {
            this.moveLayerUp(layer.id);
        };

        // Down button
        const downButton = document.createElement('button');
        downButton.innerHTML = '↓';
        downButton.title = 'Move layer down';
        downButton.style.cssText = `
            width: 20px;
            height: 16px;
            padding: 0;
            background: rgba(0, 150, 255, 0.3);
            border: 1px solid rgba(0, 150, 255, 0.5);
            border-radius: 2px;
            color: white;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        
        downButton.addEventListener('mouseenter', () => {
            downButton.style.background = 'rgba(0, 150, 255, 0.5)';
            downButton.style.borderColor = 'rgba(0, 150, 255, 0.8)';
        });
        
        downButton.addEventListener('mouseleave', () => {
            downButton.style.background = 'rgba(0, 150, 255, 0.3)';
            downButton.style.borderColor = 'rgba(0, 150, 255, 0.5)';
        });
        
        downButton.onclick = () => {
            this.moveLayerDown(layer.id);
        };

        container.appendChild(upButton);
        container.appendChild(downButton);

        return container;
    }

    /**
     * Move a layer up in the order
     * @param {string} layerId - ID of the layer to move up
     */
    moveLayerUp(layerId) {
        if (!this.app.layerManager) return;
        
        const currentOrder = this.app.layerManager.getLayerOrder();
        const currentIndex = currentOrder.indexOf(layerId);
        
        // Can't move up if already at the top
        if (currentIndex <= 0) return;
        
        // Swap with the layer above
        const newOrder = [...currentOrder];
        [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
        
        // Update layer order
        this.app.layerManager.setLayerOrder(newOrder);
        
        // Refresh the panel to show new order
        this.updatePanel();
    }

    /**
     * Move a layer down in the order
     * @param {string} layerId - ID of the layer to move down
     */
    moveLayerDown(layerId) {
        if (!this.app.layerManager) return;
        
        const currentOrder = this.app.layerManager.getLayerOrder();
        const currentIndex = currentOrder.indexOf(layerId);
        
        // Can't move down if already at the bottom
        if (currentIndex === currentOrder.length - 1) return;
        
        // Swap with the layer below
        const newOrder = [...currentOrder];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
        
        // Update layer order
        this.app.layerManager.setLayerOrder(newOrder);
        
        // Refresh the panel to show new order
        this.updatePanel();
    }
}
