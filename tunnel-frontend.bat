@echo off
echo ========================================
echo TUNEL PARA FRONTEND (Puerto 3000)
echo ========================================
echo.
echo Instalando localtunnel...
call npm install -g localtunnel
echo.
echo Iniciando tunel para http://localhost:3000
echo.
echo IMPORTANTE: Asegurate de que el frontend este corriendo en el puerto 3000
echo.
lt --port 3000 --subdomain boardquorum
pause



