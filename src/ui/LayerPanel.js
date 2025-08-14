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

        return item;
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
