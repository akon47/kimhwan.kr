import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Local dev: /api/status comes from the live gateway (see akon47/homelab-status).
    proxy: {
      // Realtime backend (akon47/kimhwan-live). It only accepts WebSockets from allowed origins, so development
      // needs a local instance: ./gradlew bootRun --args='--spring.profiles.active=local'
      '/api/live': { target: process.env.LIVE_PROXY_TARGET ?? 'http://localhost:8080', ws: true },
      '/api': { target: 'https://kimhwan.kr', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
