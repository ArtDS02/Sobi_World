// Smoke test (spec §14.8): the unpacked production build with a temporary user data folder.
// First launch → buy a pig → fill the trough → quit → relaunch → both still there → export the
// save to a temp file. No network request may be attempted at any point.
import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enterFarm } from './world';

const root = process.cwd(); // npm run test:e2e runs from the repo root
const network: string[] = [];

async function launch(userData: string): Promise<ElectronApplication> {
  // The production renderer (app://), never a dev server.
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  const app = await electron.launch({
    args: [root],
    cwd: root,
    env: { ...env, UNIN_USER_DATA: userData } as Record<string, string>,
  });
  app.context().on('request', (r) => {
    if (/^(https?|wss?):/.test(r.url())) network.push(r.url());
  });
  return app;
}

const savePath = (userData: string) => join(userData, 'saves', 'save.json');
/** The farm's slice of the world save v8. */
const readSave = (userData: string) =>
  (JSON.parse(readFileSync(savePath(userData), 'utf8')) as {
    areas: { sobi_farm: { pigs: unknown[]; trough: { food: number } } };
  }).areas.sobi_farm;

test('first launch, buy, fill, relaunch, export — offline', async () => {
  const userData = mkdtempSync(join(tmpdir(), 'unin-e2e-'));
  try {
    // First launch: a new farm.
    let app = await launch(userData);
    let page = await app.firstWindow();
    await enterFarm(page); // the game opens in the plaza: walk to the barn
    await page.getByRole('button', { name: 'Bỏ qua' }).click(); // tutorial

    // Buy a pig (choose gender).
    await page.locator('.topbar__nav').getByRole('button', { name: 'Cửa hàng' }).click();
    await page.locator('.shop__actions button').first().click();
    await page.keyboard.press('Escape');

    // Fill the trough from the top bar gauge.
    await page.locator('.c-gauge').click();
    await page
      .locator('.c-dialog button', { hasText: /^Đổ \d+ phần$/ })
      .last()
      .click();
    await expect(page.locator('.c-gauge')).toHaveText(/30\/30/);

    // Quit (main flushes the save first) and relaunch.
    await app.close();
    expect(readSave(userData).pigs).toHaveLength(1);
    app = await launch(userData);
    page = await app.firstWindow();
    await expect(page.locator('.topbar__nav')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.c-gauge')).toHaveAttribute('aria-label', /Máng ăn \d+\/30/);
    await expect(page.locator('.app__hint')).toHaveCount(0); // "no pig yet" hint is gone
    const after = readSave(userData);
    expect(after.pigs).toHaveLength(1);
    expect(after.trough.food).toBeGreaterThan(0);

    // Export through the settings screen; the native dialog is answered with a temp path.
    const exportPath = join(userData, 'export.json');
    await app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = (async () => ({ canceled: false, filePath: file })) as never;
    }, exportPath);
    await page.getByRole('button', { name: 'Cài đặt' }).click();
    await page.getByRole('button', { name: 'Xuất file lưu' }).click();
    await expect.poll(() => existsSync(exportPath)).toBe(true);
    expect(JSON.parse(readFileSync(exportPath, 'utf8')).areas.sobi_farm.pigs).toHaveLength(1);

    await app.close();
    expect(network).toEqual([]);
  } finally {
    // Windows can hold the folder for a moment after Electron exits; a leftover temp dir is harmless.
    try {
      rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
