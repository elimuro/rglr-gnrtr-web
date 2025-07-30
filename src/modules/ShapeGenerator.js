/**
 * ShapeGenerator.js - 3D Shape Creation and Management
 * This module handles the generation and management of all 3D shapes in the application, including basic
 * geometric shapes, triangles, rectangles, ellipses, and advanced refractive spheres. It provides
 * efficient shape creation, geometry optimization, and supports dynamic shape switching and cycling
 * for animated effects. Now includes cross-category morphing capabilities for smooth transitions
 * between different geometric forms.
 */

import * as THREE from 'three';

export class ShapeGenerator {
    constructor() {
        this.shapeGenerators = this.createShapeGenerators();
        this.morphingSystem = null; // Will be set by external system
    }

    // Get shape generators for morphing system access
    getShapeGenerators() {
        return this.shapeGenerators;
    }

    // Set the morphing system reference
    setMorphingSystem(morphingSystem) {
        this.morphingSystem = morphingSystem;
    }

    // Start morphing between two shapes
    startShapeMorph(mesh, fromShapeName, toShapeName, duration = 2.0, easing = 'power2.inOut') {
        console.log('Starting shape morph:', { mesh, fromShapeName, toShapeName, duration, easing });
        
        if (!this.morphingSystem) {
            console.warn('Morphing system not initialized');
            return null;
        }

        // Create target geometry for the morph
        const targetGeometry = this.createGeometryForShape(toShapeName);
        console.log('Created target geometry:', targetGeometry);
        
        if (!targetGeometry) {
            console.warn('Could not create target geometry for shape:', toShapeName);
            return null;
        }

        // Start the morphing process
        const result = this.morphingSystem.startMorph(mesh, fromShapeName, toShapeName, duration, easing);
        console.log('Morphing system result:', result);
        return result;
    }

    // Create geometry for a specific shape name
    createGeometryForShape(shapeName) {
        const generator = this.shapeGenerators[shapeName];
        if (!generator) {
            console.warn('No generator found for shape:', shapeName);
            return null;
        }

        const shape = generator();
        if (!shape) return null;

        // Convert shape to geometry
        if (shape instanceof THREE.Shape) {
            const geometry = new THREE.ShapeGeometry(shape);
            geometry.computeBoundingBox();
            return geometry;
        } else if (shape instanceof THREE.BufferGeometry) {
            return shape;
        } else if (shape instanceof THREE.SphereGeometry) {
            return shape;
        } else if (shape instanceof THREE.BoxGeometry) {
            return shape;
        } else if (shape instanceof THREE.PlaneGeometry) {
            return shape;
        }

        console.warn('Unknown shape type for:', shapeName, shape);
        return null;
    }

    // Get morphable shape pairs
    getMorphableShapePairs() {
        return {
            // 2D shape morphing (more variety)
            'triangle_to_rectangle': ['triangle_UP', 'Rect'],
            'rectangle_to_triangle': ['Rect', 'triangle_UP'],
            'triangle_to_ellipse': ['triangle_UP', 'ellipse'],
            'rectangle_to_ellipse': ['Rect', 'ellipse'],
            'ellipse_to_triangle': ['ellipse', 'triangle_UP'],
            'ellipse_to_rectangle': ['ellipse', 'Rect'],
            
            // Triangle variations
            'triangle_up_to_down': ['triangle_UP', 'triangle_DOWN'],
            'triangle_left_to_right': ['triangle_LEFT', 'triangle_RIGHT'],
            'triangle_to_diamond': ['triangle_UP', 'diamond'],
            'diamond_to_triangle': ['diamond', 'triangle_UP'],
            
            // Rectangle variations
            'rectangle_to_long': ['Rect', 'longRect_V'],
            'long_to_rectangle': ['longRect_V', 'Rect'],
            'rectangle_to_diamond': ['Rect', 'diamond'],
            'diamond_to_rectangle': ['diamond', 'Rect'],
            
            // Ellipse variations
            'ellipse_to_neg': ['ellipse', 'ellipse_neg'],
            'neg_to_ellipse': ['ellipse_neg', 'ellipse'],
            'ellipse_to_semi': ['ellipse', 'ellipse_semi_UP'],
            'semi_to_ellipse': ['ellipse_semi_UP', 'ellipse'],
            
            // More triangle variations
            'triangle_tl_to_tr': ['triangle_TL', 'triangle_TR'],
            'triangle_bl_to_br': ['triangle_BL', 'triangle_BR'],
            'triangle_split_up_to_down': ['triangle_split_UP', 'triangle_split_DOWN'],
            'triangle_split_left_to_right': ['triangle_split_LEFT', 'triangle_split_RIGHT'],
            
            // More rectangle variations
            'rect_tl_to_tr': ['rect_TL', 'rect_TR'],
            'rect_bl_to_br': ['rect_BL', 'rect_BR'],
            'rect_angled_top_to_bottom': ['rect_angled_TOP', 'rect_angled_BOTTOM'],
            'rect_angled_left_to_right': ['rect_angled_LEFT', 'rect_angled_RIGHT'],
            
            // More ellipse variations
            'ellipse_bl_to_br': ['ellipse_BL', 'ellipse_BR'],
            'ellipse_tl_to_tr': ['ellipse_TL', 'ellipse_TR'],
            'ellipse_semi_up_to_down': ['ellipse_semi_UP', 'ellipse_semi_DOWN'],
            'ellipse_semi_left_to_right': ['ellipse_semi_LEFT', 'ellipse_semi_RIGHT']
        };
    }

