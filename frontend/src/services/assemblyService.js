import api from './api';

export const assemblyService = {
  // Carga el maestro de delegados (XLSX). mode: 'upsert' | 'insert_only'
  importMembers: (productId, file, mode = 'upsert') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return api.post(`/assembly/${productId}/members/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getSummary: (productId) => api.get(`/assembly/${productId}/members/summary`),
  getMembers: (productId) => api.get(`/assembly/${productId}/members`),
  deactivateMember: (productId, memberId) =>
    api.patch(`/assembly/${productId}/members/${memberId}/deactivate`)
};
