import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  Warehouse,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess?: (user: User) => void;
  users?: User[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, resetPassword: authResetPassword } = useAuth();

  // Mode: standard login or forgot password
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form State - Pre-fill with primary user email
  const [email, setEmail] = useState('brijesh.verma@emizainc.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect after successful auth
  const completeLogin = (user?: User) => {
    if (user && onLoginSuccess) {
      onLoginSuccess(user);
    }
    const origin = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(origin, { replace: true });
  };

  // Quick 1-click Account Selector
  const handleQuickSelect = (userEmail: string, userPass: string = 'password123') => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e?: React.FormEvent, directEmail?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailToUse = (directEmail || email).trim();
    const passToUse = directPass || password || 'password123';

    if (!emailToUse) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signIn(emailToUse, passToUse);
      if (res.success) {
        completeLogin();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authResetPassword(emailTrimmed);
      if (res.success) {
        setSuccessMessage(`Password recovery instructions verified for ${emailTrimmed}. Password set to "password123".`);
      } else {
        setErrorMessage(res.error || 'Unable to send recovery instructions.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0B131E] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#123B5D] selection:text-white transition-colors">
      {/* Centered Split Card */}
      <div className="w-full max-w-[960px] min-h-[560px] bg-white dark:bg-[#111D2C] rounded-[28px] sm:rounded-[36px] shadow-[0_20px_50px_rgba(18,59,93,0.12)] border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* ================================================================= */}
        {/* LEFT PANEL: Deep Warehouse/Navy Blue with Brand & Organic Curves */}
        {/* ================================================================= */}
        <div className="md:w-1/2 bg-[#123B5D] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[260px] md:min-h-full">
          {/* Abstract curved decorative shapes matching reference style */}
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#0D2E49] opacity-70 pointer-events-none" />
          <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-48 h-48 rounded-full bg-[#184C77] opacity-40 pointer-events-none hidden md:block" />
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#1A5484] opacity-50 pointer-events-none" />
          
          {/* Desktop connecting curved arc flowing into right panel */}
          <div 
            className="absolute top-0 bottom-0 -right-1 w-24 pointer-events-none hidden md:block"
            style={{
              background: 'radial-gradient(ellipse at 100% 50%, var(--bg-surface, #ffffff) 58%, transparent 59%)',
            }}
          />

          {/* Mobile bottom curve */}
          <div 
            className="absolute -bottom-1 left-0 right-0 h-10 pointer-events-none md:hidden"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, var(--bg-surface, #ffffff) 68%, transparent 70%)',
            }}
          />

          {/* Top: Logo & Brand Emblem */}
          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg shadow-[#0B253B]/30 mb-3 group transition-transform hover:scale-105">
              <Warehouse className="w-7 h-7 text-[#123B5D] dark:text-blue-400" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-blue-100/90 font-mono">
              EMIZA-WOP
            </span>
          </div>

          {/* Middle: Welcome Message */}
          <div className="relative z-10 my-6 md:my-auto text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
              Welcome Back!
            </h1>
            <p className="text-blue-100/85 text-xs sm:text-sm max-w-xs leading-relaxed mx-auto md:mx-0">
              Sign in to continue to your warehouse operations.
            </p>
          </div>

          {/* Bottom spacer for balance on desktop */}
          <div className="relative z-10 hidden md:flex items-center text-[11px] text-blue-200/60 font-medium">
            <span>Warehouse Operations Platform</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: Clean Form Area */}
        {/* ================================================================= */}
        <div className="md:w-1/2 bg-white dark:bg-[#111D2C] p-8 sm:p-12 lg:p-14 flex flex-col justify-center relative overflow-hidden">
          {/* Top-Right Decorative Blue Curve (Matching reference design) */}
          <div 
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#123B5D] dark:bg-blue-600 opacity-95 pointer-events-none hidden sm:block" 
          />
          <div 
            className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-[#184C77] dark:bg-blue-800 opacity-30 pointer-events-none hidden sm:block" 
          />

          <div className="max-w-sm w-full mx-auto relative z-10">
            {/* Header */}
            <div className="mb-7 text-center">
              <h2 className="text-3xl font-extrabold text-[#123B5D] dark:text-blue-400 tracking-tight lowercase first-letter:uppercase">
                {isForgotPassword ? 'Reset Password' : 'welcome'}
              </h2>
              <p className="text-slate-400 dark:text-slate-400 text-xs sm:text-sm mt-1.5 font-normal">
                {isForgotPassword
                  ? 'Enter your email to receive recovery instructions'
                  : 'Login in to your account to continue'}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* STANDARD LOGIN FORM */}
            {!isForgotPassword ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Quick Account Chips */}
                <div className="space-y-1.5 pb-1">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-center sm:text-left">
                    Select Account / Quick Fill:
                  </span>
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('brijesh.verma@emizainc.com', 'password123')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                        email === 'brijesh.verma@emizainc.com' || email === 'verma.brijesh0501@gmail.com'
                          ? 'bg-[#123B5D] dark:bg-blue-600 text-white border-[#123B5D] dark:border-blue-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      👑 Brijesh Verma (Super Admin)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('vikram.m@emiza.com', 'password123')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                        email === 'vikram.m@emiza.com'
                          ? 'bg-[#123B5D] dark:bg-blue-600 text-white border-[#123B5D] dark:border-blue-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      🏢 Vikram (Manager)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('rajesh.security@emiza.com', 'password123')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                        email === 'rajesh.security@emiza.com'
                          ? 'bg-[#123B5D] dark:bg-blue-600 text-white border-[#123B5D] dark:border-blue-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      🛡️ Security
                    </button>
                  </div>
                </div>

                {/* Email / Username Pill Input */}
                <div className="relative">
                  <input
                    id="login-email-input"
                    type="text"
                    required
                    placeholder="Email or Username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#EAF0F6] dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400/90 dark:placeholder-slate-500 text-xs sm:text-sm rounded-full px-5 py-3 sm:py-3.5 border border-transparent focus:border-[#123B5D]/40 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-inner/10"
                  />
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Password Pill Input with Show/Hide */}
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#EAF0F6] dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400/90 dark:placeholder-slate-500 text-xs sm:text-sm rounded-full pl-5 pr-11 py-3 sm:py-3.5 border border-transparent focus:border-[#123B5D]/40 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-inner/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-[#123B5D] dark:hover:text-blue-400 transition-colors font-medium cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                </div>

                {/* Compact Primary Pill Button: "LOG IN" */}
                <div className="pt-2 flex justify-center">
                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[160px] px-8 py-2.5 sm:py-3 rounded-full bg-[#123B5D] hover:bg-[#0D2E49] dark:bg-blue-600 dark:hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <span>LOG IN</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#EAF0F6] dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-full px-5 py-3 sm:py-3.5 border border-transparent focus:border-[#123B5D]/40 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="pt-2 flex flex-col items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full max-w-[200px] py-2.5 sm:py-3 rounded-full bg-[#123B5D] hover:bg-[#0D2E49] dark:bg-blue-600 dark:hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Recovery</span>
                    )}
                  </button>

                  {successMessage && (
                    <button
                      type="button"
                      onClick={() => handleLoginSubmit(undefined, email, 'password123')}
                      className="w-full max-w-[240px] py-2 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sign In Now with this Account
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#123B5D] dark:hover:text-blue-400 transition-colors cursor-pointer mt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Clean Footer Note */}
            <div className="mt-8 text-center">
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal">
                Need access?{' '}
                <span className="text-[#123B5D] dark:text-blue-400 font-semibold">
                  Contact your administrator.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
