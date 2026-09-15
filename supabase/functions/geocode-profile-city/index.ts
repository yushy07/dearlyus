import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = request.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401, headers: cors });
    const body = await request.json();
    const city = String(body?.city || '').trim().slice(0, 80);
    if (!city) return Response.json({ error: 'CITY_REQUIRED' }, { status: 400, headers: cors });
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', city);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DearlyUs/1.0 (https://github.com/yushy07/dearlyus)',
        'Accept-Language': 'en',
      },
    });
    if (!response.ok) throw new Error('Geocoding unavailable');
    const [match] = await response.json();
    const latitude = Number(match?.lat);
    const longitude = Number(match?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
      return Response.json({ latitude: null, longitude: null }, { headers: cors });
    return Response.json({ latitude, longitude }, { headers: cors });
  } catch {
    return Response.json({ latitude: null, longitude: null }, { headers: cors });
  }
});
