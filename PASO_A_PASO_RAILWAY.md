# 🚂 GUÍA PASO A PASO - RAILWAY

## 📋 PASO 1: CREAR CUENTA EN RAILWAY

1. Ve a: **https://railway.app**
2. Haz clic en **"Start a New Project"** o **"Login"**
3. Selecciona **"Login with GitHub"** (recomendado)
4. Autoriza Railway para acceder a tus repositorios

**¿Ya tienes cuenta en Railway?** Si sí, avísame y seguimos con el siguiente paso.

---

## 📦 PASO 2: SUBIR PROYECTO A GITHUB

Railway necesita que tu código esté en GitHub. 

### ¿Ya tienes tu proyecto en GitHub?

- **Sí:** Avísame y seguimos con el paso 3
- **No:** Te guío para subirlo

### Si NO tienes GitHub:

1. Ve a: **https://github.com**
2. Crea una cuenta (si no tienes)
3. Haz clic en **"New repository"** (botón verde arriba a la derecha)
4. Configura:
   - **Repository name:** `board-quorum` (o el nombre que prefieras)
   - **Description:** (opcional) "Plataforma BOARD QUORUM"
   - **Visibility:** Private (recomendado) o Public
5. **NO marques** "Add a README file" (ya tenemos archivos)
6. Haz clic en **"Create repository"**

### Subir tu código:

**Opción A: GitHub Desktop (Más fácil)**
1. Descarga: https://desktop.github.com
2. Instala y conéctalo a tu cuenta de GitHub
3. Haz clic en **"Add"** → **"Add Existing Repository"**
4. Selecciona la carpeta: `C:\Users\KELVIN\OneDrive\Desktop\juntas\juntas`
5. Haz clic en **"Publish repository"**
6. Selecciona tu repositorio y haz clic en **"Publish Repository"**

**Opción B: Git desde terminal (si prefieres)**
Te puedo ayudar con los comandos si lo prefieres.

**¿Ya subiste tu código a GitHub?** Avísame cuando esté listo.

---

## 🚂 PASO 3: CREAR PROYECTO EN RAILWAY

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona tu repositorio `board-quorum`
4. Railway creará un proyecto nuevo

**¿Ya creaste el proyecto en Railway?** Avísame y seguimos.

---

## 🗄️ PASO 4: CREAR BASE DE DATOS MYSQL

1. En tu proyecto de Railway, haz clic en **"+ New"** (botón morado)
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente una base de datos MySQL
4. Espera unos segundos a que se cree
5. Haz clic en la base de datos para ver las credenciales
6. **Anota o copia las credenciales** (las necesitarás después):
   - MYSQLHOST
   - MYSQLUSER
   - MYSQLPASSWORD
   - MYSQLDATABASE
   - MYSQLPORT

**¿Ya creaste la base de datos?** Avísame y seguimos.

---

## ⚙️ PASO 5: CONFIGURAR BACKEND

1. En Railway, haz clic en **"+ New"** → **"GitHub Repo"**
2. Selecciona tu repositorio `board-quorum`
3. Railway detectará automáticamente que hay código
4. Configura el servicio:
   - **Name:** `boardquorum-api` (o el que prefieras)
   - **Root Directory:** `backend` (importante: indica que el backend está en esta carpeta)
   - **Start Command:** `node src/server.js`

### Configurar Variables de Entorno:

1. Haz clic en tu servicio backend
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"New Variable"** y agrega estas variables:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=tu-secret-key-super-segura-aqui-genera-una
CORS_ORIGIN=https://tu-frontend.up.railway.app
```

4. Para las variables de la base de datos, haz clic en **"Add Reference"**
5. Selecciona tu base de datos MySQL
6. Railway agregará automáticamente:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

**⚠️ IMPORTANTE:** 
- Necesitas adaptar tu código para usar estas variables
- El `CORS_ORIGIN` lo actualizarás después cuando tengas la URL del frontend

**¿Ya configuraste el backend?** Avísame y seguimos.

---

## 🎨 PASO 6: CONFIGURAR FRONTEND

1. En Railway, haz clic en **"+ New"** → **"GitHub Repo"**
2. Selecciona tu repositorio `board-quorum` (el mismo)
3. Configura:
   - **Name:** `boardquorum-app` (o el que prefieras)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l 10000`

### Configurar Variables de Entorno:

1. Haz clic en tu servicio frontend
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"New Variable"** y agrega:

```
REACT_APP_API_URL=https://tu-backend.up.railway.app/api
REACT_APP_BACKEND_URL=https://tu-backend.up.railway.app
```

**⚠️ IMPORTANTE:** 
- Reemplaza `tu-backend.up.railway.app` con la URL real de tu backend
- Railway te dará la URL después del despliegue (algo como `boardquorum-api-production.up.railway.app`)

**¿Ya configuraste el frontend?** Avísame y seguimos.

---

## 🔄 PASO 7: ADAPTAR CÓDIGO PARA RAILWAY

Necesitamos modificar el archivo `database.js` para usar las variables de Railway.

**Te ayudo con esto después de que configures todo.**

---

## 📥 PASO 8: IMPORTAR BASE DE DATOS

Necesitas importar tu base de datos local a Railway.

**Te guío con esto después.**

---

## ✅ PASO 9: DESPLEGAR

1. Railway desplegará automáticamente
2. O haz clic en **"Deploy"** manualmente
3. Espera a que termine (5-10 minutos la primera vez)
4. Railway te dará URLs automáticas

---

**¿Por dónde quieres empezar?** Te guío paso a paso. 🚀
