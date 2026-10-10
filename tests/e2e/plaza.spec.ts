// The walking world (GĐ3), on the production build: the game opens in the plaza, the character walks to the
// barn, goes in (a farm played with clicks), comes back by the HUD button; the key settings are saved in settings.json and
// obeyed after a restart; the spot in the plaza is kept.
import { _electron as electron, expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enterFarm, hold, walkToBarn } from './world';

const root = process.cwd();
const launch = (userData: string) => {
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  return electron.launch({ args: [root], cwd: root, env: { ...env, UNIN_USER_DATA: userData } as Record<string, string> });
};

const withTemp = async (run: (dir: string) => Promise<void>) => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-plaza-'));
  try {
    await run(dir);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
};
const readWorld = (dir: string) => JSON.parse(readFileSync(join(dir, 'saves', 'save.json'), 'utf8'));

test('plaza → barn → farm → way out → plaza; the spot is kept', async () => {
  await withTemp(async (dir) => {
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar, .topbar__nav').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.app.is-plaza')).toBeVisible(); // the game opens in the plaza
    await expect(page.locator('.world-prompt')).toHaveCount(0); // nothing near the spawn

    await enterFarm(page);
    // In the farm the character stands at the entrance, away from every thing; the farm HUD is up.
    await expect(page.locator('.c-gauge')).toBeVisible();
    // The farm is played with clicks (spec §4): no character, no key hint; the way out is the HUD button.
    await expect(page.locator('.world-prompt')).toHaveCount(0);
    await hold(page, 'KeyD', 300); // walking keys do nothing in the farm
    await page.locator('.topbar__home').click();
    await expect(page.locator('.app.is-plaza')).toBeVisible();
    // Back in the plaza in front of the barn door: the hint of the door is there.
    await expect(page.locator('.world-prompt', { hasText: 'Vào Sobi Farm' })).toBeVisible();

    // Walk away and rest; the spot is written to the save.
    await hold(page, 'KeyA', 800);
    await page.waitForTimeout(2500);
    await app.close();
    const spot = readWorld(dir).player;
    expect(spot.area).toBe('plaza');
    expect(spot.x).toBeLessThan(1300); // walked left of the barn door (x = 1376)

    // Next launch: the same spot.
    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.app.is-plaza')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await app.close();
    expect(readWorld(dir).player.x).toBe(spot.x);
  });
});

test('key settings: rebinding the interact key is saved in settings.json and obeyed after a restart', async () => {
  await withTemp(async (dir) => {
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar, .topbar__nav').first()).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press('Escape'); // the menu key opens the settings
    await expect(page.locator('[data-section="keys"]')).toBeVisible();
    const row = (name: string) => page.locator('[data-section="keys"] button', { hasText: name });
    // A key another control uses is refused.
    await page.getByRole('button', { name: 'Tương tác: Phím chính' }).click();
    await page.keyboard.press('KeyI');
    await expect(page.locator('.keys__message')).toContainText('Túi đồ');
    // A free key works.
    await page.getByRole('button', { name: 'Tương tác: Phím chính' }).click();
    await page.keyboard.press('KeyF');
    await expect(page.getByRole('button', { name: 'Tương tác: Phím chính' })).toHaveText('F');
    await expect(row('Phím mặc định')).toBeVisible();
    await expect.poll(() => readFileSync(join(dir, 'settings.json'), 'utf8')).toContain('KeyF');
    await page.keyboard.press('Escape'); // closes the settings
    await app.close();

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.plazabar, .topbar__nav').first()).toBeVisible({ timeout: 30_000 });
    await walkToBarn(page);
    const hint = page.locator('.world-prompt', { hasText: 'Vào Sobi Farm' });
    await expect(hint.locator('kbd')).toHaveText('F'); // the hint shows the new key
    await page.keyboard.press('KeyE'); // the old key does nothing now
    await expect(page.locator('.app.is-plaza')).toBeVisible();
    await page.keyboard.press('KeyF');
    await expect(page.locator('.app:not(.is-plaza)')).toBeVisible();
    await app.close();
  });
});
