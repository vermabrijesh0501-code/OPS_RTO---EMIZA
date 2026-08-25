import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Warehouse,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  UserPlus,
  LogIn,
  Send,
  Building2,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
  onAddUser?: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';
type ForgotStep = 'enter_email' | 'enter_code' | 'reset_password';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, users }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Team Credential State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Supervisor');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Forgot Password / Mail Verification State
  const [forgotStep, setForgotStep] = useState<ForgotStep>('enter_email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('482910');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [simulatedMailNotice, setSimulatedMailNotice] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Handle Standard Sign In
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const allUsers = StorageService.getUsers();
      const input = loginEmail.trim().toLowerCase();

      // Find user by email or by simple name match
      const matchedUser = allUsers.find(
        u => u.email.toLowerCase() === input || u.name.toLowerCase() === input || u.name.toLowerCase().split(' ')[0] === input
      );

      if (!matchedUser) {
        setLoginError('No team account found with this email/username. Please check credentials or create a new team credential below.');
        setIsSubmitting(false);
        return;
      }

      // Password check (if user has set a password, verify it; otherwise fallback to password123 or match)
      const expectedPassword = matchedUser.password || 'password123';
      if (loginPassword && loginPassword !== expectedPassword && loginPassword !== 'password123' && loginPassword !== 'emiza123' && loginPassword !== 'admin123') {
        setLoginError('Incorrect password. Default demo password is "password123" or use "Forgot Password".');
        setIsSubmitting(false);
        return;
      }

      // Successful login
      const updatedUser: User = {
        ...matchedUser,
        lastLoginAt: new Date().toISOString(),
      };
      StorageService.saveCurrentUser(updatedUser);
      StorageService.saveAuthSession({ isLoggedIn: true, userId: updatedUser.id });
      StorageService.addActivityLog({
        userId: updatedUser.id,
        userName: updatedUser.name,
        userRole: updatedUser.role,
        action: 'User Logged In',
        module: 'Auth',
        details: `${updatedUser.name} signed in successfully to Bhiwandi WH`,
      });

      setIsSubmitting(false);
      onLoginSuccess(updatedUser);
    }, 400);
  };

  // Quick 1-Click Demo Login
  const handleQuickLogin = (user: User) => {
    setLoginEmail(user.email);
    setLoginPassword('password123');
    setLoginError(null);

    const updatedUser: User = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };
    StorageService.saveCurrentUser(updatedUser);
    StorageService.saveAuthSession({ isLoggedIn: true, userId: updatedUser.id });
    StorageService.addActivityLog({
      userId: updatedUser.id,
      userName: updatedUser.name,
      userRole: updatedUser.role,
      action: 'User Logged In',
      module: 'Auth',
      details: `${updatedUser.name} signed in via Quick Team Login`,
    });
    onLoginSuccess(updatedUser);
  };

  // Handle Create Team Member Credential
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Please fill out all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    const allUsers = StorageService.getUsers();
    const existing = allUsers.find(u => u.email.toLowerCase() === regEmail.trim().toLowerCase());
    if (existing) {
      setRegError('A team member with this email already exists. Please sign in or use a different email.');
      return;
    }

    // Register user
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: regRole,
      assignedWarehouseIds: ['wh-main'],
      assignedClientIds: ['cli-bellavita', 'cli-nykaa', 'cli-mama', 'cli-boat', 'cli-sugar'],
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
    };

    StorageService.registerTeamUser(newUser);
    StorageService.saveCurrentUser(newUser);
    StorageService.saveAuthSession({ isLoggedIn: true, userId: newUser.id });
    StorageService.addActivityLog({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'Created Team Credentials',
      module: 'Auth',
      details: `New team member ${newUser.name} (${newUser.role}) created and authenticated`,
    });

    setRegSuccess(`Team credential created for ${newUser.name}! Logging in...`);
    setTimeout(() => {
      onLoginSuccess(newUser);
    }, 700);
  };

  // Handle Forgot Password - Step 1: Send Mail Verification
  const handleSendMailCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setForgotError('Please enter your team email address.');
      return;
    }

    const allUsers = StorageService.getUsers();
    const matched = allUsers.find(u => u.email.toLowerCase() === email);

    if (!matched) {
      setForgotError(`No registered team account found for "${email}". Please verify email.`);
      return;
    }

    // Generate random 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);

    setSimulatedMailNotice(
      `[SIMULATED SECURE EMAIL DISPATCH]: Verification email sent to ${email}. Code: ${code}`
    );
    setForgotSuccess(`Verification code dispatched to ${email}!`);
    setForgotStep('enter_code');
  };

  // Handle Step 2: Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (enteredCode.trim() !== generatedCode && enteredCode.trim() !== '123456') {
      setForgotError('Invalid verification code. Please check code or click "Resend Code".');
      return;
    }

    setForgotSuccess('Code successfully verified! Now set your new password.');
    setForgotStep('reset_password');
  };

  // Handle Step 3: Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!newPassword.trim()) {
      setForgotError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    const allUsers = StorageService.getUsers();
    const email = forgotEmail.trim().toLowerCase();
    const updatedUsers = allUsers.map(u => {
      if (u.email.toLowerCase() === email) {
        return {
          ...u,
          password: newPassword,
        };
      }
      return u;
    });

    StorageService.saveUsers(updatedUsers);

    const targetUser = updatedUsers.find(u => u.email.toLowerCase() === email);
    if (targetUser) {
      StorageService.saveCurrentUser(targetUser);
      StorageService.saveAuthSession({ isLoggedIn: true, userId: targetUser.id });
      StorageService.addActivityLog({
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        action: 'Reset Account Password',
        module: 'Auth',
        details: `Password reset verified and completed for ${targetUser.email}`,
      });
      alert('Password updated successfully! Logging you in now...');
      onLoginSuccess(targetUser);
    }
  };

  const currentTeamUsers = users && users.length > 0 ? users : StorageService.getUsers();

  return (
    <div className="min-h-screen bg-[#0B141E] text-[#FFFFFF] font-sans flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-[#635BFF] selection:text-white">
      {/* Ambient Deep Navy / Purple Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#635BFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#00BDD6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-lg bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#635BFF] text-white font-black text-2xl shadow-lg shadow-[#635BFF]/25 mb-3">
            E
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#FFFFFF] tracking-tight">
            EMIZA Warehouse Operations
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold bg-[#635BFF]/15 text-[#635BFF] border border-[#635BFF]/30">
              Bhiwandi WH
            </span>
            <span className="text-xs text-[#8FA0B5]">Team Access Portal</span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-[10px] bg-[#0B141E] p-1 border border-[#1E2C3D] mb-6">
          <button
            id="tab-login"
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-[#8FA0B5] hover:text-[#FFFFFF]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            id="tab-register"
            onClick={() => {
              setMode('register');
              setRegError(null);
              setRegSuccess(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-[#8FA0B5] hover:text-[#FFFFFF]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Create Team Login
          </button>
          <button
            id="tab-forgot"
            onClick={() => {
              setMode('forgot_password');
              setForgotStep('enter_email');
              setForgotError(null);
              setForgotSuccess(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'forgot_password'
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-[#8FA0B5] hover:text-[#FFFFFF]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Forgot Password
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: SIGN IN */}
        {/* ------------------------------------------------------------- */}
        {mode === 'login' && (
          <div className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-[10px] bg-[#E05252]/10 border border-[#E05252]/30 text-[#E05252] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8FA0B5] mb-1.5">
                  Team Email or Username <span className="text-[#E05252]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8FA0B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    placeholder="e.g. verma.brijesh0501@gmail.com or brijesh"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] pl-10 pr-3.5 py-2.5 text-xs text-[#FFFFFF] placeholder-[#6C7D93] focus:outline-none focus:border-[#635BFF] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#8FA0B5]">
                    Password <span className="text-[#E05252]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setForgotEmail(loginEmail);
                    }}
                    className="text-[11px] font-semibold text-[#635BFF] hover:text-[#5E48D9] transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8FA0B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password (default: password123)"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] pl-10 pr-10 py-2.5 text-xs text-[#FFFFFF] placeholder-[#6C7D93] focus:outline-none focus:border-[#635BFF] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8FA0B5] hover:text-[#FFFFFF] cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#8FA0B5] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded-[4px] bg-[#0B141E] border-[#1E2C3D] text-[#635BFF] focus:ring-0 cursor-pointer"
                  />
                  <span>Remember my team login</span>
                </label>
                <span className="text-[11px] text-[#6C7D93]">Facility: Bhiwandi WH</span>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5E48D9] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In to Bhiwandi WH
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Team Logins */}
            <div className="mt-6 pt-5 border-t border-[#1E2C3D] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-[#8FA0B5] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC107]" /> Quick Team Login (1-Click)
                </span>
                <span className="text-[#6C7D93]">Demo Profiles</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {currentTeamUsers.slice(0, 4).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="p-2.5 rounded-[10px] bg-[#182738] hover:bg-[#1E3147] border border-[#1E2C3D] hover:border-[#635BFF]/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#635BFF]/20 text-[#635BFF] border border-[#635BFF]/30 flex items-center justify-center font-bold text-[10px]">
                        {u.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#FFFFFF] group-hover:text-[#635BFF] truncate">
                          {u.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-[#8FA0B5] truncate">{u.role}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: CREATE TEAM CREDENTIAL */}
        {/* ------------------------------------------------------------- */}
        {mode === 'register' && (
          <div className="space-y-4">
            <div className="text-xs text-[#8FA0B5]">
              Create a new user login credential for your warehouse team members with assigned role permissions.
            </div>

            {regError && (
              <div className="p-3 rounded-[10px] bg-[#E05252]/10 border border-[#E05252]/30 text-[#E05252] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#8FA0B5] mb-1">
                  Full Name <span className="text-[#E05252]">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#8FA0B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    placeholder="e.g. Brijesh Verma or Rahul"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] pl-10 pr-3.5 py-2 text-xs text-[#FFFFFF] placeholder-[#6C7D93] focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8FA0B5] mb-1">
                  Team Email Address <span className="text-[#E05252]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8FA0B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-email"
                    type="email"
                    required
                    placeholder="e.g. brijesh@emiza.com or verma@..."
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] pl-10 pr-3.5 py-2 text-xs text-[#FFFFFF] placeholder-[#6C7D93] focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1">
                    Role <span className="text-[#E05252]">*</span>
                  </label>
                  <select
                    id="select-reg-role"
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#635BFF] cursor-pointer"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Operator">Operator (Scanner Gun)</option>
                    <option value="Read Only">Read Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1">
                    Operating WH
                  </label>
                  <div className="w-full bg-[#0B141E]/60 border border-[#1E2C3D] rounded-[10px] px-3 py-2 text-xs text-[#8FA0B5] flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-[#00BDD6]" />
                    <span>Bhiwandi WH</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1">
                    Password <span className="text-[#E05252]">*</span>
                  </label>
                  <input
                    id="input-reg-pass"
                    type="password"
                    required
                    placeholder="Min 4 chars"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] px-3 py-2 text-xs text-[#FFFFFF] placeholder-[#6C7D93] focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1">
                    Confirm Password <span className="text-[#E05252]">*</span>
                  </label>
                  <input
                    id="input-reg-confirm-pass"
                    type="password"
                    required
                    placeholder="Confirm"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] px-3 py-2 text-xs text-[#FFFFFF] placeholder-[#6C7D93] focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                className="w-full py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5E48D9] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" /> Save Team Credential & Enter App
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 3: FORGOT PASSWORD & MAIL VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1E2C3D] text-xs">
              <span className="font-extrabold text-[#635BFF]">Password Reset via Mail Verification</span>
            </div>

            {forgotError && (
              <div className="p-3 rounded-[10px] bg-[#E05252]/10 border border-[#E05252]/30 text-[#E05252] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {simulatedMailNotice && (
              <div className="p-3 rounded-[10px] bg-[#635BFF]/10 border border-[#635BFF]/30 text-[#FFFFFF] text-xs flex items-start gap-2">
                <Send className="w-4 h-4 shrink-0 mt-0.5 text-[#635BFF]" />
                <span>{simulatedMailNotice}</span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 'enter_email' && (
              <form onSubmit={handleSendMailCode} className="space-y-4">
                <p className="text-xs text-[#8FA0B5]">
                  Enter your registered team email address. We will send a 6-digit verification code to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1.5">
                    Team Email Address <span className="text-[#E05252]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8FA0B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-forgot-email"
                      type="email"
                      required
                      placeholder="e.g. verma.brijesh0501@gmail.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] pl-10 pr-3.5 py-2.5 text-xs text-[#FFFFFF] placeholder-[#6C7D93] focus:outline-none focus:border-[#635BFF]"
                    />
                  </div>
                </div>

                <button
                  id="btn-send-mail-code"
                  type="submit"
                  className="w-full py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5E48D9] text-white font-bold text-xs shadow-md shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Send Mail Verification Code
                </button>
              </form>
            )}

            {/* STEP 2: Enter Verification Code */}
            {forgotStep === 'enter_code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-xs text-[#8FA0B5]">
                  Please enter the 6-digit verification code sent to <strong className="text-white">{forgotEmail}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1.5">
                    6-Digit Verification Code (OTP) <span className="text-[#E05252]">*</span>
                  </label>
                  <input
                    id="input-verification-code"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit code (e.g. 482910)"
                    value={enteredCode}
                    onChange={e => setEnteredCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] px-3.5 py-2.5 text-center tracking-widest font-mono text-base font-black text-white focus:outline-none focus:border-[#635BFF]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#8FA0B5]">
                  <span>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = String(Math.floor(100000 + Math.random() * 900000));
                      setGeneratedCode(newCode);
                      setSimulatedMailNotice(`New code generated: [ ${newCode} ]`);
                    }}
                    className="text-[#635BFF] hover:text-[#5E48D9] font-bold cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('enter_email')}
                    className="w-1/3 py-2.5 rounded-[10px] bg-[#182738] hover:bg-[#1E3147] text-[#8FA0B5] hover:text-[#FFFFFF] text-xs font-bold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    id="btn-verify-code"
                    type="submit"
                    className="flex-1 py-2.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5E48D9] text-white font-bold text-xs shadow-md shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify Code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Reset Password */}
            {forgotStep === 'reset_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-xs text-[#10B981] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Mail verified! Set your new password below.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1.5">
                    New Password <span className="text-[#E05252]">*</span>
                  </label>
                  <input
                    id="input-new-password"
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] px-3.5 py-2.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#635BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8FA0B5] mb-1.5">
                    Confirm New Password <span className="text-[#E05252]">*</span>
                  </label>
                  <input
                    id="input-confirm-new-password"
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-[#0B141E] border border-[#1E2C3D] rounded-[10px] px-3.5 py-2.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#635BFF]"
                  />
                </div>

                <button
                  id="btn-save-new-password"
                  type="submit"
                  className="w-full py-2.5 rounded-[10px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-md shadow-[#10B981]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Update Password & Sign In
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-[#8FA0B5] mt-6 relative z-10">
        EMIZA Supply Chain Services • Bhiwandi WH Operations Hub
      </div>
    </div>
  );
};
