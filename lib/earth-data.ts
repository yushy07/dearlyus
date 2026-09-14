/**
 * High-definition procedural Earth data, continent geometry, and texture synthesizers.
 * Designed for pure Canvas/WebGL rendering without external image dependencies.
 */
import * as THREE from 'three';

// Coordinate pairs: [latitude, longitude] (-90 to +90, -180 to +180)
export const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // North America (Alaska, Canada, USA, Mexico, Central America)
  [
    [71, -156],
    [71, -128],
    [69, -135],
    [74, -120],
    [70, -100],
    [60, -95],
    [63, -80],
    [62, -75],
    [58, -62],
    [47, -53],
    [44, -66],
    [41, -71],
    [35, -75],
    [30, -81],
    [25, -80],
    [25, -82],
    [30, -88],
    [29, -95],
    [26, -97],
    [22, -98],
    [19, -96],
    [16, -93],
    [14, -88],
    [10, -84],
    [8, -77],
    [7, -81],
    [9, -84],
    [14, -92],
    [16, -98],
    [20, -105],
    [23, -110],
    [32, -117],
    [37, -122],
    [42, -124],
    [48, -124],
    [54, -130],
    [58, -136],
    [60, -140],
    [59, -152],
    [54, -164],
    [57, -170],
    [65, -168],
    [71, -156],
  ],
  // Greenland
  [
    [60, -45],
    [64, -40],
    [70, -22],
    [76, -18],
    [82, -24],
    [83, -35],
    [81, -55],
    [78, -70],
    [73, -55],
    [65, -52],
    [60, -45],
  ],
  // South America
  [
    [12, -72],
    [10, -62],
    [6, -53],
    [-1, -48],
    [-5, -35],
    [-12, -37],
    [-23, -42],
    [-32, -52],
    [-38, -58],
    [-46, -65],
    [-55, -67],
    [-53, -71],
    [-45, -74],
    [-33, -71],
    [-18, -70],
    [-5, -81],
    [2, -79],
    [8, -77],
    [12, -72],
  ],
  // Europe & Scandinavia
  [
    [71, 28],
    [68, 30],
    [64, 20],
    [60, 25],
    [56, 12],
    [54, 18],
    [55, 8],
    [54, -1],
    [50, -4],
    [48, -4],
    [44, -1],
    [43, -9],
    [37, -9],
    [36, -5],
    [37, 0],
    [42, 3],
    [43, 7],
    [40, 18],
    [37, 23],
    [40, 27],
    [45, 30],
    [46, 32],
    [50, 28],
    [55, 35],
    [60, 45],
    [68, 48],
    [70, 32],
    [71, 28],
  ],
  // British Isles
  [
    [50, -5],
    [52, -5],
    [54, -3],
    [58, -5],
    [58, -3],
    [55, -1],
    [51, 1],
    [50, -5],
  ],
  // Ireland
  [
    [51.5, -10],
    [54, -10],
    [55.3, -7],
    [53.5, -6],
    [52, -6.5],
    [51.5, -10],
  ],
  // Africa & Madagascar
  [
    [37, 10],
    [36, 1],
    [35, -5],
    [31, -10],
    [28, -13],
    [21, -17],
    [15, -17],
    [10, -14],
    [5, -3],
    [4, 7],
    [4, 9],
    [2, 10],
    [-5, 12],
    [-15, 12],
    [-22, 14],
    [-30, 17],
    [-34, 19],
    [-34, 26],
    [-28, 32],
    [-16, 40],
    [-10, 40],
    [-4, 39],
    [5, 48],
    [12, 51],
    [12, 44],
    [15, 42],
    [22, 37],
    [28, 34],
    [31, 32],
    [32, 25],
    [37, 10],
  ],
  // Madagascar
  [
    [-12, 49],
    [-16, 50],
    [-25, 47],
    [-25, 44],
    [-16, 44],
    [-12, 49],
  ],
  // Asia (Eurasian landmass)
  [
    [40, 30],
    [45, 36],
    [42, 45],
    [40, 50],
    [50, 50],
    [60, 60],
    [70, 70],
    [75, 80],
    [77, 105],
    [74, 135],
    [70, 160],
    [66, 170],
    [60, 165],
    [55, 162],
    [50, 142],
    [43, 132],
    [40, 120],
    [35, 120],
    [31, 122],
    [25, 119],
    [22, 114],
    [20, 107],
    [12, 109],
    [6, 108],
    [1, 104],
    [4, 103],
    [10, 100],
    [16, 96],
    [22, 92],
    [22, 89],
    [21, 87],
    [16, 82],
    [10, 80],
    [8, 77],
    [10, 76],
    [15, 74],
    [20, 73],
    [24, 68],
    [26, 70],
    [30, 75],
    [26, 80],
    [24, 88],
    [24, 58],
    [27, 50],
    [30, 48],
    [38, 44],
    [35, 36],
    [32, 35],
    [30, 32],
    [32, 25],
    [40, 30],
  ],
  // Korean Peninsula
  [
    [38, 126],
    [40, 128],
    [38, 129],
    [35, 129],
    [34.5, 127],
    [36, 126],
    [38, 126],
  ],
  // Japan (Honshu & Hokkaido)
  [
    [45, 142],
    [42, 144],
    [40, 140],
    [35, 136],
    [34, 132],
    [33, 130],
    [35, 133],
    [37, 138],
    [40, 140],
    [43, 141],
    [45, 142],
  ],
  // Indonesian Archipelago & Southeast Asia
  // Sumatra
  [
    [5, 96],
    [2, 98],
    [-3, 102],
    [-6, 105],
    [-4, 106],
    [0, 103],
    [3, 99],
    [5, 96],
  ],
  // Java (Jakarta at -6.2, 106.8)
  [
    [-6.0, 105.5],
    [-6.2, 106.8],
    [-6.9, 109.0],
    [-7.5, 112.5],
    [-8.2, 114.5],
    [-8.8, 114.0],
    [-7.7, 109.0],
    [-6.8, 106.0],
    [-6.0, 105.5],
  ],
  // Borneo
  [
    [7, 117],
    [4, 118],
    [1, 119],
    [-3, 116],
    [-4, 114],
    [-3, 110],
    [1, 109],
    [4, 114],
    [7, 117],
  ],
  // Sulawesi
  [
    [1.5, 121],
    [1, 125],
    [-2, 121],
    [-5, 120],
    [-4, 122],
    [0, 120],
    [1.5, 121],
  ],
  // Philippines
  [
    [18, 121],
    [15, 120],
    [13, 124],
    [8, 126],
    [6, 125],
    [10, 123],
    [14, 120],
    [18, 121],
  ],
  // Australia
  [
    [-12, 131],
    [-12, 136],
    [-15, 136],
    [-11, 142],
    [-20, 149],
    [-28, 153],
    [-37, 150],
    [-38, 145],
    [-35, 138],
    [-32, 132],
    [-35, 118],
    [-32, 115],
    [-22, 114],
    [-17, 122],
    [-14, 126],
    [-12, 131],
  ],
  // New Zealand (North & South Islands)
  [
    [-35, 173],
    [-37, 178],
    [-41, 175],
    [-46, 168],
    [-44, 171],
    [-38, 174],
    [-35, 173],
  ],
  // Antarctica
  [
    [-65, -60],
    [-70, -10],
    [-67, 40],
    [-66, 90],
    [-65, 140],
    [-70, 170],
    [-75, -170],
    [-72, -120],
    [-70, -80],
    [-65, -60],
  ],
];

