import { ClientProviders } from '@/components/ClientProviders';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';

// Build: force redeploy with env vars
export const metadata: Metadata = {
  title: 'Gestor de Gastos',
  description: 'Aplicação profissional para gerenciar suas finanças',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>',
      },
    ],
  },
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
