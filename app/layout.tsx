import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'https://getangie.com'),
  title: 'Fun Dates for Long Distance Relationships — 13 Realtime Games & Activities | Angie',
  description:
    'Angie is a hub of 13 realtime games and dates for long distance couples — a compatibility test, a future-planning date, riddles, an IQ duel, a couples quiz, debates, drawing, an arcade, and a photobooth that puts you both in one frame. Free to play, no app, just a code.',
  keywords: [
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
  },
  openGraph: {
    title: 'Fun Dates for Long Distance Relationships — 11 Realtime Games & Activities',
    description:
      'A hub of realtime games and dates for two screens in two places — riddles, an IQ duel, a couples quiz, debates, drawing, an arcade, and a photobooth that puts you both in one frame.',
    url: 'https://getangie.com/',
    siteName: 'Angie',
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'Angie — a photo strip with one partner in pink and one in blue, side by side in the same frame.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fun Dates for Long Distance Relationships — 15 Realtime Games & Dates | Angie',
    description:
      'Korean Life4Cuts photobooth, IQ Duel, couple quiz, debates, drawing, arcade, and memory keepsakes — a realtime date platform for two screens across any timezone.',
    images: ['/og.svg'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Angie Dates',
  },
};

import { AudioPlayer } from '@/components/shared/AudioPlayer';
import { ReactionBursts } from '@/components/shared/ReactionBursts';
import { ClickSpark } from '@/components/ui/ClickSpark';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#17181C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <AudioPlayer />
        <ReactionBursts />
        <ClickSpark />
      </body>
    </html>
  );
}
