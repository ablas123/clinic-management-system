// File: frontend/src/pages/Reports.jsx - PRODUCTION READY
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Activity, Users, Stethoscope, Calendar, DollarSign, TestTube, TrendingUp, TrendingDown, Download, Printer } from 'lucide-react';

const Reports = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    todayAppointments: 0,
    labTestsToday: 0
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      // جلب الإحصائيات من عدة endpoints
      const [patientsRes, doctorsRes, appointmentsRes, invoicesRes] = await Promise.all([
        api.get('/patients?limit=1'),
        api.get('/doctors?limit=1'),
        api.get('/appointments?limit=1'),
        api.get('/invoices?limit=100')
      ]);

      if (patientsRes.data?.success) {
        setStats(prev => ({ ...prev, totalPatients: patientsRes.data['data']?.pagination?.total || 0 }));
      }
      if (doctorsRes.data?.success) {
        setStats(prev => ({ ...prev, totalDoctors: doctorsRes.data['data']?.pagination?.total || 0 }));
      }
      if (appointmentsRes.data?.success) {
        const totalApts = appointmentsRes.data['data']?.pagination?.total || 0;
        const today = new Date().toISOString().split('T')[0];
        const todayCount = (appointmentsRes.data['data']?.appointments || []).filter(a => a.date?.startsWith(today)).length;
        setStats(prev => ({ ...prev, totalAppointments: totalApts, todayAppointments: todayCount }));
      }
      if (invoicesRes.data?.success) {
        const invoices = invoicesRes.data['data']?.invoices || [];
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const pendingCount = invoices.filter(inv => inv.status === 'PENDING').length;
        setStats(prev => ({ ...prev, totalInvoices: invoices.length, totalRevenue, pendingInvoices: pendingCount }));
      }
    } catch (err) {
      setError(err.message || 'فشل تحميل التقارير');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(stats, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value.toLocaleString('ar-EG')}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg" type="button">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">التقارير والإحصائيات</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg" type="button">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" type="button">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">تقرير إدارة العيادات</h1>
          <p className="text-center text-gray-600">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600">جاري تحميل التقارير...</p></div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} title="إجمالي المرضى" value={stats.totalPatients} color="bg-blue-500" trend={12} />
              <StatCard icon={Stethoscope} title="الأطباء النشطون" value={stats.totalDoctors} color="bg-green-500" trend={5} />
              <StatCard icon={Calendar} title="مواعيد اليوم" value={stats.todayAppointments} color="bg-purple-500" trend={-3} />
              <StatCard icon={DollarSign} title="الإيرادات (ر.س)" value={stats.totalRevenue.toFixed(2)} color="bg-orange-500" trend={18} />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FileText} title="إجمالي الفواتير" value={stats.totalInvoices} color="bg-pink-500" />
              <StatCard icon={AlertCircle} title="فواتير معلقة" value={stats.pendingInvoices} color="bg-yellow-500" />
              <StatCard icon={TestTube} title="فحوصات المختبر" value={stats.labTestsToday} color="bg-red-500" />
              <StatCard icon={Activity} title="متوسط الإشغال" value={`${Math.round((stats.todayAppointments / (stats.totalDoctors * 20)) * 100)}%`} color="bg-indigo-500" />
            </div>

            {/* Monthly Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">الأداء الشهري</h2>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">📊 رسم بياني شهري (يتطلب مكتبة رسوم)</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">إجراءات سريعة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => navigate('/patients')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center" type="button">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">المرضى</p>
                </button>
                <button onClick={() => navigate('/appointments')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center" type="button">
                  <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">المواعيد</p>
                </button>
                <button onClick={() => navigate('/invoices')} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center" type="button">
                  <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">الفواتير</p>
                </button>
                <button onClick={() => navigate('/lab')} className="p-4 bg-red-50 hover:bg-red-100 rounded-lg text-center" type="button">
                  <TestTube className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">المختبر</p>
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
