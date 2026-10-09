// The world keeps living while the game is closed (GĐ2): a farm left for three days comes back with its
// pig hungry, the "while you were away" screen on top, and a button that leads to the trough.
import { _electron as electron, expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enterFarm } from './world';

const root = process.cwd();
const DAY = 86_400_000;

const launch = (userData: string) => {
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  return electron.launch({ args: [root], cwd: root, env: { ...env, UNIN_USER_DATA: userData } as Record<string, string> });
};

test('a farm left for 3 days: away screen, hungry pig, button to the trough', async () => {
  const userData = mkdtempSync(join(tmpdir(), 'unin-e2e-away-'));
  const file = join(userData, 'saves', 'save.json');
  try {
    let app = await launch(userData);
    let page = await app.firstWindow();
    await enterFarm(page);
    await page.getByRole('button', { name: 'Bỏ qua' }).click();
    await page.locator('.topbar__nav').getByRole('button', { name: 'Cửa hàng' }).click();
    await page.locator('.shop__actions button').first().click(); // one pig; the trough stays empty
    await page.keyboard.press('Escape');
    await app.close();

    // The player "left" three days ago: every clock of the farm moves back (what the admin's ⏩ does).
    const save = JSON.parse(readFileSync(file, 'utf8'));
    const farm = save.areas.sobi_farm;
    for (const p of farm.pigs) p.lastTickedAt -= 3 * DAY;
    farm.trough.lastResolvedAt -= 3 * DAY;
    writeFileSync(file, JSON.stringify(save));

    app = await launch(userData);
    page = await app.firstWindow();
    const away = page.locator('.c-dialog', { hasText: 'Trong lúc bạn vắng mặt' });
    await expect(away).toBeVisible({ timeout: 30_000 });
    await expect(away).toContainText('Bạn đã đi vắng 3 ngày');
    await expect(away).toContainText('Máng ăn hết lúc');
    await away.getByRole('button', { name: 'Đổ máng' }).click();
    await expect(page.locator('.c-dialog', { hasText: 'Đổ máng ăn' })).toBeVisible();
    await app.close();

    const after = JSON.parse(readFileSync(file, 'utf8')).areas.sobi_farm;
    expect(after.pigs).toHaveLength(1);
    expect(after.pigs[0].hunger).toBeLessThan(5); // three days without food
    expect(after.pigs[0].energy).toBeDefined();
  } finally {
    try {
      rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
