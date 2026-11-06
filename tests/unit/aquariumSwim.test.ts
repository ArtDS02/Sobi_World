// How a fish of the Aquarium swims (fishSwim.ts): the velocity eases towards the wish and slows near the spot, and the
// next leg stays in the water, mostly level, near the top for a hungry fish and near the bottom for a sick one.
import { describe, expect, it } from 'vitest';
import { bodyWave, fleeFrom, nextLeg, scatterFrom, steer, type Swimmer } from '../../src/areas/aquarium/scene/fishSwim';
import { bendAt, kindFrame, pulseAt, SPECIES_SWIM, SWIM_FRAME_FADE, SWIM_STYLES, swimFrameAt, swimStyleOf } from '../../src/areas/aquarium/scene/swimStyles';
import { existsSync, readFileSync } from 'node:fs';
import { FISH_LIST } from '../../src/areas/aquarium/logic/config/content';
import { AQUARIUM_VIEW } from '../../src/areas/aquarium/scene/aquariumView';
import { mulberry32 } from '../../src/core/rng';

const box = { left: 300, right: 1300, top: 300, bottom: 600 };

describe('fish swimming', () => {
  it('speeds up gradually, never past the top speed, and stops at the spot', () => {
    let m = { x: 0, y: 0, vx: 0, vy: 0 };
    m = steer(m, 1000, 0, 70, 0.016);
    expect(m.vx).toBeGreaterThan(0);
    expect(m.vx).toBeLessThan(70 * 0.1);
    for (let i = 0; i < 2000; i += 1) {
      m = steer(m, 1000, 0, 70, 0.016);
      expect(Math.hypot(m.vx, m.vy)).toBeLessThanOrEqual(70 + 1e-9);
    }
    expect(m.x).toBeCloseTo(1000, 0);
    expect(Math.abs(m.vx)).toBeLessThan(1);
  });

  it('curves instead of turning on the spot: the old velocity fades over several frames', () => {
    const m = steer({ x: 0, y: 0, vx: 70, vy: 0 }, -500, 0, 70, 0.016);
    expect(m.vx).toBeGreaterThan(0);
  });

  it('the next leg stays in the water and climbs at most a little', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i += 1) {
      const at = { y: 450 };
      const leg = nextLeg(rng, at, box, 'calm');
      expect(leg.x).toBeGreaterThanOrEqual(box.left);
      expect(leg.x).toBeLessThanOrEqual(box.right);
      expect(Math.abs(leg.y - at.y)).toBeLessThanOrEqual(AQUARIUM_VIEW.swim.climb);
    }
  });

  it('a hungry fish keeps to the top third, a sick one to the bottom half', () => {
    const rng = mulberry32(3);
    const h = box.bottom - box.top - 60;
    for (let i = 0; i < 100; i += 1) {
      expect(nextLeg(rng, { y: 500 }, box, 'hungry').y).toBeLessThanOrEqual(box.top + 30 + h / 3);
      expect(nextLeg(rng, { y: 320 }, box, 'sick').y).toBeGreaterThanOrEqual(box.top + 30 + h / 2);
    }
  });

  it('the body bends most at the tail, little at the nose, and not at all without effort', () => {
    const peak = (u: number) => Math.max(...Array.from({ length: 64 }, (_, i) => Math.abs(bodyWave(u, (i / 64) * Math.PI * 2, 10))));
    expect(peak(0)).toBeCloseTo(10, 0);
    expect(peak(0.5)).toBeLessThan(peak(0.2));
    expect(peak(0.7)).toBeLessThan(0.5);
    expect(peak(1)).toBeLessThanOrEqual(1.2);
    expect(bodyWave(0, 1, 0)).toBe(0);
  });
});

describe('each creature moves its own way (decision 035)', () => {
  it('every species has a swim style, and the sea creatures are not plain fish', () => {
    for (const f of FISH_LIST) expect(SWIM_STYLES[SPECIES_SWIM[f.id] ?? 'fish'], f.id).toBeDefined();
    expect(swimStyleOf('fish_jellyfish').kind).toBe('jelly');
    expect(swimStyleOf('fish_octopus').kind).toBe('octopus');
    expect(swimStyleOf('fish_sea_turtle').kind).toBe('turtle');
    expect(swimStyleOf('fish_manta').kind).toBe('ray');
    expect(swimStyleOf('fish_seahorse').kind).toBe('seahorse');
    expect(swimStyleOf('fish_dolphin').kind).toBe('dolphin');
    expect(swimStyleOf('fish_loach').bend).toBe('body');
    expect(swimStyleOf('fish_unknown')).toBe(SWIM_STYLES.fish);
  });

  it('bends where the body bends: a stiff body never, an eel along its whole length, tentacles only at the back', () => {
    for (const u of [0, 0.3, 0.6, 1]) expect(bendAt('none', u, 1.2, 10)).toBe(0);
    expect(Math.abs(bendAt('body', 0.9, 0.3, 10))).toBeGreaterThan(1);
    expect(bendAt('tentacles', 0.8, 1, 10)).toBe(0);
    expect(Math.abs(bendAt('tentacles', 0.1, 1, 10))).toBeGreaterThan(0);
  });

  it('a jellyfish rises while it pulses and sinks between pulses; a pufferfish puffs up near the end of its pulse', () => {
    expect(kindFrame('jelly', 0.15, 0, 0).drift).toBeLessThan(0);
    expect(kindFrame('jelly', 0.7, 0, 0).drift).toBeGreaterThan(0);
    expect(kindFrame('jelly', 0.15, 0, 0).sx).toBeLessThan(1);
    expect(kindFrame('puffer', 0.9, 0, 0).sx).toBeGreaterThan(1.2);
    expect(kindFrame('puffer', 0.4, 0, 0).sx).toBe(1);
    expect(kindFrame('octopus', 0.4, 0, 0).speed).toBeGreaterThan(kindFrame('octopus', 0.8, 0, 0).speed);
    expect(pulseAt(1500, 1000, 0)).toBeCloseTo(0.5);
  });
});

