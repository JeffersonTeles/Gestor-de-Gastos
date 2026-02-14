import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ 
          data: { 
            subscription: { 
              unsubscribe: () => undefined 
            } 
          } 
        }),
      },
    } as any;
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
};
