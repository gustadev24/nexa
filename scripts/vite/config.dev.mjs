import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@/scenes': path.resolve(__dirname, '../src/scenes'),
      '@/entities': path.resolve(__dirname, '../src/entities'),
      '@/core': path.resolve(__dirname, '../src/core'),
      '@/ui': path.resolve(__dirname, '../src/ui'),
      '@/assets': path.resolve(__dirname, '../src/assets'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    port: 8080,
  },
});
