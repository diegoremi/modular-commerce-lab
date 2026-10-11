import { test, expect } from '@playwright/test';

test('shows the product catalog', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Productos', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.product')).toHaveCount(8);
});
