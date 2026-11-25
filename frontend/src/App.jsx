import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage'; 

import StudentLayout from './layouts/StudentLayout';
import StudentHomePage from './pages/student/StudentHomePage';
import SurveyListPage from './pages/student/SurveyListPage';
import SurveyDetailPage from './pages/student/SurveyDetailPage';
import StudentStatsPage from './pages/student/StudentStatsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentSupportPage from './pages/student/StudentSupportPage';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import TrainingDataPage from './pages/admin/TrainingDataPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import EnrollmentImportPage from './pages/admin/EnrollmentImportPage';
import SurveyCampaignPage from './pages/admin/SurveyCampaignPage';
import SurveyProgressPage from './pages/admin/SurveyProgressPage';
import SupportRequestPage from './pages/admin/SupportRequestPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Cổng đăng nhập cho SINH VIÊN */}
          <Route path="/login" element={<LoginPage />} />

          {/* Cổng đăng nhập riêng cho ADMIN */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Vùng bảo vệ cho ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/training-data" element={<TrainingDataPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/enrollment-import" element={<EnrollmentImportPage />} />
              <Route path="/admin/campaigns" element={<SurveyCampaignPage />} />
              <Route path="/admin/progress" element={<SurveyProgressPage />} />
              <Route path="/admin/support-requests" element={<SupportRequestPage />} />
            </Route>
          </Route>

          {/* Vùng bảo vệ cho SINH VIÊN */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<StudentLayout />}>
              <Route path="/student/home" element={<StudentHomePage />} />
              <Route path="/student/surveys" element={<SurveyListPage />} />
              <Route path="/student/surveys/:assignmentId" element={<SurveyDetailPage />} />
              <Route path="/student/stats" element={<StudentStatsPage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
              <Route path="/student/support" element={<StudentSupportPage />} />
            </Route>
          </Route>

          {/* Mặc định chuyển về /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;