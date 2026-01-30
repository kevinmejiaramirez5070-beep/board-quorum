# 🚀 CONFIGURAR VERCEL CON SUPABASE

Guía paso a paso para conectar tu aplicación con Supabase en Vercel.

---

## 📋 PASO 1: OBTENER CREDENCIALES DE SUPABASE

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Haz clic en **"Project Settings"** (⚙️) en el menú lateral
3. Ve a **"Database"** en el menú de configuración
4. Busca la sección **"Connection string"**
5. Selecciona **"URI"** (no "Session mode")
6. Copia la cadena de conexión. Se verá así:
   ```
   postgresql://postgres:[TU-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
7. **IMPORTANTE:** Reemplaza `[TU-PASSWORD]` con tu contraseña real de la base de datos
   - Si no la recuerdas, ve a **"Database"** → **"Reset database password"** para crear una nueva

---

## 🔐 PASO 2: CONFIGURAR VARIABLES DE ENTORNO EN VERCEL (BACKEND)

1. Ve a tu proyecto backend en Vercel: https://vercel.com/dashboard
2. Haz clic en tu proyecto backend
3. Ve a **"Settings"** → **"Environment Variables"**
4. Agrega las siguientes variables:

### Variable 1: DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** La cadena de conexión completa de Supabase (la que copiaste en el Paso 1)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Ejemplo:
  ```
  postgresql://postgres:TU_CONTRASEÑA@db.xxxxx.supabase.co:5432/postgres
  ```

### Variable 2: NODE_ENV
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Variable 3: JWT_SECRET (si no lo tienes)
- **Name:** `JWT_SECRET`
- **Value:** Cualquier string aleatorio y seguro (puedes generar uno con: `openssl rand -base64 32`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Variable 4: CORS_ORIGIN (opcional, para el frontend)
- **Name:** `CORS_ORIGIN`
- **Value:** La URL de tu frontend en Vercel (ej: `https://tu-frontend.vercel.app`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

5. Haz clic en **"Save"** después de agregar cada variable

---

## 🌐 PASO 3: CONFIGURAR VARIABLES DE ENTORNO EN VERCEL (FRONTEND)

1. Ve a tu proyecto frontend en Vercel
2. Ve a **"Settings"** → **"Environment Variables"**
3. Agrega la siguiente variable:

### Variable: REACT_APP_API_URL
- **Name:** `REACT_APP_API_URL`
- **Value:** La URL de tu backend en Vercel (ej: `https://tu-backend.vercel.app/api`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

4. Haz clic en **"Save"**

---

## 🔄 PASO 4: REDESPLEGAR EN VERCEL

Después de agregar las variables de entorno, Vercel debe redesplegar automáticamente. Si no:

1. Ve a **"Deployments"** en tu proyecto
2. Haz clic en los **3 puntos** (⋯) del último despliegue
3. Selecciona **"Redeploy"**
4. Espera a que termine el despliegue

---

## ✅ PASO 5: VERIFICAR LA CONEXIÓN

### Verificar Backend:

1. Ve a **"Deployments"** → Haz clic en el último despliegue
2. Haz clic en **"View Function Logs"** o **"Logs"**
3. Busca el mensaje: `✅ PostgreSQL database connected successfully`
4. Si ves un error, revisa las variables de entorno

### Probar la API:

1. Abre en tu navegador: `https://tu-backend.vercel.app/api/health`
2. Deberías ver una respuesta JSON o un mensaje de éxito

### Verificar Frontend:

1. Abre tu frontend en Vercel
2. Intenta iniciar sesión
3. Si funciona, ¡todo está listo! 🎉

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Connection refused" o "ETIMEDOUT"
- ✅ Verifica que `DATABASE_URL` esté correcta
- ✅ Asegúrate de que la contraseña en la URL esté correcta (sin espacios)
- ✅ Verifica que Supabase esté activo (no en pausa)

### Error: "SSL required"
- ✅ El código ya está configurado para usar SSL en producción
- ✅ Verifica que `NODE_ENV=production` esté configurado

### Error: "Invalid password"
- ✅ Ve a Supabase → **"Database"** → **"Reset database password"**
- ✅ Actualiza `DATABASE_URL` en Vercel con la nueva contraseña

### Error: "Table does not exist"
- ✅ Verifica que hayas ejecutado todos los scripts SQL en Supabase:
  1. `SUPABASE_POSTGRESQL_COMPLETO.sql`
  2. `CORREGIR_COLUMNA_LOGO.sql`
  3. `CREAR_TABLA_CONTACTS.sql`
  4. `AGREGAR_COLUMNAS_MEMBERS_POSTGRESQL.sql`
  5. `juntas_datos_postgresql_corregido.sql`

---

## 📝 RESUMEN DE VARIABLES DE ENTORNO

### Backend (Vercel):
```
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@db.xxxxx.supabase.co:5432/postgres
NODE_ENV=production
JWT_SECRET=tu_secret_key_aqui
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Frontend (Vercel):
```
REACT_APP_API_URL=https://tu-backend.vercel.app/api
```

---

## 🎯 PRÓXIMOS PASOS

Una vez que todo esté funcionando:

1. ✅ Prueba iniciar sesión
2. ✅ Verifica que los datos se carguen correctamente
3. ✅ Prueba crear/editar reuniones
4. ✅ Prueba las votaciones
5. ✅ Verifica que los reportes PDF funcionen

---

**¿Necesitas ayuda con algún paso?** Avísame y te guío. 🚀
