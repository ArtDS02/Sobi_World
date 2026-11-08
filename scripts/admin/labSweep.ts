/// <reference lib="dom" />
// Animation workshop sweep (plan step 6.1): plays every skill of the Battle Lab with every option combination that matters
// (crit, KO, 1-3 units, corruption 0-5, fast speed, reduce motion, pause) and fails on a page error or console error.
// Also checks that redraws keep ONE Phaser canvas. Nothing is saved.
// Usage: npm run admin -- --port 5175 (other terminal), then npx tsx scripts/admin/labSweep.ts [baseUrl]
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:5175/admin.html';
const exe = [process.env.ADMIN_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p): p is string => !!p && existsSync(p));
if (!exe) throw new Error('no Chrome/Edge found: set ADMIN_CHROME');
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const problems: string[] = [];
let where = 'load';
page.on('pageerror', (e) => problems.push(`${where}: page error: ${e.message.slice(0, 200)}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`${where}: console error: ${m.text().slice(0, 200)}`));
await page.goto(`${BASE}#/battle-lab`);
await page.waitForSelector('[data-play]', { timeout: 15000 });
const skills = await page.evaluate(() => [...document.querySelectorAll<HTMLSelectElement>('select[data-skill="ally"] option')].map((o) => o.value).filter(Boolean));
console.log(`${skills.length} skills`);
const click = (sel: string) => page.evaluate((s) => document.querySelector<HTMLElement>(s)?.click(), sel);
const setSelect = (sel: string, value: string) =>
  page.evaluate(([s, v]) => {
    const el = document.querySelector<HTMLSelectElement>(s!);
    if (el) {
      el.value = v!;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, [sel, value]);
const setFlag = (flag: string, on: boolean) =>
  page.evaluate(([f, v]) => {
    const el = document.querySelector<HTMLInputElement>(`[data-flag="${f}"]`);
    if (el) {
      el.checked = v === 'true';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, [flag, String(on)]);
for (const skill of skills) {
  where = `skill ${skill}`;
  await setSelect('select[data-skill="ally"]', skill);
  await page.waitForTimeout(150);
  for (const combo of [
    { crit: false, ko: false },
    { crit: true, ko: true },
  ]) {
    await setFlag('crit', combo.crit);
    await setFlag('ko', combo.ko);
    await click('[data-play]');
    await page.waitForTimeout(500);
    await click('[data-pause]');
    await click('[data-pause]');
  }
}
for (const [what, run] of [
  ['units', async () => { for (const i of [1, 2]) { await click(`[data-team="ally:${i}"]`); await click(`[data-team="enemy:${i}"]`); } }],
  ['corruption', async () => { for (let c = 0; c <= 5; c++) { await setSelect('[data-count="corruption"]', String(c)); await click('[data-play]'); await page.waitForTimeout(250); } }],
  ['enter battle', async () => { await click('[data-enter]'); await page.waitForTimeout(600); }],
  ['scrub and frame step', async () => {
    await click('[data-play]');
    await page.waitForTimeout(300);
    const box = await page.locator('.blab__track').boundingBox();
    if (box) await page.mouse.click(box.x + box.width * 0.6, box.y + box.height / 2);
    for (const sel of ['[data-next]', '[data-prev]', '[data-next]']) await click(sel);
    await page.keyboard.press('ArrowRight');
    await click('[data-pause]'); // resume
    await page.waitForTimeout(300);
  }],
  ['replay', async () => { await click('[data-replay]'); await page.waitForTimeout(400); }],
  ['fast + reduce', async () => { await setSelect('[data-speed]', '2'); await setFlag('reduce', true); await click('[data-play]'); await page.waitForTimeout(400); }],
] as const) {
  where = what;
  await run();
}
where = 'canvas count';
const canvases = await page.evaluate(() => document.querySelectorAll('[data-stage] canvas').length);
if (canvases !== 1) problems.push(`${canvases} canvases in the stage after the sweep (expected 1)`);
await browser.close();
if (problems.length) {
  console.error([...new Set(problems)].slice(0, 40).join('\n'));
  process.exit(1);
}
console.log('OK: no errors, one canvas');
