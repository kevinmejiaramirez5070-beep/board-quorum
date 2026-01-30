# 📥 EXPORTAR DATOS DE MYSQL PARA SUPABASE

## 📋 PASO 1: EXPORTAR DATOS DE MYSQL

1. Abre phpMyAdmin: http://localhost/phpmyadmin
2. Selecciona la base de datos `juntas`
3. Ve a la pestaña **"Exportar"**
4. Configura:
   - **Método:** Personalizado
   - **Formato:** SQL
   - Marca: **"Datos"** (solo datos, no estructura)
   - Marca: **"INSERT"** statements
5. Haz clic en **"Continuar"** o **"Ejecutar"**
6. Guarda el archivo como `juntas_datos.sql`

---

## 🔄 PASO 2: ADAPTAR LOS DATOS PARA POSTGRESQL

Los datos necesitan pequeñas adaptaciones:

1. **Reemplazar `INSERT IGNORE`** por `INSERT ... ON CONFLICT DO NOTHING`
2. **Ajustar fechas** si es necesario
3. **Verificar valores booleanos** (0/1 → false/true)

---

## 📝 PASO 3: IMPORTAR EN SUPABASE

1. En Supabase, ve a tu proyecto
2. Ve a **"SQL Editor"** (en el menú lateral)
3. Primero ejecuta el script de estructura: `SUPABASE_POSTGRESQL_COMPLETO.sql`
4. Luego pega y ejecuta tus datos adaptados

---

**¿Ya exportaste los datos de MySQL?** Te ayudo a adaptarlos después.
