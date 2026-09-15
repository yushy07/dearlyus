export interface GeoPoint { lat: number; lng: number }
const CITIES: Record<string, GeoPoint> = {
  calgary:{lat:51.0447,lng:-114.0719},jakarta:{lat:-6.2088,lng:106.8456},delhi:{lat:28.6139,lng:77.209},'new delhi':{lat:28.6139,lng:77.209},
  mumbai:{lat:19.076,lng:72.8777},kolkata:{lat:22.5726,lng:88.3639},bangalore:{lat:12.9716,lng:77.5946},bengaluru:{lat:12.9716,lng:77.5946},
  chennai:{lat:13.0827,lng:80.2707},hyderabad:{lat:17.385,lng:78.4867},london:{lat:51.5072,lng:-0.1276},paris:{lat:48.8566,lng:2.3522},
  berlin:{lat:52.52,lng:13.405},toronto:{lat:43.6532,lng:-79.3832},vancouver:{lat:49.2827,lng:-123.1207},'new york':{lat:40.7128,lng:-74.006},
  'los angeles':{lat:34.0522,lng:-118.2437},seoul:{lat:37.5665,lng:126.978},tokyo:{lat:35.6762,lng:139.6503},singapore:{lat:1.3521,lng:103.8198},
  sydney:{lat:-33.8688,lng:151.2093},melbourne:{lat:-37.8136,lng:144.9631},dubai:{lat:25.2048,lng:55.2708},manila:{lat:14.5995,lng:120.9842},bangkok:{lat:13.7563,lng:100.5018},kathmandu:{lat:27.7172,lng:85.324},
};
const TIMEZONES: Record<string, GeoPoint> = {'Asia/Calcutta':CITIES.kolkata,'Asia/Kolkata':CITIES.kolkata,'America/Edmonton':CITIES.calgary,'Asia/Jakarta':CITIES.jakarta,'Europe/London':CITIES.london,'Europe/Paris':CITIES.paris,'Asia/Seoul':CITIES.seoul,'Asia/Tokyo':CITIES.tokyo,'America/Toronto':CITIES.toronto,'America/Vancouver':CITIES.vancouver};
export function resolveCityCoordinates(city?:string,timezone?:string,fallback:GeoPoint={lat:0,lng:0}):GeoPoint {
  const normalized=(city||'').toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
  return CITIES[normalized] || Object.entries(CITIES).find(([name])=>normalized.includes(name))?.[1] || (timezone?TIMEZONES[timezone]:undefined) || fallback;
}
