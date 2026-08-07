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
  getQuorumDetail: (id) => api.get(`/meetings/${id}/quorum-detail`),
  validateInstallation: (id) => api.get(`/meetings/${id}/validate-installation`),
  installSession: (id) => api.post(`/meetings/${id}/install-session`),
  updateStatus: (id, status) => api.patch(`/meetings/${id}/status`, { status }),
  getAssemblyQuorum: (id) => api.get(`/meetings/${id}/assembly-quorum`),
  getAssemblyCourses: (id) => api.get(`/meetings/${id}/assembly-courses`),
  refreshAssemblyQuorum: (id) => api.post(`/meetings/${id}/assembly-quorum/refresh`),
  setJvRepresentative: (id, memberId) => api.post(`/meetings/${id}/jv-representative`, { member_id: memberId }),
  getJvRepresentative: (id) => api.get(`/meetings/${id}/jv-representative`)
};

