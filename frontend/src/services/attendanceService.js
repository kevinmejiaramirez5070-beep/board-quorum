import api from './api';

export const attendanceService = {
  getByMeeting: (meetingId) => api.get(`/attendance/meeting/${meetingId}`),
  register: (meetingId, data) => api.post(`/attendance/meeting/${meetingId}`, data),
  registerPublic: (meetingId, data) => api.post(`/attendance/public/meeting/${meetingId}`, data),
  update: (id, data) => api.put(`/attendance/${id}`, data)
};

