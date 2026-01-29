@echo off
echo ========================================
echo TUNEL NGROK PARA BACKEND (Puerto 5000)
echo ========================================
echo.
echo IMPORTANTE: Asegurate de que el backend este corriendo en http://localhost:5000
echo.
echo Iniciando tunel ngrok para el backend...
echo.
ngrok http 5000
pause


