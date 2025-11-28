@echo off
echo ========================================
echo Leaf Disease Detection - Startup Script
echo ========================================
echo.

echo Checking MongoDB connection...
echo.

echo Starting FastAPI Server...
echo Server will be available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn src.app:app --reload --host 0.0.0.0 --port 8000

pause
