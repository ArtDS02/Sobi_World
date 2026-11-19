// Helpers of gameForest.ts: the game's state is read from the dev server's save file (the autosave writes the Adventure's run there),
// a "teleport" is an edit of that file between two page loads, and a picture check compares the pixels of two screenshots.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { PNG } from 'pngjs';

const TILE = 40;
export interface Step { step: string; pass: boolean; detail: Record<string, unknown> }
export interface Run { mapId: string; x: number; y: number; phase: string; chests: string[]; tx: number; ty: number }
export interface Session { context: BrowserContext; page: Page }
export interface Env { browser: Browser; base: string; view: string; out: string; save: string; errors: string[]; steps: Step[] }
interface SaveFile { progression: { areas: Record<string, unknown> }; wallet: { coins: number }; settings: { tutorialDone: boolean }; areas: { sobi_adventure: { openedChests: string[]; run: { mapId: string; x: number; y: number; facing: string; phase: string; team: { stats: object; hp: number }[] } } } }
interface MapJson { id: string; cols: number; rows: number; terrain: string[]; chests: { id: string; x: number; y: number }[] }

export const hasRun = (env: Env) => (JSON.parse(readFileSync(env.save, 'utf8')) as { areas: { sobi_adventure?: { run: object | null } } }).areas.sobi_adventure?.run != null;
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const readSave = (env: Env) => JSON.parse(readFileSync(env.save, 'utf8')) as SaveFile;

export function readRun(env: Env): Run {
  const a = readSave(env).areas.sobi_adventure;
  return { mapId: a.run.mapId, x: a.run.x, y: a.run.y, phase: a.run.phase, chests: a.openedChests, tx: a.run.x / TILE, ty: a.run.y / TILE };
}

/** Puts the party on a tile of an area (the page must be closed: the game would write its own state over the edit). */
export function teleport(env: Env, mapId: string, tx: number, ty: number, facing: string) {
  const s = readSave(env);
  Object.assign(s.areas.sobi_adventure.run, { mapId, x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, facing, phase: 'explore' });
  writeFileSync(env.save, JSON.stringify(s));
}

/** A strong pig, so a battle on the way is won by the Auto button and the trip goes on. */
export function strongPig(env: Env) {
  const s = readSave(env);
  const pig = s.areas.sobi_adventure.run.team[0]!;
  Object.assign(pig.stats, { hp: 9999, atk: 999, def: 99, matk: 999, mdef: 99 });
  pig.hp = 9999;
  writeFileSync(env.save, JSON.stringify(s));
}

export const shot = async (env: Env, page: Page, name: string): Promise<Buffer> => page.screenshot({ path: join(env.out, `${env.view}_${name}.png`) });

/** Mean absolute colour difference (0..1) of one area of two screenshots. */
export function diff(a: Buffer, b: Buffer, box = { x: 560, y: 270, w: 480, h: 360 }): number {
  const pa = PNG.sync.read(a);
  const pb = PNG.sync.read(b);
  let sum = 0;
  for (let y = box.y; y < box.y + box.h; y += 1) {
    for (let x = box.x; x < box.x + box.w; x += 1) {
      const i = (y * pa.width + x) * 4;
      sum += (Math.abs(pa.data[i]! - pb.data[i]!) + Math.abs(pa.data[i + 1]! - pb.data[i + 1]!) + Math.abs(pa.data[i + 2]! - pb.data[i + 2]!)) / 765;
    }
  }
  return sum / (box.w * box.h);
}

/** The biggest mean difference of any 48 px cell of the play area (the HUD and the prompt bar left out): a chest lid that opens is one cell, water and grass are small shimmers. */
export function diffCell(a: Buffer, b: Buffer): number {
  const pa = PNG.sync.read(a);
  const pb = PNG.sync.read(b);
  let best = 0;
  for (let cy = 120; cy < 800; cy += 48) {
    for (let cx = 250; cx < 1340; cx += 48) {
      let sum = 0;
      for (let y = cy; y < cy + 48; y += 2) {
        for (let x = cx; x < cx + 48; x += 2) {
          const i = (y * pa.width + x) * 4;
          sum += (Math.abs(pa.data[i]! - pb.data[i]!) + Math.abs(pa.data[i + 1]! - pb.data[i + 1]!) + Math.abs(pa.data[i + 2]! - pb.data[i + 2]!)) / 765;
        }
      }
      best = Math.max(best, sum / 576);
    }
  }
  return best;
}

