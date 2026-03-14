// File: frontend/src/services/api.js - COMPLETE & NETWORK ERROR HANDLING
import axios from 'axios';

// ✅ Get API URL with fallback
const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  'https://clinic-backend-1g7c.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 seconds
  withCredentials: false // ✅ Important for CORS
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Unified response & error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors specifically
    if (!error.response) {
      console.error('🌐 Network Error - Check API URL and CORS:', {
        url: error.config?.url,
        baseURL: API_BASE_URL,
        message: error.message
      });
      return Promise.reject(new Error('خطأ في الاتصال بالخادم. تأكد من أن الخادم يعمل وأن عنوان API صحيح.'));
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.'));
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(new Error('غير مصرح لك بالوصول إلى هذا المورد.'));
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(new Error('المسار المطلوب غير موجود.'));
    }
    
    // Generic error message from backend
    const message = 
      error.response?.data?.message || 
      error.response?.data?.error ||
      error.message || 
      'حدث خطأ غير متوقع';
      
    return Promise.reject(new Error(message));
  }
);

// ✅ Helper: Test API connection
export const testApiConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    return { success: true,  response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      details: {
        url: `${API_BASE_URL}/health`,
        code: error.code,
        response: error.response?.status
      }
    };
  }
};

export default api;