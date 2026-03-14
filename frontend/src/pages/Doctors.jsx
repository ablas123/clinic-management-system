// File: frontend/src/pages/Doctors.jsx - PRODUCTION READY
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Stethoscope, Plus, Search, Edit, Trash2, ArrowLeft, Loader2, AlertCircle, X, User, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';

const Doctors = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
    licenseNumber: '',
    bio: '',
    consultationFee: '',
    maxPatientsPerDay: '20',
    isAvailable: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/doctors?search=${search}`);
      if (response.data?.success) {
        setDoctors(response.data['data']?.doctors || []);
      }
    } catch (err) {
      setError(err.message || 'فشل تحميل الأطباء');
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
      if (editingId) {
        // تحديث التوفر فقط للأطباء الموجودين
        await api.patch(`/doctors/${editingId}/availability`, { isAvailable: formData.isAvailable });
      } else {
        // إنشاء طبيب جديد (يتطلب كلمة مرور)
        if (!formData.password) {
          setError('كلمة المرور مطلوبة للأطباء الجدد');
          setSubmitting(false);
          return;
        }
        await api.post('/doctors', formData);
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({
        firstName: '', lastName: '', email: '', phone: '', password: '',
        specialty: '', licenseNumber: '', bio: '', consultationFee: '',
        maxPatientsPerDay: '20', isAvailable: true
      });
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? 'فشل التحديث' : 'فشل الإضافة'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (doctor) => {
    setFormData({
      firstName: doctor.user?.firstName || '',
      lastName: doctor.user?.lastName || '',
      email: doctor.user?.email || '',
      phone: doctor.user?.phone || '',
      password: '',
      specialty: doctor.specialty || '',
      licenseNumber: doctor.licenseNumber || '',
      bio: doctor.bio || '',
      consultationFee: doctor.consultationFee?.toString() || '',
      maxPatientsPerDay: doctor.maxPatientsPerDay?.toString() || '20',
      isAvailable: doctor.isAvailable
    });
    setEditingId(doctor.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطبيب؟ لا يمكن التراجع.')) return;
    try {
      await api.delete(`/doctors/${id}`);
      setDoctors(doctors.filter(d => d.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await api.patch(`/doctors/${id}/availability`, { isAvailable: !currentStatus });
      setDoctors(doctors.map(d => d.id === id ? { ...d, isAvailable: !currentStatus } : d));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الحالة');
    }
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
              <Stethoscope className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-800">إدارة الأطباء</h1>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg" type="button">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة طبيب</span>
          </button>
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
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded" type="button"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم الأول *" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="اسم العائلة *" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="email" placeholder="البريد الإلكتروني *" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              {!editingId && <input type="password" placeholder="كلمة المرور *" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />}
              <input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <input type="text" placeholder="التخصص *" value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="رقم الترخيص *" value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="number" placeholder="رسوم الاستشارة" value={formData.consultationFee} onChange={(e) => setFormData({...formData, consultationFee: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" step="0.01" min="0" />
              <input type="number" placeholder="حد المرضى يومياً" value={formData.maxPatientsPerDay} onChange={(e) => setFormData({...formData, maxPatientsPerDay: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" min="1" />
              <select value={formData.isAvailable} onChange={(e) => setFormData({...formData, isAvailable: e.target.value === 'true'})} className="border border-gray-300 rounded-lg px-4 py-2">
                <option value="true">متاح</option>
                <option value="false">غير متاح</option>
              </select>
              <textarea placeholder="نبذة عن الطبيب" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="3" />
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? 'جاري...' : (editingId ? 'تحديث' : 'إضافة')}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="بحث باسم الطبيب أو التخصص..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد أطباء مسجلين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الطبيب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">التخصص</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden lg:table-cell">الترخيص</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">رسوم الكشف</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doctors.map((doctor, index) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{doctor.user?.firstName} {doctor.user?.lastName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {doctor.user?.email || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{doctor.specialty || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell font-mono">{doctor.licenseNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">{doctor.consultationFee?.toFixed(2) || '0.00'} ر.س</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleAvailability(doctor.id, doctor.isAvailable)} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${doctor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} type="button">
                          {doctor.isAvailable ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {doctor.isAvailable ? 'متاح' : 'غير متاح'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(doctor)} className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded" type="button" title="تعديل"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(doctor.id)} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" type="button" title="حذف"><Trash2 className="w-4 h-4" /></button>
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

export default Doctors;