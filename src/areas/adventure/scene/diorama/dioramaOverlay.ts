// What Phaser still draws over the diorama picture: the tag of a group seen up close (not while it plays a mimic) and the Zzz of a
// sleeping one. They stand at the screen point of the group (`screenOf`), the camera does not move them (scroll factor 0), and they keep
// the size they have in the 2D map by following the fitted zoom.
import type * as Phaser from 'phaser';
import { AB, type AreaMap } from '../../logic/config/content';
import { groupPosition } from '../../logic/maps';
import { foeLabel, sleepMark } from '../foeMarks';
import type { AdventureSceneState } from '../sceneState';

interface Marks {
  label: Phaser.GameObjects.Container;
  zzz: Phaser.GameObjects.Image | Phaser.GameObjects.Text | null;
  zzzScale: number;
}

type ScreenOf = (px: { x: number; y: number }, lift: number) => { x: number; y: number };

export class FoeOverlay {
  private readonly marks = new Map<string, Marks>();

  constructor(scene: Phaser.Scene, map: AreaMap, s: AdventureSceneState) {
    for (const g of s.groups) {
      const label = foeLabel(scene, g.kind, g.elements, g.count, g.affix?.name ?? g.title, g.corruption, g.asleep).setScrollFactor(0);
      const zzz = g.asleep ? sleepMark(scene, map.tile).setScrollFactor(0).setDepth(99997).setVisible(false) : null;
      this.marks.set(g.id, { label, zzz, zzzScale: zzz?.scaleX ?? 1 });
    }
  }

  /** Places the tags for one frame; `k` is the size they keep (the fitted zoom), `party` the party's feet in game px. */
  update(s: AdventureSceneState, map: AreaMap, party: { x: number; y: number }, screenOf: ScreenOf, k: number, time: number, still: boolean) {
    for (const g of s.groups) {
      const m = this.marks.get(g.id);
      const row = map.groups.find((x) => x.id === g.id);
      if (!m || !row) continue;
      const at = groupPosition(map, row);
      const near = !g.defeated && Math.hypot(at.x - party.x, at.y - party.y) < AB.explore.foeInfo * map.tile;
      m.label.setVisible(near && !g.disguised);
      if (m.label.visible) {
        const p = screenOf(at, g.size);
        m.label.setPosition(p.x, p.y - 4 * k).setScale(k);
      }
      if (m.zzz) {
        m.zzz.setVisible(!g.defeated && !g.disguised);
        if (m.zzz.visible) {
          const p = screenOf({ x: at.x + map.tile * 0.35, y: at.y }, g.size * 0.85);
          m.zzz.setPosition(p.x, p.y - (still ? 0 : (6 + 6 * Math.sin(time / 600)) * k)).setScale(m.zzzScale * k);
        }
      }
    }
  }

  setVisible(on: boolean) {
    for (const m of this.marks.values()) {
      if (!on) {
        m.label.setVisible(false);
        m.zzz?.setVisible(false);
      }
    }
  }

  destroy() {
    for (const m of this.marks.values()) {
      m.label.destroy();
      m.zzz?.destroy();
    }
    this.marks.clear();
  }
}
