import api from './api';

export const joinRequestService = {
  // Solicitar unirse a una reunión
  requestToJoin: async (meetingId) => {
    const response = await api.post(`/meetings/${meetingId}/join-request`);
    return response;
  },

  // Obtener solicitudes pendientes de una reunión (admin)
  getPendingRequests: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/join-requests`);
    return response;
  },

  // Aceptar solicitud (admin)
  acceptRequest: async (meetingId, requestId) => {
    const response = await api.post(`/meetings/${meetingId}/join-requests/${requestId}/accept`);
    return response;
  },

  // Rechazar solicitud (admin)
  rejectRequest: async (meetingId, requestId) => {
    const response = await api.post(`/meetings/${meetingId}/join-requests/${requestId}/reject`);
    return response;
  },

  // Verificar si el usuario ya solicitó unirse
  checkUserRequest: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/join-request/status`);
    return response;
  }
};






