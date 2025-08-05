# Video Recording Feature

The RGLR GNRTR application now includes a powerful video recording system that allows users to capture their compositions as high-quality video files.

## Features

### 🎥 Real-time Recording
- Capture your composition directly from the canvas
- Supports multiple video formats (WebM, MP4)
- Configurable quality settings (Low, Medium, High)
- Adjustable frame rates (24, 30, 60 FPS)

### ⚙️ Advanced Settings
- **Quality Control**: Choose between Low (1 Mbps), Medium (3 Mbps), or High (5 Mbps)
- **Format Options**: WebM (VP9) for web compatibility or MP4 (H.264) for broader support
- **Duration Control**: Set recording duration from 1 to 60 seconds
- **Resolution Options**: Use canvas size or custom dimensions
- **Frame Rate**: Select 24, 30, or 60 FPS for different use cases

### 🎯 Quick Presets
- **Social Media**: Optimized for platforms like Instagram, TikTok (15s, Medium quality)
- **HD Quality**: High-definition export (10s, 60 FPS, 1920x1080)
- **Fast Export**: Quick preview generation (5s, Low quality, 24 FPS)
- **Custom**: User-defined settings for specific needs

## How to Use

### Basic Recording
1. **Start Recording**: Click the red "Record" button in the top toolbar
2. **Wait for Completion**: The recording will automatically stop after the set duration
3. **Download**: The video file will automatically download when complete

### Advanced Configuration
1. **Open Settings**: Click the gray "Settings" button next to the record button
2. **Configure Options**: Adjust quality, format, duration, and other settings
3. **Apply Presets**: Use quick preset buttons for common use cases
4. **Save Settings**: Your settings are automatically saved for future recordings

### Recording Controls
- **Record Button**: Toggle recording on/off
- **Settings Button**: Open configuration panel
- **Timer Display**: Shows recording duration in real-time
- **Recording Indicator**: Red pulsing dot shows active recording

## Technical Details

### Supported Formats
The application automatically detects browser support for different video codecs and formats:

- **WebM (VP9)**: Best for web use, smaller file sizes, widely supported
- **WebM (VP8)**: Good compatibility, moderate file sizes
- **MP4 (H.264)**: Universal compatibility, larger file sizes (browser-dependent)
- **MP4**: Generic MP4 support (browser-dependent)

The system will automatically fall back to supported formats if your preferred choice isn't available.

### Quality Settings
- **Low**: 1 Mbps - Fast export, smaller files
- **Medium**: 3 Mbps - Balanced quality and size
- **High**: 5 Mbps - Best quality, larger files

### Browser Compatibility
- **Chrome/Edge**: Full support for WebM formats, limited MP4 support
- **Firefox**: Excellent WebM support, limited MP4 support
- **Safari**: Limited support (WebM recommended)
- **Mobile browsers**: Varies by device and browser version

## File Naming Convention
Recorded videos are automatically named with the pattern:
```
rglr-composition-YYYY-MM-DDTHH-MM-SS-sssZ.webm
```

## Performance Considerations

### Memory Usage
- Recording uses browser's MediaRecorder API
- Memory usage scales with quality and duration
- Large files may take time to process

### Processing Time
- Higher quality settings require more processing
- 60 FPS recordings need more computational power
- Custom resolutions may impact performance

## Troubleshooting

### Common Issues

**Recording fails to start**
- Check browser permissions for media access
- Ensure canvas is visible and rendering
- Try refreshing the page

**Poor video quality**
- Increase quality setting in options
- Use higher frame rate for smoother motion
- Consider custom resolution for better quality

**Large file sizes**
- Use lower quality settings
- Reduce recording duration
- Choose WebM format for smaller files

**Browser compatibility**
- Use Chrome/Edge for best compatibility
- Firefox users should use WebM format
- Check the settings panel to see which formats your browser supports
- The system will automatically use the best available format

**Codec not supported error**
- This usually happens when trying to use MP4 format in browsers that don't support H.264
- The application will automatically fall back to WebM format
- Check the settings panel to see supported formats for your browser
- Safari users should use MP4 format

### Error Messages

**"Recording failed. Please try again."**
- Browser doesn't support MediaRecorder API
- Insufficient system resources
- Canvas not properly initialized

**"No video data recorded"**
- Recording duration too short
- Canvas not rendering during recording
- Browser permission issues

## Advanced Usage

### Custom Resolutions
1. Open settings panel
2. Select "Custom Size" in resolution dropdown
3. Set desired width and height
4. Apply settings and record

### Audio Recording
- Currently supports system audio if available
- Audio quality matches video quality
- Can be disabled in advanced settings

### Batch Recording
- Multiple recordings can be queued
- Each recording uses current settings
- Files are downloaded sequentially

## Integration with MIDI

The video recording system works seamlessly with MIDI controls:
- Record while using MIDI controllers
- MIDI parameter changes are captured in video
- Real-time parameter adjustments visible in recording

## Future Enhancements

Planned features for future versions:
- **GIF Export**: Animated GIF creation
- **Screenshot Tool**: High-resolution still image capture
- **Batch Processing**: Multiple format export
- **Cloud Upload**: Direct upload to video platforms
- **Advanced Editing**: Basic video editing capabilities

## API Reference

### VideoRecorder Class
```javascript
// Initialize recorder
const recorder = new VideoRecorder(app);

// Update settings
recorder.updateSettings({
    quality: 'high',
    format: 'webm',
    duration: 10,
    fps: 30
});

// Start recording
recorder.startRecording();

// Stop recording
recorder.stopRecording();
```

### Settings Object
```javascript
{
    fps: 30,                    // Frame rate
    quality: 'high',            // 'low', 'medium', 'high'
    format: 'webm',            // 'webm', 'mp4'
    duration: 10,              // Recording duration in seconds
    resolution: 'canvas',       // 'canvas', 'custom'
    customWidth: 1920,         // Custom width
    customHeight: 1080         // Custom height
}
```

## Contributing

To contribute to the video recording feature:
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test thoroughly across browsers
5. Submit a pull request

## License

This video recording feature is part of the RGLR GNRTR project and follows the same license terms as the main application. 