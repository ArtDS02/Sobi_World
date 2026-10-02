import { describe, expect, it } from 'vitest';
import { stageFit } from '../../src/game/view/stageFit';

const CROP = { x: 0.12, y: 0.06 };

describe('stageFit (farm layout rework)', () => {
  it('fills a same-aspect stage exactly', () => {
    expect(stageFit(1600, 900, 1600, 900, CROP)).toEqual({
      width: 1600,
      height: 900,
      left: 0,
      top: 0,
    });
  });

  it('covers other aspects within the crop limits, centred across, top-anchored down', () => {
    for (const [w, h] of [
      [1280, 800],
      [844, 390],
      [1920, 1080],
      [1024, 768],
      [2560, 1080],
    ] as const) {
      const b = stageFit(w, h, 1600, 900, CROP);
      expect(w / b.width).toBeGreaterThanOrEqual(1 - CROP.x - 1e-9);
      expect(h / b.height).toBeGreaterThanOrEqual(1 - CROP.y - 1e-9);
      expect(b.width >= w - 1e-9 || b.height >= h - 1e-9).toBe(true);
      expect(b.left).toBeCloseTo((w - b.width) / 2);
      if (b.height > h) expect(b.top).toBe(0);
    }
  });

  it('a landscape phone loses 6% at the bottom and letterboxes the sides', () => {
    const phone = stageFit(844, 390, 1600, 900, CROP);
    expect(390 / phone.height).toBeCloseTo(0.94);
    expect(phone.top).toBe(0);
    expect(phone.width).toBeLessThan(844);
  });
});
