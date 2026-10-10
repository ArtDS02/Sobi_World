// Sobi Aquarium (GĐ8) on the production build: the door opens at world level 6, the player feeds the fish, the tank keeps
// living while the game is closed (the away screen counts the scales) and the next visit collects them.
import { _electron as electron, expect, test, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const HOUR = 3_600_000;
const launch = (userData: string) => {
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  return electron.launch({ args: [root], cwd: root, env: { ...env, UNIN_USER_DATA: userData } as Record<string, string> });
};
const file = (dir: string) => join(dir, 'saves', 'save.json');
const read = (dir: string) => JSON.parse(readFileSync(file(dir), 'utf8'));

/** Clicks where a plaza object stands (design px → the canvas, which letterboxes a 1600 × 900 frame). */
async function clickPlaza(page: Page, x: number, y: number) {
  const box = (await page.locator('.app__stage canvas').boundingBox())!;
  const zoom = Math.min(box.width / 1600, box.height / 900);
  await page.mouse.click(box.x + box.width / 2 + (x - 800) * zoom, box.y + box.height / 2 + (y - 450) * zoom);
}

test('the aquarium: it opens, feed the fish, leave it for a day, collect the scales from the away screen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-aquarium-'));
  try {
    // A first launch writes a new world; then the world is made level 6+ (farm XP) and the wallet stocked.
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await app.close();
    const seeded = read(dir);
    seeded.progression.areas.sobi_farm = { xp: 6000 };
    seeded.wallet.coins = 20_000;
    seeded.settings.tutorialDone = true;
    writeFileSync(file(dir), JSON.stringify(seeded));

    // The aquarium opens by itself; walk to the dock (the click walks to it and goes in); feed the whole tank.
    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.app.is-plaza')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(3000);
    await clickPlaza(page, 488, 610);
    await expect(page.locator('.app.is-aquarium')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.aquarium-ui__dock')).toBeVisible();
    await page.getByRole('button', { name: 'Cho ăn cả bể' }).click();
    await expect(page.locator('.aquarium-ui__dock')).toBeVisible();
    await app.close();

    const fed = read(dir);
    expect(fed.world.unlockedAreas).toContain('sobi_aquarium');
    const tank = fed.areas.sobi_aquarium;
    expect(tank.fish).toHaveLength(1);
    expect(tank.fish[0].hunger).toBeGreaterThanOrEqual(99);
    expect(fed.inventory.items.FOOD_FISH).toBe(5);

    // The player "left" 30 hours ago and the fish is fully grown: it has been shedding scales.
    const away = fed;
    away.areas.sobi_aquarium.lastTickedAt -= 30 * HOUR;
    away.areas.sobi_aquarium.fish[0].lastTickedAt -= 30 * HOUR;
    away.areas.sobi_aquarium.fish[0].growthProgress = 100;
    away.areas.sobi_farm.trough.lastResolvedAt -= 30 * HOUR;
    writeFileSync(file(dir), JSON.stringify(away));

    app = await launch(dir);
    page = await app.firstWindow();
    const dialog = page.locator('.c-dialog', { hasText: 'Trong lúc bạn vắng mặt' });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog).toContainText('vảy cá đang chờ thu');
    await dialog.getByRole('button', { name: 'Ra bể cá' }).first().click();
    await expect(page.locator('.app.is-aquarium')).toBeVisible();
    await page.getByRole('button', { name: /Thu vảy/ }).first().click();
    await expect(page.locator('.c-toast-host')).toContainText('vảy cá');
    await app.close();

    const done = read(dir);
    expect(done.inventory.items.item_scale).toBeGreaterThan(0);
    expect(done.areas.sobi_aquarium.tank.scales).toBe(0);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
