# 🚀 GUÍA PASO A PASO - SUPABASE + VERCEL

## ✅ VENTAJAS DE SUPABASE
- ✅ **100% GRATIS** - 500MB PostgreSQL
- ✅ Muy confiable y rápido
- ✅ Sin tarjeta de crédito
- ✅ Fácil de usar
- ✅ HTTPS incluido

---

## 📋 PASO 1: CREAR CUENTA EN SUPABASE

1. Ve a: **https://supabase.com**
2. Haz clic en **"Start your project"** o **"Sign Up"**
3. Regístrate con **GitHub** (recomendado - más fácil)
4. Autoriza Supabase para acceder a tu cuenta

**¿Ya tienes cuenta en Supabase?** Si sí, avísame y seguimos.

---

## 🗄️ PASO 2: CREAR PROYECTO EN SUPABASE

1. En Supabase, haz clic en **"New Project"** o **"Crear Proyecto"**
2. Configura:
   - **Name:** `boardquorum` (o el que prefieras)
   - **Database Password:** (elige una contraseña segura - **GUÁRDALA**)
   - **Region:** Elige el más cercano (ej: US East, Europe West)
   - **Pricing Plan:** **Free** (gratis)
3. Haz clic en **"Create new project"**
4. Espera a que se cree (2-3 minutos)

**¿Ya creaste el proyecto?** Avísame y seguimos.

---

## 🔑 PASO 3: OBTENER CREDENCIALES

1. En tu proyecto de Supabase, ve a **"Settings"** (engranaje) → **"Database"**
2. Busca la sección **"Connection string"** o **"Connection info"**
3. Haz clic en **"URI"** o **"Connection string"**
4. Copia la **"Connection string"** que te da (algo como):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. **Anota estas credenciales:**
   - **DATABASE_URL:** (la connection string completa)
   - O por separado:
     - **Host:** `db.xxxxx.supabase.co`
     - **User:** `postgres`
     - **Password:** (la que elegiste al crear el proyecto)
     - **Database:** `postgres`
     - **Port:** `5432`

**⚠️ IMPORTANTE:** Guarda estas credenciales, las necesitarás después.

**¿Ya obtuviste las credenciales?** Avísame y seguimos.

---

## ⚙️ PASO 4: CONFIGURAR EN VERCEL

1. En Vercel, ve a tu proyecto backend
2. Ve a **"Settings"** → **"Environment Variables"**
3. Agrega esta variable:

```
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@db.xxxxx.supabase.co:5432/postgres
```

**⚠️ IMPORTANTE:**
- Reemplaza `TU_CONTRASEÑA` con la contraseña que elegiste
- Reemplaza `db.xxxxx.supabase.co` con el host real de Supabase
- O agrega las variables por separado:

```
DB_TYPE=postgresql
DB_HOST=db.xxxxx.supabase.co
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA
DB_NAME=postgres
DB_PORT=5432
```

4. Haz clic en **"Save"**
5. Vercel redesplegará automáticamente

**¿Ya configuraste las variables en Vercel?** Avísame y seguimos.

---

## 📥 PASO 5: IMPORTAR BASE DE DATOS

Necesitas convertir tu base de datos MySQL a PostgreSQL e importarla.

**Te guío con esto después de que configures todo.**

---

## ✅ PASO 6: VERIFICAR

1. En Vercel, ve a tu proyecto backend
2. Ve a **"Deployments"** → Haz clic en el último despliegue
3. Revisa los logs para ver si se conectó correctamente
4. Prueba: `https://tu-backend.vercel.app/api/health`

---

**¿Por dónde quieres empezar?** Te guío paso a paso. 🚀
