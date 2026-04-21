# Live Detection Feature

## Overview
The Live Detection feature provides real-time, continuous scanning of plant leaves using your device's camera. It automatically detects diseases or confirms healthy leaves and stops when a definitive result is found.

## How It Works

### Continuous Scanning Behavior

1. **Start Scanning**
   - Click "Start Scanning" to activate the camera
   - The system begins continuous analysis at set intervals (default: 5 seconds)
   - Camera feed shows live video with frame guide

2. **Automatic Detection**
   - System continuously captures and analyzes frames
   - Searches for valid leaf images
   - Ignores invalid images (no leaf, blurry, etc.)

3. **Auto-Stop on Detection**
   - **Disease Found**: Stops immediately, shows disease details
   - **Healthy Leaf Found**: Stops immediately, shows healthy confirmation
   - **Invalid Image**: Continues scanning (doesn't stop)

4. **Resume or Exit**
   - After detection, you can resume scanning or view full analysis
   - Manual stop available anytime

## Features

### Smart Detection
- ✅ Stops on disease detection
- ✅ Stops on healthy leaf confirmation
- ✅ Continues if no valid leaf found
- ✅ Prevents duplicate analysis
- ✅ Auto-crop for better accuracy

### Scan Intervals
Configure how often the system analyzes frames:
- **Fast (3s)**: Quick detection, higher API usage
- **Normal (5s)**: Balanced (default)
- **Slow (10s)**: Reduced API usage
- **Very Slow (15s)**: Minimal API usage

### Visual Feedback
- **Yellow Border**: Analyzing...
- **Red Border**: Disease detected
- **Green Border**: Healthy leaf detected
- **Status Indicator**: Shows current state

## User Interface

### Top Bar
- **Status Dot**: Camera/scanning status
- **Scan Count**: Number of analyses performed
- **Interval Button**: Change scan frequency
- **Auto-Crop Toggle**: Enable/disable automatic cropping
- **Exit Button**: Return to dashboard

### Center Frame
- **Frame Guide**: Visual guide for leaf positioning
- **Instructions**: Helpful tips when idle

### Bottom Controls
- **Start Scanning**: Begin continuous detection
- **Stop Scanning**: Pause detection
- **Capture Now**: Force immediate analysis

### Result Panel
Shows detection results with:
- Disease name and severity (if diseased)
- Confidence percentage
- Key symptoms and treatment
- Action buttons (Resume, Full Analysis, Close)

## Usage Tips

### For Best Results
1. **Good Lighting**: Ensure adequate lighting
2. **Steady Camera**: Keep device stable
3. **Fill Frame**: Position leaf to fill most of the frame
4. **Clear Background**: Avoid cluttered backgrounds
5. **Focus**: Ensure leaf is in focus

### Reducing API Costs
- Use longer scan intervals (10s or 15s)
- Enable auto-crop for better accuracy
- Position leaf properly before starting
- Use manual capture for single scans

### When to Use Live Detection
- **Quick Checks**: Fast disease screening
- **Field Work**: On-site plant monitoring
- **Multiple Plants**: Scan several plants quickly
- **Real-time Feedback**: Immediate results needed

### When to Use Dashboard Upload
- **Detailed Analysis**: Need full report with videos
- **Documentation**: Save analysis for records
- **Poor Lighting**: Better control over image quality
- **Offline Images**: Analyze existing photos

## Detection Logic

### Disease Detection Flow
```
Start Scanning
    ↓
Capture Frame
    ↓
Valid Leaf? → No → Continue Scanning
    ↓ Yes
Analyze Image
    ↓
Disease Found? → Yes → STOP & Show Disease Details
    ↓ No
Healthy Leaf? → Yes → STOP & Show Healthy Confirmation
    ↓ No (Invalid)
Continue Scanning
```

### Stop Conditions
The system stops scanning when:
1. ✅ Disease is detected (any disease type)
2. ✅ Healthy leaf is confirmed (high confidence)
3. ❌ User manually stops
4. ❌ Error occurs (rate limit, network, etc.)

The system continues scanning when:
- Invalid image (no leaf detected)
- Blurry or unclear image
- Low confidence result
- Background or non-leaf object

## Technical Details

### Scan Intervals
- Configurable from 3s to 15s
- Prevents concurrent API calls
- Respects rate limits
- Auto-adjusts on rate limit errors

### Image Processing
- Auto-crop: Focuses on leaf area
- Duplicate detection: Prevents re-analyzing same image
- Quality checks: Validates image before analysis
- Caching: Stores recent results

### Performance
- Sub-second capture time
- 2-4 second analysis time
- Minimal memory usage
- Efficient API usage

## Troubleshooting

### Camera Not Starting
- **Check Permissions**: Allow camera access in browser
- **Check Device**: Ensure camera is working
- **Try Different Browser**: Some browsers have better camera support

### Scanning Not Stopping
- **Check Image Quality**: Ensure leaf is clear and in focus
- **Check Lighting**: Improve lighting conditions
- **Adjust Position**: Center leaf in frame
- **Try Manual Capture**: Use capture button

### Rate Limit Errors
- **Increase Interval**: Use slower scan speed
- **Wait**: System auto-adjusts interval
- **Upgrade Plan**: Higher plans have higher limits

### Poor Detection Accuracy
- **Enable Auto-Crop**: Improves focus on leaf
- **Better Lighting**: Use natural or bright light
- **Steady Camera**: Reduce motion blur
- **Clear Background**: Remove distractions

## API Usage

### Endpoints Used
- `POST /api/disease-detection` - Main analysis endpoint
- Rate limited based on subscription plan

### Request Flow
1. Capture image from camera
2. Apply auto-crop (if enabled)
3. Check for duplicate
4. Send to API for analysis
5. Display result
6. Stop if disease/healthy found

### Rate Limits
- **Free**: 30 requests/minute
- **Basic**: 60 requests/minute
- **Premium**: 120 requests/minute
- **Enterprise**: 300 requests/minute

## Privacy & Security

- ✅ Camera feed stays on device
- ✅ Only analyzed images sent to server
- ✅ No video recording
- ✅ Images deleted after analysis (optional)
- ✅ Secure HTTPS connection

## Keyboard Shortcuts

- **Space**: Start/Stop scanning
- **C**: Capture now
- **Esc**: Exit to dashboard
- **R**: Resume scanning (when stopped)

## Mobile Support

- ✅ Works on iOS and Android
- ✅ Responsive design
- ✅ Touch controls
- ✅ Front and rear camera support
- ✅ Optimized for mobile networks

## Future Enhancements

Planned features:
- [ ] Batch scanning mode
- [ ] Offline detection
- [ ] Custom confidence thresholds
- [ ] Export scan history
- [ ] Multi-leaf detection
- [ ] AR overlay guides

---

**Last Updated:** 2026-04-21
**Feature Status:** ✅ Fully Operational
