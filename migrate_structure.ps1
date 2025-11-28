# Project Restructure Migration Script
# Run this script to reorganize the project structure

Write-Host "🚀 Starting Project Restructure..." -ForegroundColor Green
Write-Host ""

# Function to move file safely
function Move-FileSafely {
    param($Source, $Destination)
    if (Test-Path $Source) {
        Write-Host "  Moving: $Source -> $Destination" -ForegroundColor Cyan
        Move-Item -Path $Source -Destination $Destination -Force
    } else {
        Write-Host "  ⚠️  Not found: $Source" -ForegroundColor Yellow
    }
}

# Function to copy file safely
function Copy-FileSafely {
    param($Source, $Destination)
    if (Test-Path $Source) {
        Write-Host "  Copying: $Source -> $Destination" -ForegroundColor Cyan
        Copy-Item -Path $Source -Destination $Destination -Force
    } else {
        Write-Host "  ⚠️  Not found: $Source" -ForegroundColor Yellow
    }
}

# 1. Move core application files to src/
Write-Host "📦 Moving core application files..." -ForegroundColor Green
Move-FileSafely "app.py" "src/app.py"
Move-FileSafely "main.py" "src/main.py"
Move-FileSafely "utils.py" "src/utils.py"

# 2. Move auth module
Write-Host "📦 Moving auth module..." -ForegroundColor Green
Move-FileSafely "auth/__init__.py" "src/auth/__init__.py"
Move-FileSafely "auth/routes.py" "src/auth/routes.py"
Move-FileSafely "auth/security.py" "src/auth/security.py"

# 3. Move database module
Write-Host "📦 Moving database module..." -ForegroundColor Green
Move-FileSafely "database/__init__.py" "src/database/__init__.py"
Move-FileSafely "database/connection.py" "src/database/connection.py"
Move-FileSafely "database/models.py" "src/database/models.py"

# 4. Move routes module
Write-Host "📦 Moving routes module..." -ForegroundColor Green
Move-FileSafely "routes/__init__.py" "src/routes/__init__.py"
Move-FileSafely "routes/disease_detection.py" "src/routes/disease_detection.py"

# 5. Move services module
Write-Host "📦 Moving services module..." -ForegroundColor Green
Move-FileSafely "services/__init__.py" "src/services/__init__.py"
Move-FileSafely "services/perplexity_service.py" "src/services/perplexity_service.py"

# 6. Move storage module
Write-Host "📦 Moving storage module..." -ForegroundColor Green
Move-FileSafely "storage/__init__.py" "src/storage/__init__.py"
Move-FileSafely "storage/image_storage.py" "src/storage/image_storage.py"
# Keep uploads folder in place for now (has .gitkeep)

# 7. Move Leaf Disease to core
Write-Host "📦 Moving AI core engine..." -ForegroundColor Green
if (Test-Path "Leaf Disease/main.py") {
    Copy-FileSafely "Leaf Disease/main.py" "src/core/disease_detector.py"
}

# 8. Move test files
Write-Host "📦 Moving test files..." -ForegroundColor Green
Move-FileSafely "test_api.py" "tests/test_api.py"
Move-FileSafely "test_auth.py" "tests/test_auth.py"
Move-FileSafely "test_perplexity.py" "tests/test_perplexity.py"

# 9. Move scripts
Write-Host "📦 Moving scripts..." -ForegroundColor Green
Move-FileSafely "setup.py" "scripts/setup.py"
# scripts/create_admin.py already in place

# 10. Move documentation - Setup guides
Write-Host "📦 Moving setup documentation..." -ForegroundColor Green
Move-FileSafely "QUICKSTART.md" "docs/setup/QUICKSTART.md"
Move-FileSafely "INSTALLATION.md" "docs/setup/INSTALLATION.md"
Move-FileSafely "COMPLETE_SETUP.md" "docs/setup/COMPLETE_SETUP.md"
Move-FileSafely "FINAL_SETUP.md" "docs/setup/FINAL_SETUP.md"
Move-FileSafely "SETUP_COMPLETE.md" "docs/setup/SETUP_COMPLETE.md"

# 11. Move documentation - Feature guides
Write-Host "📦 Moving feature documentation..." -ForegroundColor Green
Move-FileSafely "README_AUTH.md" "docs/features/AUTHENTICATION.md"
Move-FileSafely "FRONTEND_GUIDE.md" "docs/features/FRONTEND_GUIDE.md"
Move-FileSafely "VALIDATION_GUIDE.md" "docs/features/VALIDATION_GUIDE.md"
Move-FileSafely "YOUTUBE_INTEGRATION_GUIDE.md" "docs/features/YOUTUBE_INTEGRATION.md"
Move-FileSafely "YOUTUBE_SETUP_QUICKSTART.md" "docs/features/YOUTUBE_QUICKSTART.md"

