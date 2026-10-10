// Rules for the player build (ARCHITECTURE §10, §11; spec §13.2): no Admin, no dev tooling, no
// network. Pure functions over a file list so tests can feed fake trees; the CLIs (verify-build,
// verify-installer) read the real folders and the packed app.asar.

export interface BuildFile {
  /** Path inside the package, forward slashes, no leading slash. */
  path: string;
  /** Text content; null for binary files (only their path is checked). */
  text: string | null;
}

/** Top-level entries electron-builder may pack (package.json `build.files`). */
const ALLOWED_ROOTS = ['dist/', 'dist-electron/', 'package.json'];

/** Strings that only exist in the Admin dashboard or in dev servers. */
const FORBIDDEN_TEXT = ['admin.html', '/__admin', 'adminApi', 'unin-dev-saves'];

/** Hosts that appear in the bundle only as XML/JSON-schema identifiers or comments, never fetched. */
const INERT_URL = /^https?:\/\/(www\.w3\.org|json-schema\.org|phaser\.io|json-schema\.org|github\.com\/photonstorm)\b/;
const URL_PATTERN = /https?:\/\/[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+[^\s"'`)<>\\]*/g;

const isText = (path: string) => /\.(html|css|js|cjs|mjs|json|svg)$/i.test(path);
export const isTextPath = isText;

/** Every problem found in a packed tree; an empty list means the build is clean. */
export function checkPackage(files: BuildFile[]): string[] {
  const problems: string[] = [];
  const paths = files.map((f) => f.path);

  if (!paths.includes('dist/index.html')) problems.push('dist/index.html is missing');
  if (!paths.includes('dist-electron/main.cjs')) problems.push('dist-electron/main.cjs is missing');
  if (!paths.includes('dist-electron/preload.cjs')) problems.push('dist-electron/preload.cjs is missing');

  for (const p of paths) {
    if (!ALLOWED_ROOTS.some((r) => p === r || p.startsWith(r))) problems.push(`unexpected file in package: ${p}`);
    if (/(^|[/._-])admin([/._-]|$)/i.test(p)) problems.push(`Admin file in package: ${p}`);
    if (/\.(ts|map)$/i.test(p) && !p.endsWith('.d.ts')) problems.push(`source/map file in package: ${p}`);
  }

  for (const f of files) {
    if (f.text === null || !isText(f.path)) continue;
    for (const needle of FORBIDDEN_TEXT) {
      if (f.text.includes(needle)) problems.push(`${f.path} mentions "${needle}"`);
    }
    for (const url of f.text.match(URL_PATTERN) ?? []) {
      if (!INERT_URL.test(url)) problems.push(`${f.path} holds an external URL: ${url}`);
    }
  }
  return problems;
}
