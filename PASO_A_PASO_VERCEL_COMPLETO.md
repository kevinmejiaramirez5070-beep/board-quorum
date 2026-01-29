# 🚀 GUÍA PASO A PASO - VERCEL (FRONTEND + BACKEND) + BASE DE DATOS GRATIS

## ✅ VENTAJAS
- ✅ **100% GRATIS** - Sin tarjeta de crédito
- ✅ Vercel para frontend y backend
- ✅ Base de datos MySQL externa gratuita
- ✅ HTTPS incluido automáticamente
- ✅ Despliegue automático desde GitHub

---

## 📋 PASO 1: CREAR BASE DE DATOS MYSQL GRATIS

Vamos a usar **FreeMySQLHosting** (gratis, sin tarjeta):

### 1.1. Crear cuenta

1. Ve a: **https://www.freemysqlhosting.net**
2. Haz clic en **"Sign Up"** o **"Register"**
3. Completa el formulario:
   - **Username:** (elige un nombre)
   - **Email:** (tu email)
   - **Password:** (una contraseña segura)
4. Acepta los términos y haz clic en **"Sign Up"**
5. Verifica tu email

### 1.2. Crear base de datos

1. Inicia sesión en FreeMySQLHosting
2. Busca **"Create Database"** o **"New Database"**
3. Configura:
   - **Database Name:** `boardquorum`
   - **Password:** (elige una contraseña)
4. Haz clic en **"Create"**
5. Espera a que se cree

### 1.3. Obtener credenciales

1. Busca **"Database Information"** o **"Connection Details"**
2. **Anota estas credenciales:**
   - **Host:** (ejemplo: `sql12.freemysqlhosting.net`)
   - **Username:** (tu nombre de usuario)
   - **Password:** (la contraseña que elegiste)
   - **Database:** `boardquorum`
   - **Port:** `3306`

**⚠️ GUARDA ESTAS CREDENCIALES - Las necesitarás después**

**¿Ya creaste la base de datos?** Avísame y seguimos.

---

## 📦 PASO 2: SUBIR PROYECTO A GITHUB

Vercel necesita GitHub.

### ¿Ya tienes tu proyecto en GitHub?

- **Sí:** Avísame y seguimos
- **No:** Te guío para subirlo

### Si NO tienes GitHub:

1. Ve a: **https://github.com**
2. Crea cuenta (si no tienes)
3. Haz clic en **"New repository"** (botón verde)
4. Configura:
   - **Name:** `board-quorum`
   - **Visibility:** Private (recomendado)
5. **NO marques** "Add a README"
6. Haz clic en **"Create repository"**

### Subir código:

**Opción A: GitHub Desktop (Más fácil)**
1. Descarga: https://desktop.github.com
2. Instala y conecta tu cuenta
3. **"Add"** → **"Add Existing Repository"**
4. Selecciona: `C:\Users\KELVIN\OneDrive\Desktop\juntas\juntas`
5. **"Publish repository"**
6. Selecciona tu repositorio y publica

**Opción B: Git desde terminal**
Te ayudo con los comandos si prefieres.

**¿Ya subiste tu código a GitHub?** Avísame cuando esté listo.

---

## ⚡ PASO 3: CREAR CUENTA EN VERCEL

1. Ve a: **https://vercel.com**
2. Haz clic en **"Sign Up"**
3. Regístrate con **GitHub** (recomendado)
4. Autoriza Vercel para acceder a tus repositorios

**¿Ya tienes cuenta en Vercel?** Si sí, avísame y seguimos.

---

## ⚙️ PASO 4: DESPLEGAR BACKEND EN VERCEL

1. En Vercel, haz clic en **"Add New..."** → **"Project"**
2. Importa tu repositorio `board-quorum`
3. Configura:
   - **Project Name:** `boardquorum-api`
   - **Framework Preset:** **Other**
   - **Root Directory:** `backend` ⚠️ IMPORTANTE
   - **Build Command:** (déjalo vacío o `npm install`)
   - **Output Directory:** (déjalo vacío)
   - **Install Command:** `npm install`

### Variables de Entorno:

