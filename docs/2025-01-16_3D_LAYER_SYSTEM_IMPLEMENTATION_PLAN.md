# 3D Layer System Implementation Plan

**Date:** 2025-01-16  
**Goal:** Transform the current 2D layer system into a 3D composition space for live A/V performance  
**Status:** Planning Phase  

## 🎯 Project Vision

### **Primary Use Case:**
Live audio-visual performance tool where multiple 2D planes (P5 sketches, shader effects, video, images) exist in 3D space and can be viewed from any angle, including isometric views.

### **Core Concept:**
- **3D Composition Space:** Multiple 2D planes floating in 3D space
- **Content Types:** P5 sketches, GLSL shaders, video, images, grid
- **MIDI Control:** Primary control method for live performance
- **Real-time Performance:** 60fps+ with instant MIDI response
- **Isometric Viewing:** See composition from any angle (front, side, isometric, free rotation)

### **Target Users:**
- Live A/V performers
- Digital artists
- Musicians creating visual accompaniments
- Interactive installation creators
- Shader artists and GLSL developers

## 🏗️ Current System Analysis

### **What We Have:**
- ✅ **Layer Management System:** LayerBase, P5Layer, GridLayer
- ✅ **MIDI Control System:** Input handling and parameter mapping
- ✅ **Basic 3D Foundation:** Three.js scene with grid
- ✅ **Layer Ordering:** Up/down reordering with z-position separation
- ✅ **Parameter System:** Basic layer parameters (visible, opacity, blendMode)

### **What We Need to Build:**
- ❌ **3D Layer Conversion:** Convert 2D content to 3D meshes
- ❌ **Shader Layer System:** GLSL shader layer similar to P5Layer
- ❌ **3D Parameter System:** Position, rotation, scale controls
- ❌ **3D Rendering Pipeline:** Unified 3D rendering for all layers
- ❌ **Camera Control System:** MIDI-controlled camera movement
- ❌ **Performance Optimization:** Real-time 3D rendering

## 🔧 Technical Architecture

### **Core Changes Required:**

#### **1. Layer System Redesign:**
```javascript
// Current: 2D overlays with z-offset
class LayerBase {
    this.visible = true;
    this.opacity = 1.0;
    this.zOffset = 0;
}

// New: 3D meshes with full 3D parameters
class Layer3D extends LayerBase {
    this.mesh = null;           // Three.js mesh
    this.texture = null;        // Canvas/video texture
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
}

// New Layer Types:
class P5Layer3D extends Layer3D {
    this.p5Instance = null;     // P5.js instance
    this.canvas = null;         // P5 canvas
    this.renderTarget = null;   // Three.js render target
}

class ShaderLayer3D extends Layer3D {
    this.shaderMaterial = null; // Custom GLSL material
    this.uniforms = new Map();  // Shader uniforms
    this.fragmentShader = '';   // Fragment shader code
    this.vertexShader = '';     // Vertex shader code
    this.renderTarget = null;   // Shader output texture
}
```

#### **2. Rendering Pipeline:**
```javascript
// Current: Hybrid 2D/3D rendering
Scene.render() → Grid (3D) + P5 (2D overlays)

// New: Unified 3D rendering
LayerManager.render() → All layers as 3D meshes in single scene
├── Grid Layer → 3D foundation plane
├── P5 Layers → 3D planes with P5 canvas textures
├── Shader Layers → 3D planes with GLSL shader materials
└── Other Layers → 3D planes with appropriate textures
```

#### **3. Parameter System Extension:**
```javascript
// Current parameters (keep existing):
visible, opacity, blendMode, zOffset

// New 3D parameters (add to existing system):
position.x, position.y, position.z
rotation.x, rotation.y, rotation.z
scale.x, scale.y, scale.z
depth (for layering order)

// Shader-specific parameters:
shader.uniforms.* (all shader uniforms)
shader.fragmentShader (live shader editing)
shader.vertexShader (live shader editing)
```

## 🎹 MIDI Integration Strategy

### **Existing MIDI System:**
- ✅ **Parameter mapping** infrastructure
- ✅ **Input handling** and routing
- ✅ **Parameter updates** and interpolation

### **New MIDI Mappings to Add:**
```javascript
// Layer 3D Position Control:
CC 1:  Layer 1 Position X (-100 to 100)
CC 2:  Layer 1 Position Y (-100 to 100)
CC 3:  Layer 1 Position Z (-100 to 100)
CC 4:  Layer 1 Rotation X (-π to π)
CC 5:  Layer 1 Rotation Y (-π to π)
CC 6:  Layer 1 Rotation Z (-π to π)

// Shader Layer Control:
CC 7:  Shader Layer 1 Uniform 1 (custom range)
CC 8:  Shader Layer 1 Uniform 2 (custom range)
CC 9:  Shader Layer 1 Uniform 3 (custom range)
CC 10: Shader Layer 1 Uniform 4 (custom range)
CC 11: Shader Layer 2 Uniform 1 (custom range)
CC 12: Shader Layer 2 Uniform 2 (custom range)

// P5 Layer Control:
CC 13: P5 Layer 1 Parameter 1 (custom range)
CC 14: P5 Layer 1 Parameter 2 (custom range)
CC 15: P5 Layer 1 Parameter 3 (custom range)

// Camera Control:
CC 20: Camera Rotation X (pan left/right)
CC 21: Camera Rotation Y (tilt up/down)
CC 22: Camera Rotation Z (roll)
CC 23: Camera Distance (zoom)

// Composition Control:
CC 30: Layer Order (cycle through preset arrangements)
CC 31: Composition Preset (load saved arrangements)
CC 32: Performance Mode Toggle
CC 33: Shader Hot-Reload (recompile shaders)
CC 34: P5 Hot-Reload (reload P5 sketches)
```

