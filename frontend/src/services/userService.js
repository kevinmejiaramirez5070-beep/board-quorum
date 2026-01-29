import api from './api';

export const userService = {
  // Cambiar contraseña
  changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response;
  },

  // Cambiar correo
  changeEmail: async (data) => {
    const response = await api.put('/auth/change-email', data);
    return response;
  },

  // Obtener perfil del usuario actual
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response;
  }
};






