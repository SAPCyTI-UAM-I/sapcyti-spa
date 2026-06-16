import { expect, test } from '@playwright/test';

test.describe('SAPCyTI shell (SPEC-010)', () => {
  test('loads the authenticated SPA shell', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/^SAPCyTI$/);
    await expect(page.locator('app-root')).toBeAttached();
    await expect(page).toHaveURL(/auth\/login/);

    await page.locator('input[type="email"]').fill('coordinator@uam.mx');
    await page.locator('p-password input').fill('password');
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('app-shell')).toBeVisible();
  });
});
