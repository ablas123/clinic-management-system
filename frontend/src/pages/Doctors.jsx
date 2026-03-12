import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Stethoscope, Plus, Trash2, Search, ArrowLeft, Loader2, AlertCircle, X, CheckCircle, XCircle } from 'lucide-react';

const Doctors = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
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
      const response = await api.get('/doctors');
      if (response.data?.success) {
        setDoctors(response.data.data?.doctors || []);
      } else {
        setError(response.data?.message || 'فشل جلب البيانات');
      }
    } catch (err) {
      console.error('❌ Error fetching doctors:', err);
      setError(err.response?.data?.message || 'خطأ في الاتصال بالخادم');
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
      const response = await api.post('/doctors', formData);
      if (response.data?.success) {
        setDoctors([response.data.data?.doctor, ...doctors]);
        setShowForm(false);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', specialization: '', licenseNumber: '', isAvailable: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إضافة الطبيب');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
    try {
      const response = await api.delete(`/doctors/${id}`);
      if (response.data?.success) {
        setDoctors(doctors.filter(d => d.id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حذف الطبيب');
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      const response = await api.patch(`/doctors/${id}/availability`, { isAvailable: !currentStatus });
      if (response.data?.success) {
        setDoctors(doctors.map(d => d.id === id ? { ...d, isAvailable: !currentStatus } : d));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    doctor.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-800">إدارة الأطباء</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
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
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded"><X className="w-4 h-4" /></button>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">إضافة طبيب جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم الأول" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="اسم العائلة" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="التخصص (مثال: قلب، أطفال)" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="رقم الترخيص" value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? 'جاري...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="بحث بالاسم أو التخصص..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-8 text-center text-gray-500"><Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{search ? 'لا توجد نتائج' : 'لا يوجد أطباء مسجلين'}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الاسم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">التخصص</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden sm:table-cell">الهاتف</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDoctors.map((doctor, index) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{doctor.firstName} {doctor.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{doctor.specialization}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{doctor.phone}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleAvailability(doctor.id, doctor.isAvailable)} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${doctor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {doctor.isAvailable ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {doctor.isAvailable ? 'متاح' : 'غير متاح'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(doctor.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
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