### **Parameter Ranges for Live Performance:**
- **Position:** -100 to +100 units (wide range for dramatic movement)
- **Rotation:** -π to +π radians (full 360° rotation)
- **Scale:** 0.1 to 5.0 (dramatic scaling effects)
- **Shader Uniforms:** Custom ranges based on shader needs
- **P5 Parameters:** Custom ranges based on sketch needs
- **Camera:** Smooth ranges optimized for live control

## 📋 Development Checklist

### **Session 1: 3D Layer Foundation**
- [ ] Create Layer3D class extending LayerBase
- [ ] Add 3D properties (position, rotation, scale)
- [ ] Convert P5Layer to use 3D mesh
- [ ] Create ShaderLayer3D class for GLSL shaders
- [ ] Test basic 3D rendering for all layer types

### **Session 2: Shader Layer Implementation**
- [ ] Implement GLSL shader material system
- [ ] Add shader uniform management
- [ ] Create basic shader examples (noise, patterns)
- [ ] Test shader layer performance
- [ ] Integrate with existing layer system

### **Session 3: Parameter System Extension**
- [ ] Extend parameter system with 3D parameters
- [ ] Add shader uniform parameters
- [ ] Add parameter validation and ranges
- [ ] Test parameter updates and interpolation
- [ ] Integrate with existing layer system

### **Session 4: MIDI Integration**
- [ ] Add 3D parameters to MIDI mappings
- [ ] Add shader uniforms to MIDI mappings
- [ ] Test MIDI control of 3D parameters and shaders
- [ ] Implement parameter interpolation
- [ ] Add MIDI feedback for 3D and shader controls

### **Session 5: Live Editing Features**
- [ ] Implement shader hot-reload system
- [ ] Implement P5 sketch hot-reload system
- [ ] Add shader and P5 preset systems
- [ ] Test live editing during performance
- [ ] Performance optimization for live editing

### **Session 6: Camera Control**
- [ ] Implement camera control system
- [ ] Add camera parameters to MIDI
- [ ] Create preset camera angles
- [ ] Test smooth camera movement

### **Session 7: Performance Optimization**
- [ ] Implement performance monitoring
- [ ] Add optimization strategies
- [ ] Test with multiple layers (P5 + Shader + Grid)
- [ ] Performance benchmarking and optimization

## 🚀 Implementation Phases

### **Phase 1: 3D Layer Foundation (Next 1-2 Sessions)**
**Goal:** Convert existing layers to 3D meshes and add shader layer system

#### **Tasks:**
- [ ] **Extend LayerBase** with 3D properties
- [ ] **Create Layer3D class** extending LayerBase
- [ ] **Convert P5Layer** to render as 3D mesh
- [ ] **Convert GridLayer** to use 3D positioning
- [ ] **Create ShaderLayer3D** class for GLSL shaders
- [ ] **Basic 3D rendering** integration for all layer types

#### **Deliverables:**
- All layers exist as 3D meshes in Three.js scene
- Basic 3D positioning and rotation working
- Shader layer system functional with basic shaders
- Maintain existing functionality (visibility, opacity)

### **Phase 2: 3D Parameter System (Next 2-3 Sessions)**
**Goal:** Integrate 3D parameters with existing MIDI system

#### **Tasks:**
- [ ] **Extend parameter system** with 3D parameters
- [ ] **Add shader uniform parameters** to parameter system
- [ ] **Add 3D parameters** to existing MIDI mappings
- [ ] **Implement parameter interpolation** for smooth changes
- [ ] **Add parameter validation** and range checking
- [ ] **Test MIDI control** of 3D parameters and shader uniforms

#### **Deliverables:**
- 3D parameters fully integrated with MIDI system
- Shader uniforms controllable via MIDI
- Smooth parameter interpolation working
- MIDI control of layer position, rotation, scale, and shader effects

### **Phase 3: Shader & P5 Enhancement (Next 2-3 Sessions)**
**Goal:** Advanced shader and P5 layer features

#### **Tasks:**
- [ ] **Live shader editing** with hot-reload
- **Live P5 sketch editing** with hot-reload
- [ ] **Shader uniform presets** for common effects
- [ ] **P5 parameter presets** for common animations
- [ ] **Shader library** of common effects (noise, fractals, etc.)
- [ ] **Performance optimization** for shader layers

