import { test, expect } from '@playwright/test';

test.describe('WIP Limits', () => {
  test('enforce WIP limit: block third card when limit is 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to a board
    const boardLink = page.locator('a[href*="board"], [data-testid*="board"]').first();
    await boardLink.click();
    await page.waitForLoadState('networkidle');

    // Configure WIP limit on a column
    // Look for column settings/gear icon
    const columnHeader = page.locator('[data-testid*="column-header"], .column-header, [class*="column"] header').first();
    await columnHeader.waitFor({ timeout: 10000 });

    const settingsBtn = columnHeader.locator('button:has-text("⚙"), button[aria-label*="settings"], [data-testid*="column-settings"]').first();
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click();

      const wipInput = page.getByLabel(/wip|limit/i).or(page.locator('input[name*="wip"], input[name*="limit"]')).first();
      await wipInput.fill('2');

      const saveBtn = page.getByRole('button', { name: /save|apply|update/i }).first();
      await saveBtn.click();
    }

    // Add first card
    const addCardBtn = page.getByRole('button', { name: /add card|new card|\+/i }).first();

    for (let i = 1; i <= 2; i++) {
      await addCardBtn.click();
      const titleInput = page.getByPlaceholder(/title|card name|name/i)
        .or(page.locator('input[name="title"]'))
        .first();
      await titleInput.waitFor({ timeout: 5000 });
      await titleInput.fill(`WIP Card ${i}`);
      const saveBtn = page.getByRole('button', { name: /create|save|add/i }).first();
      await saveBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify both cards exist
    await expect(page.getByText('WIP Card 1').first()).toBeVisible();
    await expect(page.getByText('WIP Card 2').first()).toBeVisible();

    // Try adding a third card — should be blocked
    await addCardBtn.click();
    const titleInput = page.getByPlaceholder(/title|card name|name/i)
      .or(page.locator('input[name="title"]'))
      .first();

    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('WIP Card 3');
      const saveBtn = page.getByRole('button', { name: /create|save|add/i }).first();
      await saveBtn.click();
    }

    // Verify WIP limit enforcement — expect a toast, warning badge, or the card not appearing
    const toast = page.locator('[data-testid*="toast"], [role="alert"], .toast, [class*="toast"]').first();
    const wipBadge = page.locator('[data-testid*="wip"], .wip-warning, [class*="wip-limit"], [class*="text-red"], [class*="text-destructive"]').first();

    const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);
    const hasBadge = await wipBadge.isVisible({ timeout: 2000 }).catch(() => false);

    // At least one WIP enforcement indicator should be present
    expect(hasToast || hasBadge).toBeTruthy();
  });
});
