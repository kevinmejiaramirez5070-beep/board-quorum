# 📋 RESUMEN RÁPIDO DE DESPLIEGUE

## ✅ ARCHIVOS CREADOS

1. **GUIA_DESPLIEGUE_CPANEL.md** - Guía completa paso a paso
2. **frontend/.htaccess** - Configuración para React Router
3. **backend/env.production.example** - Ejemplo de variables de entorno
4. **frontend/env.production.example** - Ejemplo de variables de entorno
5. **desplegar-produccion.bat** - Script para preparar archivos

## 🚀 PASOS RÁPIDOS

### 1. Preparar Archivos (Local)
```bash
# Ejecuta el script de despliegue
.\desplegar-produccion.bat

# O manualmente:
cd frontend
npm run build

cd ../backend
npm install --production
```

### 2. Subir al Hosting
- **Frontend:** Sube todo el contenido de `frontend/build/` a `public_html/`
- **Backend:** Sube todos los archivos de `backend/` (excepto `node_modules` y `.env`)

### 3. Configurar en cPanel
1. Crear base de datos MySQL
2. Importar tu base de datos SQL
3. Crear archivo `.env` en el backend con las credenciales
4. Configurar Node.js App en cPanel
5. Instalar dependencias: `npm install --production`

### 4. Configurar Variables de Entorno

**Backend (.env):**
```env
DB_HOST=localhost
DB_USER=tu_usuario_bd
DB_PASSWORD=tu_contraseña_bd
DB_NAME=tu_nombre_bd
PORT=5000
NODE_ENV=production
JWT_SECRET=tu-secret-key-segura
CORS_ORIGIN=https://datacastilla.com
```

**Frontend (.env.production antes de compilar):**
```env
REACT_APP_API_URL=https://datacastilla.com/api
```

## 📝 NOTAS IMPORTANTES

- ✅ El archivo `.htaccess` ya está creado en `frontend/`
- ✅ CORS ya está configurado para `datacastilla.com`
- ✅ El frontend usa variables de entorno para la URL del API
- ⚠️ Recuerda actualizar la URL del API según tu configuración final

## 🔗 ENLACES ÚTILES

- **cPanel:** https://datacastilla.com/cpanel
- **Usuario:** datacast
- **Guía completa:** Ver `GUIA_DESPLIEGUE_CPANEL.md`

## ❓ ¿NECESITAS AYUDA?

Revisa la sección "Solución de Problemas" en `GUIA_DESPLIEGUE_CPANEL.md`
