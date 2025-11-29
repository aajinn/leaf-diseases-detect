# Camera Capture & Live Detection System

## Overview
The Camera Capture system enables users to capture leaf images directly from their device camera (webcam or phone camera) for disease detection. The Live Detection feature provides continuous monitoring with real-time analysis.

## Features

### 1. Camera Capture (Dashboard)
Single image capture from camera for immediate analysis.

#### Capabilities
- **Webcam Support**: Desktop/laptop camera access
- **Mobile Camera**: Front and back camera on phones/tablets
- **Camera Switching**: Toggle between front/back cameras
- **Live Preview**: Real-time camera feed
- **Frame Guide**: Visual guide for optimal leaf positioning
- **Auto-Capture Mode**: Automatic capture every 3 seconds

#### Usage
1. Click "Use Camera" button on dashboard
2. Allow camera access when prompted
3. Position leaf within the frame guide
4. Click "Capture Photo" to take picture
5. Image is automatically analyzed

### 2. Live Detection Page
Dedicated page for continuous disease monitoring.

#### Detection Modes

##### Manual Mode
- Capture on demand by clicking "Capture Now"
- Full control over when to analyze
- Best for careful examination

##### Auto Mode
- Automatic capture every 3 seconds
- Continuous monitoring
- Ideal for scanning multiple leaves

##### Real-time Mode (Experimental)
- Analyzes every frame (1 per second)
- Fastest detection
- Higher API usage
- Best for rapid screening

#### Features
- **Live Camera Feed**: Continuous video stream
- **Detection History**: Last 10 detections displayed
- **Session Statistics**: Track scans, diseases found, healthy plants
- **Visual Feedback**: Frame color changes based on detection
  - Green: Healthy
  - Red: Disease detected
  - Yellow: Analyzing
- **Status Indicator**: Shows camera and detection status
- **Last Capture Preview**: Thumbnail of most recent capture

## Technical Implementation

### Browser APIs Used
- **MediaDevices API**: Camera access
- **getUserMedia**: Video stream capture
- **Canvas API**: Image capture from video
- **Blob API**: Convert canvas to file

### Camera Constraints
```javascript
{
    video: {
        facingMode: 'environment', // or 'user' for front camera
        width: { ideal: 1920 },
        height: { ideal: 1080 }
    },
    audio: false
}
```

### Files
- `frontend/js/camera-capture.js` - Camera capture logic
- `frontend/js/live-detection.js` - Live detection page logic
- `frontend/live-detection.html` - Live detection page
- `frontend/dashboard.html` - Includes camera modal

## Classes

### CameraCapture
Main class for camera operations.

#### Methods

##### `initialize(videoElement, canvasElement)`
Initialize camera with video and canvas elements.

##### `startCamera()`
Start camera stream with current facing mode.

```javascript
await cameraCapture.startCamera();
```

##### `stopCamera()`
Stop camera stream and release resources.

```javascript
cameraCapture.stopCamera();
```

##### `switchCamera()`
Toggle between front and back camera.

```javascript
const facingMode = await cameraCapture.switchCamera();
```

##### `captureImage()`
Capture current frame as image file.

```javascript
const file = await cameraCapture.captureImage();
```

##### `getAvailableCameras()`
Get list of available cameras.

```javascript
const cameras = await cameraCapture.getAvailableCameras();
```

##### `hasMultipleCameras()`
Check if device has multiple cameras.

```javascript
const hasMultiple = await cameraCapture.hasMultipleCameras();
```

### AutoCaptureMode
Automatic capture at intervals.

#### Methods

##### `start()`
Start auto-capture mode.

```javascript
autoCaptureMode.start();
```

##### `stop()`
Stop auto-capture mode.

```javascript
autoCaptureMode.stop();
```

##### `toggle()`
Toggle auto-capture on/off.

```javascript
const isActive = autoCaptureMode.toggle();
```

## User Interface

### Dashboard Camera Modal
- **Header**: Title and close button
- **Video Preview**: Live camera feed with overlay
- **Frame Guide**: Dashed border for leaf positioning
- **Controls**:
  - Capture Photo button
  - Switch Camera button (if multiple cameras)
  - Auto-Capture toggle
- **Tips Section**: Best practices for capture

### Live Detection Page
- **Camera Feed**: Large video preview
- **Status Indicator**: Shows camera/detection status
- **Detection Mode Selector**: Radio buttons for mode selection
- **Controls**:
  - Start/Stop Camera
  - Switch Camera
  - Capture Now (manual mode)
- **Current Detection**: Latest result display
- **Detection History**: Scrollable list of recent detections
- **Session Stats**: Real-time statistics

## Error Handling

### Common Errors

#### NotAllowedError
- **Cause**: User denied camera permission
- **Solution**: Prompt user to allow camera in browser settings

#### NotFoundError
- **Cause**: No camera found on device
- **Solution**: Inform user to connect camera or use file upload

#### NotReadableError
- **Cause**: Camera in use by another application
- **Solution**: Close other apps using camera

