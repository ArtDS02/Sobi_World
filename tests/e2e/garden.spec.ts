// Sobi Garden (GĐ5) on the production build: the door opens once the farm is Lv3, the player sows from the
// palette, the crops grow while the game is closed (the away screen counts them) and the next visit harvests them.
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

/** From the plaza spawn: walk to the garden gate and go in. */
async function enterGarden(page: Page) {
  await expect(page.locator('.app.is-plaza')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3000);
  await clickPlaza(page, 496, 340); // the gate: the click walks to it and goes in by itself
  await expect(page.locator('.app.is-garden')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.garden-ui__dock')).toBeVisible();
}

test('the garden: it opens, sow, leave it for hours, harvest from the away screen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-garden-'));
  try {
    // A first launch writes a new world; then the farm is made Lv3 (its XP) and the bag stocked.
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.world-prompt')).toHaveCount(0);
    await app.close();
    const seeded = read(dir);
    seeded.progression.areas.sobi_farm = { xp: 5000 };
    seeded.wallet.coins = 20_000;
    seeded.inventory.items = { ...seeded.inventory.items, item_corn: 4, item_wheat: 2 };
    seeded.settings.tutorialDone = true;
    writeFileSync(file(dir), JSON.stringify(seeded));

    // The garden opens by itself; its door is open; sow everything with wheat; build the mill.
    app = await launch(dir);
    page = await app.firstWindow();
    await enterGarden(page);
    await page.locator('.garden-ui__seed', { hasText: 'Lúa mì' }).click();
    await page.getByRole('button', { name: /Gieo kín ô trống/ }).click();
    await expect(page.locator('.c-toast-host')).toContainText('Đã gieo 6 ô Lúa mì');
    await page.getByRole('button', { name: /Tưới cả vườn/ }).click();
    await expect(page.locator('.c-toast-host')).toContainText('Đã tưới 6 ô');
    await app.close();

    const sown = read(dir);
    expect(sown.world.unlockedAreas).toContain('sobi_garden');
    const garden = sown.areas.sobi_garden;
    expect(garden.plots.slice(0, 6).every((p: { cropId: string }) => p.cropId === 'crop_wheat')).toBe(true);
    expect(sown.wallet.coins).toBe(20_000 - 6 * 4);
    expect(sown.progression.areas.sobi_garden.xp).toBe(6);

    // The player "left" 5 hours ago: the garden's clocks move back, as the admin's ⏩ does.
    garden.lastTickedAt -= 5 * HOUR;
    for (const p of garden.plots) if (p.wetUntil > 0) p.wetUntil -= 5 * HOUR;
    sown.areas.sobi_garden = garden;
    for (const k of ['pigs']) for (const p of sown.areas.sobi_farm[k]) p.lastTickedAt -= 5 * HOUR;
    sown.areas.sobi_farm.trough.lastResolvedAt -= 5 * HOUR;
    writeFileSync(file(dir), JSON.stringify(sown));

    app = await launch(dir);
    page = await app.firstWindow();
    const away = page.locator('.c-dialog', { hasText: 'Trong lúc bạn vắng mặt' });
    await expect(away).toBeVisible({ timeout: 30_000 });
    await expect(away).toContainText('6 cây đã chín');
    await expect(away).toContainText('6 ô cây đã chín, đang chờ thu hoạch');
    await away.getByRole('button', { name: 'Vào vườn' }).click();
    await expect(page.locator('.app.is-garden')).toBeVisible();
    await expect(page.locator('.garden-ui__dock')).toBeVisible();

    await page.getByRole('button', { name: /Thu hoạch hết/ }).click();
    await expect(page.locator('.c-toast-host')).toContainText('Thu hoạch 18 Lúa mì');
    await app.close();

    const harvested = read(dir);
    expect(harvested.inventory.items.item_wheat).toBe(2 + 18);
    expect(harvested.areas.sobi_garden.plots.every((p: { cropId: string | null }) => p.cropId === null)).toBe(true);
    expect(harvested.progression.areas.sobi_garden.xp).toBe(6 + 6 * 2);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
