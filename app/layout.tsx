import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/styles/activity-motion.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Dearly Us ♡ — Made for the moments that belong to you two.',
  description:
    'Dearly Us is the realtime date night sanctuary and photobooth studio for couples separated by distance. Explore 24 interactive activities, authentic Korean 인생네컷 photostrips, 3D memory vaults, and intimate keepsakes.',
  keywords: [
    'dearly us',
    'fun dates for long distance relationships',
    'long distance date ideas',
    'long distance couple games',
    'games to play with your long distance boyfriend girlfriend',
    'virtual dates for couples',
    'things to do long distance couples',
    'online games for couples',
    'couples quiz online',
    'riddles for couples',
    'online photobooth for long distance couples',
    '인생네컷 online',
  ],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Dearly Us ♡ — Made for the moments that belong to you two.',
    description:
      'A realtime date sanctuary for couples — authentic Korean Life4Cuts photostrips, 3D memory vaults, interactive duels, and 24 activities for two screens across any distance.',
    url: '/',
    siteName: 'Dearly Us',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Dearly Us — our intertwined heart logo beside a keepsake photo strip for two.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dearly Us ♡ — Made for the moments that belong to you two.',
    description:
      'Korean Life4Cuts photobooth, IQ Duel, couple quiz, debates, drawing, arcade, and memory keepsakes — a realtime date platform for two screens across any timezone.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#1C1924',
};

import { GlobalExperience } from '@/components/shared/GlobalExperience';
import { AppProviders } from '@/components/providers/AppProviders';
import { SiteAtmosphere } from '@/components/shared/SiteAtmosphere';
import { MotionProvider } from '@/components/motion/MotionProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>
          <MotionProvider>
            <SiteAtmosphere>{children}</SiteAtmosphere>
            <GlobalExperience />
          </MotionProvider>
        </AppProviders>
      </body>
    </html>
  );
}
