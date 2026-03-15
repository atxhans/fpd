import { test, expect } from '@playwright/test'
import path from 'path'

test.use({ storageState: path.join(__dirname, '../.playwright/admin-auth.json') })

test.describe('Admin Console (platform super admin)', () => {
  test('platform dashboard shows metrics', async ({ page }) => {
    await page.goto('/platform')
    await expect(page.getByText('Platform Dashboard')).toBeVisible()
    await expect(page.getByText('Active Tenants')).toBeVisible()
    await expect(page.getByText('Active Users')).toBeVisible()
  })

  test('tenant management shows list', async ({ page }) => {
    await page.goto('/tenants')
    await expect(page.getByText('Tenant Management')).toBeVisible()
  })

  test('support console renders', async ({ page }) => {
    await page.goto('/support')
    await expect(page.getByText('Support Console')).toBeVisible()
  })

  test('impersonation page shows controls', async ({ page }) => {
    await page.goto('/impersonation')
    await expect(page.getByText('Impersonation Controls')).toBeVisible()
  })

  test('audit logs page renders', async ({ page }) => {
    await page.goto('/audit-logs')
    await expect(page.getByText('Audit Logs')).toBeVisible()
  })

  test('feature flags page renders', async ({ page }) => {
    await page.goto('/feature-flags')
    await expect(page.getByText('Feature Flags')).toBeVisible()
  })
})
