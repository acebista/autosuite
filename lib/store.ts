import { create } from 'zustand';
import { UserProfile, Role } from '../types';
import { Session } from '@supabase/supabase-js';

// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'autosuite-auth';

// ─── Role normalisation ──────────────────────────────────────────────────────
const ROLE_MAP: Record<string, Role> = {
  super_admin: 'SuperAdmin',
  superadmin: 'SuperAdmin',
  admin: 'Admin',
  salesmanager: 'SalesManager',
  salesrep: 'SalesRep',
  sales: 'SalesRep',
  serviceadvisor: 'ServiceAdvisor',
  service: 'ServiceAdvisor',
  technician: 'Technician',
  marketing: 'Marketing',
  finance: 'Finance',
};

export function normalizeRole(raw: string | null | undefined): Role {
  if (!raw) return 'SalesRep';
  return ROLE_MAP[raw.toLowerCase()] || (raw as Role);
}

// ─── Synchronous localStorage helpers ────────────────────────────────────────
function readPersistedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user?.id) return parsed.user as UserProfile;
    }
  } catch { /* ignore */ }
  return null;
}

function persistState(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

// ─── Store type ──────────────────────────────────────────────────────────────
interface AuthState {
  /** Current user or null if not logged in */
  user: UserProfile | null;
  /** Supabase session (not persisted — Supabase handles its own persistence) */
  session: Session | null;
  /** True while the initial session check is in progress */
  isLoading: boolean;

  // ── Actions ──
  setUser: (user: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

// ─── Synchronous initial state ───────────────────────────────────────────────
// This runs once, immediately, before any React render.
// If localStorage has a user we trust it and set isLoading: false so
// ProtectedRoute renders children immediately without a redirect flash.
const cachedUser = readPersistedUser();

export const useAuthStore = create<AuthState>()((set) => ({
  user: cachedUser,
  session: null,
  isLoading: !cachedUser, // false if we have a cached user, true otherwise

  setUser: (user) => {
    persistState(user);
    set({ user });
  },

  setSession: (session) => set({ session }),

  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () => {
    persistState(null);
    set({ user: null, session: null, isLoading: false });
  },
}));
