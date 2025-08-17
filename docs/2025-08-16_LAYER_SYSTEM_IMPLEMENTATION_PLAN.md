# Layer System Implementation Plan

## Overview

This document outlines the implementation plan for a comprehensive layer system that will transform the current grid-based animation into a composable multi-layer architecture. The system will support various layer types (grid, p5, video, shader, particle, image) with independent controls and the ability to share parameters through the existing MIDI/audio mapping system.

## Goals

- Enable multiple visual layers that can be positioned in front of or behind each other
- Maintain compatibility with existing grid-based animation
- Integrate with current MIDI and audio mapping systems
- Support 3D camera system for isometric viewing (Phase 5)
- Provide flexible, extensible architecture for new layer types

## Non-Goals (for v1)

- Node-based visual programming
- Advanced layer effects beyond basic blending
- Real-time collaboration features

## Architecture Overview

### Core Components

#### 1. LayerManager (`src/modules/LayerManager.js`)
- Manages layer ordering and stacking
- Coordinates layer rendering sequence
- Handles layer visibility and performance
- Provides unified parameter interface

#### 2. LayerBase (`src/modules/LayerBase.js`)
- Abstract base class for all layers
- Defines common layer interface
- Handles layer lifecycle and state management

#### 3. Layer Types
- **GridLayer**: Refactored from existing GridManager
- **P5Layer**: p5.js integration with parameter exposure
- **ShaderLayer**: GLSL shader editor with real-time compilation
- **VideoLayer**: Video playback with effects and controls
- **ParticleLayer**: GPU-accelerated particle systems
- **ImageLayer**: Image display with transformations

### Rendering Pipeline

#### Current (Single Layer)
```
Three.js Scene → GridManager → Renderer
```

#### New (Multi-Layer)
```
LayerManager → Layer1 → Layer2 → ... → LayerN → Compositor → Renderer
```

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2) ✅ COMPLETED
**Goal**: Establish the layer system foundation

#### Week 1: Layer Base Classes ✅ COMPLETED
- [x] Create `LayerBase` abstract class
- [x] Implement `LayerManager` with basic layer registry
- [x] Add layer ordering and visibility controls
- [x] Create layer state management structure

#### Week 2: Grid Layer Architecture Decision ✅ COMPLETED
- [x] **Architecture Decision**: Keep `GridManager` as foundational element instead of wrapping in `GridLayer`
- [x] Maintain all existing grid parameters and functionality
- [x] Test that layer system doesn't break current animations
- [x] **Success criteria**: Grid animation works exactly as before

**Deliverables**: ✅ COMPLETED
- [x] `src/modules/LayerManager.js`
- [x] `src/modules/layers/LayerBase.js`
- [x] `src/ui/LayerPanel.js`
- [x] Basic layer panel UI integrated with drawer system

### Phase 2: P5 Layer Integration (Weeks 3-4) ✅ MOSTLY COMPLETED
**Goal**: Implement p5.js layer based on existing plan

#### Week 3: P5 Layer Core ✅ COMPLETED
- [x] Create `P5Layer` class with canvas overlay
- [x] Implement `p5Param` system for parameter exposure
- [x] Add professional code editor with Monaco Editor and syntax highlighting
- [x] Integrate with layer parameter routing
- [x] Fix z-index layering (P5 layer under UI, over 3D scene)

#### Week 4: P5 Layer UI and Integration ✅ MOSTLY COMPLETED
- [x] Add p5-specific controls to layer panel
- [x] Implement parameter mapping to MIDI/audio
- [x] Add P5 Code Editor button to transport bar
- [x] **Success criteria**: Can create p5 sketch and map parameters to MIDI ✅ ACHIEVED
- [ ] Add sketch persistence in scenes/presets (PENDING)

**Deliverables**: ✅ COMPLETED
- [x] `src/modules/layers/P5Layer.js`
- [x] `src/ui/P5CodeEditor.js` - Professional code editor with Monaco Editor
- [x] `src/ui/LayerPanel.js` - P5 layer UI components
- [x] Parameter mapping integration
- [x] Transport bar integration with "P5 Code" button

