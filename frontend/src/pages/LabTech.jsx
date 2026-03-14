// File: frontend/src/pages/LabTech.jsx - COMPLETE (Lab Tech Full Permissions)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, TestTube, Search, Loader2, AlertCircle, X, Clipboard, FileCheck, Printer, Send, Plus, Edit, Save, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

const LabTech = () => {
  const { logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingResults, setPendingResults] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultForm, setResultForm] = useState({});
  const [customTestForm, setCustomTestForm] = useState({
    name: '',
    unit: '',
    referenceRange: '',
    isFasting: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'pending') {
        const res = await api.get('/lab/results/pending');
        if (res.data?.success) {
          const data = 
            res.data.data?.results || 
            res.data['data']?.results || 
            [];
          setPendingResults(data);
        }
      }
      
      if (activeTab === 'catalog' && hasRole(['ADMIN', 'LAB_TECH'])) {
        const res = await api.get('/lab/tests?includeInactive=true');
        if (res.data?.success) {
          const data = 
            res.data.data?.labTests || 
            res.data['data']?.labTests || 
            [];
          setLabTests(data);
        }
      }
    } catch (err) {
      console.error('💥 [LabTech] Fetch error:', err);
      setError(err.message || 'فشل تحميل البيانات');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResultChange = (resultId, field, value) => {
    setResultForm(prev => ({
      ...prev,
      [resultId]: { ...prev[resultId], [field]: value }
    }));
  };

  const checkAbnormal = (value, referenceRange) => {
    if (!value || !referenceRange) return false;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    const match = referenceRange.match(/([\d.]+)\s*[-–—]\s*([\d.]+)/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      return numValue < min || numValue > max;
    }
    return false;
  };

  const saveResult = async (resultId) => {
    try {
      const updates = resultForm[resultId] || {};
      if (updates.value && updates.isAbnormal === undefined) {
        const result = pendingResults.find(r => r.id === resultId);
        if (result?.referenceRange) {
          updates.isAbnormal = checkAbnormal(updates.value, result.referenceRange);
        }
      }
      
      await api.patch(`/lab/results/${resultId}`, updates);
      fetchData();
      setSelectedResult(null);
    } catch (err) {
      console.error('❌ [LabTech] Save error:', err);
      setError(err.response?.data?.message || 'فشل حفظ النتيجة');
    }
  };

  const verifyAndSend = async (resultId) => {
    try {
      const updates = resultForm[resultId] || {};
      if (Object.keys(updates).length > 0) {
        await api.patch(`/lab/results/${resultId}`, { ...updates, status: 'VERIFIED' });
      } else {
        await api.patch(`/lab/results/${resultId}`, { status: 'VERIFIED' });
      }
      await api.post(`/lab/results/${resultId}/send`);
      fetchData();
    } catch (err) {
      console.error('❌ [LabTech] Verify error:', err);
      setError(err.response?.data?.message || 'فشل إرسال النتيجة');
    }
  };

  const printResult = async (resultId) => {
    try {
      await api.post(`/lab/results/${resultId}/print`);
      window.print();
    } catch (err) {
      console.error('❌ [LabTech] Print error:', err);
      setError('فشل الطباعة');
    }
  };

  const addCustomTest = async () => {
    if (!customTestForm.name) {
      setError('اسم الفحص مطلوب');
      return;
    }
    setSubmitting(true);
    try {
      const resultId = selectedResult?.id;
      if (resultId) {
        const existingNotes = resultForm[resultId]?.notes || '';
        const customEntry = `\n[Custom Test] ${customTestForm.name}: ${customTestForm.referenceRange || 'N/A'}`;
        handleResultChange(resultId, 'notes', existingNotes + customEntry);
      }
      setShowCustomForm(false);
      setCustomTestForm({ name: '', unit: '', referenceRange: '', isFasting: false });
    } catch (err) {
      setError('فشل إضافة الفحص المخصص');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PRELIMINARY: 'bg-blue-100 text-blue-700',
      FINAL: 'bg-green-100 text-green-700',
      VERIFIED: 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
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
              <h1 className="text-xl font-bold text-gray-800">لوحة فني المختبر</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setActiveTab('pending'); setSelectedResult(null); }}
              className={`px-4 py-2 rounded-lg ${activeTab === 'pending' ? 'bg-red-100 text-red-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              type="button"
            >
              ⏳ المعلقة ({pendingResults.length})
            </button>
            {hasRole(['ADMIN', 'LAB_TECH']) && (
              <button 
                onClick={() => { setActiveTab('catalog'); setSelectedResult(null); }}
                className={`px-4 py-2 rounded-lg ${activeTab === 'catalog' ? 'bg-red-100 text-red-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                type="button"
              >
                ⚙️ إدارة الكتالوج
              </button>
            )}
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

        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" /><p className="text-gray-600">جاري التحميل...</p></div>
        ) : activeTab === 'pending' ? (
          // ⏳ PENDING RESULTS WORKLIST
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="بحث باسم المريض أو الفحص..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <select className="border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">كل الأولويات</option>
                  <option value="STAT">🔴 طارئ</option>
                  <option value="URGENT">🟠 عاجل</option>
                  <option value="NORMAL">⚪ عادي</option>
                </select>
              </div>
            </div>

            {/* Results List */}
            {pendingResults.filter(r => 
              r.patient?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
              r.labTest?.name?.toLowerCase().includes(search.toLowerCase())
            ).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
                <p>✅ لا توجد نتائج معلقة</p>
                <p className="text-sm mt-2">كل الفحوصات مكتملة!</p>
              </div>
            ) : (
              pendingResults.filter(r => 
                r.patient?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
                r.labTest?.name?.toLowerCase().includes(search.toLowerCase())
              ).map((result) => (
                <div 
                  key={result.id} 
                  className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all ${
                    selectedResult?.id === result.id ? 'ring-2 ring-red-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedResult(result)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(result.request?.priority)}`}>
                          {result.request?.priority}
                        </span>
                        <span className="font-medium text-gray-800">{result.labTest?.name}</span>
                        <span className="text-xs text-gray-500 font-mono">({result.labTest?.code})</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        المريض: {result.patient?.firstName} {result.patient?.lastName}
                        {result.patient?.phone && <span className="text-gray-400 mx-1">•</span>}
                        <span className="text-gray-400">{result.patient?.phone}</span>
                      </p>
                      {result.request?.requestedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          طُلب منذ: {new Date(result.request.requestedAt).toLocaleString('ar-EG')}
                        </p>
                      )}
                    </div>
                    <div className="text-left">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Result Entry Panel */}
            {selectedResult && (
              <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">إدخال النتيجة</h2>
                      <p className="text-sm text-gray-500">
                        {selectedResult.labTest?.name} • {selectedResult.patient?.firstName} {selectedResult.patient?.lastName}
                      </p>
                    </div>
                    <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-gray-100 rounded" type="button">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {selectedResult.referenceRange && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">المدى المرجعي:</span> {selectedResult.referenceRange} {selectedResult.unit}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          سيتم تمييز النتيجة تلقائياً إذا كانت خارج هذا المدى
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">النتيجة *</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="أدخل القيمة" 
                          value={resultForm[selectedResult.id]?.value || selectedResult.value || ''}
                          onChange={(e) => handleResultChange(selectedResult.id, 'value', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-lg font-mono"
                        />
                        <input 
                          type="text" 
                          placeholder="الوحدة" 
                          value={resultForm[selectedResult.id]?.unit || selectedResult.unit || selectedResult.labTest?.unit || ''}
                          onChange={(e) => handleResultChange(selectedResult.id, 'unit', e.target.value)}
                          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox"
                        checked={resultForm[selectedResult.id]?.isAbnormal ?? selectedResult.isAbnormal ?? false}
                        onChange={(e) => handleResultChange(selectedResult.id, 'isAbnormal', e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className={`font-medium ${resultForm[selectedResult.id]?.isAbnormal ?? selectedResult.isAbnormal ? 'text-red-600' : 'text-gray-700'}`}>
                        خارج المدى الطبيعي
                      </span>
                      {(resultForm[selectedResult.id]?.isAbnormal ?? selectedResult.isAbnormal) && (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                      <textarea 
                        value={resultForm[selectedResult.id]?.notes || selectedResult.notes || ''}
                        onChange={(e) => handleResultChange(selectedResult.id, 'notes', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        rows="3"
                        placeholder="أي ملاحظات إضافية..."
                      />
                    </div>

                    <button 
                      onClick={() => setShowCustomForm(true)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة فحص مخصص (غير موجود في الكتالوج)
                    </button>

                    {showCustomForm && (
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <h4 className="font-medium text-gray-800 mb-3">بيانات الفحص المخصص</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="text" 
                            placeholder="اسم الفحص *" 
                            value={customTestForm.name}
                            onChange={(e) => setCustomTestForm({...customTestForm, name: e.target.value})}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                          <input 
                            type="text" 
                            placeholder="الوحدة" 
                            value={customTestForm.unit}
                            onChange={(e) => setCustomTestForm({...customTestForm, unit: e.target.value})}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                          <input 
                            type="text" 
                            placeholder="المدى المرجعي" 
                            value={customTestForm.referenceRange}
                            onChange={(e) => setCustomTestForm({...customTestForm, referenceRange: e.target.value})}
                            className="border border-gray-300 rounded px-3 py-2 text-sm col-span-2"
                          />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={addCustomTest}
                            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                            type="button"
                          >
                            إضافة
                          </button>
                          <button 
                            onClick={() => setShowCustomForm(false)}
                            className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded"
                            type="button"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t bg-gray-50 flex gap-3 sticky bottom-0">
                    <button 
                      onClick={() => saveResult(selectedResult.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                      type="button"
                    >
                      <Save className="w-5 h-5" />
                      حفظ مسودة
                    </button>
                    <button 
                      onClick={() => printResult(selectedResult.id)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                      type="button"
                      title="طباعة"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => verifyAndSend(selectedResult.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                      type="button"
                    >
                      <Send className="w-5 h-5" />
                      توثيق وإرسال للطبيب
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 📚 LAB TEST CATALOG MANAGEMENT
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="بحث في كتالوج الفحوصات..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              {hasRole(['ADMIN', 'LAB_TECH']) && (
                <button 
                  onClick={() => navigate('/lab-catalog')}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  type="button"
                >
                  <Settings className="w-4 h-4" />
                  إدارة متقدمة
                </button>
              )}
            </div>
            {labTests.filter(t => 
              t.name?.toLowerCase().includes(search.toLowerCase()) || 
              t.code?.toLowerCase().includes(search.toLowerCase())
            ).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد فحوصات في الكتالوج</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الفحص</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 hidden md:table-cell">الرمز</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">القسم</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المدى المرجعي</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {labTests.filter(t => 
                      t.name?.toLowerCase().includes(search.toLowerCase()) || 
                      t.code?.toLowerCase().includes(search.toLowerCase())
                    ).map((test) => (
                      <tr key={test.code} className={`hover:bg-gray-50 ${!test.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{test.name}</p>
                          <p className="text-xs text-gray-500">{test.description || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell font-mono">{test.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{test.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{test.referenceRange || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {test.isActive ? 'مفعل' : 'معطل'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {hasRole(['ADMIN', 'LAB_TECH']) && (
                              <>
                                <button onClick={() => navigate(`/lab-catalog?edit=${test.id}`)} className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded" type="button" title="تعديل"><Edit className="w-4 h-4" /></button>
                                {hasRole('ADMIN') && <button onClick={() => {}} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded" type="button" title="حذف"><Trash2 className="w-4 h-4" /></button>}
                              </>
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
        )}
      </main>
    </div>
  );
};

export default LabTech;
