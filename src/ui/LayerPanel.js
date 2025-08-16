/**
 * LayerPanel.js - Layer Management UI
 * This module provides the UI for managing layers in the layer system.
 * It displays layer information, controls, and allows layer manipulation.
 */

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
        
        // Add button to create P5 layer if none exists
        if (!layers.has('p5')) {
            const addP5Button = this.createAddP5Button();
            this.layerList.appendChild(addP5Button);
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
        `;

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
        type.textContent = layer.constructor.name;
        type.style.cssText = `
            font-size: 10px;
            color: #888;
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
            layer.opacity = parseFloat(e.target.value);
            opacitySlider.title = `Opacity: ${(layer.opacity * 100).toFixed(0)}%`;
            this.updateLayerInfo(layer);
        };

        opacityContainer.appendChild(opacityLabel);
        opacityContainer.appendChild(opacitySlider);

        // Add all elements to main row
        mainRow.appendChild(nameSection);
        mainRow.appendChild(statusIndicator);
        mainRow.appendChild(opacityContainer);
        mainRow.appendChild(visibilityToggle);
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
        blendMode.textContent = `Blend: ${layer.blendMode}`;

        infoRow.appendChild(renderTime);
        infoRow.appendChild(blendMode);

        // Add P5-specific info if it's a P5 layer
        if (layer.constructor.name === 'P5Layer') {
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

        item.appendChild(infoRow);

        // Add P5-specific controls in a compact row
        if (layer.constructor.name === 'P5Layer') {
            const p5Controls = this.createCompactP5Controls(layer);
            item.appendChild(p5Controls);
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
        button.textContent = '+ Add P5.js Layer';
        
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
     * Create P5-specific controls
     * @param {P5Layer} layer - P5 layer instance
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
     * @param {P5Layer} layer - P5 layer instance
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

        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${layer.hasSketchError() ? '#ff6b6b' : (layer.isSketchRunning() ? '#51cf66' : '#ffd43b')};
            flex-shrink: 0;
        `;
        statusIndicator.title = layer.hasSketchError() ? 'Error' : (layer.isSketchRunning() ? 'Running' : 'Stopped');

        // Status text
        const statusText = document.createElement('span');
        statusText.textContent = layer.hasSketchError() ? '❌ Error' : (layer.isSketchRunning() ? '✅ Running' : '⏸️ Stopped');
        statusText.style.cssText = `
            font-size: 9px;
            color: ${layer.hasSketchError() ? '#ff6b6b' : (layer.isSketchRunning() ? '#51cf66' : '#ffd43b')};
        `;

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
                if (layer.constructor.name === 'P5Layer') {
                    this.updateCompactP5LayerInfo(item, layer);
                }
            }
        });
        
        // Update performance info only
        this.updatePerformanceInfo();
    }

    /**
     * Update P5-specific layer information
     * @param {HTMLElement} layerItem - Layer item DOM element
     * @param {P5Layer} layer - P5 layer instance
     */
    updateCompactP5LayerInfo(layerItem, layer) {
        // Update P5 status in the info row
        const p5StatusElement = layerItem.querySelector('span[style*="font-size: 9px"][style*="color"]');
        if (p5StatusElement && (p5StatusElement.textContent.includes('❌') || p5StatusElement.textContent.includes('✅') || p5StatusElement.textContent.includes('⏸️'))) {
            if (layer.hasSketchError()) {
                p5StatusElement.innerHTML = '❌ Error';
                p5StatusElement.style.color = '#ff6b6b';
            } else if (layer.isSketchRunning()) {
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
                if (layer.hasSketchError()) {
                    statusIndicator.style.background = '#ff6b6b';
                    statusIndicator.title = 'Error';
                } else if (layer.isSketchRunning()) {
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
                if (layer.hasSketchError()) {
                    statusText.textContent = '❌ Error';
                    statusText.style.color = '#ff6b6b';
                } else if (layer.isSketchRunning()) {
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
}
