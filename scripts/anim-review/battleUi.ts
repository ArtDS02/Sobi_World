// `tsx scripts/anim-review/battleUi.ts --url <dev url> --out <folder> [--save <save.json>]`: the REAL battle screen of Sobi Adventure (DOM over the
// Phaser stage) through Electron, for what the Battle Lab cannot show: the HUD (dock, turn bar, plates), targeting (the reticles: their size, what
// a click at their centre really reaches, whether any plate or unit covers them) and how the dock behaves while a step plays. It writes pictures and
// `battle_ui.json` (measures for the rubric's Targeting and Turn + HUD groups, §4). Run by `npm run anim:game`, which gives it a private dev server.
// Never opens the player's own save: a copy of the prepared save goes to a throw-away folder.
import { _electron as electron, type Page } from '@playwright/test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const arg = (n: string, d: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : d;
};
const root = process.cwd();
const URL = arg('url', 'http://localhost:5190');
const OUT = arg('out', join(root, 'docs/animation-review/capture/game/_battle_ui'));
const SAVE = arg('save', join(tmpdir(), 'sobiworld-anim-review', 'save.json'));
const VIEW = { width: 1600, height: 900 };
mkdirSync(OUT, { recursive: true });

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);
const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).first();
const files: string[] = [];
const shot = async (page: Page, name: string) => {
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, timeout: 30_000 }).catch(() => page.screenshot({ path: file, timeout: 60_000 }));
  files.push(`${name}.png`);
  console.log(`  ok ${name}`);
};

async function closePopups(page: Page) {
  const open = page.locator('.app__popup .c-window, .app__dialogs .c-dialog');
  for (let i = 0; i < 5 && (await open.count()) > 0; i++) {
    const close = open.first().getByRole('button', { name: /^(Đóng|Nhận|OK|Để sau)/ }).first();
    if (await close.isVisible().catch(() => false)) await close.click();
    else await page.keyboard.press('Escape');
    await pause(page, 500);
  }
}

/** What each reticle of the aim really is: its size, and what a click at its centre and at four points of its box reaches. */
const AIM_PROBE = `(() => {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const units = [...document.querySelectorAll('.adventure-ui__unit.is-aimable')];
  const side = document.querySelector('.adv-reticle--side');
  const reticles = [...document.querySelectorAll('.adv-reticle')].filter((r) => !r.classList.contains('adv-reticle--side'));
  const reach = (x, y, within) => { const el = document.elementFromPoint(x, y); return { hit: !!el && within.some((w) => w.contains(el)), tag: el ? (el.className && el.className.toString().split(' ')[0]) || el.tagName : null }; };
  const out = [];
  for (const u of units) {
    const r = u.querySelector('.adv-reticle');
    const box = (r || u).getBoundingClientRect();
    const ub = u.getBoundingClientRect();
    const pts = [[0.5, 0.5], [0.25, 0.5], [0.75, 0.5], [0.5, 0.25], [0.5, 0.75]].map(([fx, fy]) => reach(box.left + box.width * fx, box.top + box.height * fy, [r || u, u]));
    const tr = r ? getComputedStyle(r).pointerEvents : null;
    out.push({ unit: u.getAttribute('data-id') || u.className.toString().split(' ').slice(0, 2).join('.'), reticle: !!r, widthPx: Math.round(box.width), heightPx: Math.round(box.height), widthRem: +(box.width / rem).toFixed(2), unitWidthPx: Math.round(ub.width), reach: pts.filter((p) => p.hit).length + '/5', blockedBy: [...new Set(pts.filter((p) => !p.hit).map((p) => p.tag))], pointerEvents: tr });
  }
  return { rem, aimable: units.length, reticles: reticles.length, sideReticle: !!side, units: out, aimLabel: !!document.querySelector('.adventure-ui__aim') };
})()`;

