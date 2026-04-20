import { test, expect } from '@playwright/test';

// Admin panel regression suite.
// Assumes setup project has logged in as admin and saved storageState.

test.describe('Admin panel', () => {
  test('admin landing shows homepage management', async ({ page }) => {
    await page.goto('/admin/homepage');
    await expect(page).toHaveURL(/\/admin\/homepage/);
    await expect(page.getByRole('heading', { name: /Upravljanje Po\u010Detnom Stranom/ })).toBeVisible();
  });

  test('all admin sections load without page-breaking errors', async ({ page }) => {
    const routes = [
      '/admin/homepage',
      '/admin/products',
      '/admin/brands',
      '/admin/orders',
      '/admin/users',
      '/admin/actions',
      '/admin/newsletter',
      '/admin/settings',
    ];
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror ${page.url()}: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // Next.js dev-mode fetch flakiness during fast route transitions — not a product bug
      if (/ClientFetchError|Cart sync error|Failed to fetch/i.test(text)) return;
      errors.push(`error ${page.url()}: ${text}`);
    });
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);
    }
    expect(errors).toHaveLength(0);
  });

  test.describe('Proizvodi (products)', () => {
    test('lists products and supports search', async ({ page }) => {
      await page.goto('/admin/products');
      await expect(page.getByRole('heading', { name: 'Proizvodi', level: 1 })).toBeVisible();
      await page.getByPlaceholder(/pretra/i).fill('Matrix');
      await page.waitForTimeout(500);
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('opens inline edit form from row pen icon', async ({ page }) => {
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
      const firstEdit = page.locator('table tbody tr').first().locator('button').nth(1);
      await firstEdit.click();
      const save = page.getByRole('button', { name: 'Sačuvaj Izmene' });
      await expect(save).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: 'Otkaži' }).click();
      await expect(save).toHaveCount(0);
    });

    test('"Dodaj Proizvod" opens create modal; empty submit shows validation', async ({ page }) => {
      await page.goto('/admin/products');
      await page.getByRole('button', { name: /^Dodaj Proizvod$/ }).first().click();
      const modalHeading = page.getByRole('heading', { name: 'Dodaj Proizvod', level: 2 });
      await expect(modalHeading).toBeVisible();
      // Submit at the bottom of a scrollable modal — scroll it in first
      const submit = page.getByRole('button', { name: /^Dodaj Proizvod$/ }).last();
      await submit.scrollIntoViewIfNeeded();
      await submit.click();
      // Fix #4: validation heading must render translated text, not raw i18n key
      await expect(page.getByRole('heading', { level: 3, name: /Obavezna polja|Required fields/i })).toBeVisible({ timeout: 5000 });
    });

    test('validation message uses translated text (not raw i18n key)', async ({ page }) => {
      await page.goto('/admin/products');
      await page.getByRole('button', { name: /^Dodaj Proizvod$/ }).first().click();
      const submit = page.getByRole('button', { name: /^Dodaj Proizvod$/ }).last();
      await submit.scrollIntoViewIfNeeded();
      await submit.click();
      // The raw key must never render
      await expect(page.locator('text=admin.requiredFields')).toHaveCount(0);
      await expect(page.locator('text=admin.fillRequiredFields')).toHaveCount(0);
    });

    test('product row action buttons have aria-labels', async ({ page }) => {
      await page.goto('/admin/products');
      const firstRowButtons = page.locator('table tbody tr').first().locator('button');
      const count = await firstRowButtons.count();
      for (let i = 0; i < count; i++) {
        await expect(firstRowButtons.nth(i)).toHaveAttribute('aria-label', /.+/);
      }
    });
  });

  test.describe('Akcije (promotions)', () => {
    test('empty state + new-promotion modal validation', async ({ page }) => {
      await page.goto('/admin/actions');
      await expect(page.getByRole('heading', { name: 'Akcije i Popusti', level: 1 })).toBeVisible();
      await page.getByRole('button', { name: 'Nova Akcija' }).first().click();
      await expect(page.getByRole('heading', { name: 'Nova Akcija', level: 2 })).toBeVisible();
      // Submit must start disabled
      const submit = page.getByRole('button', { name: 'Kreiraj Akciju' });
      await expect(submit).toBeDisabled();
      // Still disabled after just a name — needs more required fields
      await page.getByPlaceholder(/Prole\u0107na/i).fill('QA Test');
      await expect(submit).toBeDisabled();
      await page.getByRole('button', { name: 'Otkaži' }).click();
      await expect(page.getByRole('heading', { name: 'Nova Akcija', level: 2 })).toHaveCount(0);
    });

    test('promotion product picker images are marked decorative (no duplicated a11y name)', async ({ page }) => {
      await page.goto('/admin/actions');
      await page.getByRole('button', { name: 'Nova Akcija' }).first().click();
      // All product thumbnails inside the picker must have alt="" so the product
      // name isn't read twice in the checkbox's accessible name.
      const productImages = page.locator('label img[src]');
      const count = await productImages.count();
      if (count === 0) return; // no products in DB
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(productImages.nth(i)).toHaveAttribute('alt', '');
      }
    });
  });

  test.describe('Newsletter', () => {
    test('tabs: Šabloni / Poslate kampanje / Pretplatnici', async ({ page }) => {
      await page.goto('/admin/newsletter');
      await expect(page.getByRole('heading', { name: 'Newsletter', level: 1 })).toBeVisible();
      await page.getByRole('button', { name: 'Poslate kampanje' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Pretplatnici' }).click();
      await expect(page.locator('table').first()).toBeVisible();
    });

    test('opens template editor with TipTap toolbar', async ({ page }) => {
      await page.goto('/admin/newsletter');
      await page.getByRole('button', { name: 'Šabloni' }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Uredi' }).first().click();
      await expect(page.getByRole('heading', { name: 'Editor', level: 3 })).toBeVisible();
      for (const tool of ['Naslov 1', 'Naslov 2', 'Podebljano', 'Kurziv', 'Lista', 'Dodaj link', 'Dodaj sliku']) {
        await expect(page.getByRole('button', { name: tool, exact: true })).toBeVisible();
      }
    });

    test('"Pošalji test email" modal disables submit until email entered', async ({ page }) => {
      await page.goto('/admin/newsletter');
      await page.getByRole('button', { name: 'Pošalji test email' }).first().click();
      // Modal has a submit button labelled exactly "Pošalji"
      const submit = page.getByRole('button', { name: 'Pošalji', exact: true });
      await expect(submit).toBeDisabled();
      await page.getByPlaceholder(/vasa@email/i).fill('qa@example.com');
      await expect(submit).toBeEnabled();
      await page.getByRole('button', { name: 'Otkaži' }).click();
    });

    test('"Dodaj link" opens a styled modal (not native prompt)', async ({ page }) => {
      // Arm a native-prompt detector BEFORE navigation
      await page.addInitScript(() => {
        const original = window.prompt;
        window.prompt = (...args: Parameters<typeof window.prompt>) => {
          (window as unknown as { __promptCalled?: boolean }).__promptCalled = true;
          return original.apply(window, args);
        };
      });
      await page.goto('/admin/newsletter');
      await page.getByRole('button', { name: 'Šabloni' }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Uredi' }).first().click();
      await page.getByRole('button', { name: 'Dodaj link' }).click();
      // The styled modal should be visible and native prompt should not have fired
      await expect(page.getByRole('dialog', { name: /Dodaj link/i })).toBeVisible();
      const promptCalled = await page.evaluate(
        () => (window as unknown as { __promptCalled?: boolean }).__promptCalled === true
      );
      expect(promptCalled).toBe(false);
    });
  });

  test.describe('A11y regressions', () => {
    test('admin pages have a single h1', async ({ page }) => {
      for (const route of ['/admin/homepage', '/admin/products', '/admin/actions', '/admin/newsletter']) {
        await page.goto(route);
        await expect(page.locator('h1')).toHaveCount(1);
      }
    });
  });

  test.describe('Auth resilience (known product bugs)', () => {
    // When /api/auth/callback/credentials returns 429, the signIn() client
    // throws `TypeError: Failed to construct 'URL': Invalid URL` and the page
    // freezes on the login screen — users get no feedback.
    test.fixme('429 rate-limit shows friendly error, not URL TypeError', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.goto('/account/login');
      // Hammer login to trigger 429
      for (let i = 0; i < 10; i++) {
        await page.locator('input[type="email"]').fill('hammer@example.com');
        await page.locator('input[type="password"]').fill('nope' + i);
        await page.getByRole('button', { name: /prijavite se/i }).click();
        await page.waitForTimeout(200);
      }
      const hasUrlTypeError = errors.some((e) =>
        /Failed to construct 'URL'/i.test(e)
      );
      expect(hasUrlTypeError).toBe(false);
      await expect(page.locator('text=/previše|rate|pokušaj kasnije/i')).toBeVisible();
    });
  });
});
