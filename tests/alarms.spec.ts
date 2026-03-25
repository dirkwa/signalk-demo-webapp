import { test, expect } from '@playwright/test'

test.describe('AlarmsCard', () => {
  test('renders and shows notifications', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="alarms-card"]')
    await expect(card).toBeVisible()
    // Mock server has one notification
    await expect(card.getByText('Mock low battery warning')).toBeVisible({ timeout: 5000 })
  })

  test('shows severity badge', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="alarms-card"]')
    await expect(card.getByText('warn', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('acknowledge button works', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="alarms-card"]')
    await expect(card.getByText('Acknowledge')).toBeVisible({ timeout: 5000 })
    await card.getByText('Acknowledge').click()
    await expect(card.getByText('acknowledged')).toBeVisible({ timeout: 5000 })
  })
})
