import { test, expect, Page } from '@playwright/test'

/**
 * Helper: inject a mock Supabase session so we can test the dashboard
 * without going through real OTP flow.
 */
async function injectMockSession(page: Page) {
  // Mock all Supabase auth/session calls
  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-user-id-12345',
        email: 'test@example.com',
        role: 'authenticated',
      }),
    })
  })

  // Mock the reminders API with pre-loaded data
  await page.route('/api/reminders', async (route) => {
    if (route.request().method() === 'GET') {
      const reminders = (route.request().url().includes('_count=3'))
        ? Array.from({ length: 3 }, (_, i) => ({
            id: `mock-id-${i}`,
            subject: `Test Reminder ${i + 1}`,
            expiry_date: '2026-12-31',
            notify_email: true,
            notify_wa: false,
            notify_telegram: false,
          }))
        : []
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reminders }) })
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ reminder: { id: 'new-mock-id', subject: body.subject } }),
      })
    }
  })

  await page.route('/api/user/tier', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tier: 'free' }) })
  })
}

/**
 * PRD §7B-4: Upsell Enforcement
 * Add 3 items, attempt 4th → Premium Modal must appear.
 */
test.describe('Upsell: Premium Modal Enforcement', () => {
  test('premium modal triggers when free user adds 4th item', async ({ page }) => {
    await page.context().clearCookies()

    // Mock the API: 3 reminders already exist, tier = free
    await page.route('/api/reminders', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reminders: [
              { id: '1', subject: 'Contract A', expiry_date: '2026-12-31', notify_email: true, notify_wa: false, notify_telegram: false },
              { id: '2', subject: 'License B', expiry_date: '2026-11-30', notify_email: true, notify_wa: false, notify_telegram: false },
              { id: '3', subject: 'Permit C', expiry_date: '2026-10-15', notify_email: true, notify_wa: false, notify_telegram: false },
            ],
          }),
        })
      } else {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ reminder: { id: '4', subject: 'test' } }) })
      }
    })

    await page.route('/api/user/tier', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tier: 'free' }) })
    })

    // Mock middleware/auth to allow dashboard access
    await page.route('**/auth/v1/**', async route => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-user', email: 'test@example.com' }),
      })
    })

    await page.goto('/dashboard')

    // Wait for reminders to load (3 items visible)
    await expect(page.locator('text=Contract A')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=License B')).toBeVisible()
    await expect(page.locator('text=Permit C')).toBeVisible()

    // Click the FAB to add a 4th item
    const fab = page.locator('[data-testid="fab-add"]')
    await expect(fab).toBeVisible()
    await fab.click()

    // Premium Modal should appear
    await expect(page.locator('text=PREMIUM')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Upgrade to Premium')).toBeVisible()
  })

  test('premium modal can be closed with "No thanks"', async ({ page }) => {
    await page.route('/api/reminders', async route => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          reminders: [
            { id: '1', subject: 'A', expiry_date: '2026-12-31', notify_email: true, notify_wa: false, notify_telegram: false },
            { id: '2', subject: 'B', expiry_date: '2026-12-31', notify_email: true, notify_wa: false, notify_telegram: false },
            { id: '3', subject: 'C', expiry_date: '2026-12-31', notify_email: true, notify_wa: false, notify_telegram: false },
          ],
        }),
      })
    })
    await page.route('/api/user/tier', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tier: 'free' }) })
    })
    await page.route('**/auth/v1/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u', email: 'test@example.com' }) })
    })

    await page.goto('/dashboard')
    await expect(page.locator('text=A')).toBeVisible({ timeout: 10000 })
    await page.locator('[data-testid="fab-add"]').click()
    await expect(page.locator('text=PREMIUM')).toBeVisible()

    // Close modal
    await page.locator('text=No thanks').click()
    await expect(page.locator('text=PREMIUM')).not.toBeVisible()
  })
})

/**
 * Dashboard rendering tests
 */
test.describe('Dashboard: Digital Pulse', () => {
  test('shows empty state when no reminders', async ({ page }) => {
    await page.route('/api/reminders', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reminders: [] }) })
    })
    await page.route('/api/user/tier', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tier: 'free' }) })
    })
    await page.route('**/auth/v1/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u', email: 'test@example.com' }) })
    })

    await page.goto('/dashboard')
    await expect(page.locator('text=No reminders yet')).toBeVisible({ timeout: 10000 })
  })

  test('FAB is visible on dashboard', async ({ page }) => {
    await page.route('/api/reminders', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reminders: [] }) })
    })
    await page.route('/api/user/tier', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tier: 'free' }) })
    })
    await page.route('**/auth/v1/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u', email: 'test@example.com' }) })
    })

    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="fab-add"]')).toBeVisible({ timeout: 10000 })
  })
})
