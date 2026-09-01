'use client';

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { sounds } from '@/lib/sound';

interface ViewTransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  playClickSound?: boolean;
  soundType?: 'pop' | 'tick';
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  [key: string]: any;
}

export function ViewTransitionLink({
  href,
  children,
  className = '',
  style,
  playClickSound = true,
  soundType = 'tick',
  onClick,
  ...props
}: ViewTransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (playClickSound) {
      if (soundType === 'pop') {
        sounds.playPop();
      } else {
        sounds.playTick();
      }
    }

    if (onClick) {
      onClick(e);
    }

    // If external link, let default behavior happen
    const isExternal = typeof href === 'string' && (href.startsWith('http') || href.startsWith('//'));
    if (isExternal || e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }

    // Check for View Transitions API support
    const doc = document as any;
    if (doc.startViewTransition) {
      e.preventDefault();
      doc.startViewTransition(() => {
        router.push(href.toString());
      });
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={className} style={style} {...props}>
      {children}
    </Link>
  );
}
