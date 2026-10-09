// Building blocks of the content schemas.
import { z } from 'zod';
import { BREED_ID_VALUES, DECOR_ID_VALUES, ITEM_ID_VALUES } from './ids.generated';

export const breedId = z.enum(BREED_ID_VALUES);
export const itemId = z.enum(ITEM_ID_VALUES);
export const decorId = z.enum(DECOR_ID_VALUES);

export const nonNeg = z.number().finite().min(0);
export const int = z.number().int();
export const posInt = z.number().int().min(1);
export const percent = z.number().finite().min(0).max(100);
/** A probability or a weight share, 0..1. */
export const unit = z.number().finite().min(0).max(1);
/** Display text (Vietnamese for now; step 7 moves it to the string tables). */
export const text = z.string().min(1);
/** A manifest asset id (resolved and checked by `npm run assets:check`). */
export const assetId = z.string().regex(/^[a-z][a-z0-9_]*$/);
/** "#rrggbb" in the file, 0xRRGGBB in the game. */
export const color = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'colour "#rrggbb"')
  .transform((s) => Number.parseInt(s.slice(1), 16));

/** [min, max] with min <= max. */
export const range = z
  .tuple([z.number().finite(), z.number().finite()])
  .refine(([a, b]) => a <= b, 'range [min, max] needs min <= max');
