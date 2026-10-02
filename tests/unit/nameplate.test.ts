// U05: pig name plates never overlap while there is room to shift.
import { describe, expect, it } from 'vitest';
import { layoutNameplates, type PlateRequest } from '../../src/game/view/nameplateLayout';

const plate = (id: string, x: number, y: number): PlateRequest => ({ id, x, y, w: 80, h: 20 });

describe('layoutNameplates (U05)', () => {
  it('a lone plate stays where it asked to be', () => {
    expect(layoutNameplates([plate('a', 100, 500)], 2, 3).get('a')).toEqual({ x: 100, y: 500 });
  });

  it('plates side by side without overlap do not move', () => {
    const out = layoutNameplates([plate('a', 100, 500), plate('b', 200, 500)], 2, 3);
    expect(out.get('b')).toEqual({ x: 200, y: 500 });
  });

  it('a crowd of pigs in one spot stacks the plates into rows', () => {
    const crowd = ['a', 'b', 'c'].map((id, i) => plate(id, 100 + i * 10, 500));
    const out = layoutNameplates(crowd, 2, 3);
    const ys = crowd.map((p) => out.get(p.id)!.y).sort((x, y) => x - y);
    expect(ys).toEqual([500, 522, 544]);
  });

  it('30 pigs on a farm: no two plates overlap when spread over the walk area', () => {
    const pigs = Array.from({ length: 30 }, (_, i) =>
      plate(`p${i}`, 130 + ((i * 0.618034) % 1) * 1340, 560 + (i % 6) * 50),
    );
    const out = layoutNameplates(pigs, 2, 3);
    const rects = pigs.map((p) => ({ ...p, y: out.get(p.id)!.y }));
    for (const a of rects)
      for (const b of rects) {
        if (a === b) continue;
        const hit = Math.abs(a.x - b.x) * 2 < a.w + b.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(hit, `${a.id} vs ${b.id}`).toBe(false);
      }
  });
});
