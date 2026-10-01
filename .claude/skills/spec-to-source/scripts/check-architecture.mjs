#!/usr/bin/env node
/**
 * Architecture guard for the spec-to-source skill.
 *
 * Checks what a linter usually cannot:
 *   1. layer import direction   - lower layers must never import upper ones
 *   2. forbidden APIs per dir   - e.g. no Date.now()/Math.random() in the pure layer
 *   3. file size                - a file over the threshold is doing too much
 *   4. banned file names        - utils.ts / helpers.ts and friends
 *   5. barrel completeness      - a style file missing from its index never ships
 *
 * Usage:
 *   node check-architecture.mjs [--config <path>] [--json]
 *
 * Config resolution order:
 *   --config <path>
 *   ./.claude/spec-to-source.config.mjs
 *   ./spec-to-source.config.mjs
 *
 * Exit code 1 when any violation is found, so CI and the increment gate both fail loudly.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename, extname, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const CWD = process.cwd();
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const configFlag = args.indexOf('--config');

const DEFAULTS = {
  maxFileLines: 300,
  maxFileLinesExceptions: [],
  sourceExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte'],
  ignoreDirs: ['node_modules', 'dist', 'build', 'coverage', '.git', '.next', 'vendor'],
  layers: [],
  forbidden: [],
  barrels: [],
  bannedFileNames: ['utils', 'helpers', 'misc', 'common', 'shared'],
};

async function loadConfig() {
  const candidates =
    configFlag !== -1 && args[configFlag + 1]
      ? [resolve(CWD, args[configFlag + 1])]
      : [
          join(CWD, '.claude', 'spec-to-source.config.mjs'),
          join(CWD, 'spec-to-source.config.mjs'),
        ];

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const mod = await import(pathToFileURL(path).href);
    return { ...DEFAULTS, ...(mod.default ?? mod) };
  }

  console.error(
    'No config found. Create .claude/spec-to-source.config.mjs — see the skill\'s\n' +
      'references/project-adapter.md section 7 for the shape.'
  );
  process.exit(2);
}

const violations = [];
const report = (rule, file, message) => violations.push({ rule, file, message });

function walk(dir, cfg, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (cfg.ignoreDirs.includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, cfg, out);
    else out.push(full);
  }
  return out;
}

const toPosix = (p) => p.split('\\').join('/');
const inDir = (file, dir) => toPosix(relative(CWD, file)).startsWith(toPosix(dir) + '/');

/** Layer of the most specific (longest) matching directory, so nested layers win. */
function layerOf(file, layers) {
  let best = null;
  for (const layer of layers) {
    if (!inDir(file, layer.dir)) continue;
    if (!best || layer.dir.length > best.dir.length) best = layer;
  }
  return best;
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function importsOf(source) {
  const found = [];
  for (const m of source.matchAll(IMPORT_RE)) found.push(m[1] ?? m[2]);
  return found.filter(Boolean);
}

/** Resolve a relative specifier to a repo-relative path so it can be matched against a layer dir. */
function resolveSpecifier(file, spec) {
  if (!spec.startsWith('.')) return null; // bare package — not our concern
  return resolve(dirname(file), spec);
}

function checkLayers(files, cfg) {
  if (!cfg.layers.length) return;
  const names = new Set(cfg.layers.map((l) => l.name));

  for (const file of files) {
    const from = layerOf(file, cfg.layers);
    if (!from) continue;
    const src = readFileSync(file, 'utf8');

    for (const spec of importsOf(src)) {
      const target = resolveSpecifier(file, spec);
      if (!target) continue;
      const to = layerOf(target, cfg.layers);
      if (!to || to.name === from.name) continue;

      const allowed = from.mayImport ?? [];
      if (!allowed.includes(to.name)) {
        report(
          'layer',
          toPosix(relative(CWD, file)),
          `layer "${from.name}" imports "${to.name}" (${spec}). Allowed: ${
            allowed.length ? allowed.join(', ') : 'nothing'
          }`
        );
      }
      if (!names.has(to.name)) {
        report('layer', toPosix(relative(CWD, file)), `unknown layer "${to.name}" in config`);
      }
    }
  }
}

/**
 * A pattern may be a RegExp literal (preferred - the config is .mjs, so `/Date\.now\(/`
 * just works) or a source string, where a literal dot or paren needs a DOUBLE backslash
 * (`'Date\\.now\\('`). The string form is easy to get wrong, so fail with a readable
 * message rather than a stack trace.
 */
function compilePatterns(patterns, dir) {
  return patterns.map((p) => {
    if (p instanceof RegExp) return p;
    try {
      return new RegExp(p);
    } catch (err) {
      console.error(
        `Config error: forbidden pattern ${JSON.stringify(p)} for "${dir}" is not a valid regex ` +
          `(${err.message}).\nRemember to escape backslashes in the config string, e.g. 'Date\\\\.now\\\\('.`
      );
      process.exit(2);
    }
  });
}

function checkForbidden(files, cfg) {
  for (const rule of cfg.forbidden) {
    const exceptions = (rule.exceptions ?? []).map(toPosix);
    const regexes = compilePatterns(rule.patterns, rule.dir);

    for (const file of files) {
      const rel = toPosix(relative(CWD, file));
      if (!inDir(file, rule.dir)) continue;
      if (exceptions.includes(rel)) continue;

      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        // Skip comment-only lines: a rule named in a comment is documentation, not a call.
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
        for (const re of regexes) {
          if (re.test(line)) {
            report('forbidden', `${rel}:${i + 1}`, `"${re.source}" is not allowed under ${rule.dir}`);
          }
        }
      });
    }
  }
}

