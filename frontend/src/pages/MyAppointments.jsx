// File: frontend/src/pages/MyAppointments.jsx - REAL WORKING PAGE
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, Loader2, AlertCircle, X } from 'lucide-react';

const MyAppointments = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get('/appointments');
      if (res.data?.success) {
        const allApts = res.data['data']?.appointments || [];
        // فلترة مواعيد الطبيب الحالي (بناءً على أن الباكند يرجع مواعيد الطبيب فقط)
        setAppointments(allApts);
      }
    } catch (err) {
      setError(err.message || 'فشل تحميل المواعيد');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      setError(err.message || 'فشل تحديث الحالة');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-purple-100 text-purple-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      SCHEDULED: 'مجدول',
      CONFIRMED: 'مؤكد',
      IN_PROGRESS: 'قيد الكشف',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg" type="button">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-800">مواعيدي</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded" type="button"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" />
              <p className="text-gray-600">جاري تحميل مواعيدك...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مواعيد قادمة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {apt.date ? new Date(apt.date).toLocaleDateString('ar-EG') : '-'}
                        </span>
                        {apt.startTime && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.startTime}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-800">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      {apt.reason && <p className="text-sm text-gray-600 mt-1">السبب: {apt.reason}</p>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {apt.status === 'SCHEDULED' && (
                        <button 
                          onClick={() => updateStatus(apt.id, 'CONFIRMED')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          type="button"
                          title="تأكيد الموعد"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {apt.status === 'CONFIRMED' && (
                        <button 
                          onClick={() => updateStatus(apt.id, 'IN_PROGRESS')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          type="button"
                          title="بدء الكشف"
                        >
                          <Calendar className="w-5 h-5" />
                        </button>
                      )}
                      {apt.status === 'IN_PROGRESS' && (
                        <button 
                          onClick={() => updateStatus(apt.id, 'COMPLETED')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          type="button"
                          title="إنهاء الكشف"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                        <button 
                          onClick={() => updateStatus(apt.id, 'CANCELLED')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          type="button"
                          title="إلغاء الموعد"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyAppointments;
