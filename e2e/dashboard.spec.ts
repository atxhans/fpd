import { test, expect } from '@playwright/test'
import path from 'path'

// Uses saved auth state from auth.setup.ts
test.use({ storageState: path.join(__dirname, '../.playwright/auth.json') })

test.describe('Company Dashboard (authenticated)', () => {
  test.skip(true, 'Requires running Supabase with seed data — skip in CI without full env')

  test('shows dashboard with metric cards', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Open Jobs')).toBeVisible()
    await expect(page.getByText('Active Technicians')).toBeVisible()
  })

  test('navigates to jobs list', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByText('Jobs')).toBeVisible()
  })

  test('navigates to equipment list', async ({ page }) => {
    await page.goto('/equipment')
    await expect(page.getByText('Equipment')).toBeVisible()
  })
})
