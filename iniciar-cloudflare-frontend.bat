@echo off
REM Actualizar PATH para incluir cloudflared
set "PATH=%PATH%;C:\Users\KELVIN\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe"

echo ========================================
echo TUNEL CLOUDFLARE PARA FRONTEND
echo ========================================
echo.
echo IMPORTANTE: Asegurate de que el frontend este corriendo en http://localhost:3000
echo.
echo Iniciando tunel cloudflare para el frontend (puerto 3000)...
echo.
echo Esta es la URL que debes compartir con tu cliente.
echo.
cloudflared tunnel --url http://localhost:3000
pause
