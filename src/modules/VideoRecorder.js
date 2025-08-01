/**
 * VideoRecorder.js - Video Recording System
 * This module provides video recording capabilities for the RGLR GNRTR application,
 * allowing users to capture their compositions as video files. It supports both
 * real-time recording and high-quality frame-by-frame capture with various export options.
 */

export class VideoRecorder {
    constructor(app) {
        this.app = app;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingStartTime = 0;
        this.recordingDuration = 0;
        
        // Recording settings
        this.settings = {
            fps: 30,
            quality: 'high', // 'low', 'medium', 'high'
            format: 'webm', // 'webm', 'mp4'
            duration: 10, // seconds
            resolution: 'canvas', // 'canvas', 'custom'
            customWidth: 1920,
            customHeight: 1080
        };
        
        // UI elements
        this.recordingIndicator = null;
        this.timerDisplay = null;
        
        this.setupUI();
    }

    setupUI() {
        // Create recording controls in the top bar
        const topBar = document.getElementById('midi-top-bar');
        if (topBar) {
            const recordingControls = document.createElement('div');
            recordingControls.className = 'flex items-center gap-2';
            recordingControls.innerHTML = `
                <button id="video-record-btn" class="flex items-center gap-1 px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded text-xs transition-all duration-300 hover:bg-opacity-30 hover:border-opacity-50">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                    <span>Record</span>
                </button>
                <div id="recording-timer" class="hidden text-xs text-red-400 font-mono">
                    <span id="recording-time">00:00</span>
                </div>
                <div id="recording-indicator" class="hidden w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            `;
            
            // Insert before the right-side controls
            const rightSide = topBar.querySelector('.flex.items-center.justify-center.md\\:justify-end');
            if (rightSide) {
                rightSide.insertBefore(recordingControls, rightSide.firstChild);
            }
            
            this.recordingIndicator = document.getElementById('recording-indicator');
            this.timerDisplay = document.getElementById('recording-time');
            
            // Add event listeners
            document.getElementById('video-record-btn').addEventListener('click', () => {
                this.toggleRecording();
            });
        }
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        if (this.isRecording) return;
        
        try {
            const canvas = this.app.scene.renderer.domElement;
            
            // Configure recording settings based on quality
            const videoBitsPerSecond = this.getVideoBitrate();
            const mimeType = this.getMimeType();
            
            // Check if the MIME type is supported
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                throw new Error(`MIME type ${mimeType} is not supported by this browser. Please try a different format in settings.`);
            }
            
            const stream = canvas.captureStream(this.settings.fps);
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: videoBitsPerSecond
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Recording error:', event.error);
                this.handleRecordingError(event.error);
            };

            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.recordedChunks = [];
            
            // Update UI
            this.updateRecordingUI(true);
            
