// File: frontend/src/pages/Lab.jsx - PRODUCTION READY (HL7-inspired UI)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TestTube, Plus, Search, ArrowLeft, Loader2, AlertCircle, X, Clipboard, FileCheck, Printer, Clock, AlertTriangle } from 'lucide-react';

const Lab = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'requests' | 'results'
  const [labTests, setLabTests] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [requestForm, setRequestForm] = useState({
    patientId: '',
    priority: 'NORMAL',
    notes: ''
  });
  const [resultForm, setResultForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'tests') {
        const res = await api.get('/lab/tests');
        if (res.data?.success) {
          const data = res.data.data?.labTests || res.data['data']?.labTests || [];
          setLabTests(data);
        }
      }
      
      if (activeTab === 'requests' && hasRole(['DOCTOR', 'LAB_TECH'])) {
        const res = await api.get('/lab/requests');
        if (res.data?.success) {
          const data = res.data.data?.requests || res.data['data']?.requests || [];
          setLabRequests(data);
        }
      }
      
      if (activeTab === 'results') {
        let url = '/lab/results';
        if (user?.role === 'DOCTOR') {
          // Doctor sees results for their patients via appointments
          url = '/lab/results'; // Backend handles filtering
        }
        const res = await api.get(url);
        if (res.data?.success) {
          const data = res.data.data?.results || res.data['data']?.results || [];
          setLabResults(data);
        }
      }
      
      // Load patients for doctor request form
      if (hasRole('DOCTOR') && activeTab === 'requests') {
        const res = await api.get('/patients');
        if (res.data?.success) {
          const data = res.data.data?.patients || res.data['data']?.patients || [];
          setPatients(data);
        }
      }
      
    } catch (err) {
      console.error('Fetch lab data error:', err);
      setError(err.message || 'فشل تحميل البيانات');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestToggle = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (selectedTests.length === 0) {
      setError('يرجى اختيار فحص واحد على الأقل');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await api.post('/lab/requests', {
        patientId: requestForm.patientId,
        testIds: selectedTests,
        priority: requestForm.priority,
        notes: requestForm.notes
      });
      
      if (response.data?.success) {
        setShowForm(false);
        setSelectedTests([]);
        setRequestForm({ patientId: '', priority: 'NORMAL', notes: '' });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل طلب الفحوصات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResultUpdate = async (resultId, field, value) => {
    setResultForm(prev => ({ ...prev, [resultId]: { ...prev[resultId], [field]: value } }));
  };

  const saveResult = async (resultId) => {
    try {
      const updates = resultForm[resultId] || {};
      await api.patch(`/lab/results/${resultId}`, updates);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حفظ النتيجة');
    }
  };

  const verifyResult = async (resultId) => {
    try {
      await api.patch(`/lab/results/${resultId}`, { status: 'VERIFIED' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل توثيق النتيجة');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PRELIMINARY: 'bg-blue-100 text-blue-700',
      FINAL: 'bg-green-100 text-green-700',
      VERIFIED: 'bg-purple-100 text-purple-700',
      COMPLETED: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'قيد الانتظار',
      PRELIMINARY: 'أولي',
      FINAL: 'نهائي',
      VERIFIED: 'موثّق',
      COMPLETED: 'مكتمل'
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      NORMAL: 'bg-gray-100 text-gray-700',
      URGENT: 'bg-orange-100 text-orange-700',
      STAT: 'bg-red-100 text-red-700'
    };
    return styles[priority] || styles.NORMAL;
  };

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
              <TestTube className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-800">إدارة المختبر</h1>
            </div>
          </div>
          {hasRole('DOCTOR') && activeTab === 'requests' && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg" type="button">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">طلب فحص</span>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          <button 
            onClick={() => setActiveTab('tests')} 
            className={`px-4 py-2 whitespace-nowrap ${activeTab === 'tests' ? 'border-b-2 border-red-600 text-red-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
            type="button"
          >
            🧪 الفحوصات المتاحة
          </button>
          {hasRole(['DOCTOR', 'LAB_TECH']) && (
            <button 
              onClick={() => setActiveTab('requests')} 
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'requests' ? 'border-b-2 border-red-600 text-red-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
              type="button"
            >
              📋 طلبات الفحوصات
            </button>
          )}
          {hasRole(['DOCTOR', 'LAB_TECH', 'ADMIN']) && (
            <button 
              onClick={() => setActiveTab('results')} 
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'results' ? 'border-b-2 border-red-600 text-red-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
              type="button"
            >
              📊 النتائج
            </button>
          )}
        </div>

        {/* Request Form Modal */}
        {showForm && hasRole('DOCTOR') && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">طلب فحوصات جديدة</h2>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded" type="button"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختر المريض *</label>
                  <select 
                    value={requestForm.patientId} 
                    onChange={(e) => setRequestForm({...requestForm, patientId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">اختر مريضاً</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">أولوية الطلب</label>
                  <select 
                    value={requestForm.priority} 
                    onChange={(e) => setRequestForm({...requestForm, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="NORMAL">عادي</option>
                    <option value="URGENT">عاجل 🔶</option>
                    <option value="STAT">طارئ جداً 🔴</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختر الفحوصات *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {labTests.filter(t => t.isActive).map(test => (
                      <label key={test.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input 
                          type="checkbox" 
                          checked={selectedTests.includes(test.id)}
                          onChange={() => handleTestToggle(test.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-sm">{test.name}</p>
                          <p className="text-xs text-gray-500">{test.code} • {test.price.toFixed(2)} ر.س</p>
                          {test.isFasting && <span className="text-xs text-yellow-600">⚠️ يتطلب صيام</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية</label>
                  <textarea 
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows="2"
                    placeholder="أي تعليمات خاصة للمختبر..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={submitting || selectedTests.length === 0 || !requestForm.patientId}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clipboard className="w-5 h-5" />}
                    {submitting ? 'جاري...' : 'إرسال الطلب'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
        ) : activeTab === 'tests' ? (
          // 🧪 LAB TESTS LIST
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="بحث باسم الفحص أو الرمز..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            {labTests.filter(t => t.isActive).filter(t => 
              t.name?.toLowerCase().includes(search.toLowerCase()) || 
              t.code?.toLowerCase().includes(search.toLowerCase())
            ).length === 0 ? (
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
                    {labTests.filter(t => t.isActive).filter(t => 
                      t.name?.toLowerCase().includes(search.toLowerCase()) || 
                      t.code?.toLowerCase().includes(search.toLowerCase())
                    ).map((test, index) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{test.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell font-mono">{test.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{test.category}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800">{test.price.toFixed(2)} ر.س</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            {test.isFasting && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">صيام</span>}
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {test.turnaroundTime}س
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'requests' ? (
          // 📋 LAB REQUESTS LIST
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {labRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clipboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد طلبات فحوصات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المريض</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الفحوصات</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الأولوية</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden sm:table-cell">الحالة</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {labRequests.map((req, index) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{req.patient?.firstName} {req.patient?.lastName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{req.tests?.length || 0} فحص</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(req.priority)}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                            {getStatusLabel(req.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('ar-EG') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // 📊 LAB RESULTS LIST
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {labResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد نتائج لعرضها</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {labResults.map((result) => (
                  <div key={result.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                            {getStatusLabel(result.status)}
                          </span>
                          <span className="text-sm font-medium text-gray-800">{result.labTest?.name}</span>
                          <span className="text-xs text-gray-500">({result.labTest?.code})</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          المريض: {result.patient?.firstName} {result.patient?.lastName}
                        </p>
                        
                        {/* Result Input for Lab Tech */}
                        {hasRole('LAB_TECH') && result.status !== 'VERIFIED' && (
                          <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input 
                                type="text" 
                                placeholder="أدخل النتيجة" 
                                value={resultForm[result.id]?.value || result.value || ''}
                                onChange={(e) => handleResultUpdate(result.id, 'value', e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-sm"
                              />
                              <input 
                                type="text" 
                                placeholder="الوحدة" 
                                value={resultForm[result.id]?.unit || result.unit || result.labTest?.unit || ''}
                                onChange={(e) => handleResultUpdate(result.id, 'unit', e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-sm"
                              />
                              {result.labTest?.referenceRange && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  المدى: {result.labTest.referenceRange}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                <input 
                                  type="checkbox"
                                  checked={resultForm[result.id]?.isAbnormal ?? result.isAbnormal ?? false}
                                  onChange={(e) => handleResultUpdate(result.id, 'isAbnormal', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className={resultForm[result.id]?.isAbnormal ?? result.isAbnormal ? 'text-red-600 font-medium' : ''}>
                                  خارج المدى الطبيعي
                                </span>
                              </label>
                              {(resultForm[result.id]?.isAbnormal ?? result.isAbnormal) && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => saveResult(result.id)}
                                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                                type="button"
                              >
                                حفظ
                              </button>
                              {result.status !== 'VERIFIED' && (
                                <button 
                                  onClick={() => verifyResult(result.id)}
                                  className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                                  type="button"
                                >
                                  توثيق ✓
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Display for Doctor */}
                        {hasRole('DOCTOR') && (
                          <div className="bg-gray-50 rounded-lg p-3 mt-2">
                            <p className="text-sm">
                              <span className="font-medium">النتيجة:</span> {result.value || '---'} {result.unit}
                            </p>
                            {result.referenceRange && (
                              <p className="text-xs text-gray-500">المدى الطبيعي: {result.referenceRange}</p>
                            )}
                            {result.isAbnormal && (
                              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> نتيجة خارج المدى الطبيعي
                              </p>
                            )}
                            {result.verifiedAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                وُثّق بواسطة: {result.technician?.user?.firstName} {result.technician?.user?.lastName} • {new Date(result.verifiedAt).toLocaleDateString('ar-EG')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {hasRole('LAB_TECH') && (
                        <button className="p-2 text-gray-400 hover:text-gray-600" type="button" title="طباعة">
                          <Printer className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Lab;