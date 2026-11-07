// npm run studio -- <command>
//   validate                 check style + every recipe (also runs inside npm run check via tests)
//   build <id…> | --changed | --all   compile → Unity render → QA → import into public/assets + manifest
//         [--no-import] [--keep]       render only / keep the job file
//   compare <id…>            old (tag pre-unity-studio) | new sheets in art_inbox/studio/compare/
//   schema                   write JSON Schema copies to studio/Recipes/schema/
//   status                   recipes with their build state
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { compileRecipe, TOOL_VERSION, type Job } from './compile.ts';
import {
  RECIPES,
  STUDIO,
  STYLE_FILE,
  StudioError,
  loadAll,
  loadStyle,
  rel,
  sha,
  type Loaded,
} from './recipes.ts';
import { jsonSchemas, type Recipe } from './schema.ts';
import { runUnity } from './unity.ts';
import { checkImage, compareSheet, oldAsset, readPng, writePng } from './qa.ts';
import { manifestCheck, setFrames } from './manifest.ts';

const ASSETS = resolve('public/assets');
const INBOX = resolve('art_inbox/studio');
const STATUS_FILE = join(STUDIO, 'status.json');

interface StatusEntry {
  hash: string;
  area?: string;
  kind: string;
  outputs: string[];
  imported: string;
}
type StatusFile = { version: 1; recipes: Record<string, StatusEntry> };

export function readStatus(): StatusFile {
  if (!existsSync(STATUS_FILE)) return { version: 1, recipes: {} };
  return JSON.parse(readFileSync(STATUS_FILE, 'utf8')) as StatusFile;
}

function toolFiles(): string {
  return ['Assets/Sobi/Shaders/SdfRender.compute', 'Assets/Sobi/Editor/Renderer.cs']
    .map((f) => readFileSync(join(STUDIO, f), 'utf8'))
    .join('\n');
}

/** Hash of everything that changes a recipe's pixels (plan §12.4). */
export function recipeHash(
  l: Loaded,
  styleText = readFileSync(STYLE_FILE, 'utf8'),
  tools = toolFiles(),
): string {
  return sha(
    JSON.stringify(l.recipe),
    styleText,
    String(TOOL_VERSION),
    tools,
    readFileSync(resolve('scripts/studio/compile.ts'), 'utf8'),
  );
}

function validate(): Loaded[] {
  const style = loadStyle();
  const all = loadAll();
  for (const l of all) {
    compileRecipe(style, l.recipe);
    manifestCheck(l.recipe);
  }
  return all;
}

function pick(all: Loaded[], args: string[]): Loaded[] {
  if (args.includes('--all')) return all;
  if (args.includes('--changed')) {
    const st = readStatus();
    return all.filter((l) => st.recipes[l.recipe.id]?.hash !== recipeHash(l));
  }
  const ids = args.filter((a) => !a.startsWith('--'));
  if (!ids.length) throw new StudioError('build: give recipe ids, --changed or --all');
  return ids.map((id) => {
    const l = all.find((x) => x.recipe.id === id || rel(x.file).endsWith(`${id}.json`));
    if (!l) throw new StudioError(`no recipe "${id}"`);
    return l;
  });
}

function frameCount(job: Job) {
  return job.frames.length;
}

