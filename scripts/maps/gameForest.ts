// `npx tsx scripts/maps/gameForest.ts --base http://localhost:5197 --userData <dir the dev server was started with> --out <dir>`:
// plays the REAL game in a browser on the Vite dev server (start it with `UNIN_USER_DATA=<dir> npx vite --port 5197 --strictPort`):
// makes a fresh save, gives it the farm level the Adventure needs (as tests/e2e/adventure.spec.ts does), opens the Adventure from the
// plaza, takes the first pig, sets off to map_forest_edge, walks with the keys and takes 1600 x 900 pictures plus the frame rate.
// `--view classic` writes mapView = classic into the device settings first. `--gpu` uses the machine's own GPU (ANIM_GPU=high: the
// discrete one). It reports page errors; it never touches a player's save (the dev server's own folder is the one given).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { openBrowser } from '../anim-review/lib/session';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
};
const BASE = arg('base', 'http://localhost:5197');
const USER = arg('userData', '');
const OUT = arg('out', join(process.cwd(), 'art_inbox', 'game_forest'));
const VIEW = arg('view', 'diorama');
const GPU = process.argv.includes('--gpu');
/** `--at 23,11`: puts the trip's party on that tile first; `--battle`: then walks (`--key`, default KeyA = west) into the group there, flees and looks at the map again. */
const AT = arg('at', '');
const BATTLE = process.argv.includes('--battle');
const SAVE = join(USER, 'saves', 'save.json');

async function plazaClick(page: Page, x: number, y: number) {
  const box = (await page.locator('.app__stage canvas').boundingBox())!;
  const zoom = Math.min(box.width / 1932, box.height / 900);
  await page.mouse.click(box.x + box.width / 2 + (x - 966) * zoom, box.y + box.height / 2 + (y - 450) * zoom);
}

/** Counts animation frames for `ms` and returns the rate (the page code is a string: the script's bundler adds helpers a page lacks). */
const fps = (page: Page, ms: number): Promise<number> =>
  page.evaluate(
    `new Promise((done) => { let n = 0; const t0 = performance.now(); const tick = () => { n += 1; if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); else done((n * 1000) / (performance.now() - t0)); }; requestAnimationFrame(tick); })`,
  ) as Promise<number>;

async function main() {
  if (!USER) throw new Error('--userData is required (the folder the dev server runs on)');
  mkdirSync(OUT, { recursive: true });
  const { browser, gpu } = await openBrowser(GPU);
  const errors: string[] = [];
  try {
    if (!existsSync(SAVE)) {
      const first = await browser.newContext({ viewport: { width: 1600, height: 900 } });
      const p = await first.newPage();
      await p.goto(BASE);
      await p.locator('.plazabar').waitFor({ timeout: 60_000 });
      await p.waitForTimeout(2500);
      await first.close();
    }
    const save = JSON.parse(readFileSync(SAVE, 'utf8')) as { progression: { areas: Record<string, unknown> }; wallet: { coins: number }; settings: { tutorialDone: boolean }; areas: { sobi_adventure: { run: { team: { stats: object; hp: number }[] } } } };
    save.progression.areas.sobi_farm = { xp: 100_000 };
    save.wallet.coins = 20_000;
    save.settings.tutorialDone = true;
    if (AT) {
      const [x, y] = AT.split(',').map(Number) as [number, number];
      Object.assign(save.areas.sobi_adventure.run, { x: (x + 0.5) * 40, y: (y + 0.5) * 40, facing: 'right' });
      // A strong pig, so the battle in the script is won by the Auto button and the trip goes on.
      const pig = save.areas.sobi_adventure.run.team[0]!;
      Object.assign(pig.stats, { hp: 9999, atk: 999, def: 99, matk: 999, mdef: 99 });
      pig.hp = 9999;
    }
    writeFileSync(SAVE, JSON.stringify(save));

    const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    await context.addInitScript(`localStorage.setItem('sobiworld.settings', JSON.stringify({ mapView: '${VIEW}' }));`);
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    await page.goto(BASE);
    await page.locator('.plazabar__dock').waitFor({ timeout: 60_000 });
    await plazaClick(page, 300, 380);
    await page.locator('.app.is-adventure').waitFor({ timeout: 20_000 });
    // From wherever the saved trip stands: take the first pig, pick a fighter, set off (each only when it is on the screen).
    const here = (loc: ReturnType<Page['locator']>) => loc.first().isVisible().catch(() => false);
    await page.waitForTimeout(1500);
    const gift = page.getByRole('button', { name: 'Nhận heo phiêu lưu đầu tiên' });
    if (await here(gift)) await gift.click();
    if (!(await here(page.locator('.adventure-explore')))) {
      const pick = page.locator('.adventure-ui__fighter .adventure-ui__fighter-pick');
      if (!(await here(page.locator('.adventure-ui__fighter.is-selected')))) await pick.first().click();
      await page.getByRole('button', { name: /Lên đường/ }).click();
    }
    await page.locator('.adventure-explore').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(3000);
    const tip = page.getByRole('button', { name: 'Đã hiểu' });
    if (await here(tip)) await tip.click();
    await page.waitForTimeout(1500);
    const shot = (name: string) => page.screenshot({ path: join(OUT, `${VIEW}_${name}.png`) });
    await shot('1_start');
    const rates: Record<string, number> = BATTLE ? {} : { idle: await fps(page, 3000) };
    if (BATTLE) {
      await shot('b1_before');
      await page.keyboard.down(arg('key', 'KeyA'));
      await page.waitForTimeout(3000);
      await shot('b1b_walked');
      await page.getByRole('button', { name: 'Bỏ chạy' }).first().waitFor({ timeout: 15_000 });
      await page.keyboard.up(arg('key', 'KeyA'));
      await page.waitForTimeout(1500);
      await shot('b2_battle');
      // The battle plays itself (the Auto button) until the trip's screen is back (a result window is closed when it shows).
      await page.getByRole('button', { name: 'Tự động' }).first().click({ timeout: 4000 }).catch(() => undefined);
      for (let i = 0; i < 40 && !(await here(page.locator('.adventure-explore'))); i += 1) {
        const ok = page.getByRole('button', { name: /Nhận thưởng|Tiếp tục|Đóng/ }).first();
        if (await here(ok)) await ok.click().catch(() => undefined);
        await page.waitForTimeout(1500);
      }
      await page.waitForTimeout(5000);
      await shot('b3_back');
      rates.back = await fps(page, 2000);
    }
    // Walk: east along the path, then south, a few steps each (the keys are the game's own).
    for (const [key, ms, name] of [['KeyD', 1500, '2_east'], ['KeyS', 1000, '3_south'], ['KeyD', 2500, '4_east2']] as const) {
      await page.keyboard.down(key);
      const during = fps(page, ms);
      rates[`walk_${name}`] = await during;
      await page.keyboard.up(key);
      await page.waitForTimeout(400);
      await shot(name);
    }
    console.log(JSON.stringify({ view: VIEW, gpu, fps: rates, errors }, null, 2));
  } finally {
    await browser.close();
  }
  if (errors.length > 0) process.exitCode = 1;
}

void main();
