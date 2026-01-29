# 🚀 GUÍA PASO A PASO - DESPLEGAR EN RENDER (GRATIS)

## ✅ VENTAJAS DE RENDER
- ✅ **100% GRATIS** (con límites razonables)
- ✅ Soporta Node.js y React
- ✅ Base de datos PostgreSQL gratis
- ✅ Despliegue automático desde GitHub
- ✅ HTTPS incluido
- ✅ Muy fácil de usar

---

## 📋 PASO 1: CREAR CUENTA EN RENDER

1. Ve a: **https://render.com**
2. Haz clic en **"Get Started for Free"** o **"Sign Up"**
3. Puedes registrarte con:
   - GitHub (recomendado - más fácil)
   - Google
   - Email
4. Confirma tu email si es necesario

---

## 📦 PASO 2: PREPARAR PROYECTO EN GITHUB

Render necesita que tu código esté en GitHub. Si no tienes GitHub:

### 2.1. Crear repositorio en GitHub

1. Ve a: **https://github.com**
2. Crea una cuenta (si no tienes)
3. Haz clic en **"New repository"** (botón verde)
4. Nombre: `board-quorum` (o el que prefieras)
5. Marca **"Private"** (si quieres que sea privado)
6. Haz clic en **"Create repository"**

### 2.2. Subir tu código a GitHub

**Opción A: Usando GitHub Desktop (Más fácil)**
1. Descarga GitHub Desktop: https://desktop.github.com
2. Instálalo y conéctalo a tu cuenta
3. Agrega tu carpeta del proyecto
4. Haz commit y push

**Opción B: Usando Git desde terminal**
```bash
cd C:\Users\KELVIN\OneDrive\Desktop\juntas\juntas
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/board-quorum.git
git push -u origin main
```

---

## 🗄️ PASO 3: CREAR BASE DE DATOS EN RENDER

1. En Render, ve a tu **Dashboard**
2. Haz clic en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name:** `boardquorum-db` (o el que prefieras)
   - **Database:** `boardquorum` (o el que prefieras)
   - **User:** `boardquorum_user` (o el que prefieras)
   - **Region:** Elige el más cercano (US East, US West, etc.)
   - **Plan:** **Free** (gratis)
4. Haz clic en **"Create Database"**
5. **Anota las credenciales** que te da (las necesitarás después)

---

## ⚙️ PASO 4: CONFIGURAR BACKEND EN RENDER

### 4.1. Crear servicio Web Service

1. En Render, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub:
   - Selecciona tu repositorio `board-quorum`
   - O pega la URL de tu repositorio
3. Configura el servicio:
   - **Name:** `boardquorum-api` (o el que prefieras)
   - **Region:** El mismo que elegiste para la base de datos
   - **Branch:** `main` (o `master`)
   - **Root Directory:** `backend` (importante: indica que el backend está en la carpeta `backend`)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Plan:** **Free**

### 4.2. Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

```
NODE_ENV=production
PORT=10000
DB_HOST=(el hostname de tu base de datos PostgreSQL)
DB_USER=(el usuario de tu base de datos)
DB_PASSWORD=(la contraseña de tu base de datos)
DB_NAME=(el nombre de tu base de datos)
DB_PORT=5432
JWT_SECRET=tu-secret-key-super-segura-aqui
CORS_ORIGIN=https://boardquorum.onrender.com
```

**⚠️ IMPORTANTE:** 
- Render te dará las credenciales de PostgreSQL en el dashboard de la base de datos
- Para PostgreSQL, el puerto es `5432` (no 3306 como MySQL)
- Necesitarás adaptar el código para usar PostgreSQL en lugar de MySQL

### 4.3. Conectar a la Base de Datos PostgreSQL

Render usa PostgreSQL, no MySQL. Necesitamos adaptar el código:

1. **Instalar pg (PostgreSQL client):**
   ```bash
   cd backend
   npm install pg
   ```

2. **Modificar `database.js`** para usar PostgreSQL en lugar de MySQL

---

## 🎨 PASO 5: CONFIGURAR FRONTEND EN RENDER

### 5.1. Crear servicio Static Site

1. En Render, haz clic en **"New +"** → **"Static Site"**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name:** `boardquorum-app` (o el que prefieras)
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** **Free**

### 5.2. Configurar Variables de Entorno del Frontend

En **"Environment Variables"**, agrega:

```
REACT_APP_API_URL=https://boardquorum-api.onrender.com/api
REACT_APP_BACKEND_URL=https://boardquorum-api.onrender.com
```

**⚠️ IMPORTANTE:** Reemplaza `boardquorum-api` con el nombre real de tu servicio backend.

---

## 🔄 PASO 6: ADAPTAR CÓDIGO PARA POSTGRESQL

Como Render usa PostgreSQL (no MySQL), necesitamos modificar el backend:

### 6.1. Instalar pg

```bash
cd backend
npm install pg
```

### 6.2. Modificar database.js

Cambiar de MySQL a PostgreSQL.

---

## ✅ PASO 7: DESPLEGAR

1. Render desplegará automáticamente cuando hagas push a GitHub
2. O puedes hacer clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que termine el despliegue (puede tardar 5-10 minutos la primera vez)
4. Tu aplicación estará disponible en:
   - Backend: `https://boardquorum-api.onrender.com`
   - Frontend: `https://boardquorum-app.onrender.com`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module"
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `npm install` se ejecute correctamente

### Error: "Database connection failed"
- Verifica las credenciales de PostgreSQL
- Asegúrate de que el código esté adaptado para PostgreSQL

### Error: "CORS error"
- Verifica que `CORS_ORIGIN` tenga la URL correcta del frontend

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **PostgreSQL vs MySQL:** Render usa PostgreSQL, necesitas adaptar el código
- ⚠️ **URLs dinámicas:** Las URLs de Render cambian si usas plan gratuito
- ⚠️ **Tiempo de inicio:** El plan gratuito "duerme" después de inactividad, puede tardar 30-60 segundos en iniciar
- ✅ **HTTPS:** Incluido automáticamente
- ✅ **Despliegue automático:** Cada push a GitHub despliega automáticamente

---

## 🎯 ALTERNATIVA: RAILWAY (Otra opción gratuita)

Si Render no te funciona, puedes usar **Railway**:
- URL: https://railway.app
- También gratis
- Soporta MySQL directamente
- Muy fácil de usar

---

**¿Necesitas ayuda con algún paso específico?** 🚀
