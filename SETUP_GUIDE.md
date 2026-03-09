# 🚀 One-Time Setup Guide

This guide will help you set up the Leaf Disease Detection System from scratch.

## 📋 Prerequisites

Before running the setup, ensure you have:

1. **Python 3.8+** installed ([Download](https://www.python.org/downloads/))
   - ✅ Check "Add Python to PATH" during installation
   - Verify: `python --version`

2. **Node.js & npm** (optional, for Tailwind CSS) ([Download](https://nodejs.org/))
   - Verify: `node --version` and `npm --version`

3. **MongoDB Atlas** (cloud database)
   - Create account: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
   - Get your connection string

4. **Groq API Key** ([Get free key](https://console.groq.com/))

## 🪟 Windows Setup

### Step 1: Run Setup Script

```cmd
setup.bat
```

This will:
- ✅ Check Python, Node.js, and MongoDB
- ✅ Create virtual environment
- ✅ Install all Python dependencies
- ✅ Install Node.js dependencies (Tailwind CSS)
- ✅ Create `.env` and `.env.razorpay` files
- ✅ Initialize subscription plans
- ✅ Create admin user (admin/Admin@123)

### Step 2: Configure Environment

Edit `.env` file and add your API keys:

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
PERPLEXITY_API_KEY=pplx_your_key_here  # Optional
```

Edit `.env.razorpay` for payment integration (optional):

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_here
```

### Step 3: Start Application

```cmd
start.bat
```

Access at:
- 🌐 Web App: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs
- 👤 Admin Panel: http://localhost:8000/admin

## 🐧 Linux/macOS Setup

### Step 1: Make Scripts Executable

```bash
chmod +x setup.sh start.sh
```

### Step 2: Run Setup Script

```bash
./setup.sh
```

This will:
- ✅ Check Python, Node.js, and MongoDB
- ✅ Create virtual environment
- ✅ Install all Python dependencies
- ✅ Install Node.js dependencies (Tailwind CSS)
- ✅ Create `.env` and `.env.razorpay` files
- ✅ Initialize subscription plans
- ✅ Create admin user (admin/Admin@123)

### Step 3: Configure Environment

Edit `.env` file and add your API keys:

```bash
nano .env  # or use your preferred editor
```

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
PERPLEXITY_API_KEY=pplx_your_key_here  # Optional
```

### Step 4: Start Application

```bash
./start.sh
```

Access at:
- 🌐 Web App: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs
- 👤 Admin Panel: http://localhost:8000/admin

## 🔧 Manual Setup (Alternative)

If the automated scripts don't work, follow these steps:

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate.bat

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install Python packages
pip install -r requirements.txt

# Install Node.js packages (optional)
npm install
npm run build-css
```

### 3. Create Configuration Files

Create `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=leaf_disease_db
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
MODEL_NAME=meta-llama/llama-4-scout-17b-16e-instruct
DEFAULT_TEMPERATURE=0.3
DEFAULT_MAX_TOKENS=1024
```

Create `.env.razorpay`:

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_test_key_secret_here
```

### 4. Initialize Database

```bash
# Initialize subscription plans
python scripts/initialize_subscription_plans.py

# Create admin user
python scripts/create_quick_admin.py
```

### 5. Start Server

```bash
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

## 🔑 Default Admin Credentials

After setup, use these credentials to access the admin panel:

- **Username**: `admin`
- **Password**: `Admin@123`
- **Email**: `admin@leafdisease.com`

⚠️ **Change the password after first login!**

## 📦 What Gets Installed

### Python Packages (requirements.txt)
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `groq` - AI inference
- `motor` - MongoDB async driver
- `pymongo` - MongoDB driver
- `python-jose` - JWT authentication
- `bcrypt` - Password hashing
- `razorpay` - Payment gateway
- `perplexityai` - YouTube recommendations
- And more...

### Node.js Packages (package.json)
- `tailwindcss` - CSS framework

## 🗄️ MongoDB Atlas Setup

This project uses MongoDB Atlas (cloud database):

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free M0 tier available)
3. Create database user (username/password)
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get connection string from "Connect" → "Connect your application"
6. Update `.env`:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   ```

## 🚨 Troubleshooting

### Python not found
- Install Python 3.8+ from python.org
- Ensure "Add to PATH" was checked during installation
- Restart terminal/command prompt

### MongoDB connection failed
- Verify MONGODB_URL in `.env` is correct
- Check MongoDB Atlas cluster is running
- Ensure IP address is whitelisted in Atlas
- Verify database user credentials

### Permission denied (Linux/macOS)
```bash
chmod +x setup.sh start.sh
```

### Port 8000 already in use
```bash
# Use different port
uvicorn src.app:app --reload --port 8001
```

### Virtual environment activation fails
```bash
# Windows - try PowerShell
venv\Scripts\Activate.ps1

# Linux/macOS
source venv/bin/activate
```

## 📚 Next Steps

After setup:

1. ✅ Login at http://localhost:8000/login
2. ✅ Access admin panel at http://localhost:8000/admin
3. ✅ Test disease detection at http://localhost:8000/dashboard
4. ✅ Check API docs at http://localhost:8000/docs
5. ✅ Configure subscription plans if needed

## 🔄 Updating the Application

```bash
# Activate virtual environment
# Windows: venv\Scripts\activate.bat
# Linux/macOS: source venv/bin/activate

# Pull latest changes
git pull

# Update dependencies
pip install -r requirements.txt

# Rebuild Tailwind CSS (if needed)
npm run build-css

# Restart server
```

## 📞 Support

If you encounter issues:

1. Check [README.md](README.md) for detailed documentation
2. Review [GitHub Issues](https://github.com/shukur-alom/leaf-diseases-detect/issues)
3. Check MongoDB connection and API keys
4. Ensure all dependencies are installed

---

**🌱 Happy Disease Detection! 🌱**
