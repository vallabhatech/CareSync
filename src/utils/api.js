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

// Response interceptor for offline queueing
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response && error.message === 'Network Error') {
      if (error.config && ['post', 'put', 'delete', 'patch'].includes(error.config.method?.toLowerCase())) {
        const offlineQueue = JSON.parse(localStorage.getItem('caresync_offline_queue') || '[]');
        offlineQueue.push({
          url: error.config.url,
          method: error.config.method,
          data: error.config.data,
          headers: error.config.headers
        });
        localStorage.setItem('caresync_offline_queue', JSON.stringify(offlineQueue));
        return Promise.reject(new Error('Device is offline. Action queued for sync when connection is restored.'));
      }
    }
    return Promise.reject(error);
  }
);

// Sync offline queue when coming online
window.addEventListener('online', async () => {
  const queue = JSON.parse(localStorage.getItem('caresync_offline_queue') || '[]');
  if (queue.length === 0) return;
  
  const remainingQueue = [];
  for (const req of queue) {
    try {
      await axios({
        url: req.url,
        method: req.method,
        data: req.data,
        headers: req.headers,
        baseURL: API.defaults.baseURL
      });
    } catch (err) {
      remainingQueue.push(req);
    }
  }
  localStorage.setItem('caresync_offline_queue', JSON.stringify(remainingQueue));
  // Optionally reload page to show synced data
  window.location.reload();
});

export default API;