function build(args: string[]) {
  const all = validate();
  const style = loadStyle();
  const chosen = pick(all, args);
  if (!chosen.length) {
    console.log('[studio] nothing changed');
    return;
  }
  const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = join(INBOX, runId);
  mkdirSync(outDir, { recursive: true });
  const jobs: { l: Loaded; job: Job }[] = [];
  for (const l of chosen) for (const job of compileRecipe(style, l.recipe)) jobs.push({ l, job });
  const jobFile = join(outDir, 'jobs.json');
  writeFileSync(jobFile, JSON.stringify({ version: 1, outDir, jobs: jobs.map((j) => j.job) }));
  console.log(`[studio] ${chosen.length} recipe(s), ${jobs.length} output(s) -> ${rel(outDir)}`);
  runUnity(['render', jobFile], join(outDir, 'unity.log'));

  let failed = false;
  for (const { l, job } of jobs) {
    const file = join(outDir, job.output);
    const img = readPng(file);
    const cols = job.cols;
    const rows = Math.ceil(frameCount(job) / cols);
    const qa = checkImage(img, {
      width: job.width * cols,
      height: job.height * rows,
      frameW: job.width,
      frameH: job.height,
    });
    for (const e of qa.errors) console.error(`  ✗ ${job.output}: ${e}`);
    for (const w of qa.warnings) console.warn(`  ! ${job.output}: ${w}`);
    if (qa.errors.length) failed = true;
    const sheet = compareSheet(oldAsset(job.output), img);
    writePng(join(INBOX, 'compare', `${l.recipe.id}__${job.output.replace(/\//g, '_')}`), sheet);
  }
  if (failed) throw new StudioError('QA failed; nothing imported');
  if (args.includes('--no-import')) return;

  const status = readStatus();
  for (const l of chosen) {
    const outs = l.recipe.outputs;
    for (const o of outs) {
      copyFileSync(join(outDir, o.file), join(ASSETS, o.file));
      if (o.fps) {
        const job = jobs.find((j) => j.l === l && j.job.output === o.file)!.job;
        setFrames(o.asset, o.file, {
          width: job.width,
          height: job.height,
          count: frameCount(job),
          fps: o.fps,
        });
      }
    }
    status.recipes[l.recipe.id] = {
      hash: recipeHash(l),
      ...(l.recipe.area ? { area: l.recipe.area } : {}),
      kind: l.recipe.kind,
      outputs: outs.map((o) => o.file),
      imported: new Date().toISOString().slice(0, 10),
    };
  }
  status.recipes = Object.fromEntries(
    Object.entries(status.recipes).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(STATUS_FILE, `${JSON.stringify(status, null, 2)}\n`);
  console.log(
    `[studio] imported ${chosen.length} recipe(s); compare sheets in ${rel(join(INBOX, 'compare'))}`,
  );
}

function compare(args: string[]) {
  const all = loadAll();
  for (const id of args) {
    const l = all.find((x) => x.recipe.id === id);
    if (!l) throw new StudioError(`no recipe "${id}"`);
    for (const o of l.recipe.outputs) {
      const cur = join(ASSETS, o.file);
      if (!existsSync(cur)) continue;
      writePng(
        join(INBOX, 'compare', `${id}__${o.file.replace(/\//g, '_')}`),
        compareSheet(oldAsset(o.file), readPng(cur)),
      );
    }
  }
}

function writeSchemas() {
  for (const [name, schema] of Object.entries(jsonSchemas()))
    writeFileSync(join(RECIPES, 'schema', name), `${JSON.stringify(schema, null, 2)}\n`);
  console.log('[studio] schemas written');
}

function status() {
  const st = readStatus();
  for (const l of loadAll()) {
    const s = st.recipes[l.recipe.id];
    const state = !s
      ? 'not built'
      : s.hash === recipeHash(l)
        ? `imported ${s.imported}`
        : 'changed';
    console.log(`${l.recipe.id.padEnd(32)} ${(l.recipe.area ?? '-').padEnd(10)} ${state}`);
  }
}

export function main(argv: string[]) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'validate': {
      const n = validate().length;
      console.log(`[studio] ${n} recipe(s) valid`);
      break;
    }
    case 'build':
      build(rest);
      break;
    case 'compare':
      compare(rest);
      break;
    case 'schema':
      writeSchemas();
      break;
    case 'status':
      status();
      break;
    default:
      throw new StudioError(
        'usage: npm run studio -- validate | build <id…>|--changed|--all | compare <id…> | schema | status',
      );
  }
}

export type { Recipe };

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve('scripts/studio/cli.ts');
if (isMain) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof StudioError) {
      console.error(`[studio] ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}
