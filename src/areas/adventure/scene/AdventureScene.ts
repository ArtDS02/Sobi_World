// The Adventure on screen: a backdrop of the zone behind the DOM screens (hub, map, battle). The play happens in the DOM
// layer; the scene only paints the background, so it never reaches the store or another Area.
import * as Phaser from 'phaser';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { ZONE_LIST } from '../logic/config/content';

export const ADVENTURE_SCENE_KEY = 'adventure';
export const ADVENTURE_DESIGN = { width: 1600, height: 900 } as const;

export class AdventureScene extends Phaser.Scene {
  constructor() {
    super(ADVENTURE_SCENE_KEY);
  }

  create() {
    fitCamera(this, ADVENTURE_DESIGN);
    const { width, height } = ADVENTURE_DESIGN;
    const bleed = width * 2;
    const g = this.add.graphics().setDepth(-2000);
    g.fillStyle(0xaad6c8, 1).fillRect(-bleed, -bleed, width + bleed * 2, height * 0.7 + bleed);
    g.fillStyle(0x5f9a60, 1).fillRect(-bleed, height * 0.7, width + bleed * 2, height * 0.3 + bleed);
    const key = textureKey(ZONE_LIST[0]!.backdrop);
    const backdrop = this.add.image(width / 2, height / 2, this.textures.exists(key) ? key : FALLBACK_PROP_KEY).setDepth(-1000);
    if (this.textures.exists(key)) backdrop.setDisplaySize(width, height);
    else backdrop.setVisible(false);
  }
}
