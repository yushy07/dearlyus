'use client';

import { useEffect, useRef } from 'react';

/** Decorative scenery only. Suspend motion outside the viewport and in hidden tabs. */
export function SceneBackdrop({
  scene,
}: {
  scene: 'landscape' | 'garden' | 'studio';
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    const host = element?.parentElement;
    if (!element || !host) return;
    let visible = false;
    const update = () => {
      host.dataset.sceneActive = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(host);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      delete host.dataset.sceneActive;
    };
  }, []);

  return (
    <span
      ref={ref}
      className={`scene-backdrop scene-backdrop--${scene}`}
      aria-hidden="true"
    >
      {scene === 'landscape' && (
        <img
          className="scene-garden-photo"
          src="/scenes/garden-evening.png"
          width="1536"
          height="1024"
          alt=""
          loading="lazy"
        />
      )}
      {scene === 'garden' && (
        <svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice">
          <g className="scene-leaves" fill="#354337" opacity=".38">
            <path
              d="M620 50Q440 150 445 430"
              fill="none"
              stroke="#354337"
              strokeWidth="4"
            />
            <path d="M525 126Q445 48 462 146Q490 166 525 126ZM491 171Q565 123 543 214Q512 231 491 171ZM470 231Q382 181 415 266Q444 285 470 231ZM452 299Q528 260 505 336Q475 357 452 299ZM446 367Q380 320 397 404Q427 420 446 367Z" />
          </g>
        </svg>
      )}
      {scene === 'studio' && (
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
          <g
            className="scene-window"
            fill="#e6dfd0"
            opacity=".045"
            transform="skewX(-24)"
          >
            <path d="M1050-100h180v460h-180zM1260-100h180v460h-180zM1050 395h180v600h-180zM1260 395h180v600h-180z" />
          </g>
        </svg>
      )}
    </span>
  );
}
