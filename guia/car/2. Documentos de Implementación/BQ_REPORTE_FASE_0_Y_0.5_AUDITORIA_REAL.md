# BQ_REPORTE_FASE_0_Y_0.5 — AUDITORÍA REAL DEL CÓDIGO

**Proyecto:** Board Quorum
**Cliente:** ASOCOLCI
**Instancia:** Asamblea General de Delegados
**Fecha:** 2026-07-25
**Ejecutado por:** Auditoría automática sobre el repositorio local
**Estado:** COMPLETO — base para congelar el backlog real

> **Alcance de esta auditoría:** se ejecutó contra el **código fuente del repositorio**
> (modelos, servicios, controladores, migraciones SQL, package.json y frontend).
> No se ejecutó contra la base de datos viva de producción (Supabase/PostgreSQL en Render),
> porque no hay acceso directo a ella desde este entorno. Los `product_id` / `client_id`
> exactos deben confirmarse con una consulta en producción (ver pendientes al final).
> Todo lo demás — estructura de tablas, campos, servicios existentes — se verificó en el código real.

---

## RESUMEN EJECUTIVO

| Pregunta clave | Respuesta |
|---|---|
| ¿La tabla `members` sirve para M2 sin cambios de esquema? | **SÍ** — tiene todos los campos requeridos |
| ¿El motor de quórum ya soporta Asamblea? | **SÍ, parcialmente** — `quorumService.js` ya calcula `asamblea` con `floor(n/2)+1` |
| ¿Existe base para votaciones (M4/M5)? | **SÍ** — tablas `votings` + `votes` y modelos existen |
| ¿Existe algo de: poderes, agenda, roles de sesión, actas, elecciones, snapshot, log import? | **NO** — hay que construir todo eso |
| ¿Hay librería para leer el `.xlsx` de delegados? | **NO** — falta `xlsx` y `multer` en el backend |
| ¿Hay librería PDF para el acta (M8)? | **SÍ** — `jspdf ^4.0.0` (hoy se usa en frontend) |

**Conclusión:** el cimiento (M2) y el motor (M1) son mayormente **ADAPTAR**, no construir.
Los módulos superiores (M3 poderes, M6 agenda, M7 roles, M8 acta, y las tablas de M4/M5) son **CONSTRUIR** desde cero.

---

## FASE 0 — RESULTADOS DE AUDITORÍA

### SECCIÓN 1 — Configuración base

```
S1.1 — client_id de ASOCOLCI
RESULTADO: Según la UI, ASOCOLCI es client=1 (URL /products?client=1). Confirmar en producción con:
           SELECT id,name FROM clients WHERE name ILIKE '%asocolci%';
ESTADO: Parcial (confirmar valor exacto en BD viva)

S1.2 — product_id de las instancias
RESULTADO: ASOCOLCI tiene DOS productos visibles en la UI:
           - "Asamblea General" → 0 miembros, 0 reuniones (VACÍO — aún sin maestro)
           - "Junta Directiva"  → 22 miembros, 9 reuniones
ESTADO: Existe — falta confirmar los product_id numéricos exactos en BD

S1.3 — meeting.type
RESULTADO: quorumService.normalizeMeetingType() reconoce 'junta_directiva' y 'asamblea'.
           JD usa mínimo fijo 7 de 12 slots. Asamblea usa floor(total/2)+1.
ESTADO: Existe
```

### SECCIÓN 2 — Tablas existentes (verificado en modelos + migraciones)

**2.2 `members` — columnas confirmadas en el modelo `Member.js` y migraciones:**