    // Get random morphable shape pair with bias toward 2D shapes
    getRandomMorphablePair() {
        const pairs = this.getMorphableShapePairs();
        const pairNames = Object.keys(pairs);
        
        // Bias toward 2D shape morphing (80% chance)
        const use2DShapes = Math.random() < 0.8;
        
        let filteredPairs = pairNames;
        if (use2DShapes) {
            // Filter to only 2D shape pairs (exclude sphere pairs)
            filteredPairs = pairNames.filter(pairName => 
                !pairName.includes('sphere') && 
                !pairs[pairName].some(shape => shape.includes('sphere'))
            );
        }
        
        // If no 2D pairs available, fall back to all pairs
        if (filteredPairs.length === 0) {
            filteredPairs = pairNames;
        }
        
        const randomPairName = filteredPairs[Math.floor(Math.random() * filteredPairs.length)];
        return pairs[randomPairName];
    }

    // Check if two shapes can morph together
    canMorphShapes(fromShapeName, toShapeName) {
        const pairs = this.getMorphableShapePairs();
        for (const [pairName, [shape1, shape2]] of Object.entries(pairs)) {
            if ((fromShapeName === shape1 && toShapeName === shape2) ||
                (fromShapeName === shape2 && toShapeName === shape1)) {
                return true;
            }
        }
        return false;
    }

    // Get all shapes that can morph from a given shape
    getMorphableTargets(fromShapeName) {
        const targets = [];
        const pairs = this.getMorphableShapePairs();
        
        for (const [pairName, [shape1, shape2]] of Object.entries(pairs)) {
            if (fromShapeName === shape1) {
                targets.push(shape2);
            } else if (fromShapeName === shape2) {
                targets.push(shape1);
            }
        }
        
        return targets;
    }

    // Create a morphing preset sequence
    createMorphingPreset(presetName, shapeSequence) {
        if (!this.morphingSystem) return;
        
        // Add the preset to the morphing system
        this.morphingSystem.morphingPresets[presetName] = shapeSequence;
    }

    // Start a morphing preset sequence
    startMorphingPreset(mesh, presetName, duration = 2.0) {
        if (!this.morphingSystem) {
            console.warn('Morphing system not initialized');
            return null;
        }

        return this.morphingSystem.startPresetMorph(mesh, presetName, duration);
    }

    // Get current shape name from mesh
    getCurrentShapeName(mesh) {
        // This is a simplified approach - in practice you might want to store
        // the current shape name with the mesh or track it separately
        return 'triangle_UP'; // Default fallback
    }

    // Update mesh to a new shape (non-morphing)
    updateMeshShape(mesh, shapeName) {
        const geometry = this.createGeometryForShape(shapeName);
        if (geometry) {
            mesh.geometry.dispose();
            mesh.geometry = geometry;
            return true;
        }
        return false;
    }

