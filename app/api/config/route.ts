import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    appName: 'Angie',
    tagline: 'Realtime date night & synced photobooth for long distance couples',
    freeFeatures: [
      'Synced Photobooth (4-cut 인생네컷)',
      '17 Couples Quiz Packs',
      'Personality Compatibility Test',
      'Draw Together Shared Canvas',
      'Arcade Face Battle',
      'Fashion Show with AI Runway Judge',
      'Honest Cards & Truth or Dare',
      'Letters to the Future Time Capsule',
      'Our Future Vision Board',
      'Couples Court Case Trials',
    ],
    pricing: {
      magnetTwinPack: { priceUSD: 12.0, freeWorldwideShipping: true },
      shirtsTwinPack: { priceUSD: 38.0, freeWorldwideShipping: true },
      phoneCaseTwinPack: { priceUSD: 24.0, freeWorldwideShipping: true },
      photobookHardcover: { priceUSD: 34.0, freeWorldwideShipping: true },
    },
    version: '2.8.4',
  };

  return NextResponse.json(config);
}
