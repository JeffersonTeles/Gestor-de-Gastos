'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar session ao montar
  useEffect(() => {
    const supabase = createClient();
    
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            full_name: data.session.user.user_metadata?.full_name,
          });
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const supabase = createClient();
      try {
        setError(null);
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;
        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Erro ao cadastrar');
      }
    },
    [router]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = createClient();
      try {
        setError(null);
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer login');
      }
    },
    [router]
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer logout');
    }
  }, [router]);

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
};
