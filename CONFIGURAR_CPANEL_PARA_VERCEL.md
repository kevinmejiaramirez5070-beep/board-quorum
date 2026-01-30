# 🔧 CONFIGURAR BASE DE DATOS CPANEL PARA VERCEL

## 📋 INFORMACIÓN QUE YA TIENES

- **Base de datos:** `datacast_boardquorum`
- **Usuario:** `datacast_quorum_user` (o el que creaste)
- **Contraseña:** `MAMATEAMO123.k`
- **Host:** Necesitamos la IP pública o habilitar acceso remoto

---

## 🔧 PASO 1: HABILITAR ACCESO REMOTO A MYSQL

### Opción A: Desde cPanel (Recomendado)

1. En cPanel, busca **"Remote MySQL"** o **"MySQL Remoto"**
2. Agrega la IP de Vercel:
   - Vercel usa IPs dinámicas, así que agrega: `0.0.0.0/0` (permite todas las IPs)
   - O busca "Vercel IP ranges" y agrega esos rangos
3. Haz clic en **"Add Host"** o **"Agregar Host"**

### Opción B: Si no aparece "Remote MySQL"

1. En cPanel, busca **"MySQL Databases"**
2. Busca la opción **"Remote MySQL"** o **"Access Hosts"**
3. Agrega `%` (permite todas las IPs) o la IP específica

---

## 🌐 PASO 2: OBTENER LA IP PÚBLICA DEL SERVIDOR

### Opción A: Usar el dominio

Si tu dominio apunta al servidor, puedes usar:
- **Host:** `datacastilla.com` (o el dominio que uses)
- **Port:** `3306`

### Opción B: Obtener la IP del servidor

1. En cPanel, busca **"Server Information"** o **"Información del Servidor"**
2. Busca **"Shared IP Address"** o **"IP Compartida"**
3. Anota esa IP

O puedes usar:
- Ve a: https://www.whatismyip.com
- Pero necesitas la IP del servidor, no la tuya

---

## ⚙️ PASO 3: CONFIGURAR EN VERCEL

1. En Vercel, ve a tu proyecto backend
2. Ve a **"Settings"** → **"Environment Variables"**
3. Actualiza estas variables:

```
DB_HOST=datacastilla.com
DB_USER=datacast_quorum_user
DB_PASSWORD=MAMATEAMO123.k
DB_NAME=datacast_boardquorum
DB_PORT=3306
```

**⚠️ IMPORTANTE:**
- Si el host no funciona con el dominio, usa la IP del servidor
- Asegúrate de que el acceso remoto esté habilitado

---

## 🔍 PASO 4: VERIFICAR QUE FUNCIONE

1. Prueba la conexión desde tu computadora local
2. O espera a que Vercel despliegue y revisa los logs

---

## 🐛 SI NO FUNCIONA

### Problema: "Access denied"
- Verifica que el acceso remoto esté habilitado
- Verifica las credenciales

### Problema: "Connection timeout"
- El servidor puede estar bloqueando conexiones externas
- Contacta al hosting para habilitar acceso remoto a MySQL

---

**¿Ya habilitaste el acceso remoto en cPanel?** Avísame y seguimos. 🚀
