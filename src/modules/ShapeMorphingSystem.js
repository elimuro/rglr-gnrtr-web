/**
 * ShapeMorphingSystem.js - Point-Based Shape Morphing
 * This module handles smooth transitions between different geometric shapes using the existing
 * point system. It interpolates between point coordinates to create natural morphing effects.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export class ShapeMorphingSystem {
    constructor() {
        this.morphingShapes = new Map(); // Track currently morphing shapes
        this.morphingTimelines = new Map(); // GSAP timelines for morphing
        this.shapeGenerator = null; // Will be set by external system
    }

    // Set the shape generator reference
    setShapeGenerator(shapeGenerator) {
        this.shapeGenerator = shapeGenerator;
    }

    // Start morphing between two shapes
    startMorph(mesh, fromShapeName, toShapeName, duration = 2.0, easing = 'power2.inOut') {
        if (!mesh || !fromShapeName || !toShapeName) {
            return;
        }

        // Stop any existing morphing for this mesh
        this.stopMorph(mesh);

        // Create morphing timeline
        const timeline = gsap.timeline({
            onUpdate: () => this.updateMorph(mesh, timeline.progress()),
            onComplete: () => this.completeMorph(mesh)
        });

        // Store morphing data
        this.morphingShapes.set(mesh, {
            fromShape: fromShapeName,
            toShape: toShapeName,
            timeline: timeline,
            startGeometry: mesh.geometry.clone(),
            targetGeometry: this.createTargetGeometry(toShapeName)
        });

        this.morphingTimelines.set(mesh, timeline);

        // Start the morphing animation
        timeline.to({}, {
            duration: duration,
            ease: easing,
            onUpdate: () => {
                const progress = timeline.progress();
                this.updateMorph(mesh, progress);
            }
        });

        return timeline;
    }

    // Update morphing progress
    updateMorph(mesh, progress) {
        const morphData = this.morphingShapes.get(mesh);
        if (!morphData) return;

        const { fromShape, toShape, startGeometry, targetGeometry } = morphData;
        
        // If we don't have a target geometry, try to create it now
        let finalTargetGeometry = targetGeometry;
        if (!finalTargetGeometry) {
            finalTargetGeometry = this.createTargetGeometry(toShape);
            if (finalTargetGeometry) {
                morphData.targetGeometry = finalTargetGeometry;
            }
        }
        
        // Create interpolated geometry using point-based morphing
        const interpolatedGeometry = this.interpolateGeometry(
            startGeometry, 
            finalTargetGeometry, 
            progress,
            fromShape,
            toShape
        );

        // Update mesh geometry
        if (interpolatedGeometry) {
            mesh.geometry.dispose();
            mesh.geometry = interpolatedGeometry;
        }
    }

    // Interpolate between two geometries using point-based approach
    interpolateGeometry(fromGeometry, toGeometry, progress, fromShapeName, toShapeName) {
        // Handle null geometries
        if (!fromGeometry || !toGeometry) {
            return null;
        }
        
        // Only handle ShapeGeometry morphing (2D shapes)
        if (fromGeometry.type === 'ShapeGeometry' && toGeometry.type === 'ShapeGeometry') {
            return this.interpolateShapeGeometry(fromGeometry, toGeometry, progress, fromShapeName, toShapeName);
        }
        
        return null;
    }

    // Interpolate between ShapeGeometries using point-based morphing
    interpolateShapeGeometry(fromGeometry, toGeometry, progress, fromShapeName, toShapeName) {
        // Get the point sequences for both shapes
        const fromPoints = this.getShapePoints(fromShapeName);
        const toPoints = this.getShapePoints(toShapeName);
        
        if (!fromPoints || !toPoints) {
            return null;
        }
        
        // Interpolate between point sequences
        const interpolatedPoints = this.interpolatePointSequence(fromPoints, toPoints, progress);
        
        // Validate interpolated points
        if (!this.validatePoints(interpolatedPoints)) {
            return this.createFallbackGeometry(fromGeometry, toGeometry, progress);
        }
        
        try {
            // Create new shape from interpolated points
            const interpolatedShape = new THREE.Shape(interpolatedPoints);
            
            // Create geometry from interpolated shape
            const newGeometry = new THREE.ShapeGeometry(interpolatedShape);
            newGeometry.computeBoundingBox();
            
            // Validate the created geometry
            if (!this.validateGeometry(newGeometry)) {
                return this.createFallbackGeometry(fromGeometry, toGeometry, progress);
            }
            
            return newGeometry;
        } catch (error) {
            return this.createFallbackGeometry(fromGeometry, toGeometry, progress);
        }
    }

    // Get the point sequence for a shape
    getShapePoints(shapeName) {
        if (!this.shapeGenerator) return null;
        
        // Check if this is a sphere shape (spheres don't use the point system)
        if (shapeName.startsWith('sphere_')) {
            return null; // Spheres are handled separately
        }
        
        // Get the shape generator function
        const shapeGenerators = this.shapeGenerator.getShapeGenerators();
        const generator = shapeGenerators[shapeName];
        if (!generator) return null;
        
        // Create the shape to get its points
        const shape = generator();
        if (!shape || !shape.curves || shape.curves.length === 0) return null;
        
        // Special handling for ellipse shapes
        if (shapeName.startsWith('ellipse')) {
            return this.getEllipsePoints(shape, shapeName);
        }
        
        // Extract points from the shape
        const points = [];
        shape.curves.forEach(curve => {
            if (curve.v0) points.push(curve.v0);
            if (curve.v1) points.push(curve.v1);
        });
        
        return points;
    }

    // Get smooth points for ellipse shapes
    getEllipsePoints(shape, shapeName) {
        const points = [];
        
        // Generate smooth points around the ellipse
        const segments = 32; // Number of points to generate
        const center = new THREE.Vector2(0, 0);
        const radius = 0.5;
        
        // Determine ellipse parameters based on shape name
        let startAngle = 0;
        let endAngle = Math.PI * 2;
        let isNegative = false;
        
        if (shapeName.includes('neg')) {
            isNegative = true;
        }
        
        if (shapeName.includes('semi')) {
            if (shapeName.includes('UP')) {
                startAngle = Math.PI;
                endAngle = 0;
            } else if (shapeName.includes('DOWN')) {
                startAngle = 0;
                endAngle = Math.PI;
            } else if (shapeName.includes('LEFT')) {
                startAngle = Math.PI / 2;
                endAngle = 1.5 * Math.PI;
            } else if (shapeName.includes('RIGHT')) {
                startAngle = -Math.PI / 2;
                endAngle = Math.PI / 2;
            }
        } else if (shapeName.includes('BL')) {
            startAngle = Math.PI;
            endAngle = 1.5 * Math.PI;
        } else if (shapeName.includes('BR')) {
            startAngle = 1.5 * Math.PI;
            endAngle = 2 * Math.PI;
        } else if (shapeName.includes('TL')) {
            startAngle = 0.5 * Math.PI;
            endAngle = Math.PI;
        } else if (shapeName.includes('TR')) {
            startAngle = 0;
            endAngle = 0.5 * Math.PI;
        }
        
        // Generate points along the ellipse
        for (let i = 0; i <= segments; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / segments);
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);
            points.push(new THREE.Vector2(x, y));
        }
        
        // For negative ellipses, add a small inner circle
        if (isNegative) {
            const innerRadius = 0.35;
            for (let i = segments; i >= 0; i--) {
                const angle = startAngle + (endAngle - startAngle) * (i / segments);
                const x = center.x + innerRadius * Math.cos(angle);
                const y = center.y + innerRadius * Math.sin(angle);
                points.push(new THREE.Vector2(x, y));
            }
        }
        
        return points;
    }

    // Interpolate between two point sequences
    interpolatePointSequence(fromPoints, toPoints, progress) {
        const maxPoints = Math.max(fromPoints.length, toPoints.length);
        const interpolatedPoints = [];
        
        // Ensure we have valid fallback points
        const fallbackPoint = new THREE.Vector2(0, 0);
        const fromFallback = fromPoints[0] || fallbackPoint;
        const toFallback = toPoints[0] || fallbackPoint;
        
        // Handle different point counts more gracefully
        for (let i = 0; i < maxPoints; i++) {
            let fromPoint, toPoint;
            
            // Map points more intelligently
            if (fromPoints.length === toPoints.length) {
                // Same number of points - direct mapping
                fromPoint = fromPoints[i] || fromFallback;
                toPoint = toPoints[i] || toFallback;
            } else {
                // Different point counts - interpolate indices
                const fromIndex = Math.floor((i / maxPoints) * fromPoints.length);
                const toIndex = Math.floor((i / maxPoints) * toPoints.length);
                fromPoint = fromPoints[fromIndex] || fromFallback;
                toPoint = toPoints[toIndex] || toFallback;
            }
            
            // Ensure points are valid
            if (!fromPoint || !toPoint || 
                isNaN(fromPoint.x) || isNaN(fromPoint.y) || 
                isNaN(toPoint.x) || isNaN(toPoint.y)) {
                // Use fallback interpolation
                const interpolatedPoint = new THREE.Vector2(
                    fromFallback.x + (toFallback.x - fromFallback.x) * progress,
                    fromFallback.y + (toFallback.y - fromFallback.y) * progress
                );
                interpolatedPoints.push(interpolatedPoint);
                continue;
            }
            
            // Interpolate between points
            const interpolatedPoint = new THREE.Vector2(
                fromPoint.x + (toPoint.x - fromPoint.x) * progress,
                fromPoint.y + (toPoint.y - fromPoint.y) * progress
            );
            
            interpolatedPoints.push(interpolatedPoint);
        }
        
        return interpolatedPoints;
    }

    // Validate interpolated points
    validatePoints(points) {
        if (!points || points.length < 3) {
            return false;
        }
        
        // Check for NaN or infinite values
        for (const point of points) {
            if (!point || isNaN(point.x) || isNaN(point.y) || 
                !isFinite(point.x) || !isFinite(point.y)) {
                return false;
            }
        }
        
        // Check if points form a valid shape (not all the same)
        const firstPoint = points[0];
        const allSame = points.every(point => 
            Math.abs(point.x - firstPoint.x) < 0.001 && 
            Math.abs(point.y - firstPoint.y) < 0.001
        );
        
        return !allSame;
    }

    // Validate created geometry
    validateGeometry(geometry) {
        if (!geometry || !geometry.attributes || !geometry.attributes.position) {
            return false;
        }
        
        const positions = geometry.attributes.position.array;
        if (positions.length === 0) {
            return false;
        }
        
        // Check for NaN values in positions
        for (let i = 0; i < positions.length; i++) {
            if (isNaN(positions[i]) || !isFinite(positions[i])) {
                return false;
            }
        }
        
        return true;
    }

    // Create fallback geometry when interpolation fails
    createFallbackGeometry(fromGeometry, toGeometry, progress) {
        // Simple fallback: interpolate between the original geometries
        const fromPositions = fromGeometry.attributes.position.array;
        const toPositions = toGeometry.attributes.position.array;
        
        const maxLength = Math.max(fromPositions.length, toPositions.length);
        const interpolated = new Float32Array(maxLength);
        
        for (let i = 0; i < maxLength; i++) {
            const fromValue = fromPositions[i] || 0;
            const toValue = toPositions[i] || 0;
            interpolated[i] = fromValue + (toValue - fromValue) * progress;
        }
        
        const fallbackGeometry = new THREE.BufferGeometry();
        fallbackGeometry.setAttribute('position', new THREE.BufferAttribute(interpolated, 3));
        
        return fallbackGeometry;
    }

    // Create target geometry for morphing
    createTargetGeometry(shapeName) {
        if (!this.shapeGenerator) {
            return null;
        }

        return this.shapeGenerator.createGeometryForShape(shapeName);
    }

    // Stop morphing for a specific mesh
    stopMorph(mesh) {
        const timeline = this.morphingTimelines.get(mesh);
        if (timeline) {
            timeline.kill();
            this.morphingTimelines.delete(mesh);
        }
        this.morphingShapes.delete(mesh);
    }

    // Complete morphing for a mesh
    completeMorph(mesh) {
        this.morphingShapes.delete(mesh);
        this.morphingTimelines.delete(mesh);
    }

    // Clean up all morphing
    dispose() {
        this.morphingTimelines.forEach(timeline => timeline.kill());
        this.morphingTimelines.clear();
        this.morphingShapes.clear();
    }
} 