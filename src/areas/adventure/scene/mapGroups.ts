// The enemy groups on an Adventure map, each frame (split out of AdventureScene): they stand and breathe, show their label when the party
// is near, and report a touch when the party walks into one.
import { AB, type AreaMap } from '../logic/config/content';
import { groupPosition } from '../logic/maps';
import { placeMarks } from './foeMarks';
import type { MapObjects } from './mapView';
import type { AdventureSceneState, SceneReport, ScenePos } from './sceneState';

const TOUCH_LOCK_MS = 1200;

/** Shown and moved for one frame; returns the time before which a new touch is ignored (`touchLockUntil` goes in and comes out). */
export function updateGroups(
  s: AdventureSceneState,
  map: AreaMap,
  objs: MapObjects,
  pos: ScenePos,
  time: number,
  reduceMotion: boolean,
  paused: boolean,
  touchLockUntil: number,
  report: SceneReport,
): number {
  const now = s.now;
  let lock = touchLockUntil;
  for (const g of s.groups) {
    const view = objs.groups.get(g.id);
    const row = map.groups.find((x) => x.id === g.id);
    if (!view || !row) continue;
    for (const o of [view.img, view.shadow, view.aura, view.zzz, view.marks.veins, ...view.marks.spikes]) o?.setVisible(!g.defeated);
    view.label.setVisible(false);
    if (g.defeated) continue;
    const at = groupPosition(map, row);
    // Groups stand still and breathe (adventure-big-update-1 §12): a slow squash and stretch, each on its own beat; a sleeping one
    // breathes slower, under its Zzz, and a corrupted one pulses with a dark glow (decision 045).
    const still = reduceMotion;
    const beat = still ? 0 : Math.sin(time / ((g.asleep ? 1500 : 760) + view.phase * 9) + view.phase);
    view.aura?.setPosition(at.x, at.y - view.img.displayHeight * 0.2).setDepth(at.y - 2).setAlpha(0.2 + 0.06 * g.corruption + (still ? 0 : 0.08 * Math.sin(time / 420 + view.phase)));
    view.zzz?.setPosition(at.x + view.img.displayWidth * 0.45, at.y - view.img.displayHeight * 0.7 - (still ? 0 : 6 + 6 * Math.sin(time / 600 + view.phase))).setDepth(at.y + 1);
    view.img.setPosition(at.x, at.y + 6).setDepth(at.y).setScale(view.sx * (1 - 0.018 * beat), view.sy * (1 + 0.035 * beat));
    placeMarks(view.marks, at, view.img.displayWidth, still ? 0 : Math.sin(time / 420 + view.phase));
    view.shadow.setPosition(at.x, at.y + 4).setScale(1 - 0.06 * beat, 1).setDepth(at.y - 1);
    const d = Math.hypot(at.x - pos.x, at.y - pos.y);
    if (d < AB.explore.foeInfo * map.tile && !g.disguised) {
      view.label.setPosition(at.x, at.y - view.img.displayHeight - 4).setVisible(true);
    }
    if (!paused && now >= s.graceUntil && now >= lock && d < AB.explore.touch * (g.asleep ? AB.foes.sleepTouch : 1)) {
      lock = now + TOUCH_LOCK_MS;
      report.touch(g.id, pos);
    }
  }
  return lock;
}
