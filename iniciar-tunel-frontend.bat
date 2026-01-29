@echo off
echo ============================================
echo TUNEL CLOUDFLARE PARA FRONTEND (Puerto 3000)
echo ============================================
echo.
echo Esta es la URL que compartes con tu cliente
echo Copia la URL que aparezca abajo
echo.
echo ============================================
echo.

cloudflared tunnel --url http://localhost:3000

pause
