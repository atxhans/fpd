import { test, expect } from '@playwright/test'

// Admin tests require platform user credentials
test.describe('Admin Console', () => {
  test.skip(true, 'Requires platform user auth — skip in CI without full env')

  test('platform dashboard shows metrics', async ({ page }) => {
    await page.goto('/admin/platform')
    await expect(page.getByText('Platform Dashboard')).toBeVisible()
    await expect(page.getByText('Active Tenants')).toBeVisible()
  })

  test('tenant management shows list', async ({ page }) => {
    await page.goto('/admin/tenants')
    await expect(page.getByText('Tenant Management')).toBeVisible()
  })

  test('support console has search', async ({ page }) => {
    await page.goto('/admin/support')
    await expect(page.getByText('Support Console')).toBeVisible()
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('impersonation page shows warning', async ({ page }) => {
    await page.goto('/admin/impersonation')
    await expect(page.getByText('Impersonation is strictly controlled')).toBeVisible()
  })

  test('audit logs page renders', async ({ page }) => {
    await page.goto('/admin/audit-logs')
    await expect(page.getByText('Audit Logs')).toBeVisible()
  })
})
