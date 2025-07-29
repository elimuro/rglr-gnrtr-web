import * as THREE from 'three';

export class ShapeGenerator {
    constructor() {
        this.shapeGenerators = this.createShapeGenerators();
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