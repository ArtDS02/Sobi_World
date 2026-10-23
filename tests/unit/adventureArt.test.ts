// GĐ14 Adventure art wiring: the decals scattered over an area (seeded by the area, never on a blocked tile, only art that exists),
// and the icons of statuses, skills and reactions through manifest ids.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAP_LIST } from '../../src/areas/adventure/logic/config/content';
import { CAMP_ART, ICON_ART_IDS } from '../../src/areas/adventure/logic/art';
import { blockedTiles } from '../../src/areas/adventure/logic/maps';
import { decalsOf } from '../../src/areas/adventure/scene/decals';
import { reactionArt, skillArt, statusArt } from '../../src/areas/adventure/ui/vmKit';

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

  it('skills and reactions name their art after their id', () => {
    expect(skillArt('skill_nh_bubble')).toBe('ui_skill_nh_bubble');
    expect(ids.has(skillArt('skill_nh_bubble'))).toBe(true);
    expect(reactionArt('reaction_shock')).toBe('ui_icon_react_shock');
    expect(ids.has(reactionArt('reaction_shock'))).toBe(true);
  });
});
