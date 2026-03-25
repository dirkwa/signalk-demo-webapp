import { test, expect } from '@playwright/test'

test.describe('ServerCard', () => {
  test('renders and shows server info', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="server-card"]')
    await expect(card).toBeVisible()
    await expect(card.locator('text=signalk-server-node')).toBeVisible({ timeout: 5000 })
  })

  test('shows API version availability', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="server-card"]')
    await expect(card.getByText('API v1')).toBeVisible({ timeout: 5000 })
    await expect(card.getByText('API v2')).toBeVisible()
  })

  test('raw JSON toggle works', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="server-card"]')
    await card.getByText('show raw JSON').click()
    await expect(card.locator('pre')).toBeVisible()
    await card.getByText('hide raw JSON').click()
    await expect(card.locator('pre')).not.toBeVisible()
  })
})
