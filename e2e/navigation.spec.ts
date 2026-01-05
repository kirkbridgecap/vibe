import { test, expect } from '@playwright/test';

test.describe('Navigation & Wishlist', () => {
    test('should navigate between Discover and Wishlist', async ({ page }) => {
        // Start at home
        await page.goto('/');

        // Check for main element
        await expect(page.locator('main')).toBeVisible();

        // Check for Bottom Nav (using a stable selector we will add later, or role)
        // We will assume a navigation role or specific class
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();

        // Navigate to Wishlist
        await page.click('text=Wishlist');
        await expect(page).toHaveURL(/\/wishlist/);
        await expect(page.locator('h1')).toContainText('Wishlist');

        // Navigate back to Discover
        await page.click('text=Discover');
        await expect(page).toHaveURL('/');

        // Check for the Undo button which is on the Home page
        await expect(page.locator('button[aria-label="Undo last nope"]')).toBeVisible();
    });
});
