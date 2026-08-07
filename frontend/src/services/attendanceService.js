import api from './api';

export const attendanceService = {
  getByMeeting: (meetingId) => api.get(`/attendance/meeting/${meetingId}`),
  register: (meetingId, data) => api.post(`/attendance/meeting/${meetingId}`, data),
  registerBulk: (meetingId, member_ids, status = 'present') => api.post(`/attendance/meeting/${meetingId}/bulk`, { member_ids, status }),
  registerPublic: (meetingId, data) => api.post(`/attendance/public/meeting/${meetingId}`, data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  approvePending: (id) => api.patch(`/attendance/${id}/approve`),
  rejectPending: (id) => api.patch(`/attendance/${id}/reject`)
};

