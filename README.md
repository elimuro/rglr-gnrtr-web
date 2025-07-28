# RGLR GNRTR Web Version

This is a web-based version of the RGLR GNRTR geometric pattern generator, converted from the original OpenFrameworks C++ application.

## Features

- Interactive geometric pattern generation
- Real-time animation controls
- 3D transformations
- Color customization
- **Web MIDI Integration** - Connect MIDI controllers and instruments
- **Per-Parameter MIDI Mapping** - Configure channel/CC pairs for each animation parameter
- **MIDI Preset System** - Save and load custom MIDI mapping configurations
- **Live MIDI Activity Monitoring** - Visual feedback for MIDI input
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
- **Channel/CC Mapping**: Configure which MIDI channel and CC number controls each parameter
- **Per-Parameter Control**: Each animation parameter can be mapped to different MIDI channels/CCs
- **Live Testing**: Test CC values and see real-time parameter changes
- **Preset System**: Save and load custom MIDI mapping configurations
- **MIDI Activity Monitor**: Visual feedback showing incoming MIDI messages

### MIDI Mappable Parameters
- Animation Speed
- Movement Amplitude
- Rotation Amplitude
- Scale Amplitude
- Randomness
- Cell Size
- Movement Frequency
- Rotation Frequency
- Scale Frequency
- Grid Width/Height
- Shape Cycling (Note On/Off)
- Size Animation (Note On/Off)
- Show Grid (Note On/Off)

## Technologies Used

- Three.js for 3D rendering
- dat.GUI for the control interface
- GSAP for smooth animations
- Web MIDI API for MIDI device integration
- Vite for fast development and building

## Live Demo

🌐 **[Try it live here](https://rglr-gnrtr.netlify.app)**

## MIDI Setup

1. **Connect MIDI Device**: Click "Connect MIDI" in the MIDI control panel
2. **Configure Mappings**: Set channel/CC pairs for each parameter
3. **Test Controls**: Use "Test CC Values" to verify your setup
4. **Save Presets**: Save your custom mappings for later use

## Browser Compatibility

- **Chrome/Edge**: Full MIDI support
- **Firefox**: Full MIDI support  
- **Safari**: Limited MIDI support
- **Mobile**: No MIDI support (Web MIDI API not available)
