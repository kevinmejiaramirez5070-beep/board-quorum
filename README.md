# BOARD QUORUM (Juntas)

Plataforma para gestionar reuniones formales de órganos colegiados: asistencia, quórum, votaciones en vivo, enlaces públicos y reportes en PDF. Pensada para operar **multi-cliente** (varias organizaciones) y **multi-idioma** (ES / EN).

---

## Cómo está armado el proyecto

| Capa | Tecnología | Carpeta |
|------|------------|---------|
| **Frontend** | React 18 (Create React App), React Router, Axios | `frontend/` |
| **Backend** | Node.js, Express, JWT | `backend/` |
| **Base de datos** | MySQL (local) **o** PostgreSQL (producción: Supabase, Render Postgres, etc.) | configurada por variables de entorno |

El navegador solo habla con el **frontend**. El frontend llama al **API REST** del backend (`/api/...`). El backend es quien se conecta a la base de datos y valida permisos.

```
[Usuario] → HTTPS → [Frontend React en Vercel u otro host]
                          ↓ REACT_APP_API_URL (ej. https://tu-api.onrender.com/api)
                    [Backend Express en Render u otro host]
                          ↓ DATABASE_URL / credenciales MySQL
                    [PostgreSQL o MySQL]
```

---

## Conexión a la base de datos

La lógica está en `backend/src/config/database.js`.

1. **Si existe PostgreSQL** (producción habitual): el backend usa el driver `pg` cuando detecta alguna de estas condiciones:
   - `DATABASE_URL` definida (típico en **Render**, Railway, etc.)
   - `SUPABASE_DB_URL` definida (**Supabase**)
   - `DB_TYPE=postgresql`

   En producción (`NODE_ENV=production`) suele activarse **SSL** hacia el servidor de base de datos (`rejectUnauthorized: false` para compatibilidad con proveedores cloud).

2. **Si no** (desarrollo local): usa **MySQL** con `mysql2` y variables como `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` (o el prefijo `MYSQL*` que algunos hosts inyectan).

3. El código de modelos convierte consultas con placeholders `?` a `$1, $2...` cuando corre sobre PostgreSQL, para mantener un solo estilo de queries en el proyecto.

**Esquema y datos:** revisa `backend/database-complete.sql` y los scripts en `backend/migrations/` (por ejemplo restauración o ajustes por cliente).

---

## Variables de entorno importantes

### Backend (`backend/.env` — no subir a Git)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` o `SUPABASE_DB_URL` | Cadena PostgreSQL en producción |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | MySQL local o Postgres por partes |
| `DB_TYPE=postgresql` | Forzar modo PostgreSQL |
| `PORT` | Puerto del servidor (Render inyecta `PORT`) |
| `JWT_SECRET` | Firma de tokens de sesión (**obligatorio en producción**) |
| `NODE_ENV` | `development` / `production` |
| `FRONTEND_URL` | URL pública del front (links en correos / enlaces de asistencia y votación) |
| `CORS_ORIGIN` | Origen extra permitido por CORS (además de la lista en `server.js`) |

### Frontend (build en Vercel / local)

| Variable | Uso |
|----------|-----|
| `REACT_APP_API_URL` | Base del API **incluyendo** `/api`, ej. `https://tu-backend.onrender.com/api` |
| `REACT_APP_BACKEND_URL` | Alternativa: solo host del backend; el código arma `.../api` si no usas `REACT_APP_API_URL` |

En `frontend/src/services/api.js` el cliente Axios usa esas variables; en local suele apuntar a `http://localhost:5000/api`.

---

## Dónde suele desplegarse

Estos son los escenarios habituales del proyecto (ajusta URLs a las tuyas en cada proveedor):

| Servicio | Qué se despliega | Notas |
|----------|------------------|--------|
| **[Vercel](https://vercel.com)** | Solo el **frontend** | En el proyecto de Vercel, **Root Directory** = `frontend`. Definir `REACT_APP_API_URL` **antes** del build. Incluye `vercel.json` con rewrites para SPA. |
| **[Render](https://render.com)** | **Backend** Node (comando `npm start`, raíz `backend/`) | Variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`, etc. |
| **Dominio propio** | Front y/o API detrás de CDN o reverse proxy | Añadir el origen en CORS en `backend/src/server.js` o vía `CORS_ORIGIN`. |

El backend expone prefijo **`/api`** (auth, meetings, attendance, votings, votes, members, clients, products, contact). Health check: `GET /api/health`.

También existen archivos `vercel.json` en `backend/` por si alguna vez se prueba el API en Vercel; el despliegue más común del API en este repo es **Render** u otro servicio Node persistente.

---

## Roles de usuario (resumen)

Definidos en el JWT y middleware `backend/src/middleware/auth.js`:

- **`admin`**: prepara la organización (reuniones, votaciones, miembros, productos, aprobar asistencias pendientes). No ejecuta acciones “en vivo” reservadas al autorizado.
- **`authorized`**: durante la reunión (con quórum y sesión instalada): instalar sesión, activar votaciones, proyección de quórum, PDFs de asistencia / reporte completo / resultados de votación (según pantalla).
- **`admin_master`**: soporte multi-cliente; se trata como admin para gestión y como autorizado para acciones en vivo donde aplique.
- **`member`**: participación acotada (p. ej. solicitar unirse a reunión según flujo).

---

## Cómo correr en local

**Backend**

```bash
cd backend
npm install
# Configurar .env (MySQL local o DATABASE_URL a un Postgres de prueba)
npm run dev
```

Por defecto escucha en el puerto **5000** (o el que definas en `PORT`).

**Frontend**

```bash
cd frontend
npm install
npm start
```

Suele abrir en **http://localhost:3000**. Asegúrate de que `REACT_APP_API_URL` o la URL por defecto apunte a tu backend.

---

## Estructura de carpetas (resumen)

```
juntas/
├── backend/
│   ├── src/
│   │   ├── config/       # database.js (pool MySQL / PostgreSQL)
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/   # auth, roles
│   │   └── server.js
│   ├── migrations/       # SQL de migraciones / restauración
│   └── database-complete.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/      # idioma, auth
│   │   └── services/     # api.js, servicios por dominio
│   └── vercel.json
└── README.md
```

---

## Características funcionales

- Registro de asistencia (incluye flujos públicos y validación pendiente para admin).
- Quórum en tiempo real y **instalación de sesión** cuando corresponde.
- Votaciones con activación en vivo, resultados y PDFs.
- Órganos de gobierno como **productos** por cliente.
- Formulario de contacto y gestión multi-cliente.

---

## Identidad visual (referencia)

- Degradado cyan (#00C6FF → #0072FF), fondos oscuros, acento dorado (#D4AF37).

---

## Créditos

Desarrollado por **Pivot Consulting** — [pivotconsulting.com.co](https://pivotconsulting.com.co)
