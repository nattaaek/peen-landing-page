import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
export default defineConfig({
 root: fileURLToPath(new URL('.',import.meta.url)), base:'/app/', publicDir: fileURLToPath(new URL('../../public',import.meta.url)),
 plugins:[react()], resolve:{alias:[{find:'./AuthProvider',replacement:fileURLToPath(new URL('./AuthProvider.tsx',import.meta.url))},{find:/^.*(?:features\/auth|\.\.\/auth)\/AuthProvider$/, replacement:fileURLToPath(new URL('./AuthProvider.tsx',import.meta.url))}]},
 define:{'import.meta.env.VITE_PEEN_API_URL':JSON.stringify('http://127.0.0.1:18087')}, server:{host:'127.0.0.1',port:18087,strictPort:true},
})
