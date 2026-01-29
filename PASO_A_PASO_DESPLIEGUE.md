# 🚀 GUÍA PASO A PASO - SUBIR PROYECTO A CPANEL

## ✅ PASO 1: PREPARACIÓN LOCAL (YA COMPLETADO)

✅ Frontend compilado en `juntas/frontend/build/`
✅ Archivo `.htaccess` copiado a la carpeta build

---

## 📤 PASO 2: ACCEDER A CPANEL

1. **Abre tu navegador** y ve a: **https://datacastilla.com/cpanel**
2. **Inicia sesión** con:
   - Usuario: `datacast`
   - Contraseña: `glqKe653K1:!Fv`
3. Una vez dentro, busca **"File Manager"** o **"Administrador de Archivos"**

---

## 📁 PASO 3: CREAR ESTRUCTURA DE CARPETAS

En el File Manager de cPanel:

1. Navega a la carpeta **`public_html`** (esta es la carpeta principal de tu sitio)
2. **Crea las siguientes carpetas:**
   - `boardquorum` (o el nombre que prefieras para el frontend)
   - `api` (para el backend)

**Cómo crear carpetas:**
- Haz clic en el botón **"+ Folder"** o **"Nueva Carpeta"**
- Escribe el nombre y presiona Enter

---

## 📤 PASO 4: SUBIR ARCHIVOS DEL FRONTEND

### 4.1. Preparar archivos localmente

En tu computadora, los archivos del frontend están en:
```
C:\Users\KELVIN\OneDrive\Desktop\juntas\juntas\frontend\build\
```

### 4.2. Subir al hosting

1. En cPanel File Manager, entra a la carpeta **`boardquorum`** (o la que creaste)
2. Haz clic en **"Upload"** o **"Subir"**
3. **Selecciona TODOS los archivos** de la carpeta `build`:
   - Selecciona todos los archivos y carpetas dentro de `build`
   - Arrástralos o haz clic en "Seleccionar archivos"
   - Sube:
     - `index.html`
     - Carpeta `static/` (con todo su contenido)
     - `.htaccess`
     - Cualquier otro archivo que esté en `build`

**⚠️ IMPORTANTE:** Sube el **CONTENIDO** de la carpeta `build`, no la carpeta `build` misma.

---

## 📤 PASO 5: SUBIR ARCHIVOS DEL BACKEND

### 5.1. Preparar archivos

En tu computadora, los archivos del backend están en:
```
C:\Users\KELVIN\OneDrive\Desktop\juntas\juntas\backend\
```

### 5.2. Archivos a subir

**SÍ subir:**
- ✅ Carpeta `src/` (completa)
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ Cualquier otro archivo `.js` en la raíz

**NO subir:**
- ❌ Carpeta `node_modules/` (se instalará en el servidor)
- ❌ Archivo `.env` (lo crearemos en el servidor)
- ❌ Archivos `.sql` (ya están en la base de datos)

### 5.3. Subir al hosting

1. En cPanel File Manager, entra a la carpeta **`api`** (o la que creaste)
2. Haz clic en **"Upload"** o **"Subir"**
3. Sube todos los archivos del backend (excepto los que NO debes subir)

---

## 🗄️ PASO 6: CREAR BASE DE DATOS

### 6.1. Crear la base de datos

1. En cPanel, busca **"MySQL Databases"** o **"Bases de Datos MySQL"**
2. En la sección **"Create New Database"**:
   - Escribe un nombre: `boardquorum` (o el que prefieras)
   - Haz clic en **"Create Database"**
3. **Anota el nombre completo** de la base de datos (será algo como `datacast_boardquorum`)

### 6.2. Crear usuario de base de datos

1. En la misma página, baja a **"Add New User"**:
   - Username: `quorum_user` (o el que prefieras)
   - Password: Genera una contraseña segura (o escribe una)
   - Haz clic en **"Create User"**
2. **Anota el usuario completo** (será algo como `datacast_quorum_user`)

### 6.3. Asignar usuario a la base de datos

1. Baja a **"Add User To Database"**
2. Selecciona:
   - Usuario: El que acabas de crear
   - Base de datos: La que acabas de crear
3. Haz clic en **"Add"**
4. Marca **"ALL PRIVILEGES"** (todos los privilegios)
5. Haz clic en **"Make Changes"**

---

## 📥 PASO 7: IMPORTAR BASE DE DATOS

### 7.1. Exportar base de datos local (si no lo has hecho)

En tu computadora local, necesitas exportar tu base de datos:

1. Abre **phpMyAdmin** (desde XAMPP)
2. Selecciona la base de datos **`juntas`**
3. Ve a la pestaña **"Exportar"**
4. Selecciona **"Método personalizado"**
5. Marca **"Crear base de datos"** (si está disponible)
6. Haz clic en **"Continuar"**
7. Guarda el archivo SQL

### 7.2. Importar en el hosting

1. En cPanel, busca **"phpMyAdmin"**
2. Selecciona la base de datos que creaste (`datacast_boardquorum`)
3. Ve a la pestaña **"Importar"**
4. Haz clic en **"Elegir archivo"** y selecciona tu archivo SQL
5. Haz clic en **"Continuar"** o **"Importar"**
6. Espera a que termine la importación

