// The player-build rules (ARCHITECTURE §10: "build for players has no Admin — needs a test"),
// checked on fake package trees. The real dist/ is checked by `npm run verify:build`.
import { describe, expect, it } from 'vitest';
import { checkPackage, type BuildFile } from '../../scripts/build/checks';

const clean = (): BuildFile[] => [
  { path: 'package.json', text: '{}' },
  { path: 'dist/index.html', text: '<title>Sobi World</title>' },
  { path: 'dist/assets/start-1.js', text: 'ns="http://www.w3.org/2000/svg"; see https://phaser.io/' },
  { path: 'dist/assets/pig.png', text: null },
  { path: 'dist-electron/main.cjs', text: 'cancel urls ["http://*/*","https://*/*"]' },
  { path: 'dist-electron/preload.cjs', text: '' },
];

describe('player build check', () => {
  it('accepts a clean package', () => {
    expect(checkPackage(clean())).toEqual([]);
  });

  it('requires the game and the Electron entries', () => {
    expect(checkPackage(clean().filter((f) => f.path !== 'dist/index.html'))).toEqual(['dist/index.html is missing']);
    expect(checkPackage(clean().filter((f) => f.path !== 'dist-electron/main.cjs'))).toEqual([
      'dist-electron/main.cjs is missing',
    ]);
  });

  it('rejects the Admin dashboard in any form', () => {
    const withAdmin = (extra: BuildFile) => checkPackage([...clean(), extra]);
    expect(withAdmin({ path: 'dist/admin.html', text: '<html>' }).join()).toContain('Admin file');
    expect(withAdmin({ path: 'dist/assets/admin-9f.js', text: 'x' }).join()).toContain('Admin file');
    expect(withAdmin({ path: 'dist/assets/app.js', text: 'fetch("/__admin/files")' }).join()).toContain('/__admin');
    expect(withAdmin({ path: 'dist/assets/app.js', text: 'import("./admin.html")' }).join()).toContain('admin.html');
  });

  it('rejects dev-server leftovers', () => {
    const files = clean();
    files[1] = { path: 'dist/index.html', text: '<meta name="unin-dev-saves" content="C:/x">' };
    expect(checkPackage(files).join()).toContain('unin-dev-saves');
  });

  it('rejects anything outside dist/, dist-electron/ and package.json', () => {
    const problems = checkPackage([
      ...clean(),
      { path: 'content/farm/pigs.json', text: '{}' },
      { path: 'src/main.ts', text: '' },
      { path: 'node_modules/zod/index.js', text: '' },
    ]);
    expect(problems).toContain('unexpected file in package: content/farm/pigs.json');
    expect(problems).toContain('unexpected file in package: node_modules/zod/index.js');
    expect(problems.some((p) => p.includes('source/map file'))).toBe(true);
  });

  it('rejects source maps', () => {
    expect(checkPackage([...clean(), { path: 'dist/assets/start-1.js.map', text: null }]).join()).toContain(
      'source/map file',
    );
  });

  it('rejects an external URL in the game (offline only), but not XML namespaces', () => {
    const files = clean();
    files.push({ path: 'dist/index.html', text: '<link href="https://fonts.googleapis.com/css2?family=Baloo">' });
    expect(checkPackage(files).join()).toContain('https://fonts.googleapis.com');
  });
});
