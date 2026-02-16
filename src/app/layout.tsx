import { ClientProviders } from '@/components/ClientProviders';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';

// Build: force redeploy with env vars
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
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
