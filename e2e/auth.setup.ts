import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '../.playwright/auth.json')

setup('authenticate as company admin', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', process.env.E2E_USER_EMAIL ?? 'owner@abchvac.com')
  await page.fill('input[type="password"]', process.env.E2E_USER_PASSWORD ?? 'FpdDemo2024!')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  await page.context().storageState({ path: AUTH_FILE })
})
