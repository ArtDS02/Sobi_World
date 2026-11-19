// `npx tsx scripts/maps/gameForest.ts --base http://localhost:5197 --userData <dir the dev server was started with> --out <dir>`:
// plays the REAL game in a browser on the Vite dev server (start it with `UNIN_USER_DATA=<dir> npx vite --port 5197 --strictPort`):
// makes a fresh save, gives it the farm level the Adventure needs (as tests/e2e/adventure.spec.ts does), opens the Adventure from the
// plaza, takes the first pig, sets off to map_forest_edge, walks with the keys and takes 1600 x 900 pictures plus the frame rate.
// `--view classic` writes mapView = classic into the device settings first. `--gpu` uses the machine's own GPU (ANIM_GPU=high: the
// discrete one). It reports page errors; it never touches a player's save (the dev server's own folder is the one given).
// Play-test steps (any mix, in this order; the game state is read from the dev server's save file, the autosave keeps it):
//   `--battle` (with `--at x,y`)  walks into a group, fights, comes back;  `--chest`  stands next to the nearest unopened chest,
//   presses Space, checks openedChests and that the chest's picture changed;  `--exit`  walks into the north exit and back;
//   `--reload`  walks, waits for the autosave, reloads the page and checks map, position (+- 1 tile) and the opened chests.
// Each step prints PASS / FAIL with the values it compared; a FAIL or a page error makes the exit code 1.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openBrowser } from '../anim-review/lib/session';
import { chestSpots, closeWindows, diff, diffCell, fps, hasRun, here, litShare, openGame, readRun, shot, sleep, strongPig, teleport, waitRun, type Env, type Session } from './gameForestSteps';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
};
const has = (name: string) => process.argv.includes(`--${name}`);
const BASE = arg('base', 'http://localhost:5197');
const USER = arg('userData', '');
const VIEW = arg('view', 'diorama');
const OUT = arg('out', join(process.cwd(), 'art_inbox', 'game_forest'));
/** `--at 23,11`: puts the trip's party on that tile first; `--battle`: then walks (`--key`, default KeyA = west) into the group there, flees and looks at the map again. */
const AT = arg('at', '');
const EDGE = 'map_forest_edge';
const STEPS = ['chest', 'exit', 'reload'].some(has);

