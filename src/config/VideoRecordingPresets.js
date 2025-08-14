/**
 * Video Recording Presets
 * 
 * Centralizes video recording quality settings, formats, and configuration options
 * used throughout the video recording system, particularly in VideoRecorderSettings.js
 * and VideoRecorder.js.
 * 
 * These presets eliminate hardcoded video settings and provide standardized
 * recording configurations for different quality levels and use cases.
 */

export const VIDEO_RECORDING_PRESETS = {
  /**
   * Quality Presets
   * Different quality levels with corresponding bitrates and settings
   */
  quality: {
    low: { 
      bitrate: 1000000,           // Connected to: VideoRecorderSettings.js bitrate configuration
                                  // Purpose: 1 Mbps for low-quality recordings (small file size)
      label: 'Low (1 Mbps)',      // Connected to: UI quality selector display
                                  // Purpose: Human-readable quality label
      videoBitsPerSecond: 1000000,
      audioBitsPerSecond: 64000   // Purpose: 64 kbps audio for low-quality preset
    },
    
    medium: { 
      bitrate: 3000000,           // Connected to: VideoRecorderSettings.js bitrate configuration
                                  // Purpose: 3 Mbps for medium-quality recordings (balanced)
      label: 'Medium (3 Mbps)',   // Connected to: UI quality selector display
                                  // Purpose: Human-readable quality label
      videoBitsPerSecond: 3000000,
      audioBitsPerSecond: 128000  // Purpose: 128 kbps audio for medium-quality preset
    },
    
    high: { 
      bitrate: 5000000,           // Connected to: VideoRecorderSettings.js bitrate configuration
                                  // Purpose: 5 Mbps for high-quality recordings (large file size)
      label: 'High (5 Mbps)',     // Connected to: UI quality selector display
                                  // Purpose: Human-readable quality label
      videoBitsPerSecond: 5000000,
      audioBitsPerSecond: 192000  // Purpose: 192 kbps audio for high-quality preset
    },
    
    ultra: {
      bitrate: 10000000,          // Connected to: VideoRecorderSettings.js ultra quality option
                                  // Purpose: 10 Mbps for ultra-high-quality recordings
      label: 'Ultra (10 Mbps)',   // Connected to: UI quality selector display
                                  // Purpose: Human-readable quality label
      videoBitsPerSecond: 10000000,
      audioBitsPerSecond: 256000  // Purpose: 256 kbps audio for ultra-quality preset
    },
    
    custom: {
      bitrate: 2000000,           // Connected to: custom quality configuration
                                  // Purpose: Default bitrate for custom quality settings
      label: 'Custom',            // Connected to: UI quality selector display
                                  // Purpose: Label for custom quality option
      videoBitsPerSecond: 2000000,
      audioBitsPerSecond: 96000   // Purpose: Default audio bitrate for custom settings
    }
  },

  /**
   * Video Format Presets
   * Different video formats with MIME types and file extensions
   */
  formats: {
    webm: { 
      mimeType: 'video/webm;codecs=vp9',  // Connected to: VideoRecorder.js MediaRecorder setup
                                          // Purpose: WebM format with VP9 codec for web compatibility
      extension: 'webm',                  // Connected to: file download naming
                                          // Purpose: File extension for WebM files
      label: 'WebM (VP9)',                // Connected to: UI format selector display
                                          // Purpose: Human-readable format label
      codec: 'vp9',                       // Purpose: Video codec identifier
      audioCodec: 'opus'                  // Purpose: Audio codec for WebM format
    },
    
    webm_vp8: {
      mimeType: 'video/webm;codecs=vp8',  // Connected to: VideoRecorder.js alternative codec
                                          // Purpose: WebM format with VP8 codec (wider compatibility)
      extension: 'webm',                  // Connected to: file download naming
                                          // Purpose: File extension for WebM files
      label: 'WebM (VP8)',                // Connected to: UI format selector display
                                          // Purpose: Human-readable format label
      codec: 'vp8',                       // Purpose: Video codec identifier
      audioCodec: 'vorbis'                // Purpose: Audio codec for VP8 WebM
    },
    
    mp4: { 
      mimeType: 'video/mp4;codecs=h264',  // Connected to: VideoRecorder.js MediaRecorder setup
                                          // Purpose: MP4 format with H.264 codec for broad compatibility
      extension: 'mp4',                   // Connected to: file download naming
                                          // Purpose: File extension for MP4 files
      label: 'MP4 (H.264)',               // Connected to: UI format selector display
                                          // Purpose: Human-readable format label
      codec: 'h264',                      // Purpose: Video codec identifier
      audioCodec: 'aac'                   // Purpose: Audio codec for MP4 format
    },
    
    webm_av1: {
      mimeType: 'video/webm;codecs=av01', // Connected to: VideoRecorder.js modern codec option
                                          // Purpose: WebM with AV1 codec for future compatibility
      extension: 'webm',                  // Connected to: file download naming
                                          // Purpose: File extension for WebM files
      label: 'WebM (AV1)',                // Connected to: UI format selector display
                                          // Purpose: Human-readable format label
      codec: 'av01',                      // Purpose: Video codec identifier
      audioCodec: 'opus'                  // Purpose: Audio codec for AV1 WebM
    }
  },

  /**
   * Resolution Presets
   * Standard video resolutions for different use cases
   */
  resolutions: {
    '480p': {
      width: 854,                         // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: Standard definition width
      height: 480,                        // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: Standard definition height
      label: '480p (SD)',                 // Connected to: UI resolution selector display
                                          // Purpose: Human-readable resolution label
      aspectRatio: '16:9',                // Purpose: Aspect ratio identifier
      pixelCount: 409920                  // Purpose: Total pixel count for quality calculations
    },
    
    '720p': {
      width: 1280,                        // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: HD ready width
      height: 720,                        // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: HD ready height
      label: '720p (HD)',                 // Connected to: UI resolution selector display
                                          // Purpose: Human-readable resolution label
      aspectRatio: '16:9',                // Purpose: Aspect ratio identifier
      pixelCount: 921600                  // Purpose: Total pixel count for quality calculations
    },
    
    '1080p': {
      width: 1920,                        // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: Full HD width
      height: 1080,                       // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: Full HD height
      label: '1080p (Full HD)',           // Connected to: UI resolution selector display
                                          // Purpose: Human-readable resolution label
      aspectRatio: '16:9',                // Purpose: Aspect ratio identifier
      pixelCount: 2073600                 // Purpose: Total pixel count for quality calculations
    },
    
    '1440p': {
      width: 2560,                        // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: Quad HD width
      height: 1440,                       // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: Quad HD height
      label: '1440p (QHD)',               // Connected to: UI resolution selector display
                                          // Purpose: Human-readable resolution label
      aspectRatio: '16:9',                // Purpose: Aspect ratio identifier
      pixelCount: 3686400                 // Purpose: Total pixel count for quality calculations
    },
    
    '4k': {
      width: 3840,                        // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: 4K Ultra HD width
      height: 2160,                       // Connected to: VideoRecorderSettings.js resolution configuration
                                          // Purpose: 4K Ultra HD height
      label: '4K (Ultra HD)',             // Connected to: UI resolution selector display
                                          // Purpose: Human-readable resolution label
      aspectRatio: '16:9',                // Purpose: Aspect ratio identifier
      pixelCount: 8294400                 // Purpose: Total pixel count for quality calculations
    },
    
    custom: {
      width: 1920,                        // Connected to: custom resolution configuration
                                          // Purpose: Default width for custom resolution
      height: 1080,                       // Connected to: custom resolution configuration
                                          // Purpose: Default height for custom resolution
      label: 'Custom',                    // Connected to: UI resolution selector display
                                          // Purpose: Label for custom resolution option
      aspectRatio: 'custom',              // Purpose: Custom aspect ratio identifier
      pixelCount: 2073600                 // Purpose: Default pixel count for custom resolution
    }
  },

  /**
   * Frame Rate Presets
   * Standard frame rates for video recording
   */
  frameRates: {
    '24fps': {
      value: 24,                          // Connected to: VideoRecorderSettings.js frame rate configuration
                                          // Purpose: Cinematic frame rate (24 fps)
      label: '24 FPS (Cinematic)',        // Connected to: UI frame rate selector display
                                          // Purpose: Human-readable frame rate label
      use: 'cinematic'                    // Purpose: Use case identifier
    },
    
    '30fps': {
      value: 30,                          // Connected to: VideoRecorderSettings.js frame rate configuration
                                          // Purpose: Standard video frame rate (30 fps)
      label: '30 FPS (Standard)',         // Connected to: UI frame rate selector display
                                          // Purpose: Human-readable frame rate label
      use: 'standard'                     // Purpose: Use case identifier
    },
    
    '60fps': {
      value: 60,                          // Connected to: VideoRecorderSettings.js frame rate configuration
                                          // Purpose: High frame rate for smooth motion (60 fps)
      label: '60 FPS (Smooth)',           // Connected to: UI frame rate selector display
                                          // Purpose: Human-readable frame rate label
      use: 'smooth'                       // Purpose: Use case identifier
    },
    
    '120fps': {
      value: 120,                         // Connected to: VideoRecorderSettings.js frame rate configuration
                                          // Purpose: Very high frame rate for slow motion (120 fps)
      label: '120 FPS (High Speed)',      // Connected to: UI frame rate selector display
                                          // Purpose: Human-readable frame rate label
      use: 'highspeed'                    // Purpose: Use case identifier
    }
  },

  /**
   * Audio Recording Settings
   * Audio-specific recording configurations
   */
  audio: {
    enabled: {
      sampleRate: 48000,                  // Connected to: audio recording sample rate
                                          // Purpose: High-quality audio sample rate (48 kHz)
      channelCount: 2,                    // Connected to: stereo audio recording
                                          // Purpose: Stereo audio recording
      echoCancellation: false,            // Connected to: audio processing settings
                                          // Purpose: Disable echo cancellation for music/audio apps
      noiseSuppression: false,            // Connected to: audio processing settings
                                          // Purpose: Disable noise suppression for faithful recording
      autoGainControl: false              // Connected to: audio processing settings
                                          // Purpose: Disable AGC for consistent audio levels
    },
    
    disabled: {
      enabled: false                      // Connected to: VideoRecorderSettings.js audio toggle
                                          // Purpose: Disable audio recording completely
    },
    
    quality: {
      low: { bitrate: 64000, label: '64 kbps' },
      medium: { bitrate: 128000, label: '128 kbps' },
      high: { bitrate: 192000, label: '192 kbps' },
      ultra: { bitrate: 256000, label: '256 kbps' }
    }
  },

  /**
   * Recording Behavior Settings
   * Configuration for recording behavior and user experience
   */
  behavior: {
    autoStart: false,                     // Connected to: VideoRecorder.js automatic recording start
                                          // Purpose: Whether to start recording automatically
    autoStop: {
      enabled: false,                     // Connected to: automatic recording stop
                                          // Purpose: Whether to stop recording automatically
      duration: 300000,                   // Connected to: auto-stop timer (5 minutes)
                                          // Purpose: Maximum recording duration in milliseconds
      fileSize: 100000000                 // Connected to: auto-stop file size limit (100 MB)
                                          // Purpose: Maximum file size before auto-stop
    },
    
    countdown: {
      enabled: true,                      // Connected to: recording countdown feature
                                          // Purpose: Show countdown before recording starts
      duration: 3000                      // Connected to: countdown timer (3 seconds)
                                          // Purpose: Countdown duration in milliseconds
    },
    
    notifications: {
      start: true,                        // Connected to: recording start notification
                                          // Purpose: Show notification when recording starts
      stop: true,                         // Connected to: recording stop notification
                                          // Purpose: Show notification when recording stops
      error: true                         // Connected to: recording error notification
                                          // Purpose: Show notification on recording errors
    }
  },

  /**
   * Performance and Optimization Settings
   * Settings for optimizing recording performance
   */
  performance: {
    bufferSize: 1048576,                  // Connected to: recording buffer size (1 MB)
                                          // Purpose: Buffer size for recording data
    maxMemoryUsage: 104857600,            // Connected to: memory usage limit (100 MB)
                                          // Purpose: Maximum memory usage for recording
    
    optimization: {
      lowLatency: {
        enabled: false,                   // Connected to: low-latency recording mode
                                          // Purpose: Enable low-latency recording (may reduce quality)
        bufferSize: 65536                 // Purpose: Smaller buffer for low latency (64 KB)
      },
      
      highQuality: {
        enabled: true,                    // Connected to: high-quality recording mode
                                          // Purpose: Enable high-quality recording (default)
        bufferSize: 2097152               // Purpose: Larger buffer for high quality (2 MB)
      }
    },
    
    fallback: {
      enabled: true,                      // Connected to: fallback recording options
                                          // Purpose: Enable fallback when preferred settings fail
      quality: 'medium',                  // Connected to: fallback quality preset
                                          // Purpose: Fallback quality level
      format: 'webm'                      // Connected to: fallback format preset
                                          // Purpose: Fallback format when preferred format fails
    }
  },

  /**
   * File Naming and Export Settings
   * Configuration for file naming and export behavior
   */
  export: {
    naming: {
      prefix: 'rglr_gnrtr_',              // Connected to: VideoRecorder.js file naming
                                          // Purpose: Default prefix for recorded files
      timestamp: true,                    // Connected to: timestamp in filename
                                          // Purpose: Include timestamp in filename
      format: 'YYYY-MM-DD_HH-mm-ss',      // Connected to: timestamp format
                                          // Purpose: Format for timestamp in filename
      suffix: ''                          // Connected to: filename suffix
                                          // Purpose: Optional suffix for filenames
    },
    
    download: {
      auto: true,                         // Connected to: automatic download after recording
                                          // Purpose: Automatically download file after recording
      cleanup: true                       // Connected to: cleanup blob URLs after download
                                          // Purpose: Clean up blob URLs to free memory
    }
  },

  /**
   * Browser Compatibility Settings
   * Settings for handling different browser capabilities
   */
  compatibility: {
    fallbackFormats: ['webm', 'mp4'],     // Connected to: format fallback chain
                                          // Purpose: Order of formats to try if preferred fails
    
    featureDetection: {
      mediaRecorder: true,                // Connected to: MediaRecorder API detection
                                          // Purpose: Check for MediaRecorder API support
      webCodecs: false,                   // Connected to: WebCodecs API detection
                                          // Purpose: Check for WebCodecs API support (future)
      webAssembly: false                  // Connected to: WebAssembly codec detection
                                          // Purpose: Check for WebAssembly codec support
    },
    
    polyfills: {
      enabled: false,                     // Connected to: polyfill loading
                                          // Purpose: Enable polyfills for unsupported features
      mediaRecorder: false                // Connected to: MediaRecorder polyfill
                                          // Purpose: Use MediaRecorder polyfill if needed
    }
  }
};