#### **Deliverables:**
- Live shader editing and hot-reload working
- Live P5 editing and hot-reload working
- Shader and P5 preset systems functional
- Optimized performance for both layer types

### **Phase 4: Camera Control System (Next 2-3 Sessions)**
**Goal:** MIDI-controlled camera for viewing angles

#### **Tasks:**
- [ ] **Implement camera control** system
- [ ] **Add camera parameters** to MIDI system
- [ ] **Create preset camera angles** (front, isometric, side)
- [ ] **Smooth camera interpolation** for live performance
- [ ] **Camera constraints** and limits

#### **Deliverables:**
- Full camera control via MIDI
- Preset viewing angles working
- Smooth camera movement

### **Phase 5: Performance Features (Next 3-4 Sessions)**
**Goal:** Live performance optimization and features

#### **Tasks:**
- [ ] **Performance monitoring** and optimization
- [ ] **3D composition presets** (save/load)
- [ ] **Performance modes** (free, constrained, automated)
- [ ] **Real-time 3D choreography** tools
- [ ] **Shader performance profiling** and optimization
- [ ] **Audio-reactive enhancements** (optional)

#### **Deliverables:**
- 60fps+ performance with multiple 3D layers
- Preset system for compositions
- Performance optimization tools
- Shader performance monitoring

### **Phase 6: Advanced Features (Future Sessions)**
**Goal:** Enhanced creative capabilities

#### **Tasks:**
- [ ] **Layer interactions** (one affects another)
- [ ] **Advanced shader effects** (particles, post-processing)
- [ ] **Shader-to-shader communication** (uniform sharing)
- [ ] **Advanced 3D effects** (particles, shaders)
- [ ] **Spatial audio correlation** (optional)
- [ ] **VR/AR support** (future consideration)
- [ ] **Multi-screen setups** (future consideration)

## 🎨 Creative Capabilities

### **3D Composition Features:**
- **Multiple viewing angles** (front, isometric, side, free)
- **Depth-based layering** with proper z-ordering
- **Spatial relationships** between visual elements
- **3D choreography** for live performance

### **Shader Layer Features:**
- **GLSL shader support** with live editing
- **Custom uniforms** controllable via MIDI
- **Shader libraries** for common effects (noise, fractals, patterns)
- **Performance-optimized** shader rendering
- **Hot-reload** for live shader development
- **Shader presets** for quick effect switching

### **P5 Layer Features:**
- **JavaScript sketches** with live editing
- **Custom parameters** controllable via MIDI
- **Sketch libraries** for common animations
- **Hot-reload** for live sketch development
- **Parameter presets** for quick animation switching

### **Live Performance Features:**
- **Real-time 3D transformation** via MIDI
- **Composition presets** for different songs/sections
- **Performance modes** for different styles
- **Quick setup** and teardown for live shows
- **Live shader and P5 editing** during performance

### **Artistic Possibilities:**
- **3D visual storytelling** with depth and perspective
- **Spatial audio-visual correlation**
- **Immersive visual experiences**
- **Interactive 3D installations**
- **Real-time shader art** creation
- **Live-coded visual performances**

## 🔍 Technical Challenges & Solutions

### **Challenge 1: Texture Management**
**Problem:** Converting P5 canvases and shader outputs to Three.js textures efficiently
**Solution:** 
- Pre-convert static content to textures
- Use render targets for animated content
- Implement texture pooling and caching
- **Shader-specific:** Use render targets for shader output textures

### **Challenge 2: Shader Layer Performance**
**Problem:** Maintaining 60fps with complex GLSL shaders
**Solution:**
- **Shader optimization** (reduce texture fetches, optimize math)
- **LOD system** for shader complexity based on distance
- **Shader compilation caching** to avoid recompilation
- **Uniform batching** to reduce GPU state changes
- **Performance profiling** for shader bottlenecks

### **Challenge 3: Performance with Multiple Layers**
**Problem:** Maintaining 60fps with many 3D layers
**Solution:**
- LOD system for distant layers
- Frustum culling for off-screen content
- Instanced rendering for similar layers
- Performance monitoring and optimization
- **Shader-specific:** Dynamic shader complexity based on performance

### **Challenge 4: MIDI Integration**
**Problem:** Extending existing MIDI system with 3D parameters and shader uniforms
**Solution:**
- Extend existing parameter structure
- Maintain backward compatibility
- Add parameter groups for 3D controls
- **Shader-specific:** Dynamic uniform discovery and MIDI mapping
- Implement smooth interpolation

### **Challenge 5: Live Shader Editing**
**Problem:** Hot-reloading GLSL shaders without performance impact
**Solution:**
- **Background compilation** of new shader code
- **Shader validation** before hot-reload
- **Fallback shaders** if compilation fails
- **Performance monitoring** during shader changes
- **Shader versioning** to prevent conflicts

### **Challenge 6: Camera Control**
**Problem:** Smooth, responsive camera movement via MIDI
**Solution:**
- Interpolated camera updates
- Preset camera positions
- Constraint system for live performance
- Performance-optimized camera calculations
