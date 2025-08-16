# 3D Layer System Implementation Plan

**Date:** 2025-01-16  
**Goal:** Transform the current 2D layer system into a 3D composition space for live A/V performance  
**Status:** Planning Phase  

## 🎯 Project Vision

### **Primary Use Case:**
Live audio-visual performance tool where multiple 2D planes (P5 sketches, video, images) exist in 3D space and can be viewed from any angle, including isometric views.

### **Core Concept:**
- **3D Composition Space:** Multiple 2D planes floating in 3D space
- **MIDI Control:** Primary control method for live performance
- **Real-time Performance:** 60fps+ with instant MIDI response
- **Isometric Viewing:** See composition from any angle (front, side, isometric, free rotation)

### **Target Users:**
- Live A/V performers
- Digital artists
- Musicians creating visual accompaniments
- Interactive installation creators

## 🏗️ Current System Analysis

### **What We Have:**
- ✅ **Layer Management System:** LayerBase, P5Layer, GridLayer
- ✅ **MIDI Control System:** Input handling and parameter mapping
- ✅ **Basic 3D Foundation:** Three.js scene with grid
- ✅ **Layer Ordering:** Up/down reordering with z-position separation
- ✅ **Parameter System:** Basic layer parameters (visible, opacity, blendMode)

### **What We Need to Build:**
- ❌ **3D Layer Conversion:** Convert 2D content to 3D meshes
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
```

#### **2. Rendering Pipeline:**
```javascript
// Current: Hybrid 2D/3D rendering
Scene.render() → Grid (3D) + P5 (2D overlays)

// New: Unified 3D rendering
LayerManager.render() → All layers as 3D meshes in single scene
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

// Camera Control:
CC 20: Camera Rotation X (pan left/right)
CC 21: Camera Rotation Y (tilt up/down)
CC 22: Camera Rotation Z (roll)
CC 23: Camera Distance (zoom)

