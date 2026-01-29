# 🚀 GUÍA PASO A PASO - RENDER (GRATIS)

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
   - **GitHub** (recomendado - más fácil)
   - Google
   - Email
4. Confirma tu email si es necesario

**¿Ya tienes cuenta en Render?** Si sí, avísame y seguimos.

---

## 📦 PASO 2: SUBIR PROYECTO A GITHUB

Render necesita que tu código esté en GitHub.

### ¿Ya tienes tu proyecto en GitHub?

- **Sí:** Avísame y seguimos con el paso 3
- **No:** Te guío para subirlo

### Si NO tienes GitHub:

1. Ve a: **https://github.com**
2. Crea una cuenta (si no tienes)
3. Haz clic en **"New repository"** (botón verde)
4. Configura:
   - **Repository name:** `board-quorum`
   - **Description:** (opcional)
   - **Visibility:** Private (recomendado) o Public
5. **NO marques** "Add a README file"
6. Haz clic en **"Create repository"**

### Subir tu código:

**Opción A: GitHub Desktop (Más fácil)**
1. Descarga: https://desktop.github.com
2. Instala y conéctalo a tu cuenta
3. Haz clic en **"Add"** → **"Add Existing Repository"**
4. Selecciona: `C:\Users\KELVIN\OneDrive\Desktop\juntas\juntas`
5. Haz clic en **"Publish repository"**
6. Selecciona tu repositorio y haz clic en **"Publish Repository"**

**Opción B: Git desde terminal**
Te puedo ayudar con los comandos si lo prefieres.

**¿Ya subiste tu código a GitHub?** Avísame cuando esté listo.

---

## 🗄️ PASO 3: CREAR BASE DE DATOS POSTGRESQL

1. En Render, ve a tu **Dashboard**
2. Haz clic en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name:** `boardquorum-db` (o el que prefieras)
   - **Database:** `boardquorum` (o el que prefieras)
   - **User:** `boardquorum_user` (o el que prefieras)
   - **Region:** Elige el más cercano (US East, US West, etc.)
   - **Plan:** **Free** (gratis)
4. Haz clic en **"Create Database"**
5. Espera a que se cree (1-2 minutos)
6. **Anota las credenciales** que te da:
   - Internal Database URL
   - External Database URL
   - Host, Port, Database, User, Password

**¿Ya creaste la base de datos?** Avísame y seguimos.

---

## ⚙️ PASO 4: CONFIGURAR BACKEND

1. En Render, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub:
   - Si es la primera vez, autoriza Render
   - Selecciona tu repositorio `board-quorum`
3. Configura el servicio:
   - **Name:** `boardquorum-api` (o el que prefieras)
   - **Region:** El mismo que elegiste para la base de datos
   - **Branch:** `main` (o `master`)
   - **Root Directory:** `backend` (importante: indica que el backend está en esta carpeta)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Plan:** **Free**

### Configurar Variables de Entorno:

En la sección **"Environment Variables"**, haz clic en **"Add Environment Variable"** y agrega:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=tu-secret-key-super-segura-aqui-genera-una
CORS_ORIGIN=https://boardquorum-app.onrender.com
```

Para las variables de la base de datos:
1. Ve a tu base de datos PostgreSQL en Render
2. Copia la **"Internal Database URL"**
3. En el servicio backend, agrega esta variable:
   - **Key:** `DATABASE_URL`
   - **Value:** (pega la Internal Database URL)

**⚠️ IMPORTANTE:** 
- El `CORS_ORIGIN` lo actualizarás después cuando tengas la URL del frontend
- Render te dará una URL como `boardquorum-api.onrender.com`

**¿Ya configuraste el backend?** Avísame y seguimos.

---

## 🎨 PASO 5: CONFIGURAR FRONTEND

1. En Render, haz clic en **"New +"** → **"Static Site"**
2. Conecta tu repositorio de GitHub (el mismo)
3. Configura:
   - **Name:** `boardquorum-app` (o el que prefieras)
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** **Free**

### Configurar Variables de Entorno:

En **"Environment Variables"**, agrega:

```
REACT_APP_API_URL=https://boardquorum-api.onrender.com/api
REACT_APP_BACKEND_URL=https://boardquorum-api.onrender.com
```

**⚠️ IMPORTANTE:** 
- Reemplaza `boardquorum-api` con el nombre real de tu servicio backend
- Render te dará la URL después del despliegue

**¿Ya configuraste el frontend?** Avísame y seguimos.

---

## 🔄 PASO 6: ADAPTAR CÓDIGO PARA POSTGRESQL

Necesitamos cambiar el código de MySQL a PostgreSQL. **Te ayudo con esto después de que configures todo.**

---

## 📥 PASO 7: IMPORTAR BASE DE DATOS

Necesitas convertir tu base de datos MySQL a PostgreSQL e importarla.

**Te guío con esto después.**

---

## ✅ PASO 8: DESPLEGAR

1. Render desplegará automáticamente cuando hagas push a GitHub
2. O haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que termine (5-10 minutos la primera vez)
4. Tu aplicación estará disponible en:
   - Backend: `https://boardquorum-api.onrender.com`
   - Frontend: `https://boardquorum-app.onrender.com`

---

**¿Por dónde quieres empezar?** Te guío paso a paso. 🚀
