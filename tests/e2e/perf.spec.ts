// GĐ13 performance on the production build in Electron: frames per second in the plaza and in the farm, measured with
// requestAnimationFrame over a few seconds. The floor is low on purpose (a machine without a GPU still plays); the
// numbers are printed so a drop shows in the log.
import { _electron as electron, expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enterFarm } from './world';

const root = process.cwd();
const FPS_FLOOR = 24;

const fps = (page: import('@playwright/test').Page, ms: number): Promise<number> =>
  page.evaluate(
    (span) =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        const tick = () => {
          frames += 1;
          if (performance.now() - start >= span) resolve((frames * 1000) / (performance.now() - start));
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );

test('frame rate: the plaza and the farm hold at least ' + FPS_FLOOR + ' fps', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'unin-e2e-perf-'));
  try {
    const env = { ...process.env };
    delete env.UNIN_DEV_URL;
    const app = await electron.launch({ args: [root], cwd: root, env: { ...env, UNIN_USER_DATA: dir } as Record<string, string> });
    const page = await app.firstWindow();
    await expect(page.locator('.app.is-plaza')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2000);
    const plaza = await fps(page, 4000);
    await enterFarm(page);
    await page.waitForTimeout(1500);
    const farm = await fps(page, 4000);
    console.log(`fps: plaza ${plaza.toFixed(1)}, farm ${farm.toFixed(1)}`);
    expect(plaza).toBeGreaterThanOrEqual(FPS_FLOOR);
    expect(farm).toBeGreaterThanOrEqual(FPS_FLOOR);
    await app.close();
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
});
