import axios from 'axios';

// In production (Vercel), API is on same origin. Locally, use localhost:3001
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sessionAPI = {
  create: (data) => api.post('/api/sessions', data),
  getAll: () => api.get('/api/sessions'),
  getById: (sessionId) => api.get(`/api/sessions/${sessionId}`),
  join: (sessionId) => api.post(`/api/sessions/${sessionId}/join`),
  complete: (sessionId) => api.post(`/api/sessions/${sessionId}/complete`),
  export: (sessionId) => api.get(`/api/sessions/${sessionId}/export`),
  inviteParticipants: (sessionId, emails) =>
    api.post(`/api/sessions/${sessionId}/invite`, { emails })
};

export const ideaAPI = {
  create: (data) => api.post('/api/ideas', data),
  getBySession: (sessionId) => api.get(`/api/ideas/session/${sessionId}`),
  update: (id, data) => api.put(`/api/ideas/${id}`, data),
  delete: (id) => api.delete(`/api/ideas/${id}`),
  vote: (id) => api.post(`/api/ideas/${id}/vote`),
  react: (id, emoji) => api.post(`/api/ideas/${id}/react`, { emoji })
};

export const clusterAPI = {
  trigger: (sessionId) => api.post('/api/clusters/trigger', { sessionId }),
  getBySession: (sessionId) => api.get(`/api/clusters/session/${sessionId}`),
  summarize: (sessionId) => api.post('/api/clusters/summarize', { sessionId }),
  generateIdeas: (sessionId, prompt) => api.post('/api/clusters/generate-ideas', { sessionId, prompt }),
  chat: (sessionId, message, history) => api.post('/api/clusters/chat', { sessionId, message, history })
};

export default api;
