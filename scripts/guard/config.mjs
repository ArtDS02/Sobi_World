// Architecture guard config (ARCHITECTURE.md §3): app → areas/* → systems/* → core/*; ui is shared by
// app and areas; an Area never imports another Area (`isolate`). Legacy Sobi Farm layers (store, game)
// stay listed until GĐ1 step 1 moves them into app/ and areas/farm/.
const PURE = [
  /Date\.now\(/, /Math\.random\(/, /new Date\(\)/, /window\./, /document\./, /localStorage/,
  /indexedDB/, /from 'idb'/, /navigator\./, /fetch\(/, /require\(/, /from 'node:/,
];

export default {
  maxFileLines: 300,
  maxFileLinesExceptions: ['src/i18n/vi.ts', 'src/core/config/breeds.ts'],
  layers: [
    { name: 'core', dir: 'src/core', mayImport: [] },
    { name: 'systems', dir: 'src/systems', mayImport: ['core'] },
    { name: 'areas', dir: 'src/areas', isolate: true, mayImport: ['core', 'systems', 'ui', 'i18n'] },
    { name: 'ui', dir: 'src/ui', mayImport: ['core', 'systems', 'i18n', 'store'] },
    { name: 'app', dir: 'src/app', mayImport: ['core', 'systems', 'areas', 'ui', 'platform', 'i18n'] },
    { name: 'platform', dir: 'src/platform', mayImport: ['core'] },
    { name: 'i18n', dir: 'src/i18n', mayImport: [] },
    // Legacy (Sobi Farm): removed once moved.
    { name: 'store', dir: 'src/store', mayImport: ['core'] },
    { name: 'game', dir: 'src/game', mayImport: ['core', 'store', 'i18n'] },
  ],
  forbidden: [
    { dir: 'src/core', patterns: PURE },
    { dir: 'src/systems', patterns: PURE },
    // An Area's logic is pure like core: simulate() serves online, background and offline alike.
    { match: /^src\/areas\/[^/]+\/logic\//, patterns: PURE },
    { dir: 'src', patterns: [/from 'electron'/, /from 'node:/, /require\(/] },
  ],
  barrels: [{ index: 'src/styles/features/_index.scss', glob: 'src/styles/features/_*.scss' }],
  bannedFileNames: ['utils', 'helpers', 'misc', 'common', 'shared'],
  sourceExtensions: ['.ts', '.mjs', '.js'],
  roots: ['src'],
};
