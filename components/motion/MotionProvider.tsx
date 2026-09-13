'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import '@/styles/motion-system.css';

type MotionContextValue = { reducedMotion: boolean; pageVisible: boolean };
const MotionContext = createContext<MotionContextValue>({
  reducedMotion: false,
  pageVisible: true,
});

export function useMotionPreferences() {
  return useContext(MotionContext);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const stored = localStorage.getItem('dearly_reduced_motion');
      setReducedMotion(
        stored === 'true' || (stored !== 'false' && query.matches),
      );
    };
    update();
    query.addEventListener('change', update);
    window.addEventListener('storage', update);
    return () => {
      query.removeEventListener('change', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>(
        '[data-motion-reveal], main > section, main > article',
      ),
    );
    if (reducedMotion || !('IntersectionObserver' in window)) {
      candidates.forEach((element) => (element.dataset.motionVisible = 'true'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.motionVisible = 'true';
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08, rootMargin: '0px 0px -35px' },
    );
    candidates.forEach((element, index) => {
      element.dataset.motionIndex = String(index % 5);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [pathname, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;
    const move = (event: PointerEvent) => {
      root.style.setProperty(
        '--du-pointer-x',
        `${(event.clientX / innerWidth - 0.5).toFixed(3)}`,
      );
      root.style.setProperty(
        '--du-pointer-y',
        `${(event.clientY / innerHeight - 0.5).toFixed(3)}`,
      );
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [reducedMotion]);

  const value = useMemo(
    () => ({ reducedMotion, pageVisible }),
    [reducedMotion, pageVisible],
  );
  return (
    <MotionContext.Provider value={value}>
      <div
        ref={rootRef}
        key={pathname}
        className="du-motion-root"
        data-reduced-motion={reducedMotion}
        data-page-visible={pageVisible}
      >
        {children}
      </div>
    </MotionContext.Provider>
  );
}
