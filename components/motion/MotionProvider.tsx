'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
    const root = document.body;
    root.classList.add('du-motion-root');
    root.dataset.reducedMotion = String(reducedMotion);
    root.dataset.pageVisible = String(pageVisible);
  }, [reducedMotion, pageVisible]);

  useEffect(() => {
    const root = document.body;
    const selector = '[data-motion-reveal], main > section, main > article';
    const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector));
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
    const observe = (element: HTMLElement, index: number) => {
      if (element.dataset.motionObserved) return;
      element.dataset.motionObserved = 'true';
      element.dataset.motionIndex = String(index % 5);
      observer.observe(element);
    };
    candidates.forEach(observe);
    const mutations = new MutationObserver((records) =>
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(selector)) observe(node, 0);
          node.querySelectorAll<HTMLElement>(selector).forEach(observe);
        }),
      ),
    );
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const root = document.body;
    const move = (event: PointerEvent) => {
      root.style.setProperty(
        '--du-pointer-rotate-y',
        `${((event.clientX / innerWidth - 0.5) * 1.5).toFixed(2)}deg`,
      );
      root.style.setProperty(
        '--du-pointer-rotate-x',
        `${((event.clientY / innerHeight - 0.5) * -1).toFixed(2)}deg`,
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
      {children}
    </MotionContext.Provider>
  );
}
