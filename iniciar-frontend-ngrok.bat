@echo off
echo ========================================
echo TUNEL NGROK PARA FRONTEND
echo ========================================
echo.
echo IMPORTANTE: Asegurate de que el frontend este corriendo en http://localhost:3000
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
echo.
echo Iniciando tunel ngrok para el frontend (puerto 3000)...
echo.
ngrok http 3000
pause
