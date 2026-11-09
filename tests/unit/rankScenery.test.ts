// Decision 056: the rank scenery of a cloud tier / garden zone — which layers each rank shows, the motion rules (still when
// motion is reduced), and that every art id it names is in the manifest.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLOUD_SCENERY } from '../../src/areas/cloud/scene/cloudView';
import { GARDEN_SCENERY } from '../../src/areas/garden/scene/gardenView';
import { TIER_COUNT } from '../../src/areas/cloud/logic/config/content';
import { ZONE_COUNT } from '../../src/areas/garden/logic/config/content';
import { driftPose, layersAtRank, sceneryArtIds, sceneryMotion } from '../../src/systems/animation/rankScenery';

const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as { props: { id: string; status: string }[] };

describe('what each rank shows', () => {
  const kinds = (layers: typeof CLOUD_SCENERY, rank: number) => layersAtRank(layers, rank).map((l) => l.kind);
  it('Cloud: nothing at rank 1, border and path at 2, a landmark at 3, lanterns and a creature at 4, waterfall and halo at 5', () => {
    expect(kinds(CLOUD_SCENERY, 1)).toEqual([]);
    expect(kinds(CLOUD_SCENERY, 2).sort()).toEqual(['border', 'path']);
    expect(kinds(CLOUD_SCENERY, 3)).toContain('landmark');
    expect(kinds(CLOUD_SCENERY, 4)).toEqual(expect.arrayContaining(['lanterns', 'critter']));
    expect(kinds(CLOUD_SCENERY, 5)).toEqual(expect.arrayContaining(['waterfall', 'halo']));
    expect(kinds(CLOUD_SCENERY, 2)).not.toContain('landmark');
  });
  it('Garden: fence and path at 2, landmark at 3, lanterns and creature at 4, old tree and market at 5', () => {
    expect(kinds(GARDEN_SCENERY, 1)).toEqual([]);
    expect(kinds(GARDEN_SCENERY, 2).sort()).toEqual(['fence', 'path']);
    expect(kinds(GARDEN_SCENERY, 4)).toEqual(expect.arrayContaining(['landmark', 'lanterns', 'critter']));
    expect(kinds(GARDEN_SCENERY, 5)).toEqual(expect.arrayContaining(['tree', 'market']));
  });
  it('every rank adds layers, never takes one away', () => {
    for (const layers of [CLOUD_SCENERY, GARDEN_SCENERY]) {
      for (let r = 2; r <= 5; r += 1) expect(layersAtRank(layers, r).length).toBeGreaterThanOrEqual(layersAtRank(layers, r - 1).length);
    }
  });
  it('one landmark per cloud tier and per garden zone', () => {
    const landmark = (layers: typeof CLOUD_SCENERY) => layers.find((l) => l.kind === 'landmark')!.art as readonly string[];
    expect(landmark(CLOUD_SCENERY)).toHaveLength(TIER_COUNT);
    expect(landmark(GARDEN_SCENERY)).toHaveLength(ZONE_COUNT);
  });
});

describe('motion', () => {
  it('is frozen when motion is reduced, and the same for the same time otherwise', () => {
    for (const kind of ['critter', 'halo', 'waterfall', 'lanterns', 'border'] as const) {
      expect(sceneryMotion(kind, 1234, true, true)).toEqual(sceneryMotion(kind, 99_999, true, true));
      expect(sceneryMotion(kind, 5000, false, false)).toEqual(sceneryMotion(kind, 5000, false, false));
    }
    expect(sceneryMotion('critter', 0, false, true).dy).toBe(0);
  });
  it('the creature bobs, the lanterns flicker only at night, still layers do not move', () => {
    const ys = new Set([0, 300, 700, 1100].map((t) => sceneryMotion('critter', t, false, false).dy));
    expect(ys.size).toBeGreaterThan(1);
    expect(sceneryMotion('lanterns', 1000, false, false).alpha).toBe(0.85);
    expect(sceneryMotion('lanterns', 1000, true, false).alpha).toBeGreaterThan(0.9);
    expect(sceneryMotion('border', 4000, true, false)).toEqual({ dy: 0, alpha: 1 });
  });
});

describe('art ids', () => {
  it('every id the scenes name is a manifest prop (placeholder until the art is made)', () => {
    const ids = new Map(manifest.props.map((p) => [p.id, p.status]));
    for (const id of [...sceneryArtIds(CLOUD_SCENERY), ...sceneryArtIds(GARDEN_SCENERY)]) expect(ids.has(id), id).toBe(true);
    expect(sceneryArtIds(CLOUD_SCENERY)).toHaveLength(16);
    expect(sceneryArtIds(GARDEN_SCENERY)).toHaveLength(10);
  });
});

describe('drifting particles (kept for the optional sprite look)', () => {
  const spec = { count: 4, x0: 0, x1: 100, y0: 0, y1: 200, periodMs: 1000 };
  it('stays inside its box, frozen when still, falling over time', () => {
    const still = driftPose('petal', spec, 1, 0, true);
    expect(driftPose('petal', spec, 1, 55_555, true)).toEqual(still);
    expect(still.x).toBeGreaterThanOrEqual(0);
    expect(still.x).toBeLessThanOrEqual(100);
    expect(driftPose('petal', spec, 0, 0, false).y).not.toBe(driftPose('petal', spec, 0, 400, false).y);
    expect(driftPose('firefly', spec, 2, 0, false)).not.toEqual(driftPose('firefly', spec, 2, 700, false));
  });
});
