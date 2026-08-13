import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'https://f955-199-167-151-202.ngrok-free.app';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      },
      // Images (product/category uploads, payment proofs) are served from
      // /uploads on the backend, separate from /api — without this rule,
      // the browser has nowhere to route those requests and every uploaded
      // image shows as broken.
      '/uploads': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    }
  },
})