import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/index.jsx';
import { Zap, Eye, EyeOff, Mail, Lock, User, X } from 'lucide-react';

const formatEmailToName = (email) => {
  if (!email || !email.includes('@')) return 'User';
  const username = email.split('@')[0].trim();
  const parts = username.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
  if (!parts.length) return 'User';
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Google sign-in modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleForm, setGoogleForm] = useState({ name: '', email: '' });

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignInClick = () => {
    setError('');
    if (form.email && form.email.trim()) {
      // If user has already entered their email, use it directly with clean formatting
      const cleanEmail = form.email.trim();
      const derivedName = formatEmailToName(cleanEmail);
      submitGoogleAuth(derivedName, cleanEmail);
    } else {
      // Show Google Account details dialog
      setGoogleForm({ name: '', email: '' });
      setShowGoogleModal(true);
    }
  };

  const submitGoogleAuth = async (name, email) => {
    setLoading(true);
    setError('');
    try {
      const googlePayload = {
        name: name.trim() || formatEmailToName(email),
        email: email.trim().toLowerCase(),
        user_metadata: {
          full_name: name.trim() || formatEmailToName(email),
          name: name.trim() || formatEmailToName(email),
          display_name: name.trim() || formatEmailToName(email),
          email: email.trim().toLowerCase(),
        },
      };
      await loginWithGoogle(googlePayload);
      toast.success(`Signed in as ${googlePayload.name}!`);
      setShowGoogleModal(false);
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Google sign-in failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleModalSubmit = (e) => {
    e.preventDefault();
    if (!googleForm.email.trim()) {
      setError('Google email is required');
      return;
    }
    submitGoogleAuth(googleForm.name || formatEmailToName(googleForm.email), googleForm.email);
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

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setError('');
    setLoading(true);
    setForm({ email: demoEmail, password: demoPassword });
    try {
      await login(demoEmail, demoPassword);
      toast.success('Signed in with Demo session!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Invalid credentials';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-600/10 rounded-full blur-3xl" />
      
      <div className="glass-card w-full max-w-md p-8 relative animate-fade-in z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center glow-brand">
              <Zap size={20} className="text-white" />
            </div>
          </Link>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to WorkFlowX AI</p>
        </div>

        {/* 1-Click Demo Quick Access */}
        <div className="mb-4 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-300 flex items-center gap-1.5">
              <Zap size={14} className="text-brand-400" /> Demo Quick Access
            </span>
            <span className="text-[10px] text-gray-400">1-click instant login</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="demo-admin-login-btn"
              disabled={loading}
              onClick={() => handleDemoLogin('demo@workflowx.ai', 'password123')}
              className="py-2 px-2.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-white text-xs font-medium text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <div className="font-semibold text-brand-200">Demo Admin</div>
              <div className="text-[10px] text-gray-400 truncate">demo@workflowx.ai</div>
            </button>
            <button
              type="button"
              id="demo-user-login-btn"
              disabled={loading}
              onClick={() => handleDemoLogin('bhargavambati09@gmail.com', 'password123')}
              className="py-2 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <div className="font-semibold text-purple-300">Test Account</div>
              <div className="text-[10px] text-gray-400 truncate">bhargavambati09@...</div>
            </button>
          </div>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          id="google-login-btn"
          onClick={handleGoogleSignInClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] mb-4 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-dark-800 px-3 text-xs text-gray-500 uppercase tracking-wider absolute">Or sign in with email</span>
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
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium space-y-1">
              <div>{error}</div>
              <div className="text-[11px] text-gray-400">
                Hint: Use the <strong>Demo Quick Access</strong> buttons above, or password: <span className="font-mono text-brand-300">password123</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 cursor-pointer">
            {loading ? <Spinner size={18} /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign up
          </Link>
        </p>
      </div>

      {/* Google Account Confirmation Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 relative border border-white/10 rounded-2xl shadow-2xl">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Google Account Sign-In</h3>
              <p className="text-xs text-gray-400 mt-1">Enter your Google account details to authenticate</p>
            </div>

            <form onSubmit={handleGoogleModalSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Account Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Divya Gunda"
                    value={googleForm.name}
                    onChange={(e) => setGoogleForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field pl-9 text-xs py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Google Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. divya.gunda@gmail.com"
                    value={googleForm.email}
                    onChange={(e) => setGoogleForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="input-field pl-9 text-xs py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn-ghost w-1/2 py-2 text-xs text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-1/2 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  {loading ? <Spinner size={14} /> : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
