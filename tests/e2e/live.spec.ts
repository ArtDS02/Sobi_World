// The living world (GĐ12) on the production build: the sky chip and the weather over the plaza, the festival gift and shop through
// the Menu, the visiting merchant, and everything kept in the save. The Admin's test switches (`live.dev`) pin the day.
import { _electron as electron, expect, test } from '@playwright/test';
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

test('the living world: weather over the plaza, the festival gift and shop, the merchant — all saved', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-live-'));
  try {
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await app.close();
    const seeded = read(dir);
    expect(seeded.schemaVersion).toBe(11);
    seeded.live.dev = { weather: 'rainy', festival: 'fest_harvest', merchant: true };
    seeded.settings.tutorialDone = true;
    writeFileSync(file(dir), JSON.stringify(seeded));

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.app.is-plaza')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.sky[data-weather="rainy"]')).toBeAttached();
    await expect(page.locator('.sky__chip--weather')).toContainText('Mưa');
    await expect(page.locator('.sky__chip--merchant')).toBeVisible();

    // The festival chip opens its panel; the gift pays 3 tokens once.
    await page.locator('.sky__chip--festival').click();
    await expect(page.locator('[data-screen="festival"]')).toContainText('Lễ hội thu hoạch');
    await page.getByRole('button', { name: /Nhận quà lễ hội/ }).click();
    await expect(page.locator('[data-screen="festival"]')).toContainText('Vé Lễ Hội: 3');
    await expect(page.getByRole('button', { name: /Hôm nay đã nhận quà/ })).toBeDisabled();
    // Fertiliser costs 3 tokens: the shop spends them and fills the bag.
    await page.locator('[data-entry="fs_fertilizer"]').getByRole('button', { name: 'Đổi' }).click();
    await expect(page.locator('[data-screen="festival"]')).toContainText('Vé Lễ Hội: 0');

    // The weather and the merchant have their chips too (a popup covers them: Esc closes it first).
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-screen="festival"]')).toBeHidden();
    await page.locator('.sky__chip--weather').click();
    await expect(page.locator('[data-screen="weather"]')).toContainText('Ngày mai');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-screen="weather"]')).toBeHidden();
    await page.locator('.sky__chip--merchant').click();
    await expect(page.locator('[data-screen="merchant"]')).toContainText('Đơn đặc biệt hôm nay');
    await expect(page.locator('.live__offer')).toHaveCount(3);
    await app.close();

    const saved = read(dir);
    expect(saved.wallet.eventTokens).toBe(0);
    expect(saved.inventory.items.item_fertilizer).toBeGreaterThanOrEqual(5);
    expect(saved.live.festival.giftDay).not.toBeNull();
    expect(saved.live.merchant.present).toBe(true);
    expect(saved.live.merchant.offers).toHaveLength(3);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
