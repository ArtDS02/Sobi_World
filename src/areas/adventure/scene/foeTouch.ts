// The rule of touching an enemy group on an Adventure map (shared by every map renderer, so it lives with the scene's rules, not the
// drawing): the party walks into a standing group, close enough, after the grace of the trip, and a touch is reported once per lock.
import { AB, type AreaMap } from '../logic/config/content';
import { groupPosition } from '../logic/maps';
import type { AdventureSceneState, SceneReport, ScenePos } from './sceneState';

const TOUCH_LOCK_MS = 1200;

/** Reports the first touch of this frame; returns the time before which a new touch is ignored (`touchLockUntil` goes in and comes out). */
export function touchGroups(s: AdventureSceneState, map: AreaMap, pos: ScenePos, paused: boolean, touchLockUntil: number, report: SceneReport): number {
  let lock = touchLockUntil;
  if (paused) return lock;
  for (const g of s.groups) {
    const row = map.groups.find((x) => x.id === g.id);
    if (!row || g.defeated) continue;
    const at = groupPosition(map, row);
    const d = Math.hypot(at.x - pos.x, at.y - pos.y);
    if (s.now >= s.graceUntil && s.now >= lock && d < AB.explore.touch * (g.asleep ? AB.foes.sleepTouch : 1)) {
      lock = s.now + TOUCH_LOCK_MS;
      report.touch(g.id, pos);
    }
  }
  return lock;
}
