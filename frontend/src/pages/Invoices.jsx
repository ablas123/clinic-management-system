import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FileText, Plus, Trash2, Search, ArrowLeft, Loader2, AlertCircle, X, DollarSign, CheckCircle, XCircle } from 'lucide-react';

const Invoices = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    amount: '',
    description: '',
    status: 'PENDING'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [invRes, patRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/patients')
      ]);
      
      if (invRes.data?.success) setInvoices(invRes.data.data?.invoices || []);
      if (patRes.data?.success) setPatients(patRes.data.data?.patients || []);
    } catch (err) {
      console.error('Error fetching ', err);
      setError(err.response?.data?.message || 'خطأ في الاتصال');
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
      const response = await api.post('/invoices', {
        patientId: formData.patientId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        status: formData.status
      });

      if (response.data?.success) {
        // ✅ الفاتورة الجديدة تحتوي على بيانات المريض كاملة
        setInvoices([response.data.data?.invoice, ...invoices]);
        setShowForm(false);
        setFormData({ patientId: '', amount: '', description: '', status: 'PENDING' });
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.message || 'فشل إنشاء الفاتورة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    try {
      const response = await api.delete(`/invoices/${id}`);
      if (response.data?.success) {
        setInvoices(invoices.filter(i => i.id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حذف الفاتورة');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await api.patch(`/invoices/${id}/status`, { status });
      if (response.data?.success) {
        setInvoices(invoices.map(i => i.id === id ? { ...i, status } : i));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'معلقة';
      case 'PAID': return 'مدفوعة';
      case 'CANCELLED': return 'ملغاة';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const patientName = (inv.patient?.firstName || '') + ' ' + (inv.patient?.lastName || '');
    return patientName.toLowerCase().includes(search.toLowerCase()) ||
           (inv.description || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-800">إدارة الفواتير</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إنشاء فاتورة</span>
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
              <h2 className="text-lg font-bold text-gray-800">إنشاء فاتورة جديدة</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <select 
                value={formData.patientId} 
                onChange={(e) => setFormData({...formData, patientId: e.target.value})} 
                className="border border-gray-300 rounded-lg px-4 py-2" 
                required
              >
                <option value="">اختر المريض</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>

              <input type="number" placeholder="المبلغ" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required step="0.01" min="0" />
              
              <input type="text" placeholder="وصف الخدمة" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" required />
              
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {submitting ? 'جاري...' : 'إنشاء'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="بحث باسم المريض أو الوصف..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'لا توجد نتائج' : 'لا توجد فواتير'}</p>
              {!search && !showForm && (
                <button onClick={() => setShowForm(true)} className="mt-4 text-orange-600 hover:text-orange-700 font-medium">
                  + أنشئ أول فاتورة
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المريض</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الوصف</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المبلغ</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((inv, index) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {inv.patient?.firstName && inv.patient?.lastName 
                          ? inv.patient.firstName + ' ' + inv.patient.lastName 
                          : inv.patientId || 'غير معروف'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {inv.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {inv.amount?.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={'inline-block px-3 py-1 rounded-full text-xs font-medium ' + getStatusColor(inv.status)}>
                          {getStatusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {inv.status === 'PENDING' && (
                            <button onClick={() => updateStatus(inv.id, 'PAID')} className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded" title="تحديد كمدفوعة"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <button onClick={() => updateStatus(inv.id, 'CANCELLED')} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" title="إلغاء"><XCircle className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-4 h-4" /></button>
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

export default Invoices;
