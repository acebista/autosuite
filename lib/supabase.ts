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
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
