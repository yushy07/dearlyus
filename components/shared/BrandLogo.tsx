import { BRAND_MARK_PATHS } from '@/lib/brand';
import styles from './BrandLogo.module.css';

type BrandLogoProps = {
  tone?: 'light' | 'dark';
  size?: 'small' | 'large';
};

/** One brand lockup for navigation, game headers and account screens. */
export function BrandLogo({ tone = 'dark', size = 'small' }: BrandLogoProps) {
  return (
    <span
      className={`${styles.logo} ${styles[tone]} ${styles[size]}`}
      role="img"
      aria-label="Dearly Us"
    >
      <svg
        className={styles.mark}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        {BRAND_MARK_PATHS.map((path) => (
          <path
            key={path}
            d={path}
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <span className={styles.wordmark} aria-hidden="true">
        dearly <em>us</em>
        <span className={styles.period}>.</span>
      </span>
    </span>
  );
}