| Campo | ¿Existe? | Notas |
|---|---|---|
| `id` | ✅ | SERIAL/PK |
| `member_type` | ✅ | `'principal'` / `'suplente'` / `'junta_vigilancia'` |
| `principal_id` | ✅ | usado en INSERT/UPDATE del modelo |
| `cuenta_quorum` | ✅ | BOOLEAN (PG) / TINYINT (MySQL) default true |
| `puede_votar` | ✅ | BOOLEAN default true |
| `active` | ✅ | usado en todos los filtros (`active = true`) |
| `rol_organico` | ✅ | aquí irá el código del curso (ej. `SEXTO A`) |
| `numero_documento` | ✅ | VARCHAR(50) |
| `tipo_documento` | ✅ | VARCHAR(20) |
| `tipo_participante` | ✅ | PRINCIPAL/SUPLENTE/JUNTA_DE_VIGILANCIA |
| `rol_en_votacion` | ✅ | PRINCIPAL/SUPLENTE_ACTUANDO/... |
| `product_id` | ✅ | aísla Asamblea de JD |
| `client_id` | ✅ | aísla ASOCOLCI |
| `position` | ✅ | cargo funcional |

> **Consecuencia:** M2 **no requiere cambios de esquema en `members`**. Riesgo R-02 del módulo (falta `principal_id`) queda **descartado**.

**2.2 `attendance` — columnas confirmadas en `Attendance.js` + migración `AGREGAR_CAMPOS_ATTENDANCE_SEGURO.sql`:**

| Campo | ¿Existe? |
|---|---|
| `acting_as_principal` | ✅ |
| `pending_approval` | ✅ |
| `manual_name`, `manual_position`, `manual_document` | ✅ |
| `status`, `arrival_time`, `member_id`, `meeting_id` | ✅ |

**2.5 Votaciones/elecciones:**
```
RESULTADO: Existen tablas `votings` y `votes` (modelos Voting.js, Vote.js).
           `votings`: meeting_id, title, description, type, status, options(JSON).
           NO existe tabla `elections` ni `approval_votes` ni `candidates`.
ESTADO: Parcial — base de votación simple existe; falta estructura documental (M5) y electoral (M4)
```

**2.3 / 2.4 / 2.6 / 2.7 / 2.8 / 2.9 — Log/auditoría, snapshot, agenda, roles de sesión, actas, poderes:**
```
RESULTADO: NO existe ninguna tabla para: import_log, audit_log, assembly_master_snapshot,
           agenda_items, session_roles/meeting_roles, actas/minutes, powers/poderes/proxy,
           elections, approval_votes.
ESTADO: No existe — CONSTRUIR
OBSERVACIÓN: Sí existe `join_requests` (solicitudes de unión), no relacionada.
```

### SECCIÓN 3 — Backend

```
S3.1 — Servicio de quórum
RESULTADO: backend/src/services/quorumService.js
MÉTODOS: normalizeMeetingType, calculateRequiredQuorum, countPresentWithVote,
         validateQuorumForInstallation, validateQuorumForVoting,
         calculateSimpleMajority, validateSimpleMajority, getQuorumInfo
¿Maneja 'asamblea'? SÍ — calcula floor(total/2)+1 y usa Member.countEligibleForQuorum
ESTADO: Existe — ADAPTAR (no reescribir)

S3.2 — assemblyQuorumService
RESULTADO: No existe (esperado)
ESTADO: No existe

S3.3 — Controlador de asistencia
RESULTADO: backend/src/controllers/attendanceController.js existe.
           El recálculo de quórum se hace vía QuorumService.getQuorumInfo desde meetingController.
ESTADO: Existe

S3.4 — Importación masiva (CSV/Excel)
RESULTADO: NO existe lógica de importación. No hay `multer`, `xlsx`, ni `csv`.
ESTADO: No existe — CONSTRUIR (requiere agregar dependencias npm)

S3.5 — Librerías PDF
RESULTADO: jspdf ^4.0.0 (en backend/package.json). Hoy el PDF se genera en el FRONTEND
           (frontend/src/pages/Voting/VotingResults.js con jsPDF).
ESTADO: Existe

S3.6 — Estructura backend
SERVICES:    emailService.js, quorumService.js
CONTROLLERS: attendance, auth, client, contact, joinRequest, meeting, member, product, vote, voting
MODELS:      Attendance, Client, JoinRequest, Meeting, Member, Product, User, Vote, Voting
ROUTES:      attendance, auth, clients, contact, meetings, members, products, votes, votings
```

