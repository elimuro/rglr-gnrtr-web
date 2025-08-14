/**
 * Lighting Presets
 * 
 * Centralizes lighting configurations, positions, intensities, and colors
 * used throughout the lighting system, particularly in LightingManager.js.
 * 
 * These presets eliminate hardcoded lighting values and provide consistent
 * lighting setups that can be easily modified or extended with new presets.
 */

export const LIGHTING_PRESETS = {
  /**
   * Default Lighting Configuration
   * The standard lighting setup used throughout the application
   */
  default: {
    ambient: {
      intensity: 0.97,              // Connected to: LightingManager.js ambient light setup
                                    // Purpose: High ambient lighting for good overall visibility
      color: 0x404040               // Connected to: LightingManager.js ambient light color
                                    // Purpose: Neutral gray ambient light color
    },
    
    directional: {
      intensity: 0.04,              // Connected to: LightingManager.js directional light setup
                                    // Purpose: Low directional light to avoid harsh shadows
      color: 0xffffff,              // Connected to: LightingManager.js directional light color
                                    // Purpose: Pure white directional light
      position: { x: 10, y: 10, z: 5 }, // Connected to: LightingManager.js light positioning
                                    // Purpose: Position directional light above and to the side
      shadow: {
        mapSize: { width: 2048, height: 2048 }, // Connected to: shadow map configuration
                                    // Purpose: High-resolution shadow mapping
        camera: { 
          near: 0.5,                // Connected to: shadow camera near plane
                                    // Purpose: Near clipping plane for shadow camera
          far: 50                   // Connected to: shadow camera far plane
                                    // Purpose: Far clipping plane for shadow camera
        }
      }
    },
    
    pointLights: {
      light1: {
        intensity: 2.94,            // Connected to: LightingManager.js point light 1 setup
                                    // Purpose: Primary point light with high intensity
        color: 0xffffff,            // Connected to: LightingManager.js point light 1 color
                                    // Purpose: Pure white primary point light
        position: { x: 0, y: 0, z: 10 }, // Connected to: LightingManager.js light positioning
                                    // Purpose: Position primary light in front of scene
        distance: 100               // Connected to: point light distance/falloff
                                    // Purpose: Light falloff distance
      },
      light2: {
        intensity: 3.0,             // Connected to: LightingManager.js point light 2 setup
                                    // Purpose: Secondary point light with maximum intensity
        color: 0x87ceeb,            // Connected to: LightingManager.js point light 2 color
                                    // Purpose: Sky blue secondary light for color variation
        position: { x: -5, y: 5, z: 8 }, // Connected to: LightingManager.js light positioning
                                    // Purpose: Position secondary light to the side and above
        distance: 80                // Connected to: point light distance/falloff
                                    // Purpose: Shorter falloff distance for focused lighting
      }
    },
    
    rim: {
      intensity: 3.0,               // Connected to: LightingManager.js rim light setup
                                    // Purpose: Strong rim lighting for edge definition
      color: 0xffffff,              // Connected to: LightingManager.js rim light color
                                    // Purpose: Pure white rim light for clean edges
      position: { x: -8, y: -8, z: 3 } // Connected to: LightingManager.js rim light positioning
                                    // Purpose: Position rim light behind and below for backlighting
    },
    
    accent: {
      intensity: 2.97,              // Connected to: LightingManager.js accent light setup
                                    // Purpose: High-intensity accent lighting
      color: 0xff6b6b,              // Connected to: LightingManager.js accent light color
                                    // Purpose: Warm red accent color for visual interest
      position: { x: 8, y: -5, z: 6 }, // Connected to: LightingManager.js accent light positioning
                                    // Purpose: Position accent light to the side and below
      distance: 60                  // Connected to: accent light distance/falloff
                                    // Purpose: Medium falloff distance for accent effects
    }
  },

  /**
   * Alternative Lighting Presets
   * Additional lighting configurations for different moods and scenes
   */
  dramatic: {
    ambient: {
      intensity: 0.2,
      color: 0x202020
    },
    directional: {
      intensity: 1.5,
      color: 0xffffff,
      position: { x: 15, y: 20, z: 10 },
      shadow: {
        mapSize: { width: 4096, height: 4096 },
        camera: { near: 0.1, far: 100 }
      }
    },
    pointLights: {
      light1: {
        intensity: 5.0,
        color: 0xffffff,
        position: { x: -10, y: 10, z: 15 },
        distance: 50
      }
    },
    rim: {
      intensity: 4.0,
      color: 0x4444ff,
      position: { x: -12, y: -12, z: 5 }
    },
    accent: {
      intensity: 3.5,
      color: 0xff4444,
      position: { x: 12, y: -8, z: 8 },
      distance: 40
    }
  },

  soft: {
    ambient: {
      intensity: 1.5,
      color: 0x606060
    },
    directional: {
      intensity: 0.5,
      color: 0xffffff,
      position: { x: 5, y: 5, z: 3 },
      shadow: {
        mapSize: { width: 1024, height: 1024 },
        camera: { near: 1, far: 30 }
      }
    },
    pointLights: {
      light1: {
        intensity: 1.5,
        color: 0xffffff,
        position: { x: 0, y: 0, z: 8 },
        distance: 120
      },
      light2: {
        intensity: 1.2,
        color: 0xffeecc,
        position: { x: -3, y: 3, z: 6 },
        distance: 100
      }
    },
    rim: {
      intensity: 1.0,
      color: 0xffffff,
      position: { x: -6, y: -6, z: 2 }
    },
    accent: {
      intensity: 1.5,
      color: 0xccddff,
      position: { x: 6, y: -3, z: 4 },
      distance: 80
    }
  },

  neon: {
    ambient: {
      intensity: 0.1,
      color: 0x0a0a0a
    },
    directional: {
      intensity: 0.1,
      color: 0xffffff,
      position: { x: 2, y: 2, z: 1 },
      shadow: {
        mapSize: { width: 1024, height: 1024 },
        camera: { near: 0.5, far: 20 }
      }
    },
    pointLights: {
      light1: {
        intensity: 8.0,
        color: 0x00ffff,
        position: { x: 0, y: 0, z: 12 },
        distance: 60
      },
      light2: {
        intensity: 6.0,
        color: 0xff00ff,
        position: { x: -8, y: 8, z: 10 },
        distance: 50
      }
    },
    rim: {
      intensity: 10.0,
      color: 0x00ff00,
      position: { x: -10, y: -10, z: 4 }
    },
    accent: {
      intensity: 8.0,
      color: 0xffff00,
      position: { x: 10, y: -6, z: 8 },
      distance: 40
    }
  },

  /**
   * Performance Lighting Presets
   * Optimized lighting configurations for better performance
   */
  performance: {
    minimal: {
      ambient: {
        intensity: 1.2,
        color: 0x808080
      },
      directional: {
        intensity: 0.8,
        color: 0xffffff,
        position: { x: 5, y: 5, z: 2 },
        shadow: {
          mapSize: { width: 512, height: 512 },
          camera: { near: 1, far: 20 }
        }
      },
      pointLights: {
        light1: {
          intensity: 2.0,
          color: 0xffffff,
          position: { x: 0, y: 0, z: 6 },
          distance: 50
        }
      }
    },

    mobile: {
      ambient: {
        intensity: 1.8,
        color: 0x909090
      },
      directional: {
        intensity: 0.2,
        color: 0xffffff,
        position: { x: 3, y: 3, z: 1 },
        shadow: {
          mapSize: { width: 256, height: 256 },
          camera: { near: 1, far: 15 }
        }
      }
    }
  },

  /**
   * Lighting Configuration Helpers
   * Utility configurations and common values
   */
  helpers: {
    shadowMapSizes: {
      low: { width: 512, height: 512 },
      medium: { width: 1024, height: 1024 },
      high: { width: 2048, height: 2048 },
      ultra: { width: 4096, height: 4096 }
    },
    
    commonColors: {
      white: 0xffffff,
      warmWhite: 0xfff8e1,
      coolWhite: 0xe1f5fe,
      red: 0xff4444,
      green: 0x44ff44,
      blue: 0x4444ff,
      cyan: 0x44ffff,
      magenta: 0xff44ff,
      yellow: 0xffff44,
      orange: 0xff8844,
      purple: 0x8844ff,
      skyBlue: 0x87ceeb,
      warmRed: 0xff6b6b
    },
    
    intensityRanges: {
      ambient: { min: 0.0, max: 3.0, default: 1.0 },
      directional: { min: 0.0, max: 5.0, default: 1.0 },
      point: { min: 0.0, max: 10.0, default: 2.0 },
      rim: { min: 0.0, max: 8.0, default: 3.0 },
      accent: { min: 0.0, max: 6.0, default: 2.5 }
    },
    
    distanceRanges: {
      close: { min: 10, max: 30, default: 20 },
      medium: { min: 30, max: 80, default: 60 },
      far: { min: 80, max: 200, default: 120 }
    }
  },

  /**
   * Animation Lighting Presets
   * Lighting configurations designed for animated scenes
   */
  animation: {
    pulsing: {
      baseIntensities: {
        ambient: 0.5,
        directional: 0.3,
        point1: 2.0,
        point2: 1.8,
        rim: 2.5,
        accent: 2.0
      },
      pulseAmplitudes: {
        ambient: 0.3,
        directional: 0.2,
        point1: 1.0,
        point2: 0.8,
        rim: 1.5,
        accent: 1.2
      },
      pulseFrequencies: {
        ambient: 0.5,
        directional: 0.3,
        point1: 1.0,
        point2: 0.7,
        rim: 1.2,
        accent: 0.9
      }
    },
    
    cycling: {
      colorCycles: {
        primary: [0xffffff, 0xff8888, 0x88ff88, 0x8888ff, 0xffff88, 0xff88ff, 0x88ffff],
        secondary: [0x444444, 0x884444, 0x448844, 0x444488, 0x888844, 0x884488, 0x448888],
        accent: [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xffffff]
      },
      cycleSpeed: 2.0,
      fadeTime: 1.0
    }
  }
};
