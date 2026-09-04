import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import {
  getSupabase,
  isSupabaseConfigured,
  fetchAppUserFromSupabase,
  subscribeToUserProfiles,
  isSuperAdminEmail,
  SUPER_ADMIN_EMAIL,
  createUserViaSupabaseAuth,
  updateUserProfile,
  fetchAllUserProfiles,
  fetchPermissionsAndRoles,
} from '../services/supabase';
import { User, UserRole, ActiveDeviceSession } from '../types';
import { StorageService } from '../services/storage';
import { initialUsers } from '../mockData';
import { ROLE_DEFAULT_PERMISSIONS, isSuperAdmin, has_permission } from '../utils/rbac';
import { SyncService } from '../services/syncService';

interface AuthContextType {
  session: Session | null;
  supabaseUser: SupabaseAuthUser | null;
  appUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  isSuperAdminUser: boolean;
  hasPermission: (permissionKey: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'scan' | 'export' | 'approve' | 'closeBatch') => boolean;
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
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map raw Supabase auth errors to clear, actionable messages
function mapAuthError(err: any, attemptedEmail: string): string {
  const msg: string = err?.message || '';
  const code = err?.code || '';

  // Demo emails only work in Demo Mode (no Supabase)
  const demoEmails = [
    'brijesh.verma@emizainc.com',
    'brijesh.verma@emiza.com',
    'vikram.m@emiza.com',
    'rajesh.security@emiza.com',
    'pooja.d@emiza.com',
    'amit.p@emiza.com',
    'sandeep.y@emiza.com',
    'neha.s@emiza.com',
  ];
  if (demoEmails.includes(attemptedEmail)) {
    return `Supabase mode is active — internal demo accounts don't work here. Sign in with verma.brijesh0501@gmail.com (auto-creates as Super Admin), then create team accounts via User Management.`;
  }
  if (code === 'email_not_confirmed' || /not confirmed/i.test(msg)) {
    return 'Email not confirmed: In the Supabase Dashboard go to Authentication → Sign In / Up and turn OFF "Confirm email", then try again.';
  }
  if (/already registered|already exists/i.test(msg)) {
    return 'This account already exists with a different password. Try your other password, or reset it from the Supabase Dashboard (Authentication → Users).';
  }
  if (/at least 6/i.test(msg)) {
    return 'Password must be at least 6 characters long.';
  }
  if (/signups not allowed/i.test(msg)) {
    return 'Sign-ups are disabled in your Supabase project. Enable them in Authentication → Sign In / Up.';
  }
  if (/provider.*(disabled|not enabled)|(disabled|not enabled).*provider/i.test(msg) || code === 'email_provider_disabled') {
    return 'The Email provider is turned OFF in your Supabase project. Fix: Supabase Dashboard → Authentication → Sign In / Up → Providers tab → Email → switch ON → Save. Then try again.';
  }
  if (/failed to fetch|network|load failed/i.test(msg)) {
    return 'Cannot reach Supabase. Check your internet connection (or ad-blocker/VPN) and try again.';
  }
  if (/rate limit/i.test(msg)) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  return msg || 'Invalid email or password. Please verify your credentials.';
}

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
      warehouseName: 'Bhiwandi Central WH',
      deviceType: isMobile ? 'Mobile / Scanner' : 'Desktop',
      browserInfo: typeof navigator !== 'undefined' ? `${navigator.platform || 'Device'} (${isMobile ? 'Mobile Gun/PDA' : 'Operations Terminal'})` : 'Terminal',
      loginTime: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'Online',
    };

    StorageService.registerDeviceSession(sessionObj);

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
        console.warn('[AuthContext] Device session sync info:', err);
      }
    }
  }, []);

  // Sync App User state strictly from Supabase Auth & user_profiles table
  const syncAppUser = useCallback(async (sbUser: SupabaseAuthUser | null): Promise<User | null> => {
    if (!sbUser) {
      setAppUser(null);
      return null;
    }

    const mapped = await fetchAppUserFromSupabase(sbUser);
    if (mapped) {
      // BLOCK ACCESS IF IS_ACTIVE IS FALSE
      if (mapped.status === 'Inactive') {
        console.warn('[Auth] User account is marked inactive in user_profiles. Denying access.');
        const sb = getSupabase();
        if (sb) {
          await sb.auth.signOut();
        }
        setSession(null);
        setSupabaseUser(null);
        setAppUser(null);
        StorageService.clearAuthSession();
        return null;
      }

      setAppUser(mapped);
      StorageService.saveCurrentUser(mapped);
      StorageService.saveAuthSession({ isLoggedIn: true, userId: mapped.id });

      await registerDeviceSession(mapped);
      return mapped;
    }

    return null;
  }, [registerDeviceSession]);

  // 1. Initial Session Load strictly from Supabase Auth
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const sb = getSupabase();
        if (!sb) {
          // Demo/Local Workspace Mode (no Supabase): restore a previously saved
          // local demo user so refreshes keep the session.
          if (isMounted) {
            const saved = StorageService.getCurrentUser();
            if (saved && saved.status === 'Active') {
              setSession(null);
              setSupabaseUser(null);
              setAppUser(saved);
            } else {
              setSession(null);
              setSupabaseUser(null);
              setAppUser(null);
              StorageService.clearAuthSession();
            }
            setLoading(false);
          }
          return;
        }

        // Fetch existing Supabase Auth Session
        const { data, error } = await sb.auth.getSession();
        if (error || !data?.session) {
          // No active Supabase session -> User must log in
          if (isMounted) {
            setSession(null);
            setSupabaseUser(null);
            setAppUser(null);
            StorageService.clearAuthSession();
          }
        } else {
          // Validate token expiration
          const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0;
          if (expiresAt > 0 && expiresAt < Date.now()) {
            console.info('[Auth] Supabase session token expired, attempting refresh...');
            const { data: refreshData, error: refreshError } = await sb.auth.refreshSession();
            if (refreshError || !refreshData.session) {
              await sb.auth.signOut();
              if (isMounted) {
                setSession(null);
                setSupabaseUser(null);
                setAppUser(null);
                StorageService.clearAuthSession();
              }
            } else if (isMounted) {
              setSession(refreshData.session);
              setSupabaseUser(refreshData.session.user);
              await syncAppUser(refreshData.session.user);
            }
          } else if (isMounted) {
            setSession(data.session);
            setSupabaseUser(data.session.user);
            await syncAppUser(data.session.user);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
        if (isMounted) {
          setSession(null);
          setSupabaseUser(null);
          setAppUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // 2. Real-time Supabase Auth state changes (sign-in, token refresh, sign-out)
    let authListener: { unsubscribe: () => void } | null = null;
    const sb = getSupabase();
    if (sb) {
      const { data: { subscription } } = sb.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!isMounted) return;
          console.info('[Auth] Auth state changed:', event);

          if (event === 'SIGNED_OUT' || !newSession) {
            setSession(null);
            setSupabaseUser(null);
            setAppUser(null);
            StorageService.clearAuthSession();
            setLoading(false);
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            setSession(newSession);
            setSupabaseUser(newSession.user);
            await syncAppUser(newSession.user);
            setLoading(false);
          }
        }
      );
      authListener = subscription;
    }

    // 3. Real-time Subscription to user_profiles table:
    // If current user is deactivated or role changed by Super Admin from another device, sync immediately!
    const profilesSub = subscribeToUserProfiles(async ({ newRecord }) => {
      if (!isMounted || !newRecord) return;
      if (appUser && newRecord.user_id === appUser.id) {
        console.info('[Auth Realtime] user_profiles update for current user:', newRecord);
        if (newRecord.is_active === false) {
          alert('Your account has been deactivated by the Super Administrator. You will be redirected to the login page.');
          if (sb) await sb.auth.signOut();
          setSession(null);
          setSupabaseUser(null);
          setAppUser(null);
          StorageService.clearAuthSession();
        } else if (newRecord.role && newRecord.role !== appUser.role) {
          // Re-sync permissions with updated role
          if (supabaseUser) {
            await syncAppUser(supabaseUser);
          }
        }
      }
    });

    // 4. Periodic Heartbeat for active device tracking
    const heartbeatTimer = setInterval(async () => {
      if (session && appUser) {
        const deviceId = SyncService.getDeviceId();
        const sessionId = `sess-${appUser.id}-${deviceId}`;
        StorageService.updateDeviceHeartbeat(sessionId);

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
    }, 25000);

    return () => {
      isMounted = false;
      if (authListener) authListener.unsubscribe();
      profilesSub.unsubscribe();
      clearInterval(heartbeatTimer);
    };
  }, [isConfigured, syncAppUser]);

  // Sign In strictly with Supabase Auth
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const emailTrimmed = email.trim().toLowerCase();
      const sb = getSupabase();

      if (!sb) {
        // DEMO MODE: Supabase is not configured in this environment.
        // Authenticate against the built-in demo users so the app is explorable.
        const match = initialUsers.find(u => u.email.toLowerCase() === emailTrimmed);

        if (!match) {
          setLoading(false);
          return {
            success: false,
            error: 'Demo Mode: No demo account with this email. Try brijesh.verma@emizainc.com (any password with 4+ characters).',
          };
        }

        if (!password || password.length < 4) {
          setLoading(false);
          return {
            success: false,
            error: 'Demo Mode: Enter any password with at least 4 characters.',
          };
        }

        if (match.status !== 'Active') {
          setLoading(false);
          return {
            success: false,
            error: 'Access Denied: This demo account is inactive. Contact the Super Administrator.',
          };
        }

        const demoUser: User = {
          ...match,
          mustChangePassword: false,
          lastLoginAt: new Date().toISOString(),
        };

        setSession(null);
        setSupabaseUser(null);
        setAppUser(demoUser);
        StorageService.saveCurrentUser(demoUser);
        StorageService.saveAuthSession({ isLoggedIn: true, userId: demoUser.id });
        await registerDeviceSession(demoUser);

        StorageService.addActivityLog({
          userId: demoUser.id,
          userName: demoUser.name,
          userRole: demoUser.role,
          action: 'User Signed In',
          module: 'Auth',
          details: `Signed in as ${demoUser.role} via Demo/Local Mode (${demoUser.email})`,
        });

        setLoading(false);
        return { success: true };
      }

      // 1. Attempt standard Supabase Auth signInWithPassword
      let { data, error } = await sb.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      // Special bootstrap for Super Admin (verma.brijesh0501@gmail.com) if not yet registered in auth.users
      if (error && isSuperAdminEmail(emailTrimmed)) {
        console.info('[Auth] Super Admin account not found in auth.users, attempting bootstrap sign-up...');
        const signUpRes = await sb.auth.signUp({
          email: emailTrimmed,
          password,
          options: {
            data: {
              name: 'Brijesh Verma',
              full_name: 'Brijesh Verma',
              role: 'Super Admin',
              empId: 'EMP-0001',
              department: 'Central Admin',
            },
          },
        });

        if (!signUpRes.error && signUpRes.data.user) {
          // If session was returned directly:
          if (signUpRes.data.session) {
            data = signUpRes.data;
            error = null;
          } else {
            // Try sign in again now that user exists
            const retryRes = await sb.auth.signInWithPassword({
              email: emailTrimmed,
              password,
            });
            data = retryRes.data;
            error = retryRes.error;
          }
        } else if (signUpRes.error) {
          // Bootstrap failed (e.g. Email provider disabled, signups blocked, rate limit)
          setLoading(false);
          return {
            success: false,
            error: `Super Admin first-time setup failed: ${mapAuthError(signUpRes.error, emailTrimmed)}`,
          };
        }
      }

      if (error) {
        setLoading(false);
        return { success: false, error: mapAuthError(error, emailTrimmed) };
      }

      if (!data.session || !data.user) {
        setLoading(false);
        return {
          success: false,
          error: 'Login incomplete. Please verify your email or check credentials.',
        };
      }

      // 2. Fetch user profile from user_profiles table as the single source of truth
      const mappedUser = await syncAppUser(data.user);

      if (!mappedUser) {
        setLoading(false);
        return {
          success: false,
          error: 'Access Denied: Your account has been deactivated by the Super Administrator.',
        };
      }

      // Double-check is_active status
      if (mappedUser.status === 'Inactive') {
        await sb.auth.signOut();
        setSession(null);
        setSupabaseUser(null);
        setAppUser(null);
        StorageService.clearAuthSession();
        setLoading(false);
        return {
          success: false,
          error: 'Access Denied: Your account is currently inactive. Contact the Super Administrator.',
        };
      }

      setSession(data.session);
      setSupabaseUser(data.user);

      StorageService.addActivityLog({
        userId: mappedUser.id,
        userName: mappedUser.name,
        userRole: mappedUser.role,
        action: 'User Signed In',
        module: 'Auth',
        details: `Signed in as ${mappedUser.role} via Supabase Auth (${mappedUser.email})`,
      });

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

      const emailTrimmed = email.trim().toLowerCase();
      const effectiveRole = isSuperAdminEmail(emailTrimmed) ? 'Super Admin' : (role || 'Supervisor');

      const userMeta = {
        name,
        full_name: name,
        role: effectiveRole,
        empId: empId || `EMP-${Date.now().toString().slice(-4)}`,
        department: department || (effectiveRole === 'Super Admin' ? 'Central Admin' : 'Operations Management'),
        phone: phone || '',
      };

      const { data, error } = await sb.auth.signUp({
        email: emailTrimmed,
        password,
        options: {
          data: userMeta,
        },
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Link to user_profiles table
        await sb.from('user_profiles').upsert(
          {
            user_id: data.user.id,
            role: effectiveRole,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
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

  // Sign Out
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

  // Update Password (forced change on first login or user profile)
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.auth.updateUser({
          password: newPassword,
          data: {
            mustChangePassword: false,
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
      }

      if (appUser) {
        const updatedUser: User = {
          ...appUser,
          mustChangePassword: false,
        };
        setAppUser(updatedUser);
        StorageService.saveCurrentUser(updatedUser);
        StorageService.updateUser(appUser.id, { mustChangePassword: false });

        StorageService.addActivityLog({
          userId: appUser.id,
          userName: appUser.name,
          userRole: appUser.role,
          action: 'Password Changed',
          module: 'Auth',
          details: 'User successfully updated temporary password to permanent personal password',
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
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

  const isSuperAdminUser = isSuperAdmin(appUser);

  const hasPermission = useCallback(
    (permissionKey: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'scan' | 'export' | 'approve' | 'closeBatch') => {
      return has_permission(appUser, permissionKey, action || 'view');
    },
    [appUser]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        appUser,
        loading,
        isConfigured,
        isSuperAdminUser,
        hasPermission,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
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
