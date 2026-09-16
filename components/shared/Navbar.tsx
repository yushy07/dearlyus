'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpenText, Camera, Heart, Menu, ShoppingBag, Sparkles, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { AuthButton } from './AuthButton';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import styles from './Navbar.module.css';
import menuStyles from './NavbarCompactMenu.module.css';

interface NavbarProps { roomCode?: string; activityName?: string; rightAction?: React.ReactNode; onLeaveRoom?: () => void; variant?: 'default' | 'hero'; }

const links = [
  { href: '/activity', label: 'Date ideas', icon: Sparkles },
  { href: '/photobooth', label: 'Photobooth', icon: Camera },
  { href: '/our-space', label: 'Our Space', icon: Heart },
  { href: '/blog', label: 'Journal', icon: BookOpenText },
];

export function Navbar({ roomCode, activityName, rightAction, onLeaveRoom, variant = 'default' }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSupabaseSession();
  const { space, partnerConnected } = useCoupleSpace();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);
  const isInsideRoom = Boolean(roomCode);
  const leave = () => onLeaveRoom ? onLeaveRoom() : router.push('/our-space');
  return (
    <header className={`${styles.shell} ${variant === 'hero' ? styles.hero : ''}`} role="banner">
      <div className={styles.rail}>
        <Link className={styles.brand} href="/" aria-label="Dearly Us home"><BrandLogo tone="light" /></Link>
        {isInsideRoom ? <div className={styles.roomContext}><i aria-hidden="true" /><span>{activityName || 'Date night'}</span><b>{roomCode}</b></div> :
          <nav className={styles.links} aria-label="Main navigation">
            {links.map(({ href, label, icon: Icon }) => { const current = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} className={current ? styles.current : ''} aria-current={current ? 'page' : undefined}><Icon size={14} strokeWidth={1.8} /><span>{label}</span></Link>; })}
            <Link href="/shop" className={styles.shop} aria-label="Keepsake shop"><ShoppingBag size={15} /><span>Shop</span></Link>
          </nav>}
        <div className={styles.actions}>
          {isInsideRoom ? (
            rightAction || <><Link className={styles.quietAction} href={`/room/${roomCode}`}>Lobby</Link><button className={styles.leaveAction} onClick={leave}>Leave</button></>
          ) : (
            <>
              <AuthButton />
              {rightAction || <Link className={styles.primaryAction} href={user && partnerConnected && space?.activeRoomCode ? `/room/${space.activeRoomCode}` : '/activity'}>{user && partnerConnected ? 'Continue tonight' : 'Choose a date'} <span>↗</span></Link>}
              <button className={menuStyles.toggle} type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
            </>
          )}
        </div>
      </div>
      {!isInsideRoom && menuOpen && <nav id="site-menu" className={menuStyles.panel} aria-label="More pages">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}><Icon size={16} />{label}</Link>)}
        <Link href="/shop" onClick={() => setMenuOpen(false)}><ShoppingBag size={16} />Keepsake shop</Link>
        {user && <Link href="/profile?view=profile#my-profile" onClick={() => setMenuOpen(false)}>♡ My Profile</Link>}
      </nav>}
    </header>
  );
}
