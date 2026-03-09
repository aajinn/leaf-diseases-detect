@echo off
REM ============================================
REM Leaf Disease Detection - Quick Start
REM ============================================

echo.
echo ========================================
echo  Starting Leaf Disease Detection System
echo ========================================
echo.

REM Check if virtual environment exists
if not exist venv (
    echo [ERROR] Virtual environment not found
    echo Please run setup.bat first
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found
    echo Please run setup.bat first or create .env manually
    echo.
    pause
    exit /b 1
)

REM Start the FastAPI server
echo Starting FastAPI server...
echo.
echo Server will be available at:
echo   - Web App: http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo   - Admin Panel: http://localhost:8000/admin
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
