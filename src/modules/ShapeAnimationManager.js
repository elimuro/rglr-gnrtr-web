/**
 * ShapeAnimationManager.js - Shape Animation and Movement Logic
 * This module handles all shape animation functionality including movement, rotation, scaling,
 * shape cycling, center scaling effects, and musical timing integration.
 * Extracted from Scene.js to improve modularity and separation of concerns.
 */

export class ShapeAnimationManager {
    constructor(state, shapeGenerator, materialManager) {
        this.state = state;
        this.shapeGenerator = shapeGenerator;
        this.materialManager = materialManager;
        this.bpmTimingManager = null; // Will be set by Scene.js
        
        // Performance tracking
        this.lastPerformanceMetrics = {
            totalShapes: 0,
            visibleShapes: 0,
            animatedShapes: 0,
            cullingRatio: 0
        };
    }

    /**
     * Main animation method - orchestrates all shape animations
     * @param {Array} shapes - Array of Three.js mesh objects
     * @param {Set} visibleShapes - Set of visible shapes for performance optimization
     * @param {number} animationTime - Current animation time
     * @param {number} globalBPM - Current BPM for musical timing
     */
    animateShapes(shapes, visibleShapes, animationTime, globalBPM) {
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const cellSize = this.state.get('cellSize');
        
        // Get available shapes based on enabled categories
        const availableShapes = this.shapeGenerator.getAvailableShapes(this.state.get('enabledShapes'));
        if (availableShapes.length === 0) return;
        
        // Update material color for all shapes
        const material = this.materialManager.getBasicMaterial(this.state.get('shapeColor'));
        
        // Create refractive material for spheres with environment map
        const sphereMaterial = this.materialManager.getSphereMaterial(this.state);
        
        let shapeIndex = 0;
        let animatedCount = 0;
        
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = shapes[shapeIndex];
                if (mesh) {
                    // Only animate visible shapes for better performance
                    const isVisible = visibleShapes.has(mesh);
                    let isAnimated = false;
                    
                    // Update material based on shape type
                    if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                        mesh.material = sphereMaterial;
                    } else {
                        mesh.material = material;
                    }
                    
                    // Shape cycling (independent of size/movement animations)
                    if (this.state.get('enableShapeCycling')) {
                        this.cycleShapeInCell(mesh, x, y, availableShapes, animationTime, globalBPM);
                        isAnimated = true;
                    }
                    
                    // Size/movement animations (using manual calculations for now)
                    if (this.state.get('enableMovementAnimation') || 
                        this.state.get('enableRotationAnimation') || 
                        this.state.get('enableScaleAnimation')) {
                        this.animateShapeTransformations(mesh, x, y, animationTime, globalBPM);
                        isAnimated = true;
                    } else {
                        // Reset to original positions when no animations are enabled
                        this.resetShapeToBasePosition(mesh, x, y, gridWidth, gridHeight, cellSize);
                    }
                    
                    // Always apply center scaling animation when enabled (independent of other animations)
                    if (this.state.get('centerScalingEnabled')) {
                        this.applyCenterScaling(mesh, x, y, gridWidth, gridHeight, cellSize, animationTime, globalBPM);
                        isAnimated = true;
                    }
                    
                    // Count animated shapes (both shape cycling and size/movement)
                    if (isAnimated && isVisible) {
                        animatedCount++;
                    }
                }
                shapeIndex++;
            }
        }
        
        // Store performance metrics
        this.lastPerformanceMetrics = {
            totalShapes: shapes.length,
            visibleShapes: visibleShapes.size,
            animatedShapes: animatedCount,
            cullingRatio: shapes.length > 0 ? visibleShapes.size / shapes.length : 0
        };
    }

    /**
     * Reset shape to its base grid position
     * @param {THREE.Mesh} mesh - The mesh to reset
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} gridWidth - Grid width
     * @param {number} gridHeight - Grid height
     * @param {number} cellSize - Cell size
     */
    resetShapeToBasePosition(mesh, x, y, gridWidth, gridHeight, cellSize) {
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        mesh.position.x = (x - halfGridW + 0.5) * cellSize;
        mesh.position.y = (y - halfGridH + 0.5) * cellSize;
        mesh.rotation.z = 0;
    }

    /**
     * Apply center scaling effect to a shape
     * @param {THREE.Mesh} mesh - The mesh to scale
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} gridWidth - Grid width
     * @param {number} gridHeight - Grid height
     * @param {number} cellSize - Cell size
     * @param {number} animationTime - Current animation time
     * @param {number} globalBPM - Current BPM
     */
    applyCenterScaling(mesh, x, y, gridWidth, gridHeight, cellSize, animationTime, globalBPM) {
        const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime, globalBPM);
        
        if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
            const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
            mesh.scale.set(sphereScale, sphereScale, sphereScale);
        } else {
            const baseScale = cellSize * centerScalingFactor;
            mesh.scale.set(baseScale, baseScale, 1);
        }
    }

    /**
     * Cycle shapes in a grid cell based on various patterns and timing
     * @param {THREE.Mesh} mesh - The mesh to animate
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {Array} availableShapes - Available shape types
     * @param {number} animationTime - Current animation time
     * @param {number} globalBPM - Current BPM
     */
    cycleShapeInCell(mesh, x, y, availableShapes, animationTime, globalBPM) {
        if (availableShapes.length === 0) return;
        
        const shapeCyclingDivision = this.state.get('shapeCyclingDivision') || 'quarter';
        const shapeCyclingPattern = this.state.get('shapeCyclingPattern');
        const shapeCyclingDirection = this.state.get('shapeCyclingDirection');
        const shapeCyclingSync = this.state.get('shapeCyclingSync');
        const shapeCyclingIntensity = this.state.get('shapeCyclingIntensity');
        const shapeCyclingTrigger = this.state.get('shapeCyclingTrigger');
        
        // Check if shape cycling should be triggered
        let shouldCycle = true;
        if (shapeCyclingTrigger === 1) { // Movement-triggered
            const movementAmp = this.state.get('movementAmplitude');
            shouldCycle = movementAmp > 0.1;
        } else if (shapeCyclingTrigger === 2) { // Rotation-triggered
            const rotationAmp = this.state.get('rotationAmplitude');
            shouldCycle = rotationAmp > 0.1;
        } else if (shapeCyclingTrigger === 3) { // Manual
            shouldCycle = false; // Manual triggers would be handled elsewhere
        }
        
        if (!shouldCycle) return;
        
        // Calculate effective animation time using musical divisions
        const divisionBeats = this.getDivisionBeats(shapeCyclingDivision);
        // Invert the timing: smaller divisions = faster cycling
        const timeOffset = animationTime / divisionBeats;
        
        // Calculate shape index based on pattern and sync
        const cellSeed = x * 1000 + y * 100;
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        
        // Apply synchronization
        let syncOffset = 0;
        if (shapeCyclingSync === 1) { // Synchronized
            syncOffset = 0;
        } else if (shapeCyclingSync === 2) { // Wave
            const waveSpeed = 2.0;
            syncOffset = Math.sin(timeOffset * waveSpeed + (x + y) * 0.5) * 1000;
        } else if (shapeCyclingSync === 3) { // Cluster
            const clusterSize = 3;
            const clusterX = Math.floor(x / clusterSize);
            const clusterY = Math.floor(y / clusterSize);
            syncOffset = (clusterX + clusterY) * 500;
        } else { // Independent (default)
            syncOffset = cellSeed * 0.1;
        }
        
        // Calculate base time with sync
        const baseTime = timeOffset + syncOffset;
        
        // Apply direction
        let directionMultiplier = 1;
        if (shapeCyclingDirection === 1) { // Reverse
            directionMultiplier = -1;
        } else if (shapeCyclingDirection === 2) { // Ping-Pong
            directionMultiplier = Math.sin(baseTime * 0.5) > 0 ? 1 : -1;
        } else if (shapeCyclingDirection === 3) { // Random
            directionMultiplier = Math.sin(baseTime * 0.3) > 0 ? 1 : -1;
        }
        
        // Apply intensity (affects cycling speed)
        const intensityFactor = 0.1 + (shapeCyclingIntensity * 0.9); // 0.1 to 1.0 range
        const finalTime = baseTime * directionMultiplier * intensityFactor;
        
        // Calculate shape index
        let shapeIndex = 0;
        const patternType = Math.floor(shapeCyclingPattern) % 5; // Support patterns 0-4
        
        if (patternType === 0) { // Sequential
            shapeIndex = Math.floor(finalTime) % availableShapes.length;
        } else if (patternType === 1) { // Random
            // Use a deterministic random based on time and position
            const seed = Math.floor(finalTime) + cellSeed;
            shapeIndex = Math.abs(Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453) % 1;
            shapeIndex = Math.floor(shapeIndex * availableShapes.length);
        } else if (patternType === 2) { // Wave
            const waveValue = (Math.sin(finalTime) + 1) / 2; // 0 to 1
            shapeIndex = Math.floor(waveValue * availableShapes.length);
        } else if (patternType === 3) { // Pulse
            // Pulse pattern - all shapes change together in pulses
            const pulseTime = Math.floor(finalTime * 2) / 2; // Snap to half-beat intervals
            shapeIndex = Math.floor(pulseTime) % availableShapes.length;
        } else if (patternType === 4) { // Staggered
            // Staggered pattern - shapes change in a cascading wave
            const staggerDelay = (x + y * gridWidth) * 0.1;
            const staggeredTime = finalTime - staggerDelay;
            shapeIndex = Math.floor(Math.max(0, staggeredTime)) % availableShapes.length;
        }
        
        // Ensure valid index
        shapeIndex = Math.max(0, Math.min(availableShapes.length - 1, shapeIndex));
        
        // Get the target shape
        const targetShape = availableShapes[shapeIndex];
        
        // Only update if the shape has changed
        if (!mesh.userData || mesh.userData.shapeName !== targetShape) {
            this.updateMeshShape(mesh, targetShape);
        }
    }

    /**
     * Animate shape transformations (movement, rotation, scale)
     * @param {THREE.Mesh} mesh - The mesh to animate
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} animationTime - Current animation time
     * @param {number} globalBPM - Current BPM
     */
    animateShapeTransformations(mesh, x, y, animationTime, globalBPM) {
        const cellSize = this.state.get('cellSize');
        const gridWidth = this.state.get('gridWidth');
        const gridHeight = this.state.get('gridHeight');
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        // Calculate center scaling factor
        const centerScalingFactor = this.calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime, globalBPM);
        
        // Get musical divisions for animations
        const movementDivision = this.state.get('movementDivision') || '8th';
        const rotationDivision = this.state.get('rotationDivision') || '16th';
        const scaleDivision = this.state.get('scaleDivision') || 'half';
        
        // Check individual animation toggles
        const enableMovement = this.state.get('enableMovementAnimation');
        const enableRotation = this.state.get('enableRotationAnimation');
        const enableScale = this.state.get('enableScaleAnimation');
        
        // Apply movement animation if enabled
        if (enableMovement) {
            const movementBeats = this.getDivisionBeats(movementDivision);
            const movementTime = animationTime / movementBeats;
            const xOffset = Math.sin(movementTime + x * 0.5) * this.state.get('movementAmplitude') * cellSize;
            const yOffset = Math.cos(movementTime + y * 0.5) * this.state.get('movementAmplitude') * cellSize;
            mesh.position.x = (x - halfGridW + 0.5) * cellSize + xOffset;
            mesh.position.y = (y - halfGridH + 0.5) * cellSize + yOffset;
        } else {
            // Reset to original position if movement is disabled
            mesh.position.x = (x - halfGridW + 0.5) * cellSize;
            mesh.position.y = (y - halfGridH + 0.5) * cellSize;
        }
        
        // Apply rotation animation if enabled
        if (enableRotation) {
            const rotationBeats = this.getDivisionBeats(rotationDivision);
            const rotationTime = animationTime / rotationBeats;
            mesh.rotation.z = Math.sin(rotationTime + x * 0.3 + y * 0.3) * this.state.get('rotationAmplitude');
        } else {
            // Reset rotation if disabled
            mesh.rotation.z = 0;
        }
        
        // Apply scale animation if enabled
        if (enableScale) {
            const scaleBeats = this.getDivisionBeats(scaleDivision);
            const scaleTime = animationTime / scaleBeats;
            const scale = 1 + Math.sin(scaleTime + x * 0.5 + y * 0.5) * this.state.get('scaleAmplitude');
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                const sphereScale = cellSize * this.state.get('sphereScale') * scale * centerScalingFactor;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            } else {
                const baseScale = cellSize * scale * centerScalingFactor;
                mesh.scale.set(baseScale, baseScale, 1);
            }
        } else {
            // Reset scale if disabled
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            } else {
                const baseScale = cellSize * centerScalingFactor;
                mesh.scale.set(baseScale, baseScale, 1);
            }
        }
        
        // Apply center scaling if enabled (independent of other animations)
        if (this.state.get('centerScalingEnabled')) {
            if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
                const sphereScale = cellSize * this.state.get('sphereScale') * centerScalingFactor;
                mesh.scale.set(sphereScale, sphereScale, sphereScale);
            } else {
                const baseScale = cellSize * centerScalingFactor;
                mesh.scale.set(baseScale, baseScale, 1);
            }
        }
    }

    /**
     * Calculate center scaling factor based on distance from center and various effects
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} gridWidth - Grid width
     * @param {number} gridHeight - Grid height
     * @param {number} cellSize - Cell size
     * @param {number} animationTime - Current animation time (optional)
     * @param {number} globalBPM - Current BPM (optional)
     * @returns {number} Scaling factor
     */
    calculateCenterScaling(x, y, gridWidth, gridHeight, cellSize, animationTime = null, globalBPM = null) {
        if (!this.state.get('centerScalingEnabled')) {
            return 1.0; // No scaling if disabled
        }

        const intensity = this.state.get('centerScalingIntensity');
        const curve = this.state.get('centerScalingCurve');
        const radius = this.state.get('centerScalingRadius');
        const direction = this.state.get('centerScalingDirection');
        const centerScalingDivision = this.state.get('centerScalingDivision') || 'quarter';
        const animationType = this.state.get('centerScalingAnimationType');

        // Calculate distance from center (0,0)
        const centerX = (gridWidth - 1) / 2;
        const centerY = (gridHeight - 1) / 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow((x - centerX) * cellSize, 2) + 
            Math.pow((y - centerY) * cellSize, 2)
        );

        // Normalize distance to 0-1 range based on radius
        const maxDistance = Math.sqrt(
            Math.pow(centerX * cellSize, 2) + 
            Math.pow(centerY * cellSize, 2)
        ) * radius;
        
        // Prevent division by zero and ensure valid normalized distance
        const normalizedDistance = maxDistance > 0 ? Math.min(distanceFromCenter / maxDistance, 1.0) : 0;

        // Apply curve function
        let curveFactor;
        switch (Math.floor(curve)) {
            case 0: // Linear
                curveFactor = normalizedDistance;
                break;
            case 1: // Exponential
                curveFactor = Math.pow(normalizedDistance, 2);
                break;
            case 2: // Logarithmic
                curveFactor = normalizedDistance > 0 ? Math.log(normalizedDistance + 1) / Math.log(2) : 0;
                break;
            case 3: // Sine wave
                curveFactor = Math.sin(normalizedDistance * Math.PI);
                break;
            default:
                curveFactor = normalizedDistance;
        }

        // Always apply animation when center scaling is enabled
        let animationOffset = 0;
        let time;
        if (animationTime !== null && globalBPM !== null) {
            // Use musical timing
            const divisionBeats = this.getDivisionBeats(centerScalingDivision);
            time = animationTime / divisionBeats;
        } else {
            // Fallback to old timing system
            const animationSpeed = this.state.get('centerScalingAnimationSpeed');
            time = Date.now() * 0.001 * animationSpeed;
        }
        
        // Different animation types for more dramatic effects
        switch (Math.floor(animationType)) {
            case 0: // Complex Wave
                const wave1 = Math.sin(time + x * 0.3 + y * 0.2) * 0.4;
                const wave2 = Math.cos(time * 0.7 + x * 0.4 + y * 0.1) * 0.3;
                const pulse = Math.sin(time * 2 + (x + y) * 0.1) * 0.3;
                animationOffset = wave1 + wave2 + pulse;
                break;
                
            case 1: // Radial Pulse
                const radialDistance = Math.sqrt(x * x + y * y);
                const radialWave = Math.sin(time * 3 + radialDistance * 0.5) * 0.5;
                animationOffset = radialWave;
                break;
                
            case 2: // Spiral Effect
                const angle = Math.atan2(y - centerY, x - centerX);
                const spiralWave = Math.sin(time * 2 + angle * 3 + distanceFromCenter * 0.2) * 0.4;
                animationOffset = spiralWave;
                break;
                
            case 3: // Chaos Pattern
                const chaos1 = Math.sin(time * 1.5 + x * 0.8 + y * 0.6) * 0.3;
                const chaos2 = Math.cos(time * 0.8 + x * 0.4 + y * 0.9) * 0.3;
                const chaos3 = Math.sin(time * 2.2 + (x + y) * 0.7) * 0.2;
                animationOffset = chaos1 + chaos2 + chaos3;
                break;
                
            default:
                // Simple wave as fallback
                animationOffset = Math.sin(time + x * 0.5 + y * 0.3) * 0.3;
        }

        // Clamp animation offset to prevent extreme scaling
        const clampedAnimationOffset = Math.max(-0.5, Math.min(0.5, animationOffset));
        
        // Calculate scaling factor with more dramatic range
        let scalingFactor = 1.0 + (curveFactor * intensity + clampedAnimationOffset);
        
        // Apply direction (inward vs outward scaling)
        if (direction === 1) { // Inward scaling
            scalingFactor = 2.0 - scalingFactor; // Invert the scaling
        }
        
        // Ensure scaling factor stays within reasonable bounds
        return Math.max(0.1, Math.min(3.0, scalingFactor));
    }

    /**
     * Get the number of beats for a musical division
     * @param {string} division - Musical division (e.g., 'quarter', '8th', etc.)
     * @returns {number} Number of beats
     */
    getDivisionBeats(division) {
        if (this.bpmTimingManager) {
            return this.bpmTimingManager.getDivisionBeats(division);
        }
        // Fallback if BPM timing manager not available
        const divisionMap = {
            // Note divisions
            '64th': 0.0625,   // 1/16 beat
            '32nd': 0.125,    // 1/8 beat
            '16th': 0.25,     // 1/4 beat
            '8th': 0.5,       // 1/2 beat
            'quarter': 1,      // 1 beat
            'half': 2,         // 2 beats
            'whole': 4,        // 4 beats
            // Bar divisions (assuming 4/4 time)
            '1bar': 4,         // 1 bar = 4 beats
            '2bars': 8,        // 2 bars = 8 beats
            '4bars': 16,       // 4 bars = 16 beats
            '8bars': 32        // 8 bars = 32 beats
        };
        return divisionMap[division] || 1;
    }

    /**
     * Update mesh shape geometry and material
     * @param {THREE.Mesh} mesh - The mesh to update
     * @param {string} shapeName - Name of the new shape
     */
    updateMeshShape(mesh, shapeName) {
        // Delegate to Scene.js via callback if available
        if (this.updateMeshShapeCallback) {
            this.updateMeshShapeCallback(mesh, shapeName);
            return;
        }

        // Direct implementation if object pool is available
        if (this.objectPool && this.shapeGenerator) {
            let material;
            
            // Use refractive materials for spheres
            if (shapeName.startsWith('sphere_')) {
                material = this.materialManager.getSphereMaterial(this.state);
            } else {
                material = this.materialManager.getBasicMaterial(this.state.get('shapeColor'));
            }
            
            // Return old geometry to pool
            if (mesh.geometry && mesh.userData && mesh.userData.shapeName) {
                this.objectPool.returnGeometry(mesh.userData.shapeName, mesh.geometry);
            }
            
            // Get new geometry from pool or create new one
            const newGeometry = this.objectPool.getGeometry(shapeName, this.shapeGenerator);
            
            if (newGeometry) {
                mesh.geometry = newGeometry;
                mesh.material = material;
                mesh.userData.shapeName = shapeName;
                
                // Reset scale for all shapes to prevent scaling issues during cycling
                const cellSize = this.state.get('cellSize');
                
                if (shapeName.startsWith('sphere_')) {
                    // Enable shadows for spheres
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    // Apply sphere scale
                    const sphereScale = cellSize * this.state.get('sphereScale');
                    mesh.scale.set(sphereScale, sphereScale, sphereScale);
                } else {
                    // Reset to base scale for non-sphere shapes
                    mesh.scale.set(cellSize, cellSize, 1);
                }
            }
        }
    }

    /**
     * Set object pool reference for shape updating
     * @param {ObjectPool} objectPool - The object pool instance
     */
    setObjectPool(objectPool) {
        this.objectPool = objectPool;
    }

    /**
     * Set BPM timing manager reference
     */
    setBPMTimingManager(bpmTimingManager) {
        this.bpmTimingManager = bpmTimingManager;
    }

    /**
     * Set callback for mesh shape updates (delegates to Scene.js)
     * @param {Function} callback - Function to handle mesh shape updates
     */
    setUpdateMeshShapeCallback(callback) {
        this.updateMeshShapeCallback = callback;
    }

    /**
     * Animate shape with GSAP (legacy method for compatibility)
     * @param {THREE.Mesh} mesh - The mesh to animate
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} cellSize - Cell size
     */
    animateShapeWithGSAP(mesh, x, y, cellSize) {
        const animationType = this.state.get('animationType');
        const isSphere = mesh.geometry && mesh.geometry.type === 'SphereGeometry';
        
        // Legacy GSAP animation - kept for backward compatibility
        // This would need GSAP library integration
        console.warn('ShapeAnimationManager: GSAP animation not implemented in extracted module');
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics object
     */
    getPerformanceMetrics() {
        return { ...this.lastPerformanceMetrics };
    }

    /**
     * Reset all animations to default state
     */
    resetAnimations() {
        // This method could be used to reset all animation states
        // Implementation depends on specific requirements
    }

    /**
     * Clean up animation manager resources
     */
    destroy() {
        // Clean up any ongoing operations
        this.lastPerformanceMetrics = null;
    }
}
