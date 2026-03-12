import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ✅ لا نضع base لـ Render (يعمل من الجذر)
  server: {
    port: 5173,
    open: true
  }
})
