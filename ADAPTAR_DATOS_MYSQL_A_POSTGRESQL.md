# 🔄 ADAPTAR DATOS DE MYSQL A POSTGRESQL

## 📋 PASO 1: EXPORTAR DATOS DE MYSQL

1. Abre **phpMyAdmin**: http://localhost/phpmyadmin
2. Selecciona la base de datos **`juntas`**
3. Ve a la pestaña **"Exportar"** (arriba)
4. Configura:
   - **Método:** Personalizado
   - **Formato:** SQL
   - En la sección **"Opciones específicas"**:
     - ✅ Marca **"Datos"** (solo datos, NO estructura)
     - ✅ Desmarca **"Estructura"** (ya la creamos en Supabase)
     - ✅ Marca **"INSERT"** statements
   - En la sección **"Opciones de exportación"**:
     - ✅ Marca **"Completar INSERT statements"**
5. Haz clic en **"Continuar"** o **"Ejecutar"**
6. Guarda el archivo como `juntas_datos.sql` en tu escritorio

---

## 🔄 PASO 2: ADAPTAR LOS DATOS PARA POSTGRESQL

Después de exportar, necesitas hacer estos cambios en el archivo SQL:

### Cambios necesarios:

1. **Reemplazar `INSERT IGNORE`** → `INSERT ... ON CONFLICT DO NOTHING`
2. **Reemplazar `INSERT INTO`** → Asegurar que use `ON CONFLICT DO NOTHING` si hay duplicados
3. **Valores booleanos:** `0` → `false`, `1` → `true`
4. **Backticks (`)** → Eliminar (PostgreSQL no los usa)
5. **AUTO_INCREMENT** → Eliminar (PostgreSQL usa SERIAL)

### Ejemplo de transformación:

**MySQL:**
```sql
INSERT INTO `clients` (`id`, `name`, `active`) VALUES (1, 'ASOCOLCI', 1);
```

**PostgreSQL:**
```sql
INSERT INTO clients (id, name, active) VALUES (1, 'ASOCOLCI', true)
ON CONFLICT (id) DO NOTHING;
```

---

## 📝 PASO 3: IMPORTAR EN SUPABASE

1. En Supabase, ve a tu proyecto
2. Ve a **"SQL Editor"** (en el menú lateral izquierdo)
3. Abre el archivo `juntas_datos.sql` que exportaste
4. Copia y pega el contenido (ya adaptado) en el editor SQL
5. Haz clic en **"Run"** o presiona `Ctrl+Enter`
6. Espera a que termine la importación

---

## ⚠️ NOTA IMPORTANTE

Si el archivo es muy grande, puedes:
- Dividirlo en partes más pequeñas
- Importar tabla por tabla
- Usar el orden correcto (primero `clients`, luego `users`, luego `members`, etc.)

---

**¿Ya exportaste los datos?** Te ayudo a adaptarlos si necesitas.
