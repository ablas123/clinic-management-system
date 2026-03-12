import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TestTube, Plus, Search, ArrowLeft, Loader2, AlertCircle, X, FileText } from 'lucide-react';

const Lab = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Blood',
    price: '',
    unit: '',
    referenceRange: '',
    isFasting: false,
    turnaroundTime: 24
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/lab/tests');
      if (response.data?.success) {
        setLabTests(response.data.data?.labTests || []);
      } else {
        setError(response.data?.message || 'فشل جلب البيانات');
      }
    } catch (err) {
      console.error('❌ Error fetching lab tests:', err);
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
      const response = await api.post('/lab/tests', {
        ...formData,
        price: parseFloat(formData.price),
        turnaroundTime: parseInt(formData.turnaroundTime)
      });
      if (response.data?.success) {
        setLabTests([response.data.data?.labTest, ...labTests]);
        setShowForm(false);
        setFormData({ name: '', code: '', category: 'Blood', price: '', unit: '', referenceRange: '', isFasting: false, turnaroundTime: 24 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إضافة الفحص');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTests = labTests.filter(test =>
    test.name?.toLowerCase().includes(search.toLowerCase()) ||
    test.code?.toLowerCase().includes(search.toLowerCase()) ||
    test.category?.toLowerCase().includes(search.toLowerCase())
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
              <TestTube className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-800">إدارة المختبر</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
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
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded"><X className="w-4 h-4" /></button>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">إضافة فحص جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="اسم الفحص" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <input type="text" placeholder="الرمز (Code)" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required />
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2">
                <option value="Blood">دم</option>
                <option value="Urine">بول</option>
                <option value="X-Ray">أشعة</option>
                <option value="Other">أخرى</option>
              </select>
              <input type="number" placeholder="السعر" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required step="0.01" min="0" />
              <input type="text" placeholder="الوحدة (مثال: mg/dL)" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <input type="text" placeholder="المدى الطبيعي" value={formData.referenceRange} onChange={(e) => setFormData({...formData, referenceRange: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" />
              <select value={formData.isFasting} onChange={(e) => setFormData({...formData, isFasting: e.target.value === 'true'})} className="border border-gray-300 rounded-lg px-4 py-2">
                <option value="false">لا يحتاج صيام</option>
                <option value="true">يتطلب صيام</option>
              </select>
              <input type="number" placeholder="وقت الانتظار (ساعات)" value={formData.turnaroundTime} onChange={(e) => setFormData({...formData, turnaroundTime: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" required min="1" />
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
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
            <input type="text" placeholder="بحث باسم الفحص أو الرمز..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
          ) : filteredTests.length === 0 ? (
            <div className="p-8 text-center text-gray-500"><TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{search ? 'لا توجد نتائج' : 'لا توجد فحوصات'}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">اسم الفحص</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الرمز</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden sm:table-cell">القسم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">السعر</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTests.map((test, index) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{test.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell font-mono">{test.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{test.category}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">{test.price?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          {test.isFasting && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">صيام</span>}
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{test.turnaroundTime} ساعة</span>
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

export default Lab;