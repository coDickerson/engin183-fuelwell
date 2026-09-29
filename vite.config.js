import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(import.meta.dirname, 'frontend'),
  envDir: import.meta.dirname,
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'frontend/index.html'),
        start: resolve(import.meta.dirname, 'frontend/start.html'),
        dashboard: resolve(import.meta.dirname, 'frontend/dashboard.html'),
      },
    },
  },
});
