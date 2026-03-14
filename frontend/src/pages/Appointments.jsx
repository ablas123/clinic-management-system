// File: frontend/src/pages/Appointments.jsx - PRODUCTION READY (FIXED)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, Plus, Trash2, Search, ArrowLeft, Loader2, AlertCircle, X, CheckCircle, XCircle, Clock, User } from 'lucide-react';

const Appointments = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    startTime: '',
    type: 'CHECKUP',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [aptRes, docRes, patRes] = await Promise.all([
        api.get('/appointments'),
        hasRole(['ADMIN', 'RECEPTIONIST']) ? api.get('/doctors') : Promise.resolve({ data: { success: true, data: { doctors: [] } } }),
        hasRole(['ADMIN', 'RECEPTIONIST']) ? api.get('/patients') : Promise.resolve({ data: { success: true, data: { patients: [] } } })
      ]);
      
      if (aptRes.data?.success) {
        const data = aptRes.data.data?.appointments || aptRes.data['data']?.appointments || [];
        setAppointments(data);
      }
      if (docRes.data?.success) {
        const data = docRes.data.data?.doctors || docRes.data['data']?.doctors || [];
        setDoctors(data);
      }
      if (patRes.data?.success) {
        const data = patRes.data.data?.patients || patRes.data['data']?.patients || [];
        setPatients(data);
      }
    } catch (err) {
      setError(err.message || 'خطأ في الاتصال');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/appointments', {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        date: formData.date,
        startTime: formData.startTime,
        type: formData.type,
        reason: formData.reason
      });

      if (response.data?.success) {
        const newApt = response.data.data?.appointment || response.data['data']?.appointment;
        setAppointments([newApt, ...appointments]);
        setShowForm(false);
        setFormData({ patientId: '', doctorId: '', date: '', startTime: '', type: 'CHECKUP', reason: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حجز الموعد');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إلغاء الموعد');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-purple-100 text-purple-700',
      CANCELLED: 'bg-red-100 text-red-700',
      NO_SHOW: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      SCHEDULED: 'مجدول',
      CONFIRMED: 'مؤكد',
      IN_PROGRESS: 'قيد التنفيذ',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
      NO_SHOW: 'غير حاضر'
    };
    return labels[status] || status;
  };

  const filteredAppointments = appointments.filter(apt => {
    const patientName = `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.toLowerCase();
    const doctorName = `${apt.doctor?.user?.firstName || ''} ${apt.doctor?.user?.lastName || ''}`.toLowerCase();
    const searchLower = search.toLowerCase();
    return patientName.includes(searchLower) || doctorName.includes(searchLower) || (apt.reason || '').toLowerCase().includes(searchLower);
  });

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
              <h1 className="text-xl font-bold text-gray-800">إدارة المواعيد</h1>
            </div>
          </div>
          {hasRole(['ADMIN', 'RECEPTIONIST']) && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg" type="button">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">حجز موعد</span>
            </button>
          )}
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

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">حجز موعد جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded" type="button"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required>
                <option value="">اختر المريض</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>

              <select value={formData.doctorId} onChange={(e) => setFormData({...formData, doctorId: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required>
                <option value="">اختر الطبيب</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.user?.firstName} {d.user?.lastName} - {d.specialty}</option>
                ))}
              </select>

              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2">
                <option value="CHECKUP">كشف عام</option>
                <option value="FOLLOWUP">متابعة</option>
                <option value="CONSULTATION">استشارة</option>
                <option value="PROCEDURE">إجراء</option>
                <option value="EMERGENCY">طارئ</option>
              </select>
              <input type="text" placeholder="سبب الموعد" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" />
              
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? 'جاري...' : 'حجز'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="بحث باسم المريض أو الطبيب أو السبب..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'لا توجد نتائج' : 'لا توجد مواعيد'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المريض</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الطبيب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden sm:table-cell">النوع</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.map((apt, index) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{apt.patient?.firstName} {apt.patient?.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{apt.date ? new Date(apt.date).toLocaleDateString('ar-EG') : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{apt.type}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {apt.status === 'SCHEDULED' && (
                            <button onClick={() => updateStatus(apt.id, 'CONFIRMED')} className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded" type="button" title="تأكيد"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                            <button onClick={() => updateStatus(apt.id, 'CANCELLED')} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" type="button" title="إلغاء"><XCircle className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleDelete(apt.id)} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" type="button" title="حذف"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Appointments;