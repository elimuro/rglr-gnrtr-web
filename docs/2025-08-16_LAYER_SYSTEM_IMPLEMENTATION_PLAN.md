# Layer System Implementation Plan

## Overview

This document outlines the implementation plan for a comprehensive layer system that will transform the current grid-based animation into a composable multi-layer architecture. The system will support various layer types (grid, p5, video, shader, particle, image) with independent controls and the ability to share parameters through the existing MIDI/audio mapping system.

## Goals

- Enable multiple visual layers that can be positioned in front of or behind each other
- Maintain compatibility with existing grid-based animation
- Integrate with current MIDI and audio mapping systems
- Support future 3D camera system for isometric viewing
- Provide flexible, extensible architecture for new layer types

## Non-Goals (for v1)

- 3D camera system (Phase 5 enhancement)
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

### Phase 1: Core Infrastructure (Weeks 1-2)
**Goal**: Establish the layer system foundation

#### Week 1: Layer Base Classes
- [ ] Create `LayerBase` abstract class
- [ ] Implement `LayerManager` with basic layer registry
- [ ] Add layer ordering and visibility controls
- [ ] Create layer state management structure

#### Week 2: Grid Layer Refactor
- [ ] Extract `GridManager` functionality into `GridLayer`
- [ ] Maintain all existing grid parameters and functionality
- [ ] Test that layer system doesn't break current animations
- [ ] **Success criteria**: Grid animation works exactly as before

**Deliverables**:
- `src/modules/LayerManager.js`
- `src/modules/LayerBase.js`
- `src/modules/layers/GridLayer.js`
- Basic layer panel UI

### Phase 2: P5 Layer Integration (Weeks 3-4)
**Goal**: Implement p5.js layer based on existing plan

#### Week 3: P5 Layer Core
- [ ] Create `P5Layer` class with canvas overlay
- [ ] Implement `p5Param` system for parameter exposure
- [ ] Add basic p5 sketch editor
- [ ] Integrate with layer parameter routing

#### Week 4: P5 Layer UI and Integration
- [ ] Add p5-specific controls to layer panel
- [ ] Implement parameter mapping to MIDI/audio
- [ ] Add sketch persistence in scenes/presets
- [ ] **Success criteria**: Can create p5 sketch and map parameters to MIDI

**Deliverables**:
- `src/modules/layers/P5Layer.js`
- P5 layer UI components
- Parameter mapping integration

### Phase 3: Shader Layer (Weeks 5-7)
**Goal**: Implement GLSL shader layer with real-time editing

#### Week 5: Shader Layer Foundation
- [ ] Create `ShaderLayer` class with GLSL compilation
- [ ] Implement basic shader editor with syntax highlighting
- [ ] Add uniform parameter exposure system
- [ ] Create shader error handling and display

#### Week 6: Shader Presets and Effects
- [ ] Implement pre-built shader presets (reaction diffusion, noise, patterns)
- [ ] Add shader parameter controls
- [ ] Create shader hot-reload system
- [ ] Add shader performance monitoring

#### Week 7: Shader Integration and Polish
- [ ] Integrate shader parameters with MIDI/audio mapping
- [ ] Add shader persistence in scenes/presets
- [ ] Implement shader thumbnail generation
- [ ] **Success criteria**: Can write/edit shaders and map uniforms to MIDI

**Deliverables**:
- `src/modules/layers/ShaderLayer.js`
- GLSL editor with syntax highlighting
- Shader preset library
- Shader parameter mapping

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

#### Week 17-18: Layer 3D Adaptations
- [ ] Adapt each layer type for 3D rendering
- [ ] Implement P5 canvas → 3D texture mapping
- [ ] Add video texture UV mapping
- [ ] Create shader layer 3D surface rendering

#### Week 19-20: UI and Camera Controls
- [ ] Add 3D camera controls to UI
- [ ] Implement layer position controls
- [ ] Add camera presets and animations
- [ ] Integrate camera parameters with MIDI mapping

**Deliverables**:
- `src/modules/CameraManager.js`
- 3D layer adaptations
- 3D camera UI controls
- Camera parameter mapping

## Technical Architecture

### Layer Base Class
```javascript
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
    render(renderer, camera, deltaTime) {}
    update(deltaTime) {}
    dispose() {}
    
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
    } else {
        // Existing grid routing
    }
}
```

### State Management Structure
```javascript
state.layers = {
    order: ['grid', 'p5', 'shader', 'video', 'particle', 'image'],
    configs: {
        grid: { visible: true, opacity: 1.0, blendMode: 'normal', ... },
        p5: { visible: true, opacity: 1.0, blendMode: 'normal', code: '...', ... },
        shader: { visible: true, opacity: 1.0, blendMode: 'normal', fragmentShader: '...', ... },
        video: { visible: true, opacity: 1.0, blendMode: 'normal', url: '...', ... },
        particle: { visible: true, opacity: 1.0, blendMode: 'normal', ... },
        image: { visible: true, opacity: 1.0, blendMode: 'normal', url: '...', ... }
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
{
    version: "2.0",
    layers: { /* layer config */ },
    camera: { /* 3D camera config - Phase 5 */ }
}
```

## Risk Mitigation

### High-Risk Components
- **Shader Layer**: Start with simple shaders, robust error handling
- **Particle Layer**: Performance monitoring, fallback modes
- **3D Camera**: Incremental implementation, extensive testing

### Medium-Risk Components
- **P5 Layer**: Start with simple sketches, add complexity gradually
- **Video Layer**: Start with local files, add streaming later

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
- 3D camera system functional
- Performance maintained with multiple layers
- User adoption and feedback positive

## Future Enhancements

### Post-Phase 5 Possibilities:
- Advanced blend modes and compositing
- Layer effects and filters
- Multiple p5 layers
- Video recording capabilities
- Real-time collaboration features
- Advanced 3D effects and animations

## Open Questions

- Should we support multiple independent p5 layers?
- How should we handle layer asset management (videos, images, shaders)?
- What level of 3D complexity should we support initially?
- How should we handle layer performance profiling and optimization?

## Implementation Notes

- Each phase builds on the previous phase
- Maintain backward compatibility throughout
- Focus on user value and performance
- Document as we go for future maintenance
- Test thoroughly before moving to next phase

---

**Last Updated**: [Date]
**Status**: Planning Phase
**Next Milestone**: Phase 1 - Core Infrastructure
