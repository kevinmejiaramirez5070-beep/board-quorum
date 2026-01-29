# INSTRUCCIONES PARA USAR CLOUDFLARE TUNNEL

## ✅ VENTAJAS DE CLOUDFLARE TUNNEL
- ✅ **GRATIS** - Sin límites
- ✅ **Múltiples túneles simultáneos** - Puedes tener frontend y backend al mismo tiempo
- ✅ **Sin contraseñas** - URLs directas
- ✅ **Más rápido y estable** que ngrok

---

## 📥 PASO 1: INSTALAR CLOUDFLARE TUNNEL

### Opción A: Usando winget (Recomendado)
1. Abre PowerShell como **Administrador**
2. Ejecuta:
   ```powershell
   winget install --id Cloudflare.cloudflared -e
   ```
3. Acepta los términos cuando te lo pida (presiona `Y`)

### Opción B: Descarga Manual
1. Ve a: https://github.com/cloudflare/cloudflared/releases/latest
2. Descarga: `cloudflared-windows-amd64.exe`
3. Renómbralo a: `cloudflared.exe`
4. Colócalo en: `C:\Windows\System32\` (o cualquier carpeta en tu PATH)
5. O guárdalo en una carpeta y agrega esa carpeta a tu PATH

---

## 🚀 PASO 2: INICIAR LOS TÚNELES

### Método 1: Script Automático (Recomendado)
1. Asegúrate de que el **FRONTEND** esté corriendo en `http://localhost:3000`
2. Asegúrate de que el **BACKEND** esté corriendo en `http://localhost:5000`
3. Ejecuta:
   ```powershell
   .\iniciar-cloudflare-tuneles.ps1
   ```

### Método 2: Manual (Dos Terminales)
**Terminal 1 - Frontend:**
```powershell
cloudflared tunnel --url http://localhost:3000
```
Copia la URL que aparezca (ejemplo: `https://xxxxx.trycloudflare.com`)

**Terminal 2 - Backend:**
```powershell
cloudflared tunnel --url http://localhost:5000
```
Copia la URL que aparezca (ejemplo: `https://yyyyy.trycloudflare.com`)

---

## ⚙️ PASO 3: CONFIGURAR EL FRONTEND

1. Abre el archivo: `juntas/frontend/src/services/api.js`
2. Busca la línea:
   ```javascript
   const BACKEND_TUNNEL_URL = 'https://superinfinitely-unresentful-cannon.ngrok-free.dev';
   ```
3. Cámbiala por la URL del túnel del **BACKEND** que copiaste:
   ```javascript
   const BACKEND_TUNNEL_URL = 'https://yyyyy.trycloudflare.com';
   ```
4. Guarda el archivo
5. **Reinicia el frontend** si está corriendo (Ctrl+C y luego `npm start`)

---

## 🔗 PASO 4: COMPARTIR CON TU CLIENTE

La URL que debes compartir con tu cliente es la del **FRONTEND**:
```
https://xxxxx.trycloudflare.com
```

---

## 📝 NOTAS IMPORTANTES

- ⚠️ Las URLs de Cloudflare Tunnel cambian cada vez que reinicias el túnel
- ✅ Si necesitas URLs permanentes, puedes crear un túnel con nombre (requiere cuenta de Cloudflare)
- ✅ Los túneles se mantienen activos mientras las terminales estén abiertas
- ✅ Puedes tener múltiples túneles corriendo al mismo tiempo sin problemas

---

## 🆘 SOLUCIÓN DE PROBLEMAS

**Error: "cloudflared no se reconoce"**
- Verifica que cloudflared esté instalado: `cloudflared --version`
- Si no está instalado, sigue el PASO 1

**Error: "Puerto ya en uso"**
- Verifica que el frontend/backend estén corriendo en los puertos correctos
- Cierra otros procesos que puedan estar usando esos puertos

**Error 404 al intentar iniciar sesión**
- Verifica que ambos túneles estén corriendo
- Verifica que la URL del backend en `api.js` sea correcta
- Reinicia el frontend después de cambiar la URL
