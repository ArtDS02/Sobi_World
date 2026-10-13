// Sobi Adventure (GĐ10) on the production build: the door opens, the knight's starter pig comes to the farm, the party goes in,
// fights the first battle (Auto, x2) and the run is saved mid-way.
import { _electron as electron, expect, test, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const launch = (userData: string) => {
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  return electron.launch({ args: [root], cwd: root, env: { ...env, UNIN_USER_DATA: userData } as Record<string, string> });
};
const file = (dir: string) => join(dir, 'saves', 'save.json');
const read = (dir: string) => JSON.parse(readFileSync(file(dir), 'utf8'));

/** Clicks where a plaza object stands (design px → the canvas, which letterboxes the 1932 × 900 frame). */
async function clickPlaza(page: Page, x: number, y: number) {
  const box = (await page.locator('.app__stage canvas').boundingBox())!;
  const zoom = Math.min(box.width / 1932, box.height / 900);
  await page.mouse.click(box.x + box.width / 2 + (x - 966) * zoom, box.y + box.height / 2 + (y - 450) * zoom);
}

test('the adventure: it opens, the knight gives a pig, the party enters the forest and fights', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-adventure-'));
  try {
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await app.close();
    const seeded = read(dir);
    seeded.progression.areas.sobi_farm = { xp: 100_000 };
    seeded.wallet.coins = 20_000;
    seeded.settings.tutorialDone = true;
    writeFileSync(file(dir), JSON.stringify(seeded));

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.app.is-plaza')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(3000);
    await clickPlaza(page, 358, 300);
    await expect(page.locator('.app.is-adventure')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Nhận heo phiêu lưu đầu tiên' }).click();
    const card = page.locator('.adventure-ui__fighter').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.locator('.adventure-ui__fighter-pick').click();
    await page.getByRole('button', { name: /Xuất phát/ }).click();
    await expect(page.getByRole('button', { name: 'Tiến lên' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Tiến lên' }).click();
    await expect(page.locator('.adventure-ui__battle')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Tốc độ x2' }).click();
    await page.getByRole('button', { name: 'Tự động' }).click();
    // Auto plays the fight; the party either wins the node or the run ends — either way the battle screen goes away.
    await expect(page.locator('.adventure-ui__battle')).toBeHidden({ timeout: 90_000 });
    await app.close();

    const saved = read(dir);
    expect(saved.world.unlockedAreas).toContain('sobi_adventure');
    const a = saved.areas.sobi_adventure;
    expect(a.starterClaimed).toBe(true);
    expect(Object.keys(a.fighters)).toHaveLength(1);
    expect(a.battlesWon + a.runsLost).toBeGreaterThanOrEqual(1);
    expect(saved.areas.sobi_farm.pigs.some((p: { breed: string; purpose?: string }) => p.breed === 'PIG_KNIGHT' && p.purpose === 'ADVENTURE')).toBe(true);
    expect(saved.inventory.items.item_equip_wood_sword).toBe(1);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});

test('technologies: the Menu has them, the field kitchen lets the party carry a ration into a run', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-tech-'));
  try {
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await app.close();
    const seeded = read(dir);
    seeded.progression.areas.sobi_farm = { xp: 100_000 };
    seeded.wallet.coins = 20_000;
    seeded.settings.tutorialDone = true;
    seeded.inventory.items = { ...seeded.inventory.items, item_mountain_ore: 10, item_forest_herb: 20, item_ration_hearty: 2 };
    writeFileSync(file(dir), JSON.stringify(seeded));

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.app.is-plaza')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(3000);
    await clickPlaza(page, 358, 300);
    await expect(page.locator('.app.is-adventure')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Nhận heo phiêu lưu đầu tiên' }).click();
    await expect(page.locator('.adventure-ui__prep')).toHaveCount(0); // no field kitchen yet: a hint instead
    await page.getByRole('button', { name: 'Menu' }).first().click();
    await page.getByRole('button', { name: 'Công nghệ' }).click();
    const kitchen = page.locator('[data-tech="tech_kitchen"]');
    await expect(kitchen).toBeVisible();
    await kitchen.getByRole('button', { name: /Nâng cấp/ }).click();
    await expect(kitchen).toContainText('Cấp 1/3');
    await page.keyboard.press('Escape');
    await expect(page.locator('.adventure-ui__prep')).toBeVisible({ timeout: 10_000 });
    await page.locator('.adventure-ui__prep-list button').first().click();
    await page.locator('.adventure-ui__fighter-pick').first().click();
    await page.getByRole('button', { name: /Xuất phát/ }).click();
    await expect(page.getByRole('button', { name: 'Tiến lên' })).toBeVisible({ timeout: 10_000 });
    await app.close();

    const saved = read(dir);
    expect(saved.progression.stats['tech.tech_kitchen']).toBe(1);
    expect(saved.transactions.some((t: { type: string; amount: number }) => t.type === 'TECH_UPGRADE' && t.amount === -1000)).toBe(true);
    expect(saved.inventory.items.item_ration_hearty).toBe(1);
    expect(saved.areas.sobi_adventure.run.prep).toEqual(['item_ration_hearty']);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
