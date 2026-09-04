import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Dearly Us ♡ — Made for the moments that belong to you two.',
  description:
    'Dearly Us is the realtime date night sanctuary and photobooth studio for couples separated by distance. 35+ interactive games, authentic Korean 인생네컷 photostrips, 3D memory vaults, and intimate keepsakes.',
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
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Dearly Us ♡ — Made for the moments that belong to you two.',
    description:
      'A realtime date sanctuary for couples — authentic Korean Life4Cuts photostrips, 3D memory vaults, interactive duels, and 35+ activities for two screens across any distance.',
    url: '/',
    siteName: 'Dearly Us',
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'Dearly Us — a photo strip with one partner in pink and one in blue, side by side in the same frame.',
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
    images: ['/og.svg'],
  },
};

import { GlobalExperience } from '@/components/shared/GlobalExperience';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1C1924" />
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var clean = function(el) {
                    if (!el || !el.removeAttribute) return;
                    el.removeAttribute('bis_skin_checked');
                    el.removeAttribute('bis_register');
                  };
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName && m.attributeName.indexOf('bis_') === 0) {
                        clean(m.target);
                      }
                    }
                  });
                  observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked', 'bis_register'] });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <GlobalExperience />
      </body>
    </html>
  );
}
