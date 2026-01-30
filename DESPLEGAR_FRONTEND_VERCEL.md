# 🚀 DESPLEGAR FRONTEND EN VERCEL

## 🔍 PROBLEMA ACTUAL

Estás viendo "Cannot GET /" porque solo está desplegado el **backend**. El **frontend** también necesita desplegarse.

---

## ✅ SOLUCIÓN: DESPLEGAR FRONTEND COMO PROYECTO SEPARADO

### PASO 1: Preparar el Frontend

1. Asegúrate de que el frontend esté construido:
   ```bash
   cd juntas/frontend
   npm run build
   ```

### PASO 2: Crear Proyecto Frontend en Vercel

1. Ve a: https://vercel.com/dashboard
2. Haz clic en **"Add New"** → **"Project"**
3. Si tienes el código en GitHub:
   - Conecta tu repositorio
   - Selecciona el repositorio
   - En **"Root Directory"**, selecciona: `juntas/frontend`
   - Framework Preset: **"Create React App"**
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Haz clic en **"Deploy"**

### PASO 3: Configurar Variables de Entorno del Frontend

1. En el nuevo proyecto frontend, ve a **Settings** → **Environment Variables**
2. Agrega:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://board-quorum.vercel.app/api`
     - (Esta es la URL de tu backend + `/api`)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
3. Guarda

### PASO 4: Actualizar CORS_ORIGIN en Backend

1. Ve a tu proyecto **backend** en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Edita `CORS_ORIGIN`:
   - **Value:** La URL de tu nuevo proyecto frontend
     - Ejemplo: `https://board-quorum-frontend.vercel.app`
   - (O si quieres permitir ambos: `https://boardquorum-app.vercel.app,https://board-quorum-frontend.vercel.app`)
4. Guarda y redesplega el backend

---

## 🔄 ALTERNATIVA: DESPLEGAR AMBOS EN EL MISMO PROYECTO

Si prefieres tener todo en un solo proyecto, necesitas configurar Vercel para servir ambos:

### Opción A: Usar vercel.json en la raíz

1. Crea un `vercel.json` en la raíz del proyecto `juntas/`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/build/$1"
    }
  ]
}
```

2. Actualiza el `package.json` en la raíz para el build del frontend
3. Redesplega

---

## 📋 RESUMEN RÁPIDO

**Opción Recomendada:** Desplegar frontend como proyecto separado

1. ✅ Crear nuevo proyecto en Vercel para el frontend
2. ✅ Configurar `REACT_APP_API_URL` en el frontend
3. ✅ Actualizar `CORS_ORIGIN` en el backend con la URL del frontend
4. ✅ Redesplegar ambos

---

**¿Prefieres desplegar el frontend por separado o en el mismo proyecto?** Te guío paso a paso. 😊
