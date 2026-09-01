import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, fetchAppUserFromSupabase } from '../services/supabase';
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
  signUp: (params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    empId?: string;
    department?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
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
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  const registerDeviceSession = useCallback(async (user: User) => {
    const deviceId = SyncService.getDeviceId();
    const isMobile = typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
    const sessionObj: ActiveDeviceSession = {
      id: `sess-${user.id}-${deviceId}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      warehouseId: user.assignedWarehouseIds?.[0] || 'wh-main',
      warehouseName: 'Bhiwandi WH',
      deviceType: isMobile ? 'Mobile / Scanner' : 'Desktop',
      browserInfo: typeof navigator !== 'undefined' ? `${navigator.platform || 'Device'} (${isMobile ? 'Mobile Gun/PDA' : 'Operations Terminal'})` : 'Terminal',
      loginTime: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'Online',
    };

    // 1. Local Storage
    StorageService.registerDeviceSession(sessionObj);

    // 2. Supabase active_devices table
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('active_devices').upsert({
          id: sessionObj.id,
          user_id: sessionObj.userId,
          user_name: sessionObj.userName,
          user_role: sessionObj.userRole,
          user_email: sessionObj.userEmail,
          warehouse_id: sessionObj.warehouseId,
          warehouse_name: sessionObj.warehouseName,
          device_type: sessionObj.deviceType,
          browser_info: sessionObj.browserInfo,
          login_time: sessionObj.loginTime,
          last_active_at: sessionObj.lastActiveAt,
          status: sessionObj.status,
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('[AuthContext] Failed to upsert active device to Supabase:', err);
      }
    }
  }, []);

  // Sync App User state from Supabase Auth User & users table
  const syncAppUser = useCallback(async (sbUser: SupabaseAuthUser | null) => {
    if (!sbUser) {
      setAppUser(null);
      StorageService.clearAuthSession();
      return;
    }
    const allUsers = StorageService.getUsers();
    const mapped = await fetchAppUserFromSupabase(sbUser, allUsers);
    if (mapped) {
      if (mapped.status === 'Inactive') {
        setAppUser(null);
        StorageService.clearAuthSession();
        return;
      }
      setAppUser(mapped);
      StorageService.saveCurrentUser(mapped);
      StorageService.saveAuthSession({ isLoggedIn: true, userId: mapped.id });

      // Register live device session in localStorage and Supabase
      await registerDeviceSession(mapped);
    }
  }, [registerDeviceSession]);

  // 1. Initial Session Load & Subscription
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const sb = getSupabase();
        if (sb) {
          // Fetch existing Supabase Session from persistent storage
          const { data, error } = await sb.auth.getSession();
          if (error) {
            console.warn('[Supabase Auth] Failed to get session:', error.message);
          }
          if (isMounted) {
            if (data?.session) {
              setSession(data.session);
              setSupabaseUser(data.session.user);
              await syncAppUser(data.session.user);
            } else {
              setSession(null);
              setSupabaseUser(null);
              setAppUser(null);
              StorageService.clearAuthSession();
            }
          }
        } else {
          // Fallback if Supabase credentials are not yet configured
          const localSession = StorageService.getAuthSession();
          const savedUser = StorageService.getCurrentUser();
          const users = StorageService.getUsers();

          let found = null;
          if (savedUser && savedUser.status !== 'Inactive') {
            found = savedUser;
          } else if (localSession.isLoggedIn && localSession.userId) {
            found = users.find(u => u.id === localSession.userId && u.status !== 'Inactive');
          }

          if (found && isMounted && found.status !== 'Inactive') {
            setAppUser(found);
            await registerDeviceSession(found);
          }
        }
      } catch (err) {
        console.error('[Supabase Auth] Init error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // 2. Set up realtime Supabase auth state listener
    let authListener: { unsubscribe: () => void } | null = null;
    const sb = getSupabase();
    if (sb) {
      const { data: { subscription } } = sb.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!isMounted) return;
          setSession(newSession);
          setSupabaseUser(newSession?.user || null);
          await syncAppUser(newSession?.user || null);
          setLoading(false);
        }
      );
      authListener = subscription;
    }

    // 3. Set up periodic Heartbeat to keep active device session fresh
    const heartbeatTimer = setInterval(async () => {
      const currentSession = StorageService.getAuthSession();
      if (currentSession.isLoggedIn && currentSession.userId) {
        const deviceId = SyncService.getDeviceId();
        const sessionId = `sess-${currentSession.userId}-${deviceId}`;
        StorageService.updateDeviceHeartbeat(sessionId);
        StorageService.cleanupStaleDevices(20);

        const currentSb = getSupabase();
        if (currentSb) {
          try {
            await currentSb.from('active_devices').update({
              last_active_at: new Date().toISOString(),
              status: 'Online',
            }).eq('id', sessionId);
          } catch (e) {
            // Heartbeat update failure is silent
          }
        }
      }
    }, 20000);

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
      clearInterval(heartbeatTimer);
    };
  }, [isConfigured, syncAppUser, registerDeviceSession]);

  // Sign In with Supabase Auth
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const emailTrimmed = email.trim();
      const sb = getSupabase();

      if (!sb) {
        // Supabase is not configured yet - informative error
        setLoading(false);
        return {
          success: false,
          error: 'Supabase credentials are not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        };
      }

      const { data, error } = await sb.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (error || !data.session || !data.user) {
        setLoading(false);
        return {
          success: false,
          error: error?.message || 'Invalid email or password. Please verify your Supabase credentials.',
        };
      }

      setSession(data.session);
      setSupabaseUser(data.user);
      await syncAppUser(data.user);

      // Record Activity Log
      const activeUser = await fetchAppUserFromSupabase(data.user, StorageService.getUsers());
      if (activeUser) {
        StorageService.addActivityLog({
          userId: activeUser.id,
          userName: activeUser.name,
          userRole: activeUser.role,
          action: 'User Signed In',
          module: 'Auth',
          details: `Signed in as ${activeUser.role} via Supabase Auth (${activeUser.email})`,
        });
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err?.message || 'An unexpected error occurred during sign in.' };
    }
  };

  // Sign Up with Supabase Auth
  const signUp = async ({
    email,
    password,
    name,
    role,
    empId,
    department,
    phone,
  }: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    empId?: string;
    department?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const sb = getSupabase();
      if (!sb) {
        setLoading(false);
        return { success: false, error: 'Supabase is not configured.' };
      }

      const userMeta = {
        name,
        full_name: name,
        role: role || 'Supervisor',
        empId: empId || `EMP-${Date.now().toString().slice(-4)}`,
        department: department || 'Operations Management',
        phone: phone || '',
        permissions: ROLE_DEFAULT_PERMISSIONS[role || 'Supervisor'],
      };

      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: userMeta,
        },
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setSupabaseUser(data.user);
        await syncAppUser(data.user);
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err?.message || 'An error occurred during registration.' };
    }
  };

  // Sign Out with Supabase Auth
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      if (appUser) {
        const deviceId = SyncService.getDeviceId();
        const sessionId = `sess-${appUser.id}-${deviceId}`;
        StorageService.removeDeviceSession(sessionId);

        const sb = getSupabase();
        if (sb) {
          try {
            await sb.from('active_devices').delete().eq('id', sessionId);
          } catch (e) {
            // Safe ignore
          }
        }

        StorageService.addActivityLog({
          userId: appUser.id,
          userName: appUser.name,
          userRole: appUser.role,
          action: 'User Signed Out',
          module: 'Auth',
          details: `Signed out from ${appUser.role} session`,
        });
      }

      const sb = getSupabase();
      if (sb) {
        await sb.auth.signOut();
      }
    } catch (err) {
      console.error('[Supabase Auth] SignOut error:', err);
    } finally {
      setSession(null);
      setSupabaseUser(null);
      setAppUser(null);
      StorageService.clearAuthSession();
      setLoading(false);
    }
  };

  // Reset Password for Email
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const emailTrimmed = email.trim();
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.auth.resetPasswordForEmail(emailTrimmed, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?reset=true` : undefined,
        });
        if (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password reset request failed.' };
    }
  };

  // Role Switcher for testing/demo
  const switchUserRole = (role: UserRole) => {
    if (!appUser) return;
    const updated: User = {
      ...appUser,
      role,
      permissions: ROLE_DEFAULT_PERMISSIONS[role],
      name: `${appUser.name.split(' ')[0]} (${role})`,
    };
    setAppUser(updated);
    StorageService.saveCurrentUser(updated);
    StorageService.addActivityLog({
      userId: updated.id,
      userName: updated.name,
      userRole: role,
      action: 'Switched User Persona',
      module: 'Auth',
      details: `Active role switched to ${role}`,
    });
  };

  const refreshSession = async () => {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data?.session) {
        setSession(data.session);
        setSupabaseUser(data.session.user);
        await syncAppUser(data.session.user);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        appUser,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        switchUserRole,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
