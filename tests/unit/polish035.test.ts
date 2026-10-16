// Decision 035 polish: sign names fit the sign face; the away summary groups its lines by place.
import { describe, expect, it } from 'vitest';
import { fitSignPx } from '../../src/ui/world/signText';

// A name of `n` letters is about 0.55 em per letter.
const width = (n: number) => (px: number) => n * px * 0.55;
const face = { width: 140, height: 46 };
const look = { minPx: 16, maxPx: 26 };

describe('fitting a name on a sign', () => {
  it('a short name takes the ceiling (or the face height share), never more', () => {
    expect(fitSignPx(width(4), face, look)).toBe(26);
    expect(fitSignPx(width(4), { width: 140, height: 30 }, look)).toBe(18);
  });

  it('a longer name shrinks until it fits the width', () => {
    const px = fitSignPx(width(14), face, look);
    expect(px).toBeLessThan(26);
    expect(width(14)(px)).toBeLessThanOrEqual(face.width);
    expect(width(14)(px + 1)).toBeGreaterThan(face.width);
  });

  it('never goes under the floor (the drawing squeezes what is still too wide)', () => {
    expect(fitSignPx(width(60), face, look)).toBe(16);
  });
});

describe('the away summary cards (decision 035)', () => {
  it('groups lines by place, the urgent places and lines first', async () => {
    const { groupAwayLines } = await import('../../src/areas/farm/ui/components/awayDialog');
    const g = groupAwayLines([
      { text: 'a', tone: 'info', action: { label: 'x', goto: { target: 'garden' } } },
      { text: 'b', tone: 'alert', action: { label: 'y', goto: { target: 'pig', pigId: 'p' } } },
      { text: 'c', tone: 'info' },
      { text: 'd', tone: 'warn', action: { label: 'z', goto: { target: 'garden' } } },
    ] as never);
    expect(g.map((x) => x.place)).toEqual(['farm', 'garden']);
    expect(g[0]!.lines.map((l) => l.text)).toEqual(['b', 'c']);
    expect(g[1]!.lines.map((l) => l.text)).toEqual(['d', 'a']);
    expect(g[1]!.tone).toBe('warn');
  });
});
