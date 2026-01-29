# Implementación de Reglas de Quórum y Votaciones

## 📋 SQL para Ejecutar en la Base de Datos

**IMPORTANTE:** Ejecuta este SQL en tu base de datos MySQL antes de usar las nuevas funcionalidades:

```sql
-- ============================================
-- MIGRACIÓN COMPLETA: Reglas de Quórum y Votaciones
-- BOARD QUORUM - ASOCOLCI
-- ============================================

-- 1. Agregar campo para tipo de miembro (principal, suplente, junta_vigilancia)
ALTER TABLE members 
ADD COLUMN member_type VARCHAR(50) DEFAULT 'principal' 
COMMENT 'Tipo: principal, suplente, junta_vigilancia';

-- 2. Agregar campo para relacionar suplente con principal
ALTER TABLE members 
ADD COLUMN principal_id INT NULL 
COMMENT 'ID del miembro principal si este es suplente';

-- 3. Agregar índices para búsquedas por tipo
CREATE INDEX idx_members_type ON members(member_type);
CREATE INDEX idx_members_principal ON members(principal_id);

-- 4. Agregar campo para indicar si está actuando como principal (para suplentes)
ALTER TABLE attendance 
ADD COLUMN acting_as_principal TINYINT(1) DEFAULT 0 
COMMENT 'Indica si un suplente está actuando como principal';

-- 5. Agregar campo para estado de la sesión (instalada o no)
ALTER TABLE meetings 
ADD COLUMN session_installed TINYINT(1) DEFAULT 0 
COMMENT 'Indica si la sesión ha sido formalmente instalada';

-- 6. Agregar campo para fecha/hora de instalación de sesión
ALTER TABLE meetings 
ADD COLUMN session_installed_at DATETIME NULL 
COMMENT 'Fecha y hora en que se instaló formalmente la sesión';

-- 7. Actualizar miembros existentes para que sean 'principal' por defecto
UPDATE members SET member_type = 'principal' WHERE member_type IS NULL OR member_type = '';
```

**Archivo completo disponible en:** `backend/migrations/complete-quorum-migration.sql`

---

## ✅ Funcionalidades Implementadas

### 1. **Servicio de Quórum** (`backend/src/services/quorumService.js`)
- ✅ Cálculo de quórum para Junta Directiva (mínimo 7 presentes)
- ✅ Cálculo de quórum para Asamblea (floor(N/2) + 1)
- ✅ Validación de quórum para instalar sesión
- ✅ Validación de quórum para votaciones
- ✅ Cálculo de mayoría simple: `floor(votos_emitidos / 2) + 1`
- ✅ Validación de mayoría simple en decisiones

### 2. **Modelos Actualizados**
- ✅ **Member**: Soporte para principal/suplente/junta_vigilancia
- ✅ **Attendance**: Campo `acting_as_principal` para suplentes
- ✅ **Meeting**: Campos `session_installed` y `session_installed_at`

### 3. **Endpoints Nuevos**
- ✅ `GET /api/meetings/:id/validate-installation` - Valida si se puede instalar la sesión
- ✅ `POST /api/meetings/:id/install-session` - Instala formalmente la sesión

### 4. **Validaciones Implementadas**
- ✅ No se puede instalar sesión sin quórum suficiente
- ✅ No se puede activar votación sin sesión instalada
- ✅ No se puede votar sin sesión instalada y quórum válido
- ✅ Cálculo automático de mayoría simple en resultados

### 5. **Frontend Actualizado**
- ✅ Visualización de quórum con información detallada
- ✅ Botón para instalar sesión (solo si hay quórum válido)
- ✅ Indicador de sesión instalada/no instalada
- ✅ Validación de quórum al activar votaciones
- ✅ Mensajes de error informativos cuando falta quórum
- ✅ Visualización de mayoría simple en resultados de votación

---

## 🔄 Flujo de Uso

### Para Instalar una Sesión:
1. Registrar asistencia de miembros
2. Verificar quórum en la página de detalle de reunión
3. Si hay quórum suficiente (≥7 para JD), aparecerá el botón "Instalar Sesión"
4. Hacer clic en "Instalar Sesión" para formalizar la sesión

### Para Realizar Votaciones:
1. La sesión debe estar instalada
2. Crear una votación
3. Activar la votación (se valida quórum automáticamente)
4. Los miembros pueden votar
5. Los resultados muestran si alcanzó mayoría simple

---

## 📊 Reglas Implementadas

### Junta Directiva:
- **Quórum requerido:** Mínimo 7 presentes (de 12 posibles: 11 JD + 1 JV)
- **Mayoría simple:** Mitad de votos emitidos + 1

### Asamblea:
- **Quórum requerido:** floor(N/2) + 1 (donde N = total de delegados)
- **Mayoría simple:** Mitad de votos emitidos + 1

---

## 🚀 Próximos Pasos (Pendientes)

1. **Flujo de Elección de Cargos:**
   - Postulación de candidatos
   - Votación para elección
   - Nombramiento y aceptación de cargo

2. **Asamblea - Funcionalidades Específicas:**
   - Manejo de delegados por curso
   - Preasamblea vs Asamblea
   - Momento siguiente (60 minutos)
   - Validación de documento único por persona

3. **Mejoras Adicionales:**
   - Configuración de reglas por cliente
   - Historial de cambios de quórum
   - Notificaciones cuando se pierde quórum durante votación

---

## 📝 Notas Importantes

- Los miembros existentes se marcan automáticamente como 'principal'
- Para crear suplentes, usar `member_type: 'suplente'` y `principal_id`
- Para Junta de Vigilancia, usar `member_type: 'junta_vigilancia'`
- El sistema bloquea automáticamente acciones sin quórum válido

---

**Fecha de Implementación:** Diciembre 2025  
**Versión:** 1.0.0






