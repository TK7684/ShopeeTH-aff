# PowerShell script to clean and reinstall dependencies
Write-Host "🧹 Cleaning node_modules and package-lock.json..." -ForegroundColor Yellow

# Remove node_modules and package-lock.json
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Installation complete!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Installation failed. Please check the errors above." -ForegroundColor Red
}

