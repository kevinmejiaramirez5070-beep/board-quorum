# ========================================
# SCRIPT PARA CREAR TUNEL Y COMPARTIR LINK
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INICIANDO TUNEL PARA BOARD QUORUM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si localtunnel está instalado
$ltInstalled = Get-Command lt -ErrorAction SilentlyContinue

if (-not $ltInstalled) {
    Write-Host "Instalando localtunnel..." -ForegroundColor Yellow
    npm install -g localtunnel
    Write-Host ""
}

Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Asegurate de que el FRONTEND este corriendo en http://localhost:3000" -ForegroundColor White
Write-Host "2. Asegurate de que el BACKEND este corriendo en http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Presiona ENTER cuando ambos esten corriendo..." -ForegroundColor Green
Read-Host

Write-Host ""
Write-Host "Iniciando tunel para FRONTEND (puerto 3000)..." -ForegroundColor Cyan
Write-Host "Este es el link que debes compartir con tu cliente:" -ForegroundColor Green
Write-Host ""

# Iniciar tunel para frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "lt --port 3000"

Write-Host ""
Write-Host "Iniciando tunel para BACKEND (puerto 5000)..." -ForegroundColor Cyan
Write-Host ""

# Iniciar tunel para backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "lt --port 5000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TUNELES INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se abrieron 2 ventanas nuevas con los tuneles." -ForegroundColor Yellow
Write-Host "Copia las URLs que aparecen en esas ventanas." -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTA: Necesitaras actualizar la URL del API en el frontend" -ForegroundColor Yellow
Write-Host "para que apunte a la URL del tunel del backend." -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona ENTER para salir..." -ForegroundColor Gray
Read-Host



