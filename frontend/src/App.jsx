// File: frontend/src/App.jsx - COMPLETE & FINAL (All Routes)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ===========================================
// PAGES - PUBLIC
// ===========================================
import Login from './pages/Login';

// ===========================================
// PAGES - MAIN (All Authenticated Users)
// ===========================================
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Invoices from './pages/Invoices';
import Lab from './pages/Lab';

// ===========================================
// PAGES - DOCTOR (Real Working)
// ===========================================
import MyPatients from './pages/MyPatients';
import MyAppointments from './pages/MyAppointments';
import LabResults from './pages/LabResults';
import MedicalRecords from './pages/MedicalRecords';

// ===========================================
// PAGES - ADMIN / RECEPTIONIST (Production Ready)
// ===========================================
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// ===========================================
// PAGES - LAB TECH (Placeholder - Can be enhanced)
// ===========================================
const LabTests = () => (
  <div className="min-h-screen bg-gray-50" dir="rtl">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">🧪 فحوصات المختبر</h1>
      <p className="text-gray-600">هذه الصفحة متاحة لفنيي المختبر - يمكن تطويرها لاحقاً</p>
    </div>
  </div>
);

const LabRequests = () => (
  <div className="min-h-screen bg-gray-50" dir="rtl">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">📝 طلبات المختبر</h1>
      <p className="text-gray-600">هذه الصفحة متاحة لفنيي المختبر والأطباء - يمكن تطويرها لاحقاً</p>
    </div>
  </div>
);

const LabReports = () => (
  <div className="min-h-screen bg-gray-50" dir="rtl">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">🖨️ تقارير المختبر</h1>
      <p className="text-gray-600">هذه الصفحة متاحة لفنيي المختبر - يمكن تطويرها لاحقاً</p>
    </div>
  </div>
);

const Confirmations = () => (
  <div className="min-h-screen bg-gray-50" dir="rtl">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">📞 تأكيد المواعيد</h1>
      <p className="text-gray-600">هذه الصفحة متاحة لموظفي الاستقبال - يمكن تطويرها لاحقاً</p>
    </div>
  </div>
);

const Print = () => (
  <div className="min-h-screen bg-gray-50" dir="rtl">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">🖨️ الطباعة</h1>
      <p className="text-gray-600">هذه الصفحة متاحة لموظفي الاستقبال - يمكن تطويرها لاحقاً</p>
    </div>
  </div>
);

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
// ✅ تعريف جميع المسارات (18 صفحة)
// ===========================================
function AppRoutes() {
  return (
    <Routes>
      {/* ===========================================
          PUBLIC ROUTES
      =========================================== */}
      <Route path="/login" element={<Login />} />

      {/* ===========================================
          MAIN DASHBOARD (All Authenticated)
      =========================================== */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      {/* ===========================================
          SHARED PAGES (All Authenticated)
      =========================================== */}
      <Route path="/appointments" element={
        <ProtectedRoute><Appointments /></ProtectedRoute>
      } />
      
      <Route path="/invoices" element={
        <ProtectedRoute><Invoices /></ProtectedRoute>
      } />
      
      <Route path="/lab" element={
        <ProtectedRoute><Lab /></ProtectedRoute>
      } />

      {/* ===========================================
          DOCTOR ROUTES (Real Working Pages)
      =========================================== */}
      <Route path="/my-patients" element={
        <RoleRoute allowedRoles={['DOCTOR']}><MyPatients /></RoleRoute>
      } />
      
      <Route path="/my-appointments" element={
        <RoleRoute allowedRoles={['DOCTOR']}><MyAppointments /></RoleRoute>
      } />
      
      <Route path="/lab-results" element={
        <RoleRoute allowedRoles={['DOCTOR', 'LAB_TECH']}><LabResults /></RoleRoute>
      } />
      
      <Route path="/medical-records" element={
        <RoleRoute allowedRoles={['DOCTOR']}><MedicalRecords /></RoleRoute>
      } />

      {/* ===========================================
          LAB TECH ROUTES
      =========================================== */}
      <Route path="/lab-tests" element={
        <RoleRoute allowedRoles={['LAB_TECH']}><LabTests /></RoleRoute>
      } />
      
      <Route path="/lab-requests" element={
        <RoleRoute allowedRoles={['LAB_TECH', 'DOCTOR']}><LabRequests /></RoleRoute>
      } />
      
      <Route path="/lab-reports" element={
        <RoleRoute allowedRoles={['LAB_TECH']}><LabReports /></RoleRoute>
      } />

      {/* ===========================================
          ADMIN / RECEPTIONIST ROUTES (Production Ready)
      =========================================== */}
      <Route path="/patients" element={
        <RoleRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}><Patients /></RoleRoute>
      } />
      
      <Route path="/doctors" element={
        <RoleRoute allowedRoles={['ADMIN']}><Doctors /></RoleRoute>
      } />
      
      <Route path="/reports" element={
        <RoleRoute allowedRoles={['ADMIN']}><Reports /></RoleRoute>
      } />
      
      <Route path="/settings" element={
        <RoleRoute allowedRoles={['ADMIN']}><Settings /></RoleRoute>
      } />

      {/* ===========================================
          RECEPTIONIST ROUTES (Placeholder)
      =========================================== */}
      <Route path="/confirmations" element={
        <RoleRoute allowedRoles={['RECEPTIONIST']}><Confirmations /></RoleRoute>
      } />
      
      <Route path="/print" element={
        <RoleRoute allowedRoles={['RECEPTIONIST']}><Print /></RoleRoute>
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