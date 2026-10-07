import { Outlet, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { ToastContainer } from '../components/ui/Toast';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[200px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 mb-8">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center glow-brand transition-transform group-hover:scale-105">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-white tracking-tight">WorkFlowX AI</span>
        </Link>
        <p className="mt-2 text-xs font-mono uppercase tracking-widest text-gray-400">
          Autonomous Multi-Agent Workflow Intelligence
        </p>
      </div>

      {/* Auth Content Area */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <Outlet />
      </div>

      <ToastContainer />
    </div>
  );
}