/** The state of the dock and the turn bar at this moment. */
const HUD_PROBE = `(() => {
  const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), opacity: +cs.opacity, transform: cs.transform, visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.05 }; };
  return { dock: pick('.adventure-ui__dock'), turnbar: pick('.adventure-ui__turnbar'), plates: document.querySelectorAll('.adventure-ui__plate').length, cards: document.querySelectorAll('.adventure-ui__card:not(.is-off)').length, aiming: !!document.querySelector('.is-aiming'), t: Math.round(performance.now()) };
})()`;

async function run(page: Page) {
  const metrics: Record<string, unknown> = { view: VIEW, url: URL };
  await page.setViewportSize(VIEW);
  await page.locator('.plazabar__dock').waitFor({ timeout: 60_000 });
  await pause(page, 1500);
  await closePopups(page);
  await page.locator('.plazabar__area--adventure').click();
  await page.locator('.app.is-adventure').waitFor({ timeout: 20_000 });
  await pause(page, 1500);
  await page.locator('.adventure-ui__hub').waitFor({ timeout: 15_000 });
  await page.locator('.adventure-ui__zone').last().click();
  await pause(page, 300);
  const picked = page.locator('.adventure-ui__fighter.is-selected .adventure-ui__fighter-pick');
  while ((await picked.count()) > 0) await picked.first().click();
  const free = page.locator('.adventure-ui__fighter:not(.is-off):not(.is-selected) .adventure-ui__fighter-pick');
  // Some fighters may be ill on a given run: take as many ready ones as there are, up to three (a team of two may enter).
  for (let i = 0; i < 3 && (await free.count()) > 0; i++) await free.first().click();
  await button(page, 'Vào Vết Nứt').click();
  await pause(page, 1200);
  if (!(await page.locator('.adventure-ui__battle').isVisible())) {
    await shot(page, '00_rift_entry');
    await button(page, /^Lên tầng/).click();
  }
  await page.locator('.adventure-ui__battle').waitFor({ timeout: 20_000 });
  // The intro curtain first (ANIM-105), then the first turn.
  await shot(page, '01_intro_curtain');
  await button(page, /^Đánh thường/).waitFor({ timeout: 40_000 });
  // The dock slides in a moment after the turn starts (ANIM-010): wait for it, and keep how long it took.
  const t0 = Date.now();
  await page.waitForFunction("(() => { const d = document.querySelector('.adventure-ui__dock'); return !!d && +getComputedStyle(d).opacity > 0.95; })()", undefined, { timeout: 15_000 }).catch(() => undefined);
  metrics.dockSlideInMs = Date.now() - t0;
  await pause(page, 600);
  await shot(page, '02_hud_player_turn');
  metrics.hudPlayerTurn = await page.evaluate(HUD_PROBE);

  await page.locator('.adventure-ui__unit--enemy').first().hover();
  await pause(page, 400);
  await shot(page, '03_hover_enemy');
  // The skill cards sit behind the dock's tabs: open the first, look at a card, close it.
  const tab = button(page, /^Kỹ năng chính/);
  if (await tab.isVisible().catch(() => false)) {
    await tab.click();
    await pause(page, 500);
    await shot(page, '04_skill_cards');
    const card = page.locator('.adventure-ui__card:not(.is-off)').first();
    if (await card.isVisible().catch(() => false)) {
      await card.hover();
      await pause(page, 300);
      await shot(page, '04b_hover_card');
    }
    await tab.click().catch(() => undefined);
    await pause(page, 400);
  }

  await button(page, /^Đánh thường/).click();
  await page.locator('.adventure-ui__aim').waitFor({ timeout: 8000 }).catch(() => undefined);
  await pause(page, 400);
  await shot(page, '05_aiming');
  metrics.hudAiming = await page.evaluate(HUD_PROBE);
  metrics.aim = await page.evaluate(AIM_PROBE);
  // Hover over the first reticle: it must answer (rubric Targeting: feedback on hover).
  const reticle = page.locator('.adventure-ui__unit.is-aimable .adv-reticle').first();
  if (await reticle.isVisible().catch(() => false)) {
    // Strings: no DOM types here. `.adv-reticle:hover` is read twice (the screen redraws about once a second and may drop the hover).
    const look = `(() => { const el = document.querySelector('.adv-reticle:hover'); if (!el) return { hovered: false }; const c = getComputedStyle(el); const r = getComputedStyle(el.querySelector('.adv-reticle__ring')); return { hovered: true, scale: c.scale, ringShadow: r.boxShadow.slice(0, 80) }; })()`;
    const idle = await page.evaluate(`(() => { const el = document.querySelector('.adv-reticle'); const c = getComputedStyle(el); return { scale: c.scale, ringShadow: getComputedStyle(el.querySelector('.adv-reticle__ring')).boxShadow.slice(0, 80) }; })()`);
    await reticle.hover();
    await pause(page, 120);
    const early = await page.evaluate(look);
    await pause(page, 300);
    metrics.hover = { idle, early, after: await page.evaluate(look) };
    await shot(page, '06_aim_hover');
  }
  // Fire the attack and follow the dock while the step plays (the DOM redraws about once a second: sample every 150 ms).
  await page.locator('.adventure-ui__unit.is-aimable').first().click();
  const samples: unknown[] = [];
  for (let i = 0; i < 24; i++) {
    samples.push(await page.evaluate(HUD_PROBE));
    if (i === 1) await shot(page, '07_step_early');
    if (i === 5) await shot(page, '08_step_mid');
    if (i === 12) await shot(page, '09_step_late');
    await pause(page, 150);
  }
  metrics.hudDuringStep = samples;
  await button(page, /^Đánh thường/).waitFor({ timeout: 40_000 }).catch(() => undefined);
  await pause(page, 800);
  await shot(page, '10_next_turn');
  metrics.hudNextTurn = await page.evaluate(HUD_PROBE);
  // Let the battle play itself ("Tự động") and look at it every few seconds: it brings the other turns of the foes, KO, statuses, the Ultimate's cut-in
  // over the real DOM and the end of the fight, which a fixed script of clicks would need many skills to reach.
  const auto = button(page, /Tự động/);
  if (await auto.isVisible().catch(() => false)) {
    await auto.click();
    const spans: unknown[] = [];
    for (let i = 0; i < 14; i++) {
      await pause(page, 5000);
      await shot(page, `auto_${String(i).padStart(2, '0')}`);
      spans.push(await page.evaluate(HUD_PROBE));
    }
    metrics.hudAuto = spans;
  }
  return metrics;
}

