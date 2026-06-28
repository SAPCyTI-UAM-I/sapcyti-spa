import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('p-password input').fill('password');
  await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('coordinator views program, assigns tutor and saves', async ({ page }) => {
  await login(page, 'coordinator@uam.mx');
  await page.getByRole('link', { name: /^Alumnos$|^Students$/ }).click();
  await expect(page).toHaveURL(/academic-catalog\/students$/);

  await page.getByTestId('view-program').first().click();
  await expect(page).toHaveURL(/academic-catalog\/students\/\d+\/programs\/\d+$/);
  await expect(page.getByTestId('student-program-view')).toBeVisible();
  await expect(page.getByText(/Sin tutor asignado|No tutor assigned/i)).toBeVisible();

  await page.getByRole('button', { name: /editar programa|edit program/i }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await expect(page.getByTestId('student-program-edit')).toBeVisible();

  await page.locator('[formcontrolname="tutorId"]').click();
  await page.getByRole('option').first().click();
  await page.getByTestId('save-program').click();

  await expect(page).toHaveURL(/academic-catalog\/students\/\d+\/programs\/\d+$/);
  await expect(page.getByTestId('student-program-view')).toBeVisible();
  await expect(page.getByText(/Cervantes|Martínez/i)).toBeVisible();
});
