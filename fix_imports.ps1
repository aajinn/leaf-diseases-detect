# Fix Import Statements After Restructure
Write-Host "🔧 Fixing import statements..." -ForegroundColor Green

# Fix src/app.py
Write-Host "  Fixing src/app.py..." -ForegroundColor Cyan
$content = Get-Content "src/app.py" -Raw
$content = $content -replace 'from utils import', 'from src.utils import'
$content = $content -replace 'from database\.connection import', 'from src.database.connection import'
$content = $content -replace 'from auth\.routes import', 'from src.auth.routes import'
$content = $content -replace 'from routes\.disease_detection import', 'from src.routes.disease_detection import'
Set-Content "src/app.py" -Value $content

# Fix src/main.py
Write-Host "  Fixing src/main.py..." -ForegroundColor Cyan
if (Test-Path "src/main.py") {
    # Streamlit app - no imports to fix typically
}

# Fix src/auth/routes.py
Write-Host "  Fixing src/auth/routes.py..." -ForegroundColor Cyan
$content = Get-Content "src/auth/routes.py" -Raw
$content = $content -replace 'from database\.models import', 'from src.database.models import'
$content = $content -replace 'from database\.connection import', 'from src.database.connection import'
$content = $content -replace 'from auth\.security import', 'from src.auth.security import'
Set-Content "src/auth/routes.py" -Value $content

# Fix src/auth/security.py
Write-Host "  Fixing src/auth/security.py..." -ForegroundColor Cyan
$content = Get-Content "src/auth/security.py" -Raw
$content = $content -replace 'from database\.models import', 'from src.database.models import'
$content = $content -replace 'from database\.connection import', 'from src.database.connection import'
Set-Content "src/auth/security.py" -Value $content

# Fix src/routes/disease_detection.py
Write-Host "  Fixing src/routes/disease_detection.py..." -ForegroundColor Cyan
$content = Get-Content "src/routes/disease_detection.py" -Raw
$content = $content -replace 'from database\.models import', 'from src.database.models import'
$content = $content -replace 'from database\.connection import', 'from src.database.connection import'
$content = $content -replace 'from auth\.security import', 'from src.auth.security import'
$content = $content -replace 'from storage\.image_storage import', 'from src.storage.image_storage import'
$content = $content -replace 'from utils import', 'from src.utils import'
$content = $content -replace 'from services\.perplexity_service import', 'from src.services.perplexity_service import'
Set-Content "src/routes/disease_detection.py" -Value $content

# Fix src/services/perplexity_service.py
Write-Host "  Fixing src/services/perplexity_service.py..." -ForegroundColor Cyan
$content = Get-Content "src/services/perplexity_service.py" -Raw
$content = $content -replace 'from database\.models import', 'from src.database.models import'
Set-Content "src/services/perplexity_service.py" -Value $content

# Fix src/utils.py
Write-Host "  Fixing src/utils.py..." -ForegroundColor Cyan
if (Test-Path "src/utils.py") {
    $content = Get-Content "src/utils.py" -Raw
    # Check if it imports from Leaf Disease
    if ($content -match 'from Leaf Disease') {
        $content = $content -replace 'from Leaf Disease\.main import', 'from src.core.disease_detector import'
        Set-Content "src/utils.py" -Value $content
    }
}

# Fix tests
Write-Host "  Fixing test files..." -ForegroundColor Cyan
Get-ChildItem "tests" -Filter "*.py" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'from services\.perplexity_service import', 'from src.services.perplexity_service import'
    $content = $content -replace 'from database\.', 'from src.database.'
    $content = $content -replace 'from auth\.', 'from src.auth.'
    $content = $content -replace 'from routes\.', 'from src.routes.'
    $content = $content -replace 'from storage\.', 'from src.storage.'
    $content = $content -replace 'from utils import', 'from src.utils import'
    Set-Content $_.FullName -Value $content
}

Write-Host "✅ Import statements fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: You may need to manually check:" -ForegroundColor Yellow
Write-Host "  - src/core/disease_detector.py" -ForegroundColor Yellow
Write-Host "  - scripts/create_admin.py" -ForegroundColor Yellow
Write-Host "  - scripts/setup.py" -ForegroundColor Yellow
