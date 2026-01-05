
import { test, expect } from '@playwright/test';

test.describe('Data Integrity Tests', () => {
    test.describe('Role Constraints', () => {
        test('Teacher cannot access Schools page', async ({ page }) => {
            await page.goto('http://localhost:3000/login');
            await page.fill('input[type="email"]', 'teacher@demoschool.edu');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');

            // Try to access Schools page directly
            await page.goto('http://localhost:3000/schools');
            // Should redirect to dashboard or show forbidden
            await expect(page).toHaveURL(/dashboard|forbidden|unauthorized/);
        });

        test('Student cannot access Teachers page', async ({ page }) => {
            await page.goto('http://localhost:3000/login');
            await page.fill('input[type="email"]', 'student1@demoschool.edu');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');

            // Try to access Teachers page directly
            await page.goto('http://localhost:3000/teachers');
            // Should redirect or show error
            await expect(page).toHaveURL(/dashboard|forbidden|unauthorized/);
        });

        test('Student cannot access Attendance page', async ({ page }) => {
            await page.goto('http://localhost:3000/login');
            await page.fill('input[type="email"]', 'student1@demoschool.edu');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');

            // Try to access Attendance page directly
            await page.goto('http://localhost:3000/attendance');
            // Should redirect or show error
            await expect(page).toHaveURL(/dashboard|forbidden|unauthorized/);
        });
    });

    test.describe('CRUD Persistence', () => {
        test('Profile update persists across page reload', async ({ page }) => {
            await page.goto('http://localhost:3000/login');
            await page.fill('input[type="email"]', 'superadmin@sms.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');

            await page.goto('http://localhost:3000/profile');
            await expect(page.getByText('My Profile')).toBeVisible();

            const origFirstName = await page.getByLabel('First Name').inputValue();
            const testName = 'TestPersist' + Date.now();

            await page.getByLabel('First Name').fill(testName);
            await page.getByRole('button', { name: 'Save Changes' }).click();
            await expect(page.getByText('Profile updated successfully')).toBeVisible();

            await page.reload();
            await expect(page.getByLabel('First Name')).toHaveValue(testName);

            // Cleanup
            await page.getByLabel('First Name').fill(origFirstName);
            await page.getByRole('button', { name: 'Save Changes' }).click();
        });
    });
});
