// content/shared/defaults.json — what a NEW save starts with (admin plan step 1 / 8.2). Existing saves keep their own
// values: nothing here is ever applied to a save that already exists.
import { z } from 'zod';

export const defaultsFileSchema = z.strictObject({
  newSave: z.strictObject({
    /** Music on in a new save (off by default: the player turns it on in Settings). */
    musicOn: z.boolean(),
    /** Sound effects on in a new save. */
    sfxOn: z.boolean(),
  }),
});
