// Architecture rules (ARCHITECTURE.md §3): checks a linter cannot express. Pure: works on
// { path, source } records, so tests feed it fake trees. The CLI (check-architecture.mjs) reads disk.
//   layer     - import direction between layers; every child of an `isolate` layer (src/areas/<id>)
//               is its own unit: an Area never imports another Area
//   forbidden - banned patterns per directory (no Date.now / Math.random / DOM / Node in core…)
//   size      - a file over maxFileLines is doing too much
//   name      - grab-bag file names (utils.ts, helpers.ts…)
import { posix } from 'node:path';

const IMPORT_RE =
  /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]|(?:^|[^\w.])import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;

export function importsOf(source) {
  const found = [];
  for (const m of source.matchAll(IMPORT_RE)) found.push(m[1] ?? m[2] ?? m[3]);
  return found.filter(Boolean);
}

const inDir = (path, dir) => path === dir || path.startsWith(`${dir}/`);

/** Layer (and Area unit) of a repo-relative posix path; the most specific directory wins. */
export function unitOf(path, layers) {
  let best = null;
  for (const layer of layers) {
    if (inDir(path, layer.dir) && (!best || layer.dir.length > best.dir.length)) best = layer;
  }
  if (!best) return null;
  if (!best.isolate) return { layer: best, unit: best.name };
  const child = path.slice(best.dir.length + 1).split('/')[0];
  return { layer: best, unit: `${best.name}/${child}` };
}

/** Repo-relative target of a relative specifier; bare packages are not our concern. */
export function resolveImport(fromPath, spec) {
  if (!spec.startsWith('.')) return null;
  return posix.normalize(posix.join(posix.dirname(fromPath), spec));
}

function checkLayers(files, cfg, report) {
  for (const { path, source } of files) {
    const from = unitOf(path, cfg.layers);
    if (!from) continue;
    for (const spec of importsOf(source)) {
      const target = resolveImport(path, spec);
      if (target === null) continue;
      const to = unitOf(target, cfg.layers);
      if (!to || to.unit === from.unit) continue;
      if (to.layer === from.layer) {
        report('layer', path, `${from.unit} imports ${to.unit} (${spec}): an Area never imports another Area`);
        continue;
      }
      const allowed = from.layer.mayImport ?? [];
      if (!allowed.includes(to.layer.name)) {
        report(
          'layer',
          path,
          `layer "${from.layer.name}" imports "${to.layer.name}" (${spec}). Allowed: ${allowed.join(', ') || 'nothing'}`,
        );
      }
    }
  }
}

function checkForbidden(files, cfg, report) {
  for (const rule of cfg.forbidden) {
    for (const { path, source } of files) {
      const applies = rule.match ? rule.match.test(path) : inDir(path, rule.dir);
      if (!applies || (rule.exceptions ?? []).includes(path)) continue;
      source.split('\n').forEach((line, i) => {
        const trimmed = line.trim();
        // A rule named in a comment is documentation, not a call.
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
        for (const re of rule.patterns) {
          if (re.test(line)) {
            report('forbidden', `${path}:${i + 1}`, `"${re.source}" is not allowed under ${rule.dir ?? rule.match}`);
          }
        }
      });
    }
  }
}

function checkFiles(files, cfg, report) {
  for (const { path, source } of files) {
    const lines = source.split('\n').length;
    if (lines > cfg.maxFileLines && !(cfg.maxFileLinesExceptions ?? []).includes(path)) {
      report('size', path, `${lines} lines > ${cfg.maxFileLines}. Split it, or add an exception with a reason.`);
    }
    const stem = posix.basename(path).replace(/\.[^.]+$/, '').toLowerCase().replace(/^_/, '');
    if ((cfg.bannedFileNames ?? []).includes(stem)) {
      report('name', path, `"${stem}" is a grab-bag name. Name the file after what it does.`);
    }
  }
}

/** Every violation of `cfg` in `files` ({ path: repo-relative posix, source }). */
export function findViolations(files, cfg) {
  const violations = [];
  const report = (rule, file, message) => violations.push({ rule, file, message });
  checkLayers(files, cfg, report);
  checkForbidden(files, cfg, report);
  checkFiles(files, cfg, report);
  return violations;
}
