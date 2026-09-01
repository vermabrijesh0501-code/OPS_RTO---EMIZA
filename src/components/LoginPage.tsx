import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Warehouse, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const completeLogin = () => {
    const origin = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(origin, { replace: true });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured. Please check Settings or contact IT.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signIn(email.trim(), password);
      if (res.success) {
        completeLogin();
      } else {
        setErrorMessage(res.error || 'Authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0B131E] flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-[960px] min-h-[560px] bg-white dark:bg-[#111D2C] rounded-[28px] shadow-[0_20px_50px_rgba(18,59,93,0.12)] border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel */}
        <div className="md:w-1/2 bg-[#123B5D] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#0D2E49] opacity-70 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mb-3">
              <Warehouse className="w-7 h-7 text-[#123B5D]" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-blue-100/90 font-mono">EMIZA-WOP</span>
          </div>
          <div className="relative z-10 my-6 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Welcome Back!</h1>
            <p className="text-blue-100/85 text-sm max-w-xs mx-auto md:mx-0">
              Sign in to continue to warehouse operations.
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-blue-200/60 font-medium">
            Warehouse Operations Platform
          </div>
        </div>

        {/* Right Panel */}
        <div className="md:w-1/2 bg-white dark:bg-[#111D2C] p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-7 text-center">
              <h2 className="text-3xl font-extrabold text-[#123B5D] dark:text-blue-400 tracking-tight">Sign In</h2>
              <p className="text-slate-400 text-xs mt-1.5">Enter your credentials to access the system</p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#EAF0F6] dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm rounded-full px-5 py-3.5 border border-transparent focus:border-[#123B5D]/40 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#EAF0F6] dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm rounded-full pl-5 pr-11 py-3.5 border border-transparent focus:border-[#123B5D]/40 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[160px] px-8 py-3 rounded-full bg-[#123B5D] hover:bg-[#0D2E49] text-white text-sm font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500">
                Need access?{' '}
                <span className="text-[#123B5D] dark:text-blue-400 font-semibold">Contact your administrator.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
