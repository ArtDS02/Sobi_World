// `npm run sim:rift`: how deep the Umbraflux Rift goes (decision 039) for the balanced team of decision 037 at a few levels and gears,
// floor after floor on Auto, under every rule of the day. Prints the median and best floor reached per level, and the coins and
// experience a run brings. Numbers only; tune `content/adventure/engagement.json` (rift) from here.
import { battleAct, closeReport, riftNext, startRift } from '../src/areas/adventure/logic/actions/run';
import { RIFT } from '../src/areas/adventure/logic/config/content';
import { newFighter } from '../src/areas/adventure/logic/fighters';
import { adventureOf, withAdventure } from '../src/areas/adventure/logic/save/lens';
import { adventureArea } from '../src/areas/adventure';
import { SAVE_CODEC } from '../src/app/saveCodec';
import type { RosterEntry } from '../src/core/area-registry/registry';
import { mulberry32 } from '../src/core/rng';
import type { WorldSave } from '../src/core/save/world';
import type { ActionContext } from '../src/core/types';

const DAY = 86_400_000;
const T0 = 20_000 * DAY;
const ctx = (now: number, seed: number): ActionContext => ({ now, rng: mulberry32(seed) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(r.error);
  return r.state as WorldSave;
};

const entry = (id: string, speciesId: string, family: string): RosterEntry => ({
  key: `sobi_farm:${id}`, areaId: 'sobi_farm', id, kind: 'pig', name: id, speciesId, family, rarity: 'RARE', hearts: 3, sick: false, adult: true, purpose: 'ADVENTURE', artId: 'pig_knight',
} as RosterEntry);
/** The balanced team of decision 037: a Metal tanker, a Fire striker, a Light support. */
const roster = [entry('tank', 'PIG_CHEF', 'JOB'), entry('dps', 'PIG_FOOD', 'FOOD'), entry('sup', 'PIG_FUNNY', 'FUNNY')];
const keys = roster.map((e) => e.key);
const GEAR = {
  good: { weapon: 'item_equip_rune_blade', armor: 'item_equip_moss_plate', charm: 'item_equip_sun_amulet' },
  fair: { weapon: 'item_equip_iron_sword', armor: 'item_equip_bark_armor', charm: 'item_equip_wind_feather' },
};

function world(level: number, gear: keyof typeof GEAR): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctx(T0, 1));
  const rich = { ...fresh, progression: { ...fresh.progression, areas: { ...fresh.progression.areas, sobi_farm: { xp: 1_000_000 } } } };
  const w = adventureArea.init(rich, ctx(T0, 1));
  const a = adventureOf(w);
  const fighters = Object.fromEntries(keys.map((k) => [k, { ...newFighter(T0), level, loadout: GEAR[gear] }]));
  return withAdventure({ ...w, inventory: { items: { item_potion_healing: 0 } } }, { ...a, fighters, cleared: { zone_forest: 1, zone_mountain: 1, zone_ruins: 1 } });
}

function run(level: number, gear: keyof typeof GEAR, day: number, seed: number): { floor: number; coins: number; exp: number } {
  const now = T0 + day * DAY;
  let w = ok(startRift(world(level, gear), { keys, roster }, ctx(now, seed)));
  const coins0 = w.wallet.coins;
  for (let floor = 0; floor < 60; floor += 1) {
    const r = adventureOf(w).run;
    if (!r || r.phase !== 'explore' || !r.rift) break;
    w = ok(riftNext(w, ctx(now, seed + floor)));
    for (let i = 0; i < 600 && adventureOf(w).run?.phase === 'battle'; i += 1) w = ok(battleAct(w, { action: 'auto' }, ctx(now, seed + i)));
    if (adventureOf(w).run?.report) w = ok(closeReport(w, ctx(now, seed)));
  }
  const r = adventureOf(w).run!;
  return { floor: r.rift?.floor ?? 0, coins: w.wallet.coins - coins0, exp: r.expGained };
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
console.log(`Rift: perFloor ${RIFT.perFloor}, nightmare ×${RIFT.nightmare}, rest ${RIFT.restPct}`);
for (const gear of ['fair', 'good'] as const) {
  for (const level of [16, 20, 25, 30]) {
    const runs = Array.from({ length: 14 }, (_, i) => run(level, gear, i, 100 + i * 7));
    const floors = runs.map((x) => x.floor);
    console.log(`${gear} gear, level ${level}: median floor ${median(floors)}, best ${Math.max(...floors)}, coins ~${median(runs.map((x) => x.coins))}, exp ~${median(runs.map((x) => Math.round(x.exp)))}`);
  }
}
