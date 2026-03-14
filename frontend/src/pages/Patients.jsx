// File: frontend/src/pages/Patients.jsx - PRODUCTION READY (FIXED)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, Plus, Search, Edit, Trash2, ArrowLeft, Loader2, AlertCircle, X, User, Phone, Mail, Calendar, Droplet } from 'lucide-react';

const Patients = () => {
  const { logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
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
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalHistory: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    fetchPatients();
  }, [pagination.page]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/patients?page=${pagination.page}&limit=${pagination.limit}&search=${search}`);
      
      if (response.data?.success) {
        const data = response.data.data?.patients || response.data['data']?.patients || [];
        const pagination = response.data.data?.pagination || response.data['data']?.pagination || {};
        setPatients(data);
        setPagination(prev => ({
          ...prev,
          total: pagination.total || 0,
          pages: pagination.pages || 0
        }));
      }
    } catch (err) {
      setError(err.message || 'فشل تحميل المرضى');
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
      const url = editingId ? `/patients/${editingId}` : '/patients';
      const method = editingId ? 'put' : 'post';
      
      const response = await api[method](url, formData);
      
      if (response.data?.success) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
          gender: '', bloodType: '', address: '', emergencyContact: '',
          emergencyPhone: '', medicalHistory: ''
        });
        fetchPatients();
      }
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? 'فشل تحديث المريض' : 'فشل إضافة المريض'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (patient) => {
    setFormData({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      email: patient.email || '',
      phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      gender: patient.gender || '',
      bloodType: patient.bloodType || '',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      medicalHistory: patient.medicalHistory || ''
    });
    setEditingId(patient.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المريض؟')) return;
    try {
      await api.delete(`/patients/${id}`);
      setPatients(patients.filter(p => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حذف المريض');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPatients();
  };

  const getGenderLabel = (gender) => {
    const labels = { MALE: 'ذكر', FEMALE: 'أنثى', OTHER: 'أخرى' };
    return labels[gender] || gender;
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
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">إدارة المرضى</h1>
            </div>
          </div>
          {hasRole(['ADMIN', 'RECEPTIONIST']) && (
            <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" type="button">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">إضافة مريض</span>
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
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded" type="button"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم الأول *" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="اسم العائلة *" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <input type="tel" placeholder="رقم الهاتف *" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="date" placeholder="تاريخ الميلاد" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2">
                <option value="">الجنس</option>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
                <option value="OTHER">أخرى</option>
              </select>
              <select value={formData.bloodType} onChange={(e) => setFormData({...formData, bloodType: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2">
                <option value="">فصيلة الدم</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              <input type="text" placeholder="العنوان" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <input type="text" placeholder="جهة اتصال الطوارئ" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <input type="tel" placeholder="هاتف الطوارئ" value={formData.emergencyPhone} onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <textarea placeholder="التاريخ الطبي" value={formData.medicalHistory} onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="3" />
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? 'جاري...' : (editingId ? 'تحديث' : 'إضافة')}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="بحث باسم المريض، الهاتف، أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700" type="button">بحث</button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" /><p className="text-gray-600">جاري تحميل المرضى...</p></div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'لا توجد نتائج' : 'لا يوجد مرضى مسجلين'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المريض</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الهاتف</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden lg:table-cell">البريد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden sm:table-cell">الجنس</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden sm:table-cell">فصيلة الدم</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((patient, index) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{((pagination.page - 1) * pagination.limit) + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{patient.firstName} {patient.lastName}</p>
                            {patient.dateOfBirth && <p className="text-xs text-gray-500"><Calendar className="w-3 h-3 inline ml-1" />{new Date(patient.dateOfBirth).toLocaleDateString('ar-EG')}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell"><Phone className="w-3 h-3 inline ml-1 text-gray-400" />{patient.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell"><Mail className="w-3 h-3 inline ml-1 text-gray-400" />{patient.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{getGenderLabel(patient.gender) || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{patient.bloodType ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium"><Droplet className="w-3 h-3 inline ml-1" />{patient.bloodType}</span> : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {hasRole(['ADMIN', 'RECEPTIONIST']) && (
                            <>
                              <button onClick={() => handleEdit(patient)} className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded" type="button" title="تعديل"><Edit className="w-4 h-4" /></button>
                              {hasRole('ADMIN') && <button onClick={() => handleDelete(patient.id)} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" type="button" title="حذف"><Trash2 className="w-4 h-4" /></button>}
                            </>
                          )}
                          <button onClick={() => navigate(`/appointments?patient=${patient.id}`)} className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded" type="button" title="مواعيد"><Calendar className="w-4 h-4" /></button>
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

export default Patients;