import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — backend not reachable
      alert('❌ Cannot connect to server. Please make sure the backend is running on port 3001.');
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Your session has expired. Please log in again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
