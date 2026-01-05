import { test, expect } from '@playwright/test';

test.describe('Dashboard & Navigation', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('admin@demoschool.edu');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/', { timeout: 15000 });
        // Wait for layout to load
        await expect(page.getByText('SMS')).toBeVisible();
    });

    test('Navigate to Students', async ({ page }) => {
        await page.getByRole('button', { name: 'Students' }).click();
        await expect(page).toHaveURL('/students');
        // Check for page heading or distinctive element
        // Assuming the page has an h4, h5 or h6 with title "Students" or similar
        // We will check regex for flexibility
        await expect(page.getByRole('heading', { name: /Students/i })).toBeVisible();
    });

    test('Navigate to Teachers', async ({ page }) => {
        await page.getByRole('button', { name: 'Teachers' }).click();
        await expect(page).toHaveURL('/teachers');
        await expect(page.getByRole('heading', { name: /Teachers/i })).toBeVisible();
    });

    test('Navigate to Classes', async ({ page }) => {
        await page.getByRole('button', { name: 'Classes' }).click();
        await expect(page).toHaveURL('/classes');
        await expect(page.getByRole('heading', { name: /Classes/i })).toBeVisible();
    });

    test('Navigate to Subjects', async ({ page }) => {
        await page.getByRole('button', { name: 'Subjects' }).click();
        await expect(page).toHaveURL('/subjects');
        await expect(page.getByRole('heading', { name: /Subjects/i })).toBeVisible();
    });

});
