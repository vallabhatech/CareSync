import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const getConversations = async () => {
  const response = await api.get(`/api/chat/conversations`);
  return response.data;
};

export const startConversation = async (providerId) => {
  const response = await api.post(`/api/chat/conversations`, { providerId });
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await api.get(`/api/chat/${conversationId}/messages`);
  return response.data;
};

export const sendMessage = async (conversationId, content) => {
  const response = await api.post(`/api/chat/${conversationId}/messages`, { content });
  return response.data;
};

export const getProviders = async () => {
  const response = await api.get(`/api/chat/providers`);
  return response.data;
};
