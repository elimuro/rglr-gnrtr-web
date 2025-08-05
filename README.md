# RGLR Generator Web

A real-time generative art application with MIDI integration, audio reactivity, and advanced animation controls.

## Features

### MIDI Integration
- **MIDI Device Support**: Connect to any MIDI device for real-time control
- **CC Mapping**: Map MIDI CC messages to any animation parameter
- **Note Controls**: Use MIDI notes to trigger specific actions
- **MIDI Clock Sync**: Synchronize animations to external MIDI clock
- **MIDI Transport Control**: Use MIDI start/stop messages to control animation playback
  - **MIDI Stop Animation Option**: When enabled, receiving a MIDI stop message will pause the animation loop
  - **MIDI Start Animation Option**: When the stop option is enabled, MIDI start messages will restart the animation loop

### Audio Reactivity
- **Real-time Audio Analysis**: Connect to audio interfaces for live audio input
- **Audio Mapping**: Map audio levels to animation parameters
- **Multi-channel Support**: Support for multiple audio channels

### Animation System
- **Shape Morphing**: Smooth transitions between different shape types
- **BPM-based Timing**: Musical timing with BPM synchronization
- **Post-processing Effects**: Bloom, chromatic aberration, vignette, and more
- **Real-time Parameter Control**: Adjust all parameters in real-time

### Scene Management
- **Scene Presets**: Save and load complete scene configurations
- **Interpolation**: Smooth transitions between scenes with customizable easing
- **Export/Import**: Save and share your configurations

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Connect MIDI Device**:
   - Click the MIDI drawer button
   - Select "Connection" 
   - Click "Connect MIDI"
   - Choose your MIDI device if multiple are available

4. **Enable MIDI Stop Animation** (Optional):
   - In the Connection drawer, check "MIDI Stop Stops Animation"
   - Now MIDI stop messages will pause the animation loop
   - MIDI start messages will restart the animation loop

## Usage

### MIDI Controls
- **CC Mapping**: Map any MIDI CC to animation parameters
- **Note Controls**: Use MIDI notes to trigger specific actions
- **Clock Sync**: Enable MIDI clock sync for musical timing
- **Transport Control**: Use MIDI start/stop for animation playback control

### Audio Controls
- **Audio Interface**: Connect to audio interfaces for live input
- **Audio Mapping**: Map audio levels to animation parameters
- **Multi-channel**: Support for multiple audio channels

### Animation Controls
- **Shape Cycling**: Automatically cycle through different shapes
- **Size Animation**: Animate shape sizes over time
- **Morphing**: Smooth transitions between shape types
- **Post-processing**: Adjust visual effects in real-time

## Configuration

The application supports extensive configuration through:
- **MIDI Presets**: Save and load MIDI control mappings
- **Scene Presets**: Save and load complete scene configurations
- **Audio Mappings**: Configure audio-reactive parameters
- **Animation Parameters**: Fine-tune all animation behaviors

## Development

### Project Structure
```
src/
├── core/           # Core application logic
├── modules/        # Feature modules
├── ui/            # User interface components
└── main-new.js    # Application entry point
```

### Key Components
- **App.js**: Main application controller
- **AnimationLoop.js**: Animation timing and rendering
- **MIDIManager.js**: MIDI device management
- **AudioManager.js**: Audio interface handling
- **StateManager.js**: Application state management

## License

This project is licensed under the MIT License.
