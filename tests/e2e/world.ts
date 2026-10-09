// Walking helpers for the e2e tests (GĐ3: only the plaza has a walking character): the game opens in the plaza; the farm is a walk to its door.
import { expect, type Page } from '@playwright/test';

export const hold = async (page: Page, code: string, ms: number) => {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
};

/** From the plaza spawn: walk right to the pig barn and go in. Resolves once the farm HUD is up. */
export async function enterFarm(page: Page) {
  await expect(page.locator('.topbar__nav')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500); // the plaza scene is up
  const hint = page.locator('.world-prompt', { hasText: 'Vào Sobi Farm' });
  for (let i = 0; i < 6 && !(await hint.count()); i++) {
    await hold(page, 'KeyD', i === 0 ? 1900 : 250);
    await hold(page, 'KeyW', i === 0 ? 100 : 150);
  }
  await expect(hint).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect(page.locator('.app:not(.is-plaza)')).toBeVisible();
  await page.waitForTimeout(500);
}
