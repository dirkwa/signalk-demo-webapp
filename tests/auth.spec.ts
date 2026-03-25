import { test, expect } from '@playwright/test'

test.describe('AuthCard', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="auth-card"]')
    await expect(card).toBeVisible()
    await expect(card.locator('input[placeholder="Username"]')).toBeVisible()
    await expect(card.locator('input[placeholder="Password"]')).toBeVisible()
  })

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="auth-card"]')
    await card.locator('input[placeholder="Username"]').fill('admin')
    await card.locator('input[placeholder="Password"]').fill('admin')
    await card.getByRole('button', { name: 'Login' }).click()
    await expect(card.getByText('Logout')).toBeVisible({ timeout: 5000 })
    await expect(card.getByText('admin').first()).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="auth-card"]')
    await card.locator('input[placeholder="Username"]').fill('wrong')
    await card.locator('input[placeholder="Password"]').fill('wrong')
    await card.getByRole('button', { name: 'Login' }).click()
    await expect(card.getByText('Invalid credentials', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('shows raw response after login', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('[data-testid="auth-card"]')
    await card.locator('input[placeholder="Username"]').fill('admin')
    await card.locator('input[placeholder="Password"]').fill('admin')
    await card.getByRole('button', { name: 'Login' }).click()
    await expect(card.locator('pre')).toBeVisible({ timeout: 5000 })
    await expect(card.locator('pre')).toContainText('token')
  })
})
