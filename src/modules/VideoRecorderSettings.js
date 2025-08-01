/**
 * VideoRecorderSettings.js - Video Recording Settings Panel
 * This module provides a settings interface for configuring video recording options
 * including quality, duration, format, and resolution settings.
 */

export class VideoRecorderSettings {
    constructor(videoRecorder) {
        this.videoRecorder = videoRecorder;
        this.isOpen = false;
        this.settingsPanel = null;
        
        this.createSettingsPanel();
    }

    createSettingsPanel() {
        // Create settings panel
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.id = 'video-settings-panel';
        this.settingsPanel.className = 'fixed top-16 right-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-80 z-50 transform translate-x-full transition-transform duration-300';
        this.settingsPanel.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-white font-semibold text-sm">Video Recording Settings</h3>
                <button id="close-video-settings" class="text-gray-400 hover:text-white transition-colors">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <div class="space-y-4">
                <!-- Quality Setting -->
                <div>
                    <label class="block text-xs text-gray-300 mb-2">Quality</label>
                    <select id="video-quality" class="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-sm transition-all duration-300 focus:border-midi-green focus:outline-none">
                        <option value="low">Low (1 Mbps)</option>
                        <option value="medium">Medium (3 Mbps)</option>
                        <option value="high" selected>High (5 Mbps)</option>
                    </select>
                </div>
                
                <!-- Format Setting -->
                <div>
                    <label class="block text-xs text-gray-300 mb-2">Format</label>
                    <select id="video-format" class="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-sm transition-all duration-300 focus:border-midi-green focus:outline-none">
                        <option value="webm" selected>WebM (VP9)</option>
                        <option value="mp4">MP4 (H.264)</option>
                    </select>
                    <div id="supported-formats-info" class="mt-1 text-xs text-gray-400"></div>
                </div>
                
                <!-- Duration Setting -->
                <div>
                    <label class="block text-xs text-gray-300 mb-2">Duration (seconds)</label>
                    <input type="number" id="video-duration" value="10" min="1" max="60" class="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-sm transition-all duration-300 focus:border-midi-green focus:outline-none">
                </div>
                
                <!-- FPS Setting -->
                <div>
                    <label class="block text-xs text-gray-300 mb-2">Frame Rate (FPS)</label>
                    <select id="video-fps" class="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-sm transition-all duration-300 focus:border-midi-green focus:outline-none">
                        <option value="24">24 FPS</option>
                        <option value="30" selected>30 FPS</option>
                        <option value="60">60 FPS</option>
                    </select>
                </div>
                
                <!-- Resolution Setting -->
                <div>
                    <label class="block text-xs text-gray-300 mb-2">Resolution</label>
                    <select id="video-resolution" class="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-sm transition-all duration-300 focus:border-midi-green focus:outline-none">
                        <option value="canvas" selected>Canvas Size</option>
                        <option value="custom">Custom Size</option>
                    </select>
                </div>
                
                <!-- Custom Resolution (hidden by default) -->
                <div id="custom-resolution-group" class="hidden space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs text-gray-300 mb-1">Width</label>
                            <input type="number" id="video-width" value="1920" min="320" max="3840" class="w-full px-2 py-1 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-300 mb-1">Height</label>
                            <input type="number" id="video-height" value="1080" min="240" max="2160" class="w-full px-2 py-1 bg-black bg-opacity-30 border border-gray-600 text-white rounded text-xs transition-all duration-300 focus:border-midi-green focus:outline-none">
                        </div>
                    </div>
                </div>
                
                <!-- Advanced Options -->
                <div class="border-t border-gray-700 pt-4">
                    <h4 class="text-xs text-gray-300 mb-2 font-medium">Advanced Options</h4>
                    
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" id="video-include-audio" class="mr-2 text-midi-green bg-black border-gray-600 rounded focus:ring-midi-green">
                            <span class="text-xs text-gray-300">Include Audio (if available)</span>
                        </label>
                        
                        <label class="flex items-center">
                            <input type="checkbox" id="video-auto-download" checked class="mr-2 text-midi-green bg-black border-gray-600 rounded focus:ring-midi-green">
                            <span class="text-xs text-gray-300">Auto-download when complete</span>
                        </label>
                    </div>
                </div>
                
                <!-- Preset Buttons -->
                <div class="border-t border-gray-700 pt-4">
                    <h4 class="text-xs text-gray-300 mb-2 font-medium">Quick Presets</h4>
                    <div class="grid grid-cols-2 gap-2">
                        <button id="preset-social" class="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-30 rounded text-xs transition-all duration-300 hover:bg-opacity-30">
                            Social Media
                        </button>
                        <button id="preset-hd" class="px-3 py-1 bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30 rounded text-xs transition-all duration-300 hover:bg-opacity-30">
                            HD Quality
                        </button>
                        <button id="preset-fast" class="px-3 py-1 bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 border-opacity-30 rounded text-xs transition-all duration-300 hover:bg-opacity-30">
                            Fast Export
                        </button>
                        <button id="preset-custom" class="px-3 py-1 bg-purple-500 bg-opacity-20 text-purple-400 border border-purple-500 border-opacity-30 rounded text-xs transition-all duration-300 hover:bg-opacity-30">
                            Custom
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.settingsPanel);
        this.setupEventListeners();
        this.loadCurrentSettings();
    }

    setupEventListeners() {
        // Close button
        document.getElementById('close-video-settings').addEventListener('click', () => {
            this.hide();
        });

        // Settings controls
        document.getElementById('video-quality').addEventListener('change', (e) => {
            this.videoRecorder.updateSettings({ quality: e.target.value });
        });

        document.getElementById('video-format').addEventListener('change', (e) => {
            this.videoRecorder.updateSettings({ format: e.target.value });
            this.updateSupportedFormatsInfo();
        });

        document.getElementById('video-duration').addEventListener('change', (e) => {
            this.videoRecorder.updateSettings({ duration: parseInt(e.target.value) });
        });

        document.getElementById('video-fps').addEventListener('change', (e) => {
            this.videoRecorder.updateSettings({ fps: parseInt(e.target.value) });
        });

        document.getElementById('video-resolution').addEventListener('change', (e) => {
            this.videoRecorder.updateSettings({ resolution: e.target.value });
            this.toggleCustomResolution(e.target.value === 'custom');
        });

        document.getElementById('video-width').addEventListener('change', (e) => {
            this.videoRecorder.updateSettings({ customWidth: parseInt(e.target.value) });
        });

        document.getElementById('video-height').addEventListener('change', (e) => {
            this.videoRecorder.updateSettings({ customHeight: parseInt(e.target.value) });
        });

        // Preset buttons
        document.getElementById('preset-social').addEventListener('click', () => {
            this.applyPreset('social');
        });

        document.getElementById('preset-hd').addEventListener('click', () => {
            this.applyPreset('hd');
        });

        document.getElementById('preset-fast').addEventListener('click', () => {
            this.applyPreset('fast');
        });

        document.getElementById('preset-custom').addEventListener('click', () => {
            this.applyPreset('custom');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target) && 
                !e.target.closest('#video-settings-btn')) {
                this.hide();
            }
        });
    }

    loadCurrentSettings() {
        const settings = this.videoRecorder.getSettings();
        
        document.getElementById('video-quality').value = settings.quality;
        document.getElementById('video-format').value = settings.format;
        document.getElementById('video-duration').value = settings.duration;
        document.getElementById('video-fps').value = settings.fps;
        document.getElementById('video-resolution').value = settings.resolution;
        document.getElementById('video-width').value = settings.customWidth;
        document.getElementById('video-height').value = settings.customHeight;
        
        this.toggleCustomResolution(settings.resolution === 'custom');
        
        // Update supported formats info
        this.updateSupportedFormatsInfo();
    }

    updateSupportedFormatsInfo() {
        const supportedFormats = this.videoRecorder.getSupportedFormats();
        const infoElement = document.getElementById('supported-formats-info');
        
        if (supportedFormats.length === 0) {
            infoElement.textContent = 'No video formats supported by this browser';
            infoElement.className = 'mt-1 text-xs text-red-400';
        } else {
            const formatNames = supportedFormats.map(f => f.name).join(', ');
            infoElement.textContent = `Supported: ${formatNames}`;
            infoElement.className = 'mt-1 text-xs text-gray-400';
        }
    }

    toggleCustomResolution(show) {
        const customGroup = document.getElementById('custom-resolution-group');
        if (show) {
            customGroup.classList.remove('hidden');
        } else {
            customGroup.classList.add('hidden');
        }
    }

    applyPreset(preset) {
        const presets = {
            social: {
                quality: 'medium',
                format: 'webm',
                duration: 15,
                fps: 30,
                resolution: 'canvas'
            },
            hd: {
                quality: 'high',
                format: 'webm',
                duration: 10,
                fps: 60,
                resolution: 'custom',
                customWidth: 1920,
                customHeight: 1080
            },
            fast: {
                quality: 'low',
                format: 'webm',
                duration: 5,
                fps: 24,
                resolution: 'canvas'
            },
            custom: {
                quality: 'high',
                format: 'mp4',
                duration: 10,
                fps: 30,
                resolution: 'custom',
                customWidth: 1280,
                customHeight: 720
            }
        };

        const presetSettings = presets[preset];
        if (presetSettings) {
            this.videoRecorder.updateSettings(presetSettings);
            this.loadCurrentSettings();
            
            // Show feedback
            this.showPresetFeedback(preset);
        }
    }

    showPresetFeedback(preset) {
        const presetNames = {
            social: 'Social Media',
            hd: 'HD Quality',
            fast: 'Fast Export',
            custom: 'Custom'
        };

        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded z-50 transition-all duration-300 transform translate-x-full';
        notification.textContent = `${presetNames[preset]} preset applied`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    show() {
        this.settingsPanel.classList.remove('translate-x-full');
        this.isOpen = true;
    }

    hide() {
        this.settingsPanel.classList.add('translate-x-full');
        this.isOpen = false;
    }

    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        if (this.settingsPanel && this.settingsPanel.parentNode) {
            this.settingsPanel.parentNode.removeChild(this.settingsPanel);
        }
    }
} 