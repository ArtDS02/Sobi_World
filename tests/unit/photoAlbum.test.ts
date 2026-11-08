// D9: the photo album — file name, picking the stage canvas, reading its PNG; plus the PNG-only atomic file write.
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeBinaryFile } from '../../electron/importExport';
import { photoFileName, pickStage, shootStage, type Shootable } from '../../src/ui/photo';

const canvas = (w: number, h: number, visible = true, bytes: number[] | null = [1, 2, 3]): Shootable => ({
  width: w,
  height: h,
  visible,
  toBlob: (cb) => cb(bytes ? new Blob([new Uint8Array(bytes)]) : null),
});

describe('photo naming and capture', () => {
  it('names a photo by its local time', () => {
    expect(photoFileName(new Date(2026, 10, 9, 7, 5, 3))).toBe('sobi-world-20261109-070503.png');
  });
  it('picks the biggest visible canvas and ignores hidden or empty ones', () => {
    const big = canvas(1600, 900);
    expect(pickStage([canvas(200, 100), big, canvas(4000, 4000, false), canvas(0, 0)])).toBe(big);
    expect(pickStage([])).toBeNull();
    expect(pickStage([canvas(10, 10, false)])).toBeNull();
  });
  it('returns the PNG bytes, or null when there is no stage or the browser gives nothing', async () => {
    expect([...(await shootStage([canvas(10, 10, true, [137, 80, 78, 71])]))!]).toEqual([137, 80, 78, 71]);
    expect(await shootStage([])).toBeNull();
    expect(await shootStage([canvas(10, 10, true, null)])).toBeNull();
  });
});

describe('writeBinaryFile', () => {
  it('writes bytes through a temp file and leaves none behind, even on failure', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sobi-photo-'));
    try {
      const target = join(dir, 'a.png');
      await writeBinaryFile(target, new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4]));
      expect([...(await readFile(target))]).toEqual([137, 80, 78, 71, 1, 2, 3, 4]);
      await expect(writeBinaryFile(join(dir, 'missing', 'b.png'), new Uint8Array([1]))).rejects.toThrow();
      expect((await readdir(dir)).filter((n) => n.endsWith('.tmp'))).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
