import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on any static host
  // (Vercel, Netlify, GitHub Pages…) without extra config.
  base: './',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
