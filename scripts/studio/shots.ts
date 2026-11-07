// `npx tsx scripts/studio/shots.ts --tag <old|new> [--url http://localhost:5181] [--save <save.json>]`
// In-game pictures for the Studio gates (plan §4.7): Electron on a dev server with a throw-away copy of a prepared save
// (default: a fresh `dev:rich-save` world), the farm and the aquarium, saved under art_inbox/studio/shots/<tag>/.
// Electron draws offscreen, so this works while the app's browser pane is hidden. Never opens the player's own save.
import { _electron as electron, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
};
const root = process.cwd();
const URL = arg('url', 'http://localhost:5181');
const TAG = arg('tag', 'now');
const OUT = join(root, 'art_inbox', 'studio', 'shots', TAG);
const VIEW = { width: 1600, height: 900 };

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);

async function closePopups(page: Page) {
  for (let i = 0; i < 6; i++) {
    const open = page.locator('.app__popup .c-window, .app__dialogs .c-dialog');
    if ((await open.count()) === 0) return;
    const close = open
      .first()
      .getByRole('button', { name: /^(Đóng|Nhận|OK|Để sau|Bỏ qua)/ })
      .first();
    if (await close.isVisible().catch(() => false)) await close.click();
    else await page.keyboard.press('Escape');
    await pause(page, 500);
  }
}

/** Opens an Area from the bottom dock (via the plaza when inside another Area) and takes a picture. */
async function door(page: Page, key: string, file: string) {
  for (let i = 0; i < 2; i++) {
    const d = page.locator(`[class*="plazabar__area--"][class*="${key}"]`).first();
    if (await d.isVisible().catch(() => false)) {
      await d.click();
      await pause(page, 3500);
      await closePopups(page);
      await pause(page, 2000);
      await page.screenshot({ path: join(OUT, file) });
      return;
    }
    const plaza = page.getByRole('button', { name: /Sảnh/ }).first();
    if (await plaza.isVisible().catch(() => false)) await plaza.click();
    await pause(page, 2500);
  }
  console.warn(`door ${key} not found`);
}

async function main() {
  let save = arg('save', '');
  const work = mkdtempSync(join(tmpdir(), 'sobi-studio-shots-'));
  if (!save) {
    execFileSync(
      process.execPath,
      [join(root, 'node_modules/tsx/dist/cli.mjs'), 'scripts/dev/richSave.ts', work, '45', '7'],
      { cwd: root, stdio: 'inherit' },
    );
    save = join(work, 'saves', 'save.json');
  }
  if (!existsSync(save)) throw new Error(`no save at ${save}`);
  const data = join(work, 'data');
  mkdirSync(join(data, 'saves'), { recursive: true });
  const json = JSON.parse(readFileSync(save, 'utf8')) as {
    settings?: { lastExportAt?: number | null };
    live?: { dev?: { weather?: string | null } };
    areas?: { sobi_aquarium?: { fish?: { breed: string }[] } };
  };
  if (json.settings) json.settings.lastExportAt = Date.now(); // the backup reminder would cover the pictures
  if (json.live?.dev) json.live.dev.weather = 'sunny'; // rain streaks would cover the art
  // The U1 sample fish: a few goldfish in the tank (copy only).
  for (const fish of json.areas?.sobi_aquarium?.fish?.slice(0, 4) ?? [])
    fish.breed = 'fish_goldfish';
  writeFileSync(join(data, 'saves', 'save.json'), JSON.stringify(json));
  mkdirSync(OUT, { recursive: true });
  const app = await electron.launch({
    args: [root],
    cwd: root,
    env: { ...(process.env as Record<string, string>), UNIN_DEV_URL: URL, UNIN_USER_DATA: data },
  });
  try {
    const page = await app.firstWindow();
    await page.setViewportSize(VIEW);
    await page.locator('.plazabar__dock').waitFor({ timeout: 60_000 });
    await pause(page, 2500);
    await closePopups(page);
    await pause(page, 1500);
    await page.screenshot({ path: join(OUT, 'plaza.png') });
    await door(page, 'farm', 'farm.png');
    await door(page, 'aquarium', 'aquarium.png');
    console.log(`[shots] ${OUT}`);
  } finally {
    await app.close().catch(() => {});
    rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }
}

await main();