// Major global city light hubs: [lat, lng, radius, brightness]
export const CITY_LIGHTS: Array<[number, number, number, number]> = [
  // North America
  [51.0447, -114.0719, 4, 1.0], // Calgary
  [49.2827, -123.1207, 3.5, 0.9], // Vancouver
  [47.6062, -122.3321, 3.5, 0.9], // Seattle
  [37.7749, -122.4194, 4.5, 1.0], // San Francisco
  [34.0522, -118.2437, 5.5, 1.0], // Los Angeles
  [41.8781, -87.6298, 4.5, 0.95], // Chicago
  [40.7128, -74.006, 6.0, 1.0], // New York
  [43.6532, -79.3832, 4.0, 0.9], // Toronto
  [19.4326, -99.1332, 5.0, 0.95], // Mexico City
  // South America
  [-23.5505, -46.6333, 5.0, 0.9], // São Paulo
  [-22.9068, -43.1729, 4.0, 0.85], // Rio de Janeiro
  [-34.6037, -58.3816, 4.5, 0.85], // Buenos Aires
  // Europe
  [51.5074, -0.1278, 5.0, 1.0], // London
  [48.8566, 2.3522, 5.0, 1.0], // Paris
  [52.52, 13.405, 4.0, 0.9], // Berlin
  [40.4168, -3.7038, 4.0, 0.85], // Madrid
  [41.9028, 12.4964, 4.0, 0.85], // Rome
  // Africa & Middle East
  [30.0444, 31.2357, 4.5, 0.9], // Cairo
  [25.2048, 55.2708, 4.5, 1.0], // Dubai
  [-26.2041, 28.0473, 4.0, 0.8], // Johannesburg
  // Asia
  [28.6139, 77.209, 5.5, 1.0], // Delhi
  [19.076, 72.8777, 5.0, 0.95], // Mumbai
  [1.3521, 103.8198, 4.5, 1.0], // Singapore
  [-6.2088, 106.8456, 5.5, 1.0], // Jakarta
  [13.7563, 100.5018, 4.5, 0.9], // Bangkok
  [22.3193, 114.1694, 5.0, 1.0], // Hong Kong
  [31.2304, 121.4737, 5.5, 1.0], // Shanghai
  [39.9042, 116.4074, 5.5, 1.0], // Beijing
  [37.5665, 126.978, 5.0, 1.0], // Seoul
  [35.6762, 139.6503, 6.0, 1.0], // Tokyo
  [34.6937, 135.5023, 4.5, 0.95], // Osaka
  // Australia
  [-33.8688, 151.2093, 4.5, 0.9], // Sydney
  [-37.8136, 144.9631, 4.0, 0.85], // Melbourne
];

