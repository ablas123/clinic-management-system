import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, Plus, Trash2, Edit, Search, ArrowLeft, Loader2, AlertCircle, X } from 'lucide-react';

const Patients = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    bloodType: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // 🔍 جلب المرضى عند التحميل
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching patients...');
      
      const response = await api.get('/patients');
      console.log('✅ Response:', response.data);
      
      if (response.data?.success) {
        setPatients(response.data.data?.patients || []);
      } else {
        setError(response.data?.message || 'فشل جلب البيانات');
      }
    } catch (err) {
      console.error('❌ Error fetching patients:', err);
      setError(err.response?.data?.message || 'خطأ في الاتصال بالخادم');
      
      // إذا كان الخطأ 401، سجل الخروج
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // ➕ إضافة مريض جديد
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      console.log('📤 Sending patient data:', formData);
      const response = await api.post('/patients', formData);
      console.log('✅ Patient created:', response.data);
      
      if (response.data?.success) {
        setPatients([response.data.data?.patient, ...patients]);
        setShowForm(false);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', gender: 'MALE', bloodType: '' });
      }
    } catch (err) {
      console.error('❌ Error creating patient:', err);
      setError(err.response?.data?.message || 'فشل إضافة المريض');
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ حذف مريض
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المريض؟')) return;

    try {
      const response = await api.delete(`/patients/${id}`);
      if (response.data?.success) {
        setPatients(patients.filter(p => p.id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حذف المريض');
    }
  };

  // 🔎 تصفية النتائج
  const filteredPatients = patients.filter(patient =>
    patient.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    patient.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    patient.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* 🔝 Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="العودة"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-800">إدارة المرضى</h1>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة مريض</span>
          </button>
        </div>
      </header>

      {/* 📊 Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ⚠️ Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 📝 Add Patient Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">إضافة مريض جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم الأول" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              <input type="text" placeholder="اسم العائلة" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              <input type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              <input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
              <input type="text" placeholder="فصيلة الدم (اختياري)" value={formData.bloodType} onChange={(e) => setFormData({...formData, bloodType: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? 'جاري...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 🔍 Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 📋 Patients Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'لا توجد نتائج للبحث' : 'لا يوجد مرضى مسجلين'}</p>
              {!search && !showForm && (
                <button onClick={() => setShowForm(true)} className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
                  + أضف أول مريض
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الاسم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">البريد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden sm:table-cell">الهاتف</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الفصيلة</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPatients.map((patient, index) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{patient.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{patient.phone}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                          {patient.bloodType || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 📊 Stats */}
        {!loading && (
          <div className="mt-6 text-center text-sm text-gray-500">
            عرض {filteredPatients.length} من أصل {patients.length} مريض
          </div>
        )}
      </main>
    </div>
  );
};

export default Patients;
