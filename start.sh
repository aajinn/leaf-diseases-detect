#!/bin/bash
# ============================================
# Leaf Disease Detection - Quick Start
# ============================================

echo ""
echo "========================================"
echo " Starting Leaf Disease Detection System"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[ERROR] Virtual environment not found"
    echo "Please run ./setup.sh first"
    echo ""
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env exists
if [ ! -f .env ]; then
    echo "[WARNING] .env file not found"
    echo "Please run ./setup.sh first or create .env manually"
    echo ""
    exit 1
fi

# Start the FastAPI server
echo "Starting FastAPI server..."
echo ""
echo "Server will be available at:"
echo "  - Web App: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Admin Panel: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
