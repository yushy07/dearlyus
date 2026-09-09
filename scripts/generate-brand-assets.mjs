import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { BRAND_MARK_PATHS, BRAND_COLORS as colors } from '../lib/brand.ts';

const root = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(root, 'public');
const fontUrls = {
  normal:
    'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf',
  italic:
    'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_naUbtY.ttf',
};
const fonts = await Promise.all(
  Object.entries(fontUrls).map(async ([style, url]) => {
    const cache = path.join(os.tmpdir(), `dearly-playfair-600-${style}.ttf`);
    let data;
    try {
      data = await fs.readFile(cache);
    } catch {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Font download failed: ${response.status}`);
      data = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(cache, data);
    }
    return { name: 'Playfair', data, style, weight: 600 };
  }),
);
await initWasm(
  await fs.readFile(
    fileURLToPath(import.meta.resolve('@resvg/resvg-wasm/index_bg.wasm')),
  ),
);

const mark = (color) =>
  `<g fill="none" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${BRAND_MARK_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g>`;
const svg = (size, content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">${content}</svg>`;
const badge = (size) =>
  svg(
    size,
    `<rect width="128" height="128" rx="30" fill="${colors.paper}"/><g transform="translate(16 14) scale(1.5)">${mark(colors.rose)}</g>`,
  );
const dataUrl = (source) =>
  `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;
const renderPng = (source, width) => {
  const renderer = new Resvg(source, {
    fitTo: { mode: 'width', value: width },
  });
  const image = renderer.render();
  const result = Buffer.from(image.asPng());
  image.free();
  renderer.free();
  return result;
};

for (const tone of ['dark', 'light']) {
  const ink = tone === 'dark' ? colors.ink : colors.paper;
  const accent = tone === 'dark' ? colors.rose : colors.lightRose;
  const wordmark = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          fontFamily: 'Playfair',
          fontWeight: 600,
          fontSize: 54,
          letterSpacing: -2.5,
          color: ink,
        },
        children: [
          { type: 'span', props: { children: 'dearly' } },
          {
            type: 'span',
            props: {
              style: { marginLeft: 12, fontStyle: 'italic', color: accent },
              children: 'us.',
            },
          },
        ],
      },
    },
    { width: 290, height: 80, fonts },
  );
  const output = `<svg xmlns="http://www.w3.org/2000/svg" width="374" height="80" viewBox="0 0 374 80"><title>Dearly Us</title><g transform="scale(1.25)">${mark(accent)}</g><g transform="translate(84)">${wordmark}</g></svg>`;
  await fs.writeFile(
    path.join(publicDir, tone === 'dark' ? 'logo.svg' : 'logo-light.svg'),
    output,
  );
}
await fs.writeFile(
  path.join(publicDir, 'brand-mark.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><title>Dearly Us</title>${mark(colors.rose)}</svg>`,
);
await fs.writeFile(path.join(publicDir, 'favicon.svg'), badge(128));
for (const size of [192, 512]) {
  await fs.writeFile(
    path.join(publicDir, `icons/icon-${size}.svg`),
    badge(size),
  );
  await fs.writeFile(
    path.join(publicDir, `icons/icon-${size}.png`),
    renderPng(badge(size), size),
  );
}
await fs.writeFile(
  path.join(publicDir, 'apple-touch-icon.png'),
  renderPng(badge(180), 180),
);

// A standards-compliant ICO directory containing PNG images at common tab sizes.
const iconSizes = [16, 32, 48];
const frames = iconSizes.map((size) => renderPng(badge(size), size));
const directory = Buffer.alloc(6 + frames.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
frames.forEach((frame, i) => {
  const entry = 6 + i * 16;
  directory[entry] = iconSizes[i];
  directory[entry + 1] = iconSizes[i];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frame.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await fs.writeFile(
  path.join(publicDir, 'favicon.ico'),
  Buffer.concat([directory, ...frames]),
);

const logo = await fs.readFile(path.join(publicDir, 'logo.svg'), 'utf8');
const photo = await fs.readFile(
  path.join(publicDir, 'photos/dearly-strip.jpg'),
);
const social = await satori(
  {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: 64,
        background: colors.paper,
        color: colors.ink,
        fontFamily: 'Playfair',
        fontWeight: 600,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', width: 690 },
            children: [
              {
                type: 'img',
                props: { src: dataUrl(logo), width: 280, height: 60 },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    marginTop: 54,
                    fontSize: 58,
                    lineHeight: 1.15,
                    letterSpacing: -2,
                  },
                  children: 'Made for the moments that belong to you two.',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 30,
                    fontSize: 24,
                    fontStyle: 'italic',
                    color: colors.rose,
                  },
                  children: 'A little closer. Even from here.',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 'auto',
                    fontSize: 17,
                    color: colors.rose,
                  },
                  children: 'dearlyus.vercel.app',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignSelf: 'center',
              marginLeft: 36,
              padding: 14,
              paddingBottom: 32,
              background: '#fffdf8',
              transform: 'rotate(5deg)',
            },
            children: [
              {
                type: 'img',
                props: {
                  src: `data:image/jpeg;base64,${photo.toString('base64')}`,
                  width: 260,
                  height: 350,
                  style: { objectFit: 'cover' },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 18,
                    fontSize: 21,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    color: colors.rose,
                  },
                  children: 'you + me, always.',
                },
              },
            ],
          },
        },
      ],
    },
  },
  { width: 1200, height: 630, fonts },
);
await fs.writeFile(path.join(publicDir, 'og.svg'), social);
await fs.writeFile(path.join(publicDir, 'og.png'), renderPng(social, 1200));
console.log(
  'Generated shared logo, light variant, browser icons, app icons, and social preview.',
);
