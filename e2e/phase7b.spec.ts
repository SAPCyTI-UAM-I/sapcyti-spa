import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('p-password input').fill('password');
  await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('coordinator opens student detail, assigns tutor and saves', async ({ page }) => {
  await login(page, 'coordinator@uam.mx');
  await page.getByRole('link', { name: /^Alumnos$|^Students$/ }).click();
  await expect(page).toHaveURL(/academic-catalog\/students$/);

  await page.locator('[data-testid="student-catalog"] tbody a').first().click();
  await expect(page).toHaveURL(/academic-catalog\/students\/\d+$/);
  await expect(page.getByTestId('student-detail')).toBeVisible();
  await expect(page.getByText(/Sin tutor asignado|No tutor assigned/i)).toBeVisible();

  await page.getByTestId('edit-student').click();
  await expect(page).toHaveURL(/academic-catalog\/students\/\d+\/edit$/);
  await expect(page.getByTestId('student-edit')).toBeVisible();

  await page.locator('[formcontrolname="tutorId"]').click();
  await page.getByRole('option', { name: /Cervantes/i }).click();
  await page.getByTestId('save-student').click();

  await expect(page).toHaveURL(/academic-catalog\/students\/\d+$/);
  await expect(page.getByTestId('student-detail')).toBeVisible();
  await expect(page.getByText(/Cervantes/i)).toBeVisible();
});
