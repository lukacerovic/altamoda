import { test as setup, expect } from '@playwright/test';
import path from 'path';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@altamoda.rs';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123';

export const adminAuthFile = path.join(__dirname, '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/account/login');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /prijavite se/i }).click();
  await expect(page).toHaveURL(/\/admin\//, { timeout: 30_000 });
  await page.context().storageState({ path: adminAuthFile });
});
