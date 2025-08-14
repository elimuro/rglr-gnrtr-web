/**
 * Musical Constants
 * 
 * Centralizes musical timing, BPM limits, and division calculations
 * used throughout the BPM timing and animation systems.
 * 
 * These constants eliminate hardcoded musical values in BPMTimingManager.js
 * and provide a single source of truth for musical timing calculations.
 */

export const MUSICAL_CONSTANTS = {
  /**
   * BPM (Beats Per Minute) Configuration
   * Used in BPMTimingManager.js and GUIManager.js
   */
  bpm: {
    min: 1,      // Minimum BPM to prevent division by zero in timing calculations
                 // Connected to: BPMTimingManager.js setBPM() validation
    max: 300,    // Maximum reasonable BPM for musical applications
                 // Connected to: BPMTimingManager.js setBPM() validation, GUIManager.js BPM control
    default: 120, // Standard 120 BPM default for electronic music
                 // Connected to: StateManager.js fallback state, default-scene.json
    slowMin: 60, // Minimum BPM for slow music genres
    fastMax: 180, // Maximum BPM for most dance music
    extremeMax: 200 // Maximum BPM for extreme genres (drum & bass, etc.)
  },

  /**
   * Time Signature Configuration
   * Currently assumes 4/4 time signature throughout the system
   */
  timeSignature: {
    beatsPerBar: 4,  // Assumes 4/4 time signature (4 beats per bar)
                     // Connected to: BPMTimingManager.js getMusicalPosition(), bar calculations
    noteValue: 4,    // Quarter note gets the beat in 4/4 time
                     // Purpose: Standard time signature reference
    subdivision: 16  // 16th note subdivision for fine timing
                     // Purpose: Finest timing resolution for animations
  },

  /**
   * Musical Note Divisions
   * Maps musical note divisions to beat fractions for timing calculations
   * Used extensively in BPMTimingManager.js and ShapeAnimationManager.js
   */
  divisions: {
    // Connected to: BPMTimingManager.js divisionMap, ShapeAnimationManager.js getDivisionBeats()
    // Purpose: Maps musical note divisions to beat fractions for timing calculations
    
    '64th': 0.0625,   // 1/16 of a beat (64th note in 4/4 time) - very fast animations
    '32nd': 0.125,    // 1/8 of a beat (32nd note) - fast detail animations
    '16th': 0.25,     // 1/4 of a beat (16th note) - common for fast animations
    '8th': 0.5,       // 1/2 of a beat (8th note) - default movement division
    'quarter': 1,     // 1 beat (quarter note) - default shape cycling
    'half': 2,        // 2 beats (half note) - slower animations
    'whole': 4,       // 4 beats (whole note) - very slow changes
    
    // Bar-based divisions for longer form changes
    '1bar': 4,        // 1 bar = 4 beats in 4/4 time
    '2bars': 8,       // 2 bars = 8 beats - medium form changes
    '4bars': 16,      // 4 bars = 16 beats - long form changes
    '8bars': 32,      // 8 bars = 32 beats - very long form changes
    '16bars': 64      // 16 bars = 64 beats - structural changes
  },

  /**
   * Musical Sync Configuration
   * Controls timing precision and sync detection
   */
  sync: {
    tolerance: 0.01,        // 10ms tolerance for musical sync alignment detection
                           // Connected to: BPMTimingManager.js isAlignedWithDivision()
    beatTolerance: 0.05,   // 5% of beat duration tolerance for beat detection
                           // Purpose: Flexible beat alignment detection
    barTolerance: 0.02,    // 2% of bar duration tolerance for bar alignment
                           // Purpose: Precise bar alignment detection
    quantizeStrength: 0.8  // Strength of quantization (0=none, 1=strict)
                           // Purpose: How strictly to quantize to musical grid
  },

  /**
   * Default Musical Divisions for Different Animation Types
   * Provides sensible defaults for different animation systems
   */
  defaultDivisions: {
    movement: '8th',       // Default division for movement animations
    rotation: 'quarter',   // Default division for rotation animations
    scaling: 'half',       // Default division for scaling animations
    morphing: '2bars',     // Default division for morphing transitions
    lighting: '4bars',     // Default division for lighting changes
    effects: '16th'        // Default division for effect animations
  }
};

/**
 * Audio Processing Constants
 * 
 * Centralizes audio analysis parameters, sample rates, and processing settings
 * used in AudioManager.js and related audio processing systems.
 */
