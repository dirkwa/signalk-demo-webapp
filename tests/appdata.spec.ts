import { test, expect } from '@playwright/test'

test.describe('AppDataCard', () => {
  test('renders with global and user panels', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="appdata-card"]')
    await expect(card).toBeVisible()
    await expect(card.getByText('Global scope')).toBeVisible()
    await expect(card.getByText('User scope')).toBeVisible()
  })

  test('user scope shows login required when not authenticated', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="appdata-card"]')
    await expect(card.getByText('Login required')).toBeVisible()
  })
})
