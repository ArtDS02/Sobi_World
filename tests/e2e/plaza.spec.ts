// The plaza (decision 025), on the production build: the game opens in the plaza, a click on a door goes in (a closed
// one says why), the HUD button comes back, the dock goes straight to an Area; the key settings are saved and obeyed.
import { _electron as electron, expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clickPlaza, hoverPlaza } from './world';

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

test('plaza → barn → farm → way out → plaza: a click on a door goes in (decision 025: nobody walks)', async () => {
  await withTemp(async (dir) => {
    const app = await launch(dir);
    const page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.app.is-plaza')).toBeVisible(); // the game opens in the plaza
    await expect(page.locator('.world-prompt')).toHaveCount(0); // no hint until a door is hovered
    await expect(page.locator('.plazabar__dock')).toBeVisible({ timeout: 30_000 }); // the plaza scene is up

    // Hovering the barn names it; a click goes in.
    await hoverPlaza(page, 1625, 560);
    await expect(page.locator('.world-prompt', { hasText: 'Vào Sobi Farm' })).toBeVisible();
    await clickPlaza(page, 1625, 560);
    await expect(page.locator('.app:not(.is-plaza)')).toBeVisible();
    await expect(page.locator('.c-gauge')).toBeVisible();
    await expect(page.locator('.world-prompt')).toHaveCount(0);
    await page.locator('.topbar__home').click();
    await expect(page.locator('.app.is-plaza')).toBeVisible();

    // A closed door (the Cloud on a new world) stays shut and says why.
    await hoverPlaza(page, 1235, 160);
    await expect(page.locator('.world-prompt', { hasText: 'Sobi Cloud' })).toBeVisible();
    await clickPlaza(page, 1235, 160);
    await page.waitForTimeout(500);
    await expect(page.locator('.app.is-plaza')).toBeVisible();
    await app.close();
  });
});

test('key settings: only the keys that do something are listed; a rebound key is saved and obeyed after a restart', async () => {
  await withTemp(async (dir) => {
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press('Escape'); // the menu key opens the settings
    await expect(page.locator('[data-section="keys"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tương tác: Phím chính' })).toHaveCount(0); // nobody walks: no move / interact keys
    // A key another control uses is refused.
    await page.getByRole('button', { name: 'Túi đồ: Phím chính' }).click();
    await page.keyboard.press('KeyC');
    await expect(page.locator('.keys__message')).toContainText('Codex');
    // A free key works.
    await page.getByRole('button', { name: 'Túi đồ: Phím chính' }).click();
    await page.keyboard.press('KeyB');
    await expect(page.getByRole('button', { name: 'Túi đồ: Phím chính' })).toHaveText('B');
    await expect.poll(() => readFileSync(join(dir, 'settings.json'), 'utf8')).toContain('KeyB');
    await page.keyboard.press('Escape'); // closes the settings
    await app.close();

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('KeyI'); // the old key does nothing now
    await page.waitForTimeout(400);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await page.keyboard.press('KeyB');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await app.close();
  });
});

test('the plaza dock (decision 024): an open Area in one click, a closed one says why', async () => {
  await withTemp(async (dir) => {
    const app = await launch(dir);
    const page = await app.firstWindow();
    await expect(page.locator('.plazabar__dock')).toBeVisible({ timeout: 30_000 });
    // A new world: the Cloud is still closed (aria-disabled, yet a click still tells why).
    await page.locator('.plazabar__area--cloud').click({ force: true });
    await expect(page.locator('.c-toast').last()).toContainText('Sobi Cloud');
    await expect(page.locator('.app.is-plaza')).toBeVisible();
    await page.locator('.plazabar__area--farm').click();
    await expect(page.locator('.app:not(.is-plaza)')).toBeVisible();
    await expect(page.locator('.c-gauge')).toBeVisible();
    await app.close();
  });
});
