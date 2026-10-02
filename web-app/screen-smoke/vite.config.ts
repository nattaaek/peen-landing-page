import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {fileURLToPath} from 'node:url'
export default defineConfig({plugins:[react()],resolve:{alias:[{find:/.*\/AuthProvider$/,replacement:fileURLToPath(new URL('./AuthProvider.tsx',import.meta.url))}]},define:{'import.meta.env.VITE_PEEN_API_URL':JSON.stringify('http://127.0.0.1:18082')},server:{host:'127.0.0.1',port:18082,strictPort:true}})
