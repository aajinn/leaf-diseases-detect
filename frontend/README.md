# Frontend - Leaf Disease Detection System

## Overview

Modern, responsive web interface built with HTML, Tailwind CSS, and vanilla JavaScript.

## Features

- **Landing Page** - Marketing page with features and benefits
- **User Authentication** - Register and login pages
- **Dashboard** - Upload images and analyze diseases
- **History** - View all past analyses with detailed results
- **Animated Background** - Dynamic leaf and bacteria particles with collision effects
- **Theme System** - Color themes that change based on page state
- **Text-to-Speech** - Voice announcements for analysis results
- **PDF Export** - Download analysis reports as PDF
- **Custom Notifications** - Toast and modal notifications
- **Responsive Design** - Works on desktop, tablet, and mobile

## Pages

### 1. index.html - Landing Page
- Hero section with call-to-action
- Feature highlights
- How it works section
- Statistics showcase

### 2. register.html - User Registration
- Create new account
- Form validation
- Error handling

### 3. login.html - User Login
- Sign in to existing account
- Remember me option
- Redirect to dashboard

### 4. dashboard.html - Main Application
- Drag & drop image upload
- Real-time analysis
- Results display with symptoms, causes, and treatment
- Quick stats sidebar
- Recent activity feed

### 5. history.html - Analysis History
- List all past analyses
- View detailed results
- Delete records
- Filter and search (coming soon)

### 6. live-detection.html - Live Camera Detection
- Real-time camera feed
- Multiple detection modes (manual, auto, real-time)
- Continuous monitoring
- Detection history
- Session statistics
- Visual feedback

## JavaScript Modules

### js/auth.js
- Authentication functions (register, login, logout)
- Token management
- API communication
- Auth guards for protected pages

### js/dashboard.js
- File upload handling
- Image preview
- Disease analysis
- Results display
- Stats loading

### js/history.js
- Load analysis history
- Display records
- View details modal
- Delete functionality

### js/animated-background.js
- Canvas-based particle animation
- Leaf and bacteria particles
- Collision detection and physics
- Dynamic theme system
- Performance optimization

### js/text-to-speech.js
- Web Speech API integration
- Analysis result announcements
- Toggle and replay controls
- LocalStorage persistence

### js/pdf-export.js
- Client-side PDF generation
- Professional report formatting
- Image embedding
- Single-page layout

### js/notifications.js
- Toast notifications
- Modal dialogs
- Custom styling
- Animation effects

### js/validation.js
- Form field validation
- Real-time feedback
- Password strength meter
- Email/username validation

### js/session-indicator.js
- Session timeout tracking
- Activity monitoring
- Expiration warnings
- Auto-logout

### js/camera-capture.js
- Camera access and control
- Image capture from video stream
- Front/back camera switching
- Auto-capture mode
- Multi-camera support

### js/live-detection.js
- Continuous disease monitoring
- Multiple detection modes
- Real-time analysis
- Detection history tracking
- Session statistics

### js/leaf-detection.js
- Automatic leaf detection
- Color-based segmentation
- Morphological image processing
- Smart cropping algorithm
- Background removal
- Quality validation

## Setup

### Option 1: Serve with FastAPI (Recommended)

The frontend is automatically served by FastAPI:

```bash
# Start the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Access frontend at:
http://localhost:8000/
```

### Option 2: Serve with Python HTTP Server

```bash
cd frontend
python -m http.server 8080

# Access at:
http://localhost:8080
```

### Option 3: Use Live Server (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Configuration

Update API URL in `js/auth.js`:

```javascript
const API_URL = 'http://localhost:8000';
```

For production, change to your deployed API URL.

## Design System

### Colors
- Primary: `#10b981` (Green)
- Secondary: `#059669` (Dark Green)
- Success: Green shades
- Error: Red shades
- Warning: Yellow shades

### Icons
Font Awesome 6.4.0 (CDN)

### CSS Framework
Tailwind CSS 3.x (CDN)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Features by Page

### Landing Page
✅ Responsive hero section  
✅ Feature cards  
✅ How it works timeline  
✅ Statistics display  
✅ Call-to-action buttons  

### Authentication
✅ Form validation  
✅ Error messages  
✅ Loading states  
✅ Redirect after success  

### Dashboard
✅ Drag & drop upload  
✅ Image preview  
✅ Real-time analysis  
✅ Results visualization  
✅ Quick stats  
✅ Recent activity  

### History
✅ List all analyses  
✅ Detailed view modal  
✅ Delete functionality  
✅ Date/time display  
✅ Status indicators  

## API Integration

