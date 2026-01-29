@echo off
echo ========================================
echo TUNEL NGROK PARA FRONTEND (Puerto 3000)
echo ========================================
echo.
echo IMPORTANTE: Asegurate de que el frontend este corriendo en http://localhost:3000
echo.
echo Iniciando tunel ngrok para el frontend...
echo.
ngrok http 3000
pause


