import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/index.jsx';
import { Zap, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-600/10 rounded-full blur-3xl" />
      
      <div className="glass-card w-full max-w-md p-8 relative animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center glow-brand">
              <Zap size={20} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to WorkFlowX AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input id="email" type="email" required autoComplete="email"
                className="input-field pl-10"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input id="password" type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <button type="submit" id="login-btn" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
            {loading ? <><Spinner size={16} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Demo Login */}
        <div className="mt-4">
          <button
            type="button"
            id="demo-login-btn"
            disabled={loading}
            onClick={async () => {
              setForm({ email: 'demo@workflowx.ai', password: 'password123' });
              setError('');
              setLoading(true);
              try {
                await login('demo@workflowx.ai', 'password123');
                toast.success('Signed in as Demo Administrator!');
                navigate('/dashboard');
              } catch (err) {
                const msg = err?.response?.data?.error || 'Failed to sign in as demo user';
                setError(msg);
              } finally {
                setLoading(false);
              }
            }}
            className="btn-secondary w-full justify-center py-2.5 text-xs border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20"
          >
            <Zap size={14} className="text-brand-400" />
            1-Click Demo Login (demo@workflowx.ai)
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 p-3 bg-brand-500/5 border border-brand-500/15 rounded-xl text-xs text-gray-500 text-center">
          💡 Evaluator tip: Use <strong className="text-gray-300">1-Click Demo Login</strong> or credentials <span className="font-mono text-brand-400">demo@workflowx.ai</span> / <span className="font-mono text-brand-400">password123</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
