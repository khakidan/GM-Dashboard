// vitest.config.ts

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    // jsdom gives us window, localStorage, etc. in tests
    environment: 'jsdom',
    pool: 'forks',
    forks: {
      maxForks: 2,
      minForks: 1,
    },
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**'],

    // Coverage via v8 — fast, no Babel required
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/services/**/*.ts',
        'src/hooks/**/*.ts',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/vite-env.d.ts',
      ],
      reporter: ['text', 'lcov'],
    },
  },
});