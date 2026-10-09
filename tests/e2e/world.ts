// Walking helpers for the e2e tests (GĐ3: only the plaza has a walking character): the game opens in the plaza; the farm is a walk to its door.
import { expect, type Page } from '@playwright/test';

export const hold = async (page: Page, code: string, ms: number) => {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
};

/** Opens a screen from the plaza's Menu popup (the plaza has no dock). */
export async function openFromMenu(page: Page, name: string) {
  await page.locator('.plazabar__btn', { hasText: 'Menu' }).click();
  await page.locator('.menu-screen__item', { hasText: name }).click();
}

/** From the plaza spawn: walk to the pig barn until its key hint is up. */
export async function walkToBarn(page: Page) {
  await expect(page.locator('.plazabar, .topbar__nav').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500); // the plaza scene is up
  const hint = page.locator('.world-prompt', { hasText: 'Vào Sobi Farm' });
  if (await hint.waitFor({ timeout: 3000 }).then(() => true, () => false)) return; // reopened in front of the barn door
  // The barn stands bottom right: down along the square, then right under its fence.
  await hold(page, 'KeyS', 1000);
  await hold(page, 'KeyD', 1500);
  for (let i = 0; i < 6 && !(await hint.count()); i++) {
    await hold(page, 'KeyD', 250);
    await hold(page, 'KeyS', 100);
  }
  await expect(hint).toBeVisible();
}

/** From the plaza spawn: walk right to the pig barn and go in. Resolves once the farm HUD is up. */
export async function enterFarm(page: Page) {
  await walkToBarn(page);
  await page.keyboard.press('KeyE');
  await expect(page.locator('.app:not(.is-plaza)')).toBeVisible();
  await page.waitForTimeout(500);
}
