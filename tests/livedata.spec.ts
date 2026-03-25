import { test, expect } from '@playwright/test'

test.describe('LiveDataCard', () => {
  test('renders with subscribe button', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="livedata-card"]')
    await expect(card).toBeVisible()
    await expect(card.getByRole('button', { name: 'Subscribe' })).toBeVisible()
  })

  test('subscribes and shows data', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="livedata-card"]')
    await card.getByRole('button', { name: 'Subscribe' }).click()
    await expect(card.getByText('Speed')).toBeVisible()
    // Wait for data to arrive from mock WS
    await expect(card.getByText('kn')).toBeVisible({ timeout: 5000 })
  })

  test('raw delta toggle works', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="livedata-card"]')
    await card.getByRole('button', { name: 'Subscribe' }).click()
    // Wait for at least one delta
    await expect(card.getByText('show raw JSON')).toBeVisible({ timeout: 5000 })
    await card.getByText('show raw JSON').click()
    await expect(card.locator('pre')).toBeVisible()
  })
})
