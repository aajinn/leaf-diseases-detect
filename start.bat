@echo off
setlocal EnableDelayedExpansion

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

REM Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found
    echo Please run setup.bat first or create .env manually
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo [+] Virtual environment activated
echo.
echo Server will be available at:
echo   - Web App:    http://localhost:8000
echo   - API Docs:   http://localhost:8000/docs
echo   - Admin:      http://localhost:8000/admin
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start uvicorn and capture its PID
start /B "" uvicorn src.app:app --reload --host 0.0.0.0 --port 8000

REM Wait a moment for the server to start
timeout /t 2 /nobreak >nul

REM Get the PID of the uvicorn process
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list ^| findstr "PID:"') do (
    set PYTHON_PID=%%a
)

echo [+] Server started (PID: !PYTHON_PID!)
echo.

REM Keep the window open and wait for user to press any key to stop
echo Press any key to STOP the server and exit...
pause >nul

REM ============================================
REM Cleanup: Kill all related processes
REM ============================================
echo.
echo [*] Stopping server...

REM Kill uvicorn and all child Python processes on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Killing process on port 8000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any remaining uvicorn processes
taskkill /F /IM "uvicorn.exe" >nul 2>&1

REM Kill Python processes running uvicorn (by command line match)
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list ^| findstr "PID:"') do (
    wmic process where "ProcessId=%%a" get CommandLine 2>nul | findstr /i "uvicorn" >nul
    if !errorlevel! == 0 (
        echo [*] Killing Python/uvicorn process (PID: %%a)
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat >nul 2>&1

echo [+] Server stopped
echo [+] Virtual environment deactivated
echo.
echo ========================================
echo  Leaf Disease Detection System Stopped
echo ========================================
echo.

endlocal
exit /b 0