### SECCIÓN 4 — Frontend

```
S4.1 — Detalle de sesión
RESULTADO: frontend/src/pages/Meetings/MeetingDetail.js — panel de quórum + instalar sesión +
           votaciones + asistencia. Reutilizable como base del panel de Asamblea.
ESTADO: Existe

S4.2 — Componentes de sesión reutilizables
RESULTADO: MeetingsList, MeetingDetail, RegisterAttendance, PublicAttendanceRegister,
           VotingDetail, VotingResults, CreateVoting, PublicVoting, Members (admin).
ESTADO: Existe — varios reutilizables/adaptables

S4.3 — Tabla/lista genérica
RESULTADO: No hay componente DataGrid genérico; se usan tablas HTML por página.
ESTADO: No existe (no bloqueante)
```

### SECCIÓN 5 — Datos de prueba

```
S5.1 — Reuniones de ASOCOLCI: JD tiene 9; Asamblea 0 (según UI).
S5.2 — Miembros de la instancia Asamblea: 0 (maestro aún no cargado).
       Archivo fuente disponible: guia/car/DELEGADOS_19MARZO2026.xlsx (138 registros esperados).
```

---

## FASE 0.5 — MAPA REUTILIZAR / ADAPTAR / CONSTRUIR

Leyenda: 🟢 REUTILIZAR (no tocar) · 🟡 ADAPTAR · 🔴 CONSTRUIR

### Módulo 2 — Carga y Validación de Delegados
| Componente | Acción | Detalle |
|---|---|---|
| Tabla `members` + campos | 🟢 | Todos los campos existen. Solo cargar datos con `product_id` de Asamblea |
| Normalización de cédula | 🟡 | Ya existe en frontend `Members.js` (`replace(/\D/g,'')`). Portar a servicio backend |
| Lectura de `.xlsx` | 🔴 | Agregar dependencia `xlsx` + `multer`. Nuevo `assemblyMembersService.js` |
| `linkSuplentesPrincipales()` | 🔴 | Lógica nueva de vínculo por `rol_organico` |
| `assembly_import_log` | 🔴 | Tabla nueva |
| `assembly_master_snapshot` | 🔴 | Tabla nueva + hook al abrir sesión |
| Bloqueo maestro en sesión activa | 🔴 | Validación HTTP 423 nueva |
| Panel frontend de carga | 🟡 | Adaptar patrón de `Members.js` |

### Módulo 1 — Motor de Quórum
| Componente | Acción | Detalle |
|---|---|---|
| `quorumService.js` (asamblea) | 🟡 | Ya calcula `floor(n/2)+1`. Extender: quórum por CURSOS representados, Momento 1/2 |
| `Member.countEligibleForQuorum` | 🟢 | Existe y ya filtra por `product_id` |
| `getActiveVoters()` | 🔴 | Método nuevo (base para M3/M4/M5) |
| Panel de quórum en vivo | 🟡 | Reutilizar `MeetingDetail.js`; añadir polling/refresh |
| Trazabilidad de cambios de quórum | 🔴 | Log nuevo |

### Módulo 3 — Poderes / Representación
| Componente | Acción |
|---|---|
| Tabla `powers` + servicio + endpoints + activación/suspensión automática | 🔴 CONSTRUIR completo |

### Módulo 4 — Procesos Electorales (BLOQUEADO por VF-04)
| Componente | Acción |
|---|---|
| Tabla `elections` + `candidates` + flujo de voto | 🔴 CONSTRUIR — **NO iniciar hasta resolver VF-04 (voto nominal vs secreto)** |

