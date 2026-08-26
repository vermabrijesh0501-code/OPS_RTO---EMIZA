import { createClient, SupabaseClient, User as SupabaseAuthUser, Session } from '@supabase/supabase-js';
import { StorageService } from './storage';
import { User, UserRole } from '../types';
import { ROLE_DEFAULT_PERMISSIONS } from '../utils/rbac';

// Load Supabase URL and Anon Key from environment variables or saved storage configuration
const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();


const savedConfig = StorageService.getSupabaseConfig();
const configUrl = (savedConfig?.supabaseUrl || '').trim();
const configKey = (savedConfig?.supabaseAnonKey || '').trim();

export const SUPABASE_URL = envUrl || configUrl || '';
export const SUPABASE_ANON_KEY = envKey || configKey || '';

export const isSupabaseConfigured = (): boolean => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (
    SUPABASE_URL.includes('your-project.supabase.co') ||
    SUPABASE_URL.includes('xyzcompany') ||
    SUPABASE_URL.includes('placeholder') ||
    SUPABASE_ANON_KEY.includes('...') ||
    SUPABASE_ANON_KEY.includes('placeholder') ||
    SUPABASE_ANON_KEY.length < 30
  ) {
    return false;
  }
  return true;
};

// Create the singleton Supabase client
// If credentials are not yet configured in .env, we initialize a safe client so the app boots smoothly
const activeUrl = isSupabaseConfigured() ? SUPABASE_URL : 'https://placeholder-emiza.supabase.co';
const activeKey = isSupabaseConfigured() ? SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase: SupabaseClient = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Maps a Supabase Auth User + metadata to our application User model with role & permissions.
 */
export function mapSupabaseUserToAppUser(
  sbUser: SupabaseAuthUser | null,
  registeredUsers: User[]
): User | null {
  if (!sbUser) return null;

  const email = sbUser.email || '';
  const meta = sbUser.user_metadata || {};

  // Check if a registered user with this email already exists in User Master
  const existing = registeredUsers.find(
    u => u.email.toLowerCase() === email.toLowerCase() || u.id === sbUser.id
  );

  const role: UserRole = (meta.role as UserRole) || existing?.role || 'Supervisor';
  const name: string = meta.name || meta.full_name || existing?.name || email.split('@')[0] || 'EMIZA User';
  const department = meta.department || existing?.department || 'Operations Management';
  const empId = meta.empId || existing?.empId || `EMP-${sbUser.id.slice(0, 4).toUpperCase()}`;
  const assignedWarehouseIds = meta.assignedWarehouseIds || existing?.assignedWarehouseIds || ['wh-main'];
  const assignedClientIds = meta.assignedClientIds || existing?.assignedClientIds || [
    'cli-bellavita',
    'cli-nykaa',
    'cli-mama',
    'cli-boat',
    'cli-sugar',
  ];
  const permissions = meta.permissions || existing?.permissions || ROLE_DEFAULT_PERMISSIONS[role];

  return {
    id: sbUser.id || existing?.id || `usr-${Date.now()}`,
    empId,
    name,
    email,
    phone: meta.phone || existing?.phone || '',
    role,
    department,
    assignedWarehouseIds,
    assignedClientIds,
    permissions,
    status: 'Active',
    lastLoginAt: new Date().toISOString(),
  };
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: Session | null;
  error?: string;
}
