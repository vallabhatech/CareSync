import axios from 'axios';

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

if (!apiBaseURL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REACT_APP_API_BASE_URL is required in production. Set it in your deployment environment.');
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('REACT_APP_API_BASE_URL not set, defaulting to http://localhost:5000');
  }
}

const API = axios.create({
  baseURL: apiBaseURL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('caresync_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
