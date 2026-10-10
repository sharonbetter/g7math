import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { gradeApiPlugin } from './grade-api.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), gradeApiPlugin()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5273,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5273,
  },
})
