/**
 * GUI Control Configurations
 * 
 * Centralizes all GUI control ranges, steps, and defaults to eliminate
 * the 28+ hardcoded instances of step values throughout GUIManager.js
 * 
 * Each configuration object contains:
 * - min: Minimum value for range controls
 * - max: Maximum value for range controls  
 * - step: Step increment for fine control
 * - default: Default/initial value
 * - Connected to: Which files/functions use this parameter
 * - Purpose: What this parameter controls in the system
 */

export const GUI_CONTROL_CONFIGS = {
  // ===== SHAPE CONTROLS =====
  // Used in GUIManager.js createShapeControls()
  
  gridWidth: { 
    min: 1, max: 30, step: 1, default: 19,
    // Connected to: Scene.js grid creation, GridManager.js display grid
    // Purpose: Controls horizontal number of shapes in display grid
  },
  
  gridHeight: { 
    min: 1, max: 30, step: 1, default: 6,
    // Connected to: Scene.js grid creation, GridManager.js display grid  
    // Purpose: Controls vertical number of shapes in display grid
  },
  
  cellSize: { 
    min: 0.5, max: 2, step: 0.01, default: 0.76,
    // Connected to: Scene.js shape positioning, GridManager.js cell spacing
    // Purpose: Controls spacing between grid cells and base shape size
  },
  
  compositionWidth: {
    min: 1, max: 50, step: 1, default: 30,
    // Connected to: GridManager.js composition generation
    // Purpose: Controls width of the shape composition grid
  },
  
  compositionHeight: {
    min: 1, max: 50, step: 1, default: 30,
    // Connected to: GridManager.js composition generation
    // Purpose: Controls height of the shape composition grid
  },
  
  randomness: { 
    min: 0, max: 1, step: 0.01, default: 1,
    // Connected to: GridManager.js composition generation
    // Purpose: Controls randomness in shape selection (0=ordered, 1=random)
  },
  
  // ===== MATERIAL PROPERTIES =====
  // Used in GUIManager.js createMaterialControls()
  
  sphereRefraction: { 
    min: 0.0, max: 2.0, step: 0.01, default: 1.67,
    // Connected to: MaterialManager.js getSphereMaterial()
    // Purpose: Controls light refraction through refractive spheres (1.0=no refraction, 1.67=glass-like)
  },
  
  sphereTransparency: { 
    min: 0.0, max: 1.0, step: 0.01, default: 1,
    // Connected to: MaterialManager.js sphere material opacity
    // Purpose: Controls how transparent spheres appear (0=opaque, 1=fully transparent)
  },
  
  sphereRoughness: {
    min: 0.02, max: 1.0, step: 0.01, default: 0.04,
    // Connected to: MaterialManager.js sphere material properties
    // Purpose: Controls surface roughness of spheres (0.02=very smooth, 1.0=very rough)
  },
  
  sphereTransmission: {
    min: 0.0, max: 0.98, step: 0.01, default: 1.0,
    // Connected to: MaterialManager.js sphere material transmission
    // Purpose: Controls light transmission through spheres
  },
  
  sphereClearcoat: {
    min: 0.0, max: 1.0, step: 0.01, default: 0.09,
    // Connected to: MaterialManager.js sphere clearcoat layer
    // Purpose: Controls clearcoat layer intensity on spheres
  },
  
  sphereClearcoatRoughness: {
    min: 0.0, max: 0.02, step: 0.01, default: 0.05,
    // Connected to: MaterialManager.js clearcoat roughness
    // Purpose: Controls roughness of the clearcoat layer
  },
  
  sphereEnvMapIntensity: {
    min: 0.0, max: 3.0, step: 0.01, default: 0.28,
    // Connected to: MaterialManager.js environment map intensity
    // Purpose: Controls environment map reflection intensity on spheres
  },
  
  sphereMetalness: {
    min: 0.0, max: 1.0, step: 0.01, default: 1.0,
    // Connected to: MaterialManager.js sphere material metalness
    // Purpose: Controls metallic appearance of spheres (0=dielectric, 1=metal)
  },
  
  sphereDistortionStrength: {
    min: 0.0, max: 1.0, step: 0.01, default: 0.1,
    // Connected to: MaterialManager.js water distortion effects
    // Purpose: Controls strength of water-like distortion effects on spheres
  },
  
  sphereScale: {
    min: 0.5, max: 3.0, step: 0.1, default: 3.0,
    // Connected to: Scene.js sphere scaling
    // Purpose: Controls overall scale/size of refractive spheres
  },
  
  // ===== ANIMATION CONTROLS =====
  // Used in GUIManager.js createAnimationControls()
  
  animationSpeed: {
    min: 0.1, max: 3, step: 0.01, default: 1.89,
    // Connected to: AnimationLoop.js, ShapeAnimationManager.js
    // Purpose: Global multiplier for all animation speeds
  },
  
  movementAmplitude: {
    min: 0.01, max: 0.5, step: 0.01, default: 0.08,
    // Connected to: ShapeAnimationManager.js animateShapeTransformations()
    // Purpose: Controls how far shapes move from their grid positions during animation
  },
  
  rotationAmplitude: {
    min: 0.01, max: 2, step: 0.01, default: 0.5,
    // Connected to: ShapeAnimationManager.js rotation calculations
    // Purpose: Controls maximum rotation angle in radians for shape rotation animation
  },
  
  scaleAmplitude: {
    min: 0.01, max: 2, step: 0.01, default: 0.3,
    // Connected to: ShapeAnimationManager.js scale transformations
    // Purpose: Controls how much shapes can scale during animation
  },
  
  centerScalingIntensity: {
    min: 0, max: 2, step: 0.01, default: 0.5,
    // Connected to: Scene.js center scaling calculations
    // Purpose: Controls intensity of center-based scaling effects
  },
  
  shapeCyclingIntensity: {
    min: 0.1, max: 1, step: 0.1, default: 1.0,
    // Connected to: ShapeAnimationManager.js shape cycling system
    // Purpose: Controls intensity of shape cycling animations
  },
  
  centerScalingRadius: {
    min: 0.1, max: 5, step: 0.1, default: 1.0,
    // Connected to: Scene.js center scaling radius calculations
    // Purpose: Controls radius of center-based scaling effects
  },
  
  centerScalingAnimationSpeed: {
    min: 0.1, max: 3, step: 0.1, default: 1.0,
    // Connected to: Scene.js center scaling animation timing
    // Purpose: Controls speed of center scaling animations
  },
  
  // ===== BPM AND TIMING =====
  // Used in GUIManager.js createTimingControls()
  
  globalBPM: {
    min: 1, max: 300, step: 1, default: 120,
    // Connected to: BPMTimingManager.js setBPM(), StateManager.js
    // Purpose: Master BPM for all musical timing and synchronization
  },
  
  // ===== LIGHTING CONTROLS =====
  // Used in GUIManager.js createLightingControls()
  
  ambientIntensity: {
    min: 0, max: 2, step: 0.01, default: 0.97,
    // Connected to: LightingManager.js ambient light configuration
    // Purpose: Controls overall ambient lighting intensity
  },
  
  directionalIntensity: {
    min: 0, max: 2, step: 0.01, default: 0.04,
    // Connected to: LightingManager.js directional light setup
    // Purpose: Controls main directional light intensity
  },
  
  pointLight1Intensity: {
    min: 0, max: 5, step: 0.01, default: 2.94,
    // Connected to: LightingManager.js point light 1 configuration
    // Purpose: Controls intensity of primary point light
  },
  
  pointLight2Intensity: {
    min: 0, max: 5, step: 0.01, default: 3.0,
    // Connected to: LightingManager.js point light 2 configuration
    // Purpose: Controls intensity of secondary point light
  },
  
  rimLightIntensity: {
    min: 0, max: 5, step: 0.01, default: 3.0,
    // Connected to: LightingManager.js rim light setup
    // Purpose: Controls rim lighting effect intensity
  },
  
  accentLightIntensity: {
    min: 0, max: 5, step: 0.01, default: 2.97,
    // Connected to: LightingManager.js accent light configuration
    // Purpose: Controls accent lighting intensity
  },
  
  // ===== POST-PROCESSING CONTROLS =====
  // Used in GUIManager.js createPostProcessingControls()
  
  bloomStrength: {
    min: 0, max: 2, step: 0.01, default: 0.41,
    // Connected to: PostProcessingManager.js bloom effect configuration
    // Purpose: Controls intensity of bloom/glow effect on bright areas
  },
  
  bloomRadius: {
    min: 0, max: 2, step: 0.01, default: 1.18,
    // Connected to: PostProcessingManager.js bloom effect spread
    // Purpose: Controls how far bloom effect spreads from bright sources
  },
  
  bloomThreshold: {
    min: 0, max: 1, step: 0.01, default: 0.85,
    // Connected to: PostProcessingManager.js bloom threshold
    // Purpose: Controls brightness threshold for bloom effect trigger
  },
  
  // ===== POST-PROCESSING EFFECTS =====
  // Additional post-processing controls
  
  chromaticIntensity: {
    min: 0, max: 1, step: 0.01, default: 0.5,
    // Connected to: PostProcessingManager.js chromatic aberration
    // Purpose: Controls intensity of chromatic aberration effect
  },
  
  vignetteIntensity: {
    min: 0, max: 1, step: 0.01, default: 1.0,
    // Connected to: PostProcessingManager.js vignette effect
    // Purpose: Controls intensity of vignette darkening effect
  },
  
  vignetteRadius: {
    min: 0.1, max: 1, step: 0.01, default: 0.53,
    // Connected to: PostProcessingManager.js vignette radius
    // Purpose: Controls radius of vignette effect
  },
  
  vignetteSoftness: {
    min: 0, max: 1, step: 0.01, default: 0.36,
    // Connected to: PostProcessingManager.js vignette softness
    // Purpose: Controls softness/feathering of vignette edge
  },
  
  grainIntensity: {
    min: 0, max: 0.5, step: 0.01, default: 0.1,
    // Connected to: PostProcessingManager.js film grain effect
    // Purpose: Controls intensity of film grain noise effect
  },
  
  colorHue: {
    min: -0.5, max: 0.5, step: 0.01, default: 0,
    // Connected to: PostProcessingManager.js color grading hue shift
    // Purpose: Controls hue shift in color grading (-0.5 to 0.5 range)
  },
  
  colorSaturation: {
    min: 0, max: 3, step: 0.01, default: 1,
    // Connected to: PostProcessingManager.js color grading saturation
    // Purpose: Controls color saturation (0=grayscale, 1=normal, 3=oversaturated)
  },
  
  colorBrightness: {
    min: 0, max: 2, step: 0.01, default: 1,
    // Connected to: PostProcessingManager.js color grading brightness
    // Purpose: Controls overall brightness (0=black, 1=normal, 2=very bright)
  },
  
  colorContrast: {
    min: 0, max: 2, step: 0.01, default: 1,
    // Connected to: PostProcessingManager.js color grading contrast
    // Purpose: Controls color contrast (0=flat, 1=normal, 2=high contrast)
  },
  
  // ===== AUDIO SENSITIVITY CONTROLS =====
  // Used in GUIManager.js createAudioControls()
  
  bassAmplitude: {
    min: 0, max: 2, step: 0.01, default: 1,
    // Connected to: AudioManager.js frequency analysis, ShapeAnimationManager.js
    // Purpose: Multiplier for bass frequency response in animations
  },
  
  midAmplitude: {
    min: 0, max: 2, step: 0.01, default: 1,
    // Connected to: AudioManager.js frequency analysis, ShapeAnimationManager.js
    // Purpose: Multiplier for mid frequency response in animations
  },
  
  trebleAmplitude: {
    min: 0, max: 2, step: 0.01, default: 1,
    // Connected to: AudioManager.js frequency analysis, ShapeAnimationManager.js
    // Purpose: Multiplier for treble frequency response in animations
  },
  
  audioSmoothing: {
    min: 0, max: 1, step: 0.01, default: 0.8,
    // Connected to: AudioManager.js analyser.smoothingTimeConstant
    // Purpose: Temporal smoothing of audio data (0=no smoothing, 1=heavy smoothing)
  },
  
  // ===== MORPHING CONTROLS =====
  // Used in GUIManager.js createMorphingControls()
  
  morphingIntensity: {
    min: 0, max: 1, step: 0.01, default: 0.5,
    // Connected to: ShapeMorphingSystem.js morph calculations
    // Purpose: Controls overall intensity of shape morphing effects
  },
  
  morphingSpeed: {
    min: 0.1, max: 3, step: 0.01, default: 1,
    // Connected to: ShapeMorphingSystem.js timing calculations
    // Purpose: Controls speed of morphing transitions
  }
};

