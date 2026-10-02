// Admin dashboard dev server (`npm run admin`, DECISIONS A7-1). Development tool only: the shipped
// app is built from vite.config.ts and never contains admin.html or this API.
import { defineConfig } from 'vite';
import { adminApi } from './scripts/admin/api';

export default defineConfig({
  plugins: [adminApi()],
  server: { port: 5175, strictPort: false, open: '/admin.html' },
});
