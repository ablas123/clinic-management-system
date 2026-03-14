// File: frontend/src/pages/MedicalRecords.jsx - PRODUCTION READY
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, FileText, Plus, Search, Loader2, AlertCircle, X, User, Calendar, Clipboard } from 'lucide-react';

const MedicalRecords = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    attachments: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [recordsRes, patientsRes] = await Promise.all([
        api.get('/medical-records'),
        api.get('/patients')
      ]);

      if (recordsRes.data?.success) {
        setRecords(recordsRes.data['data']?.records || []);
      }
      if (patientsRes.data?.success) {
        setPatients(patientsRes.data['data']?.patients || []);
      }
    } catch (err) {
      setError(err.message || 'فشل تحميل البيانات');
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
      await api.post('/medical-records', formData);
      setShowForm(false);
      setFormData({ patientId: '', diagnosis: '', symptoms: '', treatment: '', prescription: '', attachments: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إضافة السجل');
    } finally {
      setSubmitting(false);
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
              <FileText className="w-6 h-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-800">السجلات الطبية</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg" type="button">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">سجل جديد</span>
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
              <h2 className="text-lg font-bold text-gray-800">إضافة سجل طبي جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded" type="button"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required>
                <option value="">اختر المريض</option>
                {patients.map(p => (<option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>))}
              </select>
              <input type="text" placeholder="التشخيص" value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <textarea placeholder="الأعراض" value={formData.symptoms} onChange={(e) => setFormData({...formData, symptoms: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="2" />
              <textarea placeholder="العلاج" value={formData.treatment} onChange={(e) => setFormData({...formData, treatment: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="2" />
              <textarea placeholder="الوصفة الطبية" value={formData.prescription} onChange={(e) => setFormData({...formData, prescription: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="3" />
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
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
            <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد سجلات طبية</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clipboard className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{record.patient?.firstName} {record.patient?.lastName}</p>
                      {record.diagnosis && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">التشخيص:</span> {record.diagnosis}</p>}
                      {record.prescription && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">الوصفة:</span> {record.prescription}</p>}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {record.createdAt ? new Date(record.createdAt).toLocaleDateString('ar-EG') : '-'}
                      </p>
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

export default MedicalRecords;
