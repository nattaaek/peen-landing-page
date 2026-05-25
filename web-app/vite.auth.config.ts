import { resolve } from 'node:path'
import { defineConfig } from 'vite'

/** OAuth callback page at /auth/callback/ (separate from /app/ SPA). */
export default defineConfig({
  base: '/auth/callback/',
  build: {
    outDir: resolve(__dirname, '../auth/callback'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'auth-callback.html'),
      },
    },
  },
})
