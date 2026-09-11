import { test, expect } from '@playwright/test';
import path from 'node:path';

test('solo photobooth completes four uploads and downloads both print formats', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/photobooth');
  await page.getByRole('button', { name: 'Try the solo booth' }).click();
  await page.getByRole('button', { name: /Enter the booth/i }).click();

  const image = path.resolve('public/photos/frame1.webp');
  const picker = page.locator('input[type="file"]');
  for (let frame = 1; frame <= 4; frame += 1) {
    await page.getByRole('button', { name: `Select photo ${frame}` }).click();
    await picker.setInputFiles(image);
    await expect(page.getByRole('img', { name: 'Your left photo' })).toHaveCount(frame);
  }

  await page.getByRole('button', { name: /Review & decorate/i }).click();
  await page.getByRole('button', { name: /Ready to keep it/i }).click();
  await expect(page.getByText(/1200 × 3600/)).toBeVisible();

  const photoDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download our photo' }).click();
  expect((await photoDownload).suggestedFilename()).toContain('strip');

  const printDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download 4 × 6 print sheet/i }).click();
  expect((await printDownload).suggestedFilename()).toContain('4x6-print-sheet');
});
