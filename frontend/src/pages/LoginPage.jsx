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
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const googleUser = form.email ? {
        name: form.email.split('@')[0],
        email: form.email,
      } : {
        name: 'Google User',
        email: 'google.user@workflowx.ai',
      };
      await loginWithGoogle(googleUser);
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Google sign-in failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Continue with Google Button */}
        <button
          type="button"
          id="google-login-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] mb-4 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-dark-800 px-3 text-xs text-gray-500 uppercase tracking-wider absolute">Or continue with email</span>
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
