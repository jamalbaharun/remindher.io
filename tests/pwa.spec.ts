import { test, expect } from '@playwright/test'

/**
 * PRD §7B-3: PWA Check
 * manifest.json and service worker must load correctly.
 */
test.describe('PWA: Manifest & Service Worker', () => {
  test('manifest.json is valid and accessible', async ({ request }) => {
    const res = await request.get('/manifest.json')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('json')

    const manifest = await res.json()
    expect(manifest.name).toBeTruthy()
    expect(manifest.icons).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.display).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
  })

  test('service worker file is accessible', async ({ request }) => {
    const res = await request.get('/sw.js')
    expect(res.status()).toBe(200)
  })

  test('landing page has PWA meta tags', async ({ page }) => {
    await page.goto('/')
    // Manifest link tag
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json')
  })

  test('landing page has apple-web-app-capable meta', async ({ page }) => {
    await page.goto('/')
    const metaApple = page.locator('meta[name="apple-mobile-web-app-capable"]')
    await expect(metaApple).toHaveAttribute('content', 'yes')
  })

  test('landing page has theme-color meta', async ({ page }) => {
    await page.goto('/')
    const metaTheme = page.locator('meta[name="theme-color"]')
    await expect(metaTheme).toHaveCount(1)
  })
})