/** Share of pixels that are not near-black: a diorama still loading is a dark or empty picture. */
export function litShare(a: Buffer): number {
  const p = PNG.sync.read(a);
  let lit = 0;
  for (let i = 0; i < p.data.length; i += 16) if (p.data[i]! + p.data[i + 1]! + p.data[i + 2]! > 60) lit += 1;
  return lit / (p.data.length / 16);
}

export const fps = (page: Page, ms: number): Promise<number> =>
  page.evaluate(
    `new Promise((done) => { let n = 0; const t0 = performance.now(); const tick = () => { n += 1; if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); else done((n * 1000) / (performance.now() - t0)); }; requestAnimationFrame(tick); })`,
  ) as Promise<number>;

async function plazaClick(page: Page, x: number, y: number) {
  const box = (await page.locator('.app__stage canvas').boundingBox())!;
  const zoom = Math.min(box.width / 1932, box.height / 900);
  await page.mouse.click(box.x + box.width / 2 + (x - 966) * zoom, box.y + box.height / 2 + (y - 450) * zoom);
}

export const here = (loc: ReturnType<Page['locator']>) => loc.first().isVisible().catch(() => false);

/** Opens a fresh page on the game, goes into the Adventure and to the trip's map (first pig, fighter, set off, tip closed). */
export async function openGame(env: Env, existing?: Session): Promise<Session> {
  const context = existing?.context ?? (await env.browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 }));
  if (!existing) await context.addInitScript(`localStorage.setItem('sobiworld.settings', JSON.stringify({ mapView: '${env.view}' }));`);
  const page = existing?.page ?? (await context.newPage());
  if (!existing) {
    page.on('pageerror', (e) => env.errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') env.errors.push(`console: ${m.text()}`);
    });
  }
  await page.goto(env.base);
  await page.locator('.plazabar__dock').waitFor({ timeout: 60_000 });
  await plazaClick(page, 300, 380);
  await page.locator('.app.is-adventure').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  const gift = page.getByRole('button', { name: 'Nhận heo phiêu lưu đầu tiên' });
  if (await here(gift)) await gift.click();
  if (!(await here(page.locator('.adventure-explore')))) {
    const pick = page.locator('.adventure-ui__fighter .adventure-ui__fighter-pick');
    if (!(await here(page.locator('.adventure-ui__fighter.is-selected')))) await pick.first().click({ force: true, timeout: 8000 });
    await page.getByRole('button', { name: /Lên đường/ }).click();
  }
  await page.locator('.adventure-explore').waitFor({ timeout: 15_000 });
  await page.waitForTimeout(3000);
  const tip = page.getByRole('button', { name: 'Đã hiểu' });
  if (await here(tip)) await tip.click();
  await page.waitForTimeout(1500);
  return { context, page };
}

/** Polls the save file until `ok` holds (the autosave writes it a moment after the game changes). */
export async function waitRun(env: Env, ok: (r: Run) => boolean, ms: number): Promise<Run> {
  const end = Date.now() + ms;
  let r = readRun(env);
  while (!ok(r) && Date.now() < end) {
    await sleep(250);
    r = readRun(env);
  }
  return r;
}

export async function closeWindows(page: Page) {
  for (let i = 0; i < 4; i += 1) {
    const ok = page.getByRole('button', { name: /Nhận thưởng|Tiếp tục|Đóng|Đã hiểu|Nhận/ }).first();
    if (!(await here(ok))) return;
    await ok.click().catch(() => undefined);
    await page.waitForTimeout(500);
  }
}

/** Where a chest can be touched from: the tiles around it that are not walls, nearest first. */
export function chestSpots(maps: MapJson[], mapId: string, from: { tx: number; ty: number }, opened: string[]) {
  const map = maps.find((m) => m.id === mapId)!;
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < map.cols && y < map.rows && !'#~'.includes(map.terrain[y]![x]!);
  return map.chests
    .filter((c) => !opened.includes(c.id))
    .sort((a, b) => Math.hypot(a.x - from.tx, a.y - from.ty) - Math.hypot(b.x - from.tx, b.y - from.ty))
    .map((c) => ({ id: c.id, spots: ([[0, 1], [0, -1], [1, 0], [-1, 0]] as const).map(([dx, dy]) => ({ x: c.x + dx, y: c.y + dy })).filter((p) => free(p.x, p.y)) }));
}
