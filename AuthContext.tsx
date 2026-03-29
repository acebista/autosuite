import React, { createContext, useContext, useEffect, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore, normalizeRole } from './lib/store';
import { Role, UserProfile } from './types';

// Re-export UserProfile so existing imports from './AuthContext' still work
export type { UserProfile } from './types';

// ─── Context type ────────────────────────────────────────────────────────────
interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  branchId: string;
  orgId: string | null;
  /**
   * Step 1: Verify credentials only. Never logs in automatically.
   * Returns { profiles } if credentials are valid → caller MUST show dealer selector.
   * Returns { error } if credentials are invalid.
   */
  verifyCredentials: (email: string, password: string) => Promise<{ error: string | null; profiles?: UserProfile[] }>;
  /**
   * Step 2: Complete login by selecting a dealer from the list returned by verifyCredentials.
   */
  selectDealerAndLogin: (profile: UserProfile) => Promise<void>;
  loginWithRole: (role: Role) => void;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
  /** Profiles returned after credential verification — null until step 1 is done */
  availableProfiles: UserProfile[] | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Profile builders ────────────────────────────────────────────────────────
function profileFromDbRow(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: normalizeRole(row.role),
    orgId: row.org_id ?? null,
    orgName: row.organizations?.name || row.orgName,
    orgSlug: row.organizations?.slug || row.orgSlug,
    orgLogo: row.organizations?.logo_url || row.orgLogo,
    orgAddress: row.organizations?.address || null,
    orgPhone: row.organizations?.phone || null,
    orgEmail: row.organizations?.email || null,
    branchId: row.branch_id ?? null,
    avatarUrl: row.avatar_url || undefined,
    status: (row.status as 'Active' | 'Inactive') || 'Active',
  };
}

function profileFromAuthMeta(authUser: SupabaseUser): UserProfile {
  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.email || 'User',
    email: authUser.email || '',
    role: normalizeRole(authUser.user_metadata?.role),
    orgId: authUser.user_metadata?.org_id || null,
    branchId: null,
    status: 'Active',
  };
}

/** Fetch all dealer profiles for a user (by user_id OR legacy id match) */
async function fetchAllProfilesForUser(
  userId: string,
  email: string
): Promise<UserProfile[]> {
  try {
    // First try user_id column (new schema)
    const { data, error } = await supabase
      .from('profiles')
      .select('*, organizations(name, slug, logo_url, address, phone, email)')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .order('is_active', { ascending: false }); // active one first

    if (error) throw error;
    if (!data || data.length === 0) {
      // Fallback: try by email
      const { data: emailData } = await supabase
        .from('profiles')
        .select('*, organizations(name, slug, logo_url)')
        .eq('email', email);
      return (emailData || []).map(profileFromDbRow);
    }

    return data.map(profileFromDbRow);
  } catch (err) {
    console.error('Error fetching profiles:', err);
    return [];
  }
}

