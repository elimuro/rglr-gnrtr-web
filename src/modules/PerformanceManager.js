/**
 * PerformanceManager.js - Performance Optimization and Monitoring
 * This module handles all performance-related functionality including frustum culling,
 * visibility management, performance metrics tracking, and rendering optimizations.
 * Extracted from Scene.js to improve modularity and separation of concerns.
 */

import * as THREE from 'three';
import { PERFORMANCE_CONSTANTS } from '../config/index.js';

export class PerformanceManager {
    constructor(state, objectPool) {
        this.state = state;
        this.objectPool = objectPool;
        
        // Frustum culling optimization
        this.frustum = new THREE.Frustum();
        this.projectionMatrix = new THREE.Matrix4();
        this.viewMatrix = new THREE.Matrix4();
        this.visibleShapes = new Set();
        
        // Performance metrics
        this.lastPerformanceMetrics = {
            totalShapes: 0,
            visibleShapes: 0,
            animatedShapes: 0,
            cullingRatio: 0
        };
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.fps = 0;
        this.frameTime = 0;
        this.renderTime = 0;
        
        // Culling configuration using performance constants
        this.cullingConfig = {
            enabled: PERFORMANCE_CONSTANTS.culling.enabled,
            margin: PERFORMANCE_CONSTANTS.culling.margin, // Margin around viewport for culling
            updateFrequency: PERFORMANCE_CONSTANTS.culling.updateFrequency, // Update culling every N frames
            frameCounter: 0
        };
        
        // Shapes reference will be set by Scene.js
        this.shapes = [];
        this.camera = null;
        this.renderer = null;
        this.scene = null;
    }

    /**
     * Set references to scene components
     * @param {THREE.Mesh[]} shapes - Array of shape meshes
     * @param {THREE.Camera} camera - Camera reference
     * @param {THREE.WebGLRenderer} renderer - Renderer reference
     * @param {THREE.Scene} scene - Scene reference
     */
    setSceneReferences(shapes, camera, renderer, scene) {
        this.shapes = shapes;
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;
    }

    /**
     * Update frustum culling to optimize rendering performance
     */
    updateFrustumCulling() {
        if (!this.camera || !this.shapes) {
            return;
        }

        // Skip culling update based on frequency setting
        this.cullingConfig.frameCounter++;
        if (this.cullingConfig.frameCounter % this.cullingConfig.updateFrequency !== 0) {
            return;
        }

        // Start performance timing
        const startTime = performance.now();
        
        // Clear visible shapes set
        this.visibleShapes.clear();
        
        // Get camera viewport dimensions
        const camera = this.camera;
        
        // Calculate viewport bounds (for orthographic camera)
        const viewportWidth = camera.right - camera.left;
        const viewportHeight = camera.top - camera.bottom;
        
        // Add margin to account for shape size
        const margin = this.cullingConfig.margin;
        const bounds = {
            left: camera.left - margin,
            right: camera.right + margin,
            top: camera.top + margin,
            bottom: camera.bottom - margin
        };
        
        // Check each shape for visibility
        let visibleCount = 0;
        for (const shape of this.shapes) {
            if (shape && shape.position) {
                const x = shape.position.x;
                const y = shape.position.y;
                
                // Check if shape is within viewport bounds
                const isVisible = x >= bounds.left && x <= bounds.right && 
                                y >= bounds.bottom && y <= bounds.top;
                
                if (isVisible) {
                    shape.visible = true;
                    this.visibleShapes.add(shape);
                    visibleCount++;
                } else {
                    shape.visible = false;
                }
            }
        }
        
        // Update performance metrics
        const totalCount = this.shapes.length;
        const cullingRatio = totalCount > 0 ? visibleCount / totalCount : 0;
        
        this.lastPerformanceMetrics.totalShapes = totalCount;
        this.lastPerformanceMetrics.visibleShapes = visibleCount;
        this.lastPerformanceMetrics.cullingRatio = cullingRatio;
        
        // Track culling performance
        const cullingTime = performance.now() - startTime;
        this.lastPerformanceMetrics.cullingTime = cullingTime;
    }

    /**
     * Advanced frustum culling using Three.js Frustum class
     */
    updateAdvancedFrustumCulling() {
        if (!this.camera || !this.shapes) {
            return;
        }

        const startTime = performance.now();
        
        // Update frustum from camera
        this.projectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projectionMatrix);
        
        this.visibleShapes.clear();
        let visibleCount = 0;
        
