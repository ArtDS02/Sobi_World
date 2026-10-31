// The plain state the Adventure's scene draws (scene/sceneState.ts), built from the world: where the party stands and when it must be put
// back, the leader and followers, the groups of the area (their look, elements, beaten or not), what is opened or used. Pure.
import type { WorldSave } from '../../../core/save/world';
import { exitLock, groupEnemies, groupKey, portalLit } from '../logic/actions/trip';
import { CAMP_ART } from '../logic/art';
import { ENEMIES, MAPS, RIFT, ZONES, ZONE_LIST } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import { corruptionOf, foeClass, grownElement, foePresent, foeSize, foeSky, staysBeaten } from '../logic/foes';
import { groupAffix } from '../logic/variants';
import { localOffsetMs } from '../../../ui/localDay';
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
  const sky = foeSky(world, now, localOffsetMs(now));
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
        size: foeSize(g),
        corruption: corruptionOf(g),
        asleep: !!g.sleep,
        title: g.kind === 'normal' ? null : foeClass(g.kind).nameVi,
        art: enemies[0]?.art ?? '',
        elements: [...new Set(enemies.flatMap((e) => [e.element, ...(grownElement(g, e.element) ? [grownElement(g, e.element)!] : [])]))],
        count: enemies.length,
        // A normal or mutant group is gone until the party changes area; the other classes are gone for good. A special group away
        // from its sky (rain, night) is not there.
        defeated: run.defeated.includes(groupKey(run.mapId, g.id)) || (staysBeaten(g) && a.beaten.includes(groupKey(run.mapId, g.id))) || !foePresent(g, sky),
      };
    }),
    exits: (map?.exits ?? []).map((e) => {
      const lock = map ? exitLock(world, a, map, e) : 'zone';
      return { id: e.id, open: lock === null, lock, forward: e.lock === 'guardian' };
    }),
    usedSpots: run.harvested.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)),
    springUsed: run.springs.includes(run.mapId),
    portalLit: portalLit(world, a, run.mapId),
    graceUntil: run.graceUntil ?? 0,
  };
}