/** Fetch the currently-active profile for a logged-in user */
async function fetchActiveProfile(
  userId: string,
  authUser?: SupabaseUser | null,
): Promise<UserProfile | null> {
  try {
    // Try active flag first
    const { data: active } = await supabase
      .from('profiles')
      .select('*, organizations(name, slug, logo_url, address, phone, email)')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .eq('is_active', true)
      .maybeSingle();

    if (active) return profileFromDbRow(active);

    // Fallback: first profile
    const { data: first } = await supabase
      .from('profiles')
      .select('*, organizations(name, slug, logo_url, address, phone, email)')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (first) return profileFromDbRow(first);

    // Last resort: auth metadata
    if (authUser) return profileFromAuthMeta(authUser);
    return null;
  } catch {
    if (authUser) return profileFromAuthMeta(authUser);
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAuthStore();
  const { user, session, isLoading, setUser, setSession, setLoading, clearAuth } = store;
  const [availableProfiles, setAvailableProfiles] = React.useState<UserProfile[] | null>(null);

  const loginInProgress = useRef(false);

  // ── Initialise on mount ──
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      localStorage.removeItem('autosuite-auth-storage');
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token') && key !== 'autosuite-sb-auth') {
          localStorage.removeItem(key);
        }
      }

      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout')), 10000)
        );

        let s: any = null;
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          s = (result as any).data?.session;
        } catch {
          // Timeout or error — proceed without session
        }

        if (!mounted) return;

        if (s?.user) {
          setSession(s);
          const p = await fetchActiveProfile(s.user.id, s.user);
          if (mounted && p) setUser(p);
        } else {
          const demo = localStorage.getItem('autosuite_demo_session');
          if (demo) {
            try {
              const d = JSON.parse(demo);
              const p: UserProfile = {
                ...d,
                role: normalizeRole(d.role),
                orgId: d.orgId || d.org_id || null,
                branchId: d.branchId || null,
                status: d.status || 'Active',
              };
              if (mounted) setUser(p);
            } catch {
              localStorage.removeItem('autosuite_demo_session');
              if (mounted) clearAuth();
            }
          } else {
            if (mounted) clearAuth();
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) clearAuth();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!mounted) return;
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_IN' && s?.user) {
          setSession(s);
          // Only auto-set user if login is NOT in-progress (i.e., this is a page refresh)
          if (!loginInProgress.current) {
            const p = await fetchActiveProfile(s.user.id, s.user);
            if (mounted && p) setUser(p);
          }
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && s) {
          setSession(s);
        } else if (event === 'SIGNED_OUT') {
          if (!loginInProgress.current && mounted) {
            clearAuth();
          }
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * STEP 1 — Verify credentials only.
   * Never completes the login. Always returns profiles list (even if 1).
   * Caller must call selectDealerAndLogin() to complete login.
   */
  const verifyCredentials = async (
    email: string,
    password: string
  ): Promise<{ error: string | null; profiles?: UserProfile[] }> => {
    loginInProgress.current = true;
    setLoading(true);

    // Mock mode
    const isMock = localStorage.getItem('useMockData') === 'true';
    if (isMock) {
      const users = JSON.parse(localStorage.getItem('autosuite_persisted_mock_users') || '[]');
      const results = users.filter((u: any) => u.email === email && u.password === password);

      if (results.length === 0) {
        setLoading(false);
        loginInProgress.current = false;
        return { error: 'Invalid login credentials' };
      }

      const profiles: UserProfile[] = results.map((found: any) => ({
        id: found.id,
        name: found.name,
        email: found.email,
        role: normalizeRole(found.role),
        orgId: found.org_id || found.orgId || 'demo-org',
        orgName: found.orgName || 'Demo Organization',
        orgSlug: found.orgSlug || 'demo-org',
        branchId: found.branchId || 'b1',
        status: 'Active' as const,
      }));

      setAvailableProfiles(profiles);
      setLoading(false);
      loginInProgress.current = false;
      return { error: null, profiles };
    }

    // Supabase login — sign in to get user ID, but DON'T set user yet
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        loginInProgress.current = false;
        return { error: error.message };
      }

      if (data.session) setSession(data.session);

      if (data.user) {
        const profiles = await fetchAllProfilesForUser(data.user.id, email);

        if (profiles.length === 0) {
          setLoading(false);
          loginInProgress.current = false;
          return { error: 'Your account is not linked to any dealership. Contact your administrator.' };
        }

        setAvailableProfiles(profiles);
        setLoading(false);
        loginInProgress.current = false;
        return { error: null, profiles };
      }

      setLoading(false);
      loginInProgress.current = false;
      return { error: 'Authentication failed. Please try again.' };
    } catch (err: any) {
      setLoading(false);
      loginInProgress.current = false;
      return { error: err.message || 'An unexpected error occurred' };
    }
  };

  /**
   * STEP 2 — Complete login by selecting a specific dealer profile.
   * Updates the DB active flag so RLS is scoped correctly.
   */
  const selectDealerAndLogin = async (profile: UserProfile) => {
    setLoading(true);
    try {
      if (profile.orgId && !profile.id.startsWith('demo-')) {
        // Set active org in DB — this is what drives RLS
        await supabase.rpc('set_active_org', { target_org_id: profile.orgId });
      }
      setUser(profile);
      setAvailableProfiles(null);
      loginInProgress.current = false;
    } catch (err) {
      console.error('Error selecting dealer:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Demo login ──
  const loginWithRole = (role: Role) => {
    const p: UserProfile = {
      id: 'demo-user-' + Date.now(),
      name: role === 'Admin' ? 'Demo Admin' : `Demo ${role}`,
      email: `${role.toLowerCase()}@demo.autosuite.ai`,
      role,
      orgId: 'demo-org',
      orgName: 'AutoSuite Demo',
      orgSlug: 'demo',
      branchId: 'b1',
      status: 'Active',
    };
    setUser(p);
    localStorage.setItem('autosuite_demo_session', JSON.stringify(p));
    localStorage.setItem('useMockData', 'true');
  };

  // ── Logout ──
  const logout = async () => {
    localStorage.removeItem('autosuite_demo_session');
    localStorage.removeItem('useMockData');
    setAvailableProfiles(null);
    await supabase.auth.signOut();
    clearAuth();
  };

  const hasRole = (roles: Role[]): boolean => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        branchId: user?.branchId || 'b1',
        orgId: user?.orgId || null,
        verifyCredentials,
        selectDealerAndLogin,
        loginWithRole,
        logout,
        hasRole,
        availableProfiles,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hooks ───────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// ─── Protected Route ─────────────────────────────────────────────────────────
export const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({
  children,
  roles,
}) => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-teal border-t-transparent" />
          <p className="mt-4 font-bold text-surface-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ─── Role Gate ───────────────────────────────────────────────────────────────
export const RoleGate: React.FC<{
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ roles, children, fallback = null }) => {
  const { hasRole } = useAuth();
  if (!hasRole(roles)) return <>{fallback}</>;
  return <>{children}</>;
};
