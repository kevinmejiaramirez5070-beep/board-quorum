# 🚀 GUÍA DE DESPLIEGUE EN CPANEL - BOARD QUORUM

## 📋 INFORMACIÓN DEL HOSTING

- **URL cPanel:** https://datacastilla.com/cpanel
- **Usuario:** datacast
- **Contraseña:** glqKe653K1:!Fv

---

## 📦 PASO 1: PREPARAR ARCHIVOS PARA PRODUCCIÓN

### 1.1. Compilar el Frontend

En tu máquina local, ejecuta:

```bash
cd juntas/frontend
npm install
npm run build
```

Esto creará una carpeta `build` con los archivos estáticos del frontend.

### 1.2. Preparar el Backend

Asegúrate de tener todas las dependencias instaladas:

```bash
cd juntas/backend
npm install --production
```

---

## 📤 PASO 2: SUBIR ARCHIVOS AL HOSTING

### 2.1. Acceder a cPanel

1. Ve a: https://datacastilla.com/cpanel
2. Inicia sesión con las credenciales proporcionadas
3. Busca el **Administrador de Archivos** (File Manager)

### 2.2. Estructura de Carpetas Recomendada

Crea la siguiente estructura en `public_html`:

```
public_html/
├── boardquorum/          (o el nombre que prefieras)
│   ├── frontend/         (archivos compilados del frontend)
│   └── backend/          (código del backend)
```

**O si prefieres usar subdominios:**

```
public_html/
├── app.boardquorum.com/   (frontend)
└── api.boardquorum.com/  (backend)
```

### 2.3. Subir Archivos del Frontend

1. En File Manager, navega a `public_html`
2. Crea una carpeta (ej: `boardquorum` o `app`)
3. Sube **todo el contenido** de la carpeta `frontend/build` a esa carpeta
4. **IMPORTANTE:** Sube también el archivo `.htaccess` que crearemos más adelante

### 2.4. Subir Archivos del Backend

1. Crea otra carpeta (ej: `api` o `backend`)
2. Sube **todos los archivos** de la carpeta `backend` excepto:
   - `node_modules/` (se instalarán en el servidor)
   - `.env` (se creará en el servidor con datos del hosting)

---

## 🗄️ PASO 3: CONFIGURAR BASE DE DATOS

### 3.1. Crear Base de Datos en cPanel

1. En cPanel, busca **MySQL Databases** o **Bases de Datos MySQL**
2. Crea una nueva base de datos:
   - Nombre sugerido: `datacast_boardquorum` (o el que prefieras)
   - Anota el nombre completo (generalmente es `usuario_nombredb`)
3. Crea un usuario de base de datos:
   - Usuario: `datacast_quorum` (o el que prefieras)
   - Contraseña: Genera una segura y guárdala
4. Asigna el usuario a la base de datos con **todos los privilegios**

### 3.2. Importar Base de Datos

1. En cPanel, busca **phpMyAdmin**
2. Selecciona la base de datos que creaste
3. Ve a la pestaña **Importar**
4. Sube el archivo SQL de tu base de datos local:
   - Puedes exportar desde tu MySQL local usando phpMyAdmin o:
   ```bash
   mysqldump -u root -p juntas > juntas_backup.sql
   ```
5. Importa el archivo SQL

---

## ⚙️ PASO 4: CONFIGURAR VARIABLES DE ENTORNO

### 4.1. Crear archivo .env en el Backend

En el servidor, en la carpeta del backend, crea un archivo `.env` con:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=datacast_quorum
DB_PASSWORD=TU_CONTRASEÑA_AQUI
DB_NAME=datacast_boardquorum

# Servidor
PORT=5000
NODE_ENV=production

# JWT Secret (genera uno seguro)
JWT_SECRET=tu-secret-key-super-segura-aqui