describe('a click on empty water teases the fish', () => {
  const box = { left: 0, right: 1000, top: 0, bottom: 600 };
  const fake = (x: number, y: number) => {
    const s = { m: { x, y, vx: 0, vy: 0 }, tx: x, ty: y, restUntil: 5000, boostUntil: 0, hurry(time: number, _f: number, ms: number) { s.boostUntil = time + ms; } };
    return s;
  };

  it('a fish flees straight away from the poke and stays in the water', () => {
    expect(fleeFrom({ x: 600, y: 300 }, { x: 500, y: 300 }, box, 200)).toEqual({ x: 800, y: 300 });
    expect(fleeFrom({ x: 400, y: 300 }, { x: 500, y: 300 }, box, 200)).toEqual({ x: 200, y: 300 });
    // Against the glass it stops at the edge.
    expect(fleeFrom({ x: 950, y: 300 }, { x: 900, y: 300 }, box, 200).x).toBe(970);
    // Poked on its nose it still bolts somewhere.
    expect(fleeFrom({ x: 300, y: 300 }, { x: 300, y: 300 }, box, 200).x).toBe(100);
  });

  it('only the fish within reach dart off, quicker and without resting first', () => {
    const t = AQUARIUM_VIEW.moments.tease;
    const near = fake(500 + t.radius / 2, 300);
    const far = fake(500 + t.radius * 2, 300);
    expect(scatterFrom([near, far] as unknown as Swimmer[], { x: 500, y: 300 }, box, 1000)).toBe(1);
    expect(near.tx).toBeGreaterThan(near.m.x);
    expect(near.restUntil).toBe(0);
    expect(near.boostUntil).toBe(1000 + t.ms);
    expect(far.tx).toBe(far.m.x);
    expect(far.restUntil).toBe(5000);
  });
});

describe('drawn swim frames (decision 050 (5))', () => {
  const TAU = Math.PI * 2;
  it('one tail beat walks the loop 1 → 2 → 3 → 2, each frame holding before the next dissolves in', () => {
    const shown = (t: number) => swimFrameAt(t * TAU);
    expect([0.05, 0.3, 0.55, 0.8].map((t) => shown(t).from)).toEqual([0, 1, 2, 1]);
    for (const t of [0.05, 0.3, 0.55, 0.8]) expect(shown(t).w).toBe(0);
    // Late in a quarter the next frame comes in, eased and growing, and lands fully at the boundary.
    expect(shown(0.24).to).toBe(1);
    expect(shown(0.24).w).toBeGreaterThan(shown(0.22).w);
    expect(shown(0.2499).w).toBeGreaterThan(0.99);
    expect(shown(0.99).from).toBe(1);
    expect(shown(0.99).to).toBe(0);
    // The dissolve starts at the planned share of the quarter.
    expect(shown(0.25 * (1 - SWIM_FRAME_FADE) - 0.001).w).toBe(0);
  });

  it('wraps cleanly over any number of beats and backwards phases', () => {
    for (const t of [0.1, 0.4, 0.7]) {
      const a = swimFrameAt(t * TAU + 7 * TAU);
      const b = swimFrameAt(t * TAU);
      expect([a.from, a.to]).toEqual([b.from, b.to]);
      expect(a.w).toBeCloseTo(b.w, 6);
      expect(swimFrameAt(t * TAU - 3 * TAU).from).toBe(swimFrameAt(t * TAU).from);
    }
  });

  it('a species with drawn frames has all three, the same size, in the manifest', () => {
    const rows = (JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as { props: { id: string; asset: string }[] }).props;
    const ids = new Set(rows.map((r) => r.id));
    const drawn = FISH_LIST.filter((f) => ids.has(`${f.art}_swim1`) || ids.has(`${f.art}_swim2`) || ids.has(`${f.art}_swim3`));
    expect(drawn.map((f) => f.art)).toContain('fish_betta');
    for (const f of drawn) {
      for (const k of [1, 2, 3]) {
        const row = rows.find((r) => r.id === `${f.art}_swim${k}`);
        expect(row, `${f.art}_swim${k}`).toBeDefined();
        expect(existsSync(`public/assets/${row!.asset}`)).toBe(true);
      }
      const size = (k: number) => readFileSync(`public/assets/props/${f.art}_swim${k}.png`).subarray(16, 24).toString('hex');
      expect(size(2)).toBe(size(1));
      expect(size(3)).toBe(size(1));
    }
  });
});