        for (const shape of this.shapes) {
            if (shape && shape.geometry) {
                // Get bounding sphere for more accurate culling
                if (!shape.geometry.boundingSphere) {
                    shape.geometry.computeBoundingSphere();
                }
                
                const boundingSphere = shape.geometry.boundingSphere.clone();
                boundingSphere.applyMatrix4(shape.matrixWorld);
                
                const isVisible = this.frustum.intersectsSphere(boundingSphere);
                
                if (isVisible) {
                    shape.visible = true;
                    this.visibleShapes.add(shape);
                    visibleCount++;
                } else {
                    shape.visible = false;
                }
            }
        }
        
        // Update metrics
        const totalCount = this.shapes.length;
        const cullingRatio = totalCount > 0 ? visibleCount / totalCount : 0;
        
        this.lastPerformanceMetrics.totalShapes = totalCount;
        this.lastPerformanceMetrics.visibleShapes = visibleCount;
        this.lastPerformanceMetrics.cullingRatio = cullingRatio;
        this.lastPerformanceMetrics.cullingTime = performance.now() - startTime;
    }

    /**
     * Make all shapes visible (disable culling)
     */
    disableCulling() {
        this.visibleShapes.clear();
        
        for (const shape of this.shapes) {
            if (shape) {
                shape.visible = true;
                this.visibleShapes.add(shape);
            }
        }
        
        this.lastPerformanceMetrics.visibleShapes = this.shapes.length;
        this.lastPerformanceMetrics.cullingRatio = PERFORMANCE_CONSTANTS.culling.fullVisibilityRatio;
    }

    /**
     * Update performance metrics including FPS and frame timing
     */
    updatePerformanceMetrics() {
        this.frameCount++;
        const currentTime = performance.now();
        
        // Update FPS using configured interval
        if (currentTime - this.lastFPSUpdate >= PERFORMANCE_CONSTANTS.updates.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * PERFORMANCE_CONSTANTS.calculations.millisecondsPerSecond) / (currentTime - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
        
        // Calculate frame time
        if (this.lastFrameTime) {
            this.frameTime = currentTime - this.lastFrameTime;
        }
        this.lastFrameTime = currentTime;
    }

    /**
     * Measure render time for performance analysis
     * @param {Function} renderFunction - Function to execute and measure
     * @returns {*} Result of the render function
     */
    measureRenderTime(renderFunction) {
        const startTime = performance.now();
        const result = renderFunction();
        this.renderTime = performance.now() - startTime;
        return result;
    }

    /**
     * Get comprehensive performance metrics
     * @returns {Object} Performance metrics object
     */
    getPerformanceMetrics() {
        const poolStats = this.objectPool ? this.objectPool.getPoolStats() : {};
        
        return {
            ...this.lastPerformanceMetrics,
            fps: this.fps,
            frameTime: this.frameTime,
            renderTime: this.renderTime,
            poolStats,
            cullingEnabled: this.cullingConfig.enabled,
            cullingMargin: this.cullingConfig.margin,
            timestamp: performance.now()
        };
    }

    /**
     * Get visible shapes set
     * @returns {Set} Set of visible shape meshes
     */
    getVisibleShapes() {
        return this.visibleShapes;
    }

    /**
     * Get culling statistics
     * @returns {Object} Culling statistics
     */
    getCullingStats() {
        return {
            totalShapes: this.lastPerformanceMetrics.totalShapes,
            visibleShapes: this.lastPerformanceMetrics.visibleShapes,
            culledShapes: this.lastPerformanceMetrics.totalShapes - this.lastPerformanceMetrics.visibleShapes,
            cullingRatio: this.lastPerformanceMetrics.cullingRatio,
            cullingTime: this.lastPerformanceMetrics.cullingTime || PERFORMANCE_CONSTANTS.calculations.defaultCullingTime,
            enabled: this.cullingConfig.enabled
        };
    }

    /**
     * Set culling configuration
     * @param {Object} config - Culling configuration
     */
    setCullingConfig(config) {
        this.cullingConfig = { ...this.cullingConfig, ...config };
    }

    /**
     * Enable or disable frustum culling
     * @param {boolean} enabled - Whether culling should be enabled
     */
    setCullingEnabled(enabled) {
        this.cullingConfig.enabled = enabled;
        
        if (!enabled) {
            this.disableCulling();
        }
    }

    /**
     * Set culling margin (viewport padding)
     * @param {number} margin - Margin value
     */
    setCullingMargin(margin) {
        this.cullingConfig.margin = margin;
    }

    /**
     * Set culling update frequency
     * @param {number} frequency - Update every N frames
     */
    setCullingUpdateFrequency(frequency) {
        this.cullingConfig.updateFrequency = Math.max(PERFORMANCE_CONSTANTS.culling.minUpdateFrequency, frequency);
    }

    /**
     * Optimize rendering by handling culling and performance updates
     */
    optimizeRendering() {
        // Update performance metrics
        this.updatePerformanceMetrics();
        
        // Handle frustum culling based on state
        if (this.state.get('enableFrustumCulling') && this.cullingConfig.enabled) {
            if (this.state.get('advancedFrustumCulling')) {
                this.updateAdvancedFrustumCulling();
            } else {
                this.updateFrustumCulling();
            }
        } else {
            this.disableCulling();
        }
    }

    /**
     * Get memory usage statistics
     * @returns {Object} Memory usage information
     */
    getMemoryStats() {
        const stats = {};
        
        if (this.renderer && this.renderer.info) {
            stats.renderer = {
                geometries: this.renderer.info.memory.geometries,
                textures: this.renderer.info.memory.textures,
                programs: this.renderer.info.programs?.length || PERFORMANCE_CONSTANTS.calculations.defaultProgramCount
            };
            
            stats.render = {
                calls: this.renderer.info.render.calls,
                triangles: this.renderer.info.render.triangles,
                points: this.renderer.info.render.points,
                lines: this.renderer.info.render.lines
            };
        }
        
        // Add browser memory info if available using performance constants
        if (performance.memory) {
            stats.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / PERFORMANCE_CONSTANTS.memory.conversionFactor), // MB
                total: Math.round(performance.memory.totalJSHeapSize / PERFORMANCE_CONSTANTS.memory.conversionFactor), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / PERFORMANCE_CONSTANTS.memory.conversionFactor) // MB
            };
        }
        
        return stats;
    }

    /**
     * Detect performance bottlenecks
     * @returns {Object} Performance analysis
     */
    analyzePerformance() {
        const metrics = this.getPerformanceMetrics();
        const memoryStats = this.getMemoryStats();
        
        const analysis = {
            issues: [],
            recommendations: [],
            severity: 'good' // good, warning, critical
        };
        
        // FPS analysis using performance constants
        if (metrics.fps < PERFORMANCE_CONSTANTS.fps.critical) {
            analysis.issues.push('Low FPS detected');
            analysis.recommendations.push('Enable frustum culling or reduce grid size');
            analysis.severity = PERFORMANCE_CONSTANTS.severity.CRITICAL;
        } else if (metrics.fps < PERFORMANCE_CONSTANTS.fps.warning) {
            analysis.issues.push('Below optimal FPS');
            analysis.recommendations.push('Consider enabling performance optimizations');
            analysis.severity = PERFORMANCE_CONSTANTS.severity.WARNING;
        }
        
        // Frame time analysis using performance constants
        if (metrics.frameTime > PERFORMANCE_CONSTANTS.frameTime.critical) {
            analysis.issues.push('High frame time');
            analysis.recommendations.push('Optimize animation complexity');
            if (analysis.severity === 'good') analysis.severity = PERFORMANCE_CONSTANTS.severity.WARNING;
        }
        
        // Culling efficiency analysis using performance constants
        if (metrics.cullingRatio > PERFORMANCE_CONSTANTS.culling.efficiencyThreshold && metrics.cullingEnabled) {
            analysis.recommendations.push('Frustum culling may not be beneficial with current viewport');
        }
        
        // Memory analysis using performance constants
        if (memoryStats.memory && memoryStats.memory.used > PERFORMANCE_CONSTANTS.memory.warningThreshold) {
            analysis.issues.push('High memory usage');
            analysis.recommendations.push('Check for memory leaks or reduce object complexity');
            if (analysis.severity === 'good') analysis.severity = PERFORMANCE_CONSTANTS.severity.WARNING;
        }
        
        return analysis;
    }

    /**
     * Reset performance counters
     */
    resetCounters() {
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.fps = 0;
        this.frameTime = 0;
        this.renderTime = 0;
        this.cullingConfig.frameCounter = 0;
    }

    /**
     * Export performance data for analysis
     * @returns {Object} Exportable performance data
     */
    exportPerformanceData() {
        return {
            metrics: this.getPerformanceMetrics(),
            cullingStats: this.getCullingStats(),
            memoryStats: this.getMemoryStats(),
            analysis: this.analyzePerformance(),
            timestamp: new Date().toISOString(),
            config: {
                culling: this.cullingConfig,
                stateSettings: {
                    enableFrustumCulling: this.state.get('enableFrustumCulling'),
                    advancedFrustumCulling: this.state.get('advancedFrustumCulling')
                }
            }
        };
    }

    /**
     * Clean up performance manager resources
     */
    destroy() {
        this.visibleShapes.clear();
        this.shapes = [];
        this.camera = null;
        this.renderer = null;
        this.scene = null;
        this.lastPerformanceMetrics = null;
    }
}
