import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: '/demos/index.html',
  },
  resolve: {
    alias: {
      'gridix': resolve(__dirname, 'src/index.ts'),
    },
  },
});
