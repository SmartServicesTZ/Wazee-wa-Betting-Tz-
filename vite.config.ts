import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Wazee-wa-Betting-Tz-/',
  plugins: [react()],
  server: { allowedHosts: true },
});
