# 🚀 GUÍA PASO A PASO - PLANETSCALE + VERCEL (100% GRATIS)

## ✅ VENTAJAS
- ✅ **100% GRATIS** - Sin tarjeta de crédito
- ✅ MySQL nativo (no necesitas cambiar código)
- ✅ Muy confiable y rápido
- ✅ HTTPS incluido automáticamente
- ✅ Despliegue automático desde GitHub

---

## 📋 PASO 1: CREAR BASE DE DATOS EN PLANETSCALE

### 1.1. Crear cuenta

1. Ve a: **https://planetscale.com**
2. Haz clic en **"Sign up"** o **"Get started for free"**
3. Regístrate con **GitHub** (recomendado - más fácil)
4. Autoriza PlanetScale para acceder a tu cuenta

### 1.2. Crear base de datos

1. En PlanetScale, haz clic en **"Create database"** o **"New database"**
2. Configura:
   - **Name:** `boardquorum` (o el que prefieras)
   - **Region:** Elige el más cercano (US East, US West, etc.)
   - **Plan:** **Hobby** (gratis - 5GB)
3. Haz clic en **"Create database"**
4. Espera a que se cree (1-2 minutos)

### 1.3. Obtener credenciales

1. Haz clic en tu base de datos
2. Haz clic en **"Connect"** o **"Passwords"**
3. Haz clic en **"New password"** o **"Create password"**
4. Nombre: `production` (o el que prefieras)
5. Copia las credenciales que te da:
   - **Host**
   - **Username**
   - **Password**
   - **Database**
   - **Port** (generalmente 3306)

**⚠️ IMPORTANTE:** Guarda estas credenciales, las necesitarás después.

**¿Ya creaste la base de datos en PlanetScale?** Avísame y seguimos.

---

## 📦 PASO 2: SUBIR PROYECTO A GITHUB

Vercel necesita que tu código esté en GitHub.

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

## ⚡ PASO 3: CREAR CUENTA EN VERCEL

1. Ve a: **https://vercel.com**
2. Haz clic en **"Sign Up"** o **"Get Started"**
3. Regístrate con **GitHub** (recomendado - más fácil)
4. Autoriza Vercel para acceder a tus repositorios

**¿Ya tienes cuenta en Vercel?** Si sí, avísame y seguimos.

---

## ⚙️ PASO 4: CONFIGURAR BACKEND EN VERCEL

1. En Vercel, haz clic en **"Add New..."** → **"Project"**
2. Importa tu repositorio de GitHub:
   - Busca y selecciona `board-quorum`
   - Haz clic en **"Import"**
3. Configura el proyecto:
   - **Project Name:** `boardquorum-api` (o el que prefieras)
   - **Framework Preset:** **Other** (o déjalo en auto-detect)
   - **Root Directory:** `backend` (importante: indica que el backend está en esta carpeta)
   - **Build Command:** `npm install` (o déjalo vacío)
   - **Output Directory:** (déjalo vacío)
   - **Install Command:** `npm install`
   - **Development Command:** (déjalo vacío)

### Configurar Variables de Entorno:

En la sección **"Environment Variables"**, haz clic en **"Add"** y agrega:

```
NODE_ENV=production
PORT=3000
DB_HOST=(el host de PlanetScale)
DB_USER=(el usuario de PlanetScale)
DB_PASSWORD=(la contraseña de PlanetScale)
DB_NAME=(el nombre de la base de datos)
DB_PORT=3306
JWT_SECRET=tu-secret-key-super-segura-aqui-genera-una
CORS_ORIGIN=https://boardquorum-app.vercel.app
```

**⚠️ IMPORTANTE:** 
- Reemplaza los valores entre paréntesis con las credenciales reales de PlanetScale
- El `CORS_ORIGIN` lo actualizarás después cuando tengas la URL del frontend
- Para generar un JWT_SECRET seguro, puedes usar: https://randomkeygen.com/

4. Haz clic en **"Deploy"**
5. Espera a que termine el despliegue (2-5 minutos)
6. Vercel te dará una URL como: `boardquorum-api.vercel.app`
7. **Anota esta URL** (la necesitarás para el frontend)

**¿Ya desplegaste el backend?** Avísame y seguimos.

---

## 🎨 PASO 5: CONFIGURAR FRONTEND EN VERCEL

