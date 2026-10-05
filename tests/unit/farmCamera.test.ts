import { describe, expect, it } from 'vitest';
import { backdropRect, farmCamera } from '../../src/areas/farm/scene/view/farmCamera';

describe('farmCamera (responsive layout)', () => {
  it('shows the whole design frame on any screen, centred', () => {
    for (const [w, h] of [
      [1600, 900],
      [1920, 955],
      [844, 390],
      [1024, 768],
      [1280, 800],
      [2560, 1080],
      [390, 844],
    ] as const) {
      const { zoom, view } = farmCamera(w, h, 1600, 900);
      expect(view.x).toBeLessThanOrEqual(1e-9);
      expect(view.y).toBeLessThanOrEqual(1e-9);
      expect(view.x + view.width).toBeGreaterThanOrEqual(1600 - 1e-9);
      expect(view.y + view.height).toBeGreaterThanOrEqual(900 - 1e-9);
      // One axis fits exactly: no wasted zoom.
      expect(Math.min(Math.abs(view.width - 1600), Math.abs(view.height - 900))).toBeLessThan(1e-6);
      expect(view.width * zoom).toBeCloseTo(w);
    }
  });

  it('the backdrop covers the view, capped per axis', () => {
    const { view } = farmCamera(1920, 955, 1600, 900);
    const r = backdropRect(view, 1600, 900, 2);
    expect(r.x).toBeLessThanOrEqual(view.x);
    expect(r.x + r.width).toBeGreaterThanOrEqual(view.x + view.width);
    expect(r.y).toBeLessThanOrEqual(view.y);
    const tall = backdropRect(farmCamera(390, 844, 1600, 900).view, 1600, 900, 2);
    expect(tall.height).toBeLessThanOrEqual(1802);
  });
});
