// File: frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://clinic-backend-1g7c.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000 // 30 ثانية
});

// ✅ إضافة التوكن تلقائياً
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ معالجة الأخطاء المركزية مع عرض الرسالة الحقيقية
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // عرض الخطأ الحقيقي في الكونسول للتصحيح
    console.error('🔍 API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // إرجاع رسالة الخطأ الحقيقية بدلاً من "Unknown"
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error ||
      error.message || 
      'خطأ في الاتصال بالخادم';
      
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;