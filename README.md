# Regular Generator Web

A real-time visual generator with MIDI control capabilities, built with Three.js and modern web technologies.

## Features

- **Real-time Visual Generation**: Create dynamic, animated visual compositions
- **MIDI Control**: Full MIDI mapping support for real-time parameter control
- **Scene Management**: Save, load, and interpolate between visual scenes
- **Scene Presets**: Quick access to predefined visual scenes
- **Post-processing Effects**: Bloom, chromatic aberration, vignette, and more
- **Shape Morphing**: Dynamic shape transitions and animations
- **Responsive Design**: Works on desktop and mobile devices

## Scene Presets

The application includes several predefined scene presets that you can quickly apply:

### Available Scene Presets

1. **Ambient Dream** - A soft, dreamy ambient scene with gentle morphing and warm lighting
2. **Cyberpunk Night** - A high-energy cyberpunk scene with neon colors and dynamic animations  
3. **Minimalist Zen** - A clean, minimalist scene with subtle animations and zen-like tranquility
4. **Sunset Mirage** - A warm, glowing scene inspired by sunsets and desert mirages

### Using Scene Presets

1. Click the "Scene Management" button in the top toolbar
2. Select a preset from the "Scene Preset" dropdown
3. The scene will automatically apply with smooth interpolation
4. You can adjust the interpolation duration and easing in the scene management panel

### Creating Custom Scenes

1. Adjust the visual parameters to your liking
2. Click "Save Scene" to download your custom scene as a JSON file
3. Use "Load Scene" to load previously saved scenes

## MIDI Control

The application supports comprehensive MIDI control mapping:

### MIDI Presets

Several MIDI controller presets are included:
- Sample Multi-Channel
- Novation Launch Control XL
- Akai MPK Mini
- Arturia BeatStep Pro
- Elektron Analog Rytm MK2

### MIDI Mapping

1. Connect your MIDI device
2. Select a preset from the "Preset" dropdown in the top toolbar
3. Use the CC Mapping and Note Controls panels to customize mappings
4. Save and load custom MIDI configurations

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to the local development URL
5. Connect a MIDI device (optional)
6. Start creating visual compositions!

## Development

- **Framework**: Vite + Three.js
- **Styling**: Tailwind CSS
- **MIDI**: Web MIDI API
- **Animation**: GSAP for smooth transitions

## File Structure

```
src/
├── core/           # Core application logic
├── modules/        # Feature modules
├── ui/            # User interface components
└── main-new.js    # Application entry point

public/
├── presets/       # MIDI controller presets
├── scenes/        # Scene presets
└── default-scene.json
```
