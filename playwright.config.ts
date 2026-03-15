import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Auth setup — company admin (owner@abchvac.com)
    {
      name: 'company-auth-setup',
      testMatch: '**/auth.setup.ts',
    },
    // Auth setup — platform super admin (superadmin@fieldpiecedigital.com)
    {
      name: 'admin-auth-setup',
      testMatch: '**/admin-auth.setup.ts',
    },
    // All tests run in chromium after both auth setups complete
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['company-auth-setup', 'admin-auth-setup'],
    },
  ],
})
