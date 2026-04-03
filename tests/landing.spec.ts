import { test, expect } from '@playwright/test'

/**
 * PRD §7B-1: Landing page form interactions
 */
test.describe('Landing Page (The Hook)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/')
  })

  test('renders all required elements', async ({ page }) => {
    await expect(page.locator('text=RemindHer')).toBeVisible()
    await expect(page.locator('text=remind you about')).toBeVisible()
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('EN/ID language toggle switches UI text', async ({ page }) => {
    // Default EN
    await expect(page.locator('button', { hasText: 'Forget It' })).toBeVisible()

    // Switch to ID
    await page.locator('button', { hasText: 'ID' }).click()
    await expect(page.locator('button', { hasText: 'Lupain' })).toBeVisible()

    // Switch back to EN
    await page.locator('button', { hasText: 'EN' }).click()
    await expect(page.locator('button', { hasText: 'Forget It' })).toBeVisible()
  })

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.locator('button', { hasText: 'Forget It' }).click()
    // HTML5 validation should prevent submission, form stays on page
    await expect(page).toHaveURL('/')
  })

  test('fills form fields correctly', async ({ page }) => {
    await page.locator('input[type="text"]').first().fill('Vendor Contract')
    await page.locator('input[type="date"]').fill('2025-12-31')
    await page.locator('input[type="email"]').fill('test@example.com')

    await expect(page.locator('input[type="text"]').first()).toHaveValue('Vendor Contract')
    await expect(page.locator('input[type="date"]')).toHaveValue('2025-12-31')
    await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com')
  })
})

/**
 * PRD §7B-1: OTP screen navigation
 */
test.describe('OTP Screen (Magic Gate)', () => {
  test('navigates to OTP screen after form submission (mocked)', async ({ page }) => {
    await page.context().clearCookies()

    // Mock the Supabase OTP call to avoid real email sending
    await page.route('**/auth/v1/otp', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({}) })
    })

    await page.goto('/')
    await page.locator('input[type="text"]').first().fill('Test Reminder')
    await page.locator('input[type="date"]').fill('2026-12-31')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('button', { hasText: 'Forget It' }).click()

    // Should navigate to OTP page
    await expect(page).toHaveURL(/\/otp/)
    await expect(page.locator('text=Enter the code')).toBeVisible()
  })

  test('OTP screen renders 6 inputs', async ({ page }) => {
    await page.goto('/otp?email=test%40example.com')
    const inputs = page.locator('input[type="text"][maxlength="1"]')
    await expect(inputs).toHaveCount(6)
  })

  test('OTP inputs only accept numeric characters', async ({ page }) => {
    await page.goto('/otp?email=test%40example.com')
    const firstInput = page.locator('input[type="text"][maxlength="1"]').first()

    await firstInput.fill('a')
    await expect(firstInput).toHaveValue('')

    await firstInput.fill('1')
    await expect(firstInput).toHaveValue('1')
  })
})
