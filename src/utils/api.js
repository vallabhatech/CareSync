import axios from 'axios';
import { sanitizeConfig, validateAndNormalizeHeaders, validateUrl } from './sanitize';
import httpConfig from './httpConfig';
import { getOfflineQueue, setOfflineQueue, enqueueOfflineRequest } from './indexedDB';


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

// Request interceptor to attach JWT token and sanitize/validate user-controlled configs
API.interceptors.request.use(
  (config) => {
    // ── SSRF guard: validate the resolved URL before sending ──────────────────
    // config.url is relative when using the baseURL, so we construct the
    // absolute URL here and validate it to prevent protocol abuse or
    // private-network targets being injected via dynamic config.
    const isAbsolute = config.url && (config.url.startsWith('http:') || config.url.startsWith('https:'));
    if (isAbsolute) {
      const resolvedUrl = config.baseURL
        ? new URL(config.url, config.baseURL).href
        : config.url;
      validateUrl(resolvedUrl); // throws on disallowed targets
    }


    if (config.headers) {
      config.headers = validateAndNormalizeHeaders(config.headers);
    }
    if (config.params) {
      config.params = sanitizeConfig(config.params);
    }
    if (config.data) {
      config.data = sanitizeConfig(config.data);
    }

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
  async (error) => {
    if (!error.response && error.message === 'Network Error') {
      if (error.config && ['post', 'put', 'delete', 'patch'].includes(error.config.method?.toLowerCase())) {
        
        // Validate/sanitize headers and remove stale authorization header before saving to queue
        const headers = validateAndNormalizeHeaders(error.config.headers || {});        
        // Case-insensitive removal of Authorization header
        const authKey = Object.keys(headers).find(k => k.toLowerCase() === 'authorization');
        if (authKey) {
          delete headers[authKey];
        }
        
        await enqueueOfflineRequest({
          url: error.config.url,
          method: error.config.method,
          data: sanitizeConfig(error.config.data),
          headers: headers
        });
        
        return Promise.reject(new Error('Device is offline. Action queued for sync when connection is restored.'));
      }
    }
    return Promise.reject(error);
  }
);

let isSyncing = false;

// Sync offline queue when coming online
window.addEventListener('online', async () => {
  if (isSyncing) return;
  isSyncing = true;
  
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;
    
    const remainingQueue = [];
    for (const req of queue) {
      try {
        // Re-validate URL before replaying — the environment may have changed
        // since the request was queued (e.g. baseURL env var updated).
        const isAbsolute = req.url && (req.url.startsWith('http:') || req.url.startsWith('https:'));
        if (isAbsolute) {
          const replayUrl = new URL(req.url, API.defaults.baseURL).href;
          validateUrl(replayUrl);
        }

        // Use API instance instead of raw axios to trigger request interceptors (like auth)
        await API({
          url: req.url,
          method: req.method,
          data: req.data,
          headers: req.headers
        });

      } catch (err) {
        // Distinguish retryable network errors/5xx from permanent 4xx failures
        const isRetryable = !err.response || err.response.status >= 500;
        req.retryCount = (req.retryCount || 0) + 1;
        
        if (isRetryable && req.retryCount < 3) {
          remainingQueue.push(req);
        } else {
          console.warn('Dropping permanently failed offline request:', req, err);
        }
      }
    }
    await setOfflineQueue(remainingQueue);
    // Optionally reload page to show synced data
    window.location.reload();
  } finally {
    isSyncing = false;
  }
});

export default API;
