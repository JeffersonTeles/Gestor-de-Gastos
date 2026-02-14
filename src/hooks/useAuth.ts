'use client';

import { mockAuth } from '@/lib/mockAuth';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ensureProfile = useCallback(async (authUser: any) => {
    if (!authUser?.id || !authUser?.email) return;
    try {
      await fetch('/api/user/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          currency: 'BRL',
        }),
      });
    } catch {
      // Perfil e opcional; nao bloquear login
    }
  }, []);

  // Verificar session ao montar
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (mounted && data.session?.user) {
          await ensureProfile(data.session.user);
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            full_name: data.session.user.user_metadata?.full_name,
          });
        } else {
          const mockUser = await mockAuth.getUser();
          if (mounted && mockUser) {
            setUser({
              id: mockUser.id,
              email: mockUser.email,
              full_name: undefined,
            });
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (mounted) {
          if (session?.user) {
            await ensureProfile(session.user);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name,
            });
          } else {
            const mockUser = await mockAuth.getUser();
            setUser(mockUser ? { id: mockUser.id, email: mockUser.email } : null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
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

        if (signUpError) {
          const authResult = await mockAuth.signUp(email, password);
          if (authResult.error) throw authResult.error;
          await ensureProfile({ id: authResult.user?.id, email, user_metadata: { full_name: fullName } });
        } else {
          const { data } = await supabase.auth.getUser();
          await ensureProfile(data.user);
        }
        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Erro ao cadastrar');
      }
    },
    [router, ensureProfile]
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

        if (signInError) {
          const authResult = await mockAuth.signIn(email, password);
          if (authResult.error) throw authResult.error;
          await ensureProfile({ id: authResult.user?.id, email, user_metadata: {} });
        } else {
          const { data } = await supabase.auth.getUser();
          await ensureProfile(data.user);
        }
        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer login');
      }
    },
    [router, ensureProfile]
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      await mockAuth.signOut();
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
