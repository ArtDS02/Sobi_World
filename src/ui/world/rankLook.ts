// The look of a cloud tier / garden zone by rank (decision 056): the atmosphere (light, petals, fireflies; always) plus, when
// RANK_SPRITES_ON, the pasted scenery sprites. One object for the scenes: draw() on a rank / skin change, update() every frame.
import type * as Phaser from 'phaser';
import { RANK_SPRITES_ON, type SceneryLayer } from '../../systems/animation/rankScenery';
import { RankAtmosphere, type AtmosphereDeps } from './rankAtmosphere';
import { RankScenery, type SceneryTheme } from './rankScenery';

type Img = Phaser.GameObjects.Image;

export class RankLook {
  private readonly sprites: RankScenery;
  private readonly atmosphere: RankAtmosphere;

  constructor(scene: Phaser.Scene, layers: readonly SceneryLayer[], fixed: (x: number, y: number, id: string) => Img, atmosphere: AtmosphereDeps) {
    this.sprites = new RankScenery(scene, RANK_SPRITES_ON ? layers : [], fixed);
    this.atmosphere = new RankAtmosphere(scene, atmosphere);
  }

  draw(group: number, rank: number, theme: SceneryTheme | null = null) {
    this.sprites.draw(group, rank, theme);
    this.atmosphere.set(rank, theme);
  }

  update(timeMs: number, night: boolean, still: boolean) {
    this.sprites.update(timeMs, night, still);
    this.atmosphere.update(timeMs, still);
  }
}