All API calls use the authentication token stored in localStorage:

```javascript
headers: {
    'Authorization': `Bearer ${token}`
}
```

### Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get user profile
- `POST /api/disease-detection` - Analyze image
- `GET /api/my-analyses` - Get history
- `GET /api/analyses/{id}` - Get details
- `DELETE /api/analyses/{id}` - Delete record

## Security

- JWT tokens stored in localStorage
- Auth guards on protected pages
- Automatic redirect if not authenticated
- Token included in all API requests

## Customization

### Change Colors

Edit the Tailwind config in each HTML file:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#your-color',
                secondary: '#your-color',
            }
        }
    }
}
```

### Change API URL

Edit `js/auth.js`:

```javascript
const API_URL = 'https://your-api-url.com';
```

## Deployment

### Deploy with Frontend

1. Build your backend
2. Copy `frontend/` folder to deployment
3. Configure static file serving
4. Update API_URL in production

### Deploy Separately

1. Deploy backend to your server
2. Deploy frontend to static hosting (Netlify, Vercel, etc.)
3. Update CORS settings in backend
4. Update API_URL in frontend

## Troubleshooting

### CORS Errors
- Check CORS settings in `app.py`
- Ensure API_URL is correct
- Check browser console for details

### Authentication Issues
- Clear localStorage
- Check token expiration
- Verify API is running

### Upload Issues
- Check file size (max 10MB)
- Verify file type (images only)
- Check network tab for errors

## Camera Capture & Live Detection

### Camera Capture (Dashboard)
Capture leaf images directly from your device camera:
- **Webcam Support**: Use desktop/laptop camera
- **Mobile Camera**: Front and back camera on phones
- **Camera Switching**: Toggle between cameras
- **Auto-Capture**: Automatic capture every 3 seconds
- **Frame Guide**: Visual guide for optimal positioning

### Live Detection Page
Dedicated page for continuous disease monitoring:
- **Manual Mode**: Capture on demand
- **Auto Mode**: Automatic capture every 3 seconds
- **Real-time Mode**: Analyze every frame (experimental)
- **Detection History**: View last 10 detections
- **Session Statistics**: Track scans and results
- **Visual Feedback**: Frame color changes based on detection

See [CAMERA_CAPTURE.md](../docs/features/CAMERA_CAPTURE.md) for detailed documentation.

## Auto-Crop Leaf Detection

Automatically detects and crops leaf regions from images:
- **Color Detection**: Identifies green, yellow, and brown leaves
- **Background Removal**: Removes unnecessary background
- **Smart Cropping**: Focuses on leaf with padding
- **Quality Validation**: Falls back to original if needed
- **Toggle Control**: Enable/disable in settings
- **Client-Side**: No server processing required

### How It Works
1. Analyzes image colors to find leaf regions
2. Uses morphological operations to clean mask
3. Finds largest contiguous leaf region
4. Crops with padding around detected area
5. Validates crop quality before using

### Benefits
- Better detection accuracy
- Faster processing (smaller images)
- Reduced bandwidth usage
- Automatic operation
- No manual cropping needed

See [AUTO_CROP.md](../docs/features/AUTO_CROP.md) for detailed documentation.

## Animated Background System

The application features an immersive animated background with floating leaves and bacteria particles:

### Features
- **Particle Physics**: Realistic collision detection and bouncing
- **Dynamic Themes**: Background color changes based on page state
- **Visual Feedback**: Particles glow when colliding
- **Performance**: Optimized for 60 FPS with minimal CPU usage

### Themes
- **Guest** (Light Blue): Before login pages
- **User** (Light Green): Logged in user pages
- **Admin** (Blue): Admin panel
- **Analyzing** (Yellow/Orange): During image analysis
- **Healthy** (Vibrant Green): No disease detected

### Testing
- `test-animation.html` - Visual test of all themes and animations
- `debug-theme.html` - Debug console with state controls and logging

See [ANIMATED_BACKGROUND.md](../docs/features/ANIMATED_BACKGROUND.md) for detailed documentation.

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Advanced search/filter in history
- [ ] Batch upload
- [x] Export results as PDF ✅
- [ ] Image comparison
- [ ] Mobile app (PWA)
- [x] Real-time notifications ✅
- [ ] User settings page
- [x] Admin dashboard ✅
- [x] Animated background ✅
- [x] Text-to-speech ✅

## Contributing

To add new features:

1. Create new HTML page in `frontend/`
2. Add JavaScript in `js/` folder
3. Update navigation in all pages
4. Test responsiveness
5. Update this README

## License

Same as main project (MIT)
