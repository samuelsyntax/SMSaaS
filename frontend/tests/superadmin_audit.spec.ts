
import { test, expect } from '@playwright/test';

test.describe('SuperAdmin Full Audit', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'superadmin@sms.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    });

    test('Dashboard loads correctly', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
        await expect(page.getByText('Total Students')).toBeVisible();
    });

    test('Schools page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/schools');
        await expect(page.getByText('Schools').first()).toBeVisible();
        // Should have a table or card layout
    });

    test('Students page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/students');
        await expect(page.getByText('Students').first()).toBeVisible();
    });

    test('Teachers page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/teachers');
        await expect(page.getByText('Teachers').first()).toBeVisible();
    });

    test('Classes page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/classes');
        await expect(page.getByText('Classes').first()).toBeVisible();
    });

    test('Subjects page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/subjects');
        await expect(page.getByText('Subjects').first()).toBeVisible();
    });

    test('Attendance page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/attendance');
        await expect(page.getByText('Attendance').first()).toBeVisible();
    });

    test('Exams page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/exams');
        await expect(page.getByText('Exams').first()).toBeVisible();
    });

    test('Grades page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/grades');
        await expect(page.getByText('Grades').first()).toBeVisible();
    });

    test('Payments page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/payments');
        await expect(page.getByText('Fees').first()).toBeVisible();
    });

    test('Reports page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/reports');
        await expect(page.getByText('Reports').first()).toBeVisible();
    });

    test('Profile page loads', async ({ page }) => {
        await page.goto('http://localhost:3000/profile');
        await expect(page.getByText('My Profile')).toBeVisible();
    });
});
