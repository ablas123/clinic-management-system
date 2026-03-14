// File: frontend/src/pages/MyPatients.jsx - COMPLETE & FINAL
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Search, Loader2, AlertCircle, X, User, Phone, Mail, Calendar, TestTube } from 'lucide-react';

const MyPatients = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyPatients();
  }, []);

  const fetchMyPatients = async () => {
    try {
      setLoading(true);
      setError('');
      
      // جلب المواعيد أولاً لاستخراج مرضى الطبيب الحالي
      const aptRes = await api.get('/appointments');
      if (aptRes.data?.success) {
        const appointments = aptRes.data.data?.appointments || aptRes.data['data']?.appointments || [];
        // استخراج المرضى الفريدين من مواعيد الطبيب
        const myPatients = appointments
          .filter(apt => apt.patient)
          .reduce((acc, apt) => {
            if (!acc.find(p => p.id === apt.patient.id)) {
              acc.push(apt.patient);
            }
            return acc;
          }, []);
        setPatients(myPatients);
        console.log('📊 [MyPatients] Found', myPatients.length, 'patients');
      }
    } catch (err) {
      console.error('💥 [MyPatients] Fetch error:', err);
      setError(err.message || 'فشل تحميل البيانات');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || p.phone?.includes(search);
  });

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg" type="button">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">مرضاي</h1>
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

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث باسم المريض أو الهاتف..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-gray-600">جاري تحميل مرضاك...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'لا توجد نتائج' : 'ليس لديك مرضى بعد'}</p>
              <p className="text-sm mt-2">المريض سيظهر هنا بعد حجز أول موعد معه</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{patient.firstName} {patient.lastName}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      {patient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {patient.phone}
                        </span>
                      )}
                      {patient.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {patient.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ✅ زر طلب فحص - جديد */}
                    <button 
                      onClick={() => navigate(`/lab?action=request&patientId=${patient.id}`)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                      type="button"
                      title="طلب فحص"
                    >
                      <TestTube className="w-5 h-5" />
                    </button>
                    {/* زر عرض المواعيد */}
                    <button 
                      onClick={() => navigate(`/appointments?patient=${patient.id}`)}
                      className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded"
                      type="button"
                      title="عرض المواعيد"
                    >
                      <Calendar className="w-5 h-5" />
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

export default MyPatients;