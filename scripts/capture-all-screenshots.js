import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

async function run() {
  console.log('Launching browser for screenshot capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    permissions: ['camera', 'microphone'],
  });

  const page = await context.newPage();

  // Helper to wait for load and fonts
  const preparePage = async (url, waitExtra = 1500) => {
    await page.goto(url, { waitUntil: 'load' });
    try {
      await page.evaluate(() => document.fonts.ready);
    } catch {
      // ignore
    }
    await page.waitForTimeout(waitExtra);
  };

  // 1. Hero Cinematic (Top of Home)
  console.log('Capturing 01-hero-cinematic.png...');
  await preparePage(`${BASE_URL}/`, 2000);
  await page.screenshot({
    path: path.join(outDir, '01-hero-cinematic.png'),
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // 2. Co-Presence Bridge
  console.log('Capturing 08-copresence-bridge.png...');
  const bridgeEl = page.locator('.co-bridge-outer, [class*="co-bridge"]').first();
  if (await bridgeEl.count() > 0) {
    await bridgeEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    // Take screenshot of the bridge cards area
    await page.screenshot({
      path: path.join(outDir, '08-copresence-bridge.png'),
      clip: { x: 0, y: 120, width: 1440, height: 740 },
    });
  }

  // 3. Interactive Playground (3D Globe & Photobooth Machine)
  console.log('Capturing 02-interactive-playground.png...');
  const playgroundEl = page.locator('#playground, .interactive-playground').first();
  if (await playgroundEl.count() > 0) {
    await playgroundEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000); // Allow WebGL globe to render
    await page.screenshot({
      path: path.join(outDir, '02-interactive-playground.png'),
      clip: { x: 0, y: 100, width: 1440, height: 800 },
    });
  }

  // 4. Curated Sanctuary Journey Band (with new Keepsake Artwork & Garden Backdrop)
  console.log('Capturing 10-curated-journey-band.png...');
  const journeyEl = page.locator('#curated-journey .august-card').first();
  if (await journeyEl.count() > 0) {
    await journeyEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await journeyEl.screenshot({
      path: path.join(outDir, '10-curated-journey-band.png'),
    });
  }

  // 5. Activities Grid with KeepsakeArtwork (Letters, Scrapbook, Gifts)
  console.log('Capturing 09-home-activities-grid.png...');
  const spotEl = page.locator('#activities .spot').first();
  if (await spotEl.count() > 0) {
    await spotEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, '09-home-activities-grid.png'),
      clip: { x: 0, y: 80, width: 1440, height: 760 },
    });
  }

  // 6. Photobooth Studio (/photobooth)
  console.log('Capturing 04-photobooth-studio.png...');
  await preparePage(`${BASE_URL}/photobooth`, 2000);
  await page.screenshot({
    path: path.join(outDir, '04-photobooth-studio.png'),
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // 7. Full Activities Catalog (/activity)
  console.log('Capturing 03-activities-catalog.png...');
  await preparePage(`${BASE_URL}/activity`, 1500);
  await page.screenshot({
    path: path.join(outDir, '03-activities-catalog.png'),
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // 8. Our Space Sanctuary (/our-space)
  console.log('Capturing 05-our-space-sanctuary.png...');
  await preparePage(`${BASE_URL}/our-space`, 1500);
  await page.screenshot({
    path: path.join(outDir, '05-our-space-sanctuary.png'),
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // 9. Daily Love Forecast (/forecast)
  console.log('Capturing 06-daily-love-forecast.png...');
  await preparePage(`${BASE_URL}/forecast`, 1500);
  await page.screenshot({
    path: path.join(outDir, '06-daily-love-forecast.png'),
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // 10. Couple Quiz (/quiz)
  console.log('Capturing 07-couple-quiz-receipt.png...');
  await preparePage(`${BASE_URL}/quiz`, 1500);
  await page.screenshot({
    path: path.join(outDir, '07-couple-quiz-receipt.png'),
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  await browser.close();
  console.log('All screenshots successfully refreshed!');
}

run().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});
