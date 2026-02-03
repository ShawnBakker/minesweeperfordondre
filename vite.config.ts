/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // When building for GitHub Pages the CI sets BASE_URL to '/<repo-name>/'.
  // Locally it falls back to '/' so dev server works normally.
  base: process.env.BASE_URL ?? '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
});
