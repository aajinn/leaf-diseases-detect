# Admin Panel Quick Start Guide

## 🚀 Quick Setup (2 Minutes)

### Step 1: Create Admin User

Run this command:
```cmd
python scripts/create_quick_admin.py
```

**Default Credentials Created:**
- Username: `admin`
- Password: `Admin@123`
- Email: `admin@leafdisease.com`

### Step 2: Start Server

```cmd
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Login

1. Open: `http://localhost:8000/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `Admin@123`
3. Click "Sign In"

### Step 4: Access Admin Panel

After login, click **"Admin Panel"** in the navigation bar or go to:
```
http://localhost:8000/admin
```

---

## 📊 What You Can Do

### Dashboard Overview
- View total users, analyses, API calls, and costs
- See 30-day usage trends
- Monitor API cost breakdown

### User Management
- View all registered users
- See per-user statistics and costs
- Activate/deactivate user accounts

### API Usage Tracking
- Monitor Groq and Perplexity API usage
- Track tokens consumed and costs
- Filter by date range and API type

### API Configuration
- Update Groq API key
- Update Perplexity API key
- View API status and models

---

## 🔐 Security Notes

⚠️ **IMPORTANT**: Change the default password after first login!

1. Login with default credentials
2. Go to your profile (future feature) or create a new admin user
3. Delete or update the default admin account

---

## 🛠️ Alternative Setup Methods

### Method 1: Custom Admin User
```cmd
python scripts/create_admin.py
```
Interactive prompts for custom credentials.

### Method 2: Make Existing User Admin
```cmd
python scripts/make_user_admin.py
```
Converts an existing user to admin.

---

## 📁 File Organization

```
leaf-diseases-detect/
├── scripts/
│   ├── create_quick_admin.py    # Quick admin creation
│   ├── create_admin.py           # Interactive admin creation
│   └── make_user_admin.py        # Convert user to admin
├── docs/
│   ├── setup/
│   │   └── ADMIN_SETUP.md        # Detailed setup guide
│   └── features/
│       ├── ADMIN_PANEL.md        # Full documentation
│       └── ADMIN_QUICKSTART.md   # This file
├── frontend/
│   ├── admin.html                # Admin panel UI
│   └── js/
│       └── admin.js              # Admin panel logic
└── src/
    ├── routes/
    │   └── admin.py              # Admin API endpoints
    ├── database/
    │   └── admin_models.py       # Admin data models
    └── utils/
        └── usage_tracker.py      # API usage tracking
```

---

## 🐛 Troubleshooting

### "Access denied. Admin privileges required."
```cmd
python scripts/make_user_admin.py
```
Enter your username to grant admin access.

### "Admin Panel" link not showing
1. Logout and login again
2. Clear browser cache
3. Check if `is_admin: true` in database

### MongoDB connection error
```cmd
python check_mongodb.py
```
Verify MongoDB is running.

---

## 📚 More Information

- **Full Documentation**: `docs/features/ADMIN_PANEL.md`
- **Detailed Setup**: `docs/setup/ADMIN_SETUP.md`
- **API Endpoints**: See admin.py for all available endpoints

---

## ✅ Checklist

- [ ] MongoDB is running
- [ ] Admin user created
- [ ] Server is running
- [ ] Logged in as admin
- [ ] Admin panel accessible
- [ ] Default password changed
- [ ] API keys configured
