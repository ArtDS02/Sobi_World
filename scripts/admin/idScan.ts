/// <reference lib="dom" />
// Raw-id scan (plan step 5.5): visible text of every admin page that looks like an id (snake_case) outside the places ids
// are allowed (<code>, <small>, <kbd>, inputs, titles, .id / [data-id] spans). Prints leftovers per page; with --strict it fails.
// Usage: npm run admin -- --port 5175 (other terminal), then npx tsx scripts/admin/idScan.ts [baseUrl] [--strict]
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5175/admin.html';
// assets and library list art files, where the id is the subject, so they are not scanned.
const PAGES = ['', 'users', 'content', 'pigs', 'breeding', 'products', 'layout', 'adventure', 'adventure-world', 'adventure-maps', 'battle-lab'];
const exe = [process.env.ADMIN_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p): p is string => !!p && existsSync(p));
if (!exe) throw new Error('no Chrome/Edge found: set ADMIN_CHROME');
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let total = 0;
for (const name of PAGES) {
  await page.goto(`${BASE}#/${name}`);
  await page.waitForTimeout(1200);
  const found = await page.evaluate(() => {
    const ALLOWED = 'code, small, kbd, input, textarea, select, option, pre, script, style, .id, .mono, [data-id], .muted code';
    const out = new Set<string>();
    const walker = document.createTreeWalker(document.querySelector('.content') ?? document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest(ALLOWED)) continue;
      for (const m of n.textContent?.matchAll(/\b[a-z]+(?:_[a-z0-9]+)+\b/g) ?? []) out.add(m[0]);
    }
    return [...out];
  });
  total += found.length;
  if (found.length) console.log(`#/${name}: ${found.length} raw ids: ${found.slice(0, 12).join(', ')}`);
}
await browser.close();
console.log(`id scan: ${total} raw ids visible`);
if (strict && total > 0) process.exit(1);
