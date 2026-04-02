import { Page, expect } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('/auth/login');

  await page.locator('input[name="email"]').fill('eva.lin1@ideaxpress.biz');
  await page.locator('input[name="password"]').fill('eva123');

  // await page.getByTestId('login-submit').click();
  await page.getByRole('button', { name: /登入/i }).click();

  await expect(page).toHaveURL('/');
}
