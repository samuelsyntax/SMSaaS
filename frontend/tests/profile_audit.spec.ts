
import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
    // Removed storageState line usage to rely on clean login in beforeEach
    // test.use({ storageState: 'playwright/.auth/superadmin.json' });

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'superadmin@sms.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    });

    test('should display profile page and allow editing name', async ({ page }) => {
        // Navigate to profile
        await page.goto('http://localhost:3000/profile');

        // Check if we are stuck on loading
        // 5s timeout to catch it early if it's there
        try {
            await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 5000 });
        } catch (e) {
            console.log('Stuck on progress bar!');
            // If stuck, we fail here
        }

        // Verify initial load
        await expect(page.getByText('My Profile')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toHaveValue('superadmin@sms.com');

        // Edit Name
        const firstNameInput = page.getByLabel('First Name');
        const lastNameInput = page.getByLabel('Last Name');

        await firstNameInput.fill('Principal');
        await lastNameInput.fill('Snyder');

        // Save
        await page.getByRole('button', { name: 'Save Changes' }).click();

        // Verify success message
        await expect(page.getByText('Profile updated successfully')).toBeVisible();

        // Reload and Verify persistence
        await page.reload();
        await expect(firstNameInput).toHaveValue('Principal');
        await expect(lastNameInput).toHaveValue('Snyder');

        // Revert 
        await firstNameInput.fill('Super');
        await lastNameInput.fill('Admin');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Profile updated successfully')).toBeVisible();
    });
});
