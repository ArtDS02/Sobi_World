// GĐ13 on the production build: text size, easy colors and language are chosen in Settings, written to settings.json
// (not the save) and obeyed after a restart; the world save is untouched by the language change.
import { _electron as electron, expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openFromMenu } from './world';

const root = process.cwd();
const launch = (userData: string) => {
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  return electron.launch({ args: [root], cwd: root, env: { ...env, UNIN_USER_DATA: userData } as Record<string, string> });
};

test('display settings: large text, easy colors and English survive a restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-display-'));
  try {
    let app = await launch(dir);
    let page = await app.firstWindow();
    await expect(page.locator('.plazabar')).toBeVisible({ timeout: 30_000 });
    await openFromMenu(page, 'Cài đặt');
    const group = (key: string) => page.locator(`[data-setting="${key}"]`);
    await group('textSize').getByRole('radio', { name: 'Rất lớn' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xlarge');
    await group('colorMode').getByRole('radio', { name: /Dễ nhìn/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'easy');
    await group('screenShake').getByRole('switch').click();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('20px');

    // The language reloads the screen; the save is flushed first.
    await group('language').getByRole('radio', { name: 'English' }).click();
    await expect(page.locator('.plazabar__btn', { hasText: 'Items' })).toBeVisible({ timeout: 30_000 });
    await app.close();

    const settings = JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'));
    expect(settings).toMatchObject({ language: 'en', textSize: 'xlarge', colorMode: 'easy', screenShake: false });
    const save = JSON.parse(readFileSync(join(dir, 'saves', 'save.json'), 'utf8'));
    expect(save.settings.language).toBeUndefined(); // a device choice, never part of the world save

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.plazabar__btn', { hasText: 'Items' })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xlarge');
    await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'easy');
    await openFromMenu(page, 'Settings');
    await expect(page.locator('[data-section="access"]')).toContainText('Accessibility');
    await app.close();
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
