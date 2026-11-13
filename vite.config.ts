import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative paths work on both the Cloudflare Pages root domain and GitHub Pages subpath.
  base: './',
  plugins: [react()],
  server: { allowedHosts: true },
});
