import { ClientProviders } from '@/components/ClientProviders';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestor de Gastos',
  description: 'Aplicação profissional para gerenciar suas finanças',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className="page-shell">
        <ClientProviders>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </ClientProviders>
      </body>
    </html>
  );
}
