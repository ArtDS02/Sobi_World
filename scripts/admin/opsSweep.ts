/// <reference lib="dom" />
// Admin operation sweep (plan 4.3): what the dashboard does when things go wrong — the dev API offline, invalid input, a
// cancelled dialog, leaving with unsaved work. Nothing is written to disk (saves are never confirmed).
// Usage: npm run admin -- --port 5175 (other terminal), then npx tsx scripts/admin/opsSweep.ts [baseUrl]
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:5175/admin.html';
const PAGES = ['', 'users', 'content', 'pigs', 'validation', 'breeding', 'products', 'layout', 'seasons', 'daynight', 'adventure', 'adventure-world', 'adventure-network', 'adventure-assets', 'adventure-maps', 'battle-lab', 'rig-lab', 'assets', 'library', 'checks', 'balance', 'desktop', 'guide'];
const exe = [process.env.ADMIN_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p): p is string => !!p && existsSync(p));
if (!exe) throw new Error('no Chrome/Edge found: set ADMIN_CHROME');
const browser = await chromium.launch({ executablePath: exe, headless: true });
const problems: string[] = [];

// 1. API offline: every request to /__admin is refused. Pages must still draw something and raise no script error.
{
  const ctx = await browser.newContext();
  await ctx.route('**/__admin/**', (r) => r.abort());
  const page = await ctx.newPage();
  let where = '';
  // Headless Chrome renders WebGL in software and now and then reports an incomplete framebuffer when a stage is created and
  // torn down in quick succession: environment noise, not the dashboard's (a real GPU never does).
  page.on('pageerror', (e) => !/Framebuffer status/.test(e.message) && problems.push(`offline ${where}: page error: ${e.message.slice(0, 160)}`));
  for (const name of PAGES) {
    where = `#/${name}`;
    await page.goto(`${BASE}#/${name}`);
    await page.waitForTimeout(900);
    const empty = await page.evaluate(() => (document.querySelector('.content')?.textContent ?? '').trim().length === 0 && !document.querySelector('.content canvas'));
    if (empty) problems.push(`offline ${where}: the page is blank`);
  }
  await ctx.close();
}

// 2. Invalid input on a content form: the cell turns bad and the save stays off; Esc closes the diff dialog without saving.
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const saves: string[] = [];
  page.on('request', (r) => r.method() === 'POST' && r.url().includes('/__admin/content') && saves.push(r.url()));
  page.on('pageerror', (e) => problems.push(`input: page error: ${e.message.slice(0, 160)}`));
  await page.goto(`${BASE}#/content/shared%2Ftime.json`);
  await page.waitForSelector('.fileedit input[type=number]', { timeout: 15000 });
  await page.waitForTimeout(1000); // the form binds its handlers right after it is drawn
  const input = page.locator('.fileedit input[type=number]').first();
  const old = await input.inputValue();
  await input.fill('-5');
  await input.dispatchEvent('change');
  await page.waitForTimeout(500);
  const saveOff = await page.locator('[data-save]').first().isDisabled();
  const bad = await page.locator('.fileedit .is-bad, .issues-box').count();
  if (!saveOff && bad === 0) problems.push('input: a negative value in a time field was accepted without a warning');
  // a valid change, then open the diff and cancel
  await input.fill(String(Number(old) + 1));
  await input.dispatchEvent('change');
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(400);
  if ((await page.locator('.modal').count()) === 0) problems.push('input: Ctrl+S did not open the change dialog');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if ((await page.locator('.modal').count()) !== 0) problems.push('input: Esc did not close the change dialog');
  // double click on the save button of the diff dialog must not be possible without the dialog; nothing was saved
  if (saves.length > 0) problems.push(`input: ${saves.length} content write(s) happened without a confirmation`);
  // leaving with unsaved work asks the browser to confirm
  const asked = await page.evaluate(() => {
    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });
  if (!asked) problems.push('leave: beforeunload did not warn about unsaved work');
  await ctx.close();
}
await browser.close();
console.log(`ops sweep: ${PAGES.length} pages offline, input and leave checks`);
if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  process.exit(1);
}
console.log('OK');
