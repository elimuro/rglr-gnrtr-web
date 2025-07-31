# RGLR GNRTR Web Version

This is a web-based version of the RGLR GNRTR geometric pattern generator, converted from the original OpenFrameworks C++ application.

## Features

- Interactive geometric pattern generation
- Real-time animation controls
- 3D transformations
- Color customization
- **Web MIDI Integration** - Connect MIDI controllers and instruments
- **Dynamic MIDI Control Management** - Add and remove MIDI controls on-the-fly
- **MIDI Learn Functionality** - Automatic detection of MIDI channel and CC/Note numbers
- **Per-Parameter MIDI Mapping** - Configure channel/CC pairs for each animation parameter
- **MIDI Preset System** - Save and load custom MIDI mapping configurations
- **Live MIDI Activity Monitoring** - Visual feedback for MIDI input
- **Advanced Post-Processing Effects** - Bloom, Chromatic Aberration, Vignette, Film Grain, Color Grading
- Responsive design
- Modern web-based GUI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:5173`

## Configuration

### Default Scene Settings

The application loads its default settings from `default-scene.json` in the root directory. You can modify this file to change the initial state of the application. The file contains all visual and animation parameters.

**To see changes immediately:**
- Press `R` (capital R) in the application to reload the default scene from the JSON file
- Or restart the development server

**Key settings you can modify:**
- Animation parameters (speed, amplitude, frequency)
- Grid settings (width, height, cell size)
- Shape properties (colors, materials)
- Post-processing effects (bloom, vignette, etc.)
- MIDI mappings

## Controls

### GUI Controls
- **Animation**: Toggle animation on/off
- **Animation Type**: Choose between different animation patterns
- **Shape Type**: Select between Grid, Ellipses, Triangles, and Rectangles
- **Grid Size**: Adjust the number of shapes in the grid
- **Spacing**: Control the distance between shapes
- **3D**: Toggle 3D mode
- **Colors**: Customize shape and background colors

### MIDI Controls
- **Connect MIDI**: Connect your MIDI device to the browser
- **Dynamic Control Management**: Add new CC and Note controls with the "+ Add New" buttons
- **MIDI Learn**: Click "Learn" on any control to automatically detect MIDI input
- **Channel/CC Mapping**: Configure which MIDI channel and CC number controls each parameter
- **Per-Parameter Control**: Each animation parameter can be mapped to different MIDI channels/CCs
- **Live Testing**: Test CC values and see real-time parameter changes
- **Preset System**: Save and load custom MIDI mapping configurations

### Keyboard Shortcuts
- **1-8**: Adjust animation parameters
- **A**: Toggle size animation
- **G**: Toggle grid visibility
- **R**: Randomize shapes
- **R** (capital): Reload default scene from JSON file
- **C**: Cycle through animation types

## Development

### File Structure
- `src/core/`: Core application logic
- `src/modules/`: Feature modules (animation, materials, etc.)
- `src/ui/`: User interface components
- `default-scene.json`: Default application settings
- `midi-help.html`: MIDI control documentation

### Making Changes
1. Modify `default-scene.json` to change default settings
2. Press `R` (capital) in the app to reload settings
3. Or restart the dev server for permanent changes

## Troubleshooting

### MIDI Issues
- Ensure your browser supports Web MIDI API
- Run over HTTPS or localhost
- Check device connections and permissions

### Performance Issues
- Disable post-processing effects if experiencing lag
- Reduce grid size or animation complexity
- Close other browser tabs to free up resources
