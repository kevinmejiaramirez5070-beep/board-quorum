# 🚀 GUÍA PASO A PASO - DESPLEGAR EN RAILWAY (GRATIS)

## ✅ VENTAJAS DE RAILWAY
- ✅ **GRATIS** con $5 de crédito mensual (suficiente para proyectos pequeños)
- ✅ Soporta Node.js y React
- ✅ **Soporta MySQL directamente** (no necesitas cambiar a PostgreSQL)
- ✅ Despliegue automático desde GitHub
- ✅ HTTPS incluido
- ✅ Muy fácil de usar

---

## 📋 PASO 1: CREAR CUENTA EN RAILWAY

1. Ve a: **https://railway.app**
2. Haz clic en **"Start a New Project"** o **"Login"**
3. Regístrate con **GitHub** (recomendado - más fácil)
4. Autoriza Railway para acceder a tus repositorios

---

## 📦 PASO 2: PREPARAR PROYECTO EN GITHUB

Si no tienes tu código en GitHub:

### 2.1. Crear repositorio

1. Ve a: **https://github.com**
2. Crea una cuenta (si no tienes)
3. Haz clic en **"New repository"**
4. Nombre: `board-quorum`
5. Marca **"Private"** (opcional)
6. Haz clic en **"Create repository"**

### 2.2. Subir código

**Opción A: GitHub Desktop (Más fácil)**
1. Descarga: https://desktop.github.com
2. Instala y conecta tu cuenta
3. Agrega tu carpeta del proyecto
4. Haz commit y push

**Opción B: Git desde terminal**
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

## 🚂 PASO 3: CREAR PROYECTO EN RAILWAY

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Elige tu repositorio `board-quorum`
4. Railway detectará automáticamente tu proyecto

---

## 🗄️ PASO 4: CREAR BASE DE DATOS MYSQL

1. En tu proyecto de Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente una base de datos MySQL
4. Haz clic en la base de datos para ver las credenciales
5. **Anota las credenciales** (las necesitarás después)

---

## ⚙️ PASO 5: CONFIGURAR BACKEND

### 5.1. Agregar servicio Backend

1. En Railway, haz clic en **"+ New"** → **"GitHub Repo"**
2. Selecciona tu repositorio `board-quorum`
3. Railway detectará que hay una carpeta `backend`
4. O configura manualmente:
   - **Root Directory:** `backend`
   - **Start Command:** `node src/server.js`

### 5.2. Configurar Variables de Entorno

En la pestaña **"Variables"** del servicio backend, agrega:

```
NODE_ENV=production
PORT=10000
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}
JWT_SECRET=tu-secret-key-super-segura-aqui
CORS_ORIGIN=https://tu-frontend.up.railway.app
```

**⚠️ IMPORTANTE:** 
- Railway usa variables de referencia como `${{MySQL.MYSQLHOST}}`
- Reemplaza `tu-frontend.up.railway.app` con la URL real de tu frontend

### 5.3. Conectar Base de Datos

1. En el servicio backend, ve a la pestaña **"Variables"**
2. Haz clic en **"Add Reference"**
3. Selecciona tu base de datos MySQL
4. Railway conectará automáticamente

---

## 🎨 PASO 6: CONFIGURAR FRONTEND

### 6.1. Agregar servicio Frontend

1. En Railway, haz clic en **"+ New"** → **"GitHub Repo"**
2. Selecciona tu repositorio `board-quorum`
3. Configura:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l 10000`

### 6.2. Instalar serve (para servir archivos estáticos)

Necesitas agregar `serve` al `package.json` del frontend:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "serve": "serve -s build -l 10000"
  },
  "dependencies": {
    ...
    "serve": "^14.2.0"
  }
}
```

### 6.3. Configurar Variables de Entorno

En la pestaña **"Variables"** del frontend, agrega:

```
REACT_APP_API_URL=https://tu-backend.up.railway.app/api
REACT_APP_BACKEND_URL=https://tu-backend.up.railway.app
```

**⚠️ IMPORTANTE:** Reemplaza `tu-backend.up.railway.app` con la URL real de tu backend (Railway te la dará después del despliegue).

---

## 🔄 PASO 7: IMPORTAR BASE DE DATOS

### 7.1. Obtener credenciales de MySQL

1. En Railway, haz clic en tu base de datos MySQL
2. Ve a la pestaña **"Connect"**
3. Copia las credenciales de conexión

### 7.2. Importar desde tu MySQL local

1. Exporta tu base de datos local (como hicimos antes)
2. Usa un cliente MySQL (como MySQL Workbench o DBeaver)
3. Conéctate a la base de datos de Railway usando las credenciales
4. Importa tu archivo SQL

**O usa Railway CLI:**
```bash
railway connect
mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < juntas_backup.sql
```

---

## ✅ PASO 8: DESPLEGAR

1. Railway desplegará automáticamente cuando hagas push a GitHub
2. O haz clic en **"Deploy"** manualmente
3. Espera a que termine (5-10 minutos la primera vez)
4. Railway te dará URLs automáticas:
   - Backend: `https://tu-backend.up.railway.app`
   - Frontend: `https://tu-frontend.up.railway.app`

---

## 🔧 PASO 9: CONFIGURAR DOMINIO PERSONALIZADO (OPCIONAL)

1. En Railway, ve a tu servicio
2. Pestaña **"Settings"** → **"Domains"**
3. Agrega tu dominio personalizado (ej: `app.datacastilla.com`)
4. Configura los DNS según las instrucciones de Railway

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module"
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `npm install` se ejecute en el build

### Error: "Database connection failed"
- Verifica las variables de entorno
- Asegúrate de que las referencias a MySQL estén correctas

### Error: "CORS error"
- Verifica que `CORS_ORIGIN` tenga la URL correcta del frontend
- Actualiza después de obtener las URLs de Railway

---

## 📝 NOTAS IMPORTANTES

- ✅ **MySQL nativo:** Railway soporta MySQL directamente, no necesitas cambiar código
- ✅ **HTTPS:** Incluido automáticamente
- ✅ **Despliegue automático:** Cada push a GitHub despliega automáticamente
- ⚠️ **Créditos:** El plan gratuito da $5/mes, suficiente para proyectos pequeños
- ⚠️ **URLs:** Railway genera URLs automáticas, puedes personalizarlas

---

## 🎯 COMPARACIÓN: RAILWAY vs RENDER

| Característica | Railway | Render |
|----------------|---------|--------|
| MySQL nativo | ✅ Sí | ❌ No (solo PostgreSQL) |
| Plan gratuito | ✅ $5/mes crédito | ✅ Gratis con límites |
| Facilidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Velocidad | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recomendación:** Railway es mejor para tu proyecto porque soporta MySQL directamente.

---

**¿Necesitas ayuda con algún paso específico?** 🚀
