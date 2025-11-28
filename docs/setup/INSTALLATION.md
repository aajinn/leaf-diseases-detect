# Installation Guide

## Prerequisites

- Python 3.8 or higher
- MongoDB (local or cloud)
- Groq API key

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/shukur-alom/leaf-diseases-detect.git
cd leaf-diseases-detect
```

### 2. Run Setup Script
```bash
python setup.py
```

This will:
- Create necessary directories
- Generate .env file with SECRET_KEY
- Check for missing dependencies

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Edit `.env` file and set:
```env
GROQ_API_KEY=your_actual_groq_api_key
MONGODB_URL=mongodb://localhost:27017
```

### 5. Start MongoDB

**Windows:**
```bash
mongod
```

**Linux/macOS:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 6. Create Admin User
```bash
python scripts/create_admin.py
```

### 7. Start Application
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 8. Verify Installation

Open browser and visit:
- http://localhost:8000 - API info
- http://localhost:8000/docs - Interactive API docs

## Testing

Run the test suite:
```bash
python test_auth.py
```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If connection fails, check MONGODB_URL in .env
```

### Missing Dependencies
```bash
# Reinstall all dependencies
pip install --upgrade -r requirements.txt
```

### Permission Issues
```bash
# Windows
icacls storage /grant Users:F /T

# Linux/macOS
chmod -R 755 storage
```

## Next Steps

- Read QUICKSTART.md for usage guide
- Read README_AUTH.md for detailed documentation
- Test API endpoints at http://localhost:8000/docs

## Support

For issues and questions:
- GitHub Issues: https://github.com/shukur-alom/leaf-diseases-detect/issues
- Documentation: README_AUTH.md
