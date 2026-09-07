import { test, expect } from '@playwright/test';

test('Cupidot supports keyboard, selected responses, quiet mode and small screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto('/');
  const launcher = page.getByRole('button', {
    name: 'Open Cupidot',
    exact: true,
  });
  await expect(launcher).toBeEnabled();
  await launcher.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'A little time with Cupidot',
  });
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Find us a little moment' }).click();
  const options = page
    .getByRole('group', { name: 'Your response' })
    .getByRole('button');
  await options.first().click();
  await expect(options.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByText(
      'Just a conversation starter. Your choice isn’t saved or sent to your partner.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Quiet', exact: false }).click();
  await expect(
    page.getByText('Quiet moments stay silent, whatever your voice setting.'),
  ).toBeVisible();
  await expect(
    page
      .getByRole('group', { name: 'Your response' })
      .locator('[aria-pressed="true"]'),
  ).toHaveCount(0);
  await page.screenshot({
    path: 'outputs/cupidot-mobile.png',
    fullPage: false,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await launcher.click();
  await page.screenshot({
    path: 'outputs/cupidot-desktop.png',
    fullPage: false,
  });
});
