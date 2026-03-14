// File: frontend/src/App.jsx - COMPLETE & FIXED
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Invoices from './pages/Invoices';
import Lab from './pages/Lab';

// Placeholder Pages (للمسارات الخاصة بالأدوار)
const MyPatients = () => <div className="p-8 text-center text-gray-600">🚧 صفحة مرضاي - قيد التطوير</div>;
const MyAppointments = () => <div className="p-8 text-center text-gray-600">🚧 صفحة مواعيدي - قيد التطوير</div>;
const LabResults = () => <div className="p-8 text-center text-gray-600">🚧 صفحة النتائج - قيد التطوير</div>;
const MedicalRecords = () => <div className="p-8 text-center text-gray-600">🚧 صفحة السجلات - قيد التطوير</div>;
const LabTests = () => <div className="p-8 text-center text-gray-600">🚧 صفحة الفحوصات - قيد التطوير</div>;
const LabRequests = () => <div className="p-8 text-center text-gray-600">🚧 صفحة الطلبات - قيد التطوير</div>;
const LabReports = () => <div className="p-8 text-center text-gray-600">🚧 صفحة التقارير - قيد التطوير</div>;
const Patients = () => <div className="p-8 text-center text-gray-600">🚧 صفحة المرضى - قيد التطوير</div>;
const Doctors = () => <div className="p-8 text-center text-gray-600">🚧 صفحة الأطباء - قيد التطوير</div>;
const Reports = () => <div className="p-8 text-center text-gray-600">🚧 صفحة التقارير - قيد التطوير</div>;
const Settings = () => <div className="p-8 text-center text-gray-600">🚧 صفحة الإعدادات - قيد التطوير</div>;
const Confirmations = () => <div className="p-8 text-center text-gray-600">🚧 صفحة التأكيدات - قيد التطوير</div>;
const Print = () => <div className="p-8 text-center text-gray-600">🚧 صفحة الطباعة - قيد التطوير</div>;

// ✅ مكون حماية المسارات
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ✅ مكون حماية حسب الدور
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      {/* Shared Pages */}
      <Route path="/appointments" element={
        <ProtectedRoute><Appointments /></ProtectedRoute>
      } />
      <Route path="/invoices" element={
        <ProtectedRoute><Invoices /></ProtectedRoute>
      } />
      <Route path="/lab" element={
        <ProtectedRoute><Lab /></ProtectedRoute>
      } />

      {/* Doctor Routes */}
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

      {/* Lab Tech Routes */}
      <Route path="/lab-tests" element={
        <RoleRoute allowedRoles={['LAB_TECH']}><LabTests /></RoleRoute>
      } />
      <Route path="/lab-requests" element={
        <RoleRoute allowedRoles={['LAB_TECH', 'DOCTOR']}><LabRequests /></RoleRoute>
      } />
      <Route path="/lab-reports" element={
        <RoleRoute allowedRoles={['LAB_TECH']}><LabReports /></RoleRoute>
      } />

      {/* Admin/Reception Routes */}
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
      <Route path="/confirmations" element={
        <RoleRoute allowedRoles={['RECEPTIONIST']}><Confirmations /></RoleRoute>
      } />
      <Route path="/print" element={
        <RoleRoute allowedRoles={['RECEPTIONIST']}><Print /></RoleRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

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