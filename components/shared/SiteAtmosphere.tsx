'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import '@/styles/site-atmosphere.css';

const keepsakes = new Set([
  '/letter',
  '/scrapbook',
  '/birthday',
  '/future',
  '/bucket',
  '/shop',
  '/passport',
]);
const conversations = new Set([
  '/quiz',
  '/cards',
  '/match',
  '/date',
  '/host',
  '/debate',
  '/court',
]);

/** Shared stationery and garden setting for the pages beyond the homepage. */
export function SiteAtmosphere({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') return <>{children}</>;
  const mood =
    pathname === '/arcade'
      ? 'night'
      : keepsakes.has(pathname)
        ? 'keepsake'
        : conversations.has(pathname)
          ? 'rose'
          : 'paper';
  return (
    <div className={`site-romantic site-romantic--${mood}`}>
      <div className="site-romantic-content">{children}</div>
    </div>
  );
}
