// Sobi Adventure (decision 037) on the production build: the door opens, the knight's starter pig comes to the farm, the party sets
// off into the forest's first area, walks with the keys (the position is saved), goes back to the camp and takes the summary.
import { _electron as electron, expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clickPlaza } from './world';

const root = process.cwd();
const launch = (userData: string) => {
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  return electron.launch({ args: [root], cwd: root, env: { ...env, UNIN_USER_DATA: userData } as Record<string, string> });
};
const file = (dir: string) => join(dir, 'saves', 'save.json');
const read = (dir: string) => JSON.parse(readFileSync(file(dir), 'utf8'));

test('the adventure: it opens, the knight gives a pig, the party walks the forest and comes home', async () => {
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
    await expect(page.locator('.plazabar__dock')).toBeVisible({ timeout: 30_000 }); // the plaza scene is up
    await clickPlaza(page, 300, 380);
    await expect(page.locator('.app.is-adventure')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Nhận heo phiêu lưu đầu tiên' }).click();
    const card = page.locator('.adventure-ui__fighter').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.locator('.adventure-ui__fighter-pick').click();
    await page.getByRole('button', { name: /Lên đường/ }).click();
    await expect(page.locator('.adventure-explore')).toBeVisible({ timeout: 10_000 });
    const spawnY = (5 + 0.5) * 40; // the spawn tile (2, 5) of map_forest_edge
    await page.locator('canvas').first().click({ position: { x: 5, y: 5 } }).catch(() => {});
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(700);
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(1500); // the walker rests, the scene saves where it stands
    await app.close();
    const walked = read(dir).areas.sobi_adventure.run;
    expect(walked.mapId).toBe('map_forest_edge');
    expect(walked.y).toBeGreaterThan(spawnY);

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.app.is-plaza, .app.is-adventure')).toBeVisible({ timeout: 30_000 });
    if (await page.locator('.app.is-plaza').isVisible()) {
      await expect(page.locator('.plazabar__dock')).toBeVisible({ timeout: 30_000 });
      await clickPlaza(page, 300, 380);
    }
    await expect(page.locator('.adventure-explore')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Về Trại' }).click();
    await expect(page.locator('.adventure-ui__done')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Nhận thưởng' }).click();
    await expect(page.locator('.adventure-ui__hub')).toBeVisible({ timeout: 10_000 });
    await app.close();

    const saved = read(dir);
    expect(saved.world.unlockedAreas).toContain('sobi_adventure');
    const a = saved.areas.sobi_adventure;
    expect(a.starterClaimed).toBe(true);
    expect(Object.keys(a.fighters)).toHaveLength(1);
    expect(a.run).toBeNull();
    expect(Object.values(a.fighters as Record<string, { energy: number }>)[0]!.energy).toBeLessThan(100);
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
    await expect(page.locator('.plazabar__dock')).toBeVisible({ timeout: 30_000 }); // the plaza scene is up
    await clickPlaza(page, 300, 380);
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
    await page.getByRole('button', { name: /Lên đường/ }).click();
    await expect(page.locator('.adventure-explore')).toBeVisible({ timeout: 10_000 });
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
