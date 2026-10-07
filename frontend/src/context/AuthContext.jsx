import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_) {}
      // Verify token is still valid with backend /api/auth/me
      authAPI.me().then(res => {
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: loggedInUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token, user: registeredUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    return registeredUser;
  };

  const loginWithGoogle = async (googleData) => {
    const res = await authAPI.googleAuth(googleData);
    const { token, user: googleUser } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(googleUser));
    setUser(googleUser);
    return googleUser;
  };

  const updateProfile = async (name) => {
    const res = await authAPI.updateProfile({ name });
    const updated = res.data.user;
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, updateProfile, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
