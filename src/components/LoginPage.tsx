import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Warehouse, Eye, EyeOff, AlertCircle, RefreshCw, Shield, Sparkles, UserCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('verma.brijesh0501@gmail.com');
  const [password, setPassword] = useState('admin123');
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

    if (!email.trim()) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signIn(email.trim(), password || 'admin123');
      if (res.success) {
        completeLogin();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await signIn(demoEmail, 'admin123');
      if (res.success) {
        completeLogin();
      } else {
        setErrorMessage(res.error || 'Quick login failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 font-sans text-primary relative theme-transition">
      <div className="w-full max-w-[1000px] min-h-[580px] bg-card rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-theme overflow-hidden flex flex-col md:flex-row theme-transition">
        {/* Left Panel */}
        <div className="md:w-5/12 bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#EC4899] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none blur-xl" />
          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#8B5CF6] flex items-center justify-center shadow-lg mb-3">
              <Warehouse className="w-7 h-7 text-[#8B5CF6]" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-purple-100 font-mono">WMS-WOP</span>
            <span className="text-[11px] text-purple-200 font-semibold mt-0.5">Warehouse Operations Platform</span>
          </div>

          <div className="relative z-10 my-6 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">Welcome Back!</h1>
            <p className="text-purple-100/90 text-xs leading-relaxed max-w-xs mx-auto md:mx-0">
              Enterprise Inward Gate Management, RTO Returns QC Scanning, Cycle Audits & Live Dispatch.
            </p>

            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 text-[11px] text-purple-100">
                <Shield className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>RBAC Protected Multi-Role Security</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-purple-100 mt-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{isConfigured ? 'Supabase Cloud Sync Active' : 'Offline & Local Engine Ready'}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-purple-200/80 font-medium flex items-center justify-between">
            <span>v3.4 Production</span>
            <span className="font-mono text-[10px] text-purple-200">Bhiwandi Hub 01</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="md:w-7/12 bg-card text-[#1E293B] dark:text-[#F8FAFC] p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] dark:text-[#F8FAFC] tracking-tight">Sign In</h2>
              <p className="text-secondary text-xs mt-1">Enter your credentials or click any demo persona below</p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2.5 animate-in fade-in-50">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Email address (e.g. verma.brijesh0501@gmail.com)"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F8FAFC] dark:bg-[#152238] border border-theme text-xs sm:text-sm rounded-full px-5 py-3 pr-11 shadow-xs focus:border-[#8B5CF6] focus:outline-none"
                />
                <Mail className="w-4 h-4 text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F8FAFC] dark:bg-[#152238] border border-theme text-xs sm:text-sm rounded-full pl-5 pr-11 py-3 shadow-xs focus:border-[#8B5CF6] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Log In to Operations</span>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Login Personas */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-blue-500" />
                  1-Click Quick Access Personas
                </span>
                <span className="text-[10px] text-slate-400">Click to enter</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('verma.brijesh0501@gmail.com')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-blue-900 dark:text-blue-200 group-hover:text-blue-700 truncate">
                    👑 Super Admin
                  </div>
                  <div className="text-[9px] text-blue-600/70 dark:text-blue-300/70 truncate">Brijesh Verma</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('vikram.m@emiza.com')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-700 truncate">
                    🏢 WH Manager
                  </div>
                  <div className="text-[9px] text-emerald-600/70 dark:text-emerald-300/70 truncate">Vikram Mehta</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('pooja.d@emiza.com')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-purple-900 dark:text-purple-200 group-hover:text-purple-700 truncate">
                    📋 Supervisor
                  </div>
                  <div className="text-[9px] text-purple-600/70 dark:text-purple-300/70 truncate">Pooja Deshmukh</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('amit.p@emiza.com')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 group-hover:text-amber-700 truncate">
                    📦 RTO Operator
                  </div>
                  <div className="text-[9px] text-amber-600/70 dark:text-amber-300/70 truncate">Amit Patel</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('neha.s@emiza.com')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-800/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-cyan-900 dark:text-cyan-200 group-hover:text-cyan-700 truncate">
                    🔍 Auditor
                  </div>
                  <div className="text-[9px] text-cyan-600/70 dark:text-cyan-300/70 truncate">Neha Sharma</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('rajesh.security@emiza.com')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-700 truncate">
                    🛡️ Security Officer
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">Rajesh Singh</div>
                </button>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-[11px] text-slate-400">
                Authorized Personnel Only • EMIZA Supply Chain Services
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
