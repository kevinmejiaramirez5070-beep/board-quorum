import api from './api';

export const contactService = {
  sendMessage: (data) => api.post('/contact', data)
};

