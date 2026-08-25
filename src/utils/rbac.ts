import { User, UserRole, ModuleId, ModulePermission } from '../types';

// Default permissions for every system role
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Record<ModuleId, ModulePermission>> = {
  'Super Admin': {
    dashboard: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    inward: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    returns_rto: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    returns_b2b: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    audit: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    masters: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    reports: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    supabase_hub: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
  },
  'Admin': {
    dashboard: { view: true, create: true, edit: true, delete: true, scan: true, export: true, approve: true, closeBatch: true },
    inward: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    returns_rto: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    returns_b2b: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    audit: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    masters: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    reports: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    supabase_hub: { view: true, create: false, edit: false, delete: false, scan: false, export: true, approve: false, closeBatch: false },
  },
  'Warehouse Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: true, approve: true, closeBatch: false },
    inward: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    returns_rto: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    returns_b2b: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    audit: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    masters: { view: true, create: false, edit: true, delete: false, scan: false, export: true, approve: true, closeBatch: false },
    reports: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
  'Supervisor': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    inward: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: false },
    returns_rto: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    returns_b2b: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: true },
    audit: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: false },
    masters: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    reports: { view: true, create: false, edit: false, delete: false, scan: false, export: true, approve: false, closeBatch: false },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
  'Security Officer': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    inward: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: false, closeBatch: false },
    returns_rto: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_b2b: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    audit: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    masters: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    reports: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
  'RTO Operator': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    inward: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_rto: { view: true, create: true, edit: false, delete: false, scan: true, export: true, approve: false, closeBatch: true },
    returns_b2b: { view: true, create: true, edit: false, delete: false, scan: true, export: true, approve: false, closeBatch: true },
    audit: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    masters: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    reports: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
  'GRN Operator': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    inward: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: false, closeBatch: false },
    returns_rto: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_b2b: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    audit: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    masters: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    reports: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
  'Auditor': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    inward: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_rto: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_b2b: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    audit: { view: true, create: true, edit: true, delete: false, scan: true, export: true, approve: true, closeBatch: false },
    masters: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    reports: { view: true, create: false, edit: false, delete: false, scan: false, export: true, approve: false, closeBatch: false },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
  'Operator': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    inward: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_rto: { view: true, create: true, edit: false, delete: false, scan: true, export: false, approve: false, closeBatch: true },
    returns_b2b: { view: true, create: true, edit: false, delete: false, scan: true, export: false, approve: false, closeBatch: true },
    audit: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    masters: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    reports: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
  'Read Only': {
    dashboard: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    inward: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_rto: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    returns_b2b: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    audit: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    masters: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    reports: { view: true, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
    supabase_hub: { view: false, create: false, edit: false, delete: false, scan: false, export: false, approve: false, closeBatch: false },
  },
};

// Check if user has permission for a specific module and action
export const hasModulePermission = (
  user: User | null | undefined,
  moduleId: ModuleId,
  action: keyof ModulePermission = 'view'
): boolean => {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;

  // Check custom user permissions if configured
  if (user.permissions && user.permissions[moduleId]) {
    const perm = user.permissions[moduleId];
    if (perm) {
      if (action === 'view') return !!perm.view;
      return !!perm[action];
    }
  }

  // Fallback to role default permissions
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role];
  if (roleDefaults && roleDefaults[moduleId]) {
    const rolePerm = roleDefaults[moduleId];
    if (action === 'view') return !!rolePerm.view;
    return !!rolePerm[action];
  }

  return false;
};

// Get all accessible module IDs for a user
export const getAccessibleModules = (user: User | null | undefined): ModuleId[] => {
  const allModules: ModuleId[] = [
    'dashboard',
    'inward',
    'returns_rto',
    'returns_b2b',
    'audit',
    'masters',
    'reports',
    'supabase_hub',
  ];

  if (!user) return ['dashboard'];
  if (user.role === 'Super Admin') return allModules;

  return allModules.filter(mod => hasModulePermission(user, mod, 'view'));
};

// Get Role Color Badge classes
export const getRoleBadgeConfig = (role: UserRole): { bg: string; text: string; border: string; label: string } => {
  switch (role) {
    case 'Super Admin':
      return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40', label: 'Super Admin' };
    case 'Admin':
      return { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/40', label: 'Admin' };
    case 'Warehouse Manager':
      return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40', label: 'Warehouse Manager' };
    case 'Supervisor':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40', label: 'Supervisor' };
    case 'Security Officer':
      return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', label: 'Security Officer' };
    case 'RTO Operator':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', label: 'RTO Operator' };
    case 'GRN Operator':
      return { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/40', label: 'GRN Operator' };
    case 'Auditor':
      return { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', border: 'border-fuchsia-500/40', label: 'Auditor' };
    case 'Operator':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', label: 'Operator' };
    case 'Read Only':
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40', label: 'Read Only' };
  }
};
