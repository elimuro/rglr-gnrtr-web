/**
 * FrequencyRangeSlider.js - Simple Inline Frequency Range Selector
 * This component provides a simple dual-handle slider that displays audio data
 * on the track itself, designed to integrate seamlessly with existing controls.
 */

export class FrequencyRangeSlider {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            minFrequency: 100,
            maxFrequency: 10000,
            defaultMin: 250,
            defaultMax: 2000,
            width: 300,
            height: 24,
            ...options
        };
        
        this.minFrequency = this.options.defaultMin;
        this.maxFrequency = this.options.defaultMax;
        this.isDragging = false;
        this.dragTarget = null;
        this.audioData = null; // Will be populated with frequency data
        
        this.createSlider();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    createSlider() {
        // Create main container
        this.element = document.createElement('div');
        this.element.className = 'frequency-range-slider-inline';
        this.element.style.cssText = `
            position: relative;
            width: 100%;
            height: ${this.options.height}px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
        `;
        
        // Create frequency label
        this.createFrequencyLabel();
        
        // Create slider track with audio visualization
        this.createSliderTrack();
        
        // Create handles
        this.createHandles();
        
        // Create range indicator
        this.createRangeIndicator();
        
        this.container.appendChild(this.element);
    }
    
    createFrequencyLabel() {
        this.frequencyLabel = document.createElement('div');
        this.frequencyLabel.style.cssText = `
            min-width: 80px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: bold;
            text-align: right;
        `;
        this.element.appendChild(this.frequencyLabel);
    }
    
    createSliderTrack() {
        this.trackContainer = document.createElement('div');
        this.trackContainer.style.cssText = `
            position: relative;
            flex: 1;
            min-width: 0;
            height: 8px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            cursor: pointer;
            overflow: visible;
        `;
        
        // Create audio visualization layer
        this.audioVisualization = document.createElement('div');
        this.audioVisualization.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, 
                rgba(74, 222, 128, 0.1) 0%, 
                rgba(249, 115, 22, 0.1) 50%, 
                rgba(239, 68, 68, 0.1) 100%);
            pointer-events: none;
        `;
        this.trackContainer.appendChild(this.audioVisualization);
        
        // Create track background
        this.track = document.createElement('div');
        this.track.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
            pointer-events: none;
        `;
        this.trackContainer.appendChild(this.track);
        
        this.element.appendChild(this.trackContainer);
    }
    
    createHandles() {
        // Min handle
        this.minHandle = document.createElement('div');
        this.minHandle.className = 'frequency-handle min-handle';
        this.minHandle.style.cssText = `
            position: absolute;
            top: -5px;
            width: 12px;
            height: 18px;
            background: #4ade80;
            border: 1px solid #22c55e;
            border-radius: 6px;
            cursor: ew-resize;
            z-index: 10;
            transition: box-shadow 0.2s ease;
        `;
        this.trackContainer.appendChild(this.minHandle);
        
        // Max handle
        this.maxHandle = document.createElement('div');
        this.maxHandle.className = 'frequency-handle max-handle';
        this.maxHandle.style.cssText = `
            position: absolute;
            top: -5px;
            width: 12px;
            height: 18px;
            background: #f97316;
            border: 1px solid #ea580c;
            border-radius: 6px;
            cursor: ew-resize;
            z-index: 10;
            transition: box-shadow 0.2s ease;
        `;
        this.trackContainer.appendChild(this.maxHandle);
    }
    
    createRangeIndicator() {
        this.rangeIndicator = document.createElement('div');
        this.rangeIndicator.style.cssText = `
            position: absolute;
            top: 1px;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            z-index: 5;
            pointer-events: none;
        `;
        this.trackContainer.appendChild(this.rangeIndicator);
    }
    
    setupEventListeners() {
        // Handle mouse events
        this.minHandle.addEventListener('mousedown', (e) => this.startDragging(e, 'min'));
        this.maxHandle.addEventListener('mousedown', (e) => this.startDragging(e, 'max'));
        
        // Track click events
        this.trackContainer.addEventListener('mousedown', (e) => this.handleTrackClick(e));
        
        // Global mouse events
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.stopDragging(e));
        
        // Touch events for mobile
        this.minHandle.addEventListener('touchstart', (e) => this.startDragging(e, 'min'));
        this.maxHandle.addEventListener('touchstart', (e) => this.startDragging(e, 'max'));
        this.trackContainer.addEventListener('touchstart', (e) => this.handleTrackClick(e));
        document.addEventListener('touchmove', (e) => this.handleMouseMove(e));
        document.addEventListener('touchend', (e) => this.stopDragging(e));
    }
    
    startDragging(e, target) {
        e.preventDefault();
        this.isDragging = true;
        this.dragTarget = target;
        
        // Add visual feedback
        const handle = target === 'min' ? this.minHandle : this.maxHandle;
        handle.style.boxShadow = '0 0 4px rgba(255, 255, 255, 0.5)';
    }
    
    stopDragging(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragTarget = null;
        
        // Remove visual feedback
        this.minHandle.style.boxShadow = '';
        this.maxHandle.style.boxShadow = '';
        
        // Trigger change event
        this.triggerChangeEvent();
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const rect = this.trackContainer.getBoundingClientRect();
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        
        const frequency = this.positionToFrequency(position);
        
        if (this.dragTarget === 'min') {
            this.setMinFrequency(frequency);
        } else if (this.dragTarget === 'max') {
            this.setMaxFrequency(frequency);
        }
        
        this.updateDisplay();
    }
    
    handleTrackClick(e) {
        const rect = this.trackContainer.getBoundingClientRect();
        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const frequency = this.positionToFrequency(position);
        
        // Determine which handle to move based on proximity
        const minPos = this.frequencyToPosition(this.minFrequency);
        const maxPos = this.frequencyToPosition(this.maxFrequency);
        const clickPos = position * 100;
        
        if (Math.abs(clickPos - minPos) < Math.abs(clickPos - maxPos)) {
            this.setMinFrequency(frequency);
        } else {
            this.setMaxFrequency(frequency);
        }
        
        this.updateDisplay();
        this.triggerChangeEvent();
    }
    
    setMinFrequency(frequency) {
        const newMin = Math.max(this.options.minFrequency, Math.min(frequency, this.maxFrequency - 50));
        if (newMin !== this.minFrequency) {
            this.minFrequency = newMin;
            this.triggerChangeEvent();
        }
    }
    
    setMaxFrequency(frequency) {
        const newMax = Math.min(this.options.maxFrequency, Math.max(frequency, this.minFrequency + 50));
        if (newMax !== this.maxFrequency) {
            this.maxFrequency = newMax;
            this.triggerChangeEvent();
        }
    }
    
    frequencyToPosition(frequency) {
        // Convert frequency to position using logarithmic scale
        const minLog = Math.log(this.options.minFrequency);
        const maxLog = Math.log(this.options.maxFrequency);
        const freqLog = Math.log(frequency);
        return ((freqLog - minLog) / (maxLog - minLog)) * 100;
    }
    
    positionToFrequency(position) {
        // Convert position to frequency using logarithmic scale
        const minLog = Math.log(this.options.minFrequency);
        const maxLog = Math.log(this.options.maxFrequency);
        const freqLog = minLog + (position * (maxLog - minLog));
        return Math.exp(freqLog);
    }
    
    updateDisplay() {
        // Update handle positions
        const minPos = this.frequencyToPosition(this.minFrequency);
        const maxPos = this.frequencyToPosition(this.maxFrequency);
        
        this.minHandle.style.left = `calc(${minPos}% - 6px)`;
        this.maxHandle.style.left = `calc(${maxPos}% - 6px)`;
        
        // Update range indicator
        this.rangeIndicator.style.left = `${minPos}%`;
        this.rangeIndicator.style.width = `${maxPos - minPos}%`;
        
        // Update frequency label
        this.frequencyLabel.textContent = `${this.formatFrequency(this.minFrequency)} - ${this.formatFrequency(this.maxFrequency)}`;
        
        // Update audio visualization if data is available
        this.updateAudioVisualization();
    }
    
    updateAudioVisualization() {
        if (!this.audioData) return;
        
        // Create a simple bar visualization based on frequency data
        const bars = [];
        const numBars = 20;
        
        for (let i = 0; i < numBars; i++) {
            const position = i / (numBars - 1);
            const frequency = this.positionToFrequency(position);
            const intensity = this.getAudioIntensity(frequency);
            
            const height = Math.max(1, intensity * 6);
            const opacity = Math.max(0.1, intensity);
            
            bars.push(`
                <div style="
                    position: absolute;
                    left: ${(i / (numBars - 1)) * 100}%;
                    top: ${4 - height/2}px;
                    width: 2px;
                    height: ${height}px;
                    background: rgba(74, 222, 128, ${opacity});
                    border-radius: 1px;
                    transform: translateX(-50%);
                "></div>
            `);
        }
        
        this.audioVisualization.innerHTML = bars.join('');
    }
    
    getAudioIntensity(frequency) {
        if (!this.audioData) return 0.1;
        
        // Use actual audio data based on frequency ranges
        if (frequency < 250) {
            return this.audioData.bass || 0.1;
        } else if (frequency < 500) {
            return this.audioData.lowMid || 0.1;
        } else if (frequency < 2000) {
            return this.audioData.mid || 0.1;
        } else if (frequency < 4000) {
            return this.audioData.highMid || 0.1;
        } else {
            return this.audioData.treble || 0.1;
        }
    }
    
    formatFrequency(frequency) {
        if (frequency >= 1000) {
            return `${(frequency / 1000).toFixed(1)}k`;
        }
        return Math.round(frequency).toString();
    }
    
    triggerChangeEvent() {
        const event = new CustomEvent('frequencyRangeChange', {
            detail: {
                minFrequency: this.minFrequency,
                maxFrequency: this.maxFrequency,
                range: this.maxFrequency - this.minFrequency
            }
        });
        this.element.dispatchEvent(event);
    }
    
    // Public API methods
    getRange() {
        return {
            minFrequency: this.minFrequency,
            maxFrequency: this.maxFrequency,
            range: this.maxFrequency - this.minFrequency
        };
    }
    
    setRange(minFrequency, maxFrequency) {
        this.setMinFrequency(minFrequency);
        this.setMaxFrequency(maxFrequency);
        this.updateDisplay();
    }
    
    setAudioData(audioData) {
        this.audioData = audioData;
        this.updateAudioVisualization();
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 