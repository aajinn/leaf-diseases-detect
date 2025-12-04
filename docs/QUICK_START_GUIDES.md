# Quick Start Guides

This document consolidates all quick start guides for various features.

## 📋 Table of Contents

1. [Admin Panel Quick Start](#admin-panel-quick-start)
2. [Camera Capture Quick Start](#camera-capture-quick-start)
3. [Live Detection Quick Start](#live-detection-quick-start)

---

## Admin Panel Quick Start

### 🚀 Quick Setup (2 Minutes)

#### Step 1: Create Admin User

```cmd
python scripts/create_quick_admin.py
```

**Default Credentials:**
- Username: `admin`
- Password: `Admin@123`
- Email: `admin@leafdisease.com`

#### Step 2: Start Server

```cmd
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

#### Step 3: Access Admin Panel

1. Login at `http://localhost:8000/login`
2. Click "Admin Panel" in navigation
3. Or go to `http://localhost:8000/admin`

### 📊 Admin Features

- View system statistics and trends
- Manage users and permissions
- Monitor API usage and costs
- Configure API keys

⚠️ **Remember to change the default password after first login!**

---

## Camera Capture Quick Start

### Option 1: Quick Capture (Dashboard)

Perfect for single image analysis.

1. **Open Camera**
   - Click "Use Camera" button on dashboard
   - Allow camera access when prompted

2. **Capture & Analyze**
   - Position leaf within frame guide
   - Click "Capture Photo"
   - Results appear automatically

### Option 2: Live Detection

Perfect for scanning multiple leaves.

1. **Start Live Detection**
   - Click "Live Detection" from dashboard
   - Allow camera access

2. **Choose Mode**
   - **Manual**: Click to capture
   - **Auto**: Captures every 3-15 seconds
   - **Real-time**: Continuous analysis

### Tips for Best Results

**Lighting:**
- ✅ Use natural daylight
- ✅ Avoid harsh shadows
- ❌ Don't use in darkness

**Positioning:**
- ✅ Fill frame with leaf
- ✅ Hold 6-12 inches away
- ✅ Keep camera steady

---

## Live Detection Quick Start

### Full-Screen Scanning Interface

1. **Start Scanning**
   ```
   Dashboard → Live Detection → Start Scanning
   ```

2. **Configure Settings**
   - **Scan Interval**: 3s, 5s, 10s, or 15s (default: 5s)
   - **Auto-Crop**: Enable for better accuracy
   - **Camera**: Switch front/back

3. **Monitor Results**
   - Frame color indicates status (green/yellow/red)
   - Results overlay shows disease info
   - Scan counter tracks progress

### Scan Interval Recommendations

| Interval | API Calls/Hour | Best For |
|----------|----------------|----------|
| 3s (Fast) | ~1200 | Quick screening |
| 5s (Normal) | ~720 | General monitoring ⭐ |
| 10s (Slow) | ~360 | Long sessions |
| 15s (Very Slow) | ~240 | Background monitoring |

### Detection Modes

**Manual Mode**
- You control when to capture
- Most accurate for detailed analysis

**Auto Mode** (Recommended)
- Captures at set intervals
- Good for multiple plants
- Moderate API usage

**Real-time Mode**
- Fastest detection
- Higher API usage
- Best for quick checks

---

## Troubleshooting

### Camera Won't Start

1. Check browser permissions
2. Ensure HTTPS connection
3. Try different browser
4. Restart device

### Poor Image Quality

1. Improve lighting
2. Hold camera steady
3. Clean camera lens
4. Move closer to leaf

### Slow Performance

1. Reduce scan frequency
2. Disable auto-crop temporarily
3. Check internet connection
4. Close other apps

---

## Browser Compatibility

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ (iOS 11+) |
| Edge | ✅ | ✅ |

---

## Privacy & Security

**What We Access:**
- ✅ Camera for image capture only
- ✅ Captured images for analysis

**What We DON'T Do:**
- ❌ Record video
- ❌ Store camera feed
- ❌ Share images with third parties

---

## More Information

- **Full Camera Documentation**: [features/CAMERA_CAPTURE.md](features/CAMERA_CAPTURE.md)
- **Admin Panel Guide**: [features/ADMIN_PANEL.md](features/ADMIN_PANEL.md)
- **Live Detection Details**: [LIVE_DETECTION_SUMMARY.md](LIVE_DETECTION_SUMMARY.md)
- **Main Setup Guide**: [setup/QUICKSTART.md](setup/QUICKSTART.md)

---

**Last Updated**: December 4, 2024
