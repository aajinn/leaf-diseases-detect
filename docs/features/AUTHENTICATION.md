# Authentication & Database Setup Guide

## Overview

The Leaf Disease Detection System now includes:
- **User Authentication** with JWT tokens
- **MongoDB** for user and analysis data storage
- **Role-based Access Control** (Admin/User roles)
- **Local Image Storage** with user-specific directories
- **Analysis History** tracking for all users

## Architecture Changes

### New Components

1. **Authentication System** (`auth/`)
   - `security.py` - Password hashing, JWT token generation
   - `routes.py` - Registration, login, user management endpoints

2. **Database Layer** (`database/`)
   - `connection.py` - MongoDB connection manager
   - `models.py` - Pydantic models for users and analysis records

3. **Storage System** (`storage/`)
   - `image_storage.py` - Local file storage manager

4. **Protected Routes** (`routes/`)
   - `disease_detection.py` - Authenticated disease detection endpoints

## Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "username": "username",
  "full_name": "Full Name",
  "hashed_password": "bcrypt_hash",
  "is_active": true,
  "is_admin": false,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### Analysis Records Collection
```json
{
  "_id": "ObjectId",
  "user_id": "user_object_id",
  "username": "username",
  "image_filename": "20240101_120000_abc123.jpg",
  "image_path": "storage/uploads/username/20240101_120000_abc123.jpg",
  "disease_detected": true,
  "disease_name": "Brown Spot Disease",
  "disease_type": "fungal",
  "severity": "moderate",
  "confidence": 87.5,
  "symptoms": ["symptom1", "symptom2"],
  "possible_causes": ["cause1", "cause2"],
  "treatment": ["treatment1", "treatment2"],
  "analysis_timestamp": "2024-01-01T12:00:00"
}
```

## Setup Instructions

### 1. Install MongoDB

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Or use Chocolatey
choco install mongodb
```

**Linux:**
```bash
sudo apt-get install mongodb
```

**macOS:**
```bash
brew install mongodb-community
```

### 2. Start MongoDB
```bash
# Start MongoDB service
mongod

# Or as a service
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb-community
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy example env file
copy .env.example .env

# Edit .env and set:
# - GROQ_API_KEY
# - MONGODB_URL (default: mongodb://localhost:27017)
# - SECRET_KEY (generate with: openssl rand -hex 32)
```

### 5. Create Admin User
```bash
python scripts/create_admin.py
```

Follow the prompts to create your first admin user.

### 6. Start the Application
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Public Endpoints (No Authentication)

**POST /disease-detection-file**
- Legacy endpoint for backward compatibility
- No authentication required
- Does not save images or create records

### Authentication Endpoints

**POST /auth/register**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "Full Name"
}
```

**POST /auth/login**
```
Form data:
- username: your_username
- password: your_password

Returns:
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

**GET /auth/me**
- Requires: `Authorization: Bearer <token>`
- Returns current user profile

### Protected Endpoints (Require Authentication)

**POST /api/disease-detection**
- Upload image for disease detection
- Saves image locally
- Creates analysis record in database
- Requires: `Authorization: Bearer <token>`

**GET /api/my-analyses**
- Get all analysis records for current user
- Query params: `skip`, `limit`
- Requires: `Authorization: Bearer <token>`

**GET /api/analyses/{analysis_id}**
- Get detailed analysis record
- Requires: `Authorization: Bearer <token>`

**DELETE /api/analyses/{analysis_id}**
- Delete analysis record and associated image
- Requires: `Authorization: Bearer <token>`

### Admin Endpoints (Require Admin Role)

**GET /auth/users**
- List all users
- Query params: `skip`, `limit`
- Requires: Admin role

**DELETE /auth/users/{username}**
- Delete a user
- Requires: Admin role

## Usage Examples

### 1. Register a New User
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=password123"
```

### 3. Detect Disease (Authenticated)
```bash
curl -X POST "http://localhost:8000/api/disease-detection" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@path/to/leaf.jpg"
```

### 4. Get My Analysis History
```bash
curl -X GET "http://localhost:8000/api/my-analyses" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## File Storage Structure

```
storage/
└── uploads/
    ├── username1/
    │   ├── 20240101_120000_abc123.jpg
    │   └── 20240101_130000_def456.jpg
    └── username2/
        └── 20240101_140000_ghi789.jpg
```

## Security Features

1. **Password Hashing** - Bcrypt with salt
2. **JWT Tokens** - Secure token-based authentication
3. **Role-Based Access** - Admin and user roles
4. **Token Expiration** - Configurable token lifetime
5. **User Isolation** - Users can only access their own data
6. **Admin Controls** - Admin users can manage all users and data

## Testing

### Test Authentication Flow
```bash
# Run the test script
python test_auth.py
```

### Test with Postman
1. Import the API endpoints from `/docs`
2. Register a user
3. Login to get token
4. Use token in Authorization header for protected endpoints

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Check connection string in .env
MONGODB_URL=mongodb://localhost:27017
```

### JWT Token Issues
```bash
# Generate new secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Update SECRET_KEY in .env
```

### Permission Issues
- Ensure `storage/uploads/` directory is writable
- Check file permissions on Windows/Linux

## Migration from Old Version

The old `/disease-detection-file` endpoint still works without authentication for backward compatibility. New clients should use the authenticated `/api/disease-detection` endpoint for full features.

## Production Deployment

1. **Set strong SECRET_KEY**
2. **Use production MongoDB** (MongoDB Atlas recommended)
3. **Configure CORS** appropriately in `app.py`
4. **Enable HTTPS** for secure token transmission
5. **Set up MongoDB indexes** for performance
6. **Configure backup** for MongoDB and image storage
7. **Use environment variables** for all secrets

## Next Steps

- Implement email verification
- Add password reset functionality
- Implement rate limiting
- Add image compression
- Set up cloud storage (S3, etc.)
- Add analytics dashboard for admins
