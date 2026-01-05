import { test, expect } from '@playwright/test';

test.describe('Academic Modules', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('admin@demoschool.edu');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/', { timeout: 15000 });
        await expect(page.getByText('SMS')).toBeVisible();
    });

    test('Verify Classes Data', async ({ page }) => {
        await page.getByRole('button', { name: 'Classes' }).click();
        await expect(page).toHaveURL('/classes', { timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Classes' })).toBeVisible({ timeout: 15000 });

        // Check for seeded class
        await expect(page.getByRole('cell', { name: 'Grade 9A' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('cell', { name: 'Grade 10A' })).toBeVisible({ timeout: 15000 });
    });

    test('Verify Subjects Data', async ({ page }) => {
        await page.getByRole('button', { name: 'Subjects' }).click();
        await expect(page).toHaveURL('/subjects', { timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible({ timeout: 15000 });

        // Check for seeded subject
        await expect(page.getByRole('cell', { name: 'Mathematics' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('cell', { name: 'English' })).toBeVisible({ timeout: 15000 });
    });

    test('Verify Students Data', async ({ page }) => {
        await page.getByRole('button', { name: 'Students' }).click();
        await expect(page).toHaveURL('/students', { timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible({ timeout: 15000 });

        // Check for seeded student (Student 1)
        await expect(page.getByRole('cell', { name: 'Student 1' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('cell', { name: 'student1@demoschool.edu' })).toBeVisible({ timeout: 15000 });
    });

    test('Verify Teachers Data', async ({ page }) => {
        await page.getByRole('button', { name: 'Teachers' }).click();
        await expect(page).toHaveURL('/teachers', { timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Teachers' })).toBeVisible({ timeout: 15000 });

        // Check for seeded teacher
        await expect(page.getByRole('cell', { name: 'John Teacher' })).toBeVisible({ timeout: 15000 }); // Firstname Lastname
        await expect(page.getByRole('cell', { name: 'teacher@demoschool.edu' })).toBeVisible({ timeout: 15000 });
    });

});
