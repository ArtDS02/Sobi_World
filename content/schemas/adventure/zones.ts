// content/adventure/zones.json — the zones (a chain of event nodes and a boss), the loot tables and the small events.
import { z } from 'zod';
import { assetId, itemId, nonNeg, posInt, range, text, unit } from '../fields';

const enemyId = z.string().regex(/^enemy_[a-z0-9_]+$/);

const battlePool = z.array(z.strictObject({ weight: posInt, enemies: z.array(enemyId).min(1).max(4) })).min(1);

export const nodeSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('battle'), pool: battlePool }),
  z.strictObject({ type: z.literal('chest'), table: z.string().min(1) }),
  z.strictObject({ type: z.literal('event'), events: z.array(z.string().regex(/^event_[a-z0-9_]+$/)).min(1) }),
  z.strictObject({ type: z.literal('boss'), enemies: z.array(enemyId).min(1).max(4), table: z.string().min(1) }),
]);

export const zoneSchema = z.strictObject({
  id: z.string().regex(/^zone_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  /** Sobi World level needed to enter. */
  fromWorldLevel: posInt,
  backdrop: assetId,
  nodes: z.array(nodeSchema).min(2),
});

export const lootEntrySchema = z.strictObject({ itemId, weight: posInt, min: posInt, max: posInt });

export const lootTableSchema = z.strictObject({
  /** Items drawn (with replacement) by weight. */
  rolls: z.number().int().min(0),
  coins: range,
  gemChance: unit,
  gems: range,
  entries: z.array(lootEntrySchema),
});

export const eventSchema = z.strictObject({
  id: z.string().regex(/^event_[a-z0-9_]+$/),
  nameVi: text,
  textVi: text,
  /** Heals every fighter by this share of its max HP. */
  healPct: unit,
  /** Hurts every fighter by this share of its max HP (never to 0). */
  damagePct: unit,
  /** Experience to every fighter of the team. */
  exp: nonNeg,
  /** A loot table drawn when it happens, or null. */
  table: z.string().nullable(),
});

export const zonesFileSchema = z
  .strictObject({
    zones: z.array(zoneSchema).min(1),
    tables: z.record(z.string(), lootTableSchema),
    events: z.array(eventSchema).min(1),
  })
  .superRefine((f, ctx) => {
    const events = new Set(f.events.map((e) => e.id));
    for (const z of f.zones) {
      if (z.nodes.at(-1)?.type !== 'boss') ctx.addIssue({ code: 'custom', message: `${z.id}: the last node must be the boss` });
      for (const n of z.nodes) {
        if ((n.type === 'chest' || n.type === 'boss') && !f.tables[n.table]) ctx.addIssue({ code: 'custom', message: `${z.id}: unknown table ${n.table}` });
        if (n.type === 'event') for (const e of n.events) if (!events.has(e)) ctx.addIssue({ code: 'custom', message: `${z.id}: unknown event ${e}` });
      }
    }
    for (const e of f.events) if (e.table && !f.tables[e.table]) ctx.addIssue({ code: 'custom', message: `${e.id}: unknown table ${e.table}` });
    for (const [id, t] of Object.entries(f.tables)) for (const entry of t.entries) if (entry.max < entry.min) ctx.addIssue({ code: 'custom', message: `${id}: entry max < min` });
  });
