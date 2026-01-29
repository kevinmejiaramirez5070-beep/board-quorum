import api from './api';

export const voteService = {
  cast: (data) => api.post('/votes', data),
  getByVoting: (votingId) => api.get(`/votes/voting/${votingId}`)
};

