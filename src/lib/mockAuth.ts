// Mock auth service para desenvolvimento sem Supabase real
// Substitua por autenticação real quando tiver credenciais Supabase

interface User {
  id: string;
  email: string;
}

interface AuthError {
  message: string;
}

const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  password: 'demo123',
};

export const mockAuth = {
  signIn: async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
    // Simular delay de requisição
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      // Simular usuário logado
      const user: User = { id: DEMO_USER.id, email: DEMO_USER.email };
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      return { user, error: null };
    }

    return {
      user: null,
      error: {
        message: `Credenciais inválidas. Use: ${DEMO_USER.email} / ${DEMO_USER.password}`,
      },
    };
  },

  signUp: async (email: string, _password: string): Promise<{ user: User | null; error: AuthError | null }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user: User = { id: `user-${Date.now()}`, email };
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    return { user, error: null };
  },

  getUser: async (): Promise<User | null> => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  },

  signOut: async (): Promise<{ error: null }> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }
    return { error: null };
  },
};
