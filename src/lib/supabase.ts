
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO SUPABASE
 * Substitua os valores abaixo pelas credenciais do seu projeto no painel do Supabase
 * (Project Settings > API)
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing in .env');
}

// Fallback to avoid crash on startup, allowing ErrorBoundary to show friendly message later if needed
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
);
