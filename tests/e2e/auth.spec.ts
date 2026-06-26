import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  test('Sign-in page loads correctly', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('Sign-up page loads correctly', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.locator('text=Create your account')).toBeVisible()
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('Successful sign-in redirects to dashboard', async ({ page }) => {
    await page.goto('/sign-in')
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@msf-banking.com')
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'TestPassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('Failed sign-in shows error message', async ({ page }) => {
    await page.goto('/sign-in')
    await page.fill('input[name="email"]', 'fake@email.com')
    await page.fill('input[name="password"]', 'wrongpassword123')
    await page.click('button[type="submit"]')
    await expect(page.locator('.text-red-500')).toBeVisible({ timeout: 10000 })
  })

  test('Navigate between sign-in and sign-up', async ({ page }) => {
    await page.goto('/sign-in')
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/sign-up')
    await expect(page.locator('text=Create your account')).toBeVisible()

    await page.click('text=Sign in')
    await expect(page).toHaveURL('/sign-in')
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })
})
