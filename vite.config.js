import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(import.meta.dirname, 'frontend'),
  envDir: import.meta.dirname,
  // Local dev: /api/* goes to `npm run dev:api` (on Vercel the api/ folder serves it).
  server: { proxy: { '/api': 'http://localhost:8787' } },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'frontend/index.html'),
        howItWorks: resolve(import.meta.dirname, 'frontend/how-it-works.html'),
        families: resolve(import.meta.dirname, 'frontend/families.html'),
        mealPlanning: resolve(import.meta.dirname, 'frontend/meal-planning.html'),
        questions: resolve(import.meta.dirname, 'frontend/questions.html'),
        start: resolve(import.meta.dirname, 'frontend/start.html'),
        demo: resolve(import.meta.dirname, 'frontend/demo.html'),
        dashboard: resolve(import.meta.dirname, 'frontend/dashboard.html'),
        meals: resolve(import.meta.dirname, 'frontend/meals.html'),
        careTeam: resolve(import.meta.dirname, 'frontend/care-team.html'),
        notes: resolve(import.meta.dirname, 'frontend/notes.html'),
        health: resolve(import.meta.dirname, 'frontend/health.html'),
        howItWasBuilt: resolve(import.meta.dirname, 'frontend/how-it-was-built.html'),
        join: resolve(import.meta.dirname, 'frontend/join.html'),
        waitlist: resolve(import.meta.dirname, 'frontend/waitlist.html'),
        wall: resolve(import.meta.dirname, 'frontend/wall.html'),
        dishes: resolve(import.meta.dirname, 'frontend/dishes.html'),
        swap: resolve(import.meta.dirname, 'frontend/swap.html'),
        stats: resolve(import.meta.dirname, 'frontend/stats.html'),
      },
    },
  },
});
