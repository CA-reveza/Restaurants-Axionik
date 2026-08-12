import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),                 // Admin Dashboard
        portal: resolve(__dirname, 'public/portal/index.html'), // Captive Portal
        kds: resolve(__dirname, 'public/kds/index.html')        // Kitchen Display
      }
    }
  }
});
