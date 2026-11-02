// GĐ14 Adventure art wiring: the decals scattered over an area (seeded by the area, never on a blocked tile, only art that exists),
// and the icons of statuses, skills and reactions through manifest ids.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAP_LIST } from '../../src/areas/adventure/logic/config/content';
import { CAMP_ART, ICON_ART_IDS } from '../../src/areas/adventure/logic/art';
import { blockedTiles } from '../../src/areas/adventure/logic/maps';
import { corruptionDecalsOf, decalsOf, wallPropsOf } from '../../src/areas/adventure/scene/decals';
import { chestArt, crackArt, exitArt, kitTile, KIT_IDS, puzzleArt } from '../../src/areas/adventure/scene/mapKit';
import { cliffFaces } from '../../src/areas/adventure/scene/mapCliffs';
import { PROPS } from '../../src/areas/adventure/logic/config/content';
import { foeBadgeArt, reactionArt, skillArt, statusArt } from '../../src/areas/adventure/ui/vmKit';

const zoneOfMapId = (map: (typeof MAP_LIST)[number]) => map.zoneId.replace(/^zone_/, '');
const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as Record<string, { id: string }[] | number>;
const ids = new Set(Object.values(manifest).flatMap((rows) => (Array.isArray(rows) ? rows.map((r) => r.id) : [])));

describe('adventure decals', () => {
  it('are the same every time for an area, and differ between areas', () => {
    const [a, b] = MAP_LIST;
    expect(decalsOf(a!, zoneOfMapId(a!))).toEqual(decalsOf(a!, zoneOfMapId(a!)));
    expect(decalsOf(a!, zoneOfMapId(a!))).not.toEqual(decalsOf(b!, zoneOfMapId(b!)));
  });

  it('dress every area, never on a wall, a prop or a thing, and only with art the manifest has', () => {
    for (const map of MAP_LIST) {
      const decals = decalsOf(map, zoneOfMapId(map));
      expect(decals.length, map.id).toBeGreaterThan(10);
      const blocked = blockedTiles(map);
      for (const d of decals) {
        expect(ids.has(d.art), d.art).toBe(true);
        const x = Math.floor(d.x / map.tile);
        const y = Math.floor((d.y - 1) / map.tile);
        const ground = map.terrain[y]![x]!;
        if (ground !== '~') expect(blocked[y * map.cols + x], `${map.id} ${x},${y}`).toBe(false);
      }
    }
  });
});

describe('adventure icons', () => {
  it('a raised or lowered stat shows the stat badge and an arrow; other statuses their own badge', () => {
    expect(statusArt('atkUp')).toEqual({ art: 'ui_icon_stat_atk', arrow: 'up' });
    expect(statusArt('spdDown')).toEqual({ art: 'ui_icon_stat_spd', arrow: 'down' });
    expect(statusArt('poison')).toEqual({ art: 'ui_icon_status_poison', arrow: null });
    expect(statusArt('autoRevive')).toEqual({ art: 'ui_icon_status_revive', arrow: null });
  });

  it('every status, the camp dressing and the element / class / action badges have a manifest row', () => {
    const statuses = ['poison', 'burn', 'wet', 'freeze', 'stun', 'disable', 'doom', 'atkUp', 'defDown', 'matkUp', 'mdefDown', 'accUp', 'evaDown', 'spdUp', 'shield', 'taunt', 'regen', 'autoRevive'] as const;
    for (const s of statuses) expect(ids.has(statusArt(s).art), s).toBe(true);
    for (const id of [...Object.values(CAMP_ART), ...ICON_ART_IDS]) expect(ids.has(id), id).toBe(true);
  });

  it('every foe class has its badge (decision 045)', () => {
    for (const k of ['normal', 'elite', 'mutant', 'subboss', 'boss', 'special']) expect(ids.has(foeBadgeArt(k)), k).toBe(true);
  });

  it('skills and reactions name their art after their id', () => {
    expect(skillArt('skill_nh_bubble')).toBe('ui_skill_nh_bubble');
    expect(ids.has(skillArt('skill_nh_bubble'))).toBe(true);
    expect(reactionArt('reaction_shock')).toBe('ui_icon_react_shock');
    expect(ids.has(reactionArt('reaction_shock'))).toBe(true);
  });
});

