import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Users, Stethoscope, Calendar, FileText, TestTube, 
         Clipboard, DollarSign, Activity, Settings, FileCheck, Printer } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ===========================================
  // 🎯 ROLE-BASED MENU ITEMS
  // ===========================================
  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: Users, title: 'المرضى', color: 'bg-blue-500', path: '/patients', description: 'إدارة سجلات المرضى' },
          { icon: Stethoscope, title: 'الأطباء', color: 'bg-green-500', path: '/doctors', description: 'إدارة هيئة الأطباء' },
          { icon: TestTube, title: 'المختبر', color: 'bg-red-500', path: '/lab', description: 'الفحوصات والنتائج' },
          { icon: Calendar, title: 'المواعيد', color: 'bg-purple-500', path: '/appointments', description: 'حجز ومتابعة المواعيد' },
          { icon: DollarSign, title: 'الفواتير', color: 'bg-orange-500', path: '/invoices', description: 'الفواتير والمدفوعات' },
          { icon: Settings, title: 'الإعدادات', color: 'bg-gray-500', path: '/settings', description: 'إعدادات النظام' },
          { icon: Activity, title: 'التقارير', color: 'bg-indigo-500', path: '/reports', description: 'التقارير والإحصائيات' },
          { icon: User, title: 'المستخدمين', color: 'bg-teal-500', path: '/users', description: 'إدارة المستخدمين' },
        ];
      
      case 'DOCTOR':
        return [
          { icon: Users, title: 'مرضاي', color: 'bg-blue-500', path: '/my-patients', description: 'ملفات مرضاي' },
          { icon: Calendar, title: 'مواعيدي', color: 'bg-purple-500', path: '/my-appointments', description: 'جدول مواعيدي' },
          { icon: FileCheck, title: 'النتائج', color: 'bg-green-500', path: '/lab-results', description: 'نتائج المختبر' },
          { icon: Clipboard, title: 'السجلات', color: 'bg-orange-500', path: '/medical-records', description: 'السجلات الطبية' },
          { icon: FileText, title: 'الوصفات', color: 'bg-red-500', path: '/prescriptions', description: 'الوصفات الطبية' },
        ];
      
      case 'LAB_TECH':
        return [
          { icon: TestTube, title: 'الفحوصات', color: 'bg-red-500', path: '/lab-tests', description: 'قائمة الفحوصات' },
          { icon: Clipboard, title: 'الطلبات', color: 'bg-purple-500', path: '/lab-requests', description: 'طلبات الفحوصات' },
          { icon: FileCheck, title: 'النتائج', color: 'bg-green-500', path: '/lab-results', description: 'إدخال النتائج' },
          { icon: Printer, title: 'التقارير', color: 'bg-blue-500', path: '/lab-reports', description: 'طباعة التقارير' },
        ];
      
      case 'RECEPTIONIST':
        return [
          { icon: Users, title: 'المرضى', color: 'bg-blue-500', path: '/patients', description: 'تسجيل المرضى' },
          { icon: Calendar, title: 'المواعيد', color: 'bg-purple-500', path: '/appointments', description: 'حجز المواعيد' },
          { icon: DollarSign, title: 'الفواتير', color: 'bg-orange-500', path: '/invoices', description: 'الفواتير والدفع' },
          { icon: Phone, title: 'التأكيدات', color: 'bg-green-500', path: '/confirmations', description: 'تأكيد المواعيد' },
          { icon: Printer, title: 'الطباعة', color: 'bg-red-500', path: '/print', description: 'طباعة الفواتير' },
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  // ===========================================
  // 📊 ROLE-BASED STATS
  // ===========================================
  const getStats = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'إجمالي المرضى', value: '0', icon: Users },
          { label: 'الأطباء المتاحون', value: '0', icon: Stethoscope },
          { label: 'مواعيد اليوم', value: '0', icon: Calendar },
          { label: 'الفواتير المعلقة', value: '0', icon: DollarSign },
        ];
      case 'DOCTOR':
        return [
          { label: 'مرضاى اليوم', value: '0', icon: Users },
          { label: 'مواعيدي', value: '0', icon: Calendar },
          { label: 'النتائج المعلقة', value: '0', icon: FileCheck },
          { label: 'الوصفات', value: '0', icon: FileText },
        ];
      case 'LAB_TECH':
        return [
          { label: 'الطلبات المعلقة', value: '0', icon: Clipboard },
          { label: 'فحوصات اليوم', value: '0', icon: TestTube },
          { label: 'النتائج المكتملة', value: '0', icon: FileCheck },
          { label: 'قيد المعالجة', value: '0', icon: Activity },
        ];
      case 'RECEPTIONIST':
        return [
          { label: 'مواعيد اليوم', value: '0', icon: Calendar },
          { label: 'مواعيد الغد', value: '0', icon: Calendar },
          { label: 'الفواتير المعلقة', value: '0', icon: DollarSign },
          { label: 'المرضى الجدد', value: '0', icon: Users },
        ];
      default:
        return [];
    }
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
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
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-700" />
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">
            مرحباً بك، {user?.firstName}! 👋
          </h2>
          <p className="opacity-90">
            {user?.role === 'ADMIN' && 'لديك تحكم كامل بجميع أقسام النظام'}
            {user?.role === 'DOCTOR' && 'إدارة مرضاك ومواعيدك ونتائج المختبر'}
            {user?.role === 'LAB_TECH' && 'إدارة الفحوصات والنتائج والتقارير'}
            {user?.role === 'RECEPTIONIST' && 'إدارة المواعيد والفواتير والمرضى'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className="w-5 h-5 text-primary-500" />
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-center group"
            >
              <div className={`${item.color} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-medium text-gray-700 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
