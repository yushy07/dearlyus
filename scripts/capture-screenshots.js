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

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  console.log('Capturing Co-Presence Bridge...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.scrollTo({ top: 800, behavior: 'instant' });
  });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(outDir, '08-copresence-bridge.png'),
    clip: { x: 0, y: 0, width: 1440, height: 750 },
  });

  console.log('Capturing Home Activities Grid...');
  await page.evaluate(() => {
    window.scrollTo({ top: 2200, behavior: 'instant' });
  });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(outDir, '09-home-activities-grid.png'),
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  await browser.close();
  console.log('Extra screenshots successfully captured!');
}

capture().catch((err) => {
  console.error('Failed capturing screenshots:', err);
  process.exit(1);
});
