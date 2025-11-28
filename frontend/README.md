# Frontend - Leaf Disease Detection System

## Overview

Modern, responsive web interface built with HTML, Tailwind CSS, and vanilla JavaScript.

## Features

- **Landing Page** - Marketing page with features and benefits
- **User Authentication** - Register and login pages
- **Dashboard** - Upload images and analyze diseases
- **History** - View all past analyses with detailed results
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

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Advanced search/filter in history
- [ ] Batch upload
- [ ] Export results as PDF
- [ ] Image comparison
- [ ] Mobile app (PWA)
- [ ] Real-time notifications
- [ ] User settings page
- [ ] Admin dashboard

## Contributing

To add new features:

1. Create new HTML page in `frontend/`
2. Add JavaScript in `js/` folder
3. Update navigation in all pages
4. Test responsiveness
5. Update this README

## License

Same as main project (MIT)
