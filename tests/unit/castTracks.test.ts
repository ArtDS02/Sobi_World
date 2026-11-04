import { describe, expect, it } from 'vitest';
import { CAST_BY_BODY, CAST_TRACKS, sampleTrack, trackFor } from '../../src/areas/adventure/ui/castTracks';
import { BATTLE_FX } from '../../src/areas/adventure/logic/config/content';

const turns = (rot: number) => ((rot % 360) + 360) % 360;

describe('cast tracks (ANIM-005)', () => {
  it.each(Object.entries(CAST_TRACKS))('%s starts and ends at rest', (_name, keys) => {
    for (const k of [0, 1]) {
      const p = sampleTrack(keys, k);
      expect(p.dx).toBeCloseTo(0);
      expect(p.dy).toBeCloseTo(0);
      expect(turns(p.rot)).toBeCloseTo(0);
      expect(p.sx).toBeCloseTo(1);
      expect(p.sy).toBeCloseTo(1);
    }
    expect(keys.every((key, i) => i === 0 || key.t >= keys[i - 1]!.t)).toBe(true);
  });

  it('every written track in battle_fx.json ends at rest', () => {
    const acts = [...Object.values(BATTLE_FX.skills).flatMap((s) => s?.script ?? []), ...Object.values(BATTLE_FX.actions).flat()];
    for (const a of acts) if (a.do === 'track') expect(turns(sampleTrack(a.keys, 1).rot)).toBeCloseTo(0);
  });

  it('each body plan has its own cast, and a wider body moves more, mirrored for the other side', () => {
    expect(new Set(Object.values(CAST_BY_BODY)).size).toBe(Object.keys(CAST_BY_BODY).length);
    const keys = CAST_TRACKS.cast_charge;
    const ally = trackFor(keys, 0.4, 160, 1);
    const foe = trackFor(keys, 0.4, 160, -1);
    expect(ally.dx).toBeCloseTo(-foe.dx);
    expect(Math.abs(trackFor(keys, 0.4, 320, 1).dx)).toBeCloseTo(Math.abs(ally.dx) * 2);
  });
});
