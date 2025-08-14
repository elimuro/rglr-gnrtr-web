/**
 * DOMCache - Performance optimization module for caching DOM elements
 * 
 * This module provides a centralized caching system for DOM elements to reduce
 * the performance impact of repeated document.getElementById() calls, especially
 * during real-time MIDI and audio processing.
 */

export class DOMCache {
    constructor() {
        this.cache = new Map();
        this.cacheInitialized = false;
        
        // Initialize cache when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeCache();
            });
        } else {
            // DOM is already ready
            setTimeout(() => this.initializeCache(), 0);
        }
        
        this.frequentlyAccessedElements = [
            // MIDI-related elements
            'midi-connect',
            'midi-disconnect',
            'midi-refresh',
            'midi-preset-select',
            'midi-drawer-container',
            'midi-activity-stream',
            'midi-activity-count',
            'midi-activity-clear',
            'midi-activity-pause',
            'midi-activity-max',
            'midi-activity-autoscroll',
            'midi-activity-filter-clock',
            'midi-activity-status',
            'midi-activity-device',
            'midi-activity-rate',
            'midi-activity-last',
            'midi-cc-count',
            'midi-note-count',
            'midi-pitch-count',
            'midi-system-count',
            'midi-status',
            'midi-device-selection',
            'midi-input-select',
            'midi-connect-selected',
            'midi-cancel-selection',
            'drawer-connect-content',
            'drawer-midi-activity',
            
            // Control elements
            'add-cc-control',
            'add-note-control',
            'add-audio-mapping-control',
            'mapping-test',
            'mapping-save',
            'mapping-load',
            'preset-file-input',
            'cc-controls-container',
            'note-controls-container',
            'audio-mapping-controls-container',
            'cc-connect-midi',
            'note-connect-midi',
            'audio-mapping-connect-audio',
            
            // Scene management
            'scene-preset-select',
            'save-scene-button',
            'load-scene-button',
            
            // Audio interface
            'audio-interface-select',
            'audio-channels-container',
            'audio-connect',
            'audio-disconnect',
            'audio-refresh-interfaces',
            'audio-status-indicator',
            'audio-status-text',
            
            // Interpolation controls
            'interpolation-duration',
            'interpolation-duration-value',
            'interpolation-easing',
            'debug-interpolation',
            
            // Animation controls
            'midi-stop-animation'
        ];
    }

    /**
     * Initialize the DOM cache by pre-loading frequently accessed elements
     * This should be called after the DOM is ready
     */
    initializeCache() {
        if (this.cacheInitialized) {
            return;
        }

        // Check if DOM is ready
        if (document.readyState === 'loading') {
            // DOM not ready yet, try again later
            setTimeout(() => this.initializeCache(), 100);
            return;
        }

        console.log('Initializing DOM cache...');
        
        this.frequentlyAccessedElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.cache.set(id, element);
            } else {
                // Only log missing elements in debug mode to reduce console noise
                if (window.DEBUG_MODE) {
                    console.warn(`DOMCache: Element with id '${id}' not found during initialization`);
                }
            }
        });

        this.cacheInitialized = true;
        console.log(`DOMCache initialized with ${this.cache.size} elements`);
    }

    /**
     * Get a cached DOM element, or fetch and cache it if not already cached
     * @param {string} id - The element ID
     * @returns {HTMLElement|null} The DOM element or null if not found
     */
    getElement(id) {
        // If cache is not initialized, try to initialize it
        if (!this.cacheInitialized) {
            this.initializeCache();
        }

        // Check if element is already cached
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        // Element not in cache, fetch it and cache for future use
        const element = document.getElementById(id);
        if (element) {
            this.cache.set(id, element);
        }
        
        return element;
    }

    /**
     * Get multiple elements at once
     * @param {string[]} ids - Array of element IDs
     * @returns {Map<string, HTMLElement>} Map of ID to element
     */
    getElements(ids) {
        const elements = new Map();
        ids.forEach(id => {
            const element = this.getElement(id);
            if (element) {
                elements.set(id, element);
            }
        });
        return elements;
    }

    /**
     * Check if an element exists in the cache
     * @param {string} id - The element ID
     * @returns {boolean} True if element is cached
     */
    isCached(id) {
        return this.cache.has(id);
    }

    /**
     * Manually cache an element
     * @param {string} id - The element ID
     * @param {HTMLElement} element - The DOM element
     */
    cacheElement(id, element) {
        this.cache.set(id, element);
    }

    /**
     * Remove an element from cache
     * @param {string} id - The element ID
     */
    uncacheElement(id) {
        this.cache.delete(id);
    }

    /**
     * Clear the entire cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheInitialized = false;
        console.log('DOMCache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            totalCached: this.cache.size,
            initialized: this.cacheInitialized,
            frequentlyAccessedCount: this.frequentlyAccessedElements.length
        };
    }

    /**
     * Refresh the cache by re-fetching all elements
     * Useful if DOM structure has changed
     */
    refreshCache() {
        this.clearCache();
        this.initializeCache();
    }
}
