import { defineConfig } from '@playwright/test'

const useMock = process.env.USE_MOCK === 'true'
const baseURL = process.env.SK_URL ?? 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL,
  },
  webServer: useMock
    ? {
        command: 'USE_MOCK=true npx vite --host 127.0.0.1',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
})
