import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { backupBeforeWrite, KEEP, listContentBackups, readContentBackup } from '../../scripts/admin/contentBackup';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'sobi-cbackup-'));
});
afterEach(() => rm(root, { recursive: true, force: true }));

describe('content backups (plan step 7.2)', () => {
  it('keeps the old text, newest first, and reads it back', () => {
    const t = new Date(2026, 10, 8, 12, 0, 0).getTime();
    backupBeforeWrite('shared/items.json', '{"v":1}', t, root);
    backupBeforeWrite('shared/items.json', '{"v":2}', t + 5000, root);
    const list = listContentBackups('shared/items.json', root);
    expect(list).toHaveLength(2);
    expect(readContentBackup('shared/items.json', list[0]!.name, root)).toBe('{"v":2}');
    expect(readContentBackup('shared/items.json', list[1]!.name, root)).toBe('{"v":1}');
    expect(listContentBackups('other.json', root)).toEqual([]);
  });

  it('does not copy identical content twice; two saves in one millisecond both survive', () => {
    const t = Date.now();
    expect(backupBeforeWrite('a.json', 'same', t, root)).not.toBeNull();
    expect(backupBeforeWrite('a.json', 'same', t + 1, root)).toBeNull();
    backupBeforeWrite('a.json', 'x', t + 2, root);
    backupBeforeWrite('a.json', 'y', t + 2, root);
    expect(listContentBackups('a.json', root)).toHaveLength(3);
  });

  it(`keeps only the last ${KEEP}`, () => {
    const t = Date.now();
    for (let i = 0; i < KEEP + 5; i++) backupBeforeWrite('a.json', `v${i}`, t + i * 10, root);
    const list = listContentBackups('a.json', root);
    expect(list).toHaveLength(KEEP);
    expect(readContentBackup('a.json', list[0]!.name, root)).toBe(`v${KEEP + 4}`);
  });

  it('a failed write is an error, never silent; bad names are refused', async () => {
    await writeFile(join(root, 'blocked'), 'a file where the folder should be');
    expect(() => backupBeforeWrite('x.json', 't', 1, join(root, 'blocked'))).toThrow();
    expect(() => readContentBackup('a.json', '../../etc/passwd', root)).toThrow('invalid backup name');
    expect(await readdir(root)).toEqual(['blocked']);
  });
});
