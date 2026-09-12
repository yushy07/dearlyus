import { expect, test } from '@playwright/test';

test('Couples Court completes a playful private-turn round and prints its ruling', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/court');

  await expect(
    page.getByRole('heading', { name: 'Welcome to Couples Court' }),
  ).toBeVisible();
  await expect(page.getByText('About 3–5 minutes')).toBeVisible();
  await page.getByRole('button', { name: 'Call our Court to order' }).click();

  await page.getByRole('button', { name: /Snack sharing/ }).click();
  const statement = page.getByPlaceholder(
    'Here is what happened from my highly reliable perspective…',
  );
  await statement.fill(
    'I ordered one portion after my person said they were not hungry.',
  );
  await page.getByRole('button', { name: /That’s my side/ }).click();
  await statement.fill(
    'I requested only three fries and offered dessert in exchange.',
  );
  await page.getByRole('button', { name: /That’s my side/ }).click();

  await expect(
    page.getByRole('heading', { name: 'The tiny truth has unfolded' }),
  ).toBeVisible();
  await expect(page.getByText('I ordered one portion')).toBeVisible();
  await expect(page.getByText('I requested only three fries')).toBeVisible();
  await page
    .getByRole('button', { name: 'The cat influenced events!' })
    .click();
  await expect(
    page.getByText(/unreliable but very persuasive witness/),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Cupidot, compare our stories' })
    .click();

  await page.getByLabel('Mia').fill('Order enough fries for two.');
  await page.getByLabel('Alex').fill('Ask before taking the crispy ones.');
  await page.getByRole('button', { name: 'Reveal both answers' }).click();
  await page.getByRole('button', { name: 'One cuddle tax' }).click();

  await expect(
    page.getByRole('heading', {
      name: 'Both Stories Are Adorably Suspicious',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Judge, make it gentler' }).click();
  await expect(page.getByText(/Share one cosy moment today/)).toBeVisible();
  await page.getByRole('button', { name: 'We accept the ruling' }).click();
  await expect(page.getByText('YOUR RULING IS READY')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download ruling' }).click();
  await expect(download).resolves.toBeTruthy();

  const visibleText = (
    await page.locator('main').last().innerText()
  ).toLowerCase();
  expect(visibleText).not.toMatch(
    /plaintiff|defendant|jurisdiction|case filing/,
  );
});

test('Couples Court quietly redirects an unsuitable custom topic', async ({
  page,
}) => {
  await page.goto('/court');
  await page.getByRole('button', { name: 'Call our Court to order' }).click();
  await page
    .getByLabel('Or bring your own tiny matter')
    .fill('My partner threatened me');
  await page.getByRole('button', { name: 'Bring it in' }).click();
  await expect(
    page.getByText(/deserves a real conversation without my tiny gavel/),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'What requires Judge Cupidot’s attention?',
    }),
  ).toBeVisible();
});