// Composition Control:
CC 30: Layer Order (cycle through preset arrangements)
CC 31: Composition Preset (load saved arrangements)
CC 32: Performance Mode Toggle
```

### **Parameter Ranges for Live Performance:**
- **Position:** -100 to +100 units (wide range for dramatic movement)
- **Rotation:** -π to +π radians (full 360° rotation)
- **Scale:** 0.1 to 5.0 (dramatic scaling effects)
- **Camera:** Smooth ranges optimized for live control

## 🚀 Implementation Phases

### **Phase 1: 3D Layer Foundation (Next 1-2 Sessions)**
**Goal:** Convert existing layers to 3D meshes

#### **Tasks:**
- [ ] **Extend LayerBase** with 3D properties
- [ ] **Create Layer3D class** extending LayerBase
- [ ] **Convert P5Layer** to render as 3D mesh
- [ ] **Convert GridLayer** to use 3D positioning
- [ ] **Basic 3D rendering** integration

#### **Deliverables:**
- All layers exist as 3D meshes in Three.js scene
- Basic 3D positioning and rotation working
- Maintain existing functionality (visibility, opacity)

### **Phase 2: 3D Parameter System (Next 2-3 Sessions)**
**Goal:** Integrate 3D parameters with existing MIDI system

#### **Tasks:**
- [ ] **Extend parameter system** with 3D parameters
- [ ] **Add 3D parameters** to existing MIDI mappings
- [ ] **Implement parameter interpolation** for smooth changes
- [ ] **Add parameter validation** and range checking
- [ ] **Test MIDI control** of 3D parameters

#### **Deliverables:**
- 3D parameters fully integrated with MIDI system
- Smooth parameter interpolation working
- MIDI control of layer position, rotation, scale

### **Phase 3: Camera Control System (Next 2-3 Sessions)**
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

### **Phase 4: Performance Features (Next 3-4 Sessions)**
**Goal:** Live performance optimization and features

#### **Tasks:**
- [ ] **Performance monitoring** and optimization
- [ ] **3D composition presets** (save/load)
- [ ] **Performance modes** (free, constrained, automated)
- [ ] **Real-time 3D choreography** tools
- [ ] **Audio-reactive enhancements** (optional)

#### **Deliverables:**
- 60fps+ performance with multiple 3D layers
- Preset system for compositions
- Performance optimization tools

### **Phase 5: Advanced Features (Future Sessions)**
**Goal:** Enhanced creative capabilities

#### **Tasks:**
- [ ] **Layer interactions** (one affects another)
- [ ] **Advanced 3D effects** (particles, shaders)
- [ ] **Spatial audio correlation** (optional)
- [ ] **VR/AR support** (future consideration)
- [ ] **Multi-screen setups** (future consideration)

## ⚡ Performance Requirements

### **Real-time Performance:**
- **Frame Rate:** 60fps minimum, 120fps preferred
- **MIDI Latency:** < 5ms from input to visual change
- **Memory Usage:** < 2GB for typical compositions
- **CPU Usage:** < 30% on mid-range systems

### **Optimization Strategies:**
- **Texture pooling** for multiple layers
- **LOD system** for distant layers
- **Frustum culling** for off-screen layers
- **Instanced rendering** for similar layers
- **Render target caching** for repeated content

### **Performance Monitoring:**
- **Real-time FPS display**
- **Memory usage tracking**
- **Layer count and complexity metrics**
- **Performance warnings** for complex compositions

## 🎨 Creative Capabilities

### **3D Composition Features:**
- **Multiple viewing angles** (front, isometric, side, free)
- **Depth-based layering** with proper z-ordering
- **Spatial relationships** between visual elements
- **3D choreography** for live performance

### **Live Performance Features:**
- **Real-time 3D transformation** via MIDI
- **Composition presets** for different songs/sections
- **Performance modes** for different styles
- **Quick setup** and teardown for live shows

### **Artistic Possibilities:**
- **3D visual storytelling** with depth and perspective
- **Spatial audio-visual correlation**
- **Immersive visual experiences**
- **Interactive 3D installations**

## 🔍 Technical Challenges & Solutions

### **Challenge 1: Texture Management**
**Problem:** Converting P5 canvases to Three.js textures efficiently
**Solution:** 
- Pre-convert static content to textures
- Use render targets for animated content
- Implement texture pooling and caching

### **Challenge 2: Performance with Multiple Layers**
**Problem:** Maintaining 60fps with many 3D layers
**Solution:**
- LOD system for distant layers
- Frustum culling for off-screen content
- Instanced rendering for similar layers
- Performance monitoring and optimization

### **Challenge 3: MIDI Integration**
**Problem:** Extending existing MIDI system with 3D parameters
**Solution:**
- Extend existing parameter structure
- Maintain backward compatibility
- Add parameter groups for 3D controls
- Implement smooth interpolation

### **Challenge 4: Camera Control**
**Problem:** Smooth, responsive camera movement via MIDI
**Solution:**
- Interpolated camera updates
- Preset camera positions
- Constraint system for live performance
- Performance-optimized camera calculations

## 📋 Development Checklist

### **Session 1: 3D Layer Foundation**
- [ ] Create Layer3D class extending LayerBase
- [ ] Add 3D properties (position, rotation, scale)
- [ ] Convert P5Layer to use 3D mesh
- [ ] Test basic 3D rendering

### **Session 2: Parameter System Extension**
- [ ] Extend parameter system with 3D parameters
- [ ] Add parameter validation and ranges
- [ ] Test parameter updates and interpolation
- [ ] Integrate with existing layer system

### **Session 3: MIDI Integration**
- [ ] Add 3D parameters to MIDI mappings
- [ ] Test MIDI control of 3D parameters
- [ ] Implement parameter interpolation
- [ ] Add MIDI feedback for 3D controls

### **Session 4: Camera Control**
- [ ] Implement camera control system
- [ ] Add camera parameters to MIDI
- [ ] Create preset camera angles
- [ ] Test smooth camera movement

### **Session 5: Performance Optimization**
- [ ] Implement performance monitoring
- [ ] Add optimization strategies
- [ ] Test with multiple layers
- [ ] Performance benchmarking

## 🎯 Success Criteria

### **Phase 1 Success:**
- All layers render as 3D meshes
- Basic 3D positioning working
- Maintain 60fps performance

### **Phase 2 Success:**
- 3D parameters fully integrated with MIDI
- Smooth parameter interpolation
- No performance degradation

### **Phase 3 Success:**
- Full camera control via MIDI
- Multiple viewing angles working
- Smooth camera movement

### **Phase 4 Success:**
- 60fps+ with multiple 3D layers
- Preset system functional
- Ready for live performance

### **Overall Success:**
- **Live A/V performance tool** with 3D composition space
- **MIDI-controlled 3D layers** for live performance
- **Isometric viewing** from any angle
- **Professional performance quality** output

## 🚀 Next Steps

### **Immediate Actions:**
1. **Review and approve** this implementation plan
2. **Prioritize features** based on live performance needs
3. **Set timeline** for development phases
4. **Begin Phase 1** implementation

### **Questions to Resolve:**
- **Parameter ranges** for live performance control
- **Camera movement** preferences and constraints
- **Performance targets** for your specific hardware
- **Feature priorities** for live performance workflow

---

**Document Status:** Ready for Review  
**Next Review:** After Phase 1 completion  
**Last Updated:** 2025-01-16
