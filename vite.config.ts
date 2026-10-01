import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset URLs: the desktop build loads dist/ from app:// or file:// (spec §13).
  base: './',
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
