# Guía: Migrar base de datos de Railway a Supabase

Sigue estos pasos en orden para llevar todos los datos de tu base de datos en Railway a un nuevo proyecto en Supabase.

---

## Paso 1: Crear el proyecto en Supabase (ya estás aquí)

1. **Project name:** Pon un nombre, por ejemplo: `board-quorum` o `juntas-prod`.
2. **Database password:** Crea una contraseña fuerte y **guárdala**. Si quieres, usa "Generate a password".
3. **Region:** Déjalo en **Americas** (o la más cercana a tus usuarios).
4. Deja **Enable Data API** marcado si quieres usar la API de Supabase.
5. Pulsa **"Create new project"** y espera a que Supabase termine de crear el proyecto (1–2 minutos).

---

## Paso 2: Ejecutar el esquema en Supabase

1. En el proyecto nuevo, ve a **SQL Editor** (menú izquierdo).
2. Crea una nueva query y **copia todo el contenido** del archivo:
   `backend/migrations/MIGRACION_SUPABASE_ESQUEMA_COMPLETO.sql`
3. Pega en el editor y pulsa **Run**.
4. Verifica que no haya errores. Si aparece algo como "relation already exists", puede ser que ya existan tablas; en ese caso puedes ignorar o ejecutar solo las partes que falten.

Con esto ya tendrás todas las tablas vacías en Supabase: `clients`, `users`, `products`, `members`, `meetings`, `attendance`, `votings`, `votes`, `join_requests`, `contacts`.

---

## Paso 3: Obtener la conexión de Railway (base de datos actual)

1. Entra a **Railway** → tu proyecto → el servicio que tiene la base de datos PostgreSQL.
2. En la pestaña **Variables** o **Connect**, busca la variable de conexión. Suele llamarse:
   - `DATABASE_URL`, o
   - `POSTGRES_URL`, o
   - Un bloque "Connect" con host, port, user, password, database.
3. Si es una sola URL, tendrá la forma:
   ```text
   postgresql://usuario:contraseña@host:5432/nombre_base
   ```
4. **Cópiala** (o anota host, puerto, usuario, contraseña y nombre de la base). La necesitarás en el siguiente paso.

---

## Paso 4: Exportar los datos desde Railway

Tienes que ejecutar estos comandos en tu computadora (con PostgreSQL instalado) o desde un entorno que tenga acceso a la base de Railway.

**Opción A – Si tienes `psql` / `pg_dump` instalado (recomendado):**

1. Abre una terminal.
2. Sustituye `TU_URL_RAILWAY` por la URL de conexión de Railway que copiaste:

```bash
pg_dump "TU_URL_RAILWAY" \
  --data-only \
  --column-inserts \
  --table=clients \
  --table=users \
  --table=products \
  --table=members \
  --table=meetings \
  --table=attendance \
  --table=votings \
  --table=votes \
  --table=join_requests \
  --table=contacts \
  --no-owner \
  --no-privileges \
  -f datos_railway.sql
```

3. Se generará el archivo `datos_railway.sql` con muchos `INSERT`. Si en Railway tienes tablas con otros nombres o columnas distintas, ajusta los `--table=...`.

**Opción B – Si no tienes pg_dump instalado:**

- Instala PostgreSQL en tu PC (incluye `pg_dump`) o usa una herramienta gráfica:
  - **pgAdmin** o **DBeaver**: conéctate a la base de Railway y exporta cada tabla como INSERT o como CSV y luego importa en Supabase (más manual).

---

## Paso 5: Ajustar el archivo de datos (si usaste pg_dump)

1. Abre `datos_railway.sql`.
2. **Desactivar triggers temporalmente** (al inicio del archivo), añade:
   ```sql
   ALTER TABLE attendance DISABLE TRIGGER ALL;
   ALTER TABLE votes DISABLE TRIGGER ALL;
   ALTER TABLE votings DISABLE TRIGGER ALL;
   ALTER TABLE meetings DISABLE TRIGGER ALL;
   ALTER TABLE members DISABLE TRIGGER ALL;
   ALTER TABLE users DISABLE TRIGGER ALL;
   ALTER TABLE clients DISABLE TRIGGER ALL;
   ALTER TABLE products DISABLE TRIGGER ALL;
   ALTER TABLE join_requests DISABLE TRIGGER ALL;
   ```
