import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { gsap } from 'gsap';

class RGLRGNRTR {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -200, window.innerWidth / 200,
            window.innerHeight / 200, window.innerHeight / -200,
            0.1, 1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        this.shapes = [];
        this.gridLines = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedShape = null;
        this.shapeControls = null;
        this.outlineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff, // Teal color
            linewidth: 4
        });
        this.outlineMesh = null;
        this.pulseTime = 0;
        this.init();
        this.setupGUI();
        this.createGrid();
        this.animate();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff); // White background
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.z = 10;
        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('click', (event) => this.onMouseClick(event), false);

        // Add click handler for GUI container to prevent event propagation
        const guiContainer = document.getElementById('gui-container');
        if (guiContainer) {
            guiContainer.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }

        // Initialize parameters
        this.params = {
            animation: false,
            animationType: 0,
            animationSpeed: 1,
            gridWidth: 10,
            gridHeight: 10,
            cellSize: 1,
            shapeColor: '#000000',
            backgroundColor: '#ffffff',
            showGrid: true,
            randomness: 0.5,
            compositionWidth: 10,
            compositionHeight: 10,
            enabledShapes: {
                'Basic Shapes': true,
                'Triangles': true,
                'Rectangles': true,
                'Ellipses': true
            },
            selectedShapeRotation: 0,
            selectedShapeScale: 1,
            selectedShapeColor: '#000000'
        };
    }

    setupGUI() {
        if (this.gui) this.gui.destroy();
        this.gui = new GUI({ container: document.getElementById('gui-container') });

        // Shape controls
        const shapeFolder = this.gui.addFolder('Shapes');
        shapeFolder.add(this.params, 'gridWidth', 1, 30, 1).name('Display Width').onChange(() => this.createGrid());
        shapeFolder.add(this.params, 'gridHeight', 1, 30, 1).name('Display Height').onChange(() => this.createGrid());
        shapeFolder.add(this.params, 'cellSize', 0.5, 2, 0.01).name('Cell Size').onChange(() => this.updateCellSize());
        shapeFolder.add(this.params, 'randomness', 0, 1, 0.01).name('Randomness').onChange(() => this.createGrid());
        
        // Composition controls
        const compositionFolder = this.gui.addFolder('Composition');
        compositionFolder.add(this.params, 'compositionWidth', 1, 30, 1).name('Composition Width').onChange(() => this.createGrid());
        compositionFolder.add(this.params, 'compositionHeight', 1, 30, 1).name('Composition Height').onChange(() => this.createGrid());
        compositionFolder.open();
        
        // Add shape selection controls
        const shapeSelectionFolder = shapeFolder.addFolder('Shape Selection');
        Object.keys(this.params.enabledShapes).forEach(shapeName => {
            shapeSelectionFolder.add(this.params.enabledShapes, shapeName).onChange(() => this.createGrid());
        });
        shapeSelectionFolder.open();
        
        shapeFolder.open();

        // Grid controls
        const gridFolder = this.gui.addFolder('Grid');
        gridFolder.add(this.params, 'showGrid').name('Show Grid Lines').onChange(() => this.updateGridLines());
        gridFolder.open();

        // Color controls
        const colorFolder = this.gui.addFolder('Colors');
        colorFolder.addColor(this.params, 'shapeColor').name('Shape Color').onChange(() => this.createGrid());
        colorFolder.addColor(this.params, 'backgroundColor').name('Background').onChange((v) => {
            this.renderer.setClearColor(new THREE.Color(v));
            this.createGrid();
        });
        colorFolder.open();

        // Selected shape controls
        const selectedShapeFolder = this.gui.addFolder('Selected Shape');
        selectedShapeFolder.add(this.params, 'selectedShapeRotation', 0, 360, 1).name('Rotation').onChange((v) => {
            if (this.selectedShape) {
                this.selectedShape.rotation.z = v * Math.PI / 180;
            }
        });
        selectedShapeFolder.add(this.params, 'selectedShapeScale', 0.25, 2, 0.25).name('Scale').onChange((v) => {
            if (this.selectedShape) {
                this.selectedShape.scale.set(v, v, 1);
            }
        });
        selectedShapeFolder.addColor(this.params, 'selectedShapeColor').name('Color').onChange((v) => {
            if (this.selectedShape) {
                if (this.selectedShape.material) {
                    this.selectedShape.material.color.set(v);
                } else if (this.selectedShape.children) {
                    this.selectedShape.children.forEach(child => {
                        if (child.material && child.material.color) {
                            if (child.material.color.getHexString() !== 'ffffff') {
                                child.material.color.set(v);
                            }
                        }
                    });
                }
            }
        });
        selectedShapeFolder.close();
    }

    createGrid() {
        // Remove old shapes
        for (const mesh of this.shapes) {
            this.scene.remove(mesh);
        }
        this.shapes = [];
        // Remove old grid lines
        if (this.gridLines) {
            for (const line of this.gridLines) {
                this.scene.remove(line);
            }
        }
        this.gridLines = [];

        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        const halfCompW = this.params.compositionWidth / 2;
        const halfCompH = this.params.compositionHeight / 2;
        const black = 0x000000;
        const material = new THREE.MeshBasicMaterial({ color: this.params.shapeColor, side: THREE.DoubleSide });
        const white = 0xffffff;

        // Helper: map OpenFrameworks ptX names to cell coordinates
        function getPt(name) {
            const c = 1; // Use fixed size of 1 for shape generation
            const map = {
                pt1: [-c/2, -c/2], pt1_25: [-c/2 + 0.25*c, -c/2], pt1_50: [-c/2 + 0.5*c, -c/2], pt1_75: [-c/2 + 0.75*c, -c/2],
                pt2: [c/2, -c/2], pt2_25: [c/2, -c/2 + 0.25*c], pt2_50: [c/2, -c/2 + 0.5*c], pt2_75: [c/2, -c/2 + 0.75*c],
                pt3: [c/2, c/2], pt3_25: [c/2 - 0.25*c, c/2], pt3_50: [c/2 - 0.5*c, c/2], pt3_75: [c/2 - 0.75*c, c/2],
                pt4: [-c/2, c/2], pt4_25: [-c/2, c/2 - 0.25*c], pt4_50: [-c/2, c/2 - 0.5*c], pt4_75: [-c/2, c/2 - 0.75*c],
                center: [0, 0],
            };
            return new THREE.Vector2(...map[name]);
        }

        // Complete set of shape generators for ofApp shapes
        const shapeGenerators = {
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
            // Ellipses (approximate with circle or ellipse)
            ellipse: () => {
                const shape = new THREE.Shape();
                shape.absellipse(0, 0, 0.5, 0.5, 0, Math.PI * 2, false, 0);
                return shape;
            },
            // Negative ellipse (black square with white circle cutout)
            ellipse_neg: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.PlaneGeometry(1, 1),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.CircleGeometry(0.5, 64),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            // Quarter ellipses (solid, each corner)
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
            // Semi-ellipses (solid, each direction)
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
            // Negative quarter ellipses (black with white cutout, each corner)
            ellipse_neg_BL: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false); s.lineTo(0, 0); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.35, Math.PI, 1.5 * Math.PI, false); s.lineTo(0, 0); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            ellipse_neg_BR: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false); s.lineTo(0, 0); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.35, 1.5 * Math.PI, 2 * Math.PI, false); s.lineTo(0, 0); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            ellipse_neg_TL: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false); s.lineTo(0, 0); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.35, 0.5 * Math.PI, Math.PI, false); s.lineTo(0, 0); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            ellipse_neg_TR: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false); s.lineTo(0, 0); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.absarc(0, 0, 0.35, 0, 0.5 * Math.PI, false); s.lineTo(0, 0); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            // Negative semi-ellipses (black with white cutout, each direction)
            ellipse_semi_neg_UP: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.5, Math.PI, 0, false); s.lineTo(0, 0); s.lineTo(-0.5, 0); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.35, Math.PI, 0, false); s.lineTo(0, 0); s.lineTo(-0.35, 0); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            ellipse_semi_neg_DOWN: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.5, 0, Math.PI, false); s.lineTo(0, 0); s.lineTo(0.5, 0); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.35, 0, Math.PI, false); s.lineTo(0, 0); s.lineTo(0.35, 0); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            ellipse_semi_neg_LEFT: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false); s.lineTo(0, 0); s.lineTo(0, 0.5); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.35, Math.PI/2, 1.5*Math.PI, false); s.lineTo(0, 0); s.lineTo(0, 0.35); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
            ellipse_semi_neg_RIGHT: () => {
                const group = new THREE.Group();
                const black = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false); s.lineTo(0, 0); s.lineTo(0, -0.5); return s; })()),
                    material.clone()
                );
                const white = new THREE.Mesh(
                    new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.absarc(0, 0, 0.35, -Math.PI/2, Math.PI/2, false); s.lineTo(0, 0); s.lineTo(0, -0.35); return s; })()),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
                );
                group.add(black);
                group.add(white);
                return group;
            },
        };

        // List of shape names to use (from ofApp)
        const ofAppShapes = Object.keys(shapeGenerators);

        // Create the composition first
        const composition = [];
        for (let x = 0; x < this.params.compositionWidth; x++) {
            for (let y = 0; y < this.params.compositionHeight; y++) {
                let shapeName;
                const enabledShapes = ofAppShapes.filter(shapeName => {
                    const category = this.getShapeCategory(shapeName);
                    return this.params.enabledShapes[category];
                });
                
                if (enabledShapes.length === 0) {
                    shapeName = 'Rect'; // Default shape
                } else {
                    const useRandomShape = Math.random() < this.params.randomness;
                    shapeName = useRandomShape ? 
                        enabledShapes[Math.floor(Math.random() * enabledShapes.length)] :
                        enabledShapes[0];
                }
                composition.push(shapeName);
            }
        }

        // Now create the display grid
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                let mesh;
                // Map display coordinates to composition coordinates
                const compX = Math.floor((x / gridWidth) * this.params.compositionWidth);
                const compY = Math.floor((y / gridHeight) * this.params.compositionHeight);
                const shapeIndex = compY * this.params.compositionWidth + compX;
                const shapeName = composition[shapeIndex];

                if (shapeGenerators[shapeName]) {
                    const shapeObj = shapeGenerators[shapeName]();
                    if (shapeObj instanceof THREE.Group) {
                        mesh = shapeObj;
                        mesh.traverse((child) => {
                            if (child.material && child.material.color) {
                                if (child.material.color.getHexString() !== 'ffffff') {
                                    child.material.color.set(this.params.shapeColor);
                                }
                            }
                        });
                    } else if (shapeObj instanceof THREE.Shape) {
                        mesh = new THREE.Mesh(
                            new THREE.ShapeGeometry(shapeObj),
                            material.clone()
                        );
                    } else {
                        mesh = new THREE.Mesh(
                            new THREE.PlaneGeometry(1, 1),
                            material.clone()
                        );
                    }
                } else {
                    mesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(1, 1),
                        material.clone()
                    );
                }

                // Position the shape
                mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                
                // Scale the shape
                mesh.scale.set(cellSize, cellSize, 1);

                this.scene.add(mesh);
                this.shapes.push(mesh);
            }
        }

        // Draw red grid lines for visual debugging if enabled
        if (this.params.showGrid) {
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
            // Vertical lines
            for (let i = 0; i <= gridWidth; i++) {
                const x = (i - halfGridW) * cellSize;
                const points = [
                    new THREE.Vector3(x, -halfGridH * cellSize, 1),
                    new THREE.Vector3(x, halfGridH * cellSize, 1)
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.scene.add(line);
                this.gridLines.push(line);
            }
            // Horizontal lines
            for (let j = 0; j <= gridHeight; j++) {
                const y = (j - halfGridH) * cellSize;
                const points = [
                    new THREE.Vector3(-halfGridW * cellSize, y, 1),
                    new THREE.Vector3(halfGridW * cellSize, y, 1)
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.scene.add(line);
                this.gridLines.push(line);
            }
        }

        // At the end of createGrid, call updateGridLines to ensure grid lines are correct
        this.updateGridLines();
        // After creating grid, update cell size to ensure positions/scales are correct
        this.updateCellSize();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.left = window.innerWidth / -200;
        this.camera.right = window.innerWidth / 200;
        this.camera.top = window.innerHeight / 200;
        this.camera.bottom = window.innerHeight / -200;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.createGrid();
    }

    onMouseMove(event) {
        // Check if mouse is over GUI
        const guiElement = document.getElementById('gui-container');
        const rect = guiElement.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onMouseClick(event) {
        // Check if click is on GUI
        const guiElement = document.getElementById('gui-container');
        const rect = guiElement.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
            return;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.shapes);
        
        if (intersects.length > 0) {
            const clickedShape = intersects[0].object;
            
            // If clicking the same shape, deselect it
            if (this.selectedShape === clickedShape) {
                this.selectedShape = null;
                this.params.selectedShapeRotation = 0;
                this.params.selectedShapeScale = 1;
                this.params.selectedShapeColor = this.params.shapeColor;
            } else {
                this.selectedShape = clickedShape;
                
                // Update GUI parameters to match selected shape
                this.params.selectedShapeRotation = (this.selectedShape.rotation.z * 180 / Math.PI) % 360;
                this.params.selectedShapeScale = this.selectedShape.scale.x;
                
                // Get the current color
                if (this.selectedShape.material && this.selectedShape.material.color) {
                    this.params.selectedShapeColor = '#' + this.selectedShape.material.color.getHexString();
                } else if (this.selectedShape.children && this.selectedShape.children[0].material) {
                    this.params.selectedShapeColor = '#' + this.selectedShape.children[0].material.color.getHexString();
                }
            }
        } else {
            // Clicked empty space, deselect
            this.selectedShape = null;
            this.params.selectedShapeRotation = 0;
            this.params.selectedShapeScale = 1;
            this.params.selectedShapeColor = this.params.shapeColor;
        }
    }

    updateOutline() {
        // Remove existing outline if any
        if (this.outlineMesh) {
            this.scene.remove(this.outlineMesh);
            this.outlineMesh = null;
        }

        // Create new outline for selected shape
        if (this.selectedShape) {
            let geometry;
            if (this.selectedShape.geometry) {
                geometry = this.selectedShape.geometry;
            } else if (this.selectedShape.children && this.selectedShape.children[0].geometry) {
                geometry = this.selectedShape.children[0].geometry;
            }

            if (geometry) {
                // Create edges geometry for the outline
                const edges = new THREE.EdgesGeometry(geometry);
                this.outlineMesh = new THREE.LineSegments(edges, this.outlineMaterial);
                
                // Match the position and rotation of the selected shape
                this.outlineMesh.position.copy(this.selectedShape.position);
                this.outlineMesh.rotation.copy(this.selectedShape.rotation);
                this.outlineMesh.scale.copy(this.selectedShape.scale);
                
                // Reset pulse animation
                this.pulseTime = 0;
                
                // Add to scene
                this.scene.add(this.outlineMesh);
            }
        }
    }

    // Update the helper method to determine shape category
    getShapeCategory(shapeName) {
        if (shapeName.startsWith('triangle_')) return 'Triangles';
        if (shapeName.startsWith('rect_') || shapeName === 'Rect' || shapeName === 'longRect_V' || shapeName === 'longRect_H') return 'Rectangles';
        if (shapeName.startsWith('ellipse_')) return 'Ellipses';
        return 'Basic Shapes';
    }

    updateGridLines() {
        // Remove old grid lines
        if (this.gridLines) {
            for (const line of this.gridLines) {
                this.scene.remove(line);
            }
        }
        this.gridLines = [];
        if (!this.params.showGrid) return;
        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        // Vertical lines
        for (let i = 0; i <= gridWidth; i++) {
            const x = (i - halfGridW) * cellSize;
            const points = [
                new THREE.Vector3(x, -halfGridH * cellSize, 1),
                new THREE.Vector3(x, halfGridH * cellSize, 1)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
            this.gridLines.push(line);
        }
        // Horizontal lines
        for (let j = 0; j <= gridHeight; j++) {
            const y = (j - halfGridH) * cellSize;
            const points = [
                new THREE.Vector3(-halfGridW * cellSize, y, 1),
                new THREE.Vector3(halfGridW * cellSize, y, 1)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
            this.gridLines.push(line);
        }
    }

    updateCellSize() {
        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        // Update shape positions and scales
        let i = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[i];
                if (mesh) {
                    mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                    mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                    mesh.scale.set(cellSize, cellSize, 1);
                }
                i++;
            }
        }
        // Update grid lines
        this.updateGridLines();
    }
}

// Initialize the application
new RGLRGNRTR(); 