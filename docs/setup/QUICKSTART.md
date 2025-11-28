# Quick Start Guide - Authentication Setup

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (if not installed)
# Windows: Download from https://www.mongodb.com/try/download/community
# Linux: sudo apt-get install mongodb
# macOS: brew install mongodb-community

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Use it in .env file

### Step 3: Configure Environment
```bash
# Copy example file
copy .env.example .env

# Edit .env and set these values:
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=generate_with_openssl_rand_hex_32
```

**Generate SECRET_KEY:**
```bash
# Windows PowerShell
python -c "import secrets; print(secrets.token_hex(32))"

# Or use online generator
# https://randomkeygen.com/
```

### Step 4: Create Admin User
```bash
python scripts/create_admin.py
```

Follow the prompts:
- Username: admin
- Email: admin@example.com
- Password: (your secure password)
- Full Name: Admin User

### Step 5: Start the Server
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Test the API

**Open your browser:**
- API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

**Or use curl:**
```bash
# Test registration
curl -X POST "http://localhost:8000/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@test.com\",\"username\":\"testuser\",\"password\":\"test123\",\"full_name\":\"Test User\"}"

# Test login
curl -X POST "http://localhost:8000/auth/login" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=testuser&password=test123"
```

## 📝 What Changed?

### New Features
✅ User registration and login with JWT tokens  
✅ Admin role for user management  
✅ Local image storage (organized by username)  
✅ Analysis history tracking in MongoDB  
✅ Protected API endpoints  
✅ Backward compatible public endpoint  

### New Endpoints

**Authentication:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token
- `GET /auth/me` - Get current user profile

**Protected (Requires Token):**
- `POST /api/disease-detection` - Detect disease (saves image & record)
- `GET /api/my-analyses` - Get your analysis history
- `GET /api/analyses/{id}` - Get specific analysis
- `DELETE /api/analyses/{id}` - Delete analysis

**Admin Only:**
- `GET /auth/users` - List all users
- `DELETE /auth/users/{username}` - Delete user

**Public (No Auth):**
- `POST /disease-detection-file` - Legacy endpoint (still works)

## 🔐 Using Authentication

### 1. Register a User
```bash
curl -X POST "http://localhost:8000/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@example.com\",\"username\":\"myuser\",\"password\":\"mypass123\"}"
```

### 2. Login to Get Token
```bash
curl -X POST "http://localhost:8000/auth/login" ^
  -d "username=myuser&password=mypass123"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Use Token for Protected Endpoints
```bash
curl -X POST "http://localhost:8000/api/disease-detection" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -F "file=@Media/brown-spot-4 (1).jpg"
```

### 4. View Your Analysis History
```bash
curl -X GET "http://localhost:8000/api/my-analyses" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📁 File Structure

```
leaf-diseases-detect/
├── auth/                      # Authentication module
│   ├── __init__.py
│   ├── routes.py             # Auth endpoints
│   └── security.py           # JWT & password handling
├── database/                  # Database module
│   ├── __init__.py
│   ├── connection.py         # MongoDB connection
│   └── models.py             # Pydantic models
├── routes/                    # API routes
│   ├── __init__.py
│   └── disease_detection.py  # Protected endpoints
├── storage/                   # Image storage
│   ├── __init__.py
│   ├── image_storage.py      # File management
│   └── uploads/              # User images (gitignored)
│       └── .gitkeep
├── scripts/                   # Utility scripts
│   ├── __init__.py
│   └── create_admin.py       # Create admin user
├── Leaf Disease/             # AI detection engine
│   ├── main.py
│   └── config.py
├── app.py                    # Main FastAPI app
├── main.py                   # Streamlit frontend
├── utils.py                  # Helper functions
├── requirements.txt          # Dependencies
├── .env.example              # Environment template
├── README_AUTH.md            # Full documentation
└── QUICKSTART.md            # This file
```

## 🧪 Testing

### Run Test Script
```bash
python test_auth.py
```

### Manual Testing with Postman
1. Import endpoints from http://localhost:8000/docs
2. Register a user
3. Login to get token
4. Add token to Authorization header: `Bearer YOUR_TOKEN`
5. Test protected endpoints

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: Could not connect to MongoDB
```
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongosh

# If not, start it
mongod
```

### Import Error
```
ModuleNotFoundError: No module named 'motor'
```
**Solution:** Install dependencies
```bash
pip install -r requirements.txt
```

### JWT Token Error
```
Could not validate credentials
```
**Solution:** 
1. Check if SECRET_KEY is set in .env
2. Make sure token hasn't expired (default: 30 minutes)
3. Login again to get a new token

### Permission Denied (Storage)
```
PermissionError: [Errno 13] Permission denied: 'storage/uploads'
```
**Solution:** Create directory manually
```bash
mkdir -p storage/uploads
```

## 📚 Next Steps

1. **Read Full Documentation:** See `README_AUTH.md` for detailed info
2. **Customize Settings:** Edit `.env` file for your needs
3. **Deploy to Production:** Follow production deployment guide
4. **Add More Features:** Email verification, password reset, etc.

## 💡 Tips

- **Token expires in 30 minutes** - Configure in .env: `ACCESS_TOKEN_EXPIRE_MINUTES=60`
- **Images are stored locally** - In `storage/uploads/{username}/`
- **Admin can see all data** - Regular users only see their own
- **Old endpoint still works** - `/disease-detection-file` for backward compatibility

## 🆘 Need Help?

- Check API docs: http://localhost:8000/docs
- Read full guide: README_AUTH.md
- Check logs: disease_detection.log
- GitHub Issues: https://github.com/shukur-alom/leaf-diseases-detect/issues

---

**Ready to go! 🎉** Your authenticated leaf disease detection system is now running.
