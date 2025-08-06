/**
 * AudioManager.js - Audio Interface Connection and Analysis
 * This module provides audio interface detection, connection management, and real-time frequency analysis
 * for audio-reactive visual effects. It supports multi-channel audio interfaces and provides frequency
 * range analysis for different visual parameters.
 */

export class AudioManager {
    constructor(state) {
        this.state = state;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.mediaStream = null;
        this.isInitialized = false;
        this.isListening = false;
        
        // Audio interface data
        this.availableInterfaces = [];
        this.selectedInterface = null;
        this.selectedChannels = [];
        
        // Audio analysis data
        this.audioData = {
            overall: 0,
            rms: 0,
            peak: 0,
            frequency: 0
        };
        
        // Analysis settings
        this.fftSize = 2048;
        this.smoothing = 0.8;
        this.sensitivity = 1.0;
        
        this.setupStateSubscriptions();
    }

    setupStateSubscriptions() {
        // Subscribe to audio reactivity settings
        this.state.subscribe('audioEnabled', (enabled) => {
            if (enabled) {
                this.startAudioCapture();
            } else {
                this.stopAudioCapture();
            }
        });
        
        this.state.subscribe('audioSensitivity', (sensitivity) => {
            this.sensitivity = sensitivity;
        });
        
        this.state.subscribe('audioSmoothing', (smoothing) => {
            this.smoothing = smoothing;
        });
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = this.smoothing;
            
            // Create frequency data arrays
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.isInitialized = true;
            
            // Update state with audio capabilities
            this.state.set('audioAvailable', true);
            
            // Discover available audio interfaces
            await this.discoverAudioInterfaces();
            
            // Initialize status indicator
            this.updateAudioStatus('No Audio Device', false);
            
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
            this.state.set('audioAvailable', false);
        }
    }

    async discoverAudioInterfaces() {
        try {
            // Get available audio devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            this.availableInterfaces = audioInputs.map((device, index) => ({
                id: device.deviceId,
                label: device.label || `Audio Interface ${index + 1}`,
                index: index,
                groupId: device.groupId
            }));
            
            // Update state with available interfaces
            this.state.set('availableAudioInterfaces', this.availableInterfaces);
            this.state.set('audioInterfaceCount', this.availableInterfaces.length);
            
            // Select first interface by default
            if (this.availableInterfaces.length > 0) {
                this.selectInterface(this.availableInterfaces[0]);
            }
            
        } catch (error) {
            console.error('Failed to discover audio interfaces:', error);
            this.availableInterfaces = [];
            this.state.set('availableAudioInterfaces', []);
            this.state.set('audioInterfaceCount', 0);
        }
    }

    selectInterface(audioInterface) {
        this.selectedInterface = audioInterface;
        this.state.set('selectedAudioInterface', audioInterface);
        
        // Reset channel selection when interface changes
        this.selectedChannels = [];
        this.state.set('selectedAudioChannels', []);
    }

    async getInterfaceChannels(interfaceId) {
        try {
            // Try to get stream with specific device, but with more flexible constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: interfaceId },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: { min: 1, ideal: 2, max: 8 },
                    sampleRate: { min: 22050, ideal: 44100, max: 48000 }
                }
            });
            
            const audioTracks = stream.getAudioTracks();
            const channels = [];
            
            for (let i = 0; i < audioTracks.length; i++) {
                const settings = audioTracks[i].getSettings();
                channels.push({
                    id: i,
                    label: `Channel ${i + 1}`,
                    sampleRate: settings.sampleRate || 44100,
                    channelCount: settings.channelCount || 1
                });
            }
            
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());
            
            return channels;
            
        } catch (error) {
            console.error('Failed to get interface channels:', error);
            
            // If exact device selection fails, try with preferred device
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: { preferred: interfaceId },
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        channelCount: { min: 1, ideal: 2, max: 8 },
                        sampleRate: { min: 22050, ideal: 44100, max: 48000 }
                    }
                });
                
                const audioTracks = stream.getAudioTracks();
                const channels = [];
                
                for (let i = 0; i < audioTracks.length; i++) {
                    const settings = audioTracks[i].getSettings();
                    channels.push({
                        id: i,
                        label: `Channel ${i + 1}`,
                        sampleRate: settings.sampleRate || 44100,
                        channelCount: settings.channelCount || 1
                    });
                }
                
                // Stop the test stream
                stream.getTracks().forEach(track => track.stop());
                
                return channels;
                
            } catch (fallbackError) {
                console.error('Failed to get interface channels with fallback:', fallbackError);
                return [];
            }
        }
    }

    selectChannels(channels) {
        this.selectedChannels = channels;
        this.state.set('selectedAudioChannels', channels);
    }

    async startAudioCapture() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.isListening) return;
        
        if (!this.selectedInterface) {
            console.error('No audio interface selected');
            return;
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Request microphone access with selected interface
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: this.selectedInterface.id },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: { min: 1, ideal: this.selectedChannels.length || 2, max: 8 },
                    sampleRate: { min: 22050, ideal: 44100, max: 48000 }
                }
            });
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Connect to analyser
            this.microphone.connect(this.analyser);
            
            this.isListening = true;
            this.state.set('audioListening', true);
            
            // Update status indicator
            this.updateAudioStatus(this.getCurrentDeviceName(), true);
            
            // Start analysis loop
            this.analyzeAudio();
            
        } catch (error) {
            console.error('Failed to start audio capture with exact device:', error);
            
            // Try with preferred device as fallback
            try {
                // Resume audio context if suspended
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: { preferred: this.selectedInterface.id },
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        channelCount: { min: 1, ideal: this.selectedChannels.length || 2, max: 8 },
                        sampleRate: { min: 22050, ideal: 44100, max: 48000 }
                    }
                });
                
                // Create microphone source
                this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);
                
                // Connect to analyser
                this.microphone.connect(this.analyser);
                
                this.isListening = true;
                this.state.set('audioListening', true);
                
                // Update status indicator
                this.updateAudioStatus(this.getCurrentDeviceName(), true);
                
                // Start analysis loop
                this.analyzeAudio();
                
            } catch (fallbackError) {
                console.error('Failed to start audio capture with fallback:', fallbackError);
                this.state.set('audioListening', false);
                this.updateAudioStatus('No Audio Device', false);
            }
        }
    }

    stopAudioCapture() {
        if (!this.isListening) return;
        
        this.isListening = false;
        this.state.set('audioListening', false);
        
        // Update status indicator
        this.updateAudioStatus('No Audio Device', false);
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
    }

    analyzeAudio() {
        if (!this.isListening || !this.analyser) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeData);
        
        // Calculate RMS (Root Mean Square) for overall volume
        let rms = 0;
        for (let i = 0; i < this.timeData.length; i++) {
            const sample = (this.timeData[i] - 128) / 128;
            rms += sample * sample;
        }
        rms = Math.sqrt(rms / this.timeData.length);
        
        // Calculate peak
        let peak = 0;
        for (let i = 0; i < this.timeData.length; i++) {
            const sample = Math.abs((this.timeData[i] - 128) / 128);
            if (sample > peak) peak = sample;
        }
        
        // Update audio data with smoothing
        this.audioData = {
            overall: this.lerp(this.audioData.overall, rms * this.sensitivity, 0.1),
            rms: this.lerp(this.audioData.rms, rms * this.sensitivity, 0.1),
            peak: this.lerp(this.audioData.peak, peak * this.sensitivity, 0.1),
            frequency: this.calculateDominantFrequency()
        };
        
        // Update state with audio data
        this.updateAudioState();
        
        // Continue analysis loop
        requestAnimationFrame(() => this.analyzeAudio());
    }

    calculateDominantFrequency() {
        let maxValue = 0;
        let dominantBin = 0;
        
        for (let i = 0; i < this.frequencyData.length; i++) {
            if (this.frequencyData[i] > maxValue) {
                maxValue = this.frequencyData[i];
                dominantBin = i;
            }
        }
        
        return (dominantBin * this.audioContext.sampleRate) / this.fftSize;
    }

    updateAudioState() {
        // Update state with current audio data, ensuring all values are numbers
        this.state.set('audioOverall', this.audioData.overall || 0);
        this.state.set('audioRMS', this.audioData.rms || 0);
        this.state.set('audioPeak', this.audioData.peak || 0);
        this.state.set('audioFrequency', this.audioData.frequency || 0);
    }

    // Get audio data for external use
    getAudioData() {
        return { ...this.audioData };
    }

    // Get overall volume
    getVolume() {
        return this.audioData.overall;
    }

    // Linear interpolation helper
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Set analysis parameters
    setAnalysisParams(fftSize, smoothing, sensitivity) {
        this.fftSize = fftSize;
        this.smoothing = smoothing;
        this.sensitivity = sensitivity;
        
        if (this.analyser) {
            this.analyser.fftSize = fftSize;
            this.analyser.smoothingTimeConstant = smoothing;
        }
    }

    // Get available interfaces
    getAvailableInterfaces() {
        return [...this.availableInterfaces];
    }

    // Get selected interface
    getSelectedInterface() {
        return this.selectedInterface;
    }

    // Get selected channels
    getSelectedChannels() {
        return [...this.selectedChannels];
    }

    // Get current audio device name for display
    getCurrentDeviceName() {
        if (this.isListening && this.selectedInterface) {
            return this.selectedInterface.label;
        }
        return 'No Audio Device';
    }

    // Refresh interface list
    async refreshInterfaces() {
        await this.discoverAudioInterfaces();
    }

    // Get raw frequency data for custom analysis (for audio mapping)
    getRawFrequencyData() {
        return {
            frequencyData: this.frequencyData,
            sampleRate: this.audioContext?.sampleRate,
            fftSize: this.fftSize
        };
    }

    // Update audio status indicator in top bar
    updateAudioStatus(deviceName, connected) {
        const statusElement = document.getElementById('audio-status-top');
        if (statusElement) {
            // Find the status dot (first div with rounded-full class)
            const statusDot = statusElement.querySelector('div.rounded-full');
            const statusText = statusElement.querySelector('.text-xs.font-medium.text-white');
            
            if (statusDot) {
                // Remove existing color classes
                statusDot.classList.remove('bg-red-500', 'bg-green-500', 'transition-all', 'duration-300');
                // Add appropriate color based on connection status
                if (connected) {
                    statusDot.classList.add('bg-green-500', 'transition-all', 'duration-300');
                } else {
                    statusDot.classList.add('bg-red-500', 'transition-all', 'duration-300');
                }
            }
            
            if (statusText) {
                statusText.textContent = deviceName;
            }
        }
    }

    // Cleanup
    destroy() {
        this.stopAudioCapture();
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.isInitialized = false;
    }
} 