function checkFileSize(files, cfg) {
  const exceptions = (cfg.maxFileLinesExceptions ?? []).map(toPosix);
  for (const file of files) {
    const rel = toPosix(relative(CWD, file));
    if (exceptions.includes(rel)) continue;
    const count = readFileSync(file, 'utf8').split('\n').length;
    if (count > cfg.maxFileLines) {
      report('size', rel, `${count} lines > ${cfg.maxFileLines}. Split it, or add an exception with a reason.`);
    }
  }
}

function checkFileNames(files, cfg) {
  for (const file of files) {
    const stem = basename(file, extname(file)).toLowerCase().replace(/^_/, '');
    if (cfg.bannedFileNames.includes(stem)) {
      report(
        'name',
        toPosix(relative(CWD, file)),
        `"${stem}" is a grab-bag name. Name the file after what it does.`
      );
    }
  }
}

function checkBarrels(cfg) {
  for (const barrel of cfg.barrels) {
    if (!existsSync(barrel.index)) {
      report('barrel', barrel.index, 'barrel file is missing');
      continue;
    }
    const indexSrc = readFileSync(barrel.index, 'utf8');
    const dir = dirname(barrel.index);
    const indexName = basename(barrel.index);

    for (const entry of readdirSync(dir)) {
      if (entry === indexName) continue;
      const stem = basename(entry, extname(entry)).replace(/^_/, '');
      // Match `@forward 'x'`, `@use 'x'`, `export * from './x'`, `from "./x.scss"`.
      const referenced = new RegExp(`['"\`][^'"\`]*\\b${stem}(\\.[a-z]+)?['"\`]`).test(indexSrc);
      if (!referenced) {
        report(
          'barrel',
          toPosix(join(dir, entry)),
          `not listed in ${indexName} — it will never be bundled`
        );
      }
    }
  }
}

const cfg = await loadConfig();
const roots = [
  ...new Set([...cfg.layers.map((l) => l.dir), ...cfg.forbidden.map((f) => f.dir)]),
].map((d) => join(CWD, d));

const files = [...new Set(roots.flatMap((r) => walk(r, cfg)))].filter((f) =>
  cfg.sourceExtensions.includes(extname(f))
);

checkLayers(files, cfg);
checkForbidden(files, cfg);
checkFileSize(files, cfg);
checkFileNames(files, cfg);
checkBarrels(cfg);

if (asJson) {
  console.log(JSON.stringify({ ok: violations.length === 0, violations }, null, 2));
} else if (violations.length === 0) {
  console.log(`architecture OK — ${files.length} files checked`);
} else {
  const byRule = violations.reduce((acc, v) => ((acc[v.rule] ??= []).push(v), acc), {});
  for (const [rule, list] of Object.entries(byRule)) {
    console.error(`\n${rule.toUpperCase()} (${list.length})`);
    for (const v of list) console.error(`  ${v.file}\n    ${v.message}`);
  }
  console.error(`\n${violations.length} violation(s), ${files.length} files checked`);
}

process.exit(violations.length === 0 ? 0 : 1);
