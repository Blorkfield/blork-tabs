import { defineConfig } from 'vite';
import { resolve } from 'path';

// Testbed uses the built dist/ folder to simulate npm package usage
export default defineConfig({
  server: {
    port: 5174,
    open: true,
  },
  resolve: {
    alias: {
      // Point to built package to simulate npm import
      '@blorkfield/blork-tabs/styles.css': resolve(__dirname, '../dist/styles.css'),
      '@blorkfield/blork-tabs': resolve(__dirname, '../dist/index.js'),
    },
  },
});
