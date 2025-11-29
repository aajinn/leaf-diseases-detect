# Camera Capture Quick Start Guide

## Getting Started with Camera Detection

### Option 1: Quick Capture (Dashboard)

Perfect for single image analysis.

1. **Navigate to Dashboard**
   - Log in to your account
   - Go to the main dashboard

2. **Open Camera**
   - Click the "Use Camera" button
   - Allow camera access when prompted by browser

3. **Position Leaf**
   - Hold leaf within the dashed frame guide
   - Ensure good lighting
   - Keep camera steady

4. **Capture & Analyze**
   - Click "Capture Photo" button
   - Image is automatically analyzed
   - Results appear in seconds

### Option 2: Live Detection (Continuous Monitoring)

Perfect for scanning multiple leaves or continuous monitoring.

1. **Navigate to Live Detection**
   - From dashboard, click "Live Detection" button
   - Or go directly to `/live-detection`

2. **Start Camera**
   - Click "Start Camera" button
   - Allow camera access if prompted

3. **Choose Detection Mode**
   - **Manual**: Click "Capture Now" when ready
   - **Auto**: Automatic capture every 3 seconds
   - **Real-time**: Continuous analysis (experimental)

4. **Monitor Results**
   - Current detection shows in right panel
   - History displays last 10 detections
   - Statistics track your session

## Camera Controls

### Switch Camera
- Click the camera rotate icon
- Toggles between front and back camera
- Only visible if device has multiple cameras

### Auto-Capture Mode
- Available in dashboard camera modal
- Captures image every 3 seconds
- Great for scanning multiple leaves
- Click "Stop Auto-Capture" to disable

### Stop Camera
- Click "Stop Camera" button
- Releases camera for other apps
- Closes camera feed

## Tips for Best Results

### Lighting
✅ Use natural daylight  
✅ Avoid harsh shadows  
✅ Ensure even lighting  
❌ Don't use in darkness  
❌ Avoid direct sunlight causing glare  

### Positioning
✅ Fill frame with leaf  
✅ Hold camera 6-12 inches away  
✅ Keep camera steady  
✅ Focus on affected areas  
❌ Don't capture blurry images  
❌ Don't include too much background  

### Camera Quality
✅ Clean camera lens  
✅ Use back camera on mobile (better quality)  
✅ Ensure camera is in focus  
❌ Don't use low-resolution cameras  

## Troubleshooting

### Camera Won't Start

**Problem**: "Camera access denied" error

**Solutions**:
1. Check browser permissions (usually in address bar)
2. Go to browser settings → Privacy → Camera
3. Allow camera access for this site
4. Refresh the page

**Problem**: "No camera found" error

**Solutions**:
1. Check if camera is connected (external webcam)
2. Try a different browser
3. Restart your device
4. Use file upload instead

### Poor Image Quality

**Problem**: Blurry or dark images

**Solutions**:
1. Improve lighting conditions
2. Hold camera steady
3. Wait for camera to focus
4. Clean camera lens
5. Move closer to leaf

### Camera Freezes

**Problem**: Video feed stops or freezes

**Solutions**:
1. Click "Stop Camera" then restart
2. Refresh the page
3. Close other apps using camera
4. Try a different browser

### Switch Camera Not Working

**Problem**: Can't switch between cameras

**Solutions**:
1. Check if device has multiple cameras
2. Grant permission to all cameras
3. Restart camera
4. Some devices only have one camera

## Browser Compatibility

### Desktop
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ⚠️ Internet Explorer (not supported)

### Mobile
- ✅ Chrome (Android)
- ✅ Safari (iOS 11+)
- ✅ Firefox Mobile
- ✅ Samsung Internet

### Requirements
- HTTPS connection (or localhost for testing)
- Camera permission granted
- Modern browser (last 2 years)

## Privacy & Security

### What We Access
- ✅ Camera feed for image capture only
- ✅ Captured images sent to API for analysis

### What We DON'T Do
- ❌ Record video
- ❌ Store camera feed
- ❌ Access camera without permission
- ❌ Share images with third parties