# 12. Move documentation - Architecture
Write-Host "📦 Moving architecture documentation..." -ForegroundColor Green
Move-FileSafely "docs/architecture.md" "docs/architecture/architecture.md"
Move-FileSafely "docs/dfd_level0.mmd" "docs/architecture/dfd_level0.mmd"
Move-FileSafely "docs/dfd_level1.mmd" "docs/architecture/dfd_level1.mmd"

# 13. Move documentation - Planning
Write-Host "📦 Moving planning documentation..." -ForegroundColor Green
Move-FileSafely "FEATURE_ENHANCEMENT_PLAN.md" "docs/planning/FEATURE_ENHANCEMENT_PLAN.md"
Move-FileSafely "IMPLEMENTATION_SUMMARY.md" "docs/planning/IMPLEMENTATION_SUMMARY.md"
Move-FileSafely "CHANGES.md" "docs/planning/CHANGES.md"
Move-FileSafely "PROJECT_RESTRUCTURE_PLAN.md" "docs/planning/PROJECT_RESTRUCTURE_PLAN.md"

# 14. Move config files
Write-Host "📦 Moving config files..." -ForegroundColor Green
if (Test-Path ".streamlit") {
    Move-FileSafely ".streamlit" "config/.streamlit"
}
if (Test-Path ".devcontainer") {
    Move-FileSafely ".devcontainer" "config/.devcontainer"
}

# 15. Move test images
Write-Host "📦 Moving test images..." -ForegroundColor Green
if (Test-Path "Media") {
    Get-ChildItem "Media" -File | ForEach-Object {
        Move-FileSafely $_.FullName "assets/test-images/$($_.Name)"
    }
}

# 16. Create __init__.py files
Write-Host "📦 Creating __init__.py files..." -ForegroundColor Green
@(
    "src/__init__.py",
    "src/core/__init__.py",
    "tests/__init__.py"
) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType File -Path $_ -Force | Out-Null
        Write-Host "  Created: $_" -ForegroundColor Cyan
    }
}

# 17. Create docs README
Write-Host "📦 Creating docs README..." -ForegroundColor Green
$docsReadme = @"
# 📚 Documentation Index

Welcome to the Leaf Disease Detection System documentation!

## 🚀 Getting Started

### Quick Setup
- [Quickstart Guide](setup/QUICKSTART.md) - Get up and running in 5 minutes
- [Installation Guide](setup/INSTALLATION.md) - Detailed installation instructions
- [Complete Setup](setup/COMPLETE_SETUP.md) - Full setup walkthrough

### Features
- [Authentication System](features/AUTHENTICATION.md) - User auth and JWT tokens
- [Frontend Guide](features/FRONTEND_GUIDE.md) - Frontend architecture
- [YouTube Integration](features/YOUTUBE_INTEGRATION.md) - Video recommendations
- [YouTube Quickstart](features/YOUTUBE_QUICKSTART.md) - 5-minute YouTube setup
- [Validation Guide](features/VALIDATION_GUIDE.md) - Input validation

### Architecture
- [System Architecture](architecture/architecture.md) - Overall system design
- [Data Flow Diagrams](architecture/) - Level 0 and Level 1 DFDs

### Planning & Development
- [Feature Enhancement Plan](planning/FEATURE_ENHANCEMENT_PLAN.md) - Roadmap
- [Implementation Summary](planning/IMPLEMENTATION_SUMMARY.md) - What's been built
- [Change Log](planning/CHANGES.md) - Version history
- [Restructure Plan](planning/PROJECT_RESTRUCTURE_PLAN.md) - Project organization

## 📁 Project Structure

\`\`\`
leaf-disease-detection/
├── src/              # Source code
├── frontend/         # Web interface
├── tests/            # Test files
├── docs/             # Documentation (you are here)
├── scripts/          # Utility scripts
├── config/           # Configuration files
└── assets/           # Static assets
\`\`\`

## 🔗 Quick Links

- [Main README](../README.md)
- [API Documentation](http://localhost:8000/docs)
- [GitHub Repository](https://github.com/shukur-alom/leaf-diseases-detect)

## 🤝 Contributing

See the main README for contribution guidelines.
"@

Set-Content -Path "docs/README.md" -Value $docsReadme
Write-Host "  Created: docs/README.md" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Update import statements in Python files" -ForegroundColor Yellow
Write-Host "2. Test the application: uvicorn src.app:app --reload" -ForegroundColor Yellow
Write-Host "3. Run tests: python -m pytest tests/" -ForegroundColor Yellow
Write-Host "4. Update .gitignore if needed" -ForegroundColor Yellow
Write-Host "5. Commit changes to git" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 See docs/planning/PROJECT_RESTRUCTURE_PLAN.md for details" -ForegroundColor Cyan
