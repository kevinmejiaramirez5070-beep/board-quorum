@echo off
REM Actualizar PATH para incluir cloudflared
set "PATH=%PATH%;C:\Users\KELVIN\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe"

echo ========================================
echo TUNEL CLOUDFLARE PARA BACKEND
echo ========================================
echo.
echo IMPORTANTE: Asegurate de que el backend este corriendo en http://localhost:5000
echo.
echo Iniciando tunel cloudflare para el backend (puerto 5000)...
echo.
echo Copia la URL que aparezca y actualiza juntas/frontend/src/services/api.js
echo.
cloudflared tunnel --url http://localhost:5000
pause
