import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gym_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for unified error and 401 handling
apiClient.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    const url = response.config.url || '';
    const isWrite = ['post', 'put', 'patch', 'delete'].includes(method || '');
    const isSessionRequest = /(?:^|\/)auth\/(login|refresh|logout)(?:\/|$)/i.test(url);

    if (isWrite && !isSessionRequest && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('gym:mutation-complete'));
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('gym_access_token');
        localStorage.removeItem('gym_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
