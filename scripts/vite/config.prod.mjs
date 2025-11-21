import { defineConfig } from 'vite';
import path from 'path';

const phasermsg = () => {
  return {
    name: 'phasermsg',
    buildStart() {
      process.stdout.write(`Building for production...\n`);
    },
    buildEnd() {
      const line = '---------------------------------------------------------';
      const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
      process.stdout.write(`${line}\n${msg}\n${line}\n`);

      process.stdout.write(`✨ Done ✨\n`);
    },
  };
};

export default defineConfig({
  base: './',
  logLevel: 'warning',
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
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
  },
  server: {
    port: 8080,
  },
  plugins: [phasermsg()],
});
