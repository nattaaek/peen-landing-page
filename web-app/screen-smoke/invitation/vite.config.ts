import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))
export default defineConfig({
 root: local('.'), base: '/app/', publicDir: local('../../public'), plugins: [react()],
 resolve: { alias: [
  { find: /^.*lib\/invitationBootstrap(?:\.ts)?$/, replacement: local('./bootstrap.ts') },
  { find: './AuthProvider', replacement: local('./AuthProvider.tsx') },
  { find: /^.*(?:features\/auth|\.\.\/auth)\/AuthProvider$/, replacement: local('./AuthProvider.tsx') },
 ] },
 define: {
  'import.meta.env.VITE_PEEN_API_URL': JSON.stringify('http://127.0.0.1:18089'),
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
  'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
  'import.meta.env.VITE_DEV_AUTH_BYPASS': JSON.stringify('false'),
 },
 server: { host: '127.0.0.1', port: 18089, strictPort: true },
})
