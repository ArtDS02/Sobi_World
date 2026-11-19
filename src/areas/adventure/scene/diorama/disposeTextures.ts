// Frees the shared pictures the map accents draw in code (sun shafts, the falls, the mist, the cracks, the landmark runes), once the
// view itself is thrown away.
import { disposeCracks } from './cracks';
import { disposeRuneTexture } from './landmarkGlow';
import { disposeMistTexture } from './mist';
import { disposeShaftTexture } from './sunShafts';
import { disposeFallTextures } from './waterfall';

export function disposeAccentTextures() {
  disposeShaftTexture();
  disposeFallTextures();
  disposeMistTexture();
  disposeCracks();
  disposeRuneTexture();
}