### Your Control
- You can revoke camera permission anytime
- Camera stops when you close the page
- Clear stop button always visible
- Browser shows camera active indicator

## Detection Modes Explained

### Manual Mode
**Best for**: Careful examination of single leaves

- You control when to capture
- Click "Capture Now" button
- Review each result before next capture
- Most accurate for detailed analysis

### Auto Mode
**Best for**: Scanning multiple leaves quickly

- Captures every 3 seconds automatically
- Continuous monitoring
- Good for checking many plants
- Moderate API usage

### Real-time Mode (Experimental)
**Best for**: Rapid screening

- Analyzes every second
- Fastest detection
- Higher API usage
- May miss some details
- Best for quick checks

## Mobile-Specific Tips

### Using Phone Camera

1. **Orientation**
   - Use landscape mode for better framing
   - Portrait mode works but shows less

2. **Stability**
   - Rest phone on stable surface if possible
   - Use both hands to hold steady
   - Consider using a phone stand

3. **Camera Selection**
   - Back camera has better quality
   - Front camera useful for selfie-style capture
   - Switch easily with rotate button

4. **Battery**
   - Camera uses battery quickly
   - Plug in for extended sessions
   - Close other apps to save power

### Tablet Tips
- Larger screen makes positioning easier
- Use kickstand for hands-free operation
- Better for live detection mode
- Longer battery life than phones

## Advanced Features

### Auto-Capture Workflow
1. Start camera in dashboard
2. Enable auto-capture mode
3. Position first leaf
4. Wait 3 seconds for capture
5. Move to next leaf
6. Repeat for multiple leaves
7. Review results in history

### Live Detection Workflow
1. Go to live detection page
2. Start camera
3. Select auto or real-time mode
4. Hold camera over plants
5. Monitor detection panel
6. Check history for past results
7. View session statistics

### Batch Scanning
1. Use live detection with auto mode
2. Prepare multiple leaves
3. Scan each for 3 seconds
4. Move to next leaf
5. Review all results in history
6. Export or save important findings

## Getting Help

### In-App Help
- Hover over info icons for tips
- Check error messages for solutions
- Review tips section in camera modal

### Documentation
- [Full Camera Documentation](CAMERA_CAPTURE.md)
- [Visual Enhancements Guide](VISUAL_ENHANCEMENTS.md)
- [Main README](../README.md)

### Support
- Check browser console for errors (F12)
- Try different browser if issues persist
- Contact support with error details
- Include browser and device information

## Next Steps

After capturing and analyzing:

1. **Review Results**
   - Check confidence score
   - Read disease information
   - Note treatment recommendations

2. **Take Action**
   - Follow treatment advice
   - Watch recommended videos
   - Export PDF report if needed

3. **Track Progress**
   - Save to history
   - Re-scan after treatment
   - Compare results over time

4. **Share Findings**
   - Export PDF reports
   - Share with agronomists
   - Document treatment progress

## Keyboard Shortcuts

Coming soon:
- `Space` - Capture image
- `C` - Switch camera
- `A` - Toggle auto-capture
- `Esc` - Close camera modal

## FAQ

**Q: Do I need to install anything?**  
A: No, it works directly in your browser.

**Q: Does it work offline?**  
A: Camera works offline, but analysis requires internet.

**Q: How much data does it use?**  
A: About 1-2 MB per image analyzed.

**Q: Can I use it on multiple devices?**  
A: Yes, log in on any device with a camera.

**Q: Is my camera feed recorded?**  
A: No, only captured images are sent for analysis.

**Q: Can I use an external webcam?**  
A: Yes, any camera recognized by your browser works.

**Q: What if I have multiple cameras?**  
A: Use the switch button to choose between them.

**Q: Does it work in low light?**  
A: Detection works but quality may be reduced. Use good lighting for best results.

## Conclusion

The camera capture feature makes disease detection fast and convenient. Whether you need to analyze a single leaf or monitor multiple plants continuously, the system adapts to your workflow. Start with manual mode to learn the system, then explore auto and real-time modes for faster scanning.

Happy detecting! 🌿📸
