// Battle effect strips: a sheet with more frames at a higher fps keeps the length of the old 4 frames at 12 fps.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STRIP_FRAME_MS_AT_12_FPS, stripFrameMs } from '../../src/areas/adventure/scene/battle/stripTiming';

describe('strip frame time', () => {
  it('12 fps sheets (or no fps) play 85 ms a frame, as before', () => {
    expect(stripFrameMs(12)).toBe(STRIP_FRAME_MS_AT_12_FPS);
    expect(stripFrameMs(undefined)).toBe(STRIP_FRAME_MS_AT_12_FPS);
    expect(stripFrameMs(0)).toBe(STRIP_FRAME_MS_AT_12_FPS);
  });

  it('8 frames at 24 fps last as long as 4 frames at 12 fps', () => {
    expect(8 * stripFrameMs(24)).toBeCloseTo(4 * stripFrameMs(12), 9);
  });

  it('every battle sheet in the manifest keeps its old length (4 frames at 12 fps, or the same time with more frames)', () => {
    const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as {
      fx: { id: string; asset: string; frames?: { count: number; fps: number } }[];
    };
    for (const row of manifest.fx.filter((r) => r.frames && r.asset.startsWith('fx/battle/') && r.frames.count <= 8)) {
      const ms = row.frames!.count * stripFrameMs(row.frames!.fps);
      expect([4 * STRIP_FRAME_MS_AT_12_FPS, row.frames!.count * STRIP_FRAME_MS_AT_12_FPS]).toContain(Math.round(ms * 1000) / 1000);
    }
  });
});
