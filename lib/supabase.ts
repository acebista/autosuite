import { createClient } from '@supabase/supabase-js';
import { Database } from '../supabase_types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        // Use a consistent, explicit storage key
        storageKey: 'autosuite-sb-auth',
        // Override the navigator.locks API with a no-op lock function.
        // This prevents deadlocks caused by stale tabs holding browser locks
        // on expired session refresh attempts.
        lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
            // Simply execute fn immediately without any cross-tab locking.
            // For a single-tab DMS app this is perfectly safe.
            return fn();
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
