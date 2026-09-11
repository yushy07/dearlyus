import { test, expect } from '@playwright/test';

test('local activity routes render without a backend', async ({ browser }) => {
  test.setTimeout(90_000);
  // The interaction matrix remains manual until its two-tab steps are all recorded.
  const context = await browser.newContext();
  const partnerA = await context.newPage();
  const partnerB = await context.newPage();

  await Promise.all([partnerA.goto('/quiz'), partnerB.goto('/quiz')]);
  await expect(
    partnerA.getByRole('heading', { name: /Lock in privately/i }),
  ).toBeVisible();
  await expect(
    partnerB.getByRole('heading', { name: /Lock in privately/i }),
  ).toBeVisible();
  await partnerA.goto('/draw');
  await expect(partnerA.getByRole('main').locator('canvas')).toBeVisible();

  for (const route of [
    '/cards',
    '/host',
    '/match',
    '/court',
    '/dare',
    '/photobooth',
    '/passport',
    '/scrapbook',
    '/arcade',
    '/birthday',
    '/bucket',
    '/court',
    '/date',
    '/debate',
    '/fashion',
    '/forecast',
    '/future',
    '/hunt',
    '/iq',
    '/lab',
    '/letter',
    '/match',
    '/riddle',
    '/shirts',
    '/timezone',
  ]) {
    await partnerA.goto(route);
    await expect(partnerA.getByRole('main').last()).toBeVisible();
    const overflow = await partnerA.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} has horizontal desktop overflow`).toBeLessThanOrEqual(2);
  }
  await context.close();
});