    createShapeGenerators() {
        // Helper: map OpenFrameworks ptX names to cell coordinates
        const getPt = (name) => {
            const c = 1; // Use fixed size of 1 for shape generation
            const map = {
                pt1: [-c/2, -c/2], pt1_25: [-c/2 + 0.25*c, -c/2], pt1_50: [-c/2 + 0.5*c, -c/2], pt1_75: [-c/2 + 0.75*c, -c/2],
                pt2: [c/2, -c/2], pt2_25: [c/2, -c/2 + 0.25*c], pt2_50: [c/2, -c/2 + 0.5*c], pt2_75: [c/2, -c/2 + 0.75*c],
                pt3: [c/2, c/2], pt3_25: [c/2 - 0.25*c, c/2], pt3_50: [c/2 - 0.5*c, c/2], pt3_75: [c/2 - 0.75*c, c/2],
                pt4: [-c/2, c/2], pt4_25: [-c/2, c/2 - 0.25*c], pt4_50: [-c/2, c/2 - 0.5*c], pt4_75: [-c/2, c/2 - 0.75*c],
                center: [0, 0],
            };
            return new THREE.Vector2(...map[name]);
        };

        return {
            // Triangles
            triangle_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3_50'), getPt('pt1')]),
            triangle_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2_50'), getPt('pt4')]),
            triangle_LEFT: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4_50'), getPt('pt2')]),
            triangle_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt2_50'), getPt('pt1')]),
            triangle_TL: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4'), getPt('pt1')]),
            triangle_BL: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt1')]),
            triangle_TR: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt1')]),
            triangle_BR: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt2')]),
            triangle_split_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt1_50'), getPt('pt3'), getPt('pt2'), getPt('pt1')]),
            triangle_split_DOWN: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt3_50'), getPt('pt1')]),
            triangle_split_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4_50'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_split_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt2_50'), getPt('pt1')]),
            triangle_IN_V: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt4'), getPt('pt3'), getPt('pt1')]),
            triangle_IN_H: () => new THREE.Shape([getPt('pt1'), getPt('pt3'), getPt('pt2'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_IN_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt1_75'), getPt('center'), getPt('pt1_25'), getPt('pt1'), getPt('pt4')]),
            triangle_neg_IN_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt3_25'), getPt('center'), getPt('pt3_75'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_IN_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt4_25'), getPt('center'), getPt('pt4_75'), getPt('pt1')]),
            triangle_neg_IN_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt2_25'), getPt('center'), getPt('pt2_75'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_DOWN: () => new THREE.Shape([getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('center'), getPt('pt1'), getPt('pt4')]),
            triangle_neg_UP: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('center'), getPt('pt4'), getPt('pt1')]),
            triangle_neg_RIGHT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('center'), getPt('pt1')]),
            triangle_neg_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('center'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            triangle_bottom_LEFT: () => new THREE.Shape([getPt('pt4_75'), getPt('pt1_50'), getPt('pt3_50'), getPt('pt4_25'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt1'), getPt('pt4_75')]),
            triangle_bottom_DOWN: () => new THREE.Shape([getPt('pt3_75'), getPt('pt4_50'), getPt('pt2_50'), getPt('pt3_25'), getPt('pt3'), getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt3_75')]),
            triangle_bottom_RIGHT: () => new THREE.Shape([getPt('pt2_25'), getPt('pt1_50'), getPt('pt3_50'), getPt('pt2_75'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt2'), getPt('pt2_25')]),
            triangle_bottom_UP: () => new THREE.Shape([getPt('pt1_25'), getPt('pt4_50'), getPt('pt2_50'), getPt('pt1_75'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt1_25')]),
            triangle_edge_BOTTOM: () => new THREE.Shape([getPt('pt4_50'), getPt('pt3_50'), getPt('pt2_50'), getPt('pt3'), getPt('pt4'), getPt('pt4_50')]),
            triangle_edge_TOP: () => new THREE.Shape([getPt('pt4_50'), getPt('pt1_50'), getPt('pt2_50'), getPt('pt2'), getPt('pt1'), getPt('pt4_50')]),
            triangle_edge_LEFT: () => new THREE.Shape([getPt('pt4_50'), getPt('pt1_50'), getPt('pt1'), getPt('pt4'), getPt('pt3_50'), getPt('pt4_50')]),
            triangle_edge_RIGHT: () => new THREE.Shape([getPt('pt1_50'), getPt('pt2_50'), getPt('pt3_50'), getPt('pt3'), getPt('pt2'), getPt('pt1_50')]),
            
            // Rectangles
            Rect: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt1')]),
            longRect_V: () => new THREE.Shape([getPt('pt1_25'), getPt('pt1_75'), getPt('pt3_25'), getPt('pt3_75'), getPt('pt1_25')]),
            longRect_H: () => new THREE.Shape([getPt('pt4_75'), getPt('pt2_25'), getPt('pt2_75'), getPt('pt4_25'), getPt('pt4_75')]),
            rect_TL: () => new THREE.Shape([getPt('pt2'), getPt('pt3'), getPt('pt4'), getPt('pt4_50'), getPt('center'), getPt('pt1_50'), getPt('pt2')]),
            rect_TR: () => new THREE.Shape([getPt('pt1'), getPt('pt4'), getPt('pt3'), getPt('pt2_50'), getPt('center'), getPt('pt1_50'), getPt('pt1')]),
            rect_BL: () => new THREE.Shape([getPt('pt1'), getPt('pt2'), getPt('pt3'), getPt('pt3_50'), getPt('center'), getPt('pt4_50'), getPt('pt1')]),
            rect_BR: () => new THREE.Shape([getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt3_50'), getPt('center'), getPt('pt2_50'), getPt('pt2')]),
            rect_angled_TOP: () => new THREE.Shape([getPt('pt4_50'), getPt('pt4'), getPt('pt3'), getPt('pt2'), getPt('pt4_50')]),
            rect_angled_BOTTOM: () => new THREE.Shape([getPt('pt2_50'), getPt('pt2'), getPt('pt1'), getPt('pt4'), getPt('pt2_50')]),
            rect_angled_LEFT: () => new THREE.Shape([getPt('pt1'), getPt('pt3_50'), getPt('pt3'), getPt('pt2'), getPt('pt1')]),
            rect_angled_RIGHT: () => new THREE.Shape([getPt('pt1_50'), getPt('pt3'), getPt('pt4'), getPt('pt1'), getPt('pt1_50')]),
            
            // Diamond
            diamond: () => new THREE.Shape([getPt('pt1_50'), getPt('pt2'), getPt('pt3_50'), getPt('pt4'), getPt('pt1_50')]),
            
            // Ellipses
            ellipse: () => {
                const shape = new THREE.Shape();
                shape.absellipse(0, 0, 0.5, 0.5, 0, Math.PI * 2, false, 0);
                return shape;
            },
            ellipse_neg: () => {
                const shape = new THREE.Shape();
                shape.moveTo(-0.5, -0.5);
                shape.lineTo(0.5, -0.5);
                shape.lineTo(0.5, 0.5);
                shape.lineTo(-0.5, 0.5);
                shape.lineTo(-0.5, -0.5);
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_BL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_BR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_TL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_TR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false);
                shape.lineTo(0, 0);
                return shape;
            },
            ellipse_semi_UP: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI, 0, false);
                shape.lineTo(0, 0);
                shape.lineTo(-0.5, 0);
                return shape;
            },
            ellipse_semi_DOWN: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, 0, Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0.5, 0);
                return shape;
            },
            ellipse_semi_LEFT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, 0.5);
                return shape;
            },
            ellipse_semi_RIGHT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, -0.5);
                return shape;
            },
            ellipse_neg_BL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, Math.PI, 1.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_neg_BR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 1.5 * Math.PI, 2 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_neg_TL: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0.5 * Math.PI, Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_neg_TR: () => {
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0, 0.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_semi_neg_UP: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI, 0, false);
                shape.lineTo(0, 0);
                shape.lineTo(-0.5, 0);
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI, 0, false);
                hole.lineTo(0, 0);
                hole.lineTo(-0.35, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_semi_neg_DOWN: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, 0, Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0.5, 0);
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, 0, Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0.35, 0);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_semi_neg_LEFT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, 0.5);
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI/2, 1.5*Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, 0.35);
                shape.holes.push(hole);
                return shape;
            },
            ellipse_semi_neg_RIGHT: () => {
                const shape = new THREE.Shape();
                shape.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, -0.5);
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, -Math.PI/2, Math.PI/2, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, -0.35);
                shape.holes.push(hole);
                return shape;
            },
            
            // Refractive sphere shapes
            sphere_full: () => new THREE.SphereGeometry(0.5, 32, 32),
            sphere_small: () => new THREE.SphereGeometry(0.3, 24, 24),
            sphere_large: () => new THREE.SphereGeometry(0.7, 48, 48),
            sphere_rough: () => new THREE.SphereGeometry(0.5, 16, 16),
            sphere_smooth: () => new THREE.SphereGeometry(0.5, 64, 64),
            sphere_water: () => new THREE.SphereGeometry(0.5, 48, 48),
            sphere_glass: () => new THREE.SphereGeometry(0.5, 32, 32),
            sphere_bubble: () => new THREE.SphereGeometry(0.4, 24, 24)
        };
    }

    generateShape(shapeName) {
        const generator = this.shapeGenerators[shapeName];
        return generator ? generator() : null;
    }

    getAvailableShapes(enabledShapes) {
        const allShapeNames = [
            'triangle_UP', 'triangle_DOWN', 'triangle_LEFT', 'triangle_RIGHT', 'triangle_TL', 'triangle_BL', 'triangle_TR', 'triangle_BR',
            'triangle_split_UP', 'triangle_split_DOWN', 'triangle_split_LEFT', 'triangle_split_RIGHT', 'triangle_IN_V', 'triangle_IN_H',
            'triangle_neg_IN_DOWN', 'triangle_neg_IN_UP', 'triangle_neg_IN_RIGHT', 'triangle_neg_IN_LEFT', 'triangle_neg_DOWN', 'triangle_neg_UP', 'triangle_neg_RIGHT', 'triangle_neg_LEFT',
            'triangle_bottom_LEFT', 'triangle_bottom_DOWN', 'triangle_bottom_RIGHT', 'triangle_bottom_UP',
            'triangle_edge_BOTTOM', 'triangle_edge_TOP', 'triangle_edge_LEFT', 'triangle_edge_RIGHT',
            'Rect', 'longRect_V', 'longRect_H', 'rect_TL', 'rect_TR', 'rect_BL', 'rect_BR', 'rect_angled_TOP', 'rect_angled_BOTTOM', 'rect_angled_LEFT', 'rect_angled_RIGHT',
            'diamond',
            'ellipse', 'ellipse_neg', 'ellipse_BL', 'ellipse_BR', 'ellipse_TL', 'ellipse_TR',
            'ellipse_semi_UP', 'ellipse_semi_DOWN', 'ellipse_semi_LEFT', 'ellipse_semi_RIGHT',
            'ellipse_neg_BL', 'ellipse_neg_BR', 'ellipse_neg_TL', 'ellipse_neg_TR',
            'ellipse_semi_neg_UP', 'ellipse_semi_neg_DOWN', 'ellipse_semi_neg_LEFT', 'ellipse_semi_neg_RIGHT',
            'sphere_full', 'sphere_small', 'sphere_large', 'sphere_rough', 'sphere_smooth', 'sphere_water', 'sphere_glass', 'sphere_bubble'
        ];
        
        const availableShapes = [];
        
        allShapeNames.forEach(shapeName => {
            const category = this.getShapeCategory(shapeName);
            if (enabledShapes[category]) {
                availableShapes.push(shapeName);
            }
        });
        
        return availableShapes;
    }

    getShapeCategory(shapeName) {
        if (shapeName.startsWith('triangle_')) return 'Triangles';
        if (shapeName.startsWith('rect_') || shapeName === 'Rect' || shapeName === 'longRect_V' || shapeName === 'longRect_H') return 'Rectangles';
        if (shapeName.startsWith('ellipse_')) return 'Ellipses';
        if (shapeName.startsWith('sphere_')) return 'Refractive Spheres';
        return 'Basic Shapes';
    }

    getAllShapeNames() {
        return Object.keys(this.shapeGenerators);
    }

    getShapeCategories() {
        return ['Basic Shapes', 'Triangles', 'Rectangles', 'Ellipses', 'Refractive Spheres'];
    }
} 