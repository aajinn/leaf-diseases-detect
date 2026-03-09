@echo off
REM ============================================
REM Leaf Disease Detection - One-Time Setup
REM ============================================

echo.
echo ========================================
echo  Leaf Disease Detection System Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
python --version
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js not found - Tailwind CSS build will not be available
    echo Install from https://nodejs.org/ if you need to modify frontend styles
    echo.
    set NODE_AVAILABLE=0
) else (
    echo [OK] Node.js found
    node --version
    set NODE_AVAILABLE=1
)
echo.

echo [INFO] MongoDB connection will be tested after .env configuration
echo.

REM Create virtual environment
echo ========================================
echo Creating Python virtual environment...
echo ========================================
if exist venv (
    echo [INFO] Virtual environment already exists, skipping creation
) else (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated
echo.

REM Upgrade pip
echo ========================================
echo Upgrading pip...
echo ========================================
python -m pip install --upgrade pip
echo.

REM Install Python dependencies
echo ========================================
echo Installing Python dependencies...
echo ========================================
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)
echo [OK] Python dependencies installed
echo.

REM Install Node.js dependencies if available
if %NODE_AVAILABLE%==1 (
    echo ========================================
    echo Installing Node.js dependencies...
    echo ========================================
    call npm install
    if %errorlevel% neq 0 (
        echo [WARNING] Failed to install Node.js dependencies
    ) else (
        echo [OK] Node.js dependencies installed
        echo.
        echo Building Tailwind CSS...
        call npm run build-css
        echo [OK] Tailwind CSS built
    )
    echo.
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo ========================================
    echo Creating .env configuration file...
    echo ========================================
    (
        echo # Groq API Configuration
        echo GROQ_API_KEY=your_groq_api_key_here
        echo.
        echo # Perplexity API Configuration
        echo PERPLEXITY_API_KEY=your_perplexity_api_key_here
        echo.
        echo # MongoDB Configuration ^(use your MongoDB Atlas URL^)
        echo MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
        echo MONGODB_DB_NAME=leaf_disease_db
        echo.
        echo # JWT Security Configuration
        echo SECRET_KEY=your-secret-key-change-in-production
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
        echo.
        echo # Model Configuration
        echo MODEL_NAME=meta-llama/llama-4-scout-17b-16e-instruct
        echo DEFAULT_TEMPERATURE=0.3
        echo DEFAULT_MAX_TOKENS=1024
    ) > .env
    echo [OK] .env file created
    echo [ACTION REQUIRED] Edit .env and add:
    echo   - GROQ_API_KEY
    echo   - MONGODB_URL ^(your MongoDB Atlas connection string^)
    echo.
) else (
    echo [INFO] .env file already exists
    echo.
)

REM Create .env.razorpay if it doesn't exist
if not exist .env.razorpay (
    echo Creating .env.razorpay configuration file...
    (
        echo # Razorpay Configuration
        echo # Get these from https://dashboard.razorpay.com/
        echo.
        echo # Test Mode Credentials ^(for development^)
        echo RAZORPAY_KEY_ID=rzp_test_your_key_id_here
        echo RAZORPAY_KEY_SECRET=your_test_key_secret_here
        echo.
        echo # Production Credentials ^(uncomment for production^)
        echo # RAZORPAY_KEY_ID=rzp_live_your_key_id_here
        echo # RAZORPAY_KEY_SECRET=your_live_key_secret_here
    ) > .env.razorpay
    echo [OK] .env.razorpay file created
    echo.
) else (
    echo [INFO] .env.razorpay file already exists
    echo.
)

REM Initialize subscription plans
echo ========================================
echo Initializing subscription plans...
echo ========================================
python scripts/initialize_subscription_plans.py
if %errorlevel% neq 0 (
    echo [WARNING] Failed to initialize subscription plans
    echo This is normal if MongoDB is not running yet
) else (
    echo [OK] Subscription plans initialized
)
echo.

REM Create admin user
echo ========================================
echo Creating admin user...
echo ========================================
python scripts/create_quick_admin.py
if %errorlevel% neq 0 (
    echo [WARNING] Failed to create admin user
    echo This is normal if MongoDB is not running yet
    echo Run 'python scripts/create_quick_admin.py' manually after starting MongoDB
) else (
    echo [OK] Admin user created
    echo     Username: admin
    echo     Password: Admin@123
    echo     Email: admin@leafdisease.com
)
echo.

REM Setup complete
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env and add:
echo      - GROQ_API_KEY from https://console.groq.com/
echo      - MONGODB_URL ^(your MongoDB Atlas connection string^)
echo   2. ^(Optional^) Edit .env.razorpay for payment integration
echo   3. Run: start.bat
echo.
echo To start the application manually:
echo   - Activate venv: venv\Scripts\activate.bat
echo   - Start server: uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
echo   - Access at: http://localhost:8000
echo.
pause
