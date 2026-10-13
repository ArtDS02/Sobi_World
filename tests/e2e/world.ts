// Plaza helpers for the e2e tests (decision 025: nobody walks; a click on a door goes in): the game opens in the plaza.
import { expect, type Page } from '@playwright/test';

/** Opens a screen from the plaza's Menu popup. */
export async function openFromMenu(page: Page, name: string) {
  await page.locator('.plazabar__btn', { hasText: 'Menu' }).click();
  await page.locator('.menu-screen__item', { hasText: name }).click();
}

/** A point of the plaza (design px of its 1932 × 900 frame, which the canvas letterboxes) on the page. */
async function plazaPoint(page: Page, x: number, y: number) {
  const box = (await page.locator('.app__stage canvas').boundingBox())!;
  const zoom = Math.min(box.width / 1932, box.height / 900);
  return { x: box.x + box.width / 2 + (x - 966) * zoom, y: box.y + box.height / 2 + (y - 450) * zoom };
}

/** Clicks where a plaza object stands. */
export async function clickPlaza(page: Page, x: number, y: number) {
  const p = await plazaPoint(page, x, y);
  await page.mouse.click(p.x, p.y);
}

/** Moves the pointer over a plaza object. */
export async function hoverPlaza(page: Page, x: number, y: number) {
  const p = await plazaPoint(page, x, y);
  await page.mouse.move(p.x, p.y);
}

/** From the plaza: into the farm by the dock. Resolves once the farm HUD is up. */
export async function enterFarm(page: Page) {
  await expect(page.locator('.plazabar__dock')).toBeVisible({ timeout: 30_000 });
  await page.locator('.plazabar__area--farm').click();
  await expect(page.locator('.app:not(.is-plaza)')).toBeVisible();
  await page.waitForTimeout(500);
}