export const AUDIO_PROCESSING = {
  /**
   * FFT (Fast Fourier Transform) Configuration
   * Used in AudioManager.js for frequency analysis
   */
  fft: {
    size: 2048,      // FFT size for frequency analysis (higher = more frequency resolution)
                     // Connected to: AudioManager.js analyser.fftSize
    smoothing: 0.8,  // Temporal smoothing of frequency data (0.8 = heavy smoothing)
                     // Connected to: AudioManager.js analyser.smoothingTimeConstant
    minSize: 256,    // Minimum FFT size for low-end devices
    maxSize: 8192,   // Maximum FFT size for high-end analysis
    defaultSize: 2048 // Default FFT size for balanced performance/quality
  },

  /**
   * Audio Sample Rate Configuration
   * Used in AudioManager.js getUserMedia constraints
   */
  sampleRates: {
    min: 22050,      // Minimum sample rate for audio capture (CD quality / 2)
                     // Connected to: AudioManager.js getUserMedia constraints
    ideal: 44100,    // CD quality sample rate - standard for audio applications
                     // Connected to: AudioManager.js getUserMedia ideal constraint
    max: 48000,      // Professional audio sample rate maximum
                     // Connected to: AudioManager.js getUserMedia max constraint
    lowQuality: 16000, // Low quality sample rate for performance
    highQuality: 96000 // High quality sample rate for professional use
  },

  /**
   * Audio Channel Configuration
   * Controls stereo/mono audio input processing
   */
  channels: {
    min: 1,          // Minimum mono audio input
                     // Connected to: AudioManager.js getUserMedia channelCount constraints
    ideal: 2,        // Stereo audio input for better spatial analysis
                     // Connected to: AudioManager.js getUserMedia ideal channelCount
    max: 8,          // Support for multi-channel audio interfaces
                     // Connected to: AudioManager.js getUserMedia max channelCount
    default: 2       // Default to stereo for most applications
  },

  /**
   * Audio Data Smoothing Configuration
   * Controls how audio data is smoothed and processed
   */
  smoothing: {
    lerpFactor: 0.1,        // Linear interpolation factor for audio data smoothing
                            // Connected to: AudioManager.js lerp() function in analyzeAudio()
    temporalSmoothing: 0.8, // Temporal smoothing for frequency data
    spatialSmoothing: 0.3,  // Spatial smoothing across frequency bins
    peakDecay: 0.95,        // Peak decay rate for peak detection
    noiseGate: 0.01         // Noise gate threshold (ignore signals below this)
  },

  /**
   * Audio Value Normalization
   * Constants for converting between audio formats and MIDI values
   */
  normalization: {
    midiCenter: 128,    // MIDI center value for audio sample normalization
                        // Connected to: AudioManager.js time domain data normalization
    midiMax: 255,       // Maximum value for 8-bit audio data
                        // Purpose: Maximum value for 8-bit audio data
    audioMax: 1.0,      // Maximum normalized audio value
    audioMin: -1.0,     // Minimum normalized audio value
    dbRange: 60         // Dynamic range in decibels for audio analysis
  },

  /**
   * Frequency Band Configuration
   * Defines frequency ranges for bass, mid, and treble analysis
   */
  frequencyBands: {
    bass: {
      min: 20,         // Bass frequency minimum (Hz)
      max: 250,        // Bass frequency maximum (Hz)
      center: 80       // Bass frequency center for analysis
    },
    mid: {
      min: 250,        // Mid frequency minimum (Hz)
      max: 4000,       // Mid frequency maximum (Hz)
      center: 1000     // Mid frequency center for analysis
    },
    treble: {
      min: 4000,       // Treble frequency minimum (Hz)
      max: 20000,      // Treble frequency maximum (Hz)
      center: 8000     // Treble frequency center for analysis
    },
    subBass: {
      min: 20,         // Sub-bass frequency minimum (Hz)
      max: 60,         // Sub-bass frequency maximum (Hz)
      center: 40       // Sub-bass frequency center
    },
    presence: {
      min: 2000,       // Presence frequency minimum (Hz)
      max: 8000,       // Presence frequency maximum (Hz)
      center: 4000     // Presence frequency center
    }
  },

  /**
   * Audio Analysis Configuration
   * Controls how audio is analyzed and processed for visual feedback
   */
  analysis: {
    updateRate: 60,          // Audio analysis update rate (Hz)
    bufferSize: 1024,        // Audio buffer size for processing
    windowFunction: 'hann',  // Window function for FFT analysis
    overlapRatio: 0.5,       // Overlap ratio for windowed analysis
    spectralCentroid: true,  // Calculate spectral centroid
    spectralRolloff: true,   // Calculate spectral rolloff
    zeroCrossingRate: true,  // Calculate zero crossing rate
    mfcc: false              // Calculate MFCC features (expensive)
  },

  /**
   * Audio Sensitivity Configuration
   * Controls how sensitive the system is to audio input
   */
  sensitivity: {
    low: 0.3,        // Low sensitivity multiplier
    medium: 0.6,     // Medium sensitivity multiplier
    high: 1.0,       // High sensitivity multiplier
    extreme: 1.5,    // Extreme sensitivity multiplier
    default: 0.6     // Default sensitivity level
  }
};
