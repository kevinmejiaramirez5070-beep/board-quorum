# Usuarios y permisos (Board Quorum)

Referencia alineada con el informe **BQ_REPORTE_PRUEBA5_21MAR2026** (pestaña *Usuarios*). Los valores de `role` en la tabla `users` deben coincidir exactamente con los que espera el backend (`admin`, `authorized`, `admin_master`, `member`).

---

## ADMIN del cliente (ej. Nohora — “ADMIN-ASOCOLCI”)

| En base de datos | `role = 'admin'` y `client_id` = ID de la organización (solo ASOCOLCI). |
|------------------|------------------------------------------------------------------------|

**Puede**

- CRUD de **miembros** del órgano (panel **Miembros**).
- Crear / editar / eliminar **reuniones** antes y fuera del flujo “en vivo”.
- **Preparar votaciones** (crear, editar) según orden del día.
- Ver **configuración** de su cliente (dashboard, productos, reuniones).
- **Aprobar / rechazar** asistencias pendientes e invitados externos (según rutas actuales).

**No debe**

- Activar votaciones en vivo, instalar sesión, proyección de quórum ni PDFs “de sala” reservados al Autorizado (la app y el API ya lo restringen).
- Ver **otras organizaciones** ni el listado multi-cliente (eso es solo `admin_master`).

---

## AUTORIZADO del cliente (ej. Secretaría JD — “AUTORIZADO-ASOCOLCI”)

| En base de datos | `role = 'authorized'` y el mismo `client_id` que ASOCOLCI. |
|------------------|------------------------------------------------------------|

**Puede**

- Gestionar la reunión **en vivo**: quórum, **instalar sesión**, **activar votaciones**, **proyectar** pantalla completa.
- **Generar PDFs** de asistencia, reporte completo y resultados de votación (donde la UI lo muestra).
- Copiar / usar **enlaces** de asistencia y votación desde el detalle de reunión.
- Usar **registrar asistencia** interna (el API `GET /members` sigue permitido para armar el selector; **no** tiene acceso al panel de configuración de miembros).

**No debe**

- Ver el menú ni la ruta **`/admin/members`** (panel de configuración de miembros).
- Crear / editar / borrar miembros por API (solo `admin`).

---

## ADMIN MASTER (soporte Pivot / plataforma)

| En base de datos | `role = 'admin_master'`. |

Acceso multi-cliente: organizaciones, estadísticas globales, y en flujos de reunión se comporta como admin + autorizado donde el código lo contempla. Los usuarios del **cliente** no deberían usar esta cuenta en operación diaria.

---

## MIEMBRO (`member`)

Participante (p. ej. solicitud para unirse a reunión). Sin panel administrativo.

---

## Checklist antes de entrega (del informe)

1. Usuario **admin** con `client_id` de ASOCOLCI: probar CRUD miembros y creación de reuniones.
2. Comprobar que ese admin **no** ve otras organizaciones (solo datos filtrados por `client_id` en API).
3. Usuario **authorized** con el mismo `client_id`: probar quórum → instalar sesión → activar votación → PDF.
4. Comprobar que **authorized** **no** abre `/admin/members` (redirección a reuniones).
5. Flujo completo en reunión real con usuario **authorized**, sin usar **admin_master** para la operación del cliente.

---

## Crear o corregir usuarios en SQL

La contraseña debe ser **hash bcrypt** (como guarda la app). Lo más seguro es crear el usuario desde el **panel Admin Master** o un script Node con `bcrypt.hash`. Si solo necesitas **cambiar el rol**:

```sql
-- Sustituye el email y el rol deseado
UPDATE users
SET role = 'admin'          -- o 'authorized'
WHERE email = 'nohora@ejemplo.com'
  AND client_id = (SELECT id FROM clients WHERE subdomain = 'asocolci' LIMIT 1);
```

Para un **INSERT** manual necesitas: `email`, `password` (hash), `name`, `role`, `client_id`, `active`.

---

## Archivos clave en código

- Roles y middleware: `backend/src/middleware/auth.js`
- Miembros (GET list también para `authorized` — registro asistencia): `backend/src/routes/members.js`
- Navegación “Miembros” solo admin: `frontend/src/components/Layout/Header.js`
- Bloqueo de panel miembros: `frontend/src/pages/Admin/Members.js`
