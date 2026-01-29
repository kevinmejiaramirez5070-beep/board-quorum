@echo off
echo ============================================
echo TUNEL CLOUDFLARE PARA BACKEND (Puerto 5000)
echo ============================================
echo.
echo IMPORTANTE: Copia la URL que aparezca abajo
echo y actualiza juntas/frontend/src/services/api.js
echo con esa URL en la variable BACKEND_TUNNEL_URL
echo.
echo ============================================
echo.

cloudflared tunnel --url http://localhost:5000

pause
