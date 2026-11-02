// `npx tsx scripts/capture/adventureMaps.ts`: one picture of each whole exploration area of Sobi Adventure, edge to edge at the game's own
// scale (1 tile = 40 px, so a 50 × 28 area is 2000 × 1120), for redrawing the maps with an image AI (GĐ14). Like adventureShots.ts it
// starts Electron on a sandbox dev server (default http://localhost:5190, the `sandbox-anim` launch config) with a throw-away copy of a
// prepared save and never opens the player's own save. No trip is walked: the Adventure scene is handed a still state for each area
// (no party, no enemy groups, every teleport gate open), its own update is stopped once the area is built, and the camera is set over
// the whole area before the renderer takes the picture; with --view a second picture shows the area as a player sees it on arrival (the
// trip camera's zoom over the spawn, 1600 × 900). Main maps and branch maps are taken, named by their code in docs/maps/v2 (M1…, N1…).
// --zoom <k> adds a third picture of that arrival with the camera at fitZoom × k instead (a preview of another trip zoom; the game's
// own camera is not changed), and --only <code or id,...> takes only those areas.
// Options: --save <save.json> --url <dev url> --out <folder> --view --zoom <k> --only <M2,map_forest_edge,...>.
import { _electron as electron, type Page } from '@playwright/test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
};
const root = process.cwd();
const SAVE = arg('save', join(tmpdir(), 'sobiworld-anim', 'fixture', 'save.json'));
const URL = arg('url', 'http://localhost:5190');
const OUT = arg('out', join(root, 'art_inbox', '.batch', 'adventure-11-map', 'before'));
const VIEW = process.argv.includes('--view');
const ZOOM = Number(arg('zoom', '0')) || 0;
const ONLY = new Set(arg('only', '').split(',').filter(Boolean));
/** The design px of room kept above and below the area for the HUD, as in scene/mapCamera.ts. */
const HUD_TOP = 270;
const HUD_BOTTOM = 70;

interface MapRow {
  id: string;
  nameVi: string;
  zoneId: string;
  corruption?: number;
  tile: number;
  cols: number;
  rows: number;
  spawn: { x: number; y: number };
  exits: { id: string }[];
}
interface ZoneRow {
  id: string;
  maps: string[];
  branches?: string[];
}

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);

/**
 * Finds the running Phaser game through the page's own copy of Phaser (the first camera that renders tells its game). The copy is the
 * one Vite pre-bundled: the same URL, hash included, gives the same module (the resource timing list may be full and miss it).
 */
const HOOK = (hash: string) => `(async () => {
  const url = performance.getEntriesByType('resource').map((r) => r.name).find((n) => /\\/deps\\/phaser\\.js/.test(n)) ?? '/node_modules/.vite/deps/phaser.js?v=${hash}';
  const P = (await import(url)).default;
  const cam = P.Cameras.Scene2D.Camera.prototype;
  const pre = cam.preRender;
  let game = null;
  cam.preRender = function (...a) { game ??= this.scene.sys.game; return pre.apply(this, a); };
  for (let i = 0; i < 40 && !game; i++) await new Promise((r) => setTimeout(r, 100));
  cam.preRender = pre;
  window.__capGame = game;
  return !!game;
})()`;

/** Builds one area in the Adventure scene from a still state, lets its textures arrive, then photographs the whole area (and, with
 * `view`, the arrival view: the trip camera's zoom over the spawn in a 1600 × 900 frame). */
const SHOOT = (m: MapRow, view: boolean, zoom: number) => `(async () => {
  const m = ${JSON.stringify(m)};
  const g = window.__capGame;
  const sc = g.scene.getScene('adventure');
  sc.__capUpdate ??= sc.sys.sceneUpdate;
  if (g.scene.isActive('adventure-battle')) g.scene.sleep('adventure-battle');
  const st = {
    mode: 'explore', mapId: m.id, placeKey: 'capture:' + m.id,
    pos: { x: (m.spawn.x + 0.5) * m.tile, y: (m.spawn.y + 0.5) * m.tile, facing: 'down' },
    leader: 'so', followers: [], groups: [], exits: m.exits.map((e) => ({ id: e.id, open: true, lock: null, forward: true })),
    openedGates: [], openedChests: [], litPuzzles: [], corruption: m.corruption ?? 0, foundSecrets: [],
    usedSpots: [], springUsed: false, portalLit: true,
    now: 0, graceUntil: 1e15, backdrop: '', paused: true,
  };
  sc.deps.read = () => st;
  // The window's own frame again (the last area's whole picture resized it), so the scene fits its trip camera as in play.
  g.scale.resize(1600, 900);
  sc.cameras.main.setViewport(0, 0, 1600, 900);
  sc.camera.reset();
  sc.walker.setVisible(true);
  sc.sys.sceneUpdate = sc.__capUpdate;
  await new Promise((r) => setTimeout(r, 2500));
  sc.sys.sceneUpdate = () => {};
  const shots = {};
  const cam = sc.cameras.main;
  if (${view}) {
    shots.view = await new Promise((r) => g.renderer.snapshot((img) => r(img.src)));
  }
  if (${view} && ${zoom} > 0) {
    // The same arrival at another zoom, bounded the way mapCamera.ts bounds the trip (the 1600 × 900 frame fits at zoom 1).
    const k = ${zoom};
    const W = m.cols * m.tile, H = m.rows * m.tile;
    const top = ${HUD_TOP} / k, bottom = ${HUD_BOTTOM} / k;
    cam.setZoom(k).setBounds(0, -top, W, H + top + bottom).centerOn((m.spawn.x + 0.5) * m.tile, (m.spawn.y + 0.5) * m.tile);
    await new Promise((r) => setTimeout(r, 400));
    shots.zoomed = await new Promise((r) => g.renderer.snapshot((img) => r(img.src)));
  }
  const W = m.cols * m.tile, H = m.rows * m.tile;
  g.scale.resize(W, H);
  sc.walker.setVisible(false);
  cam.removeBounds().setViewport(0, 0, W, H).setZoom(1).setScroll(0, 0);
  await new Promise((r) => setTimeout(r, 400));
  shots.whole = await new Promise((r) => g.renderer.snapshot((img) => r(img.src)));
  return shots;
})()`;

