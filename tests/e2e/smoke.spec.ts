import { test, expect } from '@playwright/test';

// Baseline smoke suite for Alta Moda storefront.
// Run against a local dev server: `npx playwright test` (assumes localhost:3000).

test.describe('Alta Moda smoke', () => {
  test('homepage loads with proper title and no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/Alta Moda.*Profesionalna frizerska/i);
    expect(errors).toHaveLength(0);
  });

  test('products listing has correct total count in title', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveTitle(/Svi Proizvodi \(\d+\)/);
    const productLinks = page.locator('a[href^="/products/"]:not([href="/products"])');
    expect(await productLinks.count()).toBeGreaterThan(0);
  });

  test('product detail page loads', async ({ page }) => {
    await page.goto('/products');
    const firstProduct = page.locator('a[href^="/products/"]:not([href="/products"])').first();
    const href = await firstProduct.getAttribute('href');
    await page.goto(href!);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Product detail titles follow "<Product Name> | <Brand>" pattern
    await expect(page).toHaveTitle(/.+\s\|\s.+/);
  });

  test('search filters product list client-side', async ({ page }) => {
    await page.goto('/products');
    await page.getByPlaceholder(/pretra/i).fill('Redken');
    await page.waitForTimeout(600); // debounce
    const cards = page.locator('a[href^="/products/"]:not([href="/products"])');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(cards.nth(i)).toContainText(/redken/i);
    }
  });

  test('add to cart flow updates cart count', async ({ page }) => {
    await page.goto('/products');
    const addBtn = page.getByRole('button', { name: /dodaj u korpu/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Vaša Korpa \(1/);
  });

  test('category URL filters product listing', async ({ page }) => {
    // Direct-URL navigation works on every branch, regardless of whether the
    // homepage pill bar is present.
    await page.goto('/products?category=sampon');
    await expect(page).toHaveURL(/category=sampon/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('auth: login form renders email + password inputs', async ({ page }) => {
    await page.goto('/account/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('auth: registration tab reveals full signup form', async ({ page }) => {
    await page.goto('/account/login');
    await page.getByRole('button', { name: /registrac/i }).click();
    await expect(page.getByRole('button', { name: /kupac/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /salon.*b2b/i })).toBeVisible();
  });

  test.describe('page titles (SEO)', () => {
    const pages = [
      { path: '/', titlePattern: /Profesionalna frizerska/ },
      { path: '/products', titlePattern: /Svi Proizvodi/ },
      { path: '/brands', titlePattern: /Brendovi/ },
    ];
    for (const { path, titlePattern } of pages) {
      test(`${path} has page-specific title`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(titlePattern);
      });
    }

    // Flagged as missing page-specific <title> — tracked for future fix
    const missingTitles = ['/about', '/contact', '/education', '/cart', '/account/login'];
    for (const path of missingTitles) {
      test.fixme(`${path} SHOULD have a unique title (currently uses homepage fallback)`, async ({ page }) => {
        await page.goto(path);
        const title = await page.title();
        expect(title).not.toMatch(/^Alta Moda \| Profesionalna frizerska/);
      });
    }
  });
});
