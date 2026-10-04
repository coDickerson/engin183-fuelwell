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
        howItWorks: resolve(import.meta.dirname, 'frontend/how-it-works.html'),
        families: resolve(import.meta.dirname, 'frontend/families.html'),
        mealPlanning: resolve(import.meta.dirname, 'frontend/meal-planning.html'),
        questions: resolve(import.meta.dirname, 'frontend/questions.html'),
        start: resolve(import.meta.dirname, 'frontend/start.html'),
        dashboard: resolve(import.meta.dirname, 'frontend/dashboard.html'),
        meals: resolve(import.meta.dirname, 'frontend/meals.html'),
        careTeam: resolve(import.meta.dirname, 'frontend/care-team.html'),
        health: resolve(import.meta.dirname, 'frontend/health.html'),
        howItWasBuilt: resolve(import.meta.dirname, 'frontend/how-it-was-built.html'),
      },
    },
  },
});
