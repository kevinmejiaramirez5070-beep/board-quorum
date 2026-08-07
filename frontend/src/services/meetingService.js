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
  // M6 — Orden del Día
  getAgenda: (id) => api.get(`/meetings/${id}/agenda`),
  createAgenda: (id, tipo_sesion) => api.post(`/meetings/${id}/agenda`, { tipo_sesion }),
  loadAgendaTemplate: (id) => api.post(`/meetings/${id}/agenda/load-template`),
  publishAgenda: (id) => api.post(`/meetings/${id}/agenda/publish`),
  addAgendaItem: (id, data) => api.post(`/meetings/${id}/agenda/items`, data),
  startAgendaItem: (id, itemId) => api.post(`/meetings/${id}/agenda/items/${itemId}/start`),
  completeAgendaItem: (id, itemId, resultado_resumen) => api.post(`/meetings/${id}/agenda/items/${itemId}/complete`, { resultado_resumen }),
  skipAgendaItem: (id, itemId) => api.post(`/meetings/${id}/agenda/items/${itemId}/skip`),
  // M7 — Roles de Asamblea
  getRoles: (id) => api.get(`/meetings/${id}/roles`),
  getRolesForActa: (id) => api.get(`/meetings/${id}/roles/acta`),
  assignRole: (id, data) => api.post(`/meetings/${id}/roles`, data),
  revokeRole: (id, sessionRoleId) => api.delete(`/meetings/${id}/roles/${sessionRoleId}`),
  setJvRepresentative: (id, memberId) => api.post(`/meetings/${id}/jv-representative`, { member_id: memberId }),
  getJvRepresentative: (id) => api.get(`/meetings/${id}/jv-representative`)
};

