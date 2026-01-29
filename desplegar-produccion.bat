@echo off
echo ========================================
echo DESPLIEGUE A PRODUCCION - BOARD QUORUM
echo ========================================
echo.

echo [1/4] Compilando Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo al compilar el frontend
    pause
    exit /b 1
)
echo Frontend compilado exitosamente!
echo.

echo [2/4] Preparando Backend...
cd ..\backend
call npm install --production
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias del backend
    pause
    exit /b 1
)
echo Backend preparado exitosamente!
echo.

echo [3/4] Verificando archivos...
cd ..
if not exist "frontend\build" (
    echo ERROR: No se encontro la carpeta build del frontend
    pause
    exit /b 1
)
echo Archivos verificados!
echo.

echo [4/4] Resumen de archivos a subir:
echo.
echo FRONTEND (subir todo el contenido de frontend\build):
dir /b frontend\build
echo.
echo BACKEND (subir todo excepto node_modules y .env):
dir /b backend
echo.
echo ========================================
echo SIGUIENTES PASOS:
echo ========================================
echo 1. Sube los archivos del frontend\build al hosting
echo 2. Sube los archivos del backend al hosting
echo 3. Crea la base de datos en cPanel
echo 4. Configura el archivo .env en el servidor
echo 5. Instala dependencias: npm install --production
echo 6. Configura Node.js App en cPanel
echo.
echo Revisa GUIA_DESPLIEGUE_CPANEL.md para instrucciones detalladas
echo.
pause