async function main() {
  const data = mkdtempSync(join(tmpdir(), 'sobi-battle-ui-'));
  mkdirSync(join(data, 'saves'), { recursive: true });
  const save = JSON.parse(readFileSync(SAVE, 'utf8')) as { settings?: { lastExportAt?: number | null } };
  if (save.settings) save.settings.lastExportAt = Date.now();
  writeFileSync(join(data, 'saves', 'save.json'), JSON.stringify(save));
  const app = await electron.launch({ args: [root], cwd: root, env: { ...(process.env as Record<string, string>), UNIN_DEV_URL: URL, UNIN_USER_DATA: data } });
  let metrics: Record<string, unknown> = {};
  let error: string | null = null;
  let live: Page | null = null;
  try {
    const page = await app.firstWindow({ timeout: 90_000 });
    live = page;
    metrics = await run(page);
  } catch (e) {
    error = (e instanceof Error ? e.message : String(e)).split('\n').slice(0, 3).join(' | ').slice(0, 400);
    console.log(`  FAILED: ${error}`);
    if (live) await shot(live, '99_failed').catch(() => undefined);
  } finally {
    await app.close().catch(() => undefined);
    try {
      rmSync(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
  writeFileSync(join(OUT, 'battle_ui.json'), JSON.stringify({ schema: 1, ok: error === null, error, pictures: files, metrics }, null, 2) + '\n');
  console.log(error ? 'INCOMPLETE battle ui' : `battle ui: ${files.length} pictures`);
  process.exitCode = error ? 1 : 0;
}

await main();