Haz clic en **"Environment Variables"** y agrega:

```
NODE_ENV=production
PORT=3000
DB_HOST=(el host de FreeMySQLHosting - ej: sql12.freemysqlhosting.net)
DB_USER=(tu nombre de usuario de FreeMySQLHosting)
DB_PASSWORD=(la contraseña de la base de datos)
DB_NAME=boardquorum
DB_PORT=3306
JWT_SECRET=(genera una clave segura en https://randomkeygen.com/)
CORS_ORIGIN=https://boardquorum-app.vercel.app
```

**⚠️ IMPORTANTE:**
- Reemplaza los valores entre paréntesis con tus credenciales reales
- El `CORS_ORIGIN` lo actualizarás después con la URL del frontend

4. Haz clic en **"Deploy"**
5. Espera 2-5 minutos
6. Vercel te dará una URL como: `boardquorum-api.vercel.app`
7. **Anota esta URL** (la necesitarás para el frontend)

**¿Ya desplegaste el backend?** Avísame y seguimos.

---

## 🎨 PASO 5: DESPLEGAR FRONTEND EN VERCEL

1. En Vercel, haz clic en **"Add New..."** → **"Project"** (otro proyecto)
2. Importa el mismo repositorio `board-quorum`
3. Configura:
   - **Project Name:** `boardquorum-app`
   - **Framework Preset:** **Create React App**
   - **Root Directory:** `frontend` ⚠️ IMPORTANTE
   - **Build Command:** `npm run build` (automático)
   - **Output Directory:** `build` (automático)

### Variables de Entorno:

Agrega:

```
REACT_APP_API_URL=https://boardquorum-api.vercel.app/api
REACT_APP_BACKEND_URL=https://boardquorum-api.vercel.app
```

**⚠️ IMPORTANTE:**
- Reemplaza `boardquorum-api.vercel.app` con la URL real de tu backend

4. Haz clic en **"Deploy"**
5. Espera 2-5 minutos
6. Vercel te dará una URL como: `boardquorum-app.vercel.app`

**¿Ya desplegaste el frontend?** Avísame y seguimos.

---

## 📥 PASO 6: IMPORTAR BASE DE DATOS

### 6.1. Exportar desde tu MySQL local

1. Abre phpMyAdmin: http://localhost/phpmyadmin
2. Selecciona la base de datos `juntas`
3. Pestaña **"Exportar"**
4. Método: **"Personalizado"**
5. Haz clic en **"Continuar"**
6. Guarda el archivo SQL

### 6.2. Importar a FreeMySQLHosting

1. En FreeMySQLHosting, busca **"phpMyAdmin"** o **"Database Management"**
2. Accede a phpMyAdmin con tus credenciales
3. Selecciona tu base de datos `boardquorum`
4. Pestaña **"Importar"**
5. Selecciona tu archivo SQL
6. Haz clic en **"Continuar"**

**¿Ya importaste la base de datos?** Avísame y seguimos.

---

## ✅ PASO 7: ACTUALIZAR CORS

1. En Vercel, ve a tu proyecto backend
2. **"Settings"** → **"Environment Variables"**
3. Actualiza `CORS_ORIGIN` con la URL real del frontend:
   ```
   CORS_ORIGIN=https://boardquorum-app.vercel.app
   ```
4. Haz clic en **"Save"**
5. Vercel redesplegará automáticamente

---

## 🎉 PASO 8: VERIFICAR

1. **Backend:**
   - Ve a: `https://boardquorum-api.vercel.app/api/health`
   - Deberías ver: `{"status":"OK","message":"BOARD QUORUM API is running"}`

2. **Frontend:**
   - Ve a: `https://boardquorum-app.vercel.app`
   - Deberías ver la página de login
   - Prueba iniciar sesión

---

## 🐛 PROBLEMAS COMUNES

### Error: "Database connection failed"
- Verifica las credenciales en las variables de entorno
- Asegúrate de que el host sea correcto

### Error: "CORS error"
- Actualiza `CORS_ORIGIN` con la URL correcta del frontend

---

**¿Por dónde quieres empezar?** Te guío paso a paso. 🚀
