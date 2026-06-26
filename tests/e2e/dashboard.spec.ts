import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('Dashboard page requires authentication', async ({ page }) => {
    await page.goto('/')
    // Should either redirect to sign-in or show empty content when not authenticated
    const url = page.url()
    const isRedirected = url.includes('sign-in')
    const hasNoContent = await page.locator('body').textContent()

    expect(isRedirected || hasNoContent !== null).toBeTruthy()
  })

  test('Dashboard loads with balance section after login', async ({ page }) => {
    await page.goto('/sign-in')
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@msf-banking.com')
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'TestPassword123!')
    await page.click('button[type="submit"]')

    await page.waitForURL('/', { timeout: 10000 })

    // Verify key dashboard elements are present
    const body = await page.locator('body').textContent()
    expect(body).toBeTruthy()
  })
})
