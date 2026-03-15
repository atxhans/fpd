import { test, expect } from '@playwright/test'
import path from 'path'

test.use({ storageState: path.join(__dirname, '../.playwright/auth.json') })

test.describe('Company Dashboard (authenticated)', () => {
  test('shows dashboard with metric cards', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Open Jobs')).toBeVisible()
    await expect(page.getByText('Active Technicians')).toBeVisible()
    await expect(page.getByText('Jobs Today')).toBeVisible()
  })

  test('navigates to jobs list', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByText('Jobs')).toBeVisible()
  })

  test('navigates to customers list', async ({ page }) => {
    await page.goto('/customers')
    await expect(page.getByText('Customers')).toBeVisible()
  })

  test('navigates to equipment list', async ({ page }) => {
    await page.goto('/equipment')
    await expect(page.getByText('Equipment')).toBeVisible()
  })

  test('settings page shows company profile', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('Company Profile')).toBeVisible()
    await expect(page.getByText('My Profile')).toBeVisible()
  })

  test('email templates list shows all four templates', async ({ page }) => {
    await page.goto('/settings/email-templates')
    await expect(page.getByText('Job Assigned')).toBeVisible()
    await expect(page.getByText('Job Completed')).toBeVisible()
    await expect(page.getByText('Service Request Confirmation')).toBeVisible()
    await expect(page.getByText('New Customer Signup Invite')).toBeVisible()
  })

  test('can open an email template editor', async ({ page }) => {
    await page.goto('/settings/email-templates/job_assigned')
    await expect(page.getByText('Job Assigned')).toBeVisible()
    await expect(page.getByLabel('Subject line')).toBeVisible()
    await expect(page.getByText('{{customerName}}')).toBeVisible()
  })

  test('sidebar shows correct nav items', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Jobs' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Customers' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
  })
})
