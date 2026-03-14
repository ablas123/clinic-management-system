// File: frontend/src/services/api.js - COMPLETE & CONSISTENT
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://clinic-backend-1g7c.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Unified error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = 
      error.response?.data?.message || 
      error.response?.data?.error ||
      error.message || 
      'خطأ في الاتصال بالخادم';
    return Promise.reject(new Error(message));
  }
);

export default api;