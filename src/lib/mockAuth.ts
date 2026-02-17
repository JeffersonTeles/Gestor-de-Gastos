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

    // Validação básica
    if (!email || !password) {
      return {
        user: null,
        error: {
          message: 'Email e senha são obrigatórios',
        },
      };
    }

    if (password.length < 6) {
      return {
        user: null,
        error: {
          message: 'A senha deve ter pelo menos 6 caracteres',
        },
      };
    }

    // Aceitar qualquer email válido (modo offline/demo)
    const userId = email === DEMO_USER.email ? DEMO_USER.id : `user-${btoa(email).slice(0, 10)}`;
    const user: User = { id: userId, email };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    
    return { user, error: null };
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
