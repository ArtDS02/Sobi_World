// First run of Sobi World: Sobi Farm's saves are copied to the new folder, never moved or overwritten.
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { adoptLegacySaves, DATA_DIR_NAME, LEGACY_DATA_DIR_NAME } from '../../electron/dataDir';

let appData: string;
const oldDir = () => join(appData, LEGACY_DATA_DIR_NAME.installed);
const newDir = () => join(appData, DATA_DIR_NAME.installed);

beforeEach(async () => {
  appData = await mkdtemp(join(tmpdir(), 'sobi-appdata-'));
});
afterEach(() => rm(appData, { recursive: true, force: true }));

async function oldFarm() {
  await mkdir(join(oldDir(), 'saves', 'backups'), { recursive: true });
  await writeFile(join(oldDir(), 'saves', 'save.json'), '{"schemaVersion":7}');
  await writeFile(join(oldDir(), 'saves', 'backups', 'save-20261001-120000.json'), '{"schemaVersion":6}');
}

describe('adoptLegacySaves', () => {
  it('copies save.json and backups/ and keeps the Sobi Farm folder', async () => {
    await oldFarm();
    expect(await adoptLegacySaves(oldDir(), newDir())).toBe(true);
    expect(await readFile(join(newDir(), 'saves', 'save.json'), 'utf8')).toBe('{"schemaVersion":7}');
    expect(await readdir(join(newDir(), 'saves', 'backups'))).toEqual(['save-20261001-120000.json']);
    expect(await readFile(join(oldDir(), 'saves', 'save.json'), 'utf8')).toBe('{"schemaVersion":7}');
  });

  it('never overwrites a Sobi World save', async () => {
    await oldFarm();
    await mkdir(join(newDir(), 'saves'), { recursive: true });
    await writeFile(join(newDir(), 'saves', 'save.json'), '{"schemaVersion":8}');
    expect(await adoptLegacySaves(oldDir(), newDir())).toBe(false);
    expect(await readFile(join(newDir(), 'saves', 'save.json'), 'utf8')).toBe('{"schemaVersion":8}');
  });

  it('does nothing without a Sobi Farm save', async () => {
    expect(await adoptLegacySaves(oldDir(), newDir())).toBe(false);
    expect(await readdir(appData)).toEqual([]);
  });
});
