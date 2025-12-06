#!/bin/bash
# Bash script to run all CI checks locally before pushing
# Run this script: ./scripts/run-ci-checks.sh

set -e

echo "========================================"
echo "Running CI/CD Checks Locally"
echo "========================================"
echo ""

failed=0

# 1. Code Formatting Check (Black)
echo "1. Checking code formatting with Black..."
if black --check --diff . --exclude '/(\.git|\.venv|venv|__pycache__|node_modules|build|dist)/' --extend-exclude 'Leaf Disease'; then
    echo "✅ Black formatting check passed!"
else
    echo "❌ Black formatting check failed!"
    echo "   Run: black . --exclude '/(\.git|\.venv|venv|__pycache__|node_modules|build|dist)/' --extend-exclude 'Leaf Disease'"
    failed=1
fi
echo ""

# 2. Import Sorting Check (isort)
echo "2. Checking import sorting with isort..."
if isort --check-only --diff . --skip-gitignore --extend-skip 'Leaf Disease'; then
    echo "✅ isort check passed!"
else
    echo "❌ isort check failed!"
    echo "   Run: isort . --skip-gitignore --extend-skip 'Leaf Disease'"
    failed=1
fi
echo ""

# 3. Flake8 Critical Errors
echo "3. Checking for critical errors with flake8..."
if flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=.git,.venv,venv,__pycache__,node_modules,build,dist; then
    echo "✅ No critical errors found!"
else
    echo "❌ Flake8 critical errors found!"
    failed=1
fi
echo ""

# 4. Flake8 Style Warnings
echo "4. Checking style warnings with flake8..."
flake8 . --count --exit-zero --max-complexity=15 --max-line-length=127 --statistics --exclude=.git,.venv,venv,__pycache__,node_modules,build,dist
echo "✅ Style check completed (warnings are informational)"
echo ""

# 5. Run Tests
echo "5. Running tests..."
if [ -d "tests" ]; then
    if pytest tests/ -v --cov=src --cov-report=term -m "not manual"; then
        echo "✅ All tests passed!"
    else
        echo "❌ Tests failed!"
        failed=1
    fi
else
    echo "⚠️  No tests directory found"
fi
echo ""

# 6. Import Check
echo "6. Checking FastAPI app imports..."
if python -c "import sys; sys.path.insert(0, 'src'); from app import app; print('✓ FastAPI app imports successfully')"; then
    echo "✅ Import check passed!"
else
    echo "❌ Import check failed!"
    failed=1
fi
echo ""

# Summary
echo "========================================"
echo "CI/CD Checks Summary"
echo "========================================"

if [ $failed -eq 1 ]; then
    echo "❌ Some checks failed! Please fix the issues before pushing."
    echo ""
    echo "Quick fixes:"
    echo "  - Format code: black . --exclude '/(\.git|\.venv|venv|__pycache__|node_modules|build|dist)/' --extend-exclude 'Leaf Disease'"
    echo "  - Sort imports: isort . --skip-gitignore --extend-skip 'Leaf Disease'"
    echo ""
    exit 1
else
    echo "✅ All checks passed! Safe to push."
    echo ""
    exit 0
fi
