import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {

    test('SuperAdmin Login & Check Permissions', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('superadmin@sms.com');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/', { timeout: 15000 });
        await expect(page.getByText('SMS')).toBeVisible();
        // SuperAdmin should see Schools
        await expect(page.getByRole('button', { name: 'Schools' })).toBeVisible();
    });

    test('SchoolAdmin Login & Check Permissions', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('admin@demoschool.edu');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/', { timeout: 15000 });
        // SchoolAdmin should see Teachers but NOT Schools
        await expect(page.getByRole('button', { name: 'Teachers' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Schools' })).not.toBeVisible();
    });

    test('Teacher Login & Check Permissions', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('teacher@demoschool.edu');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/', { timeout: 15000 });
        // Teacher should see Classes but NOT Schools or Teachers
        await expect(page.getByRole('button', { name: 'Classes' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Teachers' })).not.toBeVisible();
    });

    test('Student Login & Check Permissions', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('student1@demoschool.edu');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/', { timeout: 15000 });
        // Student should see Grades but NOT Teachers
        await expect(page.getByRole('button', { name: 'Grades' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Teachers' })).not.toBeVisible();
    });
});
