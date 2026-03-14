// File: frontend/src/pages/LabCatalog.jsx - COMPLETE (Admin/Lab Tech Catalog Management)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, TestTube, Search, Plus, Edit, Trash2, Loader2, AlertCircle, X, Save, ToggleLeft, ToggleRight } from 'lucide-react';

const LabCatalog = () => {
  const { logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'BLOOD',
    price: '',
    unit: '',
    referenceRange: '',
    isFasting: false,
    turnaroundTime: '24',
    description: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'BLOOD', label: 'دم' },
    { value: 'URINE', label: 'بول' },
    { value: 'XRAY', label: 'أشعة سينية' },
    { value: 'ULTRASOUND', label: 'أشعة فوق صوتية' },
    { value: 'MRI', label: 'رنين مغناطيسي' },
    { value: 'CT_SCAN', label: 'أشعة مقطعية' },
    { value: 'PATHOLOGY', label: 'أنسجة' },
    { value: 'MICROBIOLOGY', label: 'أحياء دقيقة' },
    { value: 'OTHER', label: 'أخرى' }
  ];

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ جلب كل الفحوصات (بما فيها غير النشطة) للأدمن/فني
      const res = await api.get('/lab/tests?includeInactive=true');
      if (res.data?.success) {
        const data = 
          res.data.data?.labTests || 
          res.data['data']?.labTests || 
          [];
        setLabTests(data);
      }
    } catch (err) {
      console.error('💥 [LabCatalog] Fetch error:', err);
      setError(err.message || 'فشل تحميل الفحوصات');
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
      const url = editingId ? `/lab/tests/${editingId}` : '/lab/tests';
      const method = editingId ? 'put' : 'post';
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        turnaroundTime: parseInt(formData.turnaroundTime),
        isFasting: formData.isFasting === true || formData.isFasting === 'true'
      };

      const response = await api[method](url, payload);
      
      if (response.data?.success) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '', code: '', category: 'BLOOD', price: '', unit: '',
          referenceRange: '', isFasting: false, turnaroundTime: '24',
          description: '', isActive: true
        });
        fetchLabTests();
      }
    } catch (err) {
      console.error('❌ [LabCatalog] Submit error:', err);
      setError(err.response?.data?.message || (editingId ? 'فشل التحديث' : 'فشل الإضافة'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (test) => {
    setFormData({
      name: test.name || '',
      code: test.code || '',
      category: test.category || 'BLOOD',
      price: test.price?.toString() || '',
      unit: test.unit || '',
      referenceRange: test.referenceRange || '',
      isFasting: test.isFasting || false,
      turnaroundTime: test.turnaroundTime?.toString() || '24',
      description: test.description || '',
      isActive: test.isActive !== false
    });
    setEditingId(test.id);
    setShowForm(true);
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`/lab/tests/${id}/active`, { isActive: !currentStatus });
      setLabTests(labTests.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفحص؟')) return;
    try {
      // Soft delete via isActive = false
      await api.patch(`/lab/tests/${id}/active`, { isActive: false });
      setLabTests(labTests.filter(t => t.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const filteredTests = labTests.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg" type="button">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <TestTube className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-800">كتالوج فحوصات المختبر</h1>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg" type="button">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة فحص</span>
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
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'تعديل فحص' : 'إضافة فحص جديد'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded" type="button"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="اسم الفحص *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="رمز الفحص *" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2">
                {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
              <input type="number" placeholder="السعر *" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" step="0.01" min="0" required />
              <input type="text" placeholder="الوحدة" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <input type="text" placeholder="المدى المرجعي" value={formData.referenceRange} onChange={(e) => setFormData({...formData, referenceRange: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <label className="flex items-center gap-2 p-3 border rounded-lg">
                <input type="checkbox" checked={formData.isFasting} onChange={(e) => setFormData({...formData, isFasting: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm">يتطلب صيام</span>
              </label>
              <input type="number" placeholder="وقت الإنجاز (ساعات)" value={formData.turnaroundTime} onChange={(e) => setFormData({...formData, turnaroundTime: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" min="1" />
              <textarea placeholder="وصف الفحص" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="2" />
              {hasRole('ADMIN') && (
                <label className="flex items-center gap-2 p-3 border rounded-lg md:col-span-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm">فحص مفعل (ظاهر للأطباء)</span>
                </label>
              )}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
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
            <input type="text" placeholder="بحث باسم الفحص أو الرمز..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
          ) : filteredTests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'لا توجد نتائج' : 'لا توجد فحوصات في الكتالوج'}</p>
              {hasRole(['ADMIN', 'LAB_TECH']) && !search && (
                <button onClick={() => setShowForm(true)} className="mt-4 text-red-600 hover:text-red-700 font-medium" type="button">+ أضف أول فحص</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الفحص</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الرمز</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">القسم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">السعر</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTests.map((test, index) => (
                    <tr key={test.id} className={`hover:bg-gray-50 ${!test.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{test.name}</p>
                        <p className="text-xs text-gray-500">{test.description || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell font-mono">{test.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{categories.find(c => c.value === test.category)?.label || test.category}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">{test.price?.toFixed(2) || '0.00'} ر.س</td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => toggleActive(test.id, test.isActive)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                          type="button"
                        >
                          {test.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {test.isActive ? 'مفعل' : 'معطل'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(test)} className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded" type="button" title="تعديل"><Edit className="w-4 h-4" /></button>
                          {hasRole('ADMIN') && (
                            <button onClick={() => handleDelete(test.id)} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" type="button" title="حذف"><Trash2 className="w-4 h-4" /></button>
                          )}
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

export default LabCatalog;
