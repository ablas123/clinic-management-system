import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Users, Stethoscope, Calendar, FileText, TestTube } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      icon: Users, 
      title: 'المرضى', 
      color: 'bg-blue-500', 
      path: '/patients',
      description: 'إدارة سجلات المرضى'
    },
    { 
      icon: Stethoscope, 
      title: 'الأطباء', 
      color: 'bg-green-500', 
      path: '/doctors',
      description: 'إدارة هيئة الأطباء'
    },
    { 
      icon: Calendar, 
      title: 'المواعيد', 
      color: 'bg-purple-500', 
      path: '/appointments',
      description: 'حجز ومتابعة المواعيد'
    },
    { 
      icon: FileText, 
      title: 'الفواتير', 
      color: 'bg-orange-500', 
      path: '/invoices',
      description: 'الفواتير والمدفوعات'
    },
    { 
      icon: TestTube, 
      title: 'المختبر', 
      color: 'bg-red-500', 
      path: '/lab',
      description: 'الفحوصات والنتائج'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* 🔝 Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <h1 className="text-xl font-bold text-gray-800">نظام إدارة العيادات</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">{user?.email}</span>
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                {user?.role === 'ADMIN' ? 'مدير' : user?.role}
              </span>
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

      {/* 📊 Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">مرحباً بك! 👋</h2>
          <p className="opacity-90">
            اختر وحدة من النظام للبدء في الإدارة
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

        {/* 📈 Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">إجمالي المرضى</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">الأطباء المتاحون</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">مواعيد اليوم</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">الفواتير المعلقة</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;