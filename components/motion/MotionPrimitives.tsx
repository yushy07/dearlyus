'use client';

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

type MotionBoxProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function ChapterReveal({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-chapter-reveal ${className}`} data-motion-reveal {...props}>
      {children}
    </div>
  );
}

export function PaperCard({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-paper-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function InkStamp({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-ink-stamp ${className}`} role="status" {...props}>
      {children}
    </div>
  );
}

export function FoldedLetter({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-folded-letter ${className}`} {...props}>
      <div className="du-folded-letter__paper">{children}</div>
    </div>
  );
}

export function DevelopingPhoto({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-developing-photo ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CurtainTransition({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-curtain-transition ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SharedThread({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-shared-thread ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DepthTilt({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-depth-tilt ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ObjectStage({ children, className = '', ...props }: MotionBoxProps) {
  return (
    <div className={`du-object-stage ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PhysicalButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`du-physical-button ${className}`} {...props} />;
}

export function MotionStatus({
  children,
  tone = 'loading',
  className = '',
  ...props
}: MotionBoxProps & { tone?: 'loading' | 'success' | 'error' | 'waiting' }) {
  return (
    <div className={`du-motion-status du-motion-status--${tone} ${className}`} role="status" {...props}>
      <span className="du-motion-status__mark" aria-hidden="true" />
      {children}
    </div>
  );
}