3. **Orden de los INSERT:** deben ejecutarse respetando las claves foráneas:
   - Primero: `clients`
   - Luego: `users`, `products`
   - Después: `members`, `meetings`
   - Después: `attendance`, `votings`, `votes`, `join_requests`, `contacts`
4. Al **final** del archivo, vuelve a activar los triggers y reinicia las secuencias (para que los nuevos IDs sigan bien):

```sql
ALTER TABLE clients ENABLE TRIGGER ALL;
ALTER TABLE users ENABLE TRIGGER ALL;
ALTER TABLE products ENABLE TRIGGER ALL;
ALTER TABLE members ENABLE TRIGGER ALL;
ALTER TABLE meetings ENABLE TRIGGER ALL;
ALTER TABLE attendance ENABLE TRIGGER ALL;
ALTER TABLE votings ENABLE TRIGGER ALL;
ALTER TABLE votes ENABLE TRIGGER ALL;
ALTER TABLE join_requests ENABLE TRIGGER ALL;

SELECT setval('clients_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clients));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('members_id_seq', (SELECT COALESCE(MAX(id), 1) FROM members));
SELECT setval('meetings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM meetings));
SELECT setval('attendance_id_seq', (SELECT COALESCE(MAX(id), 1) FROM attendance));
SELECT setval('votings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM votings));
SELECT setval('votes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM votes));
SELECT setval('join_requests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM join_requests));
SELECT setval('contacts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM contacts));
```

5. Guarda el archivo.

---

## Paso 6: Importar los datos en Supabase

1. En Supabase, ve de nuevo al **SQL Editor**.
2. Abre el archivo `datos_railway.sql` (el que editaste) y **copia todo**.
3. Pégalo en una nueva query y pulsa **Run**.
4. Si hay errores por duplicados o por columnas que no existen, revisa:
   - Que el orden de los INSERT sea el correcto.
   - Que los nombres de columnas en los INSERT coincidan con las de Supabase (el esquema que ejecutaste en el Paso 2).

---

## Paso 7: Obtener la URL de conexión de Supabase

1. En Supabase, ve a **Project Settings** (icono de engranaje) → **Database**.
2. En **Connection string** elige **URI**.
3. Copia la URL. Será algo como:
   ```text
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. Sustituye `[YOUR-PASSWORD]` por la contraseña que pusiste al crear el proyecto (Paso 1).

---

## Paso 8: Configurar el backend para usar Supabase

Tu backend (Node.js) puede seguir en Railway o en otro hosting; solo debe apuntar a la base de datos de Supabase.

1. En el servicio donde corre el backend (Railway, Render, etc.), entra a **Variables** / **Environment**.
2. Pon o actualiza:
   - **`DATABASE_URL`** = la URL de conexión de Supabase que copiaste (la URI completa).
   - O bien **`SUPABASE_DB_URL`** = esa misma URL (tu `database.js` usa cualquiera de las dos).
3. Guarda y **redespliega** el backend para que tome la nueva variable.

No hace falta cambiar código si ya usas `DATABASE_URL` o `SUPABASE_DB_URL` para PostgreSQL.

---

## Paso 9: Comprobar que todo funciona

1. Abre tu aplicación (frontend) y entra con un usuario que exista en la base migrada.
2. Revisa que se listen bien las organizaciones, reuniones, miembros, etc.
3. Si algo falla, revisa los logs del backend y, en Supabase, el **SQL Editor** o **Table Editor** para ver que los datos estén en las tablas correctas.

---

## Resumen rápido

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | Supabase | Crear proyecto, guardar contraseña |
| 2 | Supabase SQL Editor | Ejecutar `MIGRACION_SUPABASE_ESQUEMA_COMPLETO.sql` |
| 3 | Railway | Copiar URL de la base de datos |
| 4 | Tu PC / terminal | Ejecutar `pg_dump` y generar `datos_railway.sql` |
| 5 | Archivo SQL | Ordenar INSERT, desactivar/activar triggers, setval |
| 6 | Supabase SQL Editor | Ejecutar `datos_railway.sql` |
| 7 | Supabase Settings → Database | Copiar connection string (URI) |
| 8 | Backend (Railway/Render) | `DATABASE_URL` o `SUPABASE_DB_URL` = URI de Supabase |
| 9 | App | Probar login y que se vean organizaciones y datos |

Si en algún paso te sale un error concreto (mensaje o pantallo), dime en qué paso y qué mensaje ves y lo ajustamos.