            // Auto-stop after duration
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, this.settings.duration * 1000);
            
            console.log('Video recording started');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.handleRecordingError(error);
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        try {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordingDuration = (Date.now() - this.recordingStartTime) / 1000;
            
            // Update UI
            this.updateRecordingUI(false);
            
            console.log('Video recording stopped');
            
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.handleRecordingError(error);
        }
    }

    handleRecordingComplete() {
        if (this.recordedChunks.length === 0) {
            console.warn('No video data recorded');
            return;
        }

        const mimeType = this.getMimeType();
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        this.downloadVideo(blob);
        
        // Show success message with actual format used
        const extension = this.getFileExtension(mimeType);
        this.showNotification(`Video saved as ${extension.toUpperCase()} file`, 'success');
    }

    downloadVideo(blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const mimeType = this.getMimeType();
        const extension = this.getFileExtension(mimeType);
        const filename = `rglr-composition-${timestamp}.${extension}`;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log(`Video downloaded: ${filename}`);
        
        // Show success notification
        this.showNotification('Video recording completed!', 'success');
    }

    handleRecordingError(error) {
        console.error('Recording error:', error);
        this.isRecording = false;
        this.updateRecordingUI(false);
        this.showNotification('Recording failed. Please try again.', 'error');
    }

    updateRecordingUI(isRecording) {
        const recordBtn = document.getElementById('video-record-btn');
        const timer = document.getElementById('recording-timer');
        const indicator = this.recordingIndicator;
        
        if (isRecording) {
            // Update button
            recordBtn.classList.remove('bg-red-500', 'bg-opacity-20', 'text-red-400', 'border-red-500', 'border-opacity-30');
            recordBtn.classList.add('bg-red-500', 'bg-opacity-40', 'text-red-300', 'border-red-400', 'border-opacity-50');
            recordBtn.innerHTML = `
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="12" height="16" rx="2" ry="2"/>
                    <line x1="6" x2="6" y1="2" y2="22"/>
                    <line x1="18" x2="18" y1="2" y2="22"/>
                </svg>
                <span>Stop</span>
            `;
            
            // Show timer and indicator
            timer.classList.remove('hidden');
            indicator.classList.remove('hidden');
            
            // Start timer update
            this.startTimer();
            
        } else {
            // Reset button
            recordBtn.classList.remove('bg-red-500', 'bg-opacity-40', 'text-red-300', 'border-red-400', 'border-opacity-50');
            recordBtn.classList.add('bg-red-500', 'bg-opacity-20', 'text-red-400', 'border-red-500', 'border-opacity-30');
            recordBtn.innerHTML = `
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
                <span>Record</span>
            `;
            
            // Hide timer and indicator
            timer.classList.add('hidden');
            indicator.classList.add('hidden');
            
            // Stop timer
            this.stopTimer();
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isRecording) {
                const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                if (this.timerDisplay) {
                    this.timerDisplay.textContent = timeString;
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getVideoBitrate() {
        switch (this.settings.quality) {
            case 'low': return 1000000; // 1 Mbps
            case 'medium': return 3000000; // 3 Mbps
            case 'high': return 5000000; // 5 Mbps
            default: return 3000000;
        }
    }

    getMimeType() {
        // Define supported MIME types in order of preference
        const supportedTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4;codecs=h264',
            'video/mp4'
        ];

        // If user specifically wants MP4, try MP4 codecs first
        if (this.settings.format === 'mp4') {
            const mp4Types = [
                'video/mp4;codecs=h264',
                'video/mp4',
                'video/webm;codecs=vp9', // fallback to WebM if MP4 not supported
                'video/webm;codecs=vp8',
                'video/webm'
            ];
            
            for (const type of mp4Types) {
                if (MediaRecorder.isTypeSupported(type)) {
                    return type;
                }
            }
        } else {
            // For WebM format, try WebM codecs first
            const webmTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
                'video/mp4;codecs=h264', // fallback to MP4 if WebM not supported
                'video/mp4'
            ];
            
            for (const type of webmTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    return type;
                }
            }
        }

        // If nothing is supported, return the most common fallback
        return 'video/webm;codecs=vp9';
    }

    getFileExtension(mimeType) {
        if (mimeType.includes('mp4')) {
            return 'mp4';
        } else if (mimeType.includes('webm')) {
            return 'webm';
        } else {
            // Fallback based on user preference
            return this.settings.format;
        }
    }

    getSupportedFormats() {
        const formats = [
            { mime: 'video/webm;codecs=vp9', name: 'WebM (VP9)', extension: 'webm' },
            { mime: 'video/webm;codecs=vp8', name: 'WebM (VP8)', extension: 'webm' },
            { mime: 'video/webm', name: 'WebM', extension: 'webm' },
            { mime: 'video/mp4;codecs=h264', name: 'MP4 (H.264)', extension: 'mp4' },
            { mime: 'video/mp4', name: 'MP4', extension: 'mp4' }
        ];

        return formats.filter(format => MediaRecorder.isTypeSupported(format.mime));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 px-4 py-2 rounded text-white text-sm font-medium z-50 transition-all duration-300 transform translate-x-full`;
        
        // Set color based on type
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-500');
                break;
            case 'error':
                notification.classList.add('bg-red-500');
                break;
            default:
                notification.classList.add('bg-blue-500');
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Settings management
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
    }

    getSettings() {
        return { ...this.settings };
    }

    openSettings() {
        // Import and create settings panel dynamically
        import('./VideoRecorderSettings.js').then(module => {
            if (!this.settingsPanel) {
                this.settingsPanel = new module.VideoRecorderSettings(this);
            }
            this.settingsPanel.toggle();
        });
    }

    // Cleanup
    destroy() {
        if (this.isRecording) {
            this.stopRecording();
        }
        this.stopTimer();
        
        if (this.settingsPanel) {
            this.settingsPanel.destroy();
        }
    }
} 