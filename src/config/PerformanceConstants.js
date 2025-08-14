/**
 * Performance Constants
 * 
 * Centralizes performance thresholds and timing values used throughout
 * the performance monitoring and optimization systems.
 * 
 * These constants eliminate magic numbers in PerformanceManager.js and
 * provide clear, documented thresholds for system performance analysis.
 */

export const PERFORMANCE_CONSTANTS = {
  /**
   * FPS (Frames Per Second) Thresholds
   * Used in PerformanceManager.js analyzePerformance()
   */
  fps: {
    critical: 30,  // Below this FPS, system performance is considered critically poor
                   // Connected to: PerformanceManager.js analyzePerformance() - triggers "critical" severity
    warning: 50,   // Below this FPS, system shows performance warning  
                   // Connected to: PerformanceManager.js analyzePerformance() - triggers "warning" severity
    target: 60,    // Ideal target framerate for smooth animation
                   // Purpose: Reference point for optimal performance
    good: 55       // Above this FPS is considered good performance
                   // Purpose: Threshold for "good" performance classification
  },

  /**
   * Frame Time Thresholds (in milliseconds)
   * Used for analyzing individual frame rendering performance
   */
  frameTime: {
    critical: 33,  // 33ms = 30 FPS threshold, above this triggers performance issues
                   // Connected to: PerformanceManager.js analyzePerformance() frame time analysis
    warning: 20,   // 20ms = 50 FPS threshold, above this shows performance warning
                   // Purpose: Frame time warning threshold
    target: 16.67, // 16.67ms = 60 FPS target
                   // Purpose: Target frame time for optimal performance
    excellent: 13  // Below 13ms is considered excellent performance (>75 FPS)
                   // Purpose: Threshold for excellent performance classification
  },

  /**
   * Memory Usage Thresholds
   * Used in PerformanceManager.js getMemoryStats() analysis
   */
  memory: {
    warningThreshold: 100,   // 100MB heap usage triggers memory usage warning
                            // Connected to: PerformanceManager.js getMemoryStats() analysis
    criticalThreshold: 200,  // 200MB heap usage indicates potential memory leak
                            // Purpose: Critical memory usage threshold
    conversionFactor: 1048576, // Converts bytes to MB (1024 * 1024)
                              // Connected to: PerformanceManager.js memory calculations
    lowThreshold: 50,        // Below 50MB is considered low memory usage
                            // Purpose: Good memory usage threshold
    optimalThreshold: 75     // Below 75MB is considered optimal memory usage
                            // Purpose: Optimal memory usage threshold
  },

  /**
   * Frustum Culling Configuration
   * Used in PerformanceManager.js updateFrustumCulling()
   */
  culling: {
    margin: 2,           // Extra units around viewport to account for shape size
                         // Connected to: PerformanceManager.js updateFrustumCulling() viewport bounds
    updateFrequency: 1,  // Update culling every N frames (1 = every frame)
                         // Connected to: PerformanceManager.js culling frame counter
    enabled: true,       // Default state for frustum culling optimization
                         // Purpose: Enable/disable frustum culling by default
    debugMode: false,    // Enable debug visualization of culling bounds
                         // Purpose: Debug mode for frustum culling development
    efficiencyThreshold: 0.8, // Connected to: PerformanceManager.js culling efficiency analysis
                         // Purpose: Threshold above which culling may not be beneficial
    fullVisibilityRatio: 1.0, // Connected to: PerformanceManager.js disableCulling() full visibility
                         // Purpose: Culling ratio when all shapes are visible (100%)
    minUpdateFrequency: 1 // Connected to: PerformanceManager.js setCullingUpdateFrequency() minimum
                         // Purpose: Minimum allowed update frequency for culling
  },

  /**
   * Performance Monitoring Update Intervals
   * Controls how frequently performance metrics are calculated and updated
   */
  updates: {
    metricsInterval: 1000,    // Update FPS counter every 1000ms (1 second)
                              // Connected to: PerformanceManager.js updatePerformanceMetrics()
    fpsUpdateInterval: 1000,  // Calculate FPS over 1 second intervals for accuracy
                              // Connected to: PerformanceManager.js FPS calculation timing
    memoryCheckInterval: 5000, // Check memory usage every 5 seconds
                              // Purpose: Memory monitoring frequency
    cullingUpdateInterval: 16  // Update culling every 16ms (~60fps)
                              // Purpose: Culling update frequency for smooth performance
  },

  /**
   * Calculation Constants
   * Mathematical constants used in performance calculations
   */
  calculations: {
    millisecondsPerSecond: 1000,  // Connected to: PerformanceManager.js FPS calculations
                                  // Purpose: Convert milliseconds to seconds for FPS calculation
    defaultProgramCount: 0,       // Connected to: PerformanceManager.js memory stats fallback
                                  // Purpose: Default value when renderer programs length is unavailable
    zeroRatio: 0,                 // Connected to: PerformanceManager.js ratio calculations
                                  // Purpose: Default ratio when no shapes exist
    defaultCullingTime: 0         // Connected to: PerformanceManager.js culling time fallback
                                  // Purpose: Default culling time when not measured
  },

  /**
   * Performance Analysis Weights
   * Used to calculate overall performance scores
   */
  weights: {
    fpsWeight: 0.5,      // FPS contributes 50% to overall performance score
                         // Purpose: Weight FPS heavily in performance analysis
    frameTimeWeight: 0.3, // Frame time contributes 30% to performance score
                          // Purpose: Frame time consistency importance
    memoryWeight: 0.2     // Memory usage contributes 20% to performance score
                          // Purpose: Memory efficiency importance
  },

  /**
   * Optimization Trigger Thresholds
   * When to automatically enable/disable optimizations
   */
  optimizations: {
    enableCullingFpsThreshold: 45,    // Enable frustum culling when FPS drops below 45
                                      // Purpose: Automatic optimization trigger
    disableCullingFpsThreshold: 58,   // Disable culling when FPS is above 58 (hysteresis)
                                      // Purpose: Prevent optimization thrashing
    reduceQualityFpsThreshold: 25,    // Reduce rendering quality when FPS drops below 25
                                      // Purpose: Emergency performance preservation
    emergencyModeThreshold: 15        // Enter emergency mode when FPS drops below 15
                                      // Purpose: Last resort performance mode
  },

  /**
   * Performance Severity Levels
   * String constants for performance analysis results
   */
  severity: {
    EXCELLENT: 'excellent',  // Performance is excellent (>target FPS, low memory)
    GOOD: 'good',           // Performance is good (near target FPS)
    WARNING: 'warning',     // Performance needs attention (below warning thresholds)
    CRITICAL: 'critical',   // Performance is critically poor (below critical thresholds)
    EMERGENCY: 'emergency'  // Performance is in emergency state (system struggling)
  },

  /**
   * Performance Monitoring Configuration
   * Controls what metrics are tracked and how
   */
  monitoring: {
    trackFrameTimes: true,      // Track individual frame render times
    trackMemoryUsage: true,     // Track memory consumption
    trackCullingStats: true,    // Track frustum culling effectiveness
    historyLength: 60,          // Keep 60 samples of performance history
    alertThreshold: 3,          // Show alert after 3 consecutive poor performance samples
    recoveryThreshold: 5        // Consider recovered after 5 consecutive good performance samples
  }
};
