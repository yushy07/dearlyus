import { test, expect } from '@playwright/test';
import path from 'node:path';
import { BACKDROPS } from '../../lib/booth/model';

test('all romantic scene artwork and selector thumbnails decode', async ({
  page,
}) => {
  await page.goto('/photobooth');
  const assets = Object.values(BACKDROPS).flatMap((scene) => [
    scene.image,
    scene.thumbnail,
  ]);
  const failed = await page.evaluate(async (sources) => {
    const results = await Promise.all(
      sources.map(
        (src) =>
          new Promise<string | null>((resolve) => {
            const image = new Image();
            image.onload = () =>
              resolve(
                image.naturalWidth > 0 && image.naturalHeight > 0 ? null : src,
              );
            image.onerror = () => resolve(src);
            image.src = src;
          }),
      ),
    );
    return results.filter(Boolean);
  }, assets);
  expect(failed).toEqual([]);
});

test('solo photobooth completes four uploads and downloads both print formats', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/photobooth');
  await page.getByRole('button', { name: 'Try the solo booth' }).click();
  await expect(page.getByText('BACKGROUND READY')).toBeVisible();
  await page.getByRole('button', { name: /Enter the booth/i }).click();

  const image = path.resolve('public/photos/frame1.webp');
  const picker = page.locator('input[type="file"]');
  for (let frame = 1; frame <= 4; frame += 1) {
    await page.getByRole('button', { name: `Select photo ${frame}` }).click();
    await picker.setInputFiles(image);
    await expect(
      page.getByRole('img', { name: 'Your left photo' }),
    ).toHaveCount(frame);
  }

  await page.getByRole('button', { name: /Review & decorate/i }).click();
  await expect(
    page.getByRole('button', { name: 'Ivory Korean Studio shared background' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('REMOVAL ON')).toBeVisible();
  const originals = page.getByRole('button', {
    name: 'Keep both original photo backgrounds',
  });
  await originals.click();
  await expect(originals).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Ivory Korean Studio shared background' })
    .click();
  await expect(page.getByText('Preparing your shared backdrop…')).toBeHidden({
    timeout: 30_000,
  });
  await page.getByRole('button', { name: /Ready to keep it/i }).click();
  await expect(page.getByText(/1200 × 3600/)).toBeVisible();

  const photoDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download our photo' }).click();
  expect((await photoDownload).suggestedFilename()).toContain('strip');

  const printDownload = page.waitForEvent('download');
  await page
    .getByRole('button', { name: /Download 4 × 6 print sheet/i })
    .click();
  expect((await printDownload).suggestedFilename()).toContain(
    '4x6-print-sheet',
  );
});
