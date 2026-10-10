// content/shared/npcs.json — the guide of each Area (spec V2 §9): who they are and what they can explain. The
// texts are the NPC's own words, so they live here (and the admin edits them), not in the string table.
import { z } from 'zod';
import { assetId, text } from '../fields';

export const npcSchema = z.strictObject({
  /** The id the Area manifest names in `npc`. */
  id: z.string().regex(/^npc_[a-z0-9_]+$/),
  /** The Area it guides: its dialog opens in that Area. */
  area: z.string().regex(/^[a-z][a-z0-9_]*$/),
  nameVi: text,
  /** A station NPC stands at one place instead of guiding the whole Area (the Breeder, at the breeding station). */
  station: z.enum(['breeding']).optional(),
  /** Its picture (a manifest id). */
  artId: assetId,
  greetingVi: text,
  topics: z.array(z.strictObject({ id: z.string().regex(/^[a-z][a-z0-9_]*$/), titleVi: text, textVi: text })).min(1),
});

export const npcsFileSchema = z.strictObject({ npcs: z.array(npcSchema) }).superRefine((f, ctx) => {
  const ids = f.npcs.map((n) => n.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) ctx.addIssue({ code: 'custom', message: `duplicate npc id ${dup}` });
  for (const n of f.npcs) {
    const topics = n.topics.map((t) => t.id);
    const d = topics.find((id, i) => topics.indexOf(id) !== i);
    if (d) ctx.addIssue({ code: 'custom', message: `${n.id}: duplicate topic ${d}` });
  }
});