### Módulo 5 — Votaciones de Aprobación Documental (BLOQUEADO por VF-04)
| Componente | Acción |
|---|---|
| Tabla `approval_votes` + congelamiento de padrón + A favor/En contra/Abstención | 🔴 CONSTRUIR |
| Reutilizar `votings`/`votes` como base | 🟡 posible adaptación en vez de tabla nueva (a decidir) |

### Módulo 6 — Orden del Día
| Componente | Acción |
|---|---|
| Tabla `agenda_items` + plantilla 15 puntos + avanzar/completar/omitir | 🔴 CONSTRUIR |

### Módulo 7 — Roles de Asamblea
| Componente | Acción |
|---|---|
| Tabla `session_roles` + asignar/revocar + `getRolesForActa()` | 🔴 CONSTRUIR |

### Módulo 8 — Acta y Expediente
| Componente | Acción |
|---|---|
| Generación PDF | 🟡 Reutilizar patrón `jsPDF` de `VotingResults.js` |
| `buildActaPayload()` + acta definitiva + hash SHA-256 + expediente | 🔴 CONSTRUIR — **BLOQUEADO por VF-03 M8 (dónde se persiste el PDF)** |

---

## CONFIRMACIÓN DE AISLAMIENTO CON JUNTA DIRECTIVA

- Toda la lógica de Asamblea se filtra por `product_id`. JD y Asamblea son productos distintos del mismo `client_id`.
- `quorumService.js` **no se reescribe**; la lógica de Asamblea vive en ramas `if (mt === 'asamblea')` o en un servicio separado.
- **Regla permanente:** ninguna operación de Asamblea corre sin filtro `product_id`.

---

## PENDIENTES BLOQUEANTES (requieren decisión de Javier/negocio antes de construir)

| VF | Módulo | Pregunta | Bloquea |
|---|---|---|---|
| **VF-04** | M4/M5 | ¿El voto es **nominal o secreto**? | Todo el flujo de voto individual de Asamblea |
| **VF-03 M8** | M8 | ¿Dónde se persiste el PDF del acta (S3/R2, base64 en BD, disco)? | Cierre definitivo del acta |
| VF-01 M8 | M8 | ¿Formato del expediente (ZIP, PDFs, PDF único)? | Expediente |
| VF-02 M2 | M2 | ¿Puede el rol `authorized` cargar el maestro, o solo `admin`/`admin_master`? | Control de acceso de la carga |
| VF-01 M2 | M2 | En `upsert`, ¿actualizar automático o pedir confirmación? | Comportamiento de recarga |

**Confirmar también en producción (consulta directa a Supabase):**
1. `client_id` numérico exacto de ASOCOLCI.
2. `product_id` numérico de "Asamblea General" y de "Junta Directiva".
3. Valor de `meetings.type` usado hoy para JD (para no romperlo).

---

## RECOMENDACIÓN DE ARRANQUE (Camino Mínimo Viable)

El primer módulo construible **sin bloqueantes de negocio** es **M2 (Fase 1)**:
sus únicos VF (VF-01, VF-02) son de comportamiento, con defaults razonables
(`upsert` con confirmación; carga solo `admin`/`admin_master`).

Secuencia propuesta para las primeras iteraciones:
```
1. Confirmar product_id/client_id reales en Supabase
2. M2: agregar deps (xlsx, multer) → assemblyMembersService → endpoints import/list/summary/deactivate
       → tablas assembly_import_log + assembly_master_snapshot → panel de carga
       → cargar DELEGADOS_19MARZO2026.xlsx → maestro_listo = true
3. M1: extender quorumService (cursos representados, Momento 1/2) + getActiveVoters() + panel en vivo
4. (paralelo, en cuanto se responda VF-04) preparar M5 y M4
```

---

*BQ_REPORTE_FASE_0_Y_0.5 | Board Quorum | ASOCOLCI | 2026-07-25*
