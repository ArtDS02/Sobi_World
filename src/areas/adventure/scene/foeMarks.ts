// The marks drawn over a group on the map (decision 045): the Zzz of a sleeping one and the corruption of a strong one, art from batch
// adventure-15-coast-foes laid over the group's own picture; and the tag seen up close (class badge, elements, count, corruption).
import * as Phaser from 'phaser';
import { vi } from '../../../i18n/vi';
import { textureKey } from '../../../ui/world/keys';
import { elementArt, foeBadgeArt } from '../ui/vmKit';
import type { AdventureSceneState } from './sceneState';

/** The Zzz over a sleeping group: its art (`fx_sleep_zzz`) when the manifest has it, else drawn letters. */
export function sleepMark(scene: Phaser.Scene, t: number): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  const k = textureKey('fx_sleep_zzz');
  if (scene.textures.exists(k)) return scene.add.image(0, 0, k).setOrigin(0.5, 1).setDisplaySize(t * 0.9, t * 0.8);
  return scene.add.text(0, 0, 'z Z', { fontSize: '18px', fontStyle: 'bold', color: '#e8f0ff', stroke: '#3a4a7a', strokeThickness: 4 }).setOrigin(0.5, 1);
}

export interface CorruptionMarks {
  veins: Phaser.GameObjects.Image | null;
  spikes: Phaser.GameObjects.Image[];
}
/** The pale veins darkened so they read on light grass and sand. */
export const VEINS_TINT = 0x9a58d6;
export const NO_MARKS: CorruptionMarks = { veins: null, spikes: [] };

/**
 * A group's corruption marks over its own picture (decision 045 §8): from 3 the violet veins spread on the ground under it, from 4 a
 * crystal cluster grows behind it, at 5 a second one in front. Missing art = no marks (the tint and the dark glow still tell).
 */
export function corruptionMarks(scene: Phaser.Scene, corruption: number, height: number, ratio: number): CorruptionMarks {
  const veinsKey = textureKey('fx_corrupt_veins');
  const spikesKey = textureKey('fx_corrupt_spikes');
  const veins = corruption >= 3 && scene.textures.exists(veinsKey) ? scene.add.image(0, 0, veinsKey).setDisplaySize(height * ratio * 1.25, height * 0.42).setTint(VEINS_TINT).setAlpha(0.85) : null;
  const spikes: Phaser.GameObjects.Image[] = [];
  if (corruption >= 4 && scene.textures.exists(spikesKey)) {
    spikes.push(scene.add.image(0, 0, spikesKey).setOrigin(0.5, 1).setDisplaySize(height * 0.5, height * 0.5));
    if (corruption >= 5) spikes.push(scene.add.image(0, 0, spikesKey).setOrigin(0.5, 1).setDisplaySize(height * 0.32, height * 0.32).setFlipX(true));
  }
  return { veins, spikes };
}

/** Moves a group's marks with it: the veins pulse with its dark glow, the spikes stand behind its back (it looks left), the second at its front foot. */
export function placeMarks(marks: CorruptionMarks, at: { x: number; y: number }, width: number, pulse: number) {
  marks.veins?.setPosition(at.x, at.y + 4).setDepth(at.y - 1.5).setAlpha(0.7 + 0.15 * pulse);
  marks.spikes[0]?.setPosition(at.x + width * 0.36, at.y + 2).setDepth(at.y - 0.5);
  marks.spikes[1]?.setPosition(at.x - width * 0.32, at.y + 8).setDepth(at.y + 0.5);
}

/**
 * The tag over a group seen up close: its elements' badges, how many it is and its corruption pips; above it, a ribbon with its variant
 * or its class (origin at the bottom centre).
 */
export function foeLabel(scene: Phaser.Scene, kind: AdventureSceneState['groups'][number]['kind'], elements: readonly AdventureSceneState['groups'][number]['elements'][number][], count: number, ribbonText: string | null, corruption: number, asleep: boolean): Phaser.GameObjects.Container {
  const icon = 22;
  const parts: Phaser.GameObjects.GameObject[] = [];
  let x = 6;
  // Its class's badge (batch adventure-14b I1) leads the tag.
  const badge = textureKey(foeBadgeArt(kind));
  if (scene.textures.exists(badge)) {
    parts.push(scene.add.image(x + icon / 2 + 1, -icon / 2 - 4, badge).setDisplaySize(icon + 4, icon + 4));
    x += icon + 6;
  }
  for (const e of elements) {
    const k = textureKey(elementArt(e));
    if (!scene.textures.exists(k)) continue;
    parts.push(scene.add.image(x + icon / 2, -icon / 2 - 4, k).setDisplaySize(icon, icon));
    x += icon + 2;
  }
  const text = scene.add.text(x + 2, -icon / 2 - 4, `×${count}`, { fontSize: '16px', fontStyle: 'bold', color: '#4a2e17' }).setOrigin(0, 0.5);
  const pips = scene.add.text(x + 2 + text.width + 6, -icon / 2 - 4, '◆'.repeat(corruption) + '◇'.repeat(Math.max(0, 5 - corruption)), { fontSize: '13px', color: corruption >= 4 ? '#6b1f8f' : '#a24fc8' }).setOrigin(0, 0.5);
  const w = x + 4 + text.width + 6 + pips.width + 6;
  const bg = scene.add.graphics().fillStyle(0xfff6e0, 0.95).lineStyle(2, 0x8a5a2b, 1).fillRoundedRect(0, -icon - 8, w, icon + 8, 10).strokeRoundedRect(0, -icon - 8, w, icon + 8, 10);
  const box = scene.add.container(0, 0, [bg, ...parts, text, pips]).setDepth(99998).setVisible(false);
  for (const p of box.list as unknown as Phaser.GameObjects.Components.Transform[]) p.x -= w / 2;
  const words = ribbonText && asleep ? `${ribbonText} · ${vi.adventure.foes.asleep}` : (ribbonText ?? (asleep ? vi.adventure.foes.asleep : null));
  if (words) {
    // The variant's or the class's name on a gold ribbon above the tag.
    const name = scene.add.text(0, -icon - 20, words, { fontSize: '15px', fontStyle: 'bold', color: '#5b3a1c' }).setOrigin(0.5, 0.5);
    const rw = name.width + 16;
    const ribbon = scene.add.graphics().fillStyle(0xffe27a, 0.97).lineStyle(2, 0xb8860b, 1).fillRoundedRect(-rw / 2, -icon - 30, rw, 20, 9).strokeRoundedRect(-rw / 2, -icon - 30, rw, 20, 9);
    box.add([ribbon, name]);
  }
  return box;
}
