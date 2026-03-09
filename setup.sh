#!/bin/bash
# ============================================
# Leaf Disease Detection - One-Time Setup
# ============================================

echo ""
echo "========================================"
echo " Leaf Disease Detection System Setup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo ""
    echo "Please install Python 3.8+ from https://www.python.org/downloads/"
    echo "Or use your package manager:"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip python3-venv"
    echo "  macOS: brew install python3"
    echo ""
    exit 1
fi

echo "[OK] Python found"
python3 --version
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[WARNING] Node.js not found - Tailwind CSS build will not be available"
    echo "Install from https://nodejs.org/ if you need to modify frontend styles"
    echo ""
    NODE_AVAILABLE=0
else
    echo "[OK] Node.js found"
    node --version
    NODE_AVAILABLE=1
fi
echo ""

echo "[INFO] MongoDB connection will be tested after .env configuration"
echo ""

# Create virtual environment
echo "========================================"
echo "Creating Python virtual environment..."
echo "========================================"
if [ -d "venv" ]; then
    echo "[INFO] Virtual environment already exists, skipping creation"
else
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        exit 1
    fi
    echo "[OK] Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to activate virtual environment"
    exit 1
fi
echo "[OK] Virtual environment activated"
echo ""

# Upgrade pip
echo "========================================"
echo "Upgrading pip..."
echo "========================================"
python -m pip install --upgrade pip
echo ""

# Install Python dependencies
echo "========================================"
echo "Installing Python dependencies..."
echo "========================================"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Python dependencies"
    exit 1
fi
echo "[OK] Python dependencies installed"
echo ""

# Install Node.js dependencies if available
if [ $NODE_AVAILABLE -eq 1 ]; then
    echo "========================================"
    echo "Installing Node.js dependencies..."
    echo "========================================"
    npm install
    if [ $? -ne 0 ]; then
        echo "[WARNING] Failed to install Node.js dependencies"
    else
        echo "[OK] Node.js dependencies installed"
        echo ""
        echo "Building Tailwind CSS..."
        npm run build-css
        echo "[OK] Tailwind CSS built"
    fi
    echo ""
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "========================================"
    echo "Creating .env configuration file..."
    echo "========================================"
    cat > .env << 'EOF'
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Perplexity API Configuration
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# MongoDB Configuration (use your MongoDB Atlas URL)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=leaf_disease_db

# JWT Security Configuration
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Model Configuration
MODEL_NAME=meta-llama/llama-4-scout-17b-16e-instruct
DEFAULT_TEMPERATURE=0.3
DEFAULT_MAX_TOKENS=1024
EOF
    echo "[OK] .env file created"
    echo "[ACTION REQUIRED] Edit .env and add:"
    echo "  - GROQ_API_KEY"
    echo "  - MONGODB_URL (your MongoDB Atlas connection string)"
    echo ""
else
    echo "[INFO] .env file already exists"
    echo ""
fi

# Create .env.razorpay if it doesn't exist
if [ ! -f .env.razorpay ]; then
    echo "Creating .env.razorpay configuration file..."
    cat > .env.razorpay << 'EOF'
# Razorpay Configuration
# Get these from https://dashboard.razorpay.com/

# Test Mode Credentials (for development)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_test_key_secret_here

# Production Credentials (uncomment for production)
# RAZORPAY_KEY_ID=rzp_live_your_key_id_here
# RAZORPAY_KEY_SECRET=your_live_key_secret_here
EOF
    echo "[OK] .env.razorpay file created"
    echo ""
else
    echo "[INFO] .env.razorpay file already exists"
    echo ""
fi

# Initialize subscription plans
echo "========================================"
echo "Initializing subscription plans..."
echo "========================================"
python scripts/initialize_subscription_plans.py
if [ $? -ne 0 ]; then
    echo "[WARNING] Failed to initialize subscription plans"
    echo "This is normal if MongoDB is not running yet"
else
    echo "[OK] Subscription plans initialized"
fi
echo ""

# Create admin user
echo "========================================"
echo "Creating admin user..."
echo "========================================"
python scripts/create_quick_admin.py
if [ $? -ne 0 ]; then
    echo "[WARNING] Failed to create admin user"
    echo "This is normal if MongoDB is not running yet"
    echo "Run 'python scripts/create_quick_admin.py' manually after starting MongoDB"
else
    echo "[OK] Admin user created"
    echo "    Username: admin"
    echo "    Password: Admin@123"
    echo "    Email: admin@leafdisease.com"
fi
echo ""

# Setup complete
echo "========================================"
echo " Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add:"
echo "     - GROQ_API_KEY from https://console.groq.com/"
echo "     - MONGODB_URL (your MongoDB Atlas connection string)"
echo "  2. (Optional) Edit .env.razorpay for payment integration"
echo "  3. Run: ./start.sh"
echo ""
echo "To start the application manually:"
echo "  - Activate venv: source venv/bin/activate"
echo "  - Start server: uvicorn src.app:app --reload --host 0.0.0.0 --port 8000"
echo "  - Access at: http://localhost:8000"
echo ""
