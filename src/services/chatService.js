import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getConversations = async () => {
  const response = await axios.get(`${API_URL}/api/chat/conversations`, getAuthHeaders());
  return response.data;
};

export const startConversation = async (providerId) => {
  const response = await axios.post(`${API_URL}/api/chat/conversations`, { providerId }, getAuthHeaders());
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await axios.get(`${API_URL}/api/chat/${conversationId}/messages`, getAuthHeaders());
  return response.data;
};

export const sendMessage = async (conversationId, content) => {
  const response = await axios.post(`${API_URL}/api/chat/${conversationId}/messages`, { content }, getAuthHeaders());
  return response.data;
};

export const getProviders = async () => {
  const response = await axios.get(`${API_URL}/api/chat/providers`, getAuthHeaders());
  return response.data;
};
