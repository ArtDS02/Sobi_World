import { defineConfig } from 'vitest/config';
import { devSaveApi } from './scripts/dev/saveApi';

export default defineConfig({
  // Relative asset URLs: the desktop build loads dist/ from app:// or file:// (spec §13).
  base: './',
  // Dev server only (`apply: 'serve'`): `npm run dev` plays the dev save file (DECISIONS AM-1).
  plugins: [devSaveApi()],
  // Build output and art work folders are not source: `npm run dist:win` locks files in release/, and a browser download
  // still in progress in art_inbox/ (*.crdownload) is locked too — either crashed the watcher with EBUSY.
  server: { watch: { ignored: ['**/release/**', '**/dist/**', '**/dist-electron/**', '**/art_inbox/**', '**/asset/**'] } },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/electron/**/*.test.ts', 'tests/scripts/**/*.test.ts'],
  },
});
