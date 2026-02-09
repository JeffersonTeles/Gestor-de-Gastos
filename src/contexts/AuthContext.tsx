import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isDemo: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        console.log('🔐 AuthProvider inicializando, supabase:', !!supabase);
        // If supabase client is null (missing envs), auto-enter demo mode
        if (!supabase) {
            console.log('⚠️ Supabase not configured. Entering Demo Mode automatically.');
            setIsDemo(true);
            setLoading(false);
            return;
        }

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        if (isDemo) return { error: { message: 'Operação não permitida no modo Demo.' } };
        if (!supabase) return { error: { message: 'Supabase não configurado.' } };
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = async (email: string, password: string) => {
        if (isDemo) return { error: { message: 'Operação não permitida no modo Demo.' } };
        if (!supabase) return { error: { message: 'Supabase não configurado.' } };
        return await supabase.auth.signUp({ email, password });
    };

    const signOut = async () => {
        if (isDemo) {
            // In demo mode, "sign out" might just reset state or do nothing, 
            // but let's allow it to clear any confusing state if needed.
            // For now, we stay in demo mode but effectively "logout" could mean clearing demo data?
            // Actually, let's just reload the page to reset.
            window.location.reload();
            return;
        }
        if (supabase) await supabase.auth.signOut();
    };

    const enterDemoMode = () => {
        setIsDemo(true);
    };

    const user = session?.user ?? (isDemo ? { id: 'demo-user', email: 'demo@gestor.com' } as User : null);

    return (
        <AuthContext.Provider value={{ session, user, loading, isDemo, signIn, signUp, signOut, enterDemoMode }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
