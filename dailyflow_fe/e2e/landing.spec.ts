import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows hero heading and Asana CTA button', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /standup, automated/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Continue with Asana/i })).toBeVisible();
  });

  test('Asana CTA points to /api/auth/asana', async ({ page }) => {
    await page.goto('/');

    const link = page.getByRole('link', { name: /Continue with Asana/i });
    await expect(link).toHaveAttribute('href', '/api/auth/asana');
  });

  test('shows tagline describing the workflow', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText('Connect Asana. Select tasks. Ship standups.');
  });
});
