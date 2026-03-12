// ===========================================
// 🔗 API SERVICE CONFIGURATION
// ===========================================
// File: src/services/api.js
// Description: Axios setup with automatic token injection

import axios from 'axios';

// 🌐 Backend URL (من متغيرات البيئة أو قيمة افتراضية)
const API_URL = import.meta.env.VITE_API_URL || 'https://clinic-backend-1g7c.onrender.com/api';

// 🔧 إنشاء instance من Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🎫 Intercept requests to add token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ❌ Intercept responses to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===========================================
// 📤 EXPORT API INSTANCE
// ===========================================
export default api; 
