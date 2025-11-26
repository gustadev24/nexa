import { defineConfig } from 'vite';
import path from 'path';
import Terminal from 'vite-plugin-terminal';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
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
  plugins: [Terminal()],
});
