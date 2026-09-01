import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    appName: 'Angie',
    tagline: '100% Free realtime date night & synced photobooth for long distance couples worldwide',
    pricing: {
      status: '100% Free Forever',
      costUSD: 0,
      subscriptions: false,
      paywalls: false,
    },
    freeFeatures: [
      'Synced Photobooth (4-cut 인생네컷) with Motion Strips & Neon Doodling',
      'Timezone & Sun/Moon Horizon Hub with Overlap Calculator',
      '100 Dates Bucket List & Scratch-Off Map',
      'Custom Lore Quiz Creator & 17 Couples Packs',
      'Double-Blind Love Match Compatibility Test',
      'Draw Together Live Shared Canvas',
      'Face Avatar Arcade Minigames',
      'Player-vs-Player Fashion Show Runway',
      'Honest Cards & Truth or Dare Tiers',
      'Multi-Year Time Capsule Letter Vault',
      'Interactive Shared Corkboard Scrapbook',
      'Parallel Kitchen Cooking Duel with Timers',
      'Procedural Ambient Soundscapes (Rain & Fireplace)',
      'High-Res 4×6 DIY Printable Photo Sheets & Wallpapers',
      'Matching Couple Outfit Digital Designer',
    ],
    version: '3.0.0-free',
  };

  return NextResponse.json(config);
}
