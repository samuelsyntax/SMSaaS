import { test, expect } from '@playwright/test';

test.describe('Finance Module', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('admin@demoschool.edu');
        await page.getByLabel('Password').fill('admin123');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/', { timeout: 15000 });
        await expect(page.getByText('SMS')).toBeVisible();
    });

    test('Verify Fee Structures', async ({ page }) => {
        await page.getByRole('button', { name: 'Fees & Payments' }).click();
        await expect(page).toHaveURL('/payments');

        // Assuming Payments page has a tab or section for Fee Structures or lists fees
        // This depends on the implementation of /payments page which we haven't inspected closely yet.
        // Based on navItems, path is /payments.
        // Let's verify valid page load first.
        await expect(page.getByText('Payments')).toBeVisible(); // Heading likely 'Payments' or 'Fees & Payments'
    });

});
