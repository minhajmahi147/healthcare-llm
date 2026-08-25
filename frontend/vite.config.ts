/**
 * Vite development/build config for the React frontend.
 *
 * - Enables the React plugin (JSX + Fast Refresh).
 * - Maps `@/` imports to `src/` so API, pages, and components can use path aliases.
 * - Serves the app on port 5173 and proxies `/api` to Django at 127.0.0.1:8000
 *   so the browser can call the backend without CORS issues in local dev.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
