// File: frontend/src/App.jsx - COMPLETE & FINAL
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages - Public
import Login from './pages/Login';

// Pages - Main
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Invoices from './pages/Invoices';
import Lab from './pages/Lab';

// Pages - Doctor (Real Working)
import MyPatients from './pages/MyPatients';
import MyAppointments from './pages/MyAppointments';
import LabResults from './pages/LabResults';

// Pages - Placeholder (يمكن تطويرها لاحقاً)
const MedicalRecords = () => <div className="p-8 text-center text-gray-600">📋 السجلات الطبية - قيد التطوير</div>;
const LabTests = () => <div className="p-8 text-center text-gray-600">🧪 الفحوصات - قيد التطوير</div>;
const LabRequests = () => <div className="p-8 text-center text-gray-600">📝 طلبات المختبر - قيد التطوير</div>;
const LabReports = () => <div className="p-8 text-center text-gray-600">🖨️ تقارير المختبر - قيد التطوير</div>;
const Patients = () => <div className="p-8 text-center text-gray-600">👥 إدارة المرضى - قيد التطوير</div>;
const Doctors = () => <div className="p-8 text-center text-gray-600">👨‍⚕️ إدارة الأطباء - قيد التطوير</div>;
const Reports = () => <div className="p-8 text-center text-gray-600">📊 التقارير والإحصائيات - قيد التطوير</div>;
const Settings = () => <div className="p-8 text-center text-gray-600">⚙️ الإعدادات - قيد التطوير</div>;
const Confirmations = () => <div className="p-8 text-center text-gray-600">📞 تأكيد المواعيد - قيد التطوير</div>;
const Print = () => <div className="p-8 text-center text-gray-600">🖨️ الطباعة - قيد التطوير</div>;

// ===========================================
// ✅ مكون حماية المسارات (يتطلب تسجيل دخول)
// ===========================================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// ===========================================
// ✅ مكون حماية حسب الدور (RBAC)
// ===========================================
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// ===========================================
// ✅ تعريف جميع المسارات
// ===========================================
function AppRoutes() {
  return (
    <Routes>
      {/* ===========================================
          PUBLIC ROUTES
      =========================================== */}
      <Route path="/login" element={<Login />} />

      {/* ===========================================
          MAIN DASHBOARD
      =========================================== */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* ===========================================
          SHARED PAGES (Multiple Roles)
      =========================================== */}
      <Route path="/appointments" element={
        <ProtectedRoute>
          <Appointments />
        </ProtectedRoute>
      } />
      
      <Route path="/invoices" element={
        <ProtectedRoute>
          <Invoices />
        </ProtectedRoute>
      } />
      
      <Route path="/lab" element={
        <ProtectedRoute>
          <Lab />
        </ProtectedRoute>
      } />

      {/* ===========================================
          DOCTOR ROUTES (Real Working Pages)
      =========================================== */}
      <Route path="/my-patients" element={
        <RoleRoute allowedRoles={['DOCTOR']}>
          <MyPatients />
        </RoleRoute>
      } />
      
      <Route path="/my-appointments" element={
        <RoleRoute allowedRoles={['DOCTOR']}>
          <MyAppointments />
        </RoleRoute>
      } />
      
      <Route path="/lab-results" element={
        <RoleRoute allowedRoles={['DOCTOR', 'LAB_TECH']}>
          <LabResults />
        </RoleRoute>
      } />
      
      <Route path="/medical-records" element={
        <RoleRoute allowedRoles={['DOCTOR']}>
          <MedicalRecords />
        </RoleRoute>
      } />

      {/* ===========================================
          LAB TECH ROUTES
      =========================================== */}
      <Route path="/lab-tests" element={
        <RoleRoute allowedRoles={['LAB_TECH']}>
          <LabTests />
        </RoleRoute>
      } />
      
      <Route path="/lab-requests" element={
        <RoleRoute allowedRoles={['LAB_TECH', 'DOCTOR']}>
          <LabRequests />
        </RoleRoute>
      } />
      
      <Route path="/lab-reports" element={
        <RoleRoute allowedRoles={['LAB_TECH']}>
          <LabReports />
        </RoleRoute>
      } />

      {/* ===========================================
          ADMIN / RECEPTIONIST ROUTES
      =========================================== */}
      <Route path="/patients" element={
        <RoleRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
          <Patients />
        </RoleRoute>
      } />
      
      <Route path="/doctors" element={
        <RoleRoute allowedRoles={['ADMIN']}>
          <Doctors />
        </RoleRoute>
      } />
      
      <Route path="/reports" element={
        <RoleRoute allowedRoles={['ADMIN']}>
          <Reports />
        </RoleRoute>
      } />
      
      <Route path="/settings" element={
        <RoleRoute allowedRoles={['ADMIN']}>
          <Settings />
        </RoleRoute>
      } />
      
      <Route path="/confirmations" element={
        <RoleRoute allowedRoles={['RECEPTIONIST']}>
          <Confirmations />
        </RoleRoute>
      } />
      
      <Route path="/print" element={
        <RoleRoute allowedRoles={['RECEPTIONIST']}>
          <Print />
        </RoleRoute>
      } />

      {/* ===========================================
          CATCH-ALL (Redirect to Dashboard)
      =========================================== */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ===========================================
// ✅ المكون الرئيسي للتطبيق
// ===========================================
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
