// File: frontend/src/pages/MedicalRecords.jsx - HL7-inspired, Production Ready
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, FileText, Plus, Search, Edit, Trash2, Loader2, AlertCircle, X, User, Calendar, Clipboard, Printer, Save } from 'lucide-react';

const MedicalRecords = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    attachments: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // ✅ Support patientId from URL params (from MyPatients page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patient');
    if (patientId && user?.role === 'DOCTOR') {
      setFormData(prev => ({ ...prev, patientId }));
      setShowForm(true);
    }
  }, [location.search, user?.role]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = '/api/medical-records';
      if (user?.role === 'DOCTOR' && formData.patientId) {
        url = `/api/medical-records/patient/${formData.patientId}`;
      }
      
      const [recordsRes, patientsRes] = await Promise.all([
        api.get(url),
        user?.role === 'DOCTOR' ? api.get('/api/patients') : Promise.resolve({ data: { success: true, data: { patients: [] } } })
      ]);

      if (recordsRes.data?.success) {
        const recordsData = 
          recordsRes.data.data?.records || 
          recordsRes.data['data']?.records || 
          [];
        setRecords(recordsData);
      }
      
      if (patientsRes.data?.success) {
        const patientsData = 
          patientsRes.data.data?.patients || 
          patientsRes.data['data']?.patients || 
          [];
        setPatients(patientsData);
      }
    } catch (err) {
      console.error('💥 [MedicalRecords] Fetch error:', err);
      setError(err.message || 'فشل تحميل السجلات الطبية');
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
      const payload = {
        patientId: formData.patientId,
        appointmentId: formData.appointmentId || null,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms || null,
        treatment: formData.treatment || null,
        prescription: formData.prescription || null,
        attachments: formData.attachments || null,
        notes: formData.notes || null
      };

      if (editingId) {
        await api.put(`/api/medical-records/${editingId}`, payload);
      } else {
        await api.post('/api/medical-records', payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({
        patientId: '', appointmentId: '', diagnosis: '', symptoms: '',
        treatment: '', prescription: '', attachments: '', notes: ''
      });
      fetchData();
    } catch (err) {
      console.error('❌ [MedicalRecords] Submit error:', err);
      setError(err.response?.data?.message || (editingId ? 'فشل تحديث السجل' : 'فشل إنشاء السجل'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      patientId: record.patientId || '',
      appointmentId: record.appointmentId || '',
      diagnosis: record.diagnosis || '',
      symptoms: record.symptoms || '',
      treatment: record.treatment || '',
      prescription: record.prescription || '',
      attachments: record.attachments || '',
      notes: record.notes || ''
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل الطبي؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await api.delete(`/api/medical-records/${id}`);
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حذف السجل');
    }
  };

  const handlePrint = (record) => {
    // Simple print functionality - in production, use a proper PDF library
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html dir="rtl">
      <head><title>سجل طبي - ${record.patient?.firstName} ${record.patient?.lastName}</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>سجل طبي</h2>
        <p><strong>المريض:</strong> ${record.patient?.firstName} ${record.patient?.lastName}</p>
        <p><strong>الطبيب:</strong> ${record.doctor?.user?.firstName} ${record.doctor?.user?.lastName}</p>
        <p><strong>التاريخ:</strong> ${new Date(record.createdAt).toLocaleDateString('ar-EG')}</p>
        <hr/>
        <p><strong>التشخيص:</strong> ${record.diagnosis}</p>
        <p><strong>الأعراض:</strong> ${record.symptoms || '-'}</p>
        <p><strong>العلاج:</strong> ${record.treatment || '-'}</p>
        <p><strong>الوصفة:</strong> ${record.prescription || '-'}</p>
        <p><strong>ملاحظات:</strong> ${record.notes || '-'}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredRecords = records.filter(r => 
    r.patient?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    r.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
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
          {user?.role === 'DOCTOR' && (
            <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg" type="button">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">سجل جديد</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded" type="button"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && user?.role === 'DOCTOR' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'تعديل السجل الطبي' : 'إنشاء سجل طبي جديد'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded" type="button"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.role === 'DOCTOR' && (
                <select 
                  value={formData.patientId} 
                  onChange={(e) => setFormData({...formData, patientId: e.target.value})} 
                  className="border border-gray-300 rounded-lg px-4 py-2" 
                  required
                >
                  <option value="">اختر المريض *</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              )}
              
              <input type="text" placeholder="التشخيص *" value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              
              <textarea placeholder="الأعراض" value={formData.symptoms} onChange={(e) => setFormData({...formData, symptoms: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="2" />
              
              <textarea placeholder="العلاج" value={formData.treatment} onChange={(e) => setFormData({...formData, treatment: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="2" />
              
              <textarea placeholder="الوصفة الطبية" value={formData.prescription} onChange={(e) => setFormData({...formData, prescription: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="3" />
              
              <input type="text" placeholder="المرفقات (روابط أو أسماء ملفات)" value={formData.attachments} onChange={(e) => setFormData({...formData, attachments: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" />
              
              <textarea placeholder="ملاحظات إضافية" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="2" />
              
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {submitting ? 'جاري...' : (editingId ? 'تحديث' : 'حفظ')}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث باسم المريض أو التشخيص..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
              <p className="text-gray-600">جاري تحميل السجلات...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'لا توجد نتائج' : 'لا توجد سجلات طبية'}</p>
              {user?.role === 'DOCTOR' && !search && (
                <button onClick={() => { setShowForm(true); setEditingId(null); }} className="mt-4 text-orange-600 hover:text-orange-700 font-medium" type="button">
                  + أضف أول سجل طبي
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-800">{record.patient?.firstName} {record.patient?.lastName}</span>
                        {record.appointment?.date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.appointment.date).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">التشخيص:</span> {record.diagnosis}
                      </p>
                      {record.symptoms && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">الأعراض:</span> {record.symptoms}
                        </p>
                      )}
                      {record.treatment && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">العلاج:</span> {record.treatment}
                        </p>
                      )}
                      {record.prescription && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">الوصفة:</span> {record.prescription}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        د. {record.doctor?.user?.firstName} {record.doctor?.user?.lastName} • {new Date(record.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user?.role === 'DOCTOR' && record.doctor?.userId === user?.userId && (
                        <>
                          <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded" type="button" title="تعديل"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" type="button" title="حذف"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                      <button onClick={() => handlePrint(record)} className="text-gray-600 hover:text-gray-700 p-2 hover:bg-gray-100 rounded" type="button" title="طباعة"><Printer className="w-4 h-4" /></button>
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
