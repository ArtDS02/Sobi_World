// Boot (spec §11, §11.4): the manifest is already validated by main.ts; this scene loads the one
// picture of the loading screen (its pig, AM-2) and generates the fallback textures so every later
// lookup can render something.
import * as Phaser from 'phaser';
import { BREED_ID_VALUES } from '../../../../core/config/ids';
import { BREEDS } from '../../../../core/config/breeds';
import { PIG_FEET_Y } from '../../../../core/config/assetIds';
import { FARM_FALLBACK } from '../../../../core/config/farmView';
import { LOADING_PIG_BREED } from '../../../../core/config/loadingScreen';
import type { AssetRegistry } from '../../../../core/assets/registry';
import { LOADING_PIG_KEY } from '../prefabs/LoadingScreen';
import { SCENE_KEYS } from '../config/phaser';
import { FALLBACK_FX_KEY, FALLBACK_PROP_KEY, fallbackPigKey } from '../view/textureKeys';

export class BootScene extends Phaser.Scene {
  constructor(private readonly assets: AssetRegistry) {
    super(SCENE_KEYS.boot);
  }

  preload() {
    // A missing file only means the loading screen draws its pig (no error screen).
    const url = this.assets.url(BREEDS[LOADING_PIG_BREED].artId, 'asset');
    if (url) this.load.image(LOADING_PIG_KEY, url);
  }

  create() {
    const g = this.make.graphics({}, false);
    const pig = FARM_FALLBACK.PIG;
    // Rounded body in the breed colour, standing on the 82 % feet line (spec §11.4).
    const w = pig.size * pig.bodyWidth;
    const h = pig.size * pig.bodyHeight;
    const top = pig.size * PIG_FEET_Y - h;
    for (const breed of BREED_ID_VALUES) {
      g.clear();
      g.fillStyle(BREEDS[breed].color, 1);
      g.lineStyle(pig.stroke, pig.outline, 1);
      g.fillRoundedRect((pig.size - w) / 2, top, w, h, pig.radius);
      g.strokeRoundedRect((pig.size - w) / 2, top, w, h, pig.radius);
      g.generateTexture(fallbackPigKey(breed), pig.size, pig.size);
    }

    const prop = FARM_FALLBACK.PROP;
    g.clear();
    g.fillStyle(prop.color, 1);
    g.fillRoundedRect(0, 0, prop.width, prop.height, prop.radius);
    g.generateTexture(FALLBACK_PROP_KEY, prop.width, prop.height);

    const fx = FARM_FALLBACK.FX;
    g.clear();
    g.fillStyle(fx.color, 1);
    g.fillCircle(fx.size / 2, fx.size / 2, fx.size / 2);
    g.generateTexture(FALLBACK_FX_KEY, fx.size, fx.size);

    g.destroy();
    this.scene.start(SCENE_KEYS.preload);
  }
}
