/**
 * Animation Constants
 * 
 * Centralizes animation calculations, mathematical operations, and timing values
 * used throughout the animation systems, particularly in ShapeAnimationManager.js
 * 
 * These constants eliminate scattered magic numbers in animation calculations
 * and provide a single source of truth for animation behavior parameters.
 */

export const ANIMATION_CONSTANTS = {
  /**
   * Random Seed Multipliers
   * Used in mathematical random generation functions throughout animation system
   */
  randomSeeds: {
    multiplier1: 12.9898,   // Connected to: ShapeAnimationManager.js pseudorandom functions
                            // Purpose: Primary multiplier for pseudo-random number generation
    multiplier2: 78.233,    // Connected to: ShapeAnimationManager.js pseudorandom functions  
                            // Purpose: Secondary multiplier for pseudo-random number generation
    multiplier3: 43758.5453, // Connected to: ShapeAnimationManager.js pseudorandom functions
                            // Purpose: Large multiplier for final random value scaling
    offsetMultiplier: 1000,  // Purpose: Multiplier for creating seed offsets between shapes
    timeMultiplier: 100,     // Purpose: Multiplier for time-based random variations
    positionMultiplier: 500  // Purpose: Multiplier for position-based random variations
  },

  /**
   * Wave Speed Configuration
   * Controls the base speeds for different types of wave-based animations
   */
  waveSpeed: {
    default: 2.0,     // Connected to: ShapeAnimationManager.js default wave calculations
                      // Purpose: Standard wave speed for most animations
    slow: 0.5,        // Purpose: Slow wave speed for gentle animations
    fast: 3.0,        // Purpose: Fast wave speed for energetic animations  
    chaos: 1.5,       // Purpose: Wave speed for chaotic/random patterns
    movement: 1.8,    // Connected to: movement animation calculations
                      // Purpose: Specific wave speed for movement animations
    rotation: 2.2,    // Connected to: rotation animation calculations
                      // Purpose: Specific wave speed for rotation animations
    scaling: 1.0,     // Connected to: scaling animation calculations
                      // Purpose: Specific wave speed for scaling animations
    morphing: 0.8     // Connected to: morphing animation calculations
                      // Purpose: Slower wave speed for smooth morphing transitions
  },

  /**
   * Scaling Bounds and Limits
   * Controls the range of scaling values for various animation effects
   */
  scaling: {
    min: 0.1,         // Connected to: ShapeAnimationManager.js scale clamping
                      // Purpose: Minimum scale to prevent shapes from disappearing
    max: 3.0,         // Connected to: ShapeAnimationManager.js scale clamping
                      // Purpose: Maximum scale to prevent excessive size
    default: 1.0,     // Purpose: Default/neutral scale value
    centerMin: 0.5,   // Connected to: center scaling calculations
                      // Purpose: Minimum scale for center-based scaling effects
    centerMax: 2.0,   // Connected to: center scaling calculations
                      // Purpose: Maximum scale for center-based scaling effects
    morphingMin: 0.8, // Connected to: morphing scale transitions
                      // Purpose: Minimum scale during morphing to maintain visibility
    morphingMax: 1.2  // Connected to: morphing scale transitions
                      // Purpose: Maximum scale during morphing to prevent distortion
  },

  /**
   * Animation Offset Configuration
   * Controls timing offsets and phase differences between animated elements
   */
  offsets: {
    movement: [0.5, 0.3, 0.1],  // Connected to: ShapeAnimationManager.js movement phase offsets
                                // Purpose: X, Y, Z axis phase offsets for movement animations
    rotation: [0.3, 0.3],       // Connected to: ShapeAnimationManager.js rotation phase offsets
                                // Purpose: Rotation phase offsets for X and Y axes
    scale: [0.5, 0.5],          // Connected to: ShapeAnimationManager.js scale phase offsets
                                // Purpose: Scale phase offsets for different scale components
    morphing: [0.2, 0.4, 0.6],  // Connected to: morphing system phase offsets
                                // Purpose: Phase offsets for morphing transitions
    centerScaling: 0.25,        // Connected to: center scaling calculations
                                // Purpose: Phase offset for center-based scaling waves
    shapeCycling: 0.1           // Connected to: shape cycling timing
                                // Purpose: Phase offset between shape cycling events
  },

  /**
   * Animation Pattern Configuration
   * Controls how animations are distributed and synchronized across shapes
   */
  patterns: {
    cellSeedMultipliers: [1000, 100, 500], // Connected to: ShapeAnimationManager.js grid-based seed generation
                                           // Purpose: Multipliers for creating unique seeds per grid cell
    clusterSize: 3,                        // Connected to: clustering animation patterns
                                           // Purpose: Number of shapes that animate together in clusters
    staggerDelay: 0.1,                     // Connected to: staggered animation timing
                                           // Purpose: Delay between staggered animation starts (in seconds)
    waveSpread: 2.0,                       // Connected to: wave propagation across grid
                                           // Purpose: How far wave effects spread across the grid
    spiralTightness: 0.5,                  // Connected to: spiral animation patterns
                                           // Purpose: How tightly spiral effects wind (0=loose, 1=tight)
    pulseRadius: 1.5,                      // Connected to: radial pulse animations
                                           // Purpose: Radius of pulse effects from center
    chaosIntensity: 0.3                    // Connected to: chaos pattern generation
                                           // Purpose: Intensity of chaotic/random pattern elements
  },

  /**
   * Center Scaling Configuration
   * Specific constants for center-based scaling animations
   */
  centerScaling: {
    animationClamp: { min: -0.5, max: 0.5 }, // Connected to: ShapeAnimationManager.js center scaling calculations
                                             // Purpose: Clamps center scaling animation values to prevent extremes
    intensityRange: { min: 0.1, max: 0.9 },  // Connected to: center scaling intensity calculations
                                             // Purpose: Valid range for center scaling intensity parameter
    radiusMultiplier: 0.2,                   // Connected to: center scaling radius calculations
                                             // Purpose: Multiplier for converting radius to animation strength
    falloffExponent: 2.0,                    // Connected to: center scaling distance falloff
                                             // Purpose: Exponent for distance-based scaling falloff
    waveFrequency: 1.5,                      // Connected to: center scaling wave calculations
                                             // Purpose: Base frequency for center scaling waves
    pulseSpeed: 1.0                          // Connected to: center scaling pulse timing
                                             // Purpose: Speed of pulsing effects in center scaling
  },

  /**
   * Easing and Interpolation Configuration
   * Controls smoothing and transition curves for animations
   */
  easing: {
    lerpFactor: 0.1,          // Connected to: linear interpolation in animation updates
                              // Purpose: Smoothing factor for animation value transitions
    smoothingStrength: 0.8,   // Connected to: animation smoothing calculations
                              // Purpose: Strength of smoothing applied to animation values
    bounceHeight: 0.2,        // Connected to: bounce animation calculations
                              // Purpose: Height of bounce effects in animations
    overshoot: 0.1,           // Connected to: overshoot easing calculations
                              // Purpose: Amount of overshoot in easing transitions
    dampening: 0.95,          // Connected to: animation dampening calculations
                              // Purpose: Dampening factor for reducing animation intensity over time
    springTension: 0.6,       // Connected to: spring-based animations
                              // Purpose: Tension in spring-based animation calculations
    springFriction: 0.8       // Connected to: spring-based animations
                              // Purpose: Friction in spring-based animation calculations
  },

  /**
   * Timing and Synchronization
   * Controls timing relationships and synchronization between different animation systems
   */
  timing: {
    beatSyncTolerance: 0.05,     // Connected to: BPM synchronization calculations
                                 // Purpose: Tolerance for beat alignment (5% of beat duration)
    transitionDuration: 0.5,     // Connected to: animation state transitions
                                 // Purpose: Default duration for animation transitions (seconds)
    morphingDuration: 1.0,       // Connected to: shape morphing transitions
                                 // Purpose: Default duration for morphing animations (seconds)
    fadeInDuration: 0.3,         // Connected to: animation fade-in effects
                                 // Purpose: Duration for animation fade-in transitions
    fadeOutDuration: 0.2,        // Connected to: animation fade-out effects
                                 // Purpose: Duration for animation fade-out transitions
    maxAnimationTime: 60.0,      // Connected to: animation time clamping
                                 // Purpose: Maximum animation time to prevent overflow
    minFrameTime: 0.016,         // Connected to: frame time calculations (60 FPS)
                                 // Purpose: Minimum frame time for animation calculations
    maxFrameTime: 0.1            // Connected to: frame time clamping
                                 // Purpose: Maximum frame time to prevent animation jumps
  },

  /**
   * Performance and Optimization
   * Constants related to animation performance and optimization
   */
  performance: {
    cullingDistance: 50,         // Connected to: animation culling calculations
                                 // Purpose: Distance beyond which animations are not calculated
    updateFrequency: 1,          // Connected to: animation update frequency control
                                 // Purpose: Update animations every N frames (1 = every frame)
    batchSize: 100,              // Connected to: batch processing of animations
                                 // Purpose: Number of shapes to process in each animation batch
    maxActiveAnimations: 500,    // Connected to: animation system limits
                                 // Purpose: Maximum number of simultaneous active animations
    lowPerformanceThreshold: 30, // Connected to: performance-based animation reduction
                                 // Purpose: FPS threshold below which animations are simplified
    memoryPoolSize: 1000,        // Connected to: animation object pooling
                                 // Purpose: Size of object pool for animation calculations
    recycleThreshold: 0.8        // Connected to: animation object recycling
                                 // Purpose: Memory usage threshold for recycling animation objects
  },

  /**
   * Mathematical Constants
   * Mathematical values used in animation calculations
   */
  math: {
    pi: Math.PI,                 // Purpose: Pi constant for trigonometric calculations
    twoPi: Math.PI * 2,          // Purpose: 2π for full circle calculations
    halfPi: Math.PI / 0.5,       // Purpose: π/2 for quarter circle calculations
    goldenRatio: 1.618033988749, // Purpose: Golden ratio for aesthetically pleasing proportions
    eulerNumber: 2.718281828459, // Purpose: Euler's number for exponential calculations
    degToRad: Math.PI / 180,     // Purpose: Convert degrees to radians
    radToDeg: 180 / Math.PI,     // Purpose: Convert radians to degrees
    sqrt2: Math.sqrt(2),         // Purpose: Square root of 2 for diagonal calculations
    sqrt3: Math.sqrt(3)          // Purpose: Square root of 3 for triangular calculations
  }
};
