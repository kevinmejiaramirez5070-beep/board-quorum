# Sistema de Usuarios y Miembros

## 📋 SQL Adicional para Ejecutar

**IMPORTANTE:** Ejecuta este SQL además del de quórum para habilitar cuentas de usuario para miembros:

```sql
-- Vincular miembros con usuarios del sistema
ALTER TABLE members 
ADD COLUMN user_id INT NULL 
COMMENT 'ID del usuario del sistema asociado a este miembro';

CREATE INDEX idx_members_user ON members(user_id);
```

**O ejecuta el archivo completo:** `backend/migrations/complete-quorum-migration.sql` (ya incluye este campo)

---

## ✅ Funcionalidades Implementadas

### 1. **Creación de Cuentas de Usuario para Miembros**
- ✅ Al crear un miembro, opción de crear cuenta de usuario automáticamente
- ✅ Generación de contraseña temporal (8 caracteres hexadecimales)
- ✅ Vinculación automática entre `members` y `users` mediante `user_id`

### 2. **Sistema de Roles**
- ✅ **Admin**: Acceso completo (crear reuniones, gestionar miembros, administración)
- ✅ **Member**: Acceso limitado (ver reuniones, asistencia, votaciones)

### 3. **Rutas Protegidas**
- ✅ Rutas de administración solo para `admin`
- ✅ Rutas de reuniones y votaciones para `admin` y `member`
- ✅ Componente `AdminRoute` para proteger rutas de admin

### 4. **Frontend Actualizado**
- ✅ Header muestra diferentes opciones según el rol
- ✅ Badge de rol (Admin/Miembro) en el header
- ✅ Checkbox en formulario de miembros para crear cuenta de usuario
- ✅ Alerta con contraseña temporal cuando se crea cuenta

---

## 🔄 Flujo de Uso

### Para el Administrador:

1. **Crear un Miembro con Cuenta de Usuario:**
   - Ir a "Gestión de Miembros"
   - Hacer clic en "+ Nuevo Miembro"
   - Llenar: Nombre, Email, Rol, Cargo
   - **Marcar checkbox "Crear cuenta de usuario para este miembro"**
   - Hacer clic en "Crear"
   - **Se mostrará una alerta con la contraseña temporal**
   - Compartir email y contraseña temporal con el miembro

2. **El Miembro Puede:**
   - Iniciar sesión con su email y la contraseña temporal
   - Ver reuniones
   - Registrar asistencia
   - Participar en votaciones
   - Ver resultados de votaciones
   - **NO puede:** crear reuniones, gestionar miembros, acceder a administración

---

## 📊 Diferencias entre Roles

| Funcionalidad | Admin | Member |
|--------------|-------|--------|
| Ver reuniones | ✅ | ✅ |
| Crear reuniones | ✅ | ❌ |
| Editar reuniones | ✅ | ❌ |
| Eliminar reuniones | ✅ | ❌ |
| Registrar asistencia | ✅ | ✅ |
| Ver asistencia | ✅ | ✅ |
| Crear votaciones | ✅ | ❌ |
| Participar en votaciones | ✅ | ✅ |
| Ver resultados | ✅ | ✅ |
| Gestionar miembros | ✅ | ❌ |
| Administración | ✅ | ❌ |
| Instalar sesión | ✅ | ❌ |

---

## 🔐 Seguridad

- Los miembros tienen rol `'member'` (no `'admin'`)
- Las rutas de administración están protegidas con `isAdmin` middleware
- Los miembros solo pueden acceder a funcionalidades básicas
- La contraseña temporal debe cambiarse en el primer acceso (pendiente implementar)

---

## 📝 Notas Importantes

- **Contraseña Temporal:** Se genera automáticamente (8 caracteres hexadecimales)
- **Email Único:** No se puede crear cuenta si el email ya existe como usuario
- **Vincular Miembro Existente:** Si un miembro ya existe, se puede vincular manualmente editando el `user_id`
- **Sin Email:** Si no se proporciona email, no se puede crear cuenta de usuario

---

## 🚀 Próximos Pasos (Pendientes)

1. **Cambio de Contraseña:**
   - Endpoint para cambiar contraseña
   - Forzar cambio en primer acceso

2. **Recuperación de Contraseña:**
   - Sistema de recuperación por email

3. **Perfil de Miembro:**
   - Página donde el miembro puede ver su información
   - Cambiar contraseña
   - Ver sus votos y asistencia

4. **Notificaciones:**
   - Email automático con contraseña temporal
   - Recordatorios de reuniones

---

**Fecha de Implementación:** Diciembre 2025  
**Versión:** 1.0.0






