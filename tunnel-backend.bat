@echo off
echo ========================================
echo TUNEL PARA BACKEND (Puerto 5000)
echo ========================================
echo.
echo Instalando localtunnel...
call npm install -g localtunnel
echo.
echo Iniciando tunel para http://localhost:5000
echo.
echo IMPORTANTE: Asegurate de que el backend este corriendo en el puerto 5000
echo.
lt --port 5000 --subdomain boardquorum-api
pause



