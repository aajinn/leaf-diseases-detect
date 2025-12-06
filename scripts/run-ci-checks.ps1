# PowerShell script to run all CI checks locally before pushing
# Run this script: .\scripts\run-ci-checks.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running CI/CD Checks Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$failed = $false

# 1. Code Formatting Check (Black)
Write-Host "1. Checking code formatting with Black..." -ForegroundColor Yellow
black --check --diff . --exclude '/(\.git|\.venv|venv|__pycache__|node_modules|build|dist)/' --extend-exclude 'Leaf Disease'
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Black formatting check failed!" -ForegroundColor Red
    Write-Host "   Run: black . --exclude '/(\.git|\.venv|venv|__pycache__|node_modules|build|dist)/' --extend-exclude 'Leaf Disease'" -ForegroundColor Yellow
    $failed = $true
} else {
    Write-Host "✅ Black formatting check passed!" -ForegroundColor Green
}
Write-Host ""

# 2. Import Sorting Check (isort)
Write-Host "2. Checking import sorting with isort..." -ForegroundColor Yellow
isort --check-only --diff . --skip-gitignore --extend-skip 'Leaf Disease'
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ isort check failed!" -ForegroundColor Red
    Write-Host "   Run: isort . --skip-gitignore --extend-skip 'Leaf Disease'" -ForegroundColor Yellow
    $failed = $true
} else {
    Write-Host "✅ isort check passed!" -ForegroundColor Green
}
Write-Host ""

# 3. Flake8 Critical Errors
Write-Host "3. Checking for critical errors with flake8..." -ForegroundColor Yellow
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics --exclude=.git,.venv,venv,__pycache__,node_modules,build,dist
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Flake8 critical errors found!" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ No critical errors found!" -ForegroundColor Green
}
Write-Host ""

# 4. Flake8 Style Warnings
Write-Host "4. Checking style warnings with flake8..." -ForegroundColor Yellow
flake8 . --count --exit-zero --max-complexity=15 --max-line-length=127 --statistics --exclude=.git,.venv,venv,__pycache__,node_modules,build,dist
Write-Host "✅ Style check completed (warnings are informational)" -ForegroundColor Green
Write-Host ""

# 5. Run Tests
Write-Host "5. Running tests..." -ForegroundColor Yellow
if (Test-Path "tests") {
    pytest tests/ -v --cov=src --cov-report=term -m "not manual"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests failed!" -ForegroundColor Red
        $failed = $true
    } else {
        Write-Host "✅ All tests passed!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No tests directory found" -ForegroundColor Yellow
}
Write-Host ""

# 6. Import Check
Write-Host "6. Checking FastAPI app imports..." -ForegroundColor Yellow
python -c "import sys; sys.path.insert(0, 'src'); from app import app; print('✓ FastAPI app imports successfully')"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Import check failed!" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Import check passed!" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CI/CD Checks Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($failed) {
    Write-Host "❌ Some checks failed! Please fix the issues before pushing." -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Yellow
    Write-Host "  - Format code: black . --exclude '/(\.git|\.venv|venv|__pycache__|node_modules|build|dist)/' --extend-exclude 'Leaf Disease'" -ForegroundColor White
    Write-Host "  - Sort imports: isort . --skip-gitignore --extend-skip 'Leaf Disease'" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ All checks passed! Safe to push." -ForegroundColor Green
    Write-Host ""
    exit 0
}
