import axios from 'axios';

// ============================================
// CONFIGURACIÓN PARA CLOUDFLARE TUNNEL
// ============================================
// Para compartir la plataforma con tu cliente, necesitas DOS túneles de Cloudflare:
//
// 1. TÚNEL DEL BACKEND (puerto 5000):
//    Ejecuta: cloudflared tunnel --url http://localhost:5000
//    Copia la URL que te dé (ejemplo: https://xxxxx.trycloudflare.com)
//    ACTUALIZA la variable BACKEND_TUNNEL_URL abajo con esa URL
//
// 2. TÚNEL DEL FRONTEND (puerto 3000):
//    Ejecuta: cloudflared tunnel --url http://localhost:3000
//    Esta es la URL que compartes con tu cliente
//
// ============================================

// ACTUALIZA ESTA URL con la URL del túnel del BACKEND (si estás usando túnel)
// Si estás trabajando localmente, déjalo como 'http://localhost:5000'
const BACKEND_TUNNEL_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const API_URL = process.env.REACT_APP_API_URL || `${BACKEND_TUNNEL_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo redirigir si no estamos en la página de login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

