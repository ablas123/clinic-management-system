// File: frontend/src/pages/Dashboard.jsx - COMPLETE & PRODUCTION READY
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Users, Stethoscope, Calendar, FileText, TestTube, Clipboard, DollarSign, Activity, Settings, FileCheck, Printer, Phone } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: Users, title: 'المرضى', color: 'bg-blue-500', path: '/patients', desc: 'إدارة سجلات المرضى' },
          { icon: Stethoscope, title: 'الأطباء', color: 'bg-green-500', path: '/doctors', desc: 'إدارة هيئة الأطباء' },
          { icon: TestTube, title: 'المختبر', color: 'bg-red-500', path: '/lab-tech', desc: 'إدارة الفحوصات والنتائج' },
          { icon: Calendar, title: 'المواعيد', color: 'bg-purple-500', path: '/appointments', desc: 'حجز ومتابعة المواعيد' },
          { icon: DollarSign, title: 'الفواتير', color: 'bg-orange-500', path: '/invoices', desc: 'الفواتير والمدفوعات' },
          { icon: Activity, title: 'التقارير', color: 'bg-indigo-500', path: '/reports', desc: 'التقارير والإحصائيات' },
          { icon: Settings, title: 'الإعدادات', color: 'bg-gray-500', path: '/settings', desc: 'إعدادات النظام' },
        ];
      case 'DOCTOR':
        return [
          { icon: Users, title: 'مرضاي', color: 'bg-blue-500', path: '/my-patients', desc: 'ملفات مرضاي' },
          { icon: Calendar, title: 'مواعيدي', color: 'bg-purple-500', path: '/my-appointments', desc: 'جدول مواعيدي' },
          { icon: TestTube, title: 'طلب فحوصات', color: 'bg-red-500', path: '/lab', desc: 'طلب فحوصات مختبر' },
          { icon: FileCheck, title: 'النتائج', color: 'bg-green-500', path: '/lab-results', desc: 'عرض النتائج الموثقة' },
          { icon: Clipboard, title: 'السجلات', color: 'bg-orange-500', path: '/medical-records', desc: 'السجلات الطبية' },
        ];
      case 'LAB_TECH':
        return [
          { icon: TestTube, title: 'المختبر', color: 'bg-red-500', path: '/lab-tech', desc: 'إدارة الفحوصات والنتائج' },
          { icon: Clipboard, title: 'المعلقة', color: 'bg-yellow-500', path: '/lab-tech', desc: 'النتائج قيد المعالجة' },
          { icon: FileCheck, title: 'المكتملة', color: 'bg-green-500', path: '/lab-tech', desc: 'النتائج الموثقة' },
          { icon: Printer, title: 'التقارير', color: 'bg-blue-500', path: '/lab-tech', desc: 'طباعة وإرسال' },
        ];
      case 'RECEPTIONIST':
        return [
          { icon: Users, title: 'المرضى', color: 'bg-blue-500', path: '/patients', desc: 'تسجيل المرضى' },
          { icon: Calendar, title: 'المواعيد', color: 'bg-purple-500', path: '/appointments', desc: 'حجز المواعيد' },
          { icon: DollarSign, title: 'الفواتير', color: 'bg-orange-500', path: '/invoices', desc: 'الفواتير والدفع' },
          { icon: Phone, title: 'التأكيدات', color: 'bg-green-500', path: '/confirmations', desc: 'تأكيد المواعيد' },
        ];
      default: return [];
    }
  };

  const menuItems = getMenuItems();
  const getStats = () => {
    switch (user?.role) {
      case 'ADMIN': return [
        { label: 'إجمالي المرضى', value: '--', icon: Users, color: 'text-blue-500' },
        { label: 'الأطباء المتاحون', value: '--', icon: Stethoscope, color: 'text-green-500' },
        { label: 'مواعيد اليوم', value: '--', icon: Calendar, color: 'text-purple-500' },
        { label: 'الفواتير المعلقة', value: '--', icon: DollarSign, color: 'text-orange-500' },
      ];
      case 'DOCTOR': return [
        { label: 'مرضاى اليوم', value: '--', icon: Users, color: 'text-blue-500' },
        { label: 'مواعيدي', value: '--', icon: Calendar, color: 'text-purple-500' },
        { label: 'النتائج المعلقة', value: '--', icon: FileCheck, color: 'text-green-500' },
        { label: 'الوصفات', value: '--', icon: FileText, color: 'text-orange-500' },
      ];
      case 'LAB_TECH': return [
        { label: 'الطلبات المعلقة', value: '--', icon: Clipboard, color: 'text-purple-500' },
        { label: 'فحوصات اليوم', value: '--', icon: TestTube, color: 'text-red-500' },
        { label: 'النتائج المكتملة', value: '--', icon: FileCheck, color: 'text-green-500' },
        { label: 'قيد المعالجة', value: '--', icon: Activity, color: 'text-blue-500' },
      ];
      case 'RECEPTIONIST': return [
        { label: 'مواعيد اليوم', value: '--', icon: Calendar, color: 'text-purple-500' },
        { label: 'مواعيد الغد', value: '--', icon: Calendar, color: 'text-blue-500' },
        { label: 'الفواتير المعلقة', value: '--', icon: DollarSign, color: 'text-orange-500' },
        { label: 'المرضى الجدد', value: '--', icon: Users, color: 'text-green-500' },
      ];
      default: return [];
    }
  };
  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <h1 className="text-xl font-bold text-gray-800">نظام إدارة العيادات</h1>
              <p className="text-xs text-gray-500">
                {user?.role === 'ADMIN' && 'لوحة تحكم المدير'}
                {user?.role === 'DOCTOR' && 'بوابة الطبيب'}
                {user?.role === 'LAB_TECH' && 'بوابة المختبر'}
                {user?.role === 'RECEPTIONIST' && 'بوابة الاستقبال'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-700" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'ADMIN' && 'مدير النظام'}
                  {user?.role === 'DOCTOR' && 'طبيب'}
                  {user?.role === 'LAB_TECH' && 'فني مختبر'}
                  {user?.role === 'RECEPTIONIST' && 'موظف استقبال'}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700" type="button">
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">مرحباً بك، {user?.firstName}! 👋</h2>
          <p className="opacity-90">
            {user?.role === 'ADMIN' && 'لديك تحكم كامل بجميع أقسام النظام'}
            {user?.role === 'DOCTOR' && 'إدارة مرضاك ومواعيدك ونتائج المختبر'}
            {user?.role === 'LAB_TECH' && 'إدارة الفحوصات والنتائج والتقارير'}
            {user?.role === 'RECEPTIONIST' && 'إدارة المواعيد والفواتير والمرضى'}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <button key={item.title} onClick={() => navigate(item.path)} type="button" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-center group">
              <div className={`${item.color} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-medium text-gray-700 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;