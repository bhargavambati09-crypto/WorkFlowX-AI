import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { ToastContainer } from '../components/ui/Toast';
import { Spinner } from '../components/ui/index.jsx';

const AppLayout = () => {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size={40} className="mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading WorkFlowX AI...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'} min-h-screen`}>
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
export { AppLayout };
