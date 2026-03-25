import { test, expect } from '@playwright/test'

test.describe('UnitPrefsCard', () => {
  test('renders with unit selectors', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="unitprefs-card"]')
    await expect(card).toBeVisible()
    await expect(card.getByText('Speed')).toBeVisible()
    await expect(card.getByText('Depth')).toBeVisible()
    await expect(card.getByText('Temperature')).toBeVisible()
  })

  test('speed unit can be changed', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="unitprefs-card"]')
    const speedSelect = card.locator('select').first()
    await speedSelect.selectOption('mph')
    await expect(speedSelect).toHaveValue('mph')
  })
})
