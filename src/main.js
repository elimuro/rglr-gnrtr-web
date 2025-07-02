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
        this.shapeControls = null;
        this.pulseTime = 0;
        this.animationTime = 0;
        this.composition = []; // Store the composition for animation
        this.init();
        this.setupGUI();
        this.createGrid();
        this.animate();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.z = 10;
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Initialize parameters
        this.params = {
            animationType: 0,
            animationSpeed: 0.25,
            enableShapeCycling: false, // Toggle for sine wave shape cycling
            enableSizeAnimation: false, // Toggle for size/movement/rotation animations
            // Movement animation parameters
            movementAmplitude: 0.1, // Movement animation intensity
            movementFrequency: 0.5, // Movement animation frequency
            // Rotation animation parameters
            rotationAmplitude: 0.5, // Rotation animation intensity
            rotationFrequency: 0.3, // Rotation animation frequency
            // Scale animation parameters
            scaleAmplitude: 0.2, // Scale animation intensity
            scaleFrequency: 0.4, // Scale animation frequency
            gridWidth: 8,
            gridHeight: 8,
            cellSize: 1,
            shapeColor: '#ffffff',
            backgroundColor: '#000000',
            showGrid: false,
            randomness: 1,
            compositionWidth: 30,
            compositionHeight: 30,
            enabledShapes: {
                'Basic Shapes': true,
                'Triangles': true,
                'Rectangles': true,
                'Ellipses': true
            }
        };
        
        // Apply the background color from params
        this.renderer.setClearColor(new THREE.Color(this.params.backgroundColor));
    }

    setupGUI() {
        if (this.gui) this.gui.destroy();
        this.gui = new GUI({ container: document.getElementById('gui-container') });
        
        // Debug: Check if GUI container exists
        const container = document.getElementById('gui-container');
        if (!container) {
            console.error('GUI container not found!');
            return;
        }
        console.log('GUI setup started');

        // Shape controls
        const shapeFolder = this.gui.addFolder('Shapes');
        shapeFolder.add(this.params, 'gridWidth', 1, 30, 1).name('Display Width').onChange(() => {
            this.createGrid();
            // Reset animation time when grid changes to avoid visual jumps
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        shapeFolder.add(this.params, 'gridHeight', 1, 30, 1).name('Display Height').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        shapeFolder.add(this.params, 'cellSize', 0.5, 2, 0.01).name('Cell Size').onChange(() => this.updateCellSize());
        shapeFolder.add(this.params, 'randomness', 0, 1, 0.01).name('Randomness').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        
        // Composition controls
        const compositionFolder = this.gui.addFolder('Composition');
        compositionFolder.add(this.params, 'compositionWidth', 1, 30, 1).name('Composition Width').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        compositionFolder.add(this.params, 'compositionHeight', 1, 30, 1).name('Composition Height').onChange(() => {
            this.createGrid();
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                this.animationTime = 0;
            }
        });
        compositionFolder.open();
        
        // Add shape selection controls
        const shapeSelectionFolder = shapeFolder.addFolder('Shape Selection');
        Object.keys(this.params.enabledShapes).forEach(shapeName => {
            shapeSelectionFolder.add(this.params.enabledShapes, shapeName).onChange(() => {
                // Recreate composition when shape categories change
                this.createGrid();
                if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                    this.animationTime = 0;
                }
            });
        });
        shapeSelectionFolder.open();
        
        shapeFolder.open();

        // Grid controls
        const gridFolder = this.gui.addFolder('Grid');
        gridFolder.add(this.params, 'showGrid').name('Show Grid Lines').onChange(() => this.updateGridLines());
        gridFolder.open();

        // Color controls
        const colorFolder = this.gui.addFolder('Colors');
        colorFolder.addColor(this.params, 'shapeColor').name('Shape Color').onChange(() => {
            // Update color immediately for animated shapes
            if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
                // Color will be updated in next animation frame
            } else {
                this.createGrid();
            }
        });
        colorFolder.addColor(this.params, 'backgroundColor').name('Background').onChange((v) => {
            this.renderer.setClearColor(new THREE.Color(v));
            this.createGrid();
        });
        colorFolder.open();

        // Animation controls
        const animationFolder = this.gui.addFolder('Animation');
        animationFolder.open();
        
        // Main controls
        animationFolder.add(this.params, 'animationSpeed', 0.01, 2, 0.01).name('Global Speed');
        
        // Animation type selector with dynamic parameter visibility
        const animationTypeController = animationFolder.add(this.params, 'animationType', 0, 3, 1).name('Animation Type');
        
        // Effect toggles
        animationFolder.add(this.params, 'enableShapeCycling').name('Shape Cycling').onChange(() => {
            this.animationTime = 0;
        });
        animationFolder.add(this.params, 'enableSizeAnimation').name('Size/Movement').onChange(() => {
            if (!this.params.enableSizeAnimation) {
                this.updateCellSize();
            }
        });
        
        // Movement parameters
        const movementAmpController = animationFolder.add(this.params, 'movementAmplitude', 0.01, 0.5, 0.01).name('Movement Amp');
        const movementFreqController = animationFolder.add(this.params, 'movementFrequency', 0.1, 2, 0.1).name('Movement Freq');
        
        // Rotation parameters
        const rotationAmpController = animationFolder.add(this.params, 'rotationAmplitude', 0.01, 2, 0.01).name('Rotation Amp');
        const rotationFreqController = animationFolder.add(this.params, 'rotationFrequency', 0.1, 2, 0.1).name('Rotation Freq');
        
        // Scale parameters
        const scaleAmpController = animationFolder.add(this.params, 'scaleAmplitude', 0.01, 1, 0.01).name('Scale Amp');
        const scaleFreqController = animationFolder.add(this.params, 'scaleFrequency', 0.1, 2, 0.1).name('Scale Freq');
        
        // Function to update parameter visibility based on animation type
        const updateParameterVisibility = () => {
            const animationType = this.params.animationType;
            
            // Movement parameters (visible for Movement and Combined)
            const showMovement = animationType === 0 || animationType === 3;
            if (movementAmpController.domElement) {
                const movementAmpRow = movementAmpController.domElement.parentElement.parentElement;
                movementAmpRow.style.display = showMovement ? 'flex' : 'none';
            }
            if (movementFreqController.domElement) {
                const movementFreqRow = movementFreqController.domElement.parentElement.parentElement;
                movementFreqRow.style.display = showMovement ? 'flex' : 'none';
            }
            
            // Rotation parameters (visible for Rotation and Combined)
            const showRotation = animationType === 1 || animationType === 3;
            if (rotationAmpController.domElement) {
                const rotationAmpRow = rotationAmpController.domElement.parentElement.parentElement;
                rotationAmpRow.style.display = showRotation ? 'flex' : 'none';
            }
            if (rotationFreqController.domElement) {
                const rotationFreqRow = rotationFreqController.domElement.parentElement.parentElement;
                rotationFreqRow.style.display = showRotation ? 'flex' : 'none';
            }
            
            // Scale parameters (visible for Scale and Combined)
            const showScale = animationType === 2 || animationType === 3;
            if (scaleAmpController.domElement) {
                const scaleAmpRow = scaleAmpController.domElement.parentElement.parentElement;
                scaleAmpRow.style.display = showScale ? 'flex' : 'none';
            }
            if (scaleFreqController.domElement) {
                const scaleFreqRow = scaleFreqController.domElement.parentElement.parentElement;
                scaleFreqRow.style.display = showScale ? 'flex' : 'none';
            }
        };
        
        // Set up the change listener for animation type
        animationTypeController.onChange(() => {
            updateParameterVisibility();
        });
        
        // Initialize visibility
        updateParameterVisibility();
        
        console.log('GUI setup completed');
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
            // Negative ellipse (black square with circle cutout)
            ellipse_neg: () => {
                const shape = new THREE.Shape();
                // Create outer square boundary
                shape.moveTo(-0.5, -0.5);
                shape.lineTo(0.5, -0.5);
                shape.lineTo(0.5, 0.5);
                shape.lineTo(-0.5, 0.5);
                shape.lineTo(-0.5, -0.5);
                
                // Create inner circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
                shape.holes.push(hole);
                
                return shape;
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
            // Negative quarter ellipses (black with circle cutout, each corner)
            ellipse_neg_BL: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, Math.PI, 1.5 * Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, Math.PI, 1.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_neg_BR: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 1.5 * Math.PI, 2 * Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 1.5 * Math.PI, 2 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_neg_TL: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0.5 * Math.PI, Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0.5 * Math.PI, Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_neg_TR: () => {
                const shape = new THREE.Shape();
                // Create outer quarter circle boundary
                shape.moveTo(0, 0);
                shape.absarc(0, 0, 0.5, 0, 0.5 * Math.PI, false);
                shape.lineTo(0, 0);
                
                // Create inner quarter circle hole
                const hole = new THREE.Path();
                hole.moveTo(0, 0);
                hole.absarc(0, 0, 0.35, 0, 0.5 * Math.PI, false);
                hole.lineTo(0, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            // Negative semi-ellipses (black with circle cutout, each direction)
            ellipse_semi_neg_UP: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, Math.PI, 0, false);
                shape.lineTo(0, 0);
                shape.lineTo(-0.5, 0);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI, 0, false);
                hole.lineTo(0, 0);
                hole.lineTo(-0.35, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_DOWN: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, 0, Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0.5, 0);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, 0, Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0.35, 0);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_LEFT: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, Math.PI/2, 1.5*Math.PI, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, 0.5);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, Math.PI/2, 1.5*Math.PI, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, 0.35);
                shape.holes.push(hole);
                
                return shape;
            },
            ellipse_semi_neg_RIGHT: () => {
                const shape = new THREE.Shape();
                // Create outer semi-circle boundary
                shape.absarc(0, 0, 0.5, -Math.PI/2, Math.PI/2, false);
                shape.lineTo(0, 0);
                shape.lineTo(0, -0.5);
                
                // Create inner semi-circle hole
                const hole = new THREE.Path();
                hole.absarc(0, 0, 0.35, -Math.PI/2, Math.PI/2, false);
                hole.lineTo(0, 0);
                hole.lineTo(0, -0.35);
                shape.holes.push(hole);
                
                return shape;
            },
        };

        // List of shape names to use (from ofApp)
        const ofAppShapes = Object.keys(shapeGenerators);

        // Create the composition first
        this.composition = [];
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
                this.composition.push(shapeName);
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
                const shapeName = this.composition[shapeIndex] || 'Rect'; // Fallback to Rect if undefined

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
        
        // Update animation time
        if (this.params.enableShapeCycling || this.params.enableSizeAnimation) {
            this.animationTime += this.clock.getDelta() * this.params.animationSpeed;
            
            // Apply animations to shapes
            this.animateShapes();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    animateShapes() {
        const gridWidth = this.params.gridWidth;
        const gridHeight = this.params.gridHeight;
        const cellSize = this.params.cellSize;
        const halfGridW = gridWidth / 2;
        const halfGridH = gridHeight / 2;
        
        // Get available shapes based on enabled categories
        const availableShapes = this.getAvailableShapes();
        if (availableShapes.length === 0) return;
        
        // Update material color for all shapes
        const material = new THREE.MeshBasicMaterial({ 
            color: this.params.shapeColor, 
            side: THREE.DoubleSide 
        });
        
        let shapeIndex = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const mesh = this.shapes[shapeIndex];
                if (mesh) {
                    // Update material color
                    mesh.material = material;
                    
                    // Shape cycling (independent of size/movement animations)
                    if (this.params.enableShapeCycling) {
                        this.cycleShapeInCell(mesh, x, y, availableShapes);
                    }
                    
                    // Size/movement animations (independent of shape cycling)
                    if (this.params.enableSizeAnimation) {
                        // Apply different animation types
                        switch (this.params.animationType) {
                            case 0: // Movement
                                const xOffset = Math.sin(this.animationTime * this.params.movementFrequency + x * 0.5) * this.params.movementAmplitude * cellSize;
                                const yOffset = Math.cos(this.animationTime * this.params.movementFrequency + y * 0.5) * this.params.movementAmplitude * cellSize;
                                mesh.position.x = (x - halfGridW + 0.5) * cellSize + xOffset;
                                mesh.position.y = (y - halfGridH + 0.5) * cellSize + yOffset;
                                break;
                            case 1: // Rotation
                                mesh.rotation.z = Math.sin(this.animationTime * this.params.rotationFrequency + x * 0.3 + y * 0.3) * this.params.rotationAmplitude;
                                break;
                            case 2: // Scale
                                const scale = 1 + Math.sin(this.animationTime * this.params.scaleFrequency + x * 0.5 + y * 0.5) * this.params.scaleAmplitude;
                                mesh.scale.set(cellSize * scale, cellSize * scale, 1);
                                break;
                            case 3: // Combined effects
                                const combinedXOffset = Math.sin(this.animationTime * this.params.movementFrequency + x * 0.5) * this.params.movementAmplitude * cellSize;
                                const combinedYOffset = Math.cos(this.animationTime * this.params.movementFrequency + y * 0.5) * this.params.movementAmplitude * cellSize;
                                const combinedRotation = Math.sin(this.animationTime * this.params.rotationFrequency + x * 0.3 + y * 0.3) * this.params.rotationAmplitude;
                                const combinedScale = 1 + Math.sin(this.animationTime * this.params.scaleFrequency + x * 0.5 + y * 0.5) * this.params.scaleAmplitude;
                                mesh.position.x = (x - halfGridW + 0.5) * cellSize + combinedXOffset;
                                mesh.position.y = (y - halfGridH + 0.5) * cellSize + combinedYOffset;
                                mesh.rotation.z = combinedRotation;
                                mesh.scale.set(cellSize * combinedScale, cellSize * combinedScale, 1);
                                break;
                        }
                    } else {
                        // Reset to original positions when size animation is disabled
                        mesh.position.x = (x - halfGridW + 0.5) * cellSize;
                        mesh.position.y = (y - halfGridH + 0.5) * cellSize;
                        mesh.rotation.z = 0;
                        mesh.scale.set(cellSize, cellSize, 1);
                    }
                }
                shapeIndex++;
            }
        }
    }
    
    cycleShapeInCell(mesh, x, y, availableShapes) {
        let newShapeName;
        
        // For shape cycling, we want to cycle through available shapes over time
        // Use a combination of position and time to create unique cycling patterns
        const cellSeed = x * 1000 + y * 100;
        const timeOffset = this.animationTime * this.params.animationSpeed;
        const shapeIndex = Math.floor(
            Math.abs(Math.sin(timeOffset + cellSeed * 0.1)) * availableShapes.length
        ) % availableShapes.length;
        
        newShapeName = availableShapes[shapeIndex];
        
        // Only update if the shape has changed
        if (mesh.userData.currentShape !== newShapeName) {
            this.updateMeshShape(mesh, newShapeName);
            mesh.userData.currentShape = newShapeName;
        }
    }
    
    updateMeshShape(mesh, shapeName) {
        const material = new THREE.MeshBasicMaterial({ 
            color: this.params.shapeColor, 
            side: THREE.DoubleSide 
        });
        
        // Use the same shape generation system as createGrid
        const shapeObj = this.generateShape(shapeName);
        
        if (shapeObj) {
            let newGeometry;
            
            if (shapeObj instanceof THREE.Group) {
                // For group shapes, use the first child's geometry
                newGeometry = shapeObj.children[0].geometry;
            } else if (shapeObj instanceof THREE.Shape) {
                newGeometry = new THREE.ShapeGeometry(shapeObj);
            } else {
                // Fallback to plane geometry
                newGeometry = new THREE.PlaneGeometry(1, 1);
            }
            
            // Update the mesh geometry
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            mesh.geometry = newGeometry;
            mesh.material = material;
        } else {
            // Fallback to plane geometry if shape generation fails
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            mesh.geometry = new THREE.PlaneGeometry(1, 1);
            mesh.material = material;
        }
    }
    
    generateShape(shapeName) {
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
            }
        };
        
        return shapeGenerators[shapeName] ? shapeGenerators[shapeName]() : null;
    }
    
    getAvailableShapes() {
        // Get all available shape names from the generateShape function
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
            'ellipse_semi_neg_UP', 'ellipse_semi_neg_DOWN', 'ellipse_semi_neg_LEFT', 'ellipse_semi_neg_RIGHT'
        ];
        
        const availableShapes = [];
        
        allShapeNames.forEach(shapeName => {
            const category = this.getShapeCategory(shapeName);
            if (this.params.enabledShapes[category]) {
                availableShapes.push(shapeName);
            }
        });
        
        return availableShapes;
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
                    // Reset rotation when not animating
                    if (!this.params.enableSizeAnimation) {
                        mesh.rotation.z = 0;
                    }
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