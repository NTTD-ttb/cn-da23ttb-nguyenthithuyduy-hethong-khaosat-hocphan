import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage'; 

const AdminDashboard = () => {
  const { logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">Trang Dashboard Quản Trị (Admin)</h1>
      <p className="mt-2 text-slate-600">Đăng nhập Admin thành công!</p>
      <button onClick={logout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer">
        Đăng xuất
      </button>
    </div>
  );
};

const StudentHome = () => {
  const { logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-blue-600">Trang Chủ Sinh Viên</h1>
      <p className="mt-2 text-slate-600">Đăng nhập Sinh viên thành công!</p>
      <button onClick={logout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer">
        Đăng xuất
      </button>
    </div>
  );
};

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
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Vùng bảo vệ cho SINH VIÊN */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/home" element={<StudentHome />} />
          </Route>

          {/* Mặc định chuyển về /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;