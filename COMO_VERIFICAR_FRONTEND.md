# 🔍 CÓMO VERIFICAR VARIABLES DEL FRONTEND EN VERCEL

## 📋 PASOS PARA VERIFICAR:

### 1️⃣ Ir al Proyecto Frontend en Vercel

1. Ve a: https://vercel.com/dashboard
2. Busca tu proyecto **FRONTEND** (no el backend)
   - El frontend suele tener un nombre como:
     - `board-quorum-frontend`
     - `boardquorum-app`
     - `juntas-frontend`
     - O el nombre que le hayas puesto

### 2️⃣ Ver Variables de Entorno

1. Haz clic en tu proyecto **frontend**
2. Ve a **"Settings"** (en el menú superior)
3. En el menú lateral izquierdo, busca **"Environments"**
4. Haz clic en **"Environment Variables"**

### 3️⃣ Buscar REACT_APP_API_URL

En la lista de variables, busca:
- `REACT_APP_API_URL`

**Si la encuentras:**
- ✅ Ya está configurada
- Verifica que el valor sea: `https://tu-backend.vercel.app/api`
- (Reemplaza `tu-backend` con el nombre real de tu proyecto backend)

**Si NO la encuentras:**
- ❌ Necesitas agregarla
- Sigue los pasos abajo

---

## ➕ CÓMO AGREGAR REACT_APP_API_URL (si falta):

### Paso 1: Encontrar la URL de tu Backend

1. Ve a tu proyecto **BACKEND** en Vercel
2. Ve a **"Settings"** → **"Domains"**
3. Verás la URL de tu backend (ejemplo: `https://board-quorum-backend.vercel.app`)
4. Copia esa URL

### Paso 2: Agregar la Variable

1. Ve a tu proyecto **FRONTEND** en Vercel
2. Ve a **"Settings"** → **"Environment Variables"**
3. Haz clic en **"Add New"**
4. Completa:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://tu-backend.vercel.app/api`
     - (Reemplaza `tu-backend` con la URL real de tu backend)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
5. Haz clic en **"Save"**

---

## 🔍 EJEMPLO:

Si tu backend está en:
```
https://board-quorum-backend.vercel.app
```

Entonces `REACT_APP_API_URL` debe ser:
```
https://board-quorum-backend.vercel.app/api
```

---

## ❓ ¿NO SABES EL NOMBRE DE TU PROYECTO BACKEND?

1. Ve a: https://vercel.com/dashboard
2. Busca el proyecto que tiene las variables:
   - `DATABASE_URL`
   - `CORS_ORIGIN`
   - `NODE_ENV`
   - `JWT_SECRET`
3. Ese es tu proyecto **BACKEND**
4. Ve a **"Settings"** → **"Domains"**
5. Ahí verás la URL de tu backend

---

## ✅ VERIFICACIÓN RÁPIDA:

**Pregúntate:**
- ¿Tienes DOS proyectos en Vercel? (uno backend, uno frontend)
- ¿O tienes UN solo proyecto?

**Si tienes DOS proyectos:**
- Backend: tiene `DATABASE_URL`, `CORS_ORIGIN`, etc.
- Frontend: debe tener `REACT_APP_API_URL`

**Si tienes UN solo proyecto:**
- Probablemente necesitas crear el proyecto frontend por separado
- O configurar `REACT_APP_API_URL` en el mismo proyecto

---

**¿Encontraste el proyecto frontend?** Si no, avísame y te ayudo a buscarlo. 😊
