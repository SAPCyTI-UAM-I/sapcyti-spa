import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('p-password input').fill('password');
  await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('registers a student and displays the one-time password', async ({ page }) => {
  await login(page, 'coordinator@uam.mx');
  await page.getByRole('link', { name: /^Alumnos$|^Students$/ }).click();
  await expect(page).toHaveURL(/academic-catalog\/students$/);
  await page.getByTestId('create-student').click();
  await expect(page).toHaveURL(/academic-catalog\/students\/new$/);
  await page.locator('[formcontrolname="firstName"]').fill('Elena');
  await page.locator('[formcontrolname="firstLastName"]').fill('Torres');
  await page.locator('[formcontrolname="email"]').fill('elena.torres@uam.mx');
  await page.locator('[formcontrolname="nationality"]').fill('Mexicana');
  await page.getByTestId('wizard-next').click();
  await page.locator('[formcontrolname="enrollmentId"]').fill('223301111');
  await page.locator('[formcontrolname="undergraduateDegree"]').fill('Computación');
  await page.locator('[formcontrolname="programType"]').click();
  await page
    .getByText(/Maestría|Master's/)
    .last()
    .click();
  await page.locator('[formcontrolname="admissionDate"]').fill('2026-09-01');
  await page.getByTestId('wizard-next').click();
  await page.getByTestId('confirm-student').click();
  await expect(page.getByTestId('generated-password')).toBeVisible();
  await page.getByTestId('close-password-dialog').click();
  await expect(page).toHaveURL(/academic-catalog\/students$/);
  await expect(page.getByText('elena.torres@uam.mx')).toBeVisible();
});

test('registers a professor and returns to the catalog', async ({ page }) => {
  await login(page, 'coordinator@uam.mx');
  await page.getByRole('link', { name: /^Profesores$|^Professors$/ }).click();
  await expect(page).toHaveURL(/academic-catalog\/professors$/);
  await page.getByTestId('create-professor').click();
  await expect(page).toHaveURL(/academic-catalog\/professors\/new$/);
  await page.locator('[formcontrolname="firstName"]').fill('Mario');
  await page.locator('[formcontrolname="firstLastName"]').fill('Santos');
  await page.locator('[formcontrolname="email"]').fill('mario.santos@uam.mx');
  await page.locator('[formcontrolname="employeeNumber"]').fill('40555');
  await page.getByTestId('wizard-next').click();
  await page.getByTestId('confirm-professor').click();
  await expect(page.getByTestId('generated-password')).toBeVisible();
  await page.getByTestId('close-password-dialog').click();
  await expect(page.getByText('mario.santos@uam.mx')).toBeVisible();
});

test('changes own password and clears the session', async ({ page }) => {
  await login(page, 'student@uam.mx');
  await page.getByTestId('user-menu-trigger').click();
  await page.getByRole('menuitem', { name: /cambiar contraseña|change password/i }).click();
  await expect(page).toHaveURL(/account\/password$/);

  const passwordPage = page.getByTestId('password-change');
  await expect(passwordPage).toBeVisible();
  await expect
    .poll(async () => (await passwordPage.boundingBox())?.width ?? 0)
    .toBeGreaterThanOrEqual(480);

  await page.locator('[formcontrolname="currentPassword"] input').fill('password');
  await page.locator('[formcontrolname="newPassword"] input').fill('new-password');
  await page.locator('[formcontrolname="confirmPassword"] input').fill('new-password');
  await page.getByTestId('submit-password-change').click();
  await expect(page).toHaveURL(/auth\/login/);
});

test('coordinator changes a student password and returns to its catalog', async ({ page }) => {
  await login(page, 'coordinator@uam.mx');
  await page.getByRole('link', { name: /^Alumnos$|^Students$/ }).click();
  await expect(page).toHaveURL(/academic-catalog\/students$/);

  await page.locator('[data-testid="student-catalog"] tbody a').first().click();
  await page.getByTestId('edit-student').click();
  await expect(page).toHaveURL(/academic-catalog\/students\/\d+\/edit$/);
  await page.getByTestId('change-student-password').click();

  await page.locator('[formcontrolname="newPassword"] input').fill('temporary-password');
  await page.locator('[formcontrolname="confirmPassword"] input').fill('temporary-password');
  await page.getByTestId('submit-password-change').click();
  await expect(page).toHaveURL(/academic-catalog\/students$/);
});