---

## ⚙️ PASO 8: CONFIGURAR NODE.JS EN CPANEL

### 8.1. Crear aplicación Node.js

1. En cPanel, busca **"Setup Node.js App"** o **"Node.js Selector"**
2. Haz clic en **"Create Application"** o **"Crear Aplicación"**
3. Configura:
   - **Node.js version:** 16.x o superior (la más reciente disponible)
   - **Application mode:** Production
   - **Application root:** `/home/datacast/public_html/api` (o la ruta donde subiste el backend)
   - **Application URL:** `/api` (o deja el que te asigne)
   - **Application startup file:** `src/server.js`
4. Haz clic en **"Create"** o **"Crear"**

### 8.2. Instalar dependencias

1. En la misma página de Node.js App, busca tu aplicación
2. Haz clic en el icono de **terminal** o **"Run NPM Install"**
3. O manualmente, en la terminal escribe:
   ```
   cd ~/public_html/api
   npm install --production
   ```

---

## 🔐 PASO 9: CONFIGURAR VARIABLES DE ENTORNO

### 9.1. Crear archivo .env en el backend

1. En cPanel File Manager, entra a la carpeta **`api`** (donde está el backend)
2. Haz clic en **"+ File"** o **"Nuevo Archivo"**
3. Nómbralo: **`.env`**
4. Abre el archivo para editarlo
5. Copia y pega esto (reemplaza con tus datos reales):

```env
DB_HOST=localhost
DB_USER=datacast_quorum_user
DB_PASSWORD=TU_CONTRASEÑA_AQUI
DB_NAME=datacast_boardquorum
PORT=5000
NODE_ENV=production
JWT_SECRET=tu-secret-key-super-segura-aqui-genera-una-segura
CORS_ORIGIN=https://datacastilla.com,https://www.datacastilla.com
```

**⚠️ IMPORTANTE:**
- Reemplaza `DB_USER` con el usuario completo que creaste
- Reemplaza `DB_PASSWORD` con la contraseña que creaste
- Reemplaza `DB_NAME` con el nombre completo de la base de datos
- Para `JWT_SECRET`, genera una clave segura (puedes usar: https://randomkeygen.com/)

### 9.2. Guardar el archivo

Guarda el archivo `.env` en el servidor.

---

## 🌐 PASO 10: CONFIGURAR FRONTEND PARA PRODUCCIÓN

### 10.1. Verificar URL del backend

Necesitas saber la URL donde quedó el backend. Puede ser:
- `https://datacastilla.com/api` (si está en subcarpeta)
- `https://api.datacastilla.com` (si creaste un subdominio)

### 10.2. Recompilar frontend con la URL correcta

En tu computadora local:

1. Ve a: `C:\Users\KELVIN\OneDrive\Desktop\juntas\juntas\frontend\`
2. Crea un archivo llamado **`.env.production`**
3. Agrega:
   ```
   REACT_APP_API_URL=https://datacastilla.com/api
   REACT_APP_BACKEND_URL=https://datacastilla.com
   ```
   (Ajusta la URL según tu configuración)

4. Recompila:
   ```bash
   npm run build
   ```

5. **Vuelve a subir** el contenido de `build/` al hosting (reemplaza los archivos anteriores)

---

## ▶️ PASO 11: INICIAR LA APLICACIÓN

1. En cPanel, ve a **"Setup Node.js App"**
2. Encuentra tu aplicación
3. Haz clic en **"Restart App"** o **"Reiniciar Aplicación"**
4. Espera unos segundos

---

## ✅ PASO 12: VERIFICAR QUE FUNCIONE

### 12.1. Verificar Backend

1. Abre en tu navegador: `https://datacastilla.com/api/health`
2. Deberías ver: `{"status":"OK","message":"BOARD QUORUM API is running"}`

### 12.2. Verificar Frontend

1. Abre en tu navegador: `https://datacastilla.com` (o la URL donde subiste el frontend)
2. Deberías ver la página de login
3. Prueba iniciar sesión

---

## 🐛 SI HAY PROBLEMAS

### Error: "Cannot find module"
- Ve a Node.js App en cPanel
- Ejecuta: `npm install --production` en la terminal

### Error: "Database connection failed"
- Verifica las credenciales en `.env`
- Asegúrate de que el usuario tenga permisos en la base de datos

### Error: "CORS error"
- Verifica que `CORS_ORIGIN` en `.env` tenga la URL correcta
- Verifica que el frontend esté usando la URL correcta del backend

### Frontend muestra página en blanco
- Verifica que el archivo `.htaccess` esté en la carpeta del frontend
- Verifica que `mod_rewrite` esté habilitado (generalmente lo está por defecto)

---

## 📞 ¿NECESITAS AYUDA?

Si tienes problemas en algún paso, avísame y te ayudo a resolverlo.

---

**¡Sigue estos pasos en orden y tu aplicación estará funcionando!** 🎉
