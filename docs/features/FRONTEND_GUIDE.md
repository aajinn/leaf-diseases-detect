# Frontend Access Guide

## 🌐 Accessing the Application

The frontend is now served at the **root path** of your application.

### URLs

When running locally on port 8000:

- **Landing Page**: http://localhost:8000/
- **Register**: http://localhost:8000/register
- **Login**: http://localhost:8000/login
- **Dashboard**: http://localhost:8000/dashboard
- **History**: http://localhost:8000/history

### API Endpoints

API endpoints are still accessible:

- **API Info**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/docs
- **Auth Endpoints**: http://localhost:8000/auth/*
- **Protected Endpoints**: http://localhost:8000/api/*

## 🚀 Quick Start

### 1. Start MongoDB
```bash
mongod
```

### 2. Start the Server
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 3. Open Browser
Navigate to: **http://localhost:8000/**

## 📱 User Flow

### New User
1. Visit http://localhost:8000/
2. Click "Get Started" or "Register"
3. Fill in registration form
4. Login with credentials
5. Upload leaf image on dashboard
6. View results and history

### Existing User
1. Visit http://localhost:8000/login
2. Enter credentials
3. Access dashboard
4. Upload images and view history

## 🔧 Configuration

### Change API URL (for production)

Edit `frontend/js/auth.js`:
```javascript
const API_URL = 'https://your-production-api.com';
```

### Change Port

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 3000
```

Then access at: http://localhost:3000/

## 📂 File Structure

```
frontend/
├── index.html          # Landing page (/)
├── register.html       # Registration (/register)
├── login.html          # Login (/login)
├── dashboard.html      # Dashboard (/dashboard)
├── history.html        # History (/history)
├── js/
│   ├── auth.js        # Authentication logic
│   ├── dashboard.js   # Dashboard functionality
│   └── history.js     # History page logic
└── README.md          # Frontend documentation
```

## 🎨 Features

### Landing Page (/)
- Hero section with call-to-action
- Feature highlights
- How it works
- Statistics
- Responsive design

### Register (/register)
- User registration form
- Email validation
- Password confirmation
- Error handling

### Login (/login)
- User authentication
- Remember me option
- Redirect to dashboard

### Dashboard (/dashboard)
- Drag & drop image upload
- Real-time disease analysis
- Results with symptoms, causes, treatment
- Quick stats sidebar
- Recent activity

### History (/history)
- List all past analyses
- View detailed results
- Delete records
- Filter by status

## 🔐 Authentication

All protected pages (dashboard, history) require authentication:
- Token stored in localStorage
- Automatic redirect to login if not authenticated
- Token included in all API requests

## 🌍 Production Deployment

### Option 1: Deploy Together
```bash
# Backend and frontend together
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Option 2: Deploy Separately
1. Deploy backend to your server
2. Deploy frontend to static hosting (Netlify, Vercel)
3. Update API_URL in frontend/js/auth.js
4. Configure CORS in backend

## 🐛 Troubleshooting

### Frontend not loading
- Check if `frontend/` directory exists
- Verify server is running
- Check browser console for errors

### API calls failing
- Verify API_URL in auth.js
- Check CORS settings in app.py
- Ensure backend is running

### Authentication issues
- Clear localStorage
- Check token expiration (30 min default)
- Verify credentials

## 📊 Testing

### Test Landing Page
```bash
curl http://localhost:8000/
```

### Test API
```bash
curl http://localhost:8000/api
```

### Test Authentication
1. Register at /register
2. Login at /login
3. Access /dashboard (should work)
4. Logout and try /dashboard (should redirect to /login)

## 🎯 Next Steps

1. ✅ Frontend served at root path
2. ✅ All navigation updated
3. ✅ Authentication working
4. ✅ API endpoints accessible

Ready to use! Visit http://localhost:8000/ to get started.

## 📞 Support

- Frontend Docs: `frontend/README.md`
- API Docs: http://localhost:8000/docs
- Auth Guide: `README_AUTH.md`
- Quick Start: `QUICKSTART.md`
