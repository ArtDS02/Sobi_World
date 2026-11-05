// Run identity for the animation review harness (docs/animation-review/ANTI_CACHE.md §B): the git head plus a hash of every
// changed or untracked source file, so evidence always says which code made it, uncommitted work included.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const ROOT = process.cwd();
export const sha1 = (data: Buffer | string) => createHash('sha1').update(data).digest('hex');
const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();

/** Folders whose content changes what a capture shows. */
const WATCHED = ['src', 'content', 'public/assets', 'tools/admin', 'scripts/anim-review'];
/** Code walked file by file for the per-file source table (assets are covered by the dirty hash). */
const SOURCE_DIRS = ['src/areas/adventure', 'src/systems/combat', 'content/adventure', 'content/schemas/adventure', 'tools/admin/battleLab.ts', 'scripts/anim-review'];

const walk = (path: string, out: string[]) => {
  if (!existsSync(path)) return;
  if (statSync(path).isFile()) return void out.push(path);
  for (const e of readdirSync(path, { withFileTypes: true })) walk(join(path, e.name), out);
};
const rel = (p: string) => relative(ROOT, p).split('\\').join('/');

export interface Stamp {
  head: string;
  dirty8: string;
  branch: string;
  runId: string;
}

export function makeStamp(now = new Date()): Stamp {
  const head = git('rev-parse', '--short', 'HEAD');
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  const changed = git('diff', 'HEAD', '--name-only', '--', ...WATCHED).split('\n').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...WATCHED).split('\n').filter(Boolean);
  const lines = [...new Set([...changed, ...untracked])].sort().map((f) => `${f}:${existsSync(join(ROOT, f)) ? sha1(readFileSync(join(ROOT, f))) : 'deleted'}`);
  const dirty8 = sha1(lines.join('\n')).slice(0, 8);
  const p = (n: number) => String(n).padStart(2, '0');
  const t = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  return { head, dirty8, branch, runId: `${t}-${head}-${dirty8}` };
}

export interface SourceRow {
  file: string;
  sha1: string;
  changedSincePrevRun: boolean | null;
}

/** SHA-1 of every source file that shapes the battle animation; `prev` (a previous run's table) marks what changed. */
export function sourceTable(prev?: readonly SourceRow[]): SourceRow[] {
  const files: string[] = [];
  for (const d of SOURCE_DIRS) walk(join(ROOT, d), files);
  const before = new Map((prev ?? []).map((r) => [r.file, r.sha1]));
  return files
    .map(rel)
    .filter((f) => /\.(ts|json|scss)$/.test(f))
    .sort()
    .map((file) => {
      const h = sha1(readFileSync(join(ROOT, file)));
      return { file, sha1: h, changedSincePrevRun: prev ? before.get(file) !== h : null };
    });
}
