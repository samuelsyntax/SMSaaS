
import { test, expect } from '@playwright/test';

test.describe('School Admin Role', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'admin@demoschool.edu');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    });

    test('should have correct navigation and profile', async ({ page }) => {
        // 1. Navigation Audit
        // Should NOT see 'Schools' (SuperAdmin only)
        // using getByText as ListItemButton role can be tricky
        await expect(page.getByText('Schools')).not.toBeVisible();

        // Should see 'Teachers', 'Students', 'Classes'
        await expect(page.getByText('Teachers').first()).toBeVisible();
        await expect(page.getByText('Students').first()).toBeVisible();
        await expect(page.getByText('Classes').first()).toBeVisible();

        // 2. Profile Audit
        await page.goto('http://localhost:3000/profile');

        // Expect School ID to be visible (Admin has schoolId)
        await expect(page.getByLabel('School ID')).toBeVisible();

        // Expect Role to be SCHOOL_ADMIN
        await expect(page.getByLabel('Role')).toHaveValue('SCHOOL_ADMIN');

        // Edit Name
        const firstNameInput = page.getByLabel('First Name');
        await firstNameInput.fill('Headmaster');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Profile updated successfully')).toBeVisible();

        // Reload
        await page.reload();
        await expect(firstNameInput).toHaveValue('Headmaster');

        // Cleanup
        await firstNameInput.fill('School');
        await page.getByRole('button', { name: 'Save Changes' }).click();
    });
});
