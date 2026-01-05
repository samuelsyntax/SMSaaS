
import { test, expect } from '@playwright/test';

test.describe('Student Role', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'student1@demoschool.edu');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    });

    test('should have correct navigation and profile', async ({ page }) => {
        // 1. Navigation Audit
        // Should NOT see 'Schools', 'Teachers', 'Students', 'Attendance', 'Reports' (Admin/Teacher only)
        await expect(page.getByText('Schools')).not.toBeVisible();
        await expect(page.getByText('Teachers')).not.toBeVisible();
        // await expect(page.getByText('Students')).not.toBeVisible(); // Students see their own view

        // Should see 'Dashboard', 'Exams', 'Grades', 'Fees'
        await expect(page.getByText('Dashboard').first()).toBeVisible();
        await expect(page.getByText('Exams').first()).toBeVisible();
        await expect(page.getByText('Grades').first()).toBeVisible();
        await expect(page.getByText('Fees & Payments').first()).toBeVisible();

        // 2. Profile Audit
        await page.goto('http://localhost:3000/profile');

        // Wait for profile to load
        await expect(page.getByText('My Profile')).toBeVisible();

        // Expect Role to be STUDENT
        await expect(page.getByLabel('Role')).toHaveValue('STUDENT');

        // Edit Name
        const firstNameInput = page.getByLabel('First Name');
        await firstNameInput.fill('Timmy');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expect(page.getByText('Profile updated successfully')).toBeVisible();

        // Reload
        await page.reload();
        await expect(firstNameInput).toHaveValue('Timmy');

        // Cleanup
        await firstNameInput.fill('Student');
        await page.getByRole('button', { name: 'Save Changes' }).click();
    });
});
