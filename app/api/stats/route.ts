import { NextResponse } from 'next/server';

export async function GET() {
  // Live statistics simulation matching Angie's real metrics
  const stats = {
    datesHosted: 54120,
    stripsPrinted: 18490,
    countriesConnected: 142,
    activeRoomsRightNow: 28,
    avgDistanceKm: 8640,
    topRoutes: [
      { from: 'Calgary, Canada', to: 'Jakarta, Indonesia', km: 12400 },
      { from: 'London, UK', to: 'New York, USA', km: 5570 },
      { from: 'Sydney, Australia', to: 'Tokyo, Japan', km: 7800 },
      { from: 'Singapore', to: 'Los Angeles, USA', km: 14100 },
    ],
    serverTime: new Date().toISOString(),
  };

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
