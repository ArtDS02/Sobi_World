// content/<area>/area.json — an Area's manifest (ARCHITECTURE §5 Area Contract): who it is, where its
// portal stands in the plaza, when it opens, and how it links to the rest of the world (items it
// produces and consumes). The code side is src/areas/<area>/index.ts.
import { z } from 'zod';
import { assetId, text } from './fields';

export const areaManifestSchema = z.strictObject({
  /** Save key and registry id, e.g. sobi_farm. Never renamed once shipped. */
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  name: z.strictObject({ vi: text }),
  /** The plaza object that leads here (GĐ3). */
  portalInPlaza: z.string().regex(/^[a-z][a-z0-9_]*$/),
  /** Empty = open from the start; otherwise levels of other Areas and World Development. */
  unlock: z.strictObject({
    areaLevels: z.record(z.string(), z.number().int().min(1)).optional(),
    worldDevelopment: z.number().int().min(0).optional(),
  }),
  /** How the player acts inside it (spec §4): `click` = mouse only (Farm, Garden, Aquarium, Cloud); `character` = the character walks (the plaza, Adventure). */
  movement: z.enum(['click', 'character']),
  /** true = the Area's code is not written yet (a later phase): the plaza shows its door closed with the conditions. */
  planned: z.boolean().optional(),
  /** Content file of its scene layout, relative to content/. */
  layout: z.string().regex(/^[a-z_]+\/[a-z0-9_-]+\.json$/).optional(),
  buildings: z.array(z.string().regex(/^[a-z][a-z0-9_]*$/)),
  /** Item ids it makes and uses: the links to other Areas (spec §13 rule 3). */
  produces: z.array(z.string()),
  consumes: z.array(z.string()),
  /** Guide NPC (GĐ6). */
  npc: z.string().regex(/^npc_[a-z0-9_]+$/).optional(),
  /** Art shown on its portal / map card. */
  icon: assetId.optional(),
});

export type AreaManifest = z.infer<typeof areaManifestSchema>;
