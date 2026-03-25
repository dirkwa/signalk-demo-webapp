import { test, expect } from '@playwright/test'

test.describe('ResourcesCard', () => {
  test('renders with waypoints and routes sections', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="resources-card"]')
    await expect(card).toBeVisible()
    await expect(card.getByRole('heading', { name: 'Waypoints' })).toBeVisible()
    await expect(card.getByRole('heading', { name: 'Routes (read-only)' })).toBeVisible()
  })

  test('shows mock route', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="resources-card"]')
    await expect(card.getByText('Helsinki Harbor Tour')).toBeVisible({ timeout: 5000 })
  })

  test('raw JSON toggle works', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="resources-card"]')
    await expect(card.getByText('show raw JSON')).toBeVisible({ timeout: 5000 })
    await card.getByText('show raw JSON').click()
    await expect(card.locator('pre')).toBeVisible()
  })
})
