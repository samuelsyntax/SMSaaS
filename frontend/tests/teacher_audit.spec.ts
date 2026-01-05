
import { test, expect } from '@playwright/test';

test.describe('Teacher Role', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'teacher@demoschool.edu');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    });

    test('should have correct navigation and profile', async ({ page }) => {
        // 1. Navigation Audit
        // Should NOT see 'Schools' (SuperAdmin only)
        await expect(page.getByText('Schools')).not.toBeVisible();

        // Should see 'Students', 'Classes', 'Subjects', 'Attendance'
        await expect(page.getByText('Students').first()).toBeVisible();
        await expect(page.getByText('Classes').first()).toBeVisible();
        await expect(page.getByText('Subjects').first()).toBeVisible();
        await expect(page.getByText('Attendance').first()).toBeVisible();

        // 2. Profile Audit
        await page.goto('http://localhost:3000/profile');

        // Wait for profile to load
        await expect(page.getByText('My Profile')).toBeVisible();

        // Expect Role to be TEACHER
        await expect(page.getByLabel('Role')).toHaveValue('TEACHER');

        // Edit Name
        const firstNameInput = page.getByLabel('First Name');
        await firstNameInput.fill('Professor');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Profile updated successfully')).toBeVisible();

        // Reload
        await page.reload();
        await expect(firstNameInput).toHaveValue('Professor');

        // Cleanup
        await firstNameInput.fill('John');
        await page.getByRole('button', { name: 'Save Changes' }).click();
    });
});