describe('the map kit (decision 045)', () => {
  it('every kit picture the map draws, and every landmark, has a manifest row', () => {
    for (const id of KIT_IDS) expect(ids.has(id), id).toBe(true);
    for (const p of Object.values(PROPS)) expect(ids.has(p.art), p.art).toBe(true);
  });

  it('the kit lays the ground, the older tiles stay for paths and walls', () => {
    expect(kitTile('coast', '~', 3, 4)).toEqual({ id: 'adv_map_coast_tile_sea', tint: 0xffffff });
    expect(kitTile('coast', ',', 3, 4)).toEqual({ id: 'adv_map_coast_tile_sand_a', tint: 0xf0dfc4 });
    expect(kitTile('forest', '.', 3, 4)?.id).toBe('adv_map_forest_tile_grass_a');
    expect(kitTile('forest', ',', 3, 4)).toBeNull();
  });

  it('a chest by its kind and an element device by its id, dark and lit', () => {
    expect(chestArt('gold', false)).toBe('adv_map_chest_gold');
    expect(chestArt(undefined, true)).toBe('adv_map_chest_wood_open');
    expect(puzzleArt('puzzle_n1_brazier_a', 'FIRE', false)).toBe('adv_map_puzzle_brazier');
    expect(puzzleArt('puzzle_n1_brazier_a', 'FIRE', true)).toBe('adv_map_puzzle_brazier_lit');
    expect(puzzleArt('puzzle_c2_clam', 'LIGHT', true)).toBe('adv_map_coast_exit_clam_open');
    expect(puzzleArt('puzzle_x', 'DARK', true)).toBe('adv_map_puzzle_veil_gone');
  });

  it('an exit by its kind, barred while shut; a false wall whole, then broken', () => {
    expect(exitArt('mountain', 'tunnel', true)).toBe('adv_map_mountain_exit_tunnel');
    expect(exitArt('coast', undefined, true)).toBe('adv_map_coast_exit_dock_arch');
    expect(exitArt('forest', 'stairs', true)).toBe('adv_map_forest_exit_arch');
    expect(exitArt('ruins', 'stairs', false)).toBe('adv_map_ruins_exit_gate');
    expect(crackArt('forest', 'gate_f2_boulder', false)).toBe('adv_map_mountain_exit_boulder');
    expect(crackArt('ruins', 'gate_r1_wall', true)).toBe('adv_map_ruins_exit_runewall_open');
    for (const map of MAP_LIST) for (const e of map.exits) for (const open of [true, false]) expect(ids.has(exitArt(zoneOfMapId(map), e.kind, open)!), `${map.id} ${e.id}`).toBe(true);
  });

  it('the corrupted dressing grows with the corruption, never blocks, and only uses art the manifest has', () => {
    for (const map of MAP_LIST) {
      const zone = zoneOfMapId(map);
      const low = corruptionDecalsOf(map, zone, 10);
      const high = corruptionDecalsOf(map, zone, 90);
      expect(high.length, map.id).toBeGreaterThan(low.length);
      // Seeded per tile: the pieces of a lower corruption are among those of a higher one.
      const at = new Set(high.map((d) => `${d.x},${d.y}`));
      for (const d of low) expect(at.has(`${d.x},${d.y}`), map.id).toBe(true);
      const blocked = blockedTiles(map);
      for (const d of high) {
        expect(ids.has(d.art), d.art).toBe(true);
        expect(blocked[Math.floor((d.y - 1) / map.tile) * map.cols + Math.floor(d.x / map.tile)], map.id).toBe(false);
      }
    }
  });
});

describe('cliff faces (decision 045)', () => {
  it('a plateau front with its stairs and its waterfall, capped where a side wall goes on', () => {
    // The tile maps still draw their faces from the grid (the painted ones carry them in their picture, decision 046).
    const terrain = ['############', '#F^^^~~^^^F#', '#F^^^~~^^^F#', '#FFsswwFFFF#', '#FFsswwFFFF#', '#..........#', '#..........#', '############'];
    const map = { ...MAP_LIST.find((m) => !m.scene)!, cols: 12, rows: 8, terrain };
    const runs = cliffFaces(map);
    expect(runs.map((r) => [r.kind, r.x0, r.x1, r.top, r.bottom])).toEqual([
      ['cliff', 2, 3, 3, 4],
      ['stairs', 3, 5, 3, 4],
      ['waterfall', 5, 7, 3, 4],
      ['cliff', 7, 10, 3, 4],
    ]);
    expect(runs[0]).toMatchObject({ capL: true, capR: false });
    expect(runs[3]).toMatchObject({ capL: false, capR: true });
  });

  it('every face is at most 3 deep, on face tiles only, with the plateau (or the stream of a waterfall) above', () => {
    for (const map of MAP_LIST)
      for (const r of cliffFaces(map)) {
        expect(r.bottom - r.top, map.id).toBeLessThan(3);
        for (let x = r.x0; x < r.x1; x += 1) {
          for (let y = r.top; y <= r.bottom; y += 1) expect('Fsw', `${map.id} ${x},${y}`).toContain(map.terrain[y]![x]!);
          expect(r.kind === 'waterfall' ? '^~=' : '^', `${map.id} ${x}`).toContain(map.terrain[r.top - 1]![x]!);
        }
      }
  });
});

describe('props along the way (decision 045)', () => {
  it('stand only on wall tiles that touch the way, with art the manifest has', () => {
    for (const map of MAP_LIST) {
      const props = wallPropsOf(map, zoneOfMapId(map));
      expect(props.length, map.id).toBeGreaterThan(0);
      for (const p of props) {
        expect(ids.has(p.art), p.art).toBe(true);
        expect(map.terrain[Math.floor((p.y - 1) / map.tile)]![Math.floor(p.x / map.tile)], map.id).toBe('#');
      }
    }
  });
});
