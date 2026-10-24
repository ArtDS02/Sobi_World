// content/adventure/{maps,props}.json — the exploration areas (spec §3): a grid of tiles (walk / path / bridge / wall / water), the
// props standing on it with their footprint, and everything the player meets: enemy groups, treasure chests, resource spots, element
// gates, springs, travellers, lore stones, a Guardian shrine, the portal and the exits. Where things stand is checked by the game
// (src/areas/adventure/logic/maps.ts): reachable, no dead corner, the main road never behind a gate, footprints the size of the art.
import { z } from 'zod';
import { assetId, posInt, text, unit } from '../fields';
import { element } from './combat';

/** `.` ground, `,` path, `=` bridge (walkable); `#` wall / cliff, `~` water (blocked). */
export const TERRAIN_CHARS = ['.', ',', '=', '#', '~'] as const;

const cell = { x: z.number().int().min(0), y: z.number().int().min(0) };
const id = (prefix: string) => z.string().regex(new RegExp(`^${prefix}_[a-z0-9_]+$`));
const point = z.strictObject(cell);

export const propSchema = z.strictObject({
  id: id('prop_adv'),
  nameVi: text,
  art: assetId,
  /** Footprint in tiles: the whole base of the object as drawn (spec §3.2). */
  w: posInt,
  h: posInt,
  /** Drawn width as a share of the footprint width (0.95–1.2): the art never sits far outside its base. */
  scale: z.number().finite().min(0.95).max(1.2),
});

export const propsFileSchema = z.strictObject({ props: z.array(propSchema) });

export const groupSchema = z.strictObject({
  id: id('g'),
  ...cell,
  /** normal: a fight; elite: the area's guardian (its first defeat lights the area's portal); boss: the zone boss. */
  kind: z.enum(['normal', 'elite', 'boss']),
  pool: z.array(z.strictObject({ weight: posInt, enemies: z.array(z.string().regex(/^enemy_[a-z0-9_]+$/)).min(1).max(4) })).min(1),
  /** Loot table of the boss chest. */
  table: z.string().optional(),
  /** What a guardian or a boss gives at its one defeat (items by id), shown on the battle board (adventure-big-update-1 §13). */
  gift: z.record(z.string().regex(/^item_[a-z0-9_]+$/), posInt).optional(),
});

export const mapSchema = z.strictObject({
  id: id('map'),
  zoneId: id('zone'),
  nameVi: text,
  /** Tile size in design px. */
  tile: posInt,
  cols: posInt,
  rows: posInt,
  terrain: z.array(z.string()),
  /** Where the party stands when it arrives by the portal (or from the camp). */
  spawn: point,
  /** Top-left tile of the 2×2 portal. */
  portal: point,
  /**
   * The teleport gates to the areas around (adventure-big-update-1 §13). `lock: 'guardian'` = it stands behind the area's guardian or
   * boss and opens only once that one is beaten; a gate into another zone also needs that zone open.
   */
  exits: z.array(z.strictObject({ id: id('exit'), ...cell, w: posInt, h: posInt, to: id('map'), arriveX: z.number().int(), arriveY: z.number().int(), lock: z.enum(['guardian']).optional() })),
  props: z.array(z.strictObject({ prop: id('prop_adv'), ...cell })),
  groups: z.array(groupSchema),
  chests: z.array(z.strictObject({ id: id('chest'), ...cell, table: z.string() })),
  nodes: z.array(z.strictObject({ id: z.string().regex(/^(herb|ore)_[a-z0-9_]+$/), ...cell, kind: z.enum(['herb', 'ore']), table: z.string() })),
  gates: z.array(z.strictObject({ id: id('gate'), ...cell, w: posInt, h: posInt, element })),
  springs: z.array(z.strictObject({ id: id('spring'), ...cell })),
  npcs: z.array(z.strictObject({ id: id('npc'), ...cell, event: id('event') })),
  lore: z.array(z.strictObject({ id: id('lore'), ...cell, textVi: text })),
  /** A Guardian shrine: the party's damage of its element rises for the rest of the trip. */
  shrine: z.strictObject({ id: id('shrine'), ...cell, element, damagePct: unit }).optional(),
});

export const mapsFileSchema = z.strictObject({ maps: z.array(mapSchema).min(1) }).superRefine((f, ctx) => {
  const ids = new Set<string>();
  for (const m of f.maps) {
    if (ids.has(m.id)) ctx.addIssue({ code: 'custom', message: `duplicate map ${m.id}` });
    ids.add(m.id);
    if (m.terrain.length !== m.rows) ctx.addIssue({ code: 'custom', message: `${m.id}: ${m.terrain.length} terrain rows, expected ${m.rows}` });
    m.terrain.forEach((row, y) => {
      if (row.length !== m.cols) ctx.addIssue({ code: 'custom', message: `${m.id}: row ${y} has ${row.length} tiles, expected ${m.cols}` });
      const bad = [...row].find((c) => !(TERRAIN_CHARS as readonly string[]).includes(c));
      if (bad) ctx.addIssue({ code: 'custom', message: `${m.id}: row ${y} has an unknown tile '${bad}'` });
    });
  }
  for (const m of f.maps) for (const e of m.exits) if (!ids.has(e.to)) ctx.addIssue({ code: 'custom', message: `${m.id}: exit to unknown map ${e.to}` });
});
