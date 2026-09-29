import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Frcomp/', 
  build: { outDir: 'dist' },
})
