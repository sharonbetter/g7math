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
    // 用户系统后端（server/，端口 8787）。LLM 批改等接口仍由 grade-api 中间件本地处理。
    proxy: {
      '/api/auth': 'http://127.0.0.1:8787',
      '/api/me': 'http://127.0.0.1:8787',
      '/api/data': 'http://127.0.0.1:8787',
      '/api/health': 'http://127.0.0.1:8787',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 5273,
  },
})
