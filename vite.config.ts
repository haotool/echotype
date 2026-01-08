import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@background': resolve(__dirname, 'src/background'),
      '@content': resolve(__dirname, 'src/content'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize for smaller bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options/index.html'),
        offscreen: resolve(__dirname, 'src/offscreen/index.html'),
      },
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Shared utilities go to a common chunk
          if (id.includes('src/shared/')) {
            if (id.includes('protocol')) return 'protocol';
            if (id.includes('utils') || id.includes('types')) return 'utils';
          }
          return undefined;
        },
      },
    },
    // Target modern browsers for smaller output
    target: 'esnext',
    // Chunk size warning threshold
    chunkSizeWarningLimit: 500,
  },
});
