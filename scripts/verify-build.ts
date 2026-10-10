// npm run verify:build — checks what the player gets: dist/, dist-electron/ and, when it exists,
// the packed app.asar of release/win-unpacked. Part of `npm run dist:win`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { checkPackage, isTextPath, type BuildFile } from './build/checks';

const walk = (root: string, dir = root): BuildFile[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(root, full);
    const path = relative(root, full).replaceAll(sep, '/');
    return [{ path, text: isTextPath(path) ? readFileSync(full, 'utf8') : null }];
  });

const prefixed = (prefix: string, files: BuildFile[]) => files.map((f) => ({ ...f, path: `${prefix}/${f.path}` }));

const problems: string[] = [];
if (!existsSync('dist') || !existsSync('dist-electron')) {
  console.error('verify:build — dist/ or dist-electron/ is missing; run `npm run build` first');
  process.exit(1);
}
const files = [
  ...prefixed('dist', walk('dist')),
  ...prefixed('dist-electron', walk('dist-electron')),
  { path: 'package.json', text: readFileSync('package.json', 'utf8') },
];
problems.push(...checkPackage(files));

if (problems.length > 0) {
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\nverify:build failed — ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`verify:build OK — ${files.length} files in dist/ and dist-electron/: no Admin, no dev tooling, no external URL`);
