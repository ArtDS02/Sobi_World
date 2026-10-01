// Builds electron/ (main + preload) into dist-electron/*.cjs. Each entry is bundled on its own:
// the sandboxed preload cannot load sibling modules (DECISIONS R02-1).
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    minify: false,
    target: 'node22',
    lib: {
      entry: { main: 'electron/main.ts', preload: 'electron/preload.ts' },
      formats: ['cjs'],
      fileName: (_format, name) => `${name}.cjs`,
    },
    rollupOptions: {
      external: ['electron', /^node:/, ...builtinModules],
    },
  },
});