1. En Vercel, haz clic en **"Add New..."** → **"Project"** (otro proyecto nuevo)
2. Importa el mismo repositorio `board-quorum`
3. Configura:
   - **Project Name:** `boardquorum-app` (o el que prefieras)
   - **Framework Preset:** **Create React App** (o auto-detect)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (o déjalo automático)
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

### Configurar Variables de Entorno:

En **"Environment Variables"**, agrega:

```
REACT_APP_API_URL=https://boardquorum-api.vercel.app/api
REACT_APP_BACKEND_URL=https://boardquorum-api.vercel.app
```

**⚠️ IMPORTANTE:** 
- Reemplaza `boardquorum-api.vercel.app` con la URL real de tu backend

4. Haz clic en **"Deploy"**
5. Espera a que termine (2-5 minutos)
6. Vercel te dará una URL como: `boardquorum-app.vercel.app`

**¿Ya desplegaste el frontend?** Avísame y seguimos.

---

## 📥 PASO 6: IMPORTAR BASE DE DATOS A PLANETSCALE

Necesitas importar tu base de datos MySQL local a PlanetScale.

### 6.1. Exportar desde MySQL local

1. Abre phpMyAdmin: http://localhost/phpmyadmin
2. Selecciona la base de datos `juntas`
3. Ve a la pestaña **"Exportar"**
4. Método: **"Personalizado"**
5. Haz clic en **"Continuar"** o **"Ejecutar"**
6. Guarda el archivo SQL

### 6.2. Importar a PlanetScale

**Opción A: Usando PlanetScale CLI (Recomendado)**

1. Instala PlanetScale CLI:
   ```bash
   # Windows (usando winget o descarga manual)
   # Descarga desde: https://github.com/planetscale/cli/releases
   ```

2. Inicia sesión:
   ```bash
   pscale auth login
   ```

3. Conecta a tu base de datos:
   ```bash
   pscale connect boardquorum production --port 3307
   ```

4. En otra terminal, importa:
   ```bash
   mysql -h 127.0.0.1 -P 3307 -u root -p < juntas_backup.sql
   ```

**Opción B: Usando MySQL Workbench o DBeaver**

1. Descarga MySQL Workbench: https://dev.mysql.com/downloads/workbench/
2. Crea una nueva conexión con las credenciales de PlanetScale
3. Conéctate a la base de datos
4. Importa el archivo SQL

**Opción C: Usando phpMyAdmin en línea**

Si PlanetScale tiene phpMyAdmin disponible, úsalo para importar.

**¿Ya importaste la base de datos?** Avísame y seguimos.

---

## ✅ PASO 7: ACTUALIZAR CORS EN BACKEND

Después de obtener la URL del frontend:

1. En Vercel, ve a tu proyecto backend
2. Ve a **"Settings"** → **"Environment Variables"**
3. Actualiza `CORS_ORIGIN` con la URL real del frontend:
   ```
   CORS_ORIGIN=https://boardquorum-app.vercel.app
   ```
4. Haz clic en **"Save"**
5. Vercel redesplegará automáticamente

---

## 🎉 PASO 8: VERIFICAR QUE TODO FUNCIONE

1. **Backend:**
   - Ve a: `https://boardquorum-api.vercel.app/api/health`
   - Deberías ver: `{"status":"OK","message":"BOARD QUORUM API is running"}`

2. **Frontend:**
   - Ve a: `https://boardquorum-app.vercel.app`
   - Deberías ver la página de login
   - Prueba iniciar sesión

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module"
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `npm install` se ejecute correctamente

### Error: "Database connection failed"
- Verifica las credenciales de PlanetScale en las variables de entorno
- Asegúrate de que la base de datos esté activa en PlanetScale

### Error: "CORS error"
- Verifica que `CORS_ORIGIN` tenga la URL correcta del frontend
- Actualiza después de obtener las URLs de Vercel

---

## 📝 NOTAS IMPORTANTES

- ✅ **MySQL nativo:** PlanetScale usa MySQL, no necesitas cambiar código
- ✅ **HTTPS:** Incluido automáticamente en Vercel
- ✅ **Despliegue automático:** Cada push a GitHub despliega automáticamente
- ⚠️ **URLs:** Vercel genera URLs automáticas, puedes personalizarlas después
- ⚠️ **Base de datos:** PlanetScale tiene límite de 5GB en plan gratuito (suficiente para proyectos pequeños)

---

**¿Por dónde quieres empezar?** Te guío paso a paso. 🚀
