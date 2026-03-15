import { test as setup } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '../.playwright/admin-auth.json')

setup('authenticate as platform super admin', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL ?? 'superadmin@fieldpiecedigital.com')
  await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD ?? 'FpdDemo2024!')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/platform', { timeout: 10000 })
  await page.context().storageState({ path: AUTH_FILE })
})
