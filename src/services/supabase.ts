import { createClient, SupabaseClient, User as SupabaseAuthUser, Session } from '@supabase/supabase-js';
import { User, UserRole } from '../types';
import { ROLE_DEFAULT_PERMISSIONS } from '../utils/rbac';

const envUrl = String((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const envKey = String((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

export const SUPABASE_URL = envUrl;
export const SUPABASE_ANON_KEY = envKey;

export const isSupabaseConfigured = (): boolean => Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  /^https:\/\/[^/]+\.supabase\.co$/.test(SUPABASE_URL) &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('placeholder') &&
  !SUPABASE_ANON_KEY.includes('your-supabase')
);

if (!isSupabaseConfigured()) {
  console.warn('[EMIZA-WOP] Missing/invalid Supabase environment variables. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before deployment.');
}

// Never store the service-role key in the browser. The anon/publishable key is intended for client use with RLS.
const activeUrl = isSupabaseConfigured() ? SUPABASE_URL : 'https://placeholder-emiza.supabase.co';
const activeKey = isSupabaseConfigured() ? SUPABASE_ANON_KEY : 'placeholder';

export const supabase: SupabaseClient = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export function mapSupabaseUserToAppUser(sbUser: SupabaseAuthUser | null, registeredUsers: User[]): User | null {
  if (!sbUser) return null;
  const email = sbUser.email || '';
  const meta = sbUser.user_metadata || {};
  const existing = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() || u.id === sbUser.id);
  const role: UserRole = (meta.role as UserRole) || existing?.role || 'Operator';
  const name = meta.name || meta.full_name || existing?.name || email.split('@')[0] || 'EMIZA User';
  const department = meta.department || existing?.department || 'Operations Management';
  const empId = meta.empId || existing?.empId || `EMP-${sbUser.id.slice(0, 4).toUpperCase()}`;
  const assignedWarehouseIds = meta.assignedWarehouseIds || existing?.assignedWarehouseIds || ['wh-main'];
  const assignedClientIds = meta.assignedClientIds || existing?.assignedClientIds || [];
  const permissions = meta.permissions || existing?.permissions || ROLE_DEFAULT_PERMISSIONS[role];
  return {
    id: sbUser.id || existing?.id || `usr-${Date.now()}`,
    empId, name, email,
    phone: meta.phone || existing?.phone || '', role, department,
    assignedWarehouseIds, assignedClientIds, permissions,
    status: 'Active', lastLoginAt: new Date().toISOString(),
  };
}

export interface AuthResponse { success: boolean; user?: User; session?: Session | null; error?: string; }
