/// <reference lib="dom" />
// Admin page audit (plan step 4.6): every page at 1440, 1100 and 760 px, light and dark. Fails on a console error, a failed
// request, a page error, or horizontal overflow of the page. Read only: nothing is clicked.
// Usage: npm run admin -- --port 5175   (another terminal)   then   npx tsx scripts/admin/pageAudit.ts [baseUrl]
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:5175/admin.html';
const WIDTHS = [1440, 1100, 760];
const PAGES = [
  '', 'users', 'content', 'pigs', 'validation', 'breeding', 'products', 'layout', 'seasons', 'daynight', 'adventure',
  'adventure-world', 'adventure-network', 'adventure-assets', 'adventure-maps', 'battle-lab', 'rig-lab', 'assets', 'library', 'checks', 'balance', 'desktop', 'guide',
];
const CANDIDATES = [process.env.ADMIN_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const exe = CANDIDATES.find((p): p is string => !!p && existsSync(p));
if (!exe) throw new Error('no Chrome/Edge found: set ADMIN_CHROME');

const browser = await chromium.launch({ executablePath: exe, headless: true });
const problems: string[] = [];
let checked = 0;
for (const scheme of ['light', 'dark'] as const) {
  const ctx = await browser.newContext({ colorScheme: scheme });
  const page = await ctx.newPage();
  let where = '';
  page.on('console', (m) => m.type() === 'error' && problems.push(`${where}: console error: ${m.text().slice(0, 160)}`));
  page.on('pageerror', (e) => problems.push(`${where}: page error: ${e.message.slice(0, 160)}`));
  page.on('requestfailed', (r) => problems.push(`${where}: request failed: ${r.url().slice(0, 100)}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`${where}: HTTP ${r.status()} ${r.url().slice(0, 100)}`));
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    for (const name of PAGES) {
      where = `${scheme} ${width}px #/${name}`;
      await page.goto(`${BASE}#/${name}`);
      await page.waitForTimeout(900);
      const over = await page.evaluate(() => document.scrollingElement!.scrollWidth - document.scrollingElement!.clientWidth);
      if (over > 2) problems.push(`${where}: page overflows horizontally by ${over}px`);
      checked += 1;
    }
  }
  await ctx.close();
}
await browser.close();
console.log(`page audit: ${checked} page views`);
if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  process.exit(1);
}
console.log('OK');
