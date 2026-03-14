// File: frontend/src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Users, Stethoscope, Calendar, FileText, TestTube, Clipboard, DollarSign, Activity, Settings, FileCheck, Printer, Phone } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ قوائم حسب الدور - نفس هيكلية الباكند
  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: Users, title: 'المرضى', color: 'bg-blue-500', path: '/patients', desc: 'إدارة سجلات المرضى' },
          { icon: Stethoscope, title: 'الأطباء', color: 'bg-green-500', path: '/doctors', desc: 'إدارة هيئة الأطباء' },
          { icon: TestTube, title: 'المختبر', color: 'bg-red-500', path: '/lab', desc: 'الفحوصات والنتائج' },
          { icon: Calendar, title: 'المواعيد', color: 'bg-purple-500', path: '/appointments', desc: 'حجز ومتابعة المواعيد' },
          { icon: DollarSign, title: 'الفواتير', color: 'bg-orange-500', path: '/invoices', desc: 'الفواتير والمدفوعات' },
          { icon: Activity, title: 'التقارير', color: 'bg-indigo-500', path: '/reports', desc: 'التقارير والإحصائيات' },
          { icon: Settings, title: 'الإعدادات', color: 'bg-gray-500', path: '/settings', desc: 'إعدادات النظام' },
        ];
      
      case 'DOCTOR':
        return [
          { icon: Users, title: 'مرضاي', color: 'bg-blue-500', path: '/my-patients', desc: 'ملفات مرضاي' },
          { icon: Calendar, title: 'مواعيدي', color: 'bg-purple-500', path: '/my-appointments', desc: 'جدول مواعيدي' },
          { icon: FileCheck, title: 'النتائج', color: 'bg-green-500', path: '/lab-results', desc: 'نتائج المختبر' },
          { icon: Clipboard, title: 'السجلات', color: 'bg-orange-500', path: '/medical-records', desc: 'السجلات الطبية' },
        ];
      
      case 'LAB_TECH':
        return [
          { icon: TestTube, title: 'الفحوصات', color: 'bg-red-500', path: '/lab-tests', desc: 'قائمة الفحوصات' },
          { icon: Clipboard, title: 'الطلبات', color: 'bg-purple-500', path: '/lab-requests', desc: 'طلبات الفحوصات' },
          { icon: FileCheck, title: 'النتائج', color: 'bg-green-500', path: '/lab-results', desc: 'إدخال النتائج' },
          { icon: Printer, title: 'التقارير', color: 'bg-blue-500', path: '/lab-reports', desc: 'طباعة التقارير' },
        ];
      
      case 'RECEPTIONIST':
        return [
          { icon: Users, title: 'المرضى', color: 'bg-blue-500', path: '/patients', desc: 'تسجيل المرضى' },
          { icon: Calendar, title: 'المواعيد', color: 'bg-purple-500', path: '/appointments', desc: 'حجز المواعيد' },
          { icon: DollarSign, title: 'الفواتير', color: 'bg-orange-500', path: '/invoices', desc: 'الفواتير والدفع' },
          { icon: Phone, title: 'التأكيدات', color: 'bg-green-500', path: '/confirmations', desc: 'تأكيد المواعيد' },
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  // ✅ إحصائيات حسب الدور
  const getStats = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'إجمالي المرضى', value: '--', icon: Users, color: 'text-blue-500' },
          { label: 'الأطباء المتاحون', value: '--', icon: Stethoscope, color: 'text-green-500' },
          { label: 'مواعيد اليوم', value: '--', icon: Calendar, color: 'text-purple-500' },
          { label: 'الفواتير المعلقة', value: '--', icon: DollarSign, color: 'text-orange-500' },
        ];
      case 'DOCTOR':
        return [
          { label: 'مرضاى اليوم', value: '--', icon: Users, color: 'text-blue-500' },
          { label: 'مواعيدي', value: '--', icon: Calendar, color: 'text-purple-500' },
          { label: 'النتائج المعلقة', value: '--', icon: FileCheck, color: 'text-green-500' },
          { label: 'الوصفات', value: '--', icon: FileText, color: 'text-orange-500' },
        ];
      case 'LAB_TECH':
        return [
          { label: 'الطلبات المعلقة', value: '--', icon: Clipboard, color: 'text-purple-500' },
          { label: 'فحوصات اليوم', value: '--', icon: TestTube, color: 'text-red-500' },
          { label: 'النتائج المكتملة', value: '--', icon: FileCheck, color: 'text-green-500' },
          { label: 'قيد المعالجة', value: '--', icon: Activity, color: 'text-blue-500' },
        ];
      case 'RECEPTIONIST':
        return [
          { label: 'مواعيد اليوم', value: '--', icon: Calendar, color: 'text-purple-500' },
          { label: 'مواعيد الغد', value: '--', icon: Calendar, color: 'text-blue-500' },
          { label: 'الفواتير المعلقة', value: '--', icon: DollarSign, color: 'text-orange-500' },
          { label: 'المرضى الجدد', value: '--', icon: Users, color: 'text-green-500' },
        ];
      default:
        return [];
    }
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
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