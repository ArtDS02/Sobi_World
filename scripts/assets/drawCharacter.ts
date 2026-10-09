// Placeholder art of the player character: a round-headed figure that turns to its four sides, with a
// stride on the walk frames. Replaced by real art later (docs/ASSET_TODO.md).
import { Raster, shade, type Rgba } from './raster';

const SKIN: Rgba = [255, 214, 178, 255];
const SHIRT: Rgba = [232, 112, 96, 255];
const PANTS: Rgba = [84, 104, 168, 255];
const HAIR: Rgba = [92, 60, 44, 255];
const EYE: Rgba = [40, 32, 32, 255];

/** `key` = `<facing>_<frame>`, e.g. `left_walk1`. */
export function drawCharacter(r: Raster, key: string) {
  const [facing = 'down', frame = 'idle'] = key.split('_');
  const cx = r.width / 2;
  const feet = r.height - 4;
  const stride = frame === 'walk1' ? 8 : frame === 'walk2' ? -8 : 0;
  const side = facing === 'left' || facing === 'right';
  const dir = facing === 'left' ? -1 : 1;
  // Legs (feet at the bottom of the canvas: the frame's feet line).
  const legW = 14;
  const leftLegY = feet - 34 - (stride > 0 ? 6 : 0);
  const rightLegY = feet - 34 - (stride < 0 ? 6 : 0);
  if (side) {
    r.roundRect(cx - legW / 2 + stride, leftLegY, legW, feet - leftLegY, 5, PANTS);
    r.roundRect(cx - legW / 2 - stride, rightLegY, legW, feet - rightLegY, 5, shade(PANTS, 0.8));
  } else {
    r.roundRect(cx - 20, leftLegY, legW, feet - leftLegY, 5, PANTS);
    r.roundRect(cx + 6, rightLegY, legW, feet - rightLegY, 5, PANTS);
  }
  // Body, head, hair.
  r.roundRect(cx - 24, feet - 84, 48, 56, 16, SHIRT);
  r.ellipse(cx, feet - 100, 26, 26, SKIN);
  if (facing === 'up') {
    r.ellipse(cx, feet - 104, 27, 25, HAIR);
    return;
  }
  r.ellipse(cx, feet - 118, 27, 14, HAIR);
  // Face.
  if (side) {
    r.ellipse(cx + dir * 12, feet - 100, 4, 5, EYE);
  } else {
    r.ellipse(cx - 10, feet - 100, 4, 5, EYE);
    r.ellipse(cx + 10, feet - 100, 4, 5, EYE);
  }
}

/** The character's frame files are 96 × 144. */
export const CHARACTER_SIZE = { width: 96, height: 144 };
