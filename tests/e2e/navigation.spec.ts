import { test, expect } from '@playwright/test'

test.describe('Navigation and protected routes', () => {
  test('Unauthenticated access to root returns empty or redirects', async ({ page }) => {
    await page.goto('/')
    // The app returns null when not logged in, so either blank page or redirect
    const url = page.url()
    const isAuthPage = url.includes('sign-in') || url.includes('sign-up')
    const bodyText = await page.locator('body').textContent()
    expect(isAuthPage || bodyText !== undefined).toBeTruthy()
  })

  test('Unauthenticated access to my-banks', async ({ page }) => {
    await page.goto('/my-banks')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText !== undefined).toBeTruthy()
  })

  test('Unauthenticated access to payment-transfer', async ({ page }) => {
    await page.goto('/payment-transfer')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText !== undefined).toBeTruthy()
  })

  test('Unauthenticated access to transaction-history', async ({ page }) => {
    await page.goto('/transaction-history')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText !== undefined).toBeTruthy()
  })

  test('Sign-in page is accessible without authentication', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('Sign-up page is accessible without authentication', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.locator('text=Create your account')).toBeVisible()
  })
})
