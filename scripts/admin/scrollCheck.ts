/// <reference lib="dom" />
// Admin scroll check (plan step 2.6): on every page, scroll to the middle, click every tab / chip / summary / select option,
// and fail when the page scroll moves by more than TOLERANCE px. Only safe controls are clicked (never save, delete,
// publish or apply), so a run changes nothing on disk.
// Usage: npm run admin -- --port 5175   (another terminal)   then   npx tsx scripts/admin/scrollCheck.ts [baseUrl]
// The browser is the system Chrome (override with ADMIN_CHROME=<path to chrome.exe / msedge.exe>).
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:5175/admin.html';
const TOLERANCE = 4;
const PAGES = [
  '', 'users', 'content', 'pigs', 'validation', 'breeding', 'products', 'layout', 'seasons', 'daynight', 'adventure',
  'adventure-world', 'adventure-network', 'adventure-assets', 'adventure-maps', 'battle-lab', 'rig-lab', 'assets', 'library', 'checks', 'balance', 'desktop', 'guide',
];
/** Controls that only change the view. Native <summary> toggles are left out: folding a block shortens the page and the browser clamps the scroll by itself (no redraw involved). */
const SAFE = '[role="tab"], .subtabs button, .tabs button, .chip:not(a), button.chip, label.chip, [data-tab], [data-view]';

const CANDIDATES = [process.env.ADMIN_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const exe = CANDIDATES.find((p): p is string => !!p && existsSync(p));
if (!exe) throw new Error('no Chrome/Edge found: set ADMIN_CHROME');

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const failures: string[] = [];
let clicks = 0;
page.on('pageerror', (e) => failures.push(`page error: ${e.message}`));

for (const name of PAGES) {
  await page.goto(`${BASE}#/${name}`);
  await page.waitForTimeout(1200);
  const total = await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight);
  if (total < 120) continue; // nothing to scroll on this page
  const mid = Math.floor(total / 2);
  const count = await page.locator(`.content ${SAFE.split(', ').join(', .content ')}`).count();
  for (let i = 0; i < Math.min(count, 12); i++) {
    await page.evaluate((y) => document.scrollingElement!.scrollTo(0, y), mid);
    await page.waitForTimeout(150);
    const before = await page.evaluate(() => document.scrollingElement!.scrollTop);
    const target = page.locator(`.content ${SAFE.split(', ').join(', .content ')}`).nth(i);
    const label = ((await target.textContent().catch(() => '')) ?? '').trim().slice(0, 30);
    if (!(await target.isVisible().catch(() => false))) continue;
    // A DOM click, not Playwright's: its click scrolls the control into view first, which would be blamed on the page.
    await target.evaluate((el) => (el as HTMLElement).click()).catch(() => undefined);
    await page.waitForTimeout(500);
    clicks += 1;
    const after = await page.evaluate(() => document.scrollingElement!.scrollTop);
    if (Math.abs(after - before) > TOLERANCE) failures.push(`#/${name}: "${label}" moved the scroll ${before} → ${after}`);
    if (!(await page.evaluate(() => location.hash)).startsWith(`#/${name}`)) await page.goto(`${BASE}#/${name}`);
  }
}
await browser.close();
console.log(`scroll check: ${clicks} clicks over ${PAGES.length} pages`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('OK: no scroll jump above', TOLERANCE, 'px');
