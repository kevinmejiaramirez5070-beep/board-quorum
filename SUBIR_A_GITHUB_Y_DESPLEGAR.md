# 🚀 SUBIR CÓDIGO A GITHUB Y DESPLEGAR EN VERCEL

## 📋 PASO 1: CONECTAR CON TU REPOSITORIO DE GITHUB

Tu repositorio está en: `https://github.com/kevinmejiaramirez5070-beep/board-quorum`

### Opción A: Si ya tienes un remote configurado

1. Verifica el remote actual:
   ```bash
   git remote -v
   ```

2. Si el remote apunta a otro lugar, cámbialo:
   ```bash
   git remote set-url origin https://github.com/kevinmejiaramirez5070-beep/board-quorum.git
   ```

### Opción B: Si no tienes remote

1. Agrega el remote:
   ```bash
   git remote add origin https://github.com/kevinmejiaramirez5070-beep/board-quorum.git
   ```

---

## 📤 PASO 2: SUBIR EL CÓDIGO A GITHUB

1. Agrega todos los archivos:
   ```bash
   git add .
   ```

2. Haz commit de los cambios:
   ```bash
   git commit -m "Initial commit: Board Quorum app with Supabase"
   ```

3. Sube a GitHub:
   ```bash
   git push -u origin main
   ```

---

## 🚀 PASO 3: DESPLEGAR FRONTEND EN VERCEL

Una vez que el código esté en GitHub:

1. Ve a: https://vercel.com/dashboard
2. Haz clic en **"Add New"** → **"Project"**
3. Conecta con GitHub si no lo has hecho
4. Selecciona el repositorio: `kevinmejiaramirez5070-beep/board-quorum`
5. En la configuración del proyecto:
   - **Framework Preset:** "Other" o "Create React App"
   - **Root Directory:** `juntas/frontend` (o la ruta donde esté tu frontend)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`
6. Haz clic en **"Deploy"**

---

## ⚙️ PASO 4: CONFIGURAR VARIABLES DEL FRONTEND

1. En el nuevo proyecto frontend en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://board-quorum.vercel.app/api`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Guarda y redesplega

---

## 🔄 PASO 5: ACTUALIZAR CORS EN BACKEND

1. Ve a tu proyecto backend "board-quorum" en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Edita `CORS_ORIGIN`:
   - **Value:** La URL de tu nuevo proyecto frontend
     - Ejemplo: `https://board-quorum-frontend.vercel.app`
4. Guarda y redesplega

---

## ✅ VERIFICACIÓN FINAL

1. Abre la URL del frontend en Vercel
2. Deberías ver la aplicación funcionando
3. Prueba iniciar sesión
4. Si funciona, ¡todo está listo! 🎉

---

**¿Necesitas ayuda con algún paso?** Avísame y te guío. 😊