async function main() {
  if (!existsSync(SAVE)) throw new Error(`No save at ${SAVE} (pass --save)`);
  const maps = (
    JSON.parse(readFileSync(join(root, 'content/adventure/maps.json'), 'utf8')) as {
      maps: MapRow[];
    }
  ).maps;
  const zones = (
    JSON.parse(readFileSync(join(root, 'content/adventure/zones.json'), 'utf8')) as {
      zones: ZoneRow[];
    }
  ).zones;
  // The code of each map in docs/maps/v2 (M1_map_forest_edge.txt → M1), or its place in the order when it has none.
  const codes = new Map(
    readdirSync(join(root, 'docs/maps/v2'))
      .map((f) => /^([MN]\d+)_(map_\w+)\.txt$/.exec(f))
      .filter((r): r is RegExpExecArray => r !== null)
      .map((r) => [r[2]!, r[1]!] as const),
  );
  const order = zones
    .flatMap((z) => [...z.maps, ...(z.branches ?? [])])
    .map((id) => maps.find((m) => m.id === id)!)
    .filter((m) => ONLY.size === 0 || ONLY.has(m.id) || ONLY.has(codes.get(m.id) ?? ''));
  const data = mkdtempSync(join(tmpdir(), 'sobi-capture-'));
  mkdirSync(join(data, 'saves'), { recursive: true });
  const save = JSON.parse(readFileSync(SAVE, 'utf8')) as {
    settings?: { lastExportAt?: number | null };
  };
  if (save.settings) save.settings.lastExportAt = Date.now();
  writeFileSync(join(data, 'saves', 'save.json'), JSON.stringify(save));
  mkdirSync(OUT, { recursive: true });
  console.log(`Maps → ${OUT}\n  save copy: ${data}\n  dev url: ${URL}`);
  const app = await electron.launch({
    args: [root],
    cwd: root,
    env: { ...(process.env as Record<string, string>), UNIN_DEV_URL: URL, UNIN_USER_DATA: data },
  });
  try {
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.locator('.plazabar__dock').waitFor({ timeout: 40_000 });
    await pause(page, 1500);
    // The welcome / away windows the shell may open on start (Escape alone would open the settings when nothing is open).
    const open = page.locator('.app__popup .c-window, .app__dialogs .c-dialog');
    for (let i = 0; i < 5 && (await open.count()) > 0; i++) {
      const close = open
        .first()
        .getByRole('button', { name: /^(Đóng|Nhận|OK|Để sau|Vào)/ })
        .first();
      if (await close.isVisible().catch(() => false)) await close.click();
      else await page.keyboard.press('Escape');
      await pause(page, 500);
    }
    await page.locator('.plazabar__area--adventure').click();
    await page.locator('.app.is-adventure').waitFor({ timeout: 20_000 });
    await pause(page, 1500);
    const hash = (
      JSON.parse(readFileSync(join(root, 'node_modules/.vite/deps/_metadata.json'), 'utf8')) as {
        browserHash: string;
      }
    ).browserHash;
    if (!(await page.evaluate(HOOK(hash)))) throw new Error('Phaser game not found');
    for (const [i, m] of order.entries()) {
      const got = (await page.evaluate(SHOOT(m, VIEW, ZOOM))) as {
        whole: string;
        view?: string;
        zoomed?: string;
      };
      const code = codes.get(m.id) ?? `M${i + 1}`;
      const png = (url: string) =>
        Buffer.from(url.replace(/^data:image\/png;base64,/, ''), 'base64');
      writeFileSync(join(OUT, `${code}_${m.id}.png`), png(got.whole));
      if (got.view) writeFileSync(join(OUT, `${code}_${m.id}_view.png`), png(got.view));
      if (got.zoomed)
        writeFileSync(join(OUT, `${code}_${m.id}_view_x${ZOOM}.png`), png(got.zoomed));
      console.log(`  ✓ ${code} ${m.id} (${m.nameVi}) ${m.cols * m.tile}×${m.rows * m.tile}`);
    }
  } finally {
    await app.close().catch(() => {});
    try {
      rmSync(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
}

await main();
