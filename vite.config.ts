import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js',
        'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js',
      ],
    },
  },
});
