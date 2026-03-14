// File: frontend/src/pages/LabDoctor.jsx - COMPLETE & FIXED (Handles Empty Catalog)
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, TestTube, Search, Loader2, AlertCircle, X, User, Calendar, Clipboard, CheckCircle, RefreshCw } from 'lucide-react';

const LabDoctor = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('request');
  const [labTests, setLabTests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [requestForm, setRequestForm] = useState({
    patientId: '',
    priority: 'NORMAL',
    clinicalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // ✅ Support patientId from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    if (patientId) {
      setRequestForm(prev => ({ ...prev, patientId }));
      setActiveTab('request');
    }
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'request') {
        // ✅ Fetch active tests only + support ['data'] fallback
        const testsRes = await api.get('/lab/tests?isActive=true');
        if (testsRes.data?.success) {
          const testsData = 
            testsRes.data.data?.labTests || 
            testsRes.data['data']?.labTests || 
            [];
          // ✅ Filter to only active tests (double-check)
          setLabTests(testsData.filter(t => t.isActive !== false));
          console.log('📊 [LabDoctor] Loaded', testsData.filter(t => t.isActive !== false).length, 'active tests');
        }
        
        const patientsRes = await api.get('/patients');
        if (patientsRes.data?.success) {
          const patientsData = 
            patientsRes.data.data?.patients || 
            patientsRes.data['data']?.patients || 
            [];
          setPatients(patientsData);
        }
      }
      
      if (activeTab === 'history') {
        const res = await api.get('/lab/requests');
        if (res.data?.success) {
          const requestsData = 
            res.data.data?.requests || 
            res.data['data']?.requests || 
            [];
          setRequests(requestsData);
        }
      }
    } catch (err) {
      console.error('💥 [LabDoctor] Fetch error:', err);
      setError(err.message || 'فشل تحميل البيانات');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestToggle = (testCode) => {
    setSelectedTests(prev => 
      prev.includes(testCode) 
        ? prev.filter(c => c !== testCode)
        : [...prev, testCode]
    );
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.patientId) {
      setError('يرجى اختيار مريض');
      return;
    }
    if (selectedTests.length === 0) {
      setError('يرجى اختيار فحص واحد على الأقل');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await api.post('/lab/requests', {
        patientId: requestForm.patientId,
        testCodes: selectedTests,
        priority: requestForm.priority,
        clinicalNotes: requestForm.clinicalNotes
      });
      
      if (response.data?.success) {
        setSelectedTests([]);
        setRequestForm({ patientId: '', priority: 'NORMAL', clinicalNotes: '' });
        setActiveTab('history');
        fetchData();
      }
    } catch (err) {
      console.error('❌ [LabDoctor] Request error:', err);
      setError(err.response?.data?.message || 'فشل طلب الفحوصات');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'قيد الانتظار',
      IN_PROGRESS: 'قيد التنفيذ',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي'
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
              <h1 className="text-xl font-bold text-gray-800">طلب فحوصات مختبر</h1>
            </div>
          </div>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button 
            onClick={() => setActiveTab('request')} 
            className={`px-4 py-2 ${activeTab === 'request' ? 'border-b-2 border-red-600 text-red-600 font-medium' : 'text-gray-600'}`}
            type="button"
          >
            🧪 طلب جديد
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-red-600 text-red-600 font-medium' : 'text-gray-600'}`}
            type="button"
          >
            📋 سجل الطلبات
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
        ) : activeTab === 'request' ? (
          // 🧪 REQUEST FORM
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient & Priority */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-4">بيانات الطلب</h3>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">المريض *</label>
                <select 
                  value={requestForm.patientId} 
                  onChange={(e) => setRequestForm({...requestForm, patientId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
                  required
                >
                  <option value="">اختر مريضاً</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                <select 
                  value={requestForm.priority} 
                  onChange={(e) => setRequestForm({...requestForm, priority: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
                >
                  <option value="NORMAL">عادي ⚪</option>
                  <option value="URGENT">عاجل 🟠</option>
                  <option value="STAT">طارئ جداً 🔴</option>
                </select>

                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات سريرية</label>
                <textarea 
                  value={requestForm.clinicalNotes}
                  onChange={(e) => setRequestForm({...requestForm, clinicalNotes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="4"
                  placeholder="أي معلومات سريرية تساعد المختبر..."
                />
              </div>
            </div>

            {/* Test Selection - ✅ FIXED: Shows active tests or helpful message */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">اختر الفحوصات</h3>
                  <span className="text-sm text-gray-500">{selectedTests.length} مختار</span>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="بحث باسم الفحص أو الرمز..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {labTests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">لا توجد فحوصات متاحة حالياً</p>
                    <p className="text-sm mt-2 mb-4">يرجى التواصل مع إدارة المختبر لإضافة الفحوصات المطلوبة</p>
                    <button 
                      onClick={() => {
                        // Refresh tests in case they were just added
                        fetchData();
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mx-auto"
                      type="button"
                    >
                      <RefreshCw className="w-4 h-4" />
                      تحديث القائمة
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                    {labTests
                      .filter(t => 
                        t.name?.toLowerCase().includes(search.toLowerCase()) || 
                        t.code?.toLowerCase().includes(search.toLowerCase())
                      )
                      .map(test => (
                        <label 
                          key={test.code} 
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTests.includes(test.code) 
                              ? 'bg-red-50 border-red-300' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedTests.includes(test.code)}
                            onChange={() => handleTestToggle(test.code)}
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-gray-800">{test.name}</p>
                              <span className="text-xs font-bold text-gray-700">{test.price.toFixed(2)} ر.س</span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">{test.code}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              {test.isFasting && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">صيام</span>}
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{test.turnaroundTime}س</span>
                              <span className="text-gray-400">{test.unit}</span>
                            </div>
                            {test.referenceRange && (
                              <p className="text-xs text-gray-400 mt-1">المدى: {test.referenceRange}</p>
                            )}
                          </div>
                        </label>
                      ))}
                  </div>
                )}

                {/* Submit Button */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    الإجمالي: <span className="font-bold text-red-600">
                      {labTests.filter(t => selectedTests.includes(t.code)).reduce((sum, t) => sum + t.price, 0).toFixed(2)} ر.س
                    </span>
                  </div>
                  <button 
                    onClick={handleRequestSubmit}
                    disabled={submitting || selectedTests.length === 0 || !requestForm.patientId}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-2 rounded-lg"
                    type="button"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clipboard className="w-5 h-5" />}
                    {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 📋 REQUEST HISTORY
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {requests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clipboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد طلبات سابقة</p>
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
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">التاريخ</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">النتائج</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((req, index) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-sm">{req.patient?.firstName} {req.patient?.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{req.tests?.length || 0} فحص</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(req.priority)}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                            {getStatusLabel(req.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('ar-EG') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {req.status === 'COMPLETED' ? (
                            <button 
                              onClick={() => navigate(`/lab-results?request=${req.id}`)}
                              className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded"
                              type="button"
                              title="عرض النتائج"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">قيد المعالجة</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LabDoctor;
