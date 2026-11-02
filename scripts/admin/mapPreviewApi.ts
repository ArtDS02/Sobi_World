// The Map Builder's preview in the game's own renderer (decision 047, GĐ7), on the dev API: the world a publish of the chosen drafts
// would make is written to tools/admin/data/adventure/preview/content (nothing in content/ changes), the game's dev server for the
// preview (scripts/dev/mapPreview.mjs, port 5191) reads it, and scripts/capture/adventureMaps.ts photographs the area in Electron —
// the whole area and the arrival view — on a throw-away copy of a prepared save (made once with scripts/dev/richSave.ts in
// %TEMP%\sobiworld-mappreview). The player's save is never opened.
//   POST /adventure/maps/preview { ids, mapId } → { shots: [url] }
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type * as Publish from '../../tools/admin/mapPublish';
import { contentJson } from '../content/format';
import { writeText } from './artFiles';
import type { SaveDeps } from './contentSave';
import { MAP_DATA_DIR } from './mapDrafts';
import { builderData } from './mapPublishApi';

type Result = { status: number; body: unknown };

const PORT = 5191;
const URL = `http://localhost:${PORT}`;
const FIXTURE = join(tmpdir(), 'sobiworld-mappreview', 'fixture');
let server: ReturnType<typeof spawn> | null = null;

/** Runs a command to its end; its output is kept for the error. */
function run(cmd: string, args: string[], env: Record<string, string> = {}): Promise<string> {
  return new Promise((done, fail) => {
    const child = spawn(cmd, args, { cwd: process.cwd(), shell: true, env: { ...process.env, ...env } });
    let out = '';
    child.stdout.on('data', (d: Buffer) => (out += d.toString()));
    child.stderr.on('data', (d: Buffer) => (out += d.toString()));
    child.on('close', (code) => (code === 0 ? done(out) : fail(new Error(out.split('\n').filter((l) => !/^\s+at /.test(l)).slice(-12).join('\n')))));
  });
}

const up = async (): Promise<boolean> => fetch(URL).then((r) => r.ok, () => false);

async function ensureServer() {
  if (await up()) return;
  server = spawn('node', ['scripts/dev/mapPreview.mjs'], { cwd: process.cwd(), shell: true, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 60; i += 1) {
    if (await up()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server preview (cổng 5191) không lên được');
}

export async function previewMaps(body: { ids: string[]; mapId: string }, deps: SaveDeps, dir = MAP_DATA_DIR): Promise<Result> {
  if (!/^map_[a-z0-9_]+$/.test(body.mapId ?? '')) return { status: 400, body: { error: 'Id map không hợp lệ' } };
  const P = (await deps.load('/tools/admin/mapPublish.ts')) as unknown as typeof Publish;
  const data = await builderData(deps.load, dir);
  const plan = P.planPublish(data, body.ids ?? [], {});
  // The game refuses to start on a broken file; area checks (a blocked spawn…) are what the preview is for, so they pass.
  const broken = plan.checks.filter((c) => c.level === 'error' && c.text.startsWith('Cấu trúc maps.json'));
  if (broken.length) return { status: 400, body: { error: broken.map((c) => c.text).join('\n') } };
  if (!plan.maps.some((m) => m.id === body.mapId)) return { status: 400, body: { error: `${body.mapId} không có trong bản xem trước (chọn bản nháp của nó)` } };

  const folder = join(dir, 'preview');
  const zonesFile = JSON.parse(readFileSync('content/adventure/zones.json', 'utf8')) as { zones: { id: string }[] };
  mkdirSync(join(folder, 'content'), { recursive: true });
  writeText(join(folder, 'content', 'maps.json'), contentJson({ maps: plan.maps }));
  writeText(join(folder, 'content', 'zones.json'), contentJson({ ...zonesFile, zones: zonesFile.zones.map((z) => ({ ...z, ...plan.zones.find((x) => x.id === z.id) })) }));
  const save = join(FIXTURE, 'saves', 'save.json');
  if (!existsSync(save)) await run('npx', ['tsx', 'scripts/dev/richSave.ts', `"${FIXTURE}"`]);
  await ensureServer();
  const shots = join(folder, 'shots');
  rmSync(shots, { recursive: true, force: true });
  mkdirSync(shots, { recursive: true });
  await run('npx', ['tsx', 'scripts/capture/adventureMaps.ts', '--url', URL, '--save', `"${save}"`, '--content', `"${join(folder, 'content')}"`, '--only', body.mapId, '--view', '--out', `"${shots}"`]);
  const at = Date.now();
  const files = readdirSync(shots).filter((f) => f.endsWith('.png')).sort();
  return { status: 200, body: { shots: files.map((f) => `/${shots.replace(/\\/g, '/')}/${f}?t=${at}`) } };
}

/** Stops the preview server this API started (the admin server going down takes it along). */
export const stopPreview = () => server?.kill();