#### OverconstrainedError
- **Cause**: Requested camera constraints not available
- **Solution**: Fall back to default constraints

### Error Display
All errors shown in user-friendly format with:
- Clear error message
- Suggested solutions
- Option to retry or use file upload

## Mobile Optimization

### Responsive Design
- Full-screen camera on mobile
- Touch-optimized controls
- Larger buttons for easy tapping
- Swipe gestures (future enhancement)

### Camera Selection
- Automatically uses back camera on mobile
- Easy switch to front camera
- Remembers user preference

### Performance
- Optimized for mobile processors
- Reduced resolution on slower devices
- Battery-efficient capture intervals

## Best Practices

### For Users

#### Lighting
- Use natural daylight when possible
- Avoid harsh shadows
- Ensure even lighting on leaf

#### Positioning
- Fill frame with leaf
- Keep camera steady
- Focus on affected areas
- Avoid blurry images

#### Distance
- Hold camera 6-12 inches from leaf
- Ensure leaf is in focus
- Capture entire affected area

### For Developers

#### Resource Management
- Always stop camera when done
- Release video stream on page unload
- Clear intervals and timeouts

#### Error Handling
- Graceful degradation if camera unavailable
- Clear error messages
- Fallback to file upload

#### Performance
- Limit capture frequency in real-time mode
- Optimize image quality vs. file size
- Debounce rapid captures

## Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ Full | ✅ Full | Best support |
| Firefox | ✅ Full | ✅ Full | Full support |
| Safari | ✅ Full | ✅ Full | iOS 11+ required |
| Edge | ✅ Full | ✅ Full | Chromium-based |
| Opera | ✅ Full | ✅ Full | Chromium-based |

### Requirements
- HTTPS required (or localhost for testing)
- Camera permission granted
- Modern browser (last 2 years)

## Security & Privacy

### Camera Access
- Explicit user permission required
- Permission can be revoked anytime
- No recording or storage of video stream

### Image Handling
- Images captured only when user clicks button
- Images sent directly to API for analysis
- No client-side storage of images
- Images deleted after analysis (server-side)

### Privacy Indicators
- Browser shows camera active indicator
- Status indicator in app shows camera state
- Clear stop button always visible

## API Integration

### Endpoint
Same as file upload: `POST /api/disease-detection`

### Request
```javascript
const formData = new FormData();
formData.append('file', capturedFile);

fetch('/api/disease-detection', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

### Response
Standard disease detection response with:
- Disease information
- Confidence score
- Symptoms and treatment
- YouTube videos

## Usage Statistics

### Tracking
- Total captures per session
- Diseases detected
- Healthy scans
- Average confidence scores

### Display
- Real-time stats on live detection page
- Session summary on dashboard
- Historical trends (future enhancement)

## Future Enhancements

### Planned Features
- [ ] Image stabilization
- [ ] Auto-focus detection
- [ ] Zoom controls
- [ ] Flash/torch control
- [ ] Multiple leaf detection
- [ ] Batch capture mode
- [ ] Time-lapse monitoring
- [ ] Export detection history
- [ ] Offline mode with sync

### Advanced Features
- [ ] AR overlay with disease info
- [ ] 3D leaf scanning
- [ ] Multi-angle capture
- [ ] Disease progression tracking
- [ ] Comparison with previous scans
- [ ] AI-powered auto-framing

## Troubleshooting

### Camera Not Starting
1. Check browser permissions
2. Ensure HTTPS connection
3. Try different browser
4. Restart browser
5. Check if camera works in other apps

### Poor Detection Quality
1. Improve lighting
2. Hold camera steady
3. Get closer to leaf
4. Clean camera lens
5. Use higher resolution camera

### Slow Performance
1. Reduce capture frequency
2. Use manual mode instead of real-time
3. Close other tabs/apps
4. Check internet connection
5. Try different browser

### Camera Switching Not Working
1. Check if device has multiple cameras
2. Grant permission to all cameras
3. Restart camera
4. Try manual camera selection

## Testing

### Manual Testing
1. Test on different devices (desktop, mobile, tablet)
2. Test with different cameras (front, back, external)
3. Test in different lighting conditions
4. Test with various leaf types and diseases
5. Test error scenarios (denied permission, no camera)

### Automated Testing
```javascript
// Test camera initialization
test('Camera initializes correctly', async () => {
    const camera = new CameraCapture();
    await camera.initialize(videoElement, canvasElement);
    expect(camera.isRunning()).toBe(false);
});

// Test image capture
test('Captures image successfully', async () => {
    await camera.startCamera();
    const file = await camera.captureImage();
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/jpeg');
});
```

## Support

### User Support
- In-app tips and guides
- Error messages with solutions
- Link to help documentation
- Contact support option

### Developer Support
- Comprehensive API documentation
- Code examples
- Integration guides
- GitHub issues for bugs

## Conclusion

The Camera Capture and Live Detection system provides a seamless way for users to detect plant diseases using their device cameras. With support for both single captures and continuous monitoring, users can choose the workflow that best fits their needs. The system is optimized for performance, privacy, and ease of use across all devices.
