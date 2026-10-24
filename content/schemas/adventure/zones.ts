// content/adventure/zones.json — the zones (spec §3): each is three areas (maps.json) walked in order, its gate (level, the zone before
// it); the loot tables (treasure chests, bosses, small resource spots) and the small events met at a traveller or an altar.
import { z } from 'zod';
import { assetId, itemId, nonNeg, posInt, range, text, unit } from '../fields';

export const zoneSchema = z.strictObject({
  id: z.string().regex(/^zone_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  /** Sobi World level needed to enter. */
  fromWorldLevel: posInt,
  /** The zone whose boss must have been beaten first (GĐ11); absent = open at that level. */
  requiresCleared: z.string().regex(/^zone_[a-z0-9_]+$/).optional(),
  /** The picture of the zone on the camp's card. */
  backdrop: assetId,
  /** The fighter levels it suits [from, to] (the advice after a lost trip). */
  levels: range,
  /** Its areas in walking order; the first one holds the entrance portal, the last one the zone boss. */
  maps: z.array(z.string().regex(/^map_[a-z0-9_]+$/)).min(1),
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
    const zoneIds = new Set(f.zones.map((z) => z.id));
    for (const z of f.zones) if (z.requiresCleared && !zoneIds.has(z.requiresCleared)) ctx.addIssue({ code: 'custom', message: `${z.id}: unknown zone ${z.requiresCleared}` });
    for (const e of f.events) if (e.table && !f.tables[e.table]) ctx.addIssue({ code: 'custom', message: `${e.id}: unknown table ${e.table}` });
    for (const [id, t] of Object.entries(f.tables)) for (const entry of t.entries) if (entry.max < entry.min) ctx.addIssue({ code: 'custom', message: `${id}: entry max < min` });
  });
