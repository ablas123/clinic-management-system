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
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // التحقق من صلاحية التوكن في الخلفية
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.success) {
              const userData = res.data['data']?.user;
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // ✅ استخراج البيانات باستخدام ['data'] الآمن
      if (response.data?.success) {
        const responseData = response.data['data'];
        const token = responseData?.token;
        const userData = responseData?.user;
        
        if (token && userData) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          // ✅ إعادة التوجيه للوحة التحكم فوراً
          navigate('/dashboard', { replace: true });
          return { success: true };
        }
      }
      
      return { success: false, message: response.data?.message || 'فشل تسجيل الدخول' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'خطأ في الاتصال بالخادم' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // تجاهل أخطاء الخروج
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