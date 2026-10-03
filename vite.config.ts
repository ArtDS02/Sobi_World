import { defineConfig } from 'vitest/config';
import { devSaveApi } from './scripts/dev/saveApi';

export default defineConfig({
  // Relative asset URLs: the desktop build loads dist/ from app:// or file:// (spec §13).
  base: './',
  // Dev server only (`apply: 'serve'`): `npm run dev` plays the dev save file (DECISIONS AM-1).
  plugins: [devSaveApi()],
  // Build output is not source: `npm run dist:win` locks files there (EBUSY crashed the watcher).
  server: { watch: { ignored: ['**/release/**', '**/dist/**', '**/dist-electron/**'] } },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/electron/**/*.test.ts', 'tests/scripts/**/*.test.ts'],
  },
});
