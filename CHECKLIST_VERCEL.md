# ✅ CHECKLIST RÁPIDO - CONFIGURAR VERCEL

## 🎯 PASOS RÁPIDOS

### 1️⃣ OBTENER DATABASE_URL DE SUPABASE
- [ ] Ve a: https://supabase.com/dashboard
- [ ] Selecciona tu proyecto
- [ ] Settings → Database
- [ ] Connection string → URI
- [ ] Copia la cadena y **reemplaza `[PASSWORD]` con tu contraseña real**

### 2️⃣ CONFIGURAR BACKEND EN VERCEL
- [ ] Ve a: https://vercel.com/dashboard
- [ ] Selecciona tu proyecto **backend**
- [ ] Settings → Environment Variables
- [ ] Agrega: `DATABASE_URL` = (tu cadena de conexión completa)
- [ ] Agrega: `NODE_ENV` = `production`
- [ ] Agrega: `JWT_SECRET` = (genera uno aleatorio)
- [ ] Agrega: `CORS_ORIGIN` = (URL de tu frontend)
- [ ] Guarda todo

### 3️⃣ CONFIGURAR FRONTEND EN VERCEL
- [ ] Ve a tu proyecto **frontend** en Vercel
- [ ] Settings → Environment Variables
- [ ] Agrega: `REACT_APP_API_URL` = (URL de tu backend + `/api`)
- [ ] Guarda

### 4️⃣ REDESPLEGAR
- [ ] Vercel debería redesplegar automáticamente
- [ ] Si no, ve a Deployments → Redeploy

### 5️⃣ VERIFICAR
- [ ] Abre logs del backend en Vercel
- [ ] Busca: `✅ PostgreSQL database connected successfully`
- [ ] Prueba: `https://tu-backend.vercel.app/api/health`
- [ ] Prueba tu frontend: debería funcionar

---

## 📝 EJEMPLO DE VARIABLES

### Backend:
```
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@db.xxxxx.supabase.co:5432/postgres
NODE_ENV=production
JWT_SECRET=tu_secret_key_aqui
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Frontend:
```
REACT_APP_API_URL=https://tu-backend.vercel.app/api
```

---

## 🆘 SI HAY ERRORES

1. **Backend no conecta:**
   - Verifica `DATABASE_URL` (debe tener la contraseña real)
   - Revisa logs en Vercel

2. **Frontend no conecta:**
   - Verifica `REACT_APP_API_URL`
   - Verifica `CORS_ORIGIN` en backend

3. **Datos no aparecen:**
   - Verifica que todos los scripts SQL se ejecutaron en Supabase

---

**¿Listo para configurar?** Sigue los pasos arriba. Si necesitas ayuda, avísame. 🚀
