import { test, expect } from '@playwright/test';

test('shows the product catalog', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Productos', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.product')).toHaveCount(8);
});

test('searches by name and category, handles no matches, and restores the catalog', async ({
  page,
}) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', {
    name: 'Buscar productos por nombre o categoría',
  });
  const products = page.locator('.product');
  await expect(products).toHaveCount(8);

  await search.fill('Product 2');
  await expect(products).toHaveCount(1);
  await expect(products.getByRole('heading')).toHaveText('Product 2');

  await search.fill('  CATEGORY B  ');
  await expect(products).toHaveCount(3);
  await expect(products.getByRole('heading')).toHaveText([
    'Product 2',
    'Product 5',
    'Product 8',
  ]);

  await search.fill('no-match');
  await expect(
    page.getByText('No se encontraron productos.', { exact: true }),
  ).toBeVisible();
  await expect(products).toHaveCount(0);

  await search.clear();
  await expect(products).toHaveCount(8);
});
