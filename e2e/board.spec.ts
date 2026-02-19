import { test, expect } from '@playwright/test';

test.describe('Board CRUD', () => {
  test('create board → navigate → rename → verify → delete', async ({ page }) => {
    // Navigate to home / boards page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create a new board
    const createBtn = page.getByRole('button', { name: /create|new board|add board/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
    } else {
      // Fallback: look for a "+" or similar trigger
      const addTrigger = page.locator('[data-testid="create-board"], button:has-text("+")').first();
      await addTrigger.click();
    }

    // Fill board name in dialog/form
    const nameInput = page.getByPlaceholder(/board name|name/i).or(page.locator('input[name="name"]')).first();
    await nameInput.waitFor({ timeout: 5000 });
    await nameInput.fill('E2E Test Board');

    // Submit
    const submitBtn = page.getByRole('button', { name: /create|save|submit/i });
    await submitBtn.click();

    // Verify board appears and navigate to it
    const boardLink = page.getByText('E2E Test Board').first();
    await expect(boardLink).toBeVisible({ timeout: 10000 });
    await boardLink.click();

    // Verify we're on the board page
    await expect(page).toHaveURL(/board/i, { timeout: 5000 });

    // Rename the board
    const boardTitle = page.getByText('E2E Test Board').first();
    await boardTitle.click();
    const renameInput = page.getByRole('textbox').first();
    await renameInput.fill('E2E Renamed Board');
    await renameInput.press('Enter');

    // Verify rename persisted
    await expect(page.getByText('E2E Renamed Board').first()).toBeVisible({ timeout: 5000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('E2E Renamed Board').first()).toBeVisible({ timeout: 10000 });

    // Delete the board
    // Look for delete option in menu or settings
    const menuBtn = page.locator('[data-testid="board-menu"], button:has-text("⋮"), button:has-text("…"), [aria-label*="menu"]').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      const deleteBtn = page.getByRole('menuitem', { name: /delete/i }).or(page.getByText(/delete board/i)).first();
      await deleteBtn.click();

      // Confirm deletion
      const confirmBtn = page.getByRole('button', { name: /confirm|delete|yes/i }).first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }

    // Verify board is gone
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('E2E Renamed Board')).not.toBeVisible({ timeout: 5000 });
  });
});
