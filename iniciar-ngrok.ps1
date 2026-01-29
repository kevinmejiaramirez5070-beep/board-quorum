# ========================================
# SCRIPT PARA CREAR TUNEL NGROK Y COMPARTIR LINK
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INICIANDO TUNEL NGROK PARA BOARD QUORUM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si ngrok está instalado
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokInstalled) {
    Write-Host "ERROR: ngrok no está instalado." -ForegroundColor Red
    Write-Host "Por favor instala ngrok desde: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "O ejecuta: winget install ngrok" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Asegurate de que el FRONTEND este corriendo en http://localhost:3000" -ForegroundColor White
Write-Host "2. Asegurate de que el BACKEND este corriendo en http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Presiona ENTER cuando ambos esten corriendo..." -ForegroundColor Green
Read-Host

Write-Host ""
Write-Host "Iniciando tunel ngrok para FRONTEND (puerto 3000)..." -ForegroundColor Cyan
Write-Host "Este es el link que debes compartir con tu cliente:" -ForegroundColor Green
Write-Host ""

# Iniciar tunel para frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Iniciando tunel ngrok para BACKEND (puerto 5000)..." -ForegroundColor Cyan
Write-Host ""

# Iniciar tunel para backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 5000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TUNELES NGROK INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se abrieron 2 ventanas nuevas con los tuneles." -ForegroundColor Yellow
Write-Host "Copia las URLs que aparecen en esas ventanas (ejemplo: https://abc123.ngrok-free.app)" -ForegroundColor Yellow
Write-Host ""
Write-Host "PASOS SIGUIENTES:" -ForegroundColor Cyan
Write-Host "1. Copia la URL del FRONTEND (ejemplo: https://abc123.ngrok-free.app)" -ForegroundColor White
Write-Host "2. Copia la URL del BACKEND (ejemplo: https://xyz789.ngrok-free.app)" -ForegroundColor White
Write-Host "3. Actualiza juntas/frontend/src/services/api.js con la URL del backend + /api" -ForegroundColor White
Write-Host "   Ejemplo: const API_URL = 'https://xyz789.ngrok-free.app/api';" -ForegroundColor Gray
Write-Host "4. Actualiza juntas/backend/src/server.js con la URL del frontend en CORS" -ForegroundColor White
Write-Host "   Ejemplo: origin: ['http://localhost:3000', 'https://abc123.ngrok-free.app']" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona ENTER para continuar..." -ForegroundColor Green
Read-Host


