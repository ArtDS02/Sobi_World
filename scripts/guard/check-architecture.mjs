#!/usr/bin/env node
// `npm run guard`: architecture rules (architecture.mjs) over the source tree, plus the SCSS barrel
// check. Exit 1 on any violation so `npm run check` fails loudly.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { findViolations } from './architecture.mjs';
import cfg from './config.mjs';

const CWD = process.cwd();
const IGNORE = new Set(['node_modules', 'dist', 'dist-electron', 'release', 'coverage', '.git']);
const toPosix = (p) => p.split('\\').join('/');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (IGNORE.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (cfg.sourceExtensions.includes(extname(full))) out.push(full);
  }
  return out;
}

/** A style partial missing from its index is never bundled. */
function barrelViolations() {
  const found = [];
  for (const barrel of cfg.barrels) {
    if (!existsSync(barrel.index)) {
      found.push({ rule: 'barrel', file: barrel.index, message: 'barrel file is missing' });
      continue;
    }
    const indexSrc = readFileSync(barrel.index, 'utf8');
    const dir = dirname(barrel.index);
    for (const entry of readdirSync(dir)) {
      if (entry === basename(barrel.index)) continue;
      const stem = basename(entry, extname(entry)).replace(/^_/, '');
      if (!new RegExp(`['"\`][^'"\`]*\\b${stem}(\\.[a-z]+)?['"\`]`).test(indexSrc)) {
        found.push({ rule: 'barrel', file: toPosix(join(dir, entry)), message: 'not listed in its index' });
      }
    }
  }
  return found;
}

const files = cfg.roots
  .flatMap((r) => walk(join(CWD, r)))
  .map((full) => ({ path: toPosix(relative(CWD, full)), source: readFileSync(full, 'utf8') }));
const violations = [...findViolations(files, cfg), ...barrelViolations()];

if (violations.length === 0) {
  console.log(`architecture OK — ${files.length} files checked`);
  process.exit(0);
}
const byRule = Object.groupBy(violations, (v) => v.rule);
for (const [rule, list] of Object.entries(byRule)) {
  console.error(`\n${rule.toUpperCase()} (${list.length})`);
  for (const v of list) console.error(`  ${v.file}\n    ${v.message}`);
}
console.error(`\n${violations.length} violation(s), ${files.length} files checked`);
process.exit(1);
