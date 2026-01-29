import api from './api';

export const votingService = {
  getByMeeting: (meetingId) => api.get(`/votings/meeting/${meetingId}`),
  getById: (id) => api.get(`/votings/${id}`),
  create: (meetingId, data) => api.post(`/votings/meeting/${meetingId}`, data),
  update: (id, data) => api.put(`/votings/${id}`, data),
  activate: (id) => api.put(`/votings/${id}/activate`),
  getResults: (id) => api.get(`/votings/${id}/results`)
};

