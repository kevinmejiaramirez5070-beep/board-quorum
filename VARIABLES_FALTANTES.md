# ⚠️ VARIABLES FALTANTES EN VERCEL

## 🔴 BACKEND - Variables que faltan:

### 1. NODE_ENV
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### 2. JWT_SECRET
- **Name:** `JWT_SECRET`
- **Value:** Genera uno aleatorio (puedes usar: `openssl rand -base64 32` o cualquier string largo y aleatorio)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## 📝 CÓMO AGREGARLAS:

1. En Vercel, ve a tu proyecto **backend**
2. Settings → Environment Variables
3. Haz clic en **"Add New"**
4. Agrega cada variable:
   - **NODE_ENV** = `production`
   - **JWT_SECRET** = (genera uno aleatorio, ejemplo: `mi_secret_key_super_segura_123456789`)
5. Marca todos los ambientes (Production, Preview, Development)
6. Guarda

---

## 🌐 FRONTEND - Verificar:

¿Ya configuraste el proyecto **frontend** en Vercel?

El frontend necesita:
- **REACT_APP_API_URL** = URL de tu backend + `/api`
  - Ejemplo: `https://board-quorum-backend.vercel.app/api`
  - (Reemplaza `board-quorum-backend` con el nombre real de tu proyecto backend)

---

## ✅ RESUMEN:

### Backend (lo que tienes):
- ✅ DATABASE_URL
- ✅ CORS_ORIGIN
- ❌ NODE_ENV (falta)
- ❌ JWT_SECRET (falta)

### Frontend (verificar):
- ❓ REACT_APP_API_URL (¿ya está configurada?)

---

**¿Necesitas ayuda para generar el JWT_SECRET o configurar el frontend?** Avísame. 😊
