// A5 integration (production build, temp user data): a v4 save with outfits migrates on launch
// (refund + body outfit → species) and is written back as v5; a farm holding the new species
// renders them, lists them in the collection and keeps them across a restart.
import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();

async function launch(userData: string): Promise<ElectronApplication> {
  const env = { ...process.env };
  delete env.UNIN_DEV_URL;
  return electron.launch({
    args: [root],
    cwd: root,
    env: { ...env, UNIN_USER_DATA: userData } as Record<string, string>,
  });
}

const savePath = (dir: string) => join(dir, 'saves', 'save.json');
const readSave = (dir: string) => JSON.parse(readFileSync(savePath(dir), 'utf8'));

function seed(dir: string, save: unknown) {
  mkdirSync(join(dir, 'saves'), { recursive: true });
  writeFileSync(savePath(dir), JSON.stringify(save));
}

const now = Date.now();
const pig = (id: string, slotIndex: number, breed: string, extra: object = {}) => ({
  id,
  slotIndex,
  breed,
  name: id,
  gender: slotIndex % 2 ? 'MALE' : 'FEMALE',
  growthProgress: 100,
  hunger: 100,
  cleanliness: 100,
  isSick: false,
  pregnancy: null,
  lastTickedAt: now,
  createdAt: now - 1000,
  ...extra,
});
const base = (schemaVersion: number, unlockedSlots: number) => ({
  schemaVersion,
  createdAt: now - 60_000,
  updatedAt: now,
  trough: { food: 20, capacity: 20, lastResolvedAt: now },
  inventory: { FOOD_BASIC: 5, MEDICINE_COMMON: 1 },
  orders: [],
  transactions: [],
  breedingRecords: [],
  gifts: { nextAt: null, boxes: [] },
  settings: {
    musicOn: false,
    sfxOn: false,
    reduceMotion: true,
    tutorialDone: true,
    lastExportAt: now,
  },
  player: { gold: 1000, xp: 0, unlockedSlots },
});

async function withTemp(run: (dir: string) => Promise<void>) {
  const dir = mkdtempSync(join(tmpdir(), 'unin-a5-'));
  try {
    await run(dir);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
}

test('v4 save with outfits: refunded, robot body becomes a species, written back as v5', async () => {
  await withTemp(async (dir) => {
    const v4 = base(4, 4);
    seed(dir, {
      ...v4,
      player: {
        ...v4.player,
        ownedSkins: ['pig_classic', 'pig_robot', 'pig_farmer', 'pig_pirate'],
      },
      pigs: [
        pig('robo', 0, 'PIG_EARTH_PINK', { skinId: 'pig_robot', cosmetics: {} }),
        pig('farm', 1, 'PIG_EARTH_PINK', { skinId: 'pig_farmer', cosmetics: {} }),
      ],
      collection: { discoveredBreeds: ['PIG_EARTH_PINK'], discoveredSkins: ['pig_classic'] },
    });
    const app = await launch(dir);
    const page = await app.firstWindow();
    await expect(page.locator('.topbar__nav')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.topbar')).toContainText('9.000'); // 1000 + 2000 + 6000 refunded
    await page.locator('.topbar__nav').getByRole('button', { name: 'Cửa hàng' }).click();
    await expect(page.locator('.shop__tab')).toHaveText(['Heo giống', 'Vật phẩm', 'Chuồng']);
    await page.keyboard.press('Escape');
    await app.close();
    const s = readSave(dir);
    expect(s.schemaVersion).toBe(5);
    expect(s.pigs.map((p: { breed: string }) => p.breed)).toEqual(['PIG_ROBOT', 'PIG_EARTH_PINK']);
    expect(s.player.gold).toBe(9000);
    expect(JSON.stringify(s)).not.toMatch(/skinId|ownedSkins|cosmetics|discoveredSkins/);
  });
});

test('new species render on the farm, fill the collection and survive a restart', async () => {
  await withTemp(async (dir) => {
    const breeds = [
      'PIG_SHEEP',
      'PIG_AXOLOTL',
      'PIG_PHOENIX',
      'PIG_BUFFALO',
      'PIG_DEER',
      'PIG_PUMPKIN',
      'PIG_SUNFLOWER',
      'PIG_HEDGEHOG',
      'PIG_TURTLE',
      'PIG_ROBOT',
      'PIG_UNICORN',
    ];
    seed(dir, {
      ...base(5, 12),
      pigs: breeds.map((b, i) => pig(`p${i}`, i, b)),
      collection: { discoveredBreeds: breeds },
    });
    let app = await launch(dir);
    let page = await app.firstWindow();
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await expect(page.locator('.topbar__nav')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2500); // preload + scene fade-in
    await page.screenshot({ path: 'test-results/a5-farm-species.png' });
    await page.locator('.topbar__nav').getByRole('button', { name: 'Bộ sưu tập' }).click();
    for (const name of ['Heo Trâu', 'Heo Nhím', 'Heo Rùa', 'Heo Kỳ Lân', 'Heo Phượng Hoàng'])
      await expect(page.locator('.collection')).toContainText(name);
    await page.screenshot({ path: 'test-results/a5-collection.png' });
    await app.close();
    expect(errors).toEqual([]);

    app = await launch(dir);
    page = await app.firstWindow();
    await expect(page.locator('.topbar__nav')).toBeVisible({ timeout: 30_000 });
    await app.close();
    expect(readSave(dir).pigs.map((p: { breed: string }) => p.breed)).toEqual(breeds);
  });
});
