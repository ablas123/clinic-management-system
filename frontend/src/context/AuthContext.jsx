// File: frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // التحقق من صلاحية التوكن
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            // ✅ دعم كلا الشكلين: .data و ['data']
            const userData = res.data.data?.user || res.data['data']?.user;
            if (userData) {
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        } catch (e) {
          console.warn('⚠️ Token validation failed:', e.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response:', response.data);
      
      if (response.data?.success) {
        // ✅ دعم كلا الشكلين للاستجابة
        const responseData = response.data.data || response.data['data'];
        const token = responseData?.token;
        const userData = responseData?.user;
        
        console.log('📦 Extracted:', { token: token ? '***' : null, user: userData });
        
        if (token && userData) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          // ✅ إعادة التوجيه مع replace لمنع العودة لصفحة الدخول
          navigate('/dashboard', { replace: true });
          return { success: true };
        } else {
          console.error('❌ Missing token or user in response:', responseData);
          return { success: false, message: 'بيانات الدخول غير كاملة' };
        }
      }
      
      return { success: false, message: response.data?.message || 'فشل تسجيل الدخول' };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: error.message || 'خطأ في الاتصال بالخادم' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('⚠️ Logout error (ignored):', e.message);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const hasRole = (roles) => {
    if (!user?.role) return false;
    return Array.isArray(roles) ? roles.includes(user.role) : roles === user.role;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};