/**
 * Converts geographical (latitude, longitude) into 3D Cartesian coordinates on a sphere.
 * In Three.js standard coordinates:
 * lat: -90 (South) to +90 (North)
 * lng: -180 (West) to +180 (East)
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Generates an elevated 3D great-circle arc between two geographical points.
 * Peaks gently at mid-flight above the globe surface.
 */
export function createGeodesicPoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  radius: number,
  peakAltitude = 0.28,
  steps = 80,
): THREE.Vector3[] {
  const v1 = latLngToVector3(startLat, startLng, radius).normalize();
  const v2 = latLngToVector3(endLat, endLng, radius).normalize();

  // Angular separation between vectors
  const dot = Math.min(1, Math.max(-1, v1.dot(v2)));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);

  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let interpolated: THREE.Vector3;

    if (sinOmega > 0.0001) {
      // Slerp (Spherical Linear Interpolation)
      const scale1 = Math.sin((1 - t) * omega) / sinOmega;
      const scale2 = Math.sin(t * omega) / sinOmega;
      interpolated = v1
        .clone()
        .multiplyScalar(scale1)
        .add(v2.clone().multiplyScalar(scale2));
    } else {
      interpolated = v1.clone().lerp(v2, t);
    }

    interpolated.normalize();
    // Parabolic altitude lift over flight
    const altitude = Math.sin(t * Math.PI) * (radius * peakAltitude);
    interpolated.multiplyScalar(radius + altitude);
    points.push(interpolated);
  }

  return points;
}

/**
 * Procedurally generates an ultra-crisp high-res equirectangular Earth texture on an offscreen canvas.
 * Blends deep midnight celestial oceans with warm champagne continents and glowing city lights.
 */
export function generateEarthTexture(
  width = 2048,
  height = 1024,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Celestial Ocean Background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#100c16'); // Polar deep
  oceanGrad.addColorStop(0.2, '#15101d');
  oceanGrad.addColorStop(0.5, '#1e1628'); // Tropical warm deep
  oceanGrad.addColorStop(0.8, '#15101d');
  oceanGrad.addColorStop(1, '#100c16');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle ocean bathymetry / current texture
  ctx.fillStyle = 'rgba(78, 56, 92, 0.08)';
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * height;
    const h = 8 + Math.random() * 24;
    ctx.fillRect(0, y, width, h);
  }

  // 2. Graticule Lat/Lng grid
  ctx.strokeStyle = 'rgba(235, 215, 240, 0.06)';
  ctx.lineWidth = 1;
  // Parallels
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // Meridians
  for (let lng = -150; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator highlight
  ctx.strokeStyle = 'rgba(255, 214, 138, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // 3. Continents & Landmasses
  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  CONTINENT_POLYGONS.forEach((polygon) => {
    if (polygon.length < 3) return;

    // Land Base Fill
    ctx.beginPath();
    ctx.moveTo(toX(polygon[0][1]), toY(polygon[0][0]));
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(toX(polygon[i][1]), toY(polygon[i][0]));
    }
    ctx.closePath();

    // Warm terracotta / champagne land gradient
    ctx.fillStyle = 'rgba(196, 163, 145, 0.42)';
    ctx.fill();

    // Land Shading & Shoreline glow
    ctx.strokeStyle = 'rgba(255, 235, 220, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Subtle inner coastline blur for tactile depth
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
    ctx.lineWidth = 4.5;
    ctx.stroke();
  });

  // 4. Urban Night Light Constellations
  CITY_LIGHTS.forEach(([lat, lng, radius, brightness]) => {
    const cx = toX(lng);
    const cy = toY(lat);

    // Outer warm gold halo
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3.5);
    glow.addColorStop(0, `rgba(255, 220, 130, ${brightness * 0.95})`);
    glow.addColorStop(0.35, `rgba(251, 191, 36, ${brightness * 0.55})`);
    glow.addColorStop(0.7, `rgba(244, 114, 182, ${brightness * 0.2})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Brilliant white-gold center core
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.95})`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.2, radius * 0.4), 0, Math.PI * 2);
    ctx.fill();
  });

  // Additional micro-lights scattered across continents for realistic urban density
  ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
  for (let i = 0; i < 180; i++) {
    // Random jitter around major continents
    const lat = 10 + Math.random() * 50;
    const lng = -120 + Math.random() * 240;
    const x = toX(lng);
    const y = toY(lat);
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  return canvas;
}

/**
 * Procedural atmospheric cloud texture with natural weather bands.
 */
export function generateCloudTexture(
  width = 1024,
  height = 512,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Soft atmospheric mist bands
  const bands = 14;
  for (let i = 0; i < bands; i++) {
    const lat = -50 + (i / bands) * 110;
    const y = ((90 - lat) / 180) * height;

    const grad = ctx.createLinearGradient(0, y - 20, 0, y + 20);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.16)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 20, width, 40);
  }

  // Cloud swirls across mid-latitudes and tropics
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width;
    const y = 80 + Math.random() * (height - 160);
    const rx = 30 + Math.random() * 70;
    const ry = 8 + Math.random() * 18;

    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}
