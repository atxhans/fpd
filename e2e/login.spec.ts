import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('FIELDPIECE')).toBeVisible()
    await expect(page.getByText('Sign in')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/invalid/i).or(page.getByText(/incorrect/i))).toBeVisible({ timeout: 5000 })
  })

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText('Reset password')).toBeVisible()
  })
})
