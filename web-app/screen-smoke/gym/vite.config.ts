import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const syntheticAuth = fileURLToPath(new URL('./AuthProvider.tsx', import.meta.url))

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: [
      { find: './AuthProvider', replacement: syntheticAuth },
      { find: /^.*(?:features\/auth|\.\.\/auth)\/AuthProvider$/, replacement: syntheticAuth },
    ],
  },
  define: { 'import.meta.env.VITE_PEEN_API_URL': JSON.stringify('http://127.0.0.1:18089') },
  server: { host: '127.0.0.1', port: 18089, strictPort: true, fs: { allow: ['../..'] } },
})