**Key Features Implemented**:
- ✅ **Dynamic p5.js loading** from CDN
- ✅ **Real-time sketch compilation** with error handling
- ✅ **Parameter exposure system** via `p5Param()` helper
- ✅ **Monaco Editor integration** with JavaScript syntax highlighting
- ✅ **P5.js autocomplete and intellisense**
- ✅ **Live parameter tracking** and sidebar display
- ✅ **Professional UI** with dark theme
- ✅ **Canvas overlay positioning** with proper z-index management
- ✅ **MIDI/audio parameter routing** integration

### Phase 3: Shader Layer (Weeks 5-7) ✅ COMPLETED
**Goal**: Implement GLSL shader layer with real-time editing and emergent behavior simulations

#### Week 5: Shader Layer Foundation ✅ COMPLETED
- [x] Create `ShaderLayer` class with GLSL compilation
- [x] Implement basic shader editor with syntax highlighting (Monaco Editor)
- [x] Add uniform parameter exposure system
- [x] Create shader error handling and display
- [x] **Emergent Behavior Focus**: Design shader architecture for agent-based simulations

#### Week 6: Shader Presets and Emergent Systems ✅ COMPLETED
- [x] Implement pre-built shader presets (reaction diffusion, noise, patterns)
- [x] **Physarum Shader**: GPU-accelerated Physarum algorithm preset
- [x] **Flocking Shader**: GPU-accelerated Boids algorithm preset
- [x] **Reaction-Diffusion**: Gray-Scott reaction-diffusion system preset
- [x] Add shader parameter controls with live sliders in editor
- [x] Create shader hot-reload system with real-time compilation
- [x] **Enhanced Default Shader**: Multi-parameter animated pattern with warp effects

#### Week 7: Shader Integration and MIDI Mapping ✅ COMPLETED
- [x] Integrate shader parameters with MIDI/audio mapping
- [x] **Agent Control**: Real-time parameter adjustment for live performance
- [x] **vec2 Component Mapping**: Individual .x/.y/.both targeting for MIDI controls
- [x] Add shader persistence in scenes/presets
- [x] **External Shader Files**: Moved shader presets to `public/shaders/` folder
- [x] **Success criteria**: Can write/edit shaders and map uniforms to MIDI ✅ ACHIEVED
- [x] **MIDI Integration**: Shader parameters fully integrated with MIDI mapping system

