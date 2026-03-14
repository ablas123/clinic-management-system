// File: frontend/src/pages/Lab.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TestTube, Plus, Search, ArrowLeft, Loader2, AlertCircle, X, Clipboard, FileCheck, Printer } from 'lucide-react';

const Lab = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [labTests, setLabTests] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('tests');
  const [formData, setFormData] = useState({
    patientId: '',
    testIds: [],
    priority: 'NORMAL',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [testsRes, requestsRes, patientsRes] = await Promise.all([
        api.get('/lab/tests'),
        hasRole('DOCTOR') || hasRole('LAB_TECH') ? api.get('/lab/requests') : Promise.resolve({ data: { success: true, ['data']: { requests: [] } } }),
        hasRole('DOCTOR') ? api.get('/patients') : Promise.resolve({ data: { success: true, ['data']: { patients: [] } } })
      ]);
      
      if (testsRes.data?.success) setLabTests(testsRes.data['data']?.labTests || []);
      if (requestsRes.data?.success) setLabRequests(requestsRes.data['data']?.requests || []);
      if (patientsRes.data?.success) setPatients(patientsRes.data['data']?.patients || []);
    } catch (err) {
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
      const response = await api.post('/lab/requests', {
        patientId: formData.patientId,
        testIds: formData.testIds,
        priority: formData.priority,
        notes: formData.notes
      });

      if (response.data?.success) {
        setLabRequests([response.data['data']?.labRequest, ...labRequests]);
        setShowForm(false);
        setFormData({ patientId: '', testIds: [], priority: 'NORMAL', notes: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل طلب الفحص');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResultUpdate = async (resultId, value, isAbnormal, status) => {
    try {
      const response = await api.patch(`/lab/results/${resultId}`, {
        value,
        isAbnormal,
        status
      });
      if (response.data?.success) {
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث النتيجة');
    }
  };

  const filteredTests = labTests.filter(test =>
    test.name?.toLowerCase().includes(search.toLowerCase()) ||
    test.code?.toLowerCase().includes(search.toLowerCase())
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
          {hasRole('DOCTOR') && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">طلب فحص</span>
            </button>
          )}
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button onClick={() => setActiveTab('tests')} className={`px-4 py-2 ${activeTab === 'tests' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}>الفحوصات المتاحة</button>
          {hasRole(['DOCTOR', 'LAB_TECH']) && (
            <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}>الطلبات</button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">طلب فحص جديد</h2>
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
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>

              <select 
                value={formData.priority} 
                onChange={(e) => setFormData({...formData, priority: e.target.value})} 
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="NORMAL">عادي</option>
                <option value="URGENT">عاجل</option>
                <option value="STAT">طارئ جداً</option>
              </select>

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">اختر الفحوصات:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {labTests.map(test => (
                    <label key={test.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" value={test.id} onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, testIds: [...formData.testIds, test.id]});
                        } else {
                          setFormData({...formData, testIds: formData.testIds.filter(id => id !== test.id)});
                        }
                      }} className="w-4 h-4" />
                      <span className="text-sm">{test.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <textarea placeholder="ملاحظات إضافية" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2" rows="2" />
              
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={submitting || formData.testIds.length === 0} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clipboard className="w-5 h-5" />}
                  {submitting ? 'جاري...' : 'طلب الفحص'}
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
          ) : activeTab === 'tests' ? (
            filteredTests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد فحوصات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">اسم الفحص</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الرمز</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">القسم</th>
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
                        <td className="px-4 py-3 text-sm text-gray-600">{test.category}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800">{test.price?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            {test.isFasting && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">صيام</span>}
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{test.turnaroundTime} ساعة</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            labRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clipboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد طلبات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المريض</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الأولوية</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الحالة</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {labRequests.map((req, index) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{req.patient?.firstName} {req.patient?.lastName}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${req.priority === 'STAT' ? 'bg-red-100 text-red-700' : req.priority === 'URGENT' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded" title="عرض"><FileCheck className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default Lab;