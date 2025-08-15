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
            max-height: 400px;
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
            margin-bottom: 10px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        // Layer header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;

        const name = document.createElement('span');
        name.textContent = `${layer.id} (${layer.constructor.name})`;
        name.style.fontWeight = 'bold';

        const visibilityToggle = document.createElement('input');
        visibilityToggle.type = 'checkbox';
        visibilityToggle.checked = layer.visible;
        visibilityToggle.style.marginLeft = '10px';
        visibilityToggle.onchange = (e) => {
            layer.visible = e.target.checked;
            this.updatePanel();
        };

        header.appendChild(name);
        header.appendChild(visibilityToggle);
        item.appendChild(header);

        // Layer info
        const info = document.createElement('div');
        info.style.cssText = `
            font-size: 10px;
            opacity: 0.8;
            margin-bottom: 8px;
        `;
        info.innerHTML = `
            Opacity: ${(layer.opacity * 100).toFixed(0)}%<br>
            Blend: ${layer.blendMode}<br>
            Status: ${layer.initialized ? 'Ready' : 'Initializing'}<br>
            Render time: ${layer.lastRenderTime.toFixed(2)}ms
        `;
        item.appendChild(info);

        // Opacity slider
        const opacityContainer = document.createElement('div');
        opacityContainer.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        `;

        const opacityLabel = document.createElement('span');
        opacityLabel.textContent = 'Opacity:';
        opacityLabel.style.cssText = `
            font-size: 10px;
            margin-right: 10px;
            min-width: 50px;
        `;

        const opacitySlider = document.createElement('input');
        opacitySlider.type = 'range';
        opacitySlider.min = '0';
        opacitySlider.max = '1';
        opacitySlider.step = '0.01';
        opacitySlider.value = layer.opacity;
        opacitySlider.style.cssText = `
            flex: 1;
            height: 4px;
        `;
        opacitySlider.oninput = (e) => {
            layer.opacity = parseFloat(e.target.value);
            this.updatePanel();
        };

        opacityContainer.appendChild(opacityLabel);
        opacityContainer.appendChild(opacitySlider);
        item.appendChild(opacityContainer);

        // Add P5-specific controls
        if (layer.constructor.name === 'P5Layer') {
            const p5Controls = this.createP5Controls(layer);
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
     * Open P5 sketch editor (placeholder for now)
     * @param {P5Layer} layer - P5 layer instance
     */
    openP5Editor(layer) {
        // For now, just show the code in a prompt
        // In a full implementation, this would open a proper code editor
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
