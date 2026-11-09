import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedRole = localStorage.getItem('user_role');

    if (storedToken) {
      setToken(storedToken);
      setUser({ role: storedRole });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { access_token, role, must_change_password } = response;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_role', role);

      setToken(access_token);
      setUser({ role, must_change_password });

      return { success: true, role };
    } catch (error) {
      const message = error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);