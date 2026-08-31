import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, mapSupabaseUserToAppUser } from '../services/supabase';
import { User, UserRole, ActiveDeviceSession } from '../types';
import { StorageService } from '../services/storage';
import { ROLE_DEFAULT_PERMISSIONS } from '../utils/rbac';
import { SyncService } from '../services/syncService';

interface AuthContextType {
  session: Session | null;
  supabaseUser: SupabaseAuthUser | null;
  appUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: { email: string; password: string; name: string; role: UserRole; empId?: string; department?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  switchUserRole: (role: UserRole) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseAuthUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const registerDevice = useCallback((mapped: User) => {
    const deviceId = SyncService.getDeviceId();
    const isMobile = typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
    StorageService.registerDeviceSession({
      id: `sess-${mapped.id}-${deviceId}`,
      userId: mapped.id,
      userName: mapped.name,
      userRole: mapped.role,
      userEmail: mapped.email,
      warehouseId: mapped.assignedWarehouseIds?.[0] || 'wh-main',
      warehouseName: 'Bhiwandi WH',
      deviceType: isMobile ? 'Mobile / Scanner' : 'Desktop',
      browserInfo: typeof navigator !== 'undefined' ? `${navigator.platform || 'Device'} (${isMobile ? 'Mobile Gun/PDA' : 'Operations Terminal'})` : 'Terminal',
      loginTime: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'Online',
    });
  }, []);

  const syncAppUser = useCallback((sbUser: SupabaseAuthUser | null) => {
    if (!sbUser) {
      setAppUser(null);
      StorageService.clearAuthSession();
      return;
    }
    const mapped = mapSupabaseUserToAppUser(sbUser, StorageService.getUsers());
    if (!mapped || mapped.status === 'Inactive') {
      setAppUser(null);
      StorageService.clearAuthSession();
      return;
    }
    setAppUser(mapped);
    StorageService.saveCurrentUser(mapped);
    StorageService.saveAuthSession({ isLoggedIn: true, userId: mapped.id });
    registerDevice(mapped);
  }, [registerDevice]);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initialize = async () => {
      try {
        if (!isConfigured) {
          if (mounted) {
            setSession(null);
            setSupabaseUser(null);
            setAppUser(null);
          }
          return;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn('[Supabase Auth] Session load failed:', error.message);
        if (mounted) {
          setSession(data.session);
          setSupabaseUser(data.session?.user || null);
          syncAppUser(data.session?.user || null);
        }
        const auth = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted) return;
          setSession(nextSession);
          setSupabaseUser(nextSession?.user || null);
          syncAppUser(nextSession?.user || null);
          setLoading(false);
        });
        subscription = auth.data.subscription;
      } catch (err) {
        console.error('[Supabase Auth] Init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();
    const heartbeatTimer = setInterval(() => {
      if (StorageService.getAuthSession().isLoggedIn && appUser) {
        const deviceId = SyncService.getDeviceId();
        StorageService.updateDeviceHeartbeat(`sess-${appUser.id}-${deviceId}`);
        StorageService.cleanupStaleDevices(20);
      }
    }, 20000);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearInterval(heartbeatTimer);
    };
  }, [isConfigured, syncAppUser, appUser]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!isConfigured) return { success: false, error: 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user || !data.session) {
        return { success: false, error: error?.message || 'Invalid email or password.' };
      }
      const mapped = mapSupabaseUserToAppUser(data.user, StorageService.getUsers());
      if (!mapped || mapped.status === 'Inactive') {
        await supabase.auth.signOut();
        return { success: false, error: 'Your account is inactive or not authorized. Please contact Super Admin.' };
      }
      setSession(data.session);
      setSupabaseUser(data.user);
      syncAppUser(data.user);
      StorageService.addActivityLog({ userId: mapped.id, userName: mapped.name, userRole: mapped.role, action: 'User Signed In', module: 'Auth', details: `Signed in as ${mapped.role} (${mapped.email})` });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unable to sign in.' };
    } finally {
      setLoading(false);
    }
  };

  // Public sign-up is intentionally disabled. New users must be created by Super Admin through Supabase Auth/Admin tooling.
  const signUp = async () => ({ success: false, error: 'Public registration is disabled. New users must be created by Super Admin.' });

  const signOut = async () => {
    setLoading(true);
    try {
      if (appUser) {
        const deviceId = SyncService.getDeviceId();
        StorageService.removeDeviceSession(`sess-${appUser.id}-${deviceId}`);
        StorageService.addActivityLog({ userId: appUser.id, userName: appUser.name, userRole: appUser.role, action: 'User Signed Out', module: 'Auth', details: `Signed out from ${appUser.role} session` });
      }
      if (isConfigured) await supabase.auth.signOut();
    } finally {
      setSession(null);
      setSupabaseUser(null);
      setAppUser(null);
      StorageService.clearAuthSession();
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) return { success: false, error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?reset=true` : undefined });
    return error ? { success: false, error: error.message } : { success: true };
  };

  // Kept only for existing UI compatibility; it does not alter the authenticated Supabase identity.
  const switchUserRole = (_role: UserRole) => {
    console.warn('[EMIZA-WOP] Role switching is disabled in production. Roles are controlled by Supabase Auth metadata.');
  };

  const refreshSession = async () => {
    if (!isConfigured) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setSupabaseUser(data.session?.user || null);
    syncAppUser(data.session?.user || null);
  };

  return <AuthContext.Provider value={{ session, supabaseUser, appUser, loading, isConfigured, signIn, signUp, signOut, resetPassword, switchUserRole, refreshSession }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
