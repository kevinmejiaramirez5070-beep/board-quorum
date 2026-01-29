# INSTRUCCIONES PARA CREAR TUNEL Y COMPARTIR CON CLIENTE

## OPCIÓN 1: Localtunnel (Actual - con contraseña)

### IPs a probar como contraseña:
- `190.131.202.169`
- `190.131.202.163`

### URLs actuales:
- Frontend: `https://violet-nights-dance.loca.lt`
- Backend: `https://little-bobcats-film.loca.lt`

---

## OPCIÓN 2: ngrok (Recomendado - sin contraseña)

### Pasos:

1. **Descargar ngrok:**
   - Ve a: https://ngrok.com/download
   - Descarga para Windows
   - O usa: `winget install ngrok`

2. **Crear cuenta gratuita:**
   - Ve a: https://dashboard.ngrok.com/signup
   - Crea cuenta gratuita
   - Copia tu authtoken

3. **Configurar ngrok:**
   ```powershell
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

4. **Iniciar túnel para FRONTEND:**
   ```powershell
   ngrok http 3000
   ```
   - Te dará una URL como: `https://abc123.ngrok-free.app`
   - Esta URL NO requiere contraseña

5. **Iniciar túnel para BACKEND (en otra terminal):**
   ```powershell
   ngrok http 5000
   ```
   - Te dará otra URL para el backend

6. **Actualizar configuración:**
   - Actualizar `juntas/frontend/src/services/api.js` con la URL del túnel del backend
   - Actualizar `juntas/backend/src/server.js` con la URL del túnel del frontend en CORS

---

## OPCIÓN 3: Cloudflare Tunnel (Alternativa)

Si ngrok no funciona, podemos usar Cloudflare Tunnel que también es gratuito.

---

**RECOMENDACIÓN:** Usa ngrok, es más profesional y no requiere contraseña para tu cliente.