/**
 * GUI Control Categories
 * Organizes controls into logical groups for GUI folder structure
 */
export const GUI_CATEGORIES = {
  SHAPE: ['gridWidth', 'gridHeight', 'cellSize', 'compositionWidth', 'compositionHeight', 'randomness'],
  MATERIAL: ['sphereRefraction', 'sphereTransparency', 'sphereRoughness', 'sphereTransmission', 'sphereClearcoat', 'sphereClearcoatRoughness', 'sphereEnvMapIntensity', 'sphereMetalness', 'sphereDistortionStrength', 'sphereScale'],
  ANIMATION: ['animationSpeed', 'movementAmplitude', 'rotationAmplitude', 'scaleAmplitude', 'centerScalingIntensity', 'shapeCyclingIntensity', 'centerScalingRadius', 'centerScalingAnimationSpeed'],
  TIMING: ['globalBPM'],
  LIGHTING: ['ambientIntensity', 'directionalIntensity', 'pointLight1Intensity', 'pointLight2Intensity', 'rimLightIntensity', 'accentLightIntensity'],
  POST_PROCESSING: ['bloomStrength', 'bloomRadius', 'bloomThreshold', 'chromaticIntensity', 'vignetteIntensity', 'vignetteRadius', 'vignetteSoftness', 'grainIntensity', 'colorHue', 'colorSaturation', 'colorBrightness', 'colorContrast'],
  AUDIO: ['bassAmplitude', 'midAmplitude', 'trebleAmplitude', 'audioSmoothing'],
  MORPHING: ['morphingIntensity', 'morphingSpeed']
};
