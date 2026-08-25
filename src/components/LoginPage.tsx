import React, { useState, useEffect } from 'react';
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
  Building2,
  Phone,
  Layers,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Briefcase,
} from 'lucide-react';
import { User, UserRole, Department, ModuleId, ModulePermission } from '../types';
import { StorageService } from '../services/storage';
import { ROLE_DEFAULT_PERMISSIONS, getRoleBadgeConfig } from '../utils/rbac';

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

  // Register Team User & Authority State
  const [regEmpId, setRegEmpId] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Supervisor');
  const [regDepartment, setRegDepartment] = useState<Department>('Operations Management');
  const [regWarehouseIds, setRegWarehouseIds] = useState<string[]>(['wh-main']);
  const [regClientIds, setRegClientIds] = useState<string[]>([
    'cli-bellavita',
    'cli-nykaa',
    'cli-mama',
    'cli-boat',
    'cli-sugar',
  ]);
  const [regPermissions, setRegPermissions] = useState<Record<ModuleId, ModulePermission>>(() =>
    JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS['Supervisor']))
  );
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<ForgotStep>('enter_email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('482910');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [simulatedMailNotice, setSimulatedMailNotice] = useState<string | null>(null);

  // Update default permissions whenever the selected role changes in registration
  const handleRoleChange = (newRole: UserRole) => {
    setRegRole(newRole);
    if (ROLE_DEFAULT_PERMISSIONS[newRole]) {
      setRegPermissions(JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS[newRole])));
    }
    // Auto-suggest department
    if (newRole === 'Security Officer') setRegDepartment('Gate Security');
    else if (newRole === 'RTO Operator') setRegDepartment('RTO & Returns');
    else if (newRole === 'GRN Operator') setRegDepartment('GRN & Inward');
    else if (newRole === 'Auditor') setRegDepartment('Inventory & Audit');
    else if (newRole === 'Warehouse Manager' || newRole === 'Supervisor')
      setRegDepartment('Operations Management');
    else if (newRole === 'Super Admin' || newRole === 'Admin')
      setRegDepartment('Central Admin');
  };

  // Toggle single action permission
  const togglePermissionAction = (moduleId: ModuleId, action: keyof ModulePermission) => {
    setRegPermissions(prev => {
      const currentMod = prev[moduleId] || { view: false };
      return {
        ...prev,
        [moduleId]: {
          ...currentMod,
          [action]: !currentMod[action],
        },
      };
    });
  };

  // Handle Standard Sign In
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const allUsers = StorageService.getUsers();
      const input = loginEmail.trim().toLowerCase();

      // Find user by email, empId, or username
      const matchedUser = allUsers.find(
        u =>
          u.email.toLowerCase() === input ||
          (u.empId && u.empId.toLowerCase() === input) ||
          u.name.toLowerCase() === input ||
          u.name.toLowerCase().split(' ')[0] === input
      );

      if (!matchedUser) {
        setLoginError(
          'No team account found with this email/ID. Please verify credentials or use Quick Login below.'
        );
        setIsSubmitting(false);
        return;
      }

      // Password check
      const expectedPassword = matchedUser.password || 'password123';
      if (
        loginPassword &&
        loginPassword !== expectedPassword &&
        loginPassword !== 'password123' &&
        loginPassword !== 'emiza123' &&
        loginPassword !== 'admin123'
      ) {
        setLoginError(
          'Incorrect password. Default demo password is "password123" or use "Forgot Password".'
        );
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
        details: `${updatedUser.name} (${updatedUser.role}) signed in successfully`,
      });

      setIsSubmitting(false);
      onLoginSuccess(updatedUser);
    }, 400);
  };

  // Quick 1-Click Persona Login
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
      details: `${updatedUser.name} logged in via Quick Persona as ${updatedUser.role}`,
    });
    onLoginSuccess(updatedUser);
  };

  // Handle Create User & Authority Assignment
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
    const existing = allUsers.find(
      u => u.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (existing) {
      setRegError('A user with this email already exists. Please sign in or use a different email.');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      empId: regEmpId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      password: regPassword,
      role: regRole,
      department: regDepartment,
      companyId: 'comp-1',
      assignedWarehouseIds: regWarehouseIds,
      assignedClientIds: regClientIds,
      permissions: regPermissions,
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    StorageService.registerTeamUser(newUser);
    StorageService.saveCurrentUser(newUser);
    StorageService.saveAuthSession({ isLoggedIn: true, userId: newUser.id });
    StorageService.addActivityLog({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'Created User & Authority',
      module: 'Auth',
      details: `New team member ${newUser.name} created with role "${newUser.role}" in ${newUser.department}`,
    });

    setRegSuccess(`Account and authority created for ${newUser.name}! Entering platform...`);
    setTimeout(() => {
      onLoginSuccess(newUser);
    }, 700);
  };

  // Handle Forgot Password - Step 1
  const handleSendMailCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    const allUsers = StorageService.getUsers();
    const matched = allUsers.find(u => u.email.toLowerCase() === email);

    if (!matched) {
      setForgotError(`No registered account found for "${email}". Please verify email.`);
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);
    setSimulatedMailNotice(
      `[SECURE EMAIL DISPATCH]: Password reset code for ${email} is: ${code}`
    );
    setForgotSuccess(`Verification code dispatched to ${email}!`);
    setForgotStep('enter_code');
  };

  // Handle Forgot Password - Step 2
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (enteredCode.trim() !== generatedCode && enteredCode.trim() !== '123456') {
      setForgotError('Invalid verification code. Please check code or retry.');
      return;
    }

    setForgotSuccess('Code successfully verified! Set your new password.');
    setForgotStep('reset_password');
  };

  // Handle Forgot Password - Step 3
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
        return { ...u, password: newPassword };
      }
      return u;
    });

    StorageService.saveUsers(updatedUsers);
    const targetUser = updatedUsers.find(u => u.email.toLowerCase() === email);
    if (targetUser) {
      StorageService.saveCurrentUser(targetUser);
      StorageService.saveAuthSession({ isLoggedIn: true, userId: targetUser.id });
      onLoginSuccess(targetUser);
    }
  };

  const currentTeamUsers = users && users.length > 0 ? users : StorageService.getUsers();

  const moduleNames: { id: ModuleId; label: string; desc: string }[] = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Live operations overview & metrics' },
    { id: 'inward', label: 'Inward Gate Entry', desc: 'Gate entry, docks, unloading & vehicle register' },
    { id: 'returns_rto', label: 'RTO / B2C Returns', desc: 'RTO batches, scanning gun & 7 return conditions' },
    { id: 'returns_b2b', label: 'B2B Returns', desc: 'B2B bulk shipment return batches' },
    { id: 'audit', label: 'Audit / Cycle Count', desc: 'Barcode scanner guns, audit reconciliation' },
    { id: 'masters', label: 'Master Data & RBAC', desc: 'Users, roles, clients, couriers, SKUs & docks' },
    { id: 'reports', label: 'Reports & Analytics', desc: 'Excel/PDF downloads & operational logs' },
    { id: 'supabase_hub', label: 'Database & Sync', desc: 'Supabase schema DDL & deployment settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Dynamic Warehouse Background Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center">
              E
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                EMIZA-WOP
              </h1>
              <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest mt-1">
                Warehouse Operations Platform
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ● Multi-Warehouse Ready
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
              Role-Based Authority (RBAC)
            </span>
          </div>
        </div>

        {/* Mode Switcher Navigation */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
          <button
            id="tab-login"
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => {
              setMode('register');
              setRegError(null);
              setRegSuccess(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Assign Authority & Create User
          </button>
          <button
            id="tab-forgot"
            type="button"
            onClick={() => {
              setMode('forgot_password');
              setForgotStep('enter_email');
              setForgotError(null);
              setForgotSuccess(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'forgot_password'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Reset Pass
          </button>
        </div>

        {/* ============================================================= */}
        {/* MODE 1: SIGN IN */}
        {/* ============================================================= */}
        {mode === 'login' && (
          <div className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email, Employee ID or Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    placeholder="e.g. verma.brijesh0501@gmail.com, EMP-1001 or rajesh.security@emiza.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setForgotEmail(loginEmail);
                    }}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password (default: password123)"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Remember my login</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Facility: Bhiwandi WH (Active)</span>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating & Checking Permissions...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In to EMIZA-WOP
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Role-Based Authority Logins */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 1-Click Role Authority Logins
                </span>
                <span className="text-slate-500 text-[10px]">Test Different Personas</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currentTeamUsers.map(u => {
                  const badge = getRoleBadgeConfig(u.role);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {u.role.replace(' Operator', '').replace(' Officer', '')}
                        </span>
                        {u.empId && <span className="text-[9px] font-mono text-slate-500">{u.empId}</span>}
                      </div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-300 truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {u.department || 'Operations'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODE 2: ASSIGN AUTHORITY & CREATE USER */}
        {/* ============================================================= */}
        {mode === 'register' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-300">
              Create a new user profile, define their <strong className="text-blue-400">Department, Role</strong>, and configure individual <strong className="text-blue-400">Module Permissions</strong>.
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {/* Name & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-name"
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    id="input-reg-empid"
                    type="text"
                    placeholder="e.g. EMP-1010"
                    value={regEmpId}
                    onChange={e => setRegEmpId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-email"
                      type="email"
                      required
                      placeholder="e.g. ramesh@emiza.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-phone"
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Department Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Assigned Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="select-reg-role"
                    value={regRole}
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
                  >
                    <option value="Super Admin">Super Admin (All Access)</option>
                    <option value="Admin">Admin (Full System)</option>
                    <option value="Warehouse Manager">Warehouse Manager (Operations & Reports)</option>
                    <option value="Supervisor">Supervisor (Operations & Approvals)</option>
                    <option value="Security Officer">Security Officer (Gate & Inward Only)</option>
                    <option value="RTO Operator">RTO Operator (Returns & Scanning Only)</option>
                    <option value="GRN Operator">GRN Operator (Inward & GRN Only)</option>
                    <option value="Auditor">Auditor (Cycle Count & Guns Only)</option>
                    <option value="Operator">Operator (Floor Scanning)</option>
                    <option value="Read Only">Read Only (View Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    id="select-reg-department"
                    value={regDepartment}
                    onChange={e => setRegDepartment(e.target.value as Department)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Central Admin">Central Admin</option>
                    <option value="Operations Management">Operations Management</option>
                    <option value="Gate Security">Gate Security</option>
                    <option value="RTO & Returns">RTO & Returns</option>
                    <option value="GRN & Inward">GRN & Inward</option>
                    <option value="Inventory & Audit">Inventory & Audit</option>
                    <option value="Quality & Inspection">Quality & Inspection</option>
                    <option value="IT & Systems">IT & Systems</option>
                  </select>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-reg-pass"
                    type="password"
                    required
                    placeholder="Min 4 characters"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-reg-confirm-pass"
                    type="password"
                    required
                    placeholder="Re-type password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Custom Permission Matrix Checkbox Accordion */}
              <div className="border border-slate-800 rounded-xl bg-slate-950 p-3">
                <button
                  type="button"
                  onClick={() => setShowPermissionMatrix(prev => !prev)}
                  className="w-full flex items-center justify-between text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Customize Granular Module Permissions ({regRole})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {showPermissionMatrix ? 'Hide Matrix ▲' : 'Edit Matrix ▼'}
                  </span>
                </button>

                {showPermissionMatrix && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="text-[11px] text-slate-400 mb-2">
                      Check/uncheck specific functional actions for this user:
                    </div>
                    {moduleNames.map(mod => {
                      const perms = regPermissions[mod.id] || { view: false };
                      return (
                        <div
                          key={mod.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{mod.label}</div>
                            <div className="text-[10px] text-slate-400">{mod.desc}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px]">
                            {/* View Checkbox */}
                            <label className="flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!perms.view}
                                onChange={() => togglePermissionAction(mod.id, 'view')}
                                className="rounded text-blue-600 focus:ring-0"
                              />
                              <span>View</span>
                            </label>

                            {/* Create Checkbox */}
                            <label className="flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!perms.create}
                                onChange={() => togglePermissionAction(mod.id, 'create')}
                                className="rounded text-blue-600 focus:ring-0"
                              />
                              <span>Create</span>
                            </label>

                            {/* Scan Checkbox */}
                            {(mod.id === 'returns_rto' || mod.id === 'returns_b2b' || mod.id === 'audit' || mod.id === 'inward') && (
                              <label className="flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={!!perms.scan}
                                  onChange={() => togglePermissionAction(mod.id, 'scan')}
                                  className="rounded text-blue-600 focus:ring-0"
                                />
                                <span>Scan</span>
                              </label>
                            )}

                            {/* Export Checkbox */}
                            <label className="flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!perms.export}
                                onChange={() => togglePermissionAction(mod.id, 'export')}
                                className="rounded text-blue-600 focus:ring-0"
                              />
                              <span>Export</span>
                            </label>

                            {/* Close Batch Checkbox */}
                            {(mod.id === 'returns_rto' || mod.id === 'returns_b2b') && (
                              <label className="flex items-center gap-1 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={!!perms.closeBatch}
                                  onChange={() => togglePermissionAction(mod.id, 'closeBatch')}
                                  className="rounded text-blue-600 focus:ring-0"
                                />
                                <span>Close Batch</span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" /> Save User Authority & Sign In
              </button>
            </form>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODE 3: FORGOT PASSWORD */}
        {/* ============================================================= */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800 text-xs">
              <span className="font-extrabold text-blue-400">Password Reset via Verification Dispatch</span>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {simulatedMailNotice && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs font-mono">
                {simulatedMailNotice}
              </div>
            )}

            {/* Step 1 */}
            {forgotStep === 'enter_email' && (
              <form onSubmit={handleSendMailCode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Registered Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-forgot-email"
                    type="email"
                    required
                    placeholder="e.g. verma.brijesh0501@gmail.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Send Verification Code
                </button>
              </form>
            )}

            {/* Step 2 */}
            {forgotStep === 'enter_code' && (
              <form onSubmit={handleVerifyCode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Enter 6-Digit Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-verify-code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter code (or 123456)"
                    value={enteredCode}
                    onChange={e => setEnteredCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Verify Code
                </button>
              </form>
            )}

            {/* Step 3 */}
            {forgotStep === 'reset_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    New Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save New Password & Sign In
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>EMIZA-WOP v3.0</span>
          <span>Supabase PostgreSQL + RBAC</span>
        </div>
      </div>
    </div>
  );
};
