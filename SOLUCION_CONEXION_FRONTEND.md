# 🔧 SOLUCIÓN: Frontend no se conecta al backend

## 🔴 PROBLEMA

El frontend está intentando conectarse a `localhost:5000` en lugar de tu backend en Vercel.

**Error en consola:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
localhost:5000/api/clients:1
```

---

## ✅ SOLUCIÓN

### PASO 1: Verificar Variable en Vercel

1. Ve a tu proyecto **frontend** en Vercel: `board-quorum-xcgs`
2. Ve a **Settings** → **Environment Variables**
3. Verifica que tengas:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://board-quorum.vercel.app/api`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

### PASO 2: Si NO está configurada, agrégala

1. Haz clic en **"Add New"**
2. Completa:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://board-quorum.vercel.app/api`
   - **Environments:** ✅ All Environments
3. Haz clic en **"Save"**

### PASO 3: IMPORTANTE - Redesplegar

**⚠️ CRÍTICO:** En React, las variables de entorno se inyectan durante el BUILD, no en runtime.

1. Después de agregar/editar la variable, Vercel debería mostrar: "A new deployment is needed"
2. Haz clic en **"Redeploy"** o ve a **Deployments** → **Redeploy**
3. Espera a que termine el despliegue

### PASO 4: Verificar CORS en Backend

1. Ve a tu proyecto **backend** "board-quorum" en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Verifica `CORS_ORIGIN`:
   - **Value:** `https://board-quorum-xcgs.vercel.app`
   - (O si quieres permitir ambos: `https://boardquorum-app.vercel.app,https://board-quorum-xcgs.vercel.app`)
4. Si lo editaste, guarda y **redesplega el backend**

---

## 🔍 VERIFICACIÓN

### Después del redespliegue:

1. Abre: `https://board-quorum-xcgs.vercel.app/login`
2. Abre la consola del navegador (F12)
3. Ve a la pestaña **Network**
4. Recarga la página
5. Busca la petición a `/api/clients`
6. Verifica que la URL sea: `https://board-quorum.vercel.app/api/clients`
   - **NO** debe ser `localhost:5000`

### Si sigue fallando:

1. Verifica que el backend esté funcionando:
   - Abre: `https://board-quorum.vercel.app/api/health`
   - Deberías ver: `{"status":"OK","message":"BOARD QUORUM API is running"}`

2. Verifica los logs del backend en Vercel:
   - Ve a **Deployments** → Último despliegue → **Logs**
   - Busca: `✅ PostgreSQL database connected successfully`

---

## 📝 RESUMEN

**Problema:** `REACT_APP_API_URL` no está configurada o el frontend no se redesplegó después de agregarla.

**Solución:**
1. ✅ Configurar `REACT_APP_API_URL` = `https://board-quorum.vercel.app/api`
2. ✅ **REDESPLEGAR el frontend** (muy importante)
3. ✅ Verificar `CORS_ORIGIN` en el backend
4. ✅ Redesplegar el backend si es necesario

---

**¿Ya configuraste la variable y redesplegaste?** Si sigue sin funcionar, avísame y revisamos los logs. 😊
