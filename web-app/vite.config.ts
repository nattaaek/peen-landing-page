import { resolve } from 'node:path'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  base: '/app/',
  build: {
    outDir: resolve(__dirname, '../app'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
