import { createClient, SupabaseClient, User as SupabaseAuthUser, Session } from '@supabase/supabase-js';
import { User, UserRole } from '../types';
import { ROLE_DEFAULT_PERMISSIONS } from '../utils/rbac';

// Load Supabase URL and Anon Key from environment variables or saved storage configuration
const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

const getSavedConfig = (): { supabaseUrl?: string; supabaseAnonKey?: string } | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem('emiza_supabase_config_v3');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const savedConfig = getSavedConfig();
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

// Lazy Supabase client singleton — avoids console errors when unconfigured
let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return clientInstance;
};

// Export proxy for backwards compatibility
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const sb = getSupabase();
    if (!sb) {
      // Return a safe fallback function or object if accessed before configured
      return () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Supabase is not configured') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase is not configured') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase is not configured') }),
        upsert: () => Promise.resolve({ data: null, error: new Error('Supabase is not configured') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase is not configured') }),
        eq: () => Promise.resolve({ data: null, error: new Error('Supabase is not configured') }),
      });
    }
    const val = (sb as any)[prop];
    return typeof val === 'function' ? val.bind(sb) : val;
  },
});

/**
 * Queries the Supabase 'users' table as the source of truth for user roles,
 * permissions, and assigned warehouses after login.
 */
export async function fetchAppUserFromSupabase(
  sbUser: SupabaseAuthUser | null,
  registeredUsers: User[] = []
): Promise<User | null> {
  if (!sbUser) return null;

  const sb = getSupabase();
  const email = sbUser.email || '';
  const meta = sbUser.user_metadata || {};

  // 1. Try querying the users table in Supabase
  if (sb) {
    try {
      const { data: dbUser, error } = await sb
        .from('users')
        .select('*')
        .or(`id.eq.${sbUser.id},email.eq.${email.toLowerCase()}`)
        .maybeSingle();

      if (!error && dbUser) {
        const role = (dbUser.role as UserRole) || 'Supervisor';
        return {
          id: dbUser.id || sbUser.id,
          empId: dbUser.emp_id || dbUser.empId || meta.empId || `EMP-${sbUser.id.slice(0, 4).toUpperCase()}`,
          name: dbUser.name || meta.name || meta.full_name || email.split('@')[0] || 'EMIZA User',
          email: dbUser.email || email,
          phone: dbUser.phone || meta.phone || '',
          role,
          department: dbUser.department || meta.department || 'Operations Management',
          assignedWarehouseIds: dbUser.assigned_warehouse_ids || dbUser.assignedWarehouseIds || ['wh-main'],
          assignedClientIds: dbUser.assigned_client_ids || dbUser.assignedClientIds || [
            'cli-bellavita',
            'cli-nykaa',
            'cli-mama',
            'cli-boat',
            'cli-sugar',
          ],
          permissions: ROLE_DEFAULT_PERMISSIONS[role],
          status: (dbUser.status as 'Active' | 'Inactive') || 'Active',
          authProvider: 'supabase',
          lastLoginAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch user record from database table:', err);
    }
  }

  // 2. Fallback to synchronous metadata mapping
  return mapSupabaseUserToAppUser(sbUser, registeredUsers);
}

/**
 * Maps a Supabase Auth User + metadata to our application User model with role & permissions.
 */
export function mapSupabaseUserToAppUser(
  sbUser: SupabaseAuthUser | null,
  registeredUsers: User[] = []
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
    status: existing?.status || 'Active',
    authProvider: 'supabase',
    lastLoginAt: new Date().toISOString(),
  };
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: Session | null;
  error?: string;
}
