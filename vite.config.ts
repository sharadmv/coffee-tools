import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/coffee-tools/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stagg: resolve(__dirname, 'stagg.html'),
        assistant: resolve(__dirname, 'assistant.html'),
      },
    },
  },
})
