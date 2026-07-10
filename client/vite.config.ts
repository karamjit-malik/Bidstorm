import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API + socket calls to the backend during development.
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:5000',
        changeOrigin: true,
      },
      // Uploaded auction images are served by the backend at /uploads; proxy
      // them too so relative image URLs resolve during dev (no VITE env needed).
      '/uploads': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
