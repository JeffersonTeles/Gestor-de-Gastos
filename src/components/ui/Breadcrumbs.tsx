'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transações',
  budgets: 'Orçamentos',
  bills: 'Contas',
  loans: 'Empréstimos',
  analytics: 'Análises',
  settings: 'Configurações',
  profile: 'Perfil',
};

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const pathname = usePathname();

  const breadcrumbs = items || (() => {
    const paths = pathname?.split('/').filter(Boolean) || [];
    return paths.map((path, index) => ({
      label: routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1),
      href: '/' + paths.slice(0, index + 1).join('/'),
    }));
  })();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link 
        href="/" 
        className="text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {index === breadcrumbs.length - 1 ? (
            <span className="text-neutral-900 font-medium">{item.label}</span>
          ) : (
            <Link 
              href={item.href}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
