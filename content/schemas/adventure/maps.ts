// content/adventure/{maps,props}.json — the exploration areas (spec §3): a grid of tiles (walk / path / bridge / wall / water), the
// props standing on it with their footprint, and everything the player meets: enemy groups, treasure chests, resource spots, element
// gates, springs, travellers, lore stones, a Guardian shrine, the portal and the exits. Where things stand is checked by the game
// (src/areas/adventure/logic/maps.ts): reachable, no dead corner, the main road never behind a gate, footprints the size of the art.
import { z } from 'zod';
import { assetId, posInt, text, unit } from '../fields';
import { element } from './combat';

/**
 * `.` ground, `,` path, `=` bridge, `^` raised ground, `s` steps up a cliff, `c` corrupted ground (walkable); `#` wall / dense mass,
 * `~` water, `F` cliff face or rim, `w` waterfall (blocked). The last five came with the map layouts v2 (decision 045).
 */
export const TERRAIN_CHARS = ['.', ',', '=', '#', '~', '^', 's', 'c', 'F', 'w'] as const;

/** How an overhead cover looks (decision 045). */
export const COVER_LOOKS = ['canopy', 'rock', 'roof'] as const;
/** How an element gate looks: its element's gate (default) or a false wall with a crack. */
export const GATE_LOOKS = ['gate', 'crack'] as const;

/** The kinds of treasure chest (decision 045); a false chest is an enemy group (`disguise: 'chest'`). */
export const CHEST_TYPES = ['wood', 'silver', 'gold', 'hidden'] as const;

/** What keeps an exit shut (decision 043). */
export const EXIT_LOCKS = ['guardian', 'shortcut'] as const;
/** How an exit looks: a teleport gate (default), a trail through trees, a cave mouth, a bridge, stairs, a shore, a tunnel. */
export const EXIT_KINDS = ['gate', 'trail', 'cave', 'bridge', 'stairs', 'shore', 'tunnel'] as const;
/** How the party faces. */
export const FACINGS = ['up', 'down', 'left', 'right'] as const;
/** The id of an area's own spawn (`map.spawn`) when an exit lands on it (decision 047). */
export const DEFAULT_SPAWN = 'spawn_default';

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
  /** A special group dressed as a treasure chest (a mimic) until the party touches it. */
  disguise: z.enum(['chest']).optional(),
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
  /** How far the Umbraflux has spread here, 0–100 % (decision 045): the tint and the dust of the area; beating the zone boss lowers it. */
  corruption: z.number().int().min(0).max(100).default(0),
  /** Tile size in design px. */
  tile: posInt,
  cols: posInt,
  rows: posInt,
  terrain: z.array(z.string()),
  /** Where the party stands when it arrives by the portal (or from the camp); exits name it `spawn_default`. */
  spawn: point,
  /**
   * Named arrival points (decision 047): where the party lands coming in by an exit (`exits[].arrive` of the area it comes from), how it
   * faces then. The game reads the exit's own `arriveX/Y`; these keep the arrivals named and the same for every exit using them.
   */
  spawns: z.array(z.strictObject({ id: id('spawn'), nameVi: text, ...cell, facing: z.enum(FACINGS).optional() })).optional(),
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
      facing: z.enum(FACINGS).optional(),
      kind: z.enum(EXIT_KINDS).optional(),
      /** The spawn of `to` it lands on (decision 047): `arriveX/Y` and `facing` must then be that spawn's (the builder writes them). */
      arrive: id('spawn').optional(),
    }),
  ),
  props: z.array(z.strictObject({ prop: id('prop_adv'), ...cell })),
  groups: z.array(groupSchema),
  /** Treasure chests; `type` (decision 045): wood (common), silver (behind a guardian), gold (after a subboss), hidden (under a cover). */
  chests: z.array(z.strictObject({ id: id('chest'), ...cell, table: z.string(), type: z.enum(CHEST_TYPES).optional() })),
  nodes: z.array(z.strictObject({ id: z.string().regex(/^(herb|ore)_[a-z0-9_]+$/), ...cell, kind: z.enum(['herb', 'ore']), table: z.string() })),
  /** Element gates; `look: 'crack'` = a false wall (decision 045): it looks like the wall around it, with a crack, until opened. */
  gates: z.array(z.strictObject({ id: id('gate'), ...cell, w: posInt, h: posInt, element, look: z.enum(GATE_LOOKS).optional() })),
  /**
   * Overhead cover over a hidden place (decision 045): tree tops, a rock overhang, a fallen roof. The tiles under it walk as their
   * terrain says; the cover hides what is beneath and fades when the party steps in, and the first time counts as a secret found.
   */
  covers: z.array(z.strictObject({ id: id('cover'), ...cell, w: posInt, h: posInt, look: z.enum(COVER_LOOKS) })).default([]),
  /**
   * Element puzzles (decision 045): a brazier, a rod, a wheel… lit with Space by a companion of its element. Once every puzzle of a gate
   * is lit, that gate opens by itself (it cannot be opened by its element alone).
   */
  puzzles: z.array(z.strictObject({ id: id('puzzle'), ...cell, element, gate: id('gate') })).default([]),
  springs: z.array(z.strictObject({ id: id('spring'), ...cell })),
  npcs: z.array(z.strictObject({ id: id('npc'), ...cell, event: id('event') })),
  lore: z.array(z.strictObject({ id: id('lore'), ...cell, textVi: text })),
  /** A Guardian shrine: the party's damage of its element rises for the rest of the trip. */
  shrine: z.strictObject({ id: id('shrine'), ...cell, element, damagePct: unit }).optional(),
  /**
   * The area painted as one continuous 3/4 picture (docs/maps/v3/M2_PLAN.md): the manifest stem of its background, cut into
   * `chunks` [columns, rows] named `<art>_c<col><row>`, `px` source px per tile; `elevation` = height 0–9 per tile (presentation only).
   * Absent = the area is drawn from its tiles as before. `terrain` stays what the party walks on either way.
   */
  scene: z
    .strictObject({
      art: z.string().regex(/^bg_adv_v3_[a-z0-9_]+$/),
      px: posInt,
      chunks: z.tuple([posInt, posInt]),
      elevation: z.array(z.string().regex(/^[0-9]+$/)).optional(),
    })
    .optional(),
});

