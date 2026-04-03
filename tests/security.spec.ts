import { test, expect } from '@playwright/test'

/**
 * PRD §7B-2: Security Test
 * Accessing /dashboard without a valid auth session MUST redirect to landing.
 */
test.describe('Security: Route Protection', () => {
  test('unauthenticated user is redirected from /dashboard to /', async ({ page }) => {
    // Clear all cookies/storage to ensure no session
    await page.context().clearCookies()

    const response = await page.goto('/dashboard')
    // Should end up on landing page
    await expect(page).toHaveURL('/')
    await expect(page.locator('h2')).toContainText('remind you about')
  })

  test('unauthenticated user cannot call /api/reminders', async ({ request }) => {
    const res = await request.get('/api/reminders')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('unauthenticated user cannot POST to /api/reminders', async ({ request }) => {
    const res = await request.post('/api/reminders', {
      data: { subject: 'Hack attempt', expiry_date: '2025-12-31', notify_email: true },
    })
    expect(res.status()).toBe(401)
  })

  test('cron endpoint rejects requests without CRON_SECRET', async ({ request }) => {
    const res = await request.get('/api/cron/process-reminders')
    expect(res.status()).toBe(401)
  })

  test('cron endpoint rejects wrong secret', async ({ request }) => {
    const res = await request.get('/api/cron/process-reminders', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    expect(res.status()).toBe(401)
  })
})