async function main() {
  if (!USER) throw new Error('--userData is required (the folder the dev server runs on)');
  mkdirSync(OUT, { recursive: true });
  const SAVE = join(USER, 'saves', 'save.json');
  const { browser, gpu } = await openBrowser(has('gpu'));
  const env: Env = { browser, base: BASE, view: VIEW, out: OUT, save: SAVE, errors: [], steps: [] };
  const report = (step: string, pass: boolean, detail: Record<string, unknown>) => {
    env.steps.push({ step, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${VIEW} ${step} ${JSON.stringify(detail)}`);
  };
  const maps = (JSON.parse(readFileSync('content/adventure/maps.json', 'utf8')) as { maps: Parameters<typeof chestSpots>[0] }).maps;
  let session: Session | null = null;
  try {
    if (!existsSync(SAVE)) {
      const first = await browser.newContext({ viewport: { width: 1600, height: 900 } });
      const p = await first.newPage();
      await p.goto(BASE);
      await p.locator('.plazabar').waitFor({ timeout: 60_000 });
      await p.waitForTimeout(2500);
      await first.close();
    }
    const save = JSON.parse(readFileSync(SAVE, 'utf8')) as { progression: { areas: Record<string, unknown> }; wallet: { coins: number }; settings: { tutorialDone: boolean }; areas: { sobi_adventure: { run: object } } };
    save.progression.areas.sobi_farm = { xp: 100_000 };
    save.wallet.coins = 20_000;
    save.settings.tutorialDone = true;
    writeFileSync(SAVE, JSON.stringify(save));
    if ((AT || STEPS) && !hasRun(env)) {
      // A fresh save has no trip yet: start one once, then the save has a team to make strong and a spot to move.
      const first = await openGame(env);
      await first.context.close();
    }
    if (AT || STEPS) strongPig(env);
    if (AT) {
      const [x, y] = AT.split(',').map(Number) as [number, number];
      teleport(env, readRun(env).mapId || EDGE, x, y, 'right');
    }

    session = await openGame(env);
    let page = session.page;
    const shoot = (name: string) => shot(env, page, name);
    await shoot('1_start');
    const rates: Record<string, number> = has('battle') ? {} : { idle: await fps(page, 3000) };
    if (has('battle')) {
      const before = readRun(env);
      await shoot('b1_before');
      await page.keyboard.down(arg('key', 'KeyA'));
      await page.waitForTimeout(3000);
      await shoot('b1b_walked');
      await page.getByRole('button', { name: 'Bỏ chạy' }).first().waitFor({ timeout: 15_000 });
      await page.keyboard.up(arg('key', 'KeyA'));
      await page.waitForTimeout(1500);
      await shoot('b2_battle');
      const phase = readRun(env).phase;
      // The battle plays itself (the Auto button) until the trip's screen is back (a result window is closed when it shows).
      await page.getByRole('button', { name: 'Tự động' }).first().click({ timeout: 4000 }).catch(() => undefined);
      for (let i = 0; i < 40 && !(await here(page.locator('.adventure-explore'))); i += 1) {
        const ok = page.getByRole('button', { name: /Nhận thưởng|Tiếp tục|Đóng/ }).first();
        if (await here(ok)) await ok.click().catch(() => undefined);
        await page.waitForTimeout(1500);
      }
      await page.waitForTimeout(5000);
      await shoot('b3_back');
      rates.back = await fps(page, 2000);
      const after = await waitRun(env, (r) => r.phase === 'explore', 8000);
      report('battle', phase === 'battle' && after.phase === 'explore' && after.mapId === before.mapId, { phaseDuring: phase, phaseAfter: after.phase, map: after.mapId, fps: rates.back });
    }
    if (!STEPS && !has('battle')) {
      // Walk: east along the path, then south, a few steps each (the keys are the game's own).
      for (const [key, ms, name] of [['KeyD', 1500, '2_east'], ['KeyS', 1000, '3_south'], ['KeyD', 2500, '4_east2']] as const) {
        await page.keyboard.down(key);
        rates[`walk_${name}`] = await fps(page, ms);
        await page.keyboard.up(key);
        await page.waitForTimeout(400);
        await shoot(name);
      }
    }
    /** A page of the trip standing on a tile of an area (the game is closed and opened again: the save file is the teleport). */
    const standAt = async (mapId: string, x: number, y: number, facing: string) => {
      await session!.context.close();
      teleport(env, mapId, x, y, facing);
      session = await openGame(env);
      page = session.page;
    };

    if (has('chest')) {
      let done = false;
      for (const c of chestSpots(maps, EDGE, readRun(env), readRun(env).chests).slice(0, 1)) {
        for (const [i, spot] of c.spots.entries()) {
          const facing = spot.y > maps.find((m) => m.id === EDGE)!.chests.find((k) => k.id === c.id)!.y ? 'up' : 'down';
          await standAt(EDGE, spot.x, spot.y, facing);
          const a = await shoot(`c1_before_${i}`);
          await page.waitForTimeout(400);
          const a2 = await shoot(`c1_before_${i}b`);
          await page.keyboard.press('Space');
          await page.waitForTimeout(1500);
          const r = await waitRun(env, (x) => x.chests.includes(c.id), 8000);
          await closeWindows(page);
          await page.waitForTimeout(2500);
          const b = await shoot(`c2_after_${i}`);
          const noise = diffCell(a, a2);
          const change = diffCell(a, b);
          done = r.chests.includes(c.id);
          report('chest', done && change > noise * 1.1, { chest: c.id, spot, openedInState: done, openedChests: r.chests, pictureChange: +change.toFixed(4), noise: +noise.toFixed(4), fps: await fps(page, 1500) });
          if (done) break;
        }
      }
      if (!done && !env.steps.some((s) => s.step === 'chest')) report('chest', false, { reason: 'no unopened chest left' });
    }

    if (has('exit')) {
      await standAt(EDGE, 36, 2, 'up');
      await shoot('x1_before_exit');
      await page.keyboard.down('KeyW');
      const gone = await waitRun(env, (r) => r.mapId !== EDGE, 9000);
      await page.keyboard.up('KeyW');
      await page.waitForTimeout(4500);
      const arrive = await shoot('x2_new_map');
      const lit = litShare(arrive);
      report('exit', gone.mapId === 'map_forest_hollow' && lit > 0.5, { from: EDGE, to: gone.mapId, at: [+gone.tx.toFixed(1), +gone.ty.toFixed(1)], expectedAt: [40, 34], litShare: +lit.toFixed(2), explore: await here(page.locator('.adventure-explore')), fps: await fps(page, 1500) });
      await page.keyboard.down('KeyS');
      const back = await waitRun(env, (r) => r.mapId === EDGE, 9000);
      await page.keyboard.up('KeyS');
      await page.waitForTimeout(4500);
      const home = await shoot('x3_back');
      report('exit_back', back.mapId === EDGE && litShare(home) > 0.5, { map: back.mapId, at: [+back.tx.toFixed(1), +back.ty.toFixed(1)], expectedAt: [36, 1], litShare: +litShare(home).toFixed(2) });
    }

    if (has('reload')) {
      if (readRun(env).mapId !== EDGE || readRun(env).ty < 5) await standAt(EDGE, 30, 18, 'right');
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(1800);
      await page.keyboard.up('KeyD');
      await sleep(2500);
      const p1 = readRun(env);
      const before = await shoot('r1_before_reload');
      await openGame(env, session!);
      const before2 = await shoot('r2_after_reload');
      const p2 = readRun(env);
      const same = p1.mapId === p2.mapId && Math.abs(p1.tx - p2.tx) <= 1 && Math.abs(p1.ty - p2.ty) <= 1;
      const chestsKept = p1.chests.every((c) => p2.chests.includes(c));
      const look = diff(before, before2, { x: 0, y: 0, w: 1600, h: 900 });
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(1200);
      await page.keyboard.up('KeyD');
      await sleep(2500);
      const p3 = readRun(env);
      await shoot('r3_continued');
      report('reload', same && chestsKept && look < 0.1 && p3.mapId === p2.mapId && Math.abs(p3.tx - p2.tx) > 0.3, { map: [p1.mapId, p2.mapId, p3.mapId], tile1: [+p1.tx.toFixed(1), +p1.ty.toFixed(1)], tile2: [+p2.tx.toFixed(1), +p2.ty.toFixed(1)], tile3: [+p3.tx.toFixed(1), +p3.ty.toFixed(1)], openedChestsKept: chestsKept, openedChests: p2.chests, pictureDiff: +look.toFixed(3), fps: await fps(page, 1500) });
    }
    console.log(JSON.stringify({ view: VIEW, gpu, fps: rates, errors: env.errors, steps: env.steps.map((s) => `${s.step}:${s.pass ? 'PASS' : 'FAIL'}`) }, null, 2));
  } finally {
    await browser.close();
  }
  if (env.errors.length > 0 || env.steps.some((s) => !s.pass)) process.exitCode = 1;
}

void main();
