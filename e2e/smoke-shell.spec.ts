import { expect, test } from '@playwright/test';

/**
 * SPEC-010 — optional shell smoke against full stack (http://localhost).
 * Run with stack up: BASE_URL=http://localhost pnpm exec playwright test e2e/smoke-shell.spec.ts
 */
test.describe('SAPCyTI shell (SPEC-010)', () => {
  test('loads SPA shell at /', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/sapcyti-spa/i);
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
    await expect(page.locator('app-root')).toBeAttached();
  });
});
