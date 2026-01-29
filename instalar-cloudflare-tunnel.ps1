# ========================================
# INSTALAR CLOUDFLARE TUNNEL (cloudflared)
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALANDO CLOUDFLARE TUNNEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si winget está disponible
$wingetInstalled = Get-Command winget -ErrorAction SilentlyContinue

if ($wingetInstalled) {
    Write-Host "Instalando cloudflared usando winget..." -ForegroundColor Yellow
    Write-Host "NOTA: Se te pedirá aceptar los términos. Presiona 'Y' cuando aparezca." -ForegroundColor Cyan
    Write-Host ""
    winget install --id Cloudflare.cloudflared -e --accept-package-agreements --accept-source-agreements
    Write-Host ""
    Write-Host "✅ cloudflared instalado exitosamente" -ForegroundColor Green
} else {
    Write-Host "⚠️ winget no está disponible." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor instala cloudflared manualmente:" -ForegroundColor White
    Write-Host "1. Ve a: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor White
    Write-Host "2. Descarga: cloudflared-windows-amd64.exe" -ForegroundColor White
    Write-Host "3. Renómbralo a: cloudflared.exe" -ForegroundColor White
    Write-Host "4. Colócalo en una carpeta en tu PATH (ej: C:\Windows\System32)" -ForegroundColor White
    Write-Host ""
    Write-Host "O instala winget desde: https://aka.ms/getwinget" -ForegroundColor White
}

Write-Host ""
Write-Host "Presiona ENTER para continuar..." -ForegroundColor Green
Read-Host
