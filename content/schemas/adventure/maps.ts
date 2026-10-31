// content/adventure/{maps,props}.json — the exploration areas (spec §3): a grid of tiles (walk / path / bridge / wall / water), the
// props standing on it with their footprint, and everything the player meets: enemy groups, treasure chests, resource spots, element
// gates, springs, travellers, lore stones, a Guardian shrine, the portal and the exits. Where things stand is checked by the game
// (src/areas/adventure/logic/maps.ts): reachable, no dead corner, the main road never behind a gate, footprints the size of the art.
import { z } from 'zod';
import { assetId, posInt, text, unit } from '../fields';
import { element } from './combat';

/** `.` ground, `,` path, `=` bridge (walkable); `#` wall / cliff, `~` water (blocked). */
export const TERRAIN_CHARS = ['.', ',', '=', '#', '~'] as const;

/** What keeps an exit shut (decision 043). */
export const EXIT_LOCKS = ['guardian', 'shortcut'] as const;
/** How an exit looks: a teleport gate (default), a trail through trees, a cave mouth, a bridge, stairs, a shore, a tunnel. */
export const EXIT_KINDS = ['gate', 'trail', 'cave', 'bridge', 'stairs', 'shore', 'tunnel'] as const;

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

/**
 * The six classes of enemy group (decision 045): normal fills the area; elite is the area's guardian (its first defeat lights the
 * area's portal and opens the gates behind it); mutant grows a second element; subboss is an optional hard fight; boss is the zone
 * boss; special is a chimera met only on some days. Elite, subboss, boss and special are beaten for good.
 */
export const FOE_CLASSES = ['normal', 'elite', 'mutant', 'subboss', 'boss', 'special'] as const;
/** When a special group shows: on a rainy day, or at night. */
export const FOE_WHEN = ['rain', 'night'] as const;

export const groupSchema = z.strictObject({
  id: id('g'),
  ...cell,
  kind: z.enum(FOE_CLASSES),
  /** Corruption 1–5 (decision 045): stronger and darker the higher it is; absent = the class's own level. */
  corruption: z.number().int().min(1).max(5).optional(),
  /** Asleep instead of standing guard: the party may tiptoe past, and touching it gives the party the first move. */
  sleep: z.boolean().optional(),
  /** A special group shows only then. */
  when: z.enum(FOE_WHEN).optional(),
  /** The second element a mutant or a special grows (absent = the class table's pick for its first element). */
  element2: element.optional(),
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
   * The ways to the areas around (adventure-big-update-1 §13, decision 043). `lock: 'guardian'` = it stands behind the area's guardian
   * or boss and opens only once that one is beaten; `lock: 'shortcut'` = shut until the party walks the way back from the other side;
   * a way into another zone also needs that zone open. `facing` = how the party faces on arrival; `kind` = how the threshold looks.
   */
  exits: z.array(
    z.strictObject({
      id: id('exit'),
      ...cell,
      w: posInt,
      h: posInt,
      to: id('map'),
      arriveX: z.number().int(),
      arriveY: z.number().int(),
      lock: z.enum(EXIT_LOCKS).optional(),
      facing: z.enum(['up', 'down', 'left', 'right']).optional(),
      kind: z.enum(EXIT_KINDS).optional(),
    }),
  ),
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
  const exitIds = new Set<string>();
  for (const m of f.maps) {
    for (const e of m.exits) {
      if (!ids.has(e.to)) ctx.addIssue({ code: 'custom', message: `${m.id}: exit to unknown map ${e.to}` });
      if (exitIds.has(e.id)) ctx.addIssue({ code: 'custom', message: `duplicate exit ${e.id}` });
      exitIds.add(e.id);
    }
  }
});
