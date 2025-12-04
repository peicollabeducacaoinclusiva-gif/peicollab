import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/setup.ts',
        '**/mocks/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pei/ui': path.resolve(__dirname, '../ui/src'),
      '@pei/database': path.resolve(__dirname, '../database/src'),
      '@pei/auth': path.resolve(__dirname, '../auth/src'),
      '@pei/i18n': path.resolve(__dirname, '../i18n/src'),
    },
  },
});

