'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect autenticado → dashboard
    if (user && !loading) {
      router.push('/dashboard');
    }
    // Redirect não autenticado → login (MVP sem landing)
    if (!user && !loading) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="text-neutral-600 font-medium">Carregando...</p>
      </div>
    </div>
  );
}
