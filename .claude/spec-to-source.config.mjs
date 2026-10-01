export default {
  maxFileLines: 300,
  maxFileLinesExceptions: ['src/i18n/vi.ts', 'src/core/config/breeds.ts'],
  layers: [
    { name: 'config',  dir: 'src/core/config', mayImport: [] },
    { name: 'domain',  dir: 'src/core',        mayImport: ['config'] },
    { name: 'adapter', dir: 'src/store',       mayImport: ['config', 'domain'] },
    { name: 'view',    dir: 'src/ui',          mayImport: ['config', 'domain', 'adapter'] },
    { name: 'view',    dir: 'src/game',        mayImport: ['config', 'domain', 'adapter'] },
  ],
  forbidden: [
    {
      dir: 'src/core',
      patterns: [/Date\.now\(/, /Math\.random\(/, /window\./, /document\./, /localStorage/],
      exceptions: ['src/core/save/storage.ts', 'src/core/rng.ts'],
    },
  ],
  barrels: [
    { index: 'src/styles/features/_index.scss', glob: 'src/styles/features/_*.scss' },
  ],
  bannedFileNames: ['utils', 'helpers', 'misc', 'common', 'shared'],
};
