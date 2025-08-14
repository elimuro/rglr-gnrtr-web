/**
 * Material Constants
 * 
 * Centralizes material properties, rendering parameters, and visual constants
 * used throughout the material system, particularly in MaterialManager.js.
 * 
 * These constants eliminate hardcoded material values and provide consistent
 * material behavior across different shape types and rendering conditions.
 */

export const MATERIAL_CONSTANTS = {
  /**
   * Sphere Material Properties
   * Physical material properties for refractive spheres
   */
  sphere: {
    refraction: { 
      min: 0.0,       // Connected to: MaterialManager.js getSphereMaterial() validation
                      // Purpose: Minimum refraction index (no refraction)
      max: 2.0,       // Connected to: MaterialManager.js getSphereMaterial() validation
                      // Purpose: Maximum refraction index (extreme refraction)
      default: 1.67,  // Connected to: MaterialManager.js default sphere setup
                      // Purpose: Default refraction index (glass-like)
      air: 1.0,       // Purpose: Refraction index of air (reference)
      water: 1.33,    // Purpose: Refraction index of water
      glass: 1.5,     // Purpose: Refraction index of typical glass
      diamond: 2.42   // Purpose: Refraction index of diamond (high-end reference)
    },
    
    roughness: { 
      min: 0.02,      // Connected to: MaterialManager.js roughness clamping
                      // Purpose: Minimum roughness to prevent pure mirror reflection
      max: 1.0,       // Connected to: MaterialManager.js roughness validation
                      // Purpose: Maximum roughness (completely diffuse)
      default: 0.04,  // Connected to: MaterialManager.js default sphere setup
                      // Purpose: Default roughness (slightly rough glass)
      minSmooth: 0.05, // Connected to: MaterialManager.js smooth material variants
                      // Purpose: Minimum roughness for "smooth" material presets
      mirror: 0.01,   // Purpose: Roughness for mirror-like surfaces
      matte: 0.8,     // Purpose: Roughness for matte surfaces
      satin: 0.3      // Purpose: Roughness for satin-like surfaces
    },
    
    transmission: { 
      min: 0.0,       // Connected to: MaterialManager.js transmission validation
                      // Purpose: Minimum transmission (opaque)
      max: 0.98,      // Connected to: MaterialManager.js transmission clamping
                      // Purpose: Maximum transmission (near-transparent, prevents rendering issues)
      default: 1.0    // Connected to: MaterialManager.js default sphere setup
                      // Purpose: Default transmission (fully transmissive)
    },
    
    clearcoat: { 
      min: 0.0,       // Connected to: MaterialManager.js clearcoat validation
                      // Purpose: Minimum clearcoat intensity (no clearcoat)
      max: 1.0,       // Connected to: MaterialManager.js clearcoat validation
                      // Purpose: Maximum clearcoat intensity (full clearcoat layer)
      default: 0.09,  // Connected to: MaterialManager.js default sphere setup
                      // Purpose: Default clearcoat intensity (subtle clearcoat)
      water: 0.9      // Connected to: MaterialManager.js water effect clearcoat
                      // Purpose: Clearcoat intensity for water-like materials
    },
    
    clearcoatRoughness: { 
      min: 0.0,       // Connected to: MaterialManager.js clearcoat roughness validation
                      // Purpose: Minimum clearcoat roughness (smooth clearcoat)
      max: 0.02,      // Connected to: MaterialManager.js clearcoat roughness clamping
                      // Purpose: Maximum clearcoat roughness (prevents visual artifacts)
      default: 0.05,  // Connected to: MaterialManager.js default clearcoat setup
                      // Purpose: Default clearcoat roughness (slightly rough clearcoat)
      water: 0.02     // Connected to: MaterialManager.js water effect clearcoat roughness
                      // Purpose: Clearcoat roughness for water-like materials
    },

    metalness: {
      min: 0.0,       // Connected to: MaterialManager.js metalness validation
                      // Purpose: Minimum metalness (dielectric material)
      max: 1.0,       // Connected to: MaterialManager.js metalness validation
                      // Purpose: Maximum metalness (pure metal)
      default: 0.0,   // Connected to: MaterialManager.js default setup
                      // Purpose: Default metalness (dielectric for glass-like spheres)
      metal: 1.0,     // Purpose: Metalness value for metallic materials
      dielectric: 0.0 // Purpose: Metalness value for non-metallic materials
    },

    envMapIntensity: {
      min: 0.0,       // Connected to: MaterialManager.js environment map validation
                      // Purpose: Minimum environment map intensity (no reflection)
      max: 3.0,       // Connected to: MaterialManager.js environment map validation
                      // Purpose: Maximum environment map intensity (strong reflections)
      default: 1.0    // Connected to: MaterialManager.js default environment setup
                      // Purpose: Default environment map intensity (normal reflections)
    },

    thickness: {
      default: 0.5,   // Connected to: MaterialManager.js default material thickness
                      // Purpose: Default thickness for refractive materials
      water: 0.8,     // Connected to: MaterialManager.js water effect thickness
                      // Purpose: Thickness for water-like materials
      max: 2.0        // Connected to: MaterialManager.js maximum thickness
                      // Purpose: Maximum thickness to prevent rendering issues
    },

    reflectivity: {
      default: 0.9,   // Connected to: MaterialManager.js default reflectivity
                      // Purpose: Default reflectivity for water-like materials
      min: 0.0,       // Connected to: MaterialManager.js minimum reflectivity
                      // Purpose: Minimum reflectivity (no reflection)
      max: 1.0        // Connected to: MaterialManager.js maximum reflectivity
                      // Purpose: Maximum reflectivity (mirror-like)
    },

    attenuationDistance: {
      default: 0.5,   // Connected to: MaterialManager.js default attenuation distance
                      // Purpose: Default distance for transmission attenuation
      min: 0.1,       // Connected to: MaterialManager.js minimum attenuation distance
                      // Purpose: Minimum distance to prevent rendering issues
      max: 2.0        // Connected to: MaterialManager.js maximum attenuation distance
                      // Purpose: Maximum distance for transmission effects
    },

    specularIntensity: {
      default: 1.0,   // Connected to: MaterialManager.js default specular intensity
                      // Purpose: Default specular highlight intensity
      min: 0.0,       // Connected to: MaterialManager.js minimum specular intensity
                      // Purpose: Minimum specular intensity (no highlights)
      max: 2.0        // Connected to: MaterialManager.js maximum specular intensity
                      // Purpose: Maximum specular intensity (bright highlights)
    }
  },

  /**
   * Water Distortion Effects
   * Constants for water-like distortion effects on materials
   */
  distortion: {
    strengthMultiplier: 0.1,    // Connected to: MaterialManager.js water distortion calculations
                                // Purpose: Multiplier for distortion effect strength
    transmissionBoost: 0.1,     // Connected to: MaterialManager.js water effect transmission boost
                                // Purpose: Additional transmission when water effect is enabled
    iorMultiplier: 0.5,         // Connected to: MaterialManager.js IOR adjustment for distortion
                                // Purpose: Multiplier for IOR changes during distortion
    clearcoatBoost: 0.1,        // Connected to: MaterialManager.js clearcoat boost during distortion
                                // Purpose: Additional clearcoat intensity during distortion
    envMapIntensityBoost: 0.5,  // Connected to: MaterialManager.js environment map intensity boost
                                // Purpose: Additional environment map intensity during distortion
    roughnessReduction: 0.1,    // Connected to: MaterialManager.js roughness reduction during distortion
                                // Purpose: Reduction in roughness during distortion effects
    thicknessMultiplier: 0.4,   // Connected to: MaterialManager.js thickness multiplier for distortion
                                // Purpose: Multiplier for thickness changes during distortion
    attenuationReduction: 0.3,  // Connected to: MaterialManager.js attenuation distance reduction
                                // Purpose: Reduction in attenuation distance during distortion
    specularBoost: 0.5,         // Connected to: MaterialManager.js specular intensity boost
                                // Purpose: Additional specular intensity during distortion
    waveSpeed: 1.0,             // Connected to: distortion animation timing
                                // Purpose: Speed of water wave distortion animation
    waveAmplitude: 0.05,        // Connected to: distortion displacement calculations
                                // Purpose: Amplitude of water wave distortion
    waveFrequency: 2.0,         // Connected to: distortion wave calculations
                                // Purpose: Frequency of water wave distortion
    noiseScale: 0.1,            // Connected to: noise-based distortion
                                // Purpose: Scale of noise used in distortion effects
    timeScale: 0.5              // Connected to: time-based distortion animation
                                // Purpose: Time scale for animated distortion effects
  },

  /**
   * Shape Material Properties
   * Material constants for different shape types (non-sphere shapes)
   */
  shapes: {
    defaultColor: 0xffffff,     // Connected to: MaterialManager.js default shape material
                                // Purpose: Default color for shape materials
    wireframe: {
      enabled: false,           // Connected to: wireframe material variants
                                // Purpose: Default wireframe state
      linewidth: 1,             // Connected to: wireframe line width
                                // Purpose: Width of wireframe lines
      opacity: 0.8              // Connected to: wireframe material opacity
                                // Purpose: Transparency of wireframe materials
    },
    basic: {
      color: 0xffffff,          // Connected to: BasicMaterial setup
                                // Purpose: Default color for basic materials
      opacity: 1.0,             // Connected to: BasicMaterial opacity
                                // Purpose: Default opacity for basic materials
      transparent: false        // Connected to: BasicMaterial transparency
                                // Purpose: Default transparency state for basic materials
    },
    lambert: {
      color: 0xffffff,          // Connected to: LambertMaterial setup
                                // Purpose: Default color for Lambert materials
      emissive: 0x000000,       // Connected to: LambertMaterial emissive color
                                // Purpose: Default emissive color (no emission)
      opacity: 1.0              // Connected to: LambertMaterial opacity
                                // Purpose: Default opacity for Lambert materials
    },
    phong: {
      color: 0xffffff,          // Connected to: PhongMaterial setup
                                // Purpose: Default color for Phong materials
      specular: 0x111111,       // Connected to: PhongMaterial specular color
                                // Purpose: Default specular highlight color
      shininess: 30,            // Connected to: PhongMaterial shininess
                                // Purpose: Default shininess for Phong materials
      opacity: 1.0              // Connected to: PhongMaterial opacity
                                // Purpose: Default opacity for Phong materials
    }
  },

  /**
   * Performance Material Settings
   * Material constants for performance optimization
   */
  performance: {
    highPerformanceMode: {
      disableTransmission: true,    // Connected to: MaterialManager.js performance mode
                                    // Purpose: Disable expensive transmission in performance mode
      reduceRoughness: 0.1,         // Connected to: performance mode roughness adjustment
                                    // Purpose: Increase roughness to reduce reflection calculations
      simplifyShaders: true,        // Connected to: shader complexity reduction
                                    // Purpose: Use simpler shaders in performance mode
      disableEnvironmentMap: true,  // Connected to: environment map performance toggle
                                    // Purpose: Disable environment mapping for performance
      reduceClearcoat: 0.02         // Connected to: clearcoat performance reduction
                                    // Purpose: Reduce clearcoat intensity for performance
    },
    lodThresholds: {
      near: 10,                     // Connected to: level-of-detail material switching
                                    // Purpose: Distance threshold for high-quality materials
      medium: 25,                   // Connected to: LOD material switching
                                    // Purpose: Distance threshold for medium-quality materials
      far: 50                       // Connected to: LOD material switching
                                    // Purpose: Distance threshold for low-quality materials
    },
    batchingLimits: {
      maxMaterials: 100,            // Connected to: material batching system
                                    // Purpose: Maximum number of materials to batch together
      instanceThreshold: 10         // Connected to: instancing threshold
                                    // Purpose: Minimum instances needed to enable material batching
    }
  },

  /**
   * Color and Appearance Constants
   * Constants for material colors and visual appearance
   */
  colors: {
    presets: {
      glass: {
        color: 0xffffff,            // Purpose: Glass material color preset
        transmission: 0.95,         // Purpose: Glass transmission preset
        roughness: 0.02,            // Purpose: Glass roughness preset
        refraction: 1.5             // Purpose: Glass refraction preset
      },
      crystal: {
        color: 0xffffff,            // Purpose: Crystal material color preset
        transmission: 0.9,          // Purpose: Crystal transmission preset
        roughness: 0.01,            // Purpose: Crystal roughness preset
        refraction: 1.8             // Purpose: Crystal refraction preset
      },
      water: {
        color: 0x4488ff,            // Purpose: Water material color preset
        transmission: 0.8,          // Purpose: Water transmission preset
        roughness: 0.1,             // Purpose: Water roughness preset
        refraction: 1.33            // Purpose: Water refraction preset
      },
      ice: {
        color: 0xddffff,            // Purpose: Ice material color preset
        transmission: 0.85,         // Purpose: Ice transmission preset
        roughness: 0.05,            // Purpose: Ice roughness preset
        refraction: 1.31            // Purpose: Ice refraction preset
      }
    },
    tinting: {
      strength: 0.1,                // Connected to: material color tinting
                                    // Purpose: Strength of color tinting effects
      saturation: 0.8,              // Connected to: color saturation adjustments
                                    // Purpose: Saturation level for tinted materials
      brightness: 1.0               // Connected to: brightness adjustments
                                    // Purpose: Brightness multiplier for materials
    }
  },

  /**
   * Animation and Dynamic Properties
   * Constants for animated material properties
   */
  animation: {
    morphSpeed: 1.0,                // Connected to: material property morphing
                                    // Purpose: Speed of material property animations
    colorTransitionSpeed: 0.5,      // Connected to: color transition animations
                                    // Purpose: Speed of color change animations
    refractionAnimationRange: 0.2,  // Connected to: animated refraction effects
                                    // Purpose: Range of refraction animation
    roughnessAnimationRange: 0.1,   // Connected to: animated roughness effects
                                    // Purpose: Range of roughness animation
    transmissionPulseSpeed: 2.0,    // Connected to: pulsing transmission effects
                                    // Purpose: Speed of transmission pulsing animation
    clearcoatFlickerSpeed: 3.0      // Connected to: clearcoat flicker effects
                                    // Purpose: Speed of clearcoat flickering animation
  },

  /**
   * Validation and Limits
   * Constants for material property validation and clamping
   */
  validation: {
    colorChannelMin: 0.0,           // Connected to: color channel validation
                                    // Purpose: Minimum value for RGB color channels
    colorChannelMax: 1.0,           // Connected to: color channel validation
                                    // Purpose: Maximum value for RGB color channels
    opacityMin: 0.0,                // Connected to: opacity validation
                                    // Purpose: Minimum opacity value (fully transparent)
    opacityMax: 1.0,                // Connected to: opacity validation
                                    // Purpose: Maximum opacity value (fully opaque)
    intensityMin: 0.0,              // Connected to: intensity property validation
                                    // Purpose: Minimum intensity for material properties
    intensityMax: 10.0,             // Connected to: intensity property validation
                                    // Purpose: Maximum intensity for material properties
    safeTransmissionMax: 0.99       // Connected to: transmission safety clamping
                                    // Purpose: Safe maximum transmission to prevent rendering issues
  }
};
