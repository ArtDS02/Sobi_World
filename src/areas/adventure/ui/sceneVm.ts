// The plain state the Adventure's scene draws (scene/sceneState.ts), built from the world: where the party stands and when it must be put
// back, the leader and followers, the groups of the area (their look, elements, beaten or not), what is opened or used. Pure.
import type { WorldSave } from '../../../core/save/world';
import { exitOpen, groupEnemies, groupKey, portalLit } from '../logic/actions/trip';
import { CAMP_ART } from '../logic/art';
import { ENEMIES, MAPS, RIFT, ZONES, ZONE_LIST } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import { groupAffix } from '../logic/variants';
import type { AdventureSceneState } from '../scene/sceneState';

export function sceneVm(world: WorldSave | null, now: number, paused: boolean, zoneId: string): AdventureSceneState | null {
  if (!world) return null;
  const a = adventureOf(world);
  const run = a.run;
  const zone = ZONES[run?.zoneId ?? zoneId] ?? ZONE_LIST[0]!;
  const base = {
    leader: a.leader,
    followers: (run?.team ?? []).map((m) => ({ art: m.art, down: m.hp <= 0 })),
    openedGates: a.openedGates,
    openedChests: a.openedChests,
    backdrop: run?.rift ? RIFT.backdrop : run ? zone.backdrop : CAMP_ART.backdrop,
    now,
    paused,
  };
  // The board of a battle just won keeps the battle's picture behind it.
  if (!run || run.phase !== 'explore' || run.rift || run.report) {
    return { ...base, mode: !run ? 'camp' : run.phase === 'battle' ? 'battle' : 'done', mapId: null, placeKey: '', pos: { x: 0, y: 0, facing: 'down' }, groups: [], exits: [], usedSpots: [], springUsed: false, portalLit: false, graceUntil: 0 };
  }
  const map = MAPS[run.mapId];
  const prefix = `${run.mapId}/`;
  return {
    ...base,
    mode: 'explore',
    mapId: run.mapId,
    placeKey: `${run.startedAt}|${run.mapId}`,
    pos: { x: run.x, y: run.y, facing: run.facing },
    groups: (map?.groups ?? []).map((g) => {
      const ids = groupEnemies(run.seed, run.mapId, g);
      const enemies = ids.map((id) => ENEMIES[id]!).filter(Boolean);
      const affix = groupAffix(run.seed, run.mapId, g);
      return {
        affix: affix ? { name: affix.nameVi, golden: affix.escapeAfterRounds !== null } : null,
        id: g.id,
        kind: g.kind,
        art: enemies[0]?.art ?? '',
        elements: [...new Set(enemies.map((e) => e.element))],
        count: enemies.length,
        // A normal group is gone until the party changes area; a guardian or a boss is gone for good.
        defeated: run.defeated.includes(groupKey(run.mapId, g.id)) || (g.kind !== 'normal' && a.beaten.includes(groupKey(run.mapId, g.id))),
      };
    }),
    exits: (map?.exits ?? []).map((e) => ({ id: e.id, open: !!map && exitOpen(world, a, map, e), forward: e.lock === 'guardian' })),
    usedSpots: run.harvested.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)),
    springUsed: run.springs.includes(run.mapId),
    portalLit: portalLit(world, a, run.mapId),
    graceUntil: run.graceUntil ?? 0,
  };
}