### Phase 3.5: Advanced Emergent Behavior (Weeks 7.5-9.5)
**Goal**: Implement production-grade Physarum simulation matching [Etienne Jacob's reference quality](https://bleuje.com/physarum-explanation/)

#### Week 7.5: Compute Shader Infrastructure
- [ ] Add compute shader support to `ShaderLayer` class
- [ ] Implement texture ping-pong system for trail maps
- [ ] Create GPU agent buffer management (1M+ agents)
- [ ] Add multi-pass rendering pipeline architecture
- [ ] **Performance Target**: 100k+ agents at stable 60fps

#### Week 8: Physarum Algorithm Implementation
- [ ] **Agent simulation compute shader** - movement, sensing, rotation logic
- [ ] **Trail deposit system** - particle counter with `atomicAdd` operations
- [ ] **Diffusion & decay shader** - 3x3 kernel trail processing
- [ ] **Multi-channel trail maps** - support for color experiments
- [ ] **Reference Implementation**: Based on [Etienne Jacob's open source code](https://github.com/bleuje/physarum-36p)

#### Week 9: Advanced Parameter Systems & Interaction
- [ ] **Dynamic parameter system** - trail-value-dependent parameters (36 Points technique)
- [ ] **Multiple behavior "Points"** - different preset behaviors with 20+ parameters each
- [ ] **Spatial parameter mixing** - cursor-based parameter interpolation with Gaussian falloff
- [ ] **Color experiments** - multi-channel trail rendering with delayed trail maps
- [ ] **Advanced MIDI mapping** - real-time control of complex parameter sets
- [ ] **Performance validation**: 1M+ agents at 60fps on modern GPUs

#### Week 9.5: Polish & Professional Features
- [ ] **Spawning system** - user-controlled particle spawning
- [ ] **Velocity effects** - particle inertia and smooth motion
- [ ] **Point mixing UI** - interface for blending different behavior sets
- [ ] **Performance monitoring** - FPS and agent count display
- [ ] **Success criteria**: Professional-grade emergent behavior suitable for live performance

**Deliverables**:
- Enhanced `ShaderLayer` with compute shader support
- Production-grade Physarum simulation (1M+ agents)
- Multiple behavior "Points" with advanced parameter systems
- Spatial parameter mixing and real-time interaction
- **Reference Quality**: Matching [bleuje.com/physarum-explanation](https://bleuje.com/physarum-explanation/) performance and visual fidelity

**Technical Architecture**:
```javascript
// Enhanced ShaderLayer for emergent behavior
class ShaderLayer extends LayerBase {
    constructor(id, config) {
        super(id, config);
        
        // Compute shader support
        this.computeShaders = {
            agentUpdate: null,    // Agent movement/sensing
            trailDeposit: null,   // Trail map updates  
            diffusion: null       // Trail diffusion/decay
        };
        
        // Multi-pass rendering
        this.trailTextures = [];  // Double-buffered trail maps
        this.agentBuffer = null;  // GPU buffer for agent data
        this.counterTexture = null; // Particle counter per pixel
        
        // Advanced parameters (matching 36 Points)
        this.agentCount = 1000000; // 1M agents target
        this.parameterSets = new Map(); // Multiple "Points"
        this.spatialMixing = false; // Cursor-based mixing
    }
}
```

**Performance Expectations**:
- **Agent Count**: 100k-1M agents (vs current simple patterns)
- **Frame Rate**: Stable 60fps on modern GPUs
- **Visual Quality**: Complex organic structures and emergent behaviors
- **Interactivity**: Real-time MIDI control of 20+ parameters per behavior set
- **Professional Grade**: Suitable for live VJ performances and installations

**Deliverables**: ✅ COMPLETED
- [x] `src/modules/layers/ShaderLayer.js` - Full shader layer implementation
- [x] `src/ui/ShaderCodeEditor.js` - Monaco Editor with GLSL syntax highlighting
- [x] Shader preset library with emergent behavior presets
- [x] Shader parameter mapping with MIDI integration
- [x] **Shader Preset Files**:
  - `public/shaders/default.frag` - Enhanced multi-parameter animated pattern
  - `public/shaders/noise.frag` - Procedural noise patterns
  - `public/shaders/physarum.frag` - GPU-accelerated Physarum simulation
  - `public/shaders/flocking.frag` - GPU-accelerated Boids flocking
  - `public/shaders/reaction-diffusion.frag` - Gray-Scott reaction-diffusion system

### Phase 4: Additional Layer Types (Weeks 8-14)
**Goal**: Implement remaining layer types

#### Week 8-9: Video Layer
- [ ] Create `VideoLayer` with file upload/URL support
- [ ] Implement video playback controls (play/pause, speed, loop)
- [ ] Add video effects and parameter mapping
- [ ] **Success criteria**: Can load video and control playback via MIDI

#### Week 10-12: Particle Layer
- [ ] Create `ParticleLayer` with GPU-accelerated particle system
- [ ] Implement particle emitters, forces, and behaviors
- [ ] Add particle parameter mapping
- [ ] **Success criteria**: Can create reactive particle effects controlled by MIDI

#### Week 13-14: Image Layer
- [ ] Create `ImageLayer` with image upload/URL support
- [ ] Implement image transformations and effects
- [ ] Add image parameter mapping
- [ ] **Success criteria**: Can load images and position them in layer stack

**Deliverables**:
- `src/modules/layers/VideoLayer.js`
- `src/modules/layers/ParticleLayer.js`
- `src/modules/layers/ImageLayer.js`
- Complete layer type library

### Phase 5: 3D Camera Enhancement (Weeks 15-20)
**Goal**: Add 3D camera system for isometric viewing

#### Week 15-16: 3D Infrastructure
- [ ] Create `CameraManager` with 2D/3D mode switching
- [ ] Implement 3D layer positioning system
- [ ] Add basic orbit camera controls
- [ ] Create 3D render pipeline
- [ ] Implement depth sorting for transparent layers

#### Week 17-18: Layer 3D Adaptations
- [ ] Adapt each layer type for 3D rendering
- [ ] Implement P5 canvas → 3D texture mapping
- [ ] Add video texture UV mapping
- [ ] Create shader layer 3D surface rendering
- [ ] Handle layer depth and collision detection

#### Week 19-20: UI and Camera Controls
- [ ] Add 3D camera controls to UI
- [ ] Implement layer position controls with 3D gizmos
- [ ] Add camera presets and animations
- [ ] Integrate camera parameters with MIDI mapping
- [ ] Create 3D viewport with layer position indicators

**Deliverables**:
- `src/modules/CameraManager.js`
- 3D layer adaptations
- 3D camera UI controls
- Camera parameter mapping

## Technical Architecture

### Layer Base Class Evolution
```javascript
// Phase 1-4: 2D Layer Base
class LayerBase {
    constructor(id, config) {
        this.id = id;
        this.visible = true;
        this.opacity = 1.0;
        this.blendMode = 'normal';
        this.renderTarget = null;
    }
    
    // Abstract methods
    initialize() {}
    render2D(renderer, camera, deltaTime) {}
    update(deltaTime) {}
    dispose() {}
    
    // Parameter interface
    setParameter(name, value) {}
    getParameter(name) {}
    getExposedParameters() {}
}

// Phase 5: Add 3D Support
class LayerBase {
    constructor(id, config) {
        this.id = id;
        this.visible = true;
        this.opacity = 1.0;
        this.blendMode = 'normal';
        this.renderTarget = null;
        this.position3D = new THREE.Vector3(0, 0, 0);
        this.rotation3D = new THREE.Euler(0, 0, 0);
        this.scale3D = new THREE.Vector3(1, 1, 1);
        this.thickness = 0.1; // For collision detection
    }
    
    // Abstract methods
    initialize() {}
    render2D(renderer, camera, deltaTime) {}
    render3D(renderer, camera, deltaTime) {}
    update(deltaTime) {}
    dispose() {}
    
    // 3D positioning
    get3DPosition() { return this.position3D; }
    set3DPosition(x, y, z) { this.position3D.set(x, y, z); }
    getBoundingBox() { /* Return 3D bounding box */ }
    
    // Parameter interface
    setParameter(name, value) {}
    getParameter(name) {}
    getExposedParameters() {}
}
```

### Parameter Routing System
```javascript
// Extend existing parameter system
updateAnimationParameter(target, value) {
    if (target.startsWith('layer:')) {
        const [_, layerId, paramName] = target.split(':');
        this.layerManager.setLayerParameter(layerId, paramName, value);
    } else if (target.startsWith('p5:')) {
        // Existing p5 routing
    } else if (target.startsWith('shader:')) {
        // New shader parameter routing
        const [_, shaderId, paramName] = target.split(':');
        this.layerManager.setShaderParameter(shaderId, paramName, value);
    } else {
        // Existing grid routing
    }
}
```

### Emergent Behavior Shader Architecture

#### GPU-Accelerated Agent Systems
```javascript
// ShaderLayer with compute shader support for emergent behavior
class ShaderLayer extends LayerBase {
    constructor(id, config) {
        super(id, config);
        this.computeShader = null;
        this.agentCount = 100000; // 100x more agents than CPU version
        this.trailTextures = []; // Double-buffered trail maps
        this.agentBuffer = null; // GPU buffer for agent data
    }
    
    // Emergent behavior specific methods
    initializeEmergentSystem(type) {
        switch(type) {
            case 'physarum':
                return this.loadPhysarumShaders();
            case 'flocking':
                return this.loadFlockingShaders();
            case 'reaction-diffusion':
                return this.loadReactionDiffusionShaders();
        }
    }
    
    // Real-time parameter updates for live performance
    updateAgentParameters(params) {
        // Update compute shader uniforms in real-time
        this.computeShader.uniforms.agentCount = params.agentCount;
        this.computeShader.uniforms.sensorDistance = params.sensorDistance;
        this.computeShader.uniforms.trailDecay = params.trailDecay;
        // ... other parameters
    }
}
```

#### Performance Comparison: CPU vs GPU
| Metric | Current CPU (P5) | Target GPU (Shader) | Improvement |
|--------|------------------|---------------------|-------------|
| **Agent Count** | 2,000 agents | 100,000+ agents | **50x** |
| **Frame Rate** | 30-60 fps | 60 fps stable | **2x** |
| **Trail Updates** | Every 2-4 frames | Every frame | **4x** |
| **Memory Usage** | High (2D arrays) | Low (textures) | **3x** |
| **Parameter Response** | Laggy | Instant | **10x** |

#### Shader Implementation Strategy
1. **Compute Shaders**: Handle agent simulation logic in parallel
2. **Fragment Shaders**: Render trails and visual effects efficiently
3. **Texture Ping-Pong**: Double-buffered trail maps for smooth updates
4. **Uniform Parameters**: Real-time MIDI control without performance loss
5. **Fallback Modes**: CPU fallback for older devices

### State Management Structure
```javascript
// Phase 1-4: 2D Layer State
state.layers = {
    order: ['grid', 'p5', 'shader', 'video', 'particle', 'image'],
    configs: {
        grid: { visible: true, opacity: 1.0, blendMode: 'normal', ... },
        p5: { visible: true, opacity: 1.0, blendMode: 'normal', code: '...', ... },
        shader: { 
            visible: true, 
            opacity: 1.0, 
            blendMode: 'normal', 
            fragmentShader: '...', 
            computeShader: '...', // For emergent behavior systems
            emergentType: 'physarum', // 'physarum', 'flocking', 'reaction-diffusion', 'custom'
            agentCount: 100000,
            trailDecay: 0.95,
            sensorDistance: 15,
            // ... other emergent behavior parameters
        },
        video: { visible: true, opacity: 1.0, blendMode: 'normal', url: '...', ... },
        particle: { visible: true, opacity: 1.0, blendMode: 'normal', ... },
        image: { visible: true, opacity: 1.0, blendMode: 'normal', url: '...', ... }
    }
}

// Phase 5: Add 3D Camera State
state.layers = {
    order: ['grid', 'p5', 'shader', 'video', 'particle', 'image'],
    configs: { /* layer configs */ },
    camera: {
        mode: '2D', // '2D' or '3D'
        position3D: { x: 0, y: 0, z: 5 },
        rotation3D: { x: 0, y: 0, z: 0 },
        fov: 75
    },
    positions3D: {
        grid: { x: 0, y: 0, z: 0 },
        p5: { x: 0, y: 0, z: 1 },
        shader: { x: 0, y: 0, z: 2 }
    }
}
```

## UI/UX Design

### Layer Panel
- Layer list with drag-and-drop reordering
- Layer visibility toggles and opacity sliders
- Layer blend mode selection
- Layer-specific controls (collapsible)
- Layer preview thumbnails

### Layer-Specific Controls
- **Grid Layer**: Existing grid controls
- **P5 Layer**: Code editor, parameter list, run controls
- **Shader Layer**: GLSL editor, uniform controls, preset browser
- **Video Layer**: File upload, playback controls, video effects
- **Particle Layer**: Emitter controls, force fields, particle properties
- **Image Layer**: Image upload, transform controls, effects

## Performance Considerations

### Layer Culling
- Skip rendering hidden layers
- Level-of-detail for complex layers
- Frame rate limiting per layer

### Memory Management
- Dispose unused render targets
- Texture pooling for video/images
- Shader compilation caching

### GPU Optimization
- Batch similar layer types
- Use instancing for particle layers
- Optimize render target usage

## Migration Strategy

### Existing Scenes
- Grid animation becomes the first layer
- All existing parameters remain accessible
- No breaking changes to current functionality

### Scene Versioning
```javascript
// Scene format evolution
{
    version: "2.0", // Add version field
    layers: { /* existing layer config */ },
    camera: { /* new 3D camera config */ } // Optional for v1 scenes
}
```

### Migration Strategy

#### Existing Scenes (Backward Compatibility)
- All existing scenes work in 2D mode
- 3D mode is opt-in (toggle in UI)
- Default camera position preserves original view
- Gradual migration to 3D positioning

#### Emergent Behavior Migration Path
- **Phase 2 (Current)**: P5-based emergent behavior sketches (Physarum, Flocking)
- **Phase 3 (Shader)**: GPU-accelerated shader versions with same parameter interfaces
- **Migration Benefits**: 
  - Same MIDI mappings work with shader versions
  - 50x performance improvement (2k → 100k agents)
  - Real-time parameter control without lag
  - Professional-grade performance for live shows
- **Backward Compatibility**: P5 sketches remain available, shader versions are alternatives
- **Parameter Mapping**: `p5:agentCount` → `shader:agentCount` (same parameter names)

#### Layer-Specific 3D Adaptations
- **Grid Layer**: Mapped to 3D plane or curved surface
- **P5 Layer**: Canvas rendered to texture, mapped to 3D plane
- **Shader Layer**: Applied to 3D surfaces (planes, spheres, custom geometry)
- **Video Layer**: Video textures on 3D planes
- **Particle Layer**: True 3D particle systems with depth
- **Image Layer**: Images as textures on 3D planes

## Risk Mitigation

### High-Risk Components
- **Shader Layer**: Start with simple shaders, robust error handling
- **Particle Layer**: Performance monitoring, fallback modes
- **3D Camera**: Incremental implementation, extensive testing, depth sorting complexity

### Medium-Risk Components
- **P5 Layer**: Start with simple sketches, add complexity gradually
- **Video Layer**: Start with local files, add streaming later
- **Layer 3D Adaptations**: Texture mapping, UV coordinates, coordinate system transformations

### Low-Risk Components
- **Grid Layer**: Just refactoring existing code
- **Image Layer**: Simple file loading and display

## Success Criteria

### Each Phase Should Deliver:
1. **Working functionality** - Layers render correctly
2. **Parameter mapping** - MIDI/audio control works
3. **Scene persistence** - Layers save/load properly
4. **Performance** - Maintains 60fps with multiple layers
5. **User experience** - Intuitive controls and feedback

### Overall Success Metrics:
- All 6 layer types working together
- 3D camera system functional with proper depth sorting
- Performance maintained with multiple layers (2D and 3D modes)
- User adoption and feedback positive
- Smooth transitions between 2D and 3D modes

## Future Enhancements

### Post-Phase 5 Possibilities:
- Advanced blend modes and compositing
- Layer effects and filters
- Multiple p5 layers
- **Advanced Emergent Behavior**: Multi-species agent systems, predator-prey dynamics
- **Complex Reaction-Diffusion**: Multi-chemical systems, 3D reaction-diffusion
- **Neural Network Visualization**: GPU-accelerated neural network training visualization
- Video recording capabilities
- Real-time collaboration features
- Advanced 3D effects and animations
- Camera animations synchronized to BPM
- Parallax effects between layers
- Depth-based parameter modulation
- 3D space as a performance tool
- **Emergent Behavior Recording**: Save and replay complex agent behavior patterns

## Open Questions

- Should we support multiple independent p5 layers?
- How should we handle layer asset management (videos, images, shaders)?
- What level of 3D complexity should we support initially?
- How should we handle layer performance profiling and optimization?
- Should we implement layer collision detection in 3D mode?
- How should we handle transparent layer blending in 3D space?
- What camera presets would be most useful for performers?
- Should camera parameters be mappable to MIDI/audio for reactive camera movement?

## Implementation Notes

- Each phase builds on the previous phase
- Maintain backward compatibility throughout
- Focus on user value and performance
- Document as we go for future maintenance
- Test thoroughly before moving to next phase
- 3D camera system is additive enhancement, not breaking change
- Layer system designed for 2D-first, 3D-later approach
- Performance monitoring critical for 3D mode with multiple layers

---

**Last Updated**: January 2025
**Status**: Phase 3 Complete - Shader Layer Integration ✅
**Next Milestone**: Phase 2 Final Step - Sketch Persistence, then Phase 3.5 - Advanced Emergent Behavior

## Implementation Notes & Decisions

### Key Architectural Decisions Made

#### Phase 1: GridLayer vs GridManager Decision
**Decision**: Keep `GridManager` as foundational element instead of wrapping in `GridLayer`
**Rationale**: 
- GridManager is deeply integrated with Scene, AnimationLoop, and GUI systems
- Wrapping caused double rendering and broken animation/GUI interactions
- Grid serves as the "base layer" that other layers composite over
- Future flexibility: Can still add GridLayer later if needed for omitting grid entirely

**Result**: LayerManager manages *additional* layers (P5, Shader, etc.) that render over the foundational grid

#### Phase 2: P5 Layer Architecture
**Decision**: Canvas overlay approach with proper z-index management
**Rationale**:
- P5.js handles its own animation loop - no need to integrate with Three.js render loop
- Fixed positioning allows P5 canvas to overlay perfectly over 3D scene
- z-index: 10 positions P5 layer between 3D scene (0) and UI (40-50)
- `pointer-events: none` allows UI interaction to pass through

**Result**: P5 sketches render as overlay with perfect positioning and proper layering

#### Phase 2: Code Editor Integration
**Decision**: Monaco Editor with transport bar button
**Rationale**:
- Monaco Editor provides professional IDE experience with syntax highlighting
- Transport bar placement makes editor easily accessible
- CDN loading keeps bundle size manageable
- P5.js autocomplete enhances user experience

**Result**: Professional code editing experience integrated into existing UI

#### Phase 3: Shader Layer Architecture
**Decision**: Three.js ShaderMaterial integration with Monaco Editor
**Rationale**:
- ShaderMaterial provides direct GLSL compilation and uniform management
- Monaco Editor offers professional GLSL syntax highlighting and error detection
- Automatic uniform discovery enables seamless MIDI parameter mapping
- External shader files in `public/shaders/` allow hot-swapping and version control

**Key Technical Achievements**:
- **Real-time GLSL compilation** with error handling and validation
- **Automatic uniform discovery** - shaders auto-expose parameters for UI/MIDI
- **vec2 component mapping** - Individual .x/.y/.both targeting for MIDI controls
- **External shader system** - Presets stored as `.frag` files for easy editing
- **Performance optimization** - 60fps with complex animated shaders
- **Professional editor** - Monaco Editor with GLSL syntax highlighting

**Result**: Production-ready shader layer with seamless MIDI integration and professional editing experience



### Current System Status
- ✅ **Core layer system** functional with LayerManager and LayerBase
- ✅ **P5 Layer** fully implemented with professional code editor
- ✅ **Shader Layer** fully implemented with GLSL editor and MIDI mapping
- ✅ **Parameter mapping** working between P5/Shader parameters and MIDI/audio
- ✅ **UI integration** complete with layer panel and transport bar
- ✅ **External shader files** system with `public/shaders/` folder
- 🔄 **Sketch persistence** - only remaining Phase 2 task
- 🎯 **Next Priority**: Phase 3.5 - Advanced Emergent Behavior (High-fidelity Physarum)

### Performance Notes
- P5 layer rendering: ~60fps maintained with animated sketches
- Shader layer rendering: ~60fps with complex fragment shaders
- Monaco Editor loading: ~2-3 seconds on first use (CDN cached afterward)
- Memory usage: Minimal impact, layers properly disposed on removal
- Z-index layering: No performance impact, purely CSS-based
- Shader compilation: Real-time with error handling and validation
- **Phase 3.5 Target**: 100k-1M agent emergent behavior at 60fps (GPU compute shaders)
