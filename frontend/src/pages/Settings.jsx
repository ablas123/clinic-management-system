// File: frontend/src/pages/Settings.jsx - FIXED NAME CONFLICT
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// ✅ إصلاح: إعادة تسمية أيقونة Settings لتجنب التعارض
import { ArrowLeft, Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Moon, Save, Loader2 } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const [settings, setSettings] = useState({
    clinicName: 'العيادة الشاملة',
    clinicPhone: '0500000000',
    clinicEmail: 'info@clinic.com',
    clinicAddress: 'المملكة العربية السعودية',
    workingHours: '08:00 - 20:00',
    appointmentDuration: '30',
    enableNotifications: true,
    enableEmailAlerts: true,
    autoLogoutMinutes: '15',
    language: 'ar',
    theme: 'light'
  });

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    
    try {
      localStorage.setItem('clinicSettings', JSON.stringify(settings));
      setSuccess('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const SettingSection = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        {/* ✅ استخدام الأيقونة المعاد تسميتها */}
        <Icon className="w-6 h-6 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg" type="button">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {/* ✅ استخدام الأيقونة المعاد تسميتها */}
              <SettingsIcon className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-800">الإعدادات</h1>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50" type="button">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <SettingSection icon={User} title="معلومات العيادة">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={settings.clinicName} onChange={(e) => setSettings({...settings, clinicName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="اسم العيادة" />
            <input type="tel" value={settings.clinicPhone} onChange={(e) => setSettings({...settings, clinicPhone: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="الهاتف" />
            <input type="email" value={settings.clinicEmail} onChange={(e) => setSettings({...settings, clinicEmail: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="البريد" />
            <input type="text" value={settings.clinicAddress} onChange={(e) => setSettings({...settings, clinicAddress: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="العنوان" />
            <input type="text" value={settings.workingHours} onChange={(e) => setSettings({...settings, workingHours: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="ساعات العمل" />
            <input type="number" value={settings.appointmentDuration} onChange={(e) => setSettings({...settings, appointmentDuration: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2" placeholder="مدة الموعد (دقائق)" />
          </div>
        </SettingSection>

        <SettingSection icon={Bell} title="الإشعارات">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border rounded-lg">
              <span className="font-medium text-gray-700">تفعيل إشعارات المواعيد</span>
              <input type="checkbox" checked={settings.enableNotifications} onChange={(e) => setSettings({...settings, enableNotifications: e.target.checked})} className="w-5 h-5" />
            </label>
            <label className="flex items-center justify-between p-4 border rounded-lg">
              <span className="font-medium text-gray-700">تفعيل تنبيهات البريد الإلكتروني</span>
              <input type="checkbox" checked={settings.enableEmailAlerts} onChange={(e) => setSettings({...settings, enableEmailAlerts: e.target.checked})} className="w-5 h-5" />
            </label>
          </div>
        </SettingSection>

        <SettingSection icon={Shield} title="الأمان">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <label className="block font-medium text-gray-700 mb-2">إنهاء الجلسة التلقائي بعد (دقائق)</label>
              <input type="number" value={settings.autoLogoutMinutes} onChange={(e) => setSettings({...settings, autoLogoutMinutes: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto" />
              <p className="text-xs text-gray-500 mt-2">لأغراض الأمان، سيتم تسجيل الخروج تلقائياً بعد فترة عدم النشاط</p>
            </div>
          </div>
        </SettingSection>

        <SettingSection icon={Globe} title="اللغة والمظهر">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <select value={settings.theme} onChange={(e) => setSettings({...settings, theme: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2">
              <option value="light">فاتح ☀️</option>
              <option value="dark">داكن 🌙</option>
            </select>
          </div>
        </SettingSection>

        <SettingSection icon={Database} title="البيانات">
          <div className="space-y-4">
            <button className="w-full md:w-auto px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium" type="button">
              📥 تصدير البيانات
            </button>
            <p className="text-xs text-gray-500">تنزيل نسخة احتياطية من جميع بيانات النظام</p>
          </div>
        </SettingSection>
      </main>
    </div>
  );
};

export default Settings;