type MapRow = z.infer<typeof mapSchema>;

/** A named spawn of an area: `spawn_default` is the area's own spawn. */
export function spawnIn(map: Pick<MapRow, 'spawn' | 'spawns'>, spawnId: string): { x: number; y: number; facing?: (typeof FACINGS)[number] } | undefined {
  return spawnId === DEFAULT_SPAWN ? map.spawn : map.spawns?.find((s) => s.id === spawnId);
}

/** An exit naming its spawn lands exactly there (decision 047): the spawn exists, `arriveX/Y` and `facing` are its own. */
export function arrivalProblems(e: MapRow['exits'][number], dest: Pick<MapRow, 'id' | 'spawn' | 'spawns'>): string[] {
  if (!e.arrive) return [];
  const s = spawnIn(dest, e.arrive);
  if (!s) return [`exit ${e.id} lands on spawn ${e.arrive}, which ${dest.id} does not have`];
  const out: string[] = [];
  if (s.x !== e.arriveX || s.y !== e.arriveY) out.push(`exit ${e.id} lands at ${e.arriveX},${e.arriveY} but its spawn ${e.arrive} is at ${s.x},${s.y}`);
  if (s.facing && s.facing !== e.facing) out.push(`exit ${e.id} faces ${e.facing ?? '(default)'} but its spawn ${e.arrive} faces ${s.facing}`);
  return out;
}

/** The grid of one area against its size: rows × cols of known tiles, the elevation the same size (also run on a builder draft). */
export function mapShapeProblems(m: Pick<MapRow, 'id' | 'cols' | 'rows' | 'terrain' | 'scene' | 'spawns'>): string[] {
  const out: string[] = [];
  if (m.terrain.length !== m.rows) out.push(`${m.id}: ${m.terrain.length} terrain rows, expected ${m.rows}`);
  m.terrain.forEach((row, y) => {
    if (row.length !== m.cols) out.push(`${m.id}: row ${y} has ${row.length} tiles, expected ${m.cols}`);
    const bad = [...row].find((c) => !(TERRAIN_CHARS as readonly string[]).includes(c));
    if (bad) out.push(`${m.id}: row ${y} has an unknown tile '${bad}'`);
  });
  const elevation = m.scene?.elevation;
  if (elevation && (elevation.length !== m.rows || elevation.some((row) => row.length !== m.cols))) out.push(`${m.id}: scene.elevation must be ${m.rows} rows of ${m.cols}`);
  const spawnIds = new Set<string>();
  for (const sp of m.spawns ?? []) {
    if (sp.id === DEFAULT_SPAWN || spawnIds.has(sp.id)) out.push(`${m.id}: spawn ${sp.id} is taken`);
    spawnIds.add(sp.id);
  }
  return out;
}

export const mapsFileSchema = z.strictObject({ maps: z.array(mapSchema).min(1) }).superRefine((f, ctx) => {
  const ids = new Set<string>();
  for (const m of f.maps) {
    if (ids.has(m.id)) ctx.addIssue({ code: 'custom', message: `duplicate map ${m.id}` });
    ids.add(m.id);
    for (const message of mapShapeProblems(m)) ctx.addIssue({ code: 'custom', message });
  }
  const exitIds = new Set<string>();
  const byId = new Map(f.maps.map((m) => [m.id, m]));
  for (const m of f.maps) {
    for (const e of m.exits) {
      if (!ids.has(e.to)) ctx.addIssue({ code: 'custom', message: `${m.id}: exit to unknown map ${e.to}` });
      if (exitIds.has(e.id)) ctx.addIssue({ code: 'custom', message: `duplicate exit ${e.id}` });
      exitIds.add(e.id);
      const dest = byId.get(e.to);
      if (e.arrive && dest) for (const message of arrivalProblems(e, dest)) ctx.addIssue({ code: 'custom', message: `${m.id}: ${message}` });
    }
  }
});
