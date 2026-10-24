// What dresses each zone's areas (adventure-big-update-1 §11): the tall pieces framing them, the tint of the world beyond the
// edges, the floating life and the light, and the small textures the dressing draws with (made once per scene). Phaser.
import * as Phaser from 'phaser';

export interface ZoneDress {
  /** The tall pieces framing the area (prop art ids) and their tint beyond the edge. */
  frame: readonly string[];
  /** Darkening of the world beyond the edges. */
  beyond: number;
  /** Floating life: colour and kind. */
  motes: { colors: readonly number[]; kind: 'leaf' | 'firefly' | 'ember' | 'magic' }[];
  shafts: number;
  shaftColor: number;
}

export const DRESS: Readonly<Record<string, ZoneDress>> = {
  forest: {
    frame: [
      'prop_adv_forest_oak',
      'prop_adv_forest_round',
      'prop_adv_forest_oak',
      'prop_adv_forest_bush',
    ],
    beyond: 0x6f8f5c,
    motes: [
      { colors: [0x9ccf5a, 0xd8b84a, 0xe58a3a], kind: 'leaf' },
      { colors: [0xfff6a0, 0xd8ffa0], kind: 'firefly' },
    ],
    shafts: 4,
    shaftColor: 0xfff2c0,
  },
  mountain: {
    frame: [
      'prop_adv_mountain_pine',
      'prop_adv_mountain_boulder',
      'prop_adv_mountain_pine',
      'prop_adv_mountain_rock',
    ],
    beyond: 0x8a7458,
    motes: [
      { colors: [0xffb060, 0xff7a3a], kind: 'ember' },
      { colors: [0xf0e0c0], kind: 'magic' },
    ],
    shafts: 2,
    shaftColor: 0xffe0b0,
  },
  ruins: {
    frame: [
      'prop_adv_ruins_pillar',
      'prop_adv_ruins_deadtree',
      'prop_adv_ruins_broken',
      'prop_adv_ruins_statue',
    ],
    beyond: 0x7d7a8c,
    motes: [
      { colors: [0xc9a8ff, 0x9ae6ff], kind: 'magic' },
      { colors: [0xfff6a0], kind: 'firefly' },
    ],
    shafts: 3,
    shaftColor: 0xe8e0ff,
  },
};

/** How far the world beyond the grid reaches (design px). */
export const BEYOND = 520;

/** Small textures the dressing draws with, made once per scene. */
export function ensureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('adv-fx-dot')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let r = 16; r > 0; r -= 1)
      g.fillStyle(0xffffff, (1 - r / 16) ** 1.6).fillCircle(16, 16, r);
    g.generateTexture('adv-fx-dot', 32, 32);
    g.destroy();
  }
  if (!scene.textures.exists('adv-fx-leaf')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillEllipse(10, 6, 18, 9).fillStyle(0xdddddd, 1).fillRect(9, 2, 2, 8);
    g.generateTexture('adv-fx-leaf', 20, 12);
    g.destroy();
  }
  if (!scene.textures.exists('adv-fx-shaft')) {
    const tex = scene.textures.createCanvas('adv-fx-shaft', 128, 512);
    const ctx = tex?.getContext();
    if (ctx && tex) {
      const gx = ctx.createLinearGradient(0, 0, 128, 0);
      gx.addColorStop(0, 'rgba(255,255,255,0)');
      gx.addColorStop(0.5, 'rgba(255,255,255,1)');
      gx.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, 128, 512);
      ctx.globalCompositeOperation = 'destination-in';
      const gy = ctx.createLinearGradient(0, 0, 0, 512);
      gy.addColorStop(0, 'rgba(0,0,0,0)');
      gy.addColorStop(0.25, 'rgba(0,0,0,1)');
      gy.addColorStop(0.8, 'rgba(0,0,0,0.6)');
      gy.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gy;
      ctx.fillRect(0, 0, 128, 512);
      tex.refresh();
    }
  }
  if (!scene.textures.exists('adv-fx-blob')) {
    const tex = scene.textures.createCanvas('adv-fx-blob', 256, 256);
    const ctx = tex?.getContext();
    if (ctx && tex) {
      const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      tex.refresh();
    }
  }
}
