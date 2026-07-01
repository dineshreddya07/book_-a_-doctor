import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AiAssistantPage from './pages/ai/AiAssistantPage';
import DoctorsPage from './pages/public/DoctorsPage';
import BookingPage from './pages/patient/BookingPage';
import NotFoundPage from './pages/public/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'doctor') return <Navigate to="/doctor" replace />;
  return <Navigate to="/patient" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="me" element={<RoleBasedRedirect />} />
        <Route
          path="patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="book/:doctorId"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ai"
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
              <AiAssistantPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
