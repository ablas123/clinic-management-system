// File: frontend/src/pages/LabResults.jsx - REAL WORKING PAGE
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, TestTube, Loader2, AlertCircle, X, FileCheck, Printer } from 'lucide-react';

const LabResults = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');

  useEffect(() => {
    fetchLabResults();
  }, []);

  const fetchLabResults = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = '/lab/results/patient/';
      if (user?.role === 'DOCTOR' && selectedPatient) {
        url += selectedPatient;
      } else if (user?.role === 'LAB_TECH') {
        url = '/lab/results'; // فني المختبر يرى كل النتائج
      }
      
      const res = await api.get(url);
      if (res.data?.success) {
        setResults(res.data['data']?.results || []);
      }
    } catch (err) {
      // إذا كان المسار غير موجود، نجرب المسار البديل
      if (err.response?.status === 404) {
        try {
          const res = await api.get('/lab/results');
          if (res.data?.success) {
            setResults(res.data['data']?.results || []);
          }
        } catch (e) {
          setError(e.message || 'فشل تحميل النتائج');
        }
      } else {
        setError(err.message || 'فشل تحميل النتائج');
      }
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
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

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'قيد الانتظار',
      PRELIMINARY: 'أولي',
      FINAL: 'نهائي',
      VERIFIED: 'موثّق'
    };
    return labels[status] || status;
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
              <FileCheck className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-800">نتائج المختبر</h1>
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

        {user?.role === 'DOCTOR' && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <select 
              value={selectedPatient}
              onChange={(e) => { setSelectedPatient(e.target.value); fetchLabResults(); }}
              className="w-full md:w-auto border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">كل المرضى</option>
              {/* يمكن ملء القائمة ديناميكياً من مرضى الطبيب */}
            </select>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500 mb-2" />
              <p className="text-gray-600">جاري تحميل النتائج...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد نتائج لعرضها</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.map((result) => (
                <div key={result.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {getStatusLabel(result.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {result.labTest?.name}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800">
                        {result.patient?.firstName} {result.patient?.lastName}
                      </p>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">النتيجة:</span> {result.value} {result.unit}
                        </p>
                        {result.referenceRange && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">المدى الطبيعي:</span> {result.referenceRange}
                          </p>
                        )}
                        {result.isAbnormal && (
                          <p className="text-sm text-red-600 font-medium mt-1">
                            ⚠️ نتيجة خارج المدى الطبيعي
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => window.print()}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      type="button"
                      title="طباعة النتيجة"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
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

export default LabResults;
