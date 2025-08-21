/**
 * Default Scene Configuration
 * 
 * Centralizes default scene parameters and initial state values used throughout
 * the application, particularly in StateManager.js getFallbackState().
 * 
 * This configuration eliminates hardcoded default values in StateManager and
 * provides a single source of truth for application initialization.
 */

export const DEFAULT_SCENE_CONFIG = {
  /**
   * Global Timing Configuration
   * Master timing and animation speed settings
   */
  timing: {
    globalBPM: 120,                     // Connected to: StateManager.js fallback state, BPMTimingManager.js
                                        // Purpose: Master BPM for all musical timing and synchronization
    animationSpeed: 1.89,               // Connected to: StateManager.js fallback state, AnimationLoop.js
                                        // Purpose: Global multiplier for all animation speeds
    animationType: 0                    // Connected to: StateManager.js fallback state
                                        // Purpose: Default animation type index
  },

  /**
   * Grid and Layout Configuration
   * Shape grid layout and composition settings
   */
  grid: {
    width: 19,                          // Connected to: StateManager.js fallback state, Scene.js grid creation
                                        // Purpose: Default horizontal number of shapes in display grid
    height: 6,                          // Connected to: StateManager.js fallback state, Scene.js grid creation
                                        // Purpose: Default vertical number of shapes in display grid
    cellSize: 0.76,                     // Connected to: StateManager.js fallback state, GridManager.js
                                        // Purpose: Default spacing between grid cells and base shape size
    compositionWidth: 30,               // Connected to: StateManager.js fallback state, GridManager.js
                                        // Purpose: Default width of the shape composition grid
    compositionHeight: 30,              // Connected to: StateManager.js fallback state, GridManager.js
                                        // Purpose: Default height of the shape composition grid
    showGrid: false,                    // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Default visibility state for grid lines
    randomness: 1,                      // Connected to: StateManager.js fallback state, GridManager.js
                                        // Purpose: Default randomness in shape selection (0=ordered, 1=random)
    gridColor: "#ff0000"                // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Default color for grid lines
  },

  /**
   * Animation System Configuration
   * Default states for various animation systems
   */
  animation: {
    enableShapeCycling: false,          // Connected to: StateManager.js fallback state
                                        // Purpose: Default state for shape cycling animation
    enableMovementAnimation: false,     // Connected to: StateManager.js fallback state
                                        // Purpose: Default state for movement animation
    enableRotationAnimation: false,     // Connected to: StateManager.js fallback state
                                        // Purpose: Default state for rotation animation
    enableScaleAnimation: false,        // Connected to: StateManager.js fallback state
                                        // Purpose: Default state for scale animation
    enableSizeAnimation: true,          // Connected to: StateManager.js fallback state
                                        // Purpose: Default state for size animation
    
    // Animation Amplitudes
    movementAmplitude: 0.08,            // Connected to: StateManager.js fallback state, ShapeAnimationManager.js
                                        // Purpose: Default amplitude for movement animations
    rotationAmplitude: 0.5,             // Connected to: StateManager.js fallback state, ShapeAnimationManager.js
                                        // Purpose: Default amplitude for rotation animations
    scaleAmplitude: 0.2,                // Connected to: StateManager.js fallback state, ShapeAnimationManager.js
                                        // Purpose: Default amplitude for scale animations
    
    // Shape Cycling Configuration
    shapeCyclingSpeed: 0.4,             // Connected to: StateManager.js fallback state
                                        // Purpose: Default speed for shape cycling
    shapeCyclingPattern: 0,             // Connected to: StateManager.js fallback state
                                        // Purpose: Default pattern for shape cycling (0=Sequential)
    shapeCyclingDirection: 0,           // Connected to: StateManager.js fallback state
                                        // Purpose: Default direction for shape cycling (0=Forward)
    shapeCyclingSync: 0,                // Connected to: StateManager.js fallback state
                                        // Purpose: Default sync mode for shape cycling (0=Independent)
    shapeCyclingIntensity: 1,           // Connected to: StateManager.js fallback state
                                        // Purpose: Default intensity for shape cycling
    shapeCyclingTrigger: 0              // Connected to: StateManager.js fallback state
                                        // Purpose: Default trigger mode for shape cycling (0=Time-based)
  },

  /**
   * Musical Division Configuration
   * Default musical divisions for different animation types
   */
  divisions: {
    shapeCyclingDivision: "quarter",    // Connected to: StateManager.js fallback state, BPMTimingManager.js
                                        // Purpose: Default musical division for shape cycling
    movementDivision: "8th",            // Connected to: StateManager.js fallback state, BPMTimingManager.js
                                        // Purpose: Default musical division for movement animations
    rotationDivision: "16th",           // Connected to: StateManager.js fallback state, BPMTimingManager.js
                                        // Purpose: Default musical division for rotation animations
    scaleDivision: "half",              // Connected to: StateManager.js fallback state, BPMTimingManager.js
                                        // Purpose: Default musical division for scale animations
    morphingDivision: "quarter",        // Connected to: StateManager.js fallback state, ShapeMorphingSystem.js
                                        // Purpose: Default musical division for morphing transitions
    centerScalingDivision: "quarter"    // Connected to: StateManager.js fallback state
                                        // Purpose: Default musical division for center scaling
  },

  /**
   * Morphing System Configuration
   * Default settings for shape morphing
   */
  morphing: {
    easing: "power2.inOut"              // Connected to: StateManager.js fallback state, ShapeMorphingSystem.js
                                        // Purpose: Default easing function for morphing transitions
  },

  /**
   * Visual Appearance Configuration
   * Colors and visual styling defaults
   */
  appearance: {
    shapeColor: "#5cff00",              // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Default color for shapes
    backgroundColor: "#000000",         // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Default background color
    lightColor: "#ffffff"               // Connected to: StateManager.js fallback state, LightingManager.js
                                        // Purpose: Default light color
  },

  /**
   * Shape Type Configuration
   * Default enabled/disabled state for different shape types
   */
  enabledShapes: {
    "Basic Shapes": true,               // Connected to: StateManager.js fallback state, ShapeGenerator.js
                                        // Purpose: Default state for basic shapes
    "Triangles": true,                  // Connected to: StateManager.js fallback state, ShapeGenerator.js
                                        // Purpose: Default state for triangle shapes
    "Rectangles": true,                 // Connected to: StateManager.js fallback state, ShapeGenerator.js
                                        // Purpose: Default state for rectangle shapes
    "Ellipses": true,                   // Connected to: StateManager.js fallback state, ShapeGenerator.js
                                        // Purpose: Default state for ellipse shapes
    "Refractive Spheres": true          // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default state for refractive spheres
  },

  /**
   * Sphere Material Configuration
   * Default material properties for refractive spheres
   */
  spheres: {
    refraction: 1.67,                   // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default refraction index for spheres
    transparency: 1,                    // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default transparency for spheres
    roughness: 0.04,                    // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default roughness for spheres
    metalness: 1,                       // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default metalness for spheres
    transmission: 1,                    // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default transmission for spheres
    scale: 3,                           // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Default scale for spheres
    clearcoat: 0.09,                    // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default clearcoat intensity for spheres
    clearcoatRoughness: 0.05,           // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default clearcoat roughness for spheres
    envMapIntensity: 0.28,              // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default environment map intensity for spheres
    waterDistortion: true,              // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default state for water distortion effect
    distortionStrength: 0.1,            // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default strength for distortion effects
    highPerformanceMode: false          // Connected to: StateManager.js fallback state, MaterialManager.js
                                        // Purpose: Default state for high performance mode
  },

  /**
   * Post-Processing Configuration
   * Default settings for post-processing effects
   */
  postProcessing: {
    enabled: false,                     // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default state for post-processing system
    
    // Bloom Effect
    bloomEnabled: true,                 // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default state for bloom effect
    bloomStrength: 0.41,                // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default bloom effect strength
    bloomRadius: 1.18,                  // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default bloom effect radius
    bloomThreshold: 0,                  // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default bloom effect threshold
    
    // Chromatic Aberration
    chromaticAberrationEnabled: false,  // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default state for chromatic aberration
    chromaticIntensity: 0.5,            // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default chromatic aberration intensity
    
    // Vignette Effect
    vignetteEnabled: true,              // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default state for vignette effect
    vignetteIntensity: 1,               // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default vignette intensity
    vignetteRadius: 0.53,               // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default vignette radius
    vignetteSoftness: 0.36,             // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default vignette softness
    
    // Film Grain
    grainEnabled: true,                 // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default state for film grain effect
    grainIntensity: 0.1,                // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default grain intensity
    
    // Color Grading
    colorGradingEnabled: false,         // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default state for color grading
    colorHue: 0,                        // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default hue shift
    colorSaturation: 1,                 // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default saturation level
    colorBrightness: 1,                 // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default brightness level
    colorContrast: 1,                   // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default contrast level
    
    // Anti-aliasing
    fxaaEnabled: true                   // Connected to: StateManager.js fallback state, PostProcessingManager.js
                                        // Purpose: Default state for FXAA anti-aliasing
  },

  /**
   * Lighting Configuration
   * Default lighting intensities and settings
   */
  lighting: {
    ambientLightIntensity: 0.97,        // Connected to: StateManager.js fallback state, LightingManager.js
                                        // Purpose: Default ambient light intensity
    directionalLightIntensity: 0.04,    // Connected to: StateManager.js fallback state, LightingManager.js
                                        // Purpose: Default directional light intensity
    pointLight1Intensity: 2.94,         // Connected to: StateManager.js fallback state, LightingManager.js
                                        // Purpose: Default intensity for primary point light
    pointLight2Intensity: 3,            // Connected to: StateManager.js fallback state, LightingManager.js
                                        // Purpose: Default intensity for secondary point light
    rimLightIntensity: 3,               // Connected to: StateManager.js fallback state, LightingManager.js
                                        // Purpose: Default rim light intensity
    accentLightIntensity: 2.97          // Connected to: StateManager.js fallback state, LightingManager.js
                                        // Purpose: Default accent light intensity
  },

  /**
   * Performance Configuration
   * Default performance and optimization settings
   */
  performance: {
    enableFrustumCulling: true          // Connected to: StateManager.js fallback state, PerformanceManager.js
                                        // Purpose: Default state for frustum culling optimization
  },

  /**
   * Center Scaling Configuration
   * Default settings for center-based scaling effects
   */
  centerScaling: {
    enabled: false,                     // Connected to: StateManager.js fallback state
                                        // Purpose: Default state for center scaling effect
    intensity: 0.5,                     // Connected to: StateManager.js fallback state
                                        // Purpose: Default center scaling intensity
    curve: 0,                           // Connected to: StateManager.js fallback state
                                        // Purpose: Default center scaling curve type (0=Linear)
    radius: 1.0,                        // Connected to: StateManager.js fallback state
                                        // Purpose: Default center scaling radius
    direction: 0,                       // Connected to: StateManager.js fallback state
                                        // Purpose: Default center scaling direction (0=Convex)
    animationSpeed: 1.0,                // Connected to: StateManager.js fallback state
                                        // Purpose: Default center scaling animation speed
    animationType: 0,                   // Connected to: StateManager.js fallback state
                                        // Purpose: Default center scaling animation type (0=Complex Wave)
    animation: false                    // Connected to: StateManager.js fallback state
                                        // Purpose: Default state for center scaling animation
  },

  /**
   * MIDI Configuration
   * Default MIDI system settings
   */
  midi: {
    enabled: false,                     // Connected to: StateManager.js fallback state, MIDIEventHandler.js
                                        // Purpose: Default state for MIDI system
    channel: 0,                         // Connected to: StateManager.js fallback state, MIDIEventHandler.js
                                        // Purpose: Default MIDI channel
    ccMappings: {},                     // Connected to: StateManager.js fallback state, midi-controls.js
                                        // Purpose: Default MIDI CC mappings object
    noteMappings: {},                   // Connected to: StateManager.js fallback state, midi-controls.js
                                        // Purpose: Default MIDI note mappings object
    stopStopsAnimation: false           // Connected to: StateManager.js fallback state
                                        // Purpose: Default behavior for MIDI stop messages
  },

  /**
   * Audio Configuration
   * Default audio system settings
   */
  audio: {
    mappings: {}                        // Connected to: StateManager.js fallback state, AudioManager.js
                                        // Purpose: Default audio mappings object
  },

  /**
   * Camera Configuration
   * Default camera position and rotation settings for isometric viewing
   */
  camera: {
    rotationX: 0,                       // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Camera rotation around X-axis (pitch) in radians
    rotationY: 0,                       // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Camera rotation around Y-axis (yaw) in radians
    rotationZ: 0,                       // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Camera rotation around Z-axis (roll) in radians
    distance: 10,                       // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Camera distance from origin (zoom)
    isometricEnabled: false             // Connected to: StateManager.js fallback state, Scene.js
                                        // Purpose: Enable isometric camera preset
  }
};
