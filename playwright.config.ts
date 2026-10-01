// Playwright: only the Electron smoke test (spec §14.8), run against the production build.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  workers: 1,
  reporter: 'list',
});
