import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const useMock = process.env.USE_MOCK === 'true'

export default defineConfig(async () => {
  const plugins: PluginOption[] = [react(), tailwindcss()]

  if (useMock) {
    const { signalkMockPlugin } = await import('./mock/server.ts')
    plugins.push(signalkMockPlugin())
  }

  return {
    plugins,
    base: './',
    build: {
      outDir: 'dist',
    },
  }
})
