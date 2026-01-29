import api from './api';

export const meetingService = {
  getAll: () => api.get('/meetings'),
  getById: (id) => api.get(`/meetings/${id}`),
  getPublicById: (id) => {
    // Crear una instancia de axios sin el interceptor de auth para acceso público
    const axios = require('axios');
    const publicApi = axios.create({
      baseURL: api.defaults.baseURL || 'http://localhost:5000/api'
    });
    return publicApi.get(`/meetings/public/${id}`);
  },
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  getQuorum: (id) => api.get(`/meetings/${id}/quorum`),
  validateInstallation: (id) => api.get(`/meetings/${id}/validate-installation`),
  installSession: (id) => api.post(`/meetings/${id}/install-session`)
};

