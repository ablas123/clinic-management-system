// File: frontend/src/App.jsx - COMPLETE & FINAL (All Routes Defined)
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

// ===========================================
// PAGES - LAB MODULE (HL7-inspired Workflow)
// ===========================================
import LabDoctor from './pages/LabDoctor';        // Doctor: Request tests only
import LabTech from './pages/LabTech';            // Lab Tech: Full management
import LabResults from './pages/LabResults';      // View verified results
import LabCatalog from './pages/LabCatalog';      // Admin/Lab Tech: Catalog management

// ===========================================
// PAGES - DOCTOR (Real Working)
// ===========================================
import MyPatients from './pages/MyPatients';
import MyAppointments from './pages/MyAppointments';
import MedicalRecords from './pages/MedicalRecords';

// ===========================================
// PAGES - ADMIN / RECEPTIONIST (Production Ready)
// ===========================================
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// ===========================================
// PAGES - PLACEHOLDER (Can be enhanced later)
// ===========================================
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
// ✅ تعريف جميع المسارات (21 صفحة)
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

      {/* ===========================================
          LAB MODULE (HL7-inspired Workflow)
      =========================================== */}
      {/* Doctor: Request lab tests only */}
      <Route path="/lab" element={
        <RoleRoute allowedRoles={['DOCTOR']}><LabDoctor /></RoleRoute>
      } />
      
      {/* Lab Tech: Full lab management */}
      <Route path="/lab-tech" element={
        <RoleRoute allowedRoles={['LAB_TECH']}><LabTech /></RoleRoute>
      } />
      
      {/* View verified results (Doctor/Lab Tech) */}
      <Route path="/lab-results" element={
        <RoleRoute allowedRoles={['DOCTOR', 'LAB_TECH']}><LabResults /></RoleRoute>
      } />
      
      {/* ✅ NEW: Catalog management (Admin/Lab Tech) */}
      <Route path="/lab-catalog" element={
        <RoleRoute allowedRoles={['ADMIN', 'LAB_TECH']}><LabCatalog /></RoleRoute>
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
      
      <Route path="/medical-records" element={
        <RoleRoute allowedRoles={['DOCTOR']}><MedicalRecords /></RoleRoute>
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