# CORS - URL de tu frontend en producción
CORS_ORIGIN=https://datacastilla.com
# O si usas subdominio:
# CORS_ORIGIN=https://app.datacastilla.com
```

**⚠️ IMPORTANTE:** 
- Reemplaza `DB_USER`, `DB_PASSWORD` y `DB_NAME` con los datos reales de tu base de datos
- Genera un `JWT_SECRET` seguro (puedes usar: `openssl rand -base64 32`)
- Actualiza `CORS_ORIGIN` con la URL real de tu frontend

### 4.2. Configurar Frontend para Producción

En el servidor, en la carpeta del frontend, crea un archivo `.env.production`:

```env
REACT_APP_API_URL=https://datacastilla.com/api
# O si el backend está en subdominio:
# REACT_APP_API_URL=https://api.datacastilla.com/api
```

**Nota:** Si ya compilaste el frontend, necesitarás recompilarlo con esta variable.

---

## 🔧 PASO 5: INSTALAR DEPENDENCIAS EN EL SERVIDOR

### 5.1. Instalar Node.js (si no está instalado)

En cPanel, busca **Setup Node.js App**:
1. Crea una nueva aplicación Node.js
2. Versión: Node.js 16 o superior
3. Ruta: `/home/datacast/backend` (o la ruta donde subiste el backend)
4. Puerto: 5000 (o el que prefieras)
5. Anota el puerto asignado

### 5.2. Instalar Dependencias del Backend

En la terminal de cPanel o usando SSH:

```bash
cd ~/public_html/backend
npm install --production
```

---

## 🌐 PASO 6: CONFIGURAR APLICACIÓN NODE.JS EN CPANEL

1. En cPanel, ve a **Setup Node.js App**
2. Si ya creaste la app, edítala
3. Configura:
   - **Application root:** `/home/datacast/public_html/backend`
   - **Application URL:** `/api` o un subdominio
   - **Application startup file:** `src/server.js`
   - **Application mode:** Production
4. Guarda y reinicia la aplicación

---

## 📝 PASO 7: CREAR ARCHIVOS .HTACCESS

### 7.1. .htaccess para Frontend (React Router)

Crea un archivo `.htaccess` en la carpeta del frontend con:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 7.2. .htaccess para Backend (Proxy a Node.js)

Si el backend está en la misma carpeta, crea un `.htaccess` para redirigir a Node.js:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]
</IfModule>
```

**Nota:** Esto requiere que el módulo `mod_proxy` esté habilitado. Si no funciona, usa un subdominio para el backend.

---

## 🔄 PASO 8: CONFIGURAR SUBDOMINIOS (OPCIONAL PERO RECOMENDADO)

### 8.1. Crear Subdominio para Backend

1. En cPanel, ve a **Subdominios**
2. Crea un subdominio: `api.datacastilla.com`
3. Directorio: `/home/datacast/public_html/api`
4. Apunta a la carpeta del backend

### 8.2. Actualizar CORS en Backend

Actualiza el archivo `.env` del backend:

```env
CORS_ORIGIN=https://datacastilla.com,https://app.datacastilla.com
```

Y actualiza `server.js` para permitir el dominio de producción.

---

## ✅ PASO 9: VERIFICAR Y PROBAR

### 9.1. Verificar Backend

1. Accede a: `https://datacastilla.com/api/health`
2. Deberías ver: `{"status":"OK","message":"BOARD QUORUM API is running"}`

### 9.2. Verificar Frontend

1. Accede a: `https://datacastilla.com`
2. Deberías ver la página de login
3. Prueba iniciar sesión

### 9.3. Verificar Base de Datos

En el backend, revisa los logs para confirmar la conexión a la base de datos.

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module"
- Ejecuta `npm install` en el servidor
- Verifica que todas las dependencias estén en `package.json`

### Error: "Database connection failed"
- Verifica las credenciales en `.env`
- Asegúrate de que el usuario de la BD tenga permisos
- Verifica que el host sea `localhost` (no la IP)

### Error: "CORS error"
- Actualiza `CORS_ORIGIN` en `.env` con la URL correcta
- Verifica que el dominio esté en la lista de permitidos en `server.js`

### Frontend muestra página en blanco
- Verifica que el `.htaccess` esté en la carpeta correcta
- Asegúrate de que `mod_rewrite` esté habilitado
- Verifica que la URL de la API en el frontend sea correcta

### Node.js no inicia
- Verifica los logs en cPanel → Setup Node.js App
- Asegúrate de que el puerto esté disponible
- Verifica que el archivo `server.js` sea el correcto

---

## 📞 SOPORTE

Si tienes problemas, verifica:
1. Logs de Node.js en cPanel
2. Logs de errores de PHP (si aplica)
3. Configuración de la base de datos
4. Variables de entorno

---

## 🔐 SEGURIDAD POST-DESPLIEGUE

1. ✅ Cambia todas las contraseñas por defecto
2. ✅ Usa HTTPS (SSL) - generalmente viene incluido en cPanel
3. ✅ Mantén Node.js y las dependencias actualizadas
4. ✅ No subas archivos `.env` al repositorio
5. ✅ Configura backups automáticos de la base de datos

---

**¡Listo! Tu aplicación debería estar funcionando en producción.** 🎉
