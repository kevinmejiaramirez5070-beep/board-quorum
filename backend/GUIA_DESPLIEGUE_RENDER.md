# Guía: Mover el backend de Railway a Render

Sigue estos pasos para desplegar el backend de Board Quorum en Render y que el frontend (Vercel) lo use.

---

## Paso 1: Cuenta en Render

1. Entra a **https://render.com** y regístrate o inicia sesión (puedes usar GitHub).
2. En el dashboard verás "New +" para crear recursos.

---

## Paso 2: Crear un Web Service

1. Pulsa **"New +"** → **"Web Service"**.
2. Conecta tu **repositorio de GitHub** donde está el código (el que tiene la carpeta `backend` o `juntas`).
   - Si te pide autorizar Render para GitHub, acepta.
   - Elige el repo correcto (donde está el backend de Board Quorum).

---

## Paso 3: Configurar el servicio

1. **Name:** Pon un nombre, por ejemplo `board-quorum-api` o `servicios-backend`.
2. **Region:** Elige la más cercana a tus usuarios (ej. **Oregon (US West)** o **Frankfurt**).
3. **Branch:** Deja `main` (o la rama donde subes el código).
4. **Root Directory:** **Importante.**  
   - Si tu repo tiene una carpeta `backend` en la raíz, escribe: **`backend`**.  
   - Si tu repo tiene una carpeta `juntas` y dentro `backend`, escribe: **`juntas/backend`**.  
   (Render debe ver el `package.json` del backend dentro de esa carpeta.)
5. **Runtime:** **Node**.
6. **Build Command:** Deja el que propone Render o pon:
   ```bash
   npm install
   ```
7. **Start Command:** Deja el que propone Render o pon:
   ```bash
   npm start
   ```
   (En tu `package.json` ya está `"start": "node src/server.js"`.)

8. **Plan:** Elige **Free** para empezar (el servicio se “duerme” tras inactividad y tarda unos segundos en despertar).

Pulsa **"Create Web Service"** (o "Advanced" si quieres revisar más opciones antes).

---

## Paso 4: Variables de entorno en Render

Antes de que el primer deploy termine (o después), entra a tu servicio en Render:

1. En el menú izquierdo del servicio, ve a **"Environment"**.
2. Añade estas variables (Add Environment Variable). Usa los mismos valores que tenías en Railway o en Vercel (proyecto board-quorum):

| Variable        | Valor                                                                 | Notas |
|----------------|-----------------------------------------------------------------------|--------|
| `NODE_ENV`     | `production`                                                          | |
| `PORT`         | *(no hace falta)*                                                    | Render asigna el puerto automáticamente. |
| `DATABASE_URL` | `postgresql://postgres.xxxxx:PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres` | La misma URL de Supabase que usas en Vercel. Cópiala desde Vercel → board-quorum → Variables. |
| `JWT_SECRET`   | *(el mismo que en Vercel)*                                            | Ej. `MAMATEAM0123.k` o el que tengas. |
| `CORS_ORIGIN`  | `https://board-quorum.vercel.app`                                     | O la URL exacta de tu frontend en Vercel (board-quorum-xcgs, etc.). |
| `FRONTEND_URL` | `https://board-quorum.vercel.app`                                     | Para que los enlaces de asistencia/votación apunten bien. |

Opcional (si usas envío de correos):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL`

3. Guarda los cambios. Si el servicio ya estaba desplegando, Render puede hacer un **redeploy** automático; si no, en la pestaña **"Manual Deploy"** → **"Deploy latest commit"**.

---

## Paso 5: Obtener la URL del backend en Render

1. En la parte superior del servicio verás algo como: **"Your service is live at …"** con una URL.
2. La URL será del tipo: `https://board-quorum-api.onrender.com` (depende del nombre que pusiste).
3. **Cópiala.** Es la nueva URL base del API (sin `/api` al final; el frontend ya añade `/api`).

Comprueba que el backend responde:

- Abre en el navegador: `https://TU-URL-RENDER.com/api/health`  
- Deberías ver algo como: `{"status":"OK","message":"BOARD QUORUM API is running"}`.

---

## Paso 6: Apuntar el frontend (Vercel) al backend en Render

1. Entra a **Vercel** → proyecto del **frontend** (por ejemplo **board-quorum** o **board-quorum-xcgs**).
2. Ve a **Settings** → **Environment Variables**.
3. Busca **`REACT_APP_API_URL`** (o la variable que use el frontend para la URL del API).
4. Cambia su valor a la URL de Render **más** `/api`:
   - Antes: `https://board-quorum.vercel.app/api` (o la que tuvieras).
   - Ahora: `https://TU-URL-RENDER.com/api`  
   Ejemplo: `https://board-quorum-api.onrender.com/api`
5. Guarda.
6. Haz un **redeploy** del frontend en Vercel (Deployments → los tres puntos del último deploy → Redeploy).

---

## Paso 7: Probar

1. Abre tu web en Vercel (ej. `https://board-quorum.vercel.app`).
2. Prueba el login y que carguen las organizaciones.
3. Si algo falla, revisa la pestaña **"Logs"** del servicio en Render para ver errores.

---

## Resumen rápido

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | render.com | Crear cuenta / iniciar sesión |
| 2 | Render | New + → Web Service → conectar repo GitHub |
| 3 | Render | Nombre, región, **Root Directory** = `backend` o `juntas/backend`, Build/Start |
| 4 | Render → Environment | Añadir DATABASE_URL, JWT_SECRET, CORS_ORIGIN, FRONTEND_URL, NODE_ENV |
| 5 | Render | Copiar URL del servicio y probar `/api/health` |
| 6 | Vercel | REACT_APP_API_URL = `https://TU-URL-RENDER.com/api` y redeploy frontend |
| 7 | Navegador | Probar login y que todo funcione |

---

## Nota sobre el plan Free de Render

- El servicio se **suspende** tras ~15 min sin peticiones.
- La **primera petición** después de eso puede tardar 30–60 segundos (arranque en frío).
- Si necesitas que esté siempre activo, en Render puedes pasar al plan de pago.

Cuando termines el Paso 5, si quieres puedes pegar aquí la URL de Render (sin contraseñas) y te digo exactamente qué poner en `REACT_APP_API_URL`.
