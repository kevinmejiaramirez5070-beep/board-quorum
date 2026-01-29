# ========================================
# INICIAR TUNELES CLOUDFLARE PARA BOARD QUORUM
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INICIANDO TUNELES CLOUDFLARE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH para incluir cloudflared
$cloudflaredPath = "C:\Users\KELVIN\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe"
if (Test-Path $cloudflaredPath) {
    $env:Path += ";$cloudflaredPath"
}

# Verificar si cloudflared está instalado
$cloudflaredInstalled = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflaredInstalled) {
    Write-Host "❌ ERROR: cloudflared no está instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor ejecuta primero: .\instalar-cloudflare-tunnel.ps1" -ForegroundColor Yellow
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
Write-Host "Iniciando tunel para FRONTEND (puerto 3000)..." -ForegroundColor Cyan
Write-Host "Esta es la URL que debes compartir con tu cliente:" -ForegroundColor Green
Write-Host ""

# Iniciar tunel para frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:3000"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Iniciando tunel para BACKEND (puerto 5000)..." -ForegroundColor Cyan
Write-Host "Copia la URL que aparezca y actualiza juntas/frontend/src/services/api.js" -ForegroundColor Yellow
Write-Host ""

# Iniciar tunel para backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:5000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TUNELES CLOUDFLARE INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se abrieron 2 ventanas nuevas con los tuneles." -ForegroundColor Yellow
Write-Host "Copia las URLs que aparecen en esas ventanas." -ForegroundColor Yellow
Write-Host ""
Write-Host "PASOS SIGUIENTES:" -ForegroundColor Cyan
Write-Host "1. Copia la URL del FRONTEND (ejemplo: https://xxxxx.trycloudflare.com)" -ForegroundColor White
Write-Host "2. Copia la URL del BACKEND (ejemplo: https://yyyyy.trycloudflare.com)" -ForegroundColor White
Write-Host "3. Actualiza juntas/frontend/src/services/api.js con la URL del backend + /api" -ForegroundColor White
Write-Host "   Ejemplo: const BACKEND_TUNNEL_URL = 'https://yyyyy.trycloudflare.com';" -ForegroundColor Gray
Write-Host "4. Reinicia el frontend si está corriendo" -ForegroundColor White
Write-Host ""
Write-Host "Presiona ENTER para continuar..." -ForegroundColor Green
Read-Host
