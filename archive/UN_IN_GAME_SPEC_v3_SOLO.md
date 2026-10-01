# UN IN HOMEMADE — SOLO EDITION
## Implementation Specification v3.0

**Document type:** Game design + technical specification for an AI coding agent
**Target:** Progressive Web App (PWA) — desktop browser + mobile browser, installable, works fully offline after first load
**Scope:** Single player only. No server, no accounts, no friends/social, no network calls at runtime.
**In-game language:** Vietnamese (default). All player-facing strings live in one i18n file.
**Goal:** An original, relaxing pig-farming game inspired by classic pig/farm social-game mechanics, with all data stored on the player's own device.

---

# 0. IMPLEMENTATION CONTRACT

This document is the source of truth. The coding AI MUST:

- Read the whole document before writing code.
- Implement rules exactly as written. Do not invent core gameplay rules that are defined here.
- Treat every item marked **[D#]** in Section 2 as a fixed decision.
- When something is genuinely undefined, choose the simplest option and record it in `README.md` under "Implementation assumptions".
- Keep all gameplay logic in `src/core/` as pure TypeScript (see Section 4).
- Not add: backend, database server, accounts, analytics, ads, monetization, multiplayer, or network requests.
- Use original or generated placeholder assets only. Never copy sprites, sounds, logos, UI or code from the original game.
- Not start Section 19 (Optional Backlog) unless explicitly asked.

---

# 1. PRODUCT OVERVIEW

## 1.1 Core loop

```text
Buy pig → Feed → Clean → Keep healthy → Grow
   → Breed adults → Raise offspring (rarer breeds)
   → Sell adults → Earn gold + XP → Level up
   → Unlock more pig slots → Repeat with better breeds
```

## 1.2 Design priorities

1. Fun and understandable gameplay
2. Reliable local save that never silently loses data
3. Correct time simulation (works after hours/days away)
4. Fast, responsive UI on phone and PC
5. Simple maintainable code with pure, testable game logic
6. Easy to expand later

---

# 2. DECISIONS REGISTER

Fixed decisions. Status **CONFIRMED** = taken from the original spec. **PROPOSED** = new value added in v3 to fill a gap; the designer may change it, but the coding AI must implement it as written.

| ID | Decision | Status |
|---|---|---|
| D1 | Platform is a PWA (web), one codebase for PC + mobile. | PROPOSED |
| D2 | No backend. Save data lives in `localStorage` as one versioned JSON document, plus JSON export/import. | PROPOSED |
| D3 | `growthStage` is **derived** from `growthProgress`, never stored: BABY `< 30`, YOUNG `30 ≤ p < 100`, ADULT `= 100`. | PROPOSED |
| D4 | `ADULT_MAX` is removed. ADULT is the final stage. Hunger/cleanliness keep decaying in every stage. | PROPOSED |
| D5 | Sickness uses a time-based exponential model (Section 7), not "5% per tick". | PROPOSED |
| D6 | When buying a pig, the player chooses its gender. Newborn gender is 50/50 random. | PROPOSED |
| D7 | Starter kit: 5000 gold, 0 pigs, 5 × FOOD_BASIC, 1 × MEDICINE_COMMON, 4 slots. | PROPOSED |
| D8 | A pregnancy **reserves a pig slot** at breeding time. `BIRTH_PENDING` no longer exists; birth can never fail. | PROPOSED |
| D9 | Breeding matrix is completed with extra combinations (Section 6.4). | PROPOSED |
| D10 | `PIG_MYTHICAL` cannot breed in MVP (returns `BREEDING_COMBINATION_NOT_SUPPORTED`). | PROPOSED |
| D11 | XP for feed/clean is only awarded when the action is effective (anti-spam). | PROPOSED |
| D12 | Level cap 10. Extra pig slots (5–12) are bought with gold and gated by level. | PROPOSED |
| D13 | `level` is derived from `xp`, never stored. | PROPOSED |
| D14 | Clock handling: `deltaSeconds = max(0, now − lastTickedAt)`; if the device clock moved backwards, resync `lastTickedAt = now` with no state change. | PROPOSED |
| D15 | Server-authoritative rules of v2 are dropped. The client is trusted. No anti-cheat, rate limiting or auth. | PROPOSED |

---

# 3. TECHNOLOGY STACK

- TypeScript (strict mode), Vite
- Phaser 3 — farm world, pigs, animations, effects only
- Plain DOM/CSS overlays for all menus, panels, modals (TailwindCSS or lightweight CSS allowed)
- `zod` — validate save data on load/import
- `vite-plugin-pwa` — manifest + service worker
- Vitest — unit/integration tests; Playwright — one optional smoke test
- No Node/Express/MongoDB/Socket.io/Docker in this edition

Architecture:

```text
Browser
 ├── DOM UI  ─┐
 ├── Phaser  ─┼──► gameStore ──► core (pure functions) ──► SaveGame
 └── Audio   ─┘                          │
                                  localStorage (save + backup)
```

Data flow for every gameplay action:

```text
UI click → gameStore.dispatch(action)
        → advanceWorld(state, now)        // catch up time first
        → action(state, args, {now, rng}) // validate + mutate immutably
        → save to localStorage            // synchronously
        → notify UI/Phaser + play events (toast/sound/animation)
```

---

# 4. DIRECTORY STRUCTURE

```text
un-in-homemade/
├── public/
│   ├── icons/                # pwa-192.png, pwa-512.png
│   └── assets/{backgrounds,sprites,ui,icons,audio,effects}/
├── src/
│   ├── core/                 # PURE TypeScript. No DOM, no Phaser,
│   │   │                     # no Date.now(), no Math.random() inside.
│   │   ├── config/           # breeds, items, breedingMatrix, levels, balance, errors
│   │   ├── engine/           # advancePig, advanceWorld, pricing, breeding
│   │   ├── actions/          # feedPig, cleanPig, treatPig, buyPig, sellPig,
│   │   │                     # breedPigs, buySlot, renamePig
│   │   ├── save/             # schema, migrate, storage, exportImport
│   │   ├── rng.ts            # Rng interface, seeded rng (tests), default rng
│   │   ├── clock.ts          # Clock interface (real + fake)
│   │   ├── events.ts         # GameEvent types
│   │   └── types.ts
│   ├── store/gameStore.ts    # holds state, dispatches actions, persists, notifies
│   ├── game/                 # Phaser: scenes/, prefabs/, config/
│   ├── ui/                   # DOM components/screens
│   ├── i18n/vi.ts
│   └── main.ts
├── tests/{unit,e2e}/
├── scripts/simulate-economy.ts
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

Rule: `src/core/` must never import from `game/`, `ui/`, `store/` or any browser API. `now` and `rng` are always injected.

---

# 5. DATA MODEL

All timestamps are epoch milliseconds (number). Storage key: `un-in-homemade:save`. Backup key: `un-in-homemade:save:backup`.

```ts
type Gender = "MALE" | "FEMALE";
type BreedId = "PIG_EARTH_PINK" | "PIG_STRIPED_MELON" | "PIG_SUPERMAN" | "PIG_MYTHICAL";
type ItemId = "FOOD_BASIC" | "MEDICINE_COMMON";
type GrowthStage = "BABY" | "YOUNG" | "ADULT";          // derived, never stored

interface SaveGame {
  schemaVersion: 1;
  createdAt: number;
  updatedAt: number;
  player: { gold: number; xp: number; unlockedSlots: number };
  pigs: Pig[];
  inventory: Record<ItemId, number>;
  transactions: Transaction[];        // newest first, keep max 200
  breedingRecords: BreedingRecord[];  // newest first, keep max 100
  settings: {
    musicOn: boolean;
    sfxOn: boolean;
    tutorialDone: boolean;
    lastExportAt: number | null;
  };
}

interface Pig {
  id: string;                         // uuid
  slotIndex: number;                  // unique, 0 ≤ slotIndex < unlockedSlots
  breed: BreedId;
  name: string;                       // 1–16 chars
  gender: Gender;
  growthProgress: number;             // 0–100
  hunger: number;                     // 0–100 (float internally, floor for display)
  cleanliness: number;                // 0–100
  isSick: boolean;
  pregnancy: null | {
    startedAt: number;
    endsAt: number;
    fatherId: string;
    childBreed: BreedId;              // decided at breeding time
    childGender: Gender;              // decided at breeding time
  };
  lastTickedAt: number;
  createdAt: number;
}

interface Transaction {
  id: string;
  at: number;
  type: "INITIAL_GOLD" | "SHOP_PURCHASE" | "PIG_PURCHASE" | "PIG_SELL"
      | "BREEDING_FEE" | "SLOT_PURCHASE";
  amount: number;                     // signed gold delta
  refId?: string;
  note?: string;                      // e.g. "PIG_SUPERMAN sold (sick)"
}

interface BreedingRecord {
  id: string;
  at: number;
  motherId: string;
  fatherId: string;
  motherBreed: BreedId;
  fatherBreed: BreedId;
  childBreed: BreedId;
  childGender: Gender;
  bornAt: number | null;              // null until birth
}
```

Derived (never stored): `growthStage`, `weight`, `level`, `freeSlots`.

```text
weight    = 1 + (maxWeight − 1) × growthProgress / 100          (display only)
level     = highest level whose xp threshold ≤ player.xp
freeSlots = unlockedSlots − pigs.length − count(pigs where pregnancy != null)
```

A pregnant pig already occupies its own slot; the extra subtraction reserves a slot for the **unborn child** (D8).

Invariants (enforced by validation on load and covered by tests): no negative gold/inventory; `slotIndex` unique and `< unlockedSlots`; `0 ≤ hunger, cleanliness ≤ 100`; `0 ≤ growthProgress ≤ 100`; `pigs.length + pregnantCount ≤ unlockedSlots`.

---

# 6. CONFIGURATION (single source of truth)

All numbers below live in `src/core/config/`. No magic numbers elsewhere. Values marked TUNABLE are expected to change during balancing.

## 6.1 Breeds

| Breed ID | Name (vi) | Buy | Sell (adult, healthy) | Growth (BABY→ADULT) | Max weight | Breedable |
|---|---|---:|---:|---:|---:|---|
| PIG_EARTH_PINK | Heo Hồng Đất | 500 | 1,200 | 7,200 s | 50 kg | yes |
| PIG_STRIPED_MELON | Heo Sọc Dưa | — | 3,000 | 14,400 s | 80 kg | yes |
| PIG_SUPERMAN | Heo Siêu Nhân | — | 12,000 | 28,800 s | 120 kg | yes |
| PIG_MYTHICAL | Heo Thần Thoại | — | 50,000 | 86,400 s | 250 kg | **no (D10)** |

Only PIG_EARTH_PINK can be bought. Other breeds come from breeding.

## 6.2 Items

| Item | Price | Effect |
|---|---:|---|
| FOOD_BASIC | 20 | hunger +20 (capped at 100) |
| MEDICINE_COMMON | 100 | cures sickness |

## 6.3 Balance constants (TUNABLE)

```ts
export const BALANCE = {
  START_GOLD: 5000,
  START_SLOTS: 4,
  START_INVENTORY: { FOOD_BASIC: 5, MEDICINE_COMMON: 1 },

  HUNGER_MAX: 100,
  HUNGER_DECAY_PER_SEC: 5 / 600,        // −5 per 10 minutes
  CLEAN_MAX: 100,
  CLEAN_DECAY_PER_SEC: 3 / 900,         // −3 per 15 minutes

  STAGE_YOUNG_AT: 30,                   // growthProgress
  SICK_CLEAN_THRESHOLD: 30,             // sickness risk when cleanliness < 30
  SICK_CHANCE_PER_INTERVAL: 0.05,       // 5% …
  SICK_INTERVAL_SEC: 600,               // … per 10 minutes of exposure
  SICK_PRICE_MULTIPLIER: 0.5,

  BREEDING_FEE: 200,
  PREGNANCY_SEC: 3600,

  XP_EFFECTIVE_FEED_MAX_HUNGER: 80,     // feed gives XP only if hunger ≤ 80 before feeding
  XP_EFFECTIVE_CLEAN_MAX_CLEAN: 70,     // clean gives XP only if cleanliness ≤ 70 before cleaning
  XP: { FEED: 2, CLEAN: 2, SELL: 10, BREED: 15 },

  MAX_LEVEL: 10,
  LEVEL_XP: [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700], // index = level − 1

  MAX_SLOTS: 12,
  // slot number (1-based) → { cost, requiredLevel }
  SLOT_UNLOCKS: {
    5:  { cost: 2000,  level: 2 },
    6:  { cost: 4000,  level: 3 },
    7:  { cost: 7000,  level: 4 },
    8:  { cost: 12000, level: 5 },
    9:  { cost: 20000, level: 6 },
    10: { cost: 32000, level: 7 },
    11: { cost: 50000, level: 8 },
    12: { cost: 80000, level: 9 },
  },
} as const;
```

**Balance note for playtesting:** with the defaults above, one full hunger bar (100) lasts 200 minutes, which is longer than the 120-minute growth time of PIG_EARTH_PINK. A pink pig therefore reaches adulthood without any feeding. Feeding only becomes necessary for the slower breeds. Do not change these values on your own; expose them via `BALANCE` so the designer can tune them, and use `npm run sim:economy` (Section 15.5) to compare.

## 6.4 Breeding matrix

Keys are canonical: the two breed IDs sorted alphabetically and joined with `:`. The matrix is symmetric by construction (`A+B == B+A`). Weights sum to 100.

| Parents | Results | Status |
|---|---|---|
| PINK + PINK | 90% PINK, 10% STRIPED | CONFIRMED |
| STRIPED + STRIPED | 75% STRIPED, 20% PINK, 5% SUPERMAN | CONFIRMED |
| STRIPED + SUPERMAN | 60% STRIPED, 35% SUPERMAN, 5% MYTHICAL | CONFIRMED |
| PINK + STRIPED | 55% PINK, 43% STRIPED, 2% SUPERMAN | PROPOSED |
| PINK + SUPERMAN | 45% PINK, 45% STRIPED, 10% SUPERMAN | PROPOSED |
| SUPERMAN + SUPERMAN | 55% SUPERMAN, 35% STRIPED, 10% MYTHICAL | PROPOSED |
| anything with MYTHICAL | not supported (D10) | PROPOSED |

```ts
export const BREEDING_MATRIX: Record<string, { breed: BreedId; weight: number }[]> = {
  "PIG_EARTH_PINK:PIG_EARTH_PINK": [
    { breed: "PIG_EARTH_PINK", weight: 90 },
    { breed: "PIG_STRIPED_MELON", weight: 10 },
  ],
  "PIG_EARTH_PINK:PIG_STRIPED_MELON": [
    { breed: "PIG_EARTH_PINK", weight: 55 },
    { breed: "PIG_STRIPED_MELON", weight: 43 },
    { breed: "PIG_SUPERMAN", weight: 2 },
  ],
  "PIG_EARTH_PINK:PIG_SUPERMAN": [
    { breed: "PIG_EARTH_PINK", weight: 45 },
    { breed: "PIG_STRIPED_MELON", weight: 45 },
    { breed: "PIG_SUPERMAN", weight: 10 },
  ],
  "PIG_STRIPED_MELON:PIG_STRIPED_MELON": [
    { breed: "PIG_STRIPED_MELON", weight: 75 },
    { breed: "PIG_EARTH_PINK", weight: 20 },
    { breed: "PIG_SUPERMAN", weight: 5 },
  ],
  "PIG_STRIPED_MELON:PIG_SUPERMAN": [
    { breed: "PIG_STRIPED_MELON", weight: 60 },
    { breed: "PIG_SUPERMAN", weight: 35 },
    { breed: "PIG_MYTHICAL", weight: 5 },
  ],
  "PIG_SUPERMAN:PIG_SUPERMAN": [
    { breed: "PIG_SUPERMAN", weight: 55 },
    { breed: "PIG_STRIPED_MELON", weight: 35 },
    { breed: "PIG_MYTHICAL", weight: 10 },
  ],
};
```

Lookup helper: `matrixKey(a, b) = [a, b].sort().join(":")`. Undefined combination → error `BREEDING_COMBINATION_NOT_SUPPORTED`. Never fall back silently. Random selection uses the injected `rng`.

---

# 7. TIME SIMULATION ENGINE

No per-pig timers. State is reconstructed from timestamps, so the game behaves identically after a refresh, closing the browser, or days away.

## 7.1 When to advance state

`advanceWorld(state, now, rng)` MUST be called:
- on app load,
- when the tab becomes visible again (`visibilitychange`),
- before every action (so validation uses fresh state),
- on one global UI interval (every 1 s while the app is visible; a single interval, not one per pig).

It is cheap (≤ 12 pigs) and idempotent for the same `now`.

## 7.2 `advancePig` — piecewise, not "one big delta"

The v2 reference implementation applied growth for the whole delta even if hunger hit 0 halfway through. v3 computes exactly how long the pig was allowed to grow.

```ts
export function advancePig(pig: Pig, now: number, rng: Rng): Pig {
  const dt = (now - pig.lastTickedAt) / 1000;
  if (dt <= 0) return { ...pig, lastTickedAt: now };            // D14 (clock backwards or same instant)

  const cfg = BREEDS[pig.breed];
  const hungerRate = BALANCE.HUNGER_DECAY_PER_SEC;
  const cleanRate  = BALANCE.CLEAN_DECAY_PER_SEC;

  // Seconds (from lastTickedAt) at which thresholds are crossed
  const tHungerZero = pig.hunger / hungerRate;
  const tCleanBelow = pig.cleanliness > BALANCE.SICK_CLEAN_THRESHOLD
    ? (pig.cleanliness - BALANCE.SICK_CLEAN_THRESHOLD) / cleanRate
    : 0;

  // D5 — sickness onset, memoryless (independent of how often this function is called)
  let tSick = Infinity;
  if (!pig.isSick) {
    const exposure = dt - tCleanBelow;                           // seconds spent with cleanliness < 30
    if (exposure > 0) {
      const lambda = -Math.log(1 - BALANCE.SICK_CHANCE_PER_INTERVAL) / BALANCE.SICK_INTERVAL_SEC;
      const sample = -Math.log(1 - rng.next()) / lambda;         // rng.next() ∈ [0, 1)
      if (sample < exposure) tSick = tCleanBelow + sample;
    }
  }

  // Growth: only while fed, healthy, and not yet adult
  let growthSeconds = 0;
  if (!pig.isSick && pig.growthProgress < 100) {
    const tToAdult = (100 - pig.growthProgress) * cfg.growthSeconds / 100;
    growthSeconds = Math.min(dt, tHungerZero, tSick, tToAdult);
  }

  const growthProgress = Math.min(100, pig.growthProgress + growthSeconds * 100 / cfg.growthSeconds);

  return {
    ...pig,
    hunger: Math.max(0, pig.hunger - hungerRate * dt),
    cleanliness: Math.max(0, pig.cleanliness - cleanRate * dt),
    growthProgress: growthProgress > 99.999999 ? 100 : growthProgress,
    isSick: pig.isSick || tSick <= dt,
    lastTickedAt: now,
  };
}
```

Rules:
- Sickness freezes growth, blocks breeding, and halves sell price. Cleaning does not cure it; only medicine does.
- Hunger `<= 0` freezes growth. Hunger and cleanliness never go below 0 or above 100.
- Adults keep decaying (D4) and can get sick; they simply have `growthProgress = 100`.
- Pregnancy does not change decay rules.

## 7.3 `advanceWorld`

```text
1. For every pig: pig = advancePig(pig, now, rng)
2. Resolve pregnancies: for every pig with pregnancy.endsAt <= now  (see 8.7)
3. Compare before/after and return GameEvents:
     PIG_HUNGRY_ZERO, PIG_BECAME_SICK, PIG_BECAME_ADULT, BIRTH
4. Persist immediately if any event occurred (prevents "reload to re-roll sickness").
```

---

# 8. ACTIONS

Every action is a pure function:

```ts
type ActionContext = { now: number; rng: Rng };
type ActionResult =
  | { ok: true;  state: SaveGame; events: GameEvent[] }
  | { ok: false; error: ErrorCode };

feedPig(state, { pigId }, ctx): ActionResult
```

Each action first runs `advanceWorld`, then validates, then returns a **new** state (immutable). Validation failures never modify state. The store persists only on `ok: true`.

Error codes:

```text
INVALID_REQUEST  PIG_NOT_FOUND  INSUFFICIENT_GOLD  INSUFFICIENT_ITEM
PIG_NOT_MATURE  PIG_IS_SICK  PIG_IS_PREGNANT  PIG_NOT_SICK
ALREADY_FULL  ALREADY_CLEAN  INVALID_BREEDING_PARTNERS
BREEDING_COMBINATION_NOT_SUPPORTED  NO_PIG_SLOT
LEVEL_TOO_LOW  MAX_SLOTS_REACHED  SAVE_CORRUPT  SAVE_TOO_NEW
```

## 8.1 Buy pig — `buyPig({ breed, gender })`
- `breed` must be PIG_EARTH_PINK (else `INVALID_REQUEST`); `gender` must be MALE or FEMALE (D6).
- `freeSlots ≥ 1` else `NO_PIG_SLOT`. `gold ≥ 500` else `INSUFFICIENT_GOLD`.
- Creates pig in the lowest free `slotIndex`: BABY, progress 0, hunger 100, cleanliness 100, not sick, `lastTickedAt = now`, default name from a Vietnamese name pool (e.g. "Ủn Hồng", "Ủn Mập").
- Gold −500, transaction `PIG_PURCHASE`.

## 8.2 Feed — `feedPig({ pigId })`
- Pig exists. `hunger < 100` else `ALREADY_FULL`. `inventory.FOOD_BASIC ≥ 1` else `INSUFFICIENT_ITEM`.
- Consume 1 food, `hunger = min(100, hunger + 20)`.
- XP +2 **only if** hunger before feeding ≤ 80 (D11).

## 8.3 Clean — `cleanPig({ pigId })`
- Pig exists. `cleanliness < 100` else `ALREADY_CLEAN`. No item needed, no cost.
- `cleanliness = 100`. XP +2 **only if** cleanliness before ≤ 70 (D11). Does not cure sickness.

## 8.4 Treat — `treatPig({ pigId })`
- Pig exists, `isSick` else `PIG_NOT_SICK`, `inventory.MEDICINE_COMMON ≥ 1` else `INSUFFICIENT_ITEM`.
- Consume 1 medicine, `isSick = false`. Does not restore hunger/cleanliness. No XP.

## 8.5 Sell — `sellPig({ pigId })`
- Pig exists. `growthProgress = 100` else `PIG_NOT_MATURE`. Not pregnant else `PIG_IS_PREGNANT`.
- `price = floor(sellGold × (isSick ? 0.5 : 1))`, computed after `advanceWorld`.
- Remove pig, gold + price, XP +10, transaction `PIG_SELL` (note includes breed and whether sick).
- Selling the same pig twice returns `PIG_NOT_FOUND` the second time.

## 8.6 Breed — `breedPigs({ pigAId, pigBId })`
Validation (in this order):
1. Both pigs exist and `pigAId !== pigBId` → else `INVALID_BREEDING_PARTNERS`
2. Both `growthProgress = 100` → `PIG_NOT_MATURE`
3. Neither is sick → `PIG_IS_SICK`
4. Neither is pregnant → `PIG_IS_PREGNANT`
5. Opposite genders → `INVALID_BREEDING_PARTNERS`
6. Combination exists in matrix (and neither is MYTHICAL) → `BREEDING_COMBINATION_NOT_SUPPORTED`
7. `freeSlots ≥ 1` → `NO_PIG_SLOT` (reserves space for the child, D8)
8. `gold ≥ 200` → `INSUFFICIENT_GOLD`

Effect:
- Gold −200 (transaction `BREEDING_FEE`), XP +15.
- The **female** becomes pregnant: `pregnancy = { startedAt: now, endsAt: now + 3,600,000, fatherId, childBreed, childGender }`.
- `childBreed` is chosen with weighted random from the matrix and `childGender` 50/50, **both at this moment**, so the result cannot change later.
- The male is unaffected and may breed again immediately.
- Add a `BreedingRecord` with `bornAt = null`.

## 8.7 Birth (automatic, inside `advanceWorld`)
For each pregnant pig with `now >= pregnancy.endsAt`:
1. Create the child in the lowest free slot (guaranteed to exist by D8): BABY, `childBreed`, `childGender`, hunger 100, cleanliness 100, **`lastTickedAt = pregnancy.endsAt`**, then run `advancePig(child, now)` so growth during offline time counts.
2. Set mother's `pregnancy = null`.
3. Set `BreedingRecord.bornAt = pregnancy.endsAt`.
4. Emit `BIRTH` event.
Births are keyed by removing `pregnancy`, so running `advanceWorld` twice can never create duplicates.

## 8.8 Buy item — `buyItem({ itemId, quantity })`
- `itemId` is a known item; `quantity` integer 1–99. Total cost `price × quantity`; else `INSUFFICIENT_GOLD`.
- Add to inventory, transaction `SHOP_PURCHASE`.

## 8.9 Buy slot — `buySlot()`
- Next slot number = `unlockedSlots + 1`. If `> MAX_SLOTS` → `MAX_SLOTS_REACHED`.
- `level ≥ requiredLevel` else `LEVEL_TOO_LOW`; `gold ≥ cost` else `INSUFFICIENT_GOLD`.
- `unlockedSlots += 1`, transaction `SLOT_PURCHASE`.

## 8.10 Rename — `renamePig({ pigId, name })`
- Trim; 1–16 characters; strip control characters. Otherwise `INVALID_REQUEST`.

## 8.11 XP and level
- `addXP` never lowers XP. After adding XP, if `level` increased emit `LEVEL_UP { level }`.
- Level curve is `BALANCE.LEVEL_XP`; XP is capped at the level-10 threshold for display but may keep accumulating internally.

## 8.12 Gold rule
Every gold change goes through one helper that also writes a `Transaction`. Never change gold without a transaction record.

---

# 9. ECONOMY REFERENCE (for the agent's sanity checks)

With defaults, a pink pig costs 500, sells for 1,200 after 2 hours: gross profit 700 per pig per 2 h. Food is cheap relative to sale prices, so feeding is mostly a *timing* mechanic rather than a gold sink. The real gold sinks are pig purchases, breeding fees, medicine and slot purchases.

`scripts/simulate-economy.ts` must print, per breed: sell price, growth hours, hunger needed to reach adulthood, food units needed, net gold per hour per slot (assuming perfect care).

---

# 10. PERSISTENCE

## 10.1 Save/load
- Save synchronously after every successful action, on every event from `advanceWorld`, every 30 s while the tab is open, and on `visibilitychange → hidden` and `pagehide`.
- Save format: one JSON string of `SaveGame`. Validate with a `zod` schema on load.
- Before overwriting, copy the previous good save to the backup key.
- On first ever launch: create the starter state (D7) with an `INITIAL_GOLD` transaction.

## 10.2 Corruption and safety
- If the main save fails validation, try the backup. If both fail, show a **recovery screen** offering: import a save file, or start a new game (with confirmation). Never silently wipe data.
- `schemaVersion` greater than the app's version → `SAVE_TOO_NEW`; refuse to overwrite it.
- `migrate(raw)` runs sequential migrations `vN → vN+1`. Include a unit test for each migration and a "future version" test.

## 10.3 Export / import
- Settings screen: **Export save** (downloads `un-in-save-YYYYMMDD-HHmm.json`) and **Import save** (file picker → validate → confirm overwrite → keep the old save as backup).
- Update `settings.lastExportAt`. If the last export is more than 7 days old, show a gentle reminder once per session.

## 10.4 Browser storage caveats (must be handled)
- Call `navigator.storage.persist()` (if available) after the first successful action.
- Show an "Add to Home Screen / Install" hint. Safari may evict site data of non-installed sites after ~7 days without use; installed PWAs are safer. Export is the real safety net.
- Detect a second open tab (`BroadcastChannel`); the second tab shows a "Game is open in another tab" notice and is read-only, to avoid overwriting saves.
- `localStorage` may hold only the save documents above. It is the authoritative store in this edition.

## 10.5 Away summary
If the player was away ≥ 10 minutes, on load show a "While you were away" modal built from the events returned by `advanceWorld`: pigs that reached adulthood, pigs that ran out of food, pigs that got sick, births.

---

# 11. UI / UX

## 11.1 Layout

```text
┌────────────────────────────────────────────────┐
│ Lv 1     XP 0/100           Gold 5,000    ⚙    │
├────────────────────────────────────────────────┤
│                                                │
│                  FARM AREA (Phaser)            │
│         🐖            🐖                       │
│                 🐖                             │
│                                                │
├────────────────────────────────────────────────┤
│  Farm     Shop     Inventory     History       │
└────────────────────────────────────────────────┘
```

`Friends` from v2 is removed. `⚙` opens Settings (sound, export/import, reset, credits).

## 11.2 Selected pig panel

```text
Name (tap to rename)   Breed   Gender
Growth ▓▓▓▓░░░░ 55%  (BABY / YOUNG / ADULT)
Weight  Hunger  Cleanliness  Health  Pregnancy (countdown)

[Feed] [Clean] [Medicine] [Breed] [Sell]
```

- Invalid actions are **disabled with a visible reason** (e.g. "Chưa trưởng thành", "Hết thuốc", "Hết chỗ chứa").
- Selling requires a confirm dialog showing the final price (mandatory for SUPERMAN and MYTHICAL).
- Breeding opens a picker of valid partners and shows the result probabilities from the matrix before the player confirms.
- Show toasts for events (sick, adult, birth, level up).

## 11.3 First-run tutorial
Skippable, 4 steps: buy a pig (choose gender) → feed → clean → wait/see growth. Stored in `settings.tutorialDone`.

## 11.4 Responsive
- Minimum width 360 px; comfortable ≥ 1280 px; supported ≥ 1024 px desktop.
- Touch targets ≥ 44 px, no hover-only interaction, no horizontal scrolling, mobile-friendly modals, bottom navigation on mobile, side panel allowed on desktop.
- Phaser canvas resizes with the container.

## 11.5 i18n
All strings in `src/i18n/vi.ts`. No hard-coded UI text elsewhere.

---

# 12. PHASER

Scenes: `BootScene`, `PreloadScene`, `MainFarmScene` (no friend scene in this edition).

Pig visual state is derived from data: `sick`, `pregnant`, `idle`, `walk`, `eat`, `clean`, `sleep`, `happy`. Sprite scale grows with `growthProgress` (baby small → adult larger), which lets placeholder art work without extra assets.

Wandering is visual only, stays inside farm bounds, pauses during interaction animations, and never changes game state.

**Placeholder assets MUST work before final art exists** (generated shapes or simple SVG/PNG). Final art is swapped in through an asset manifest without code changes.

---

# 13. AUDIO

Sounds: `background_music`, `button_click`, `feed`, `clean`, `buy`, `sell`, `breed`, `birth`, `notification`, `error`.
Music starts only after the first user gesture (browser autoplay policy). Sound/music toggles are stored in `settings`. Use original or CC0 audio and list credits in `README.md`/Credits screen.

---

# 14. PWA & OFFLINE

- `manifest.webmanifest`: name, short name, `display: standalone`, theme colour, 192/512 icons.
- Service worker precaches all built assets; the game must load and be fully playable with the network disabled after first load.
- No runtime `fetch` to external hosts, no CDN fonts/scripts, no analytics.
- Update flow: when a new version is available, show "Update available — reload" (never reload silently mid-action).
- Hosting: any static host (GitHub Pages, Netlify, Cloudflare Pages) or a local `npm run preview` server. Note: service workers need HTTPS or `localhost`; opening `index.html` via `file://` will not work.
- Limitation to document in README: a web app cannot deliver reliable background notifications (e.g. "pig gave birth") while closed.

---

# 15. TESTING

Use Vitest. All `core` tests use a fake clock and a seeded RNG (`mulberry32`); tests never call `Date.now()` or `Math.random()`.

## 15.1 Engine unit tests (golden values, PINK baby: progress 0, hunger 100, clean 100, always fed unless stated)

| Case | Expected |
|---|---|
| advance 3,600 s | progress 50, hunger 70, cleanliness 88 |
| advance 7,200 s | progress 100, hunger 40, cleanliness 76 |
| STRIPED baby, advance 20,000 s with no feeding | hunger 0, progress ≈ 83.33 (growth stopped at 12,000 s) |
| cleanliness crosses 30 | exactly at 21,000 s from 100 |
| sick pig advance | growth does not change; hunger/cleanliness still decay |
| `now < lastTickedAt` | no state change except `lastTickedAt = now` |
| split invariance | `advance(a+b)` equals `advance(a)` then `advance(b)` (with an RNG that never triggers sickness) |
| sickness, rng.next()=0 | pig becomes sick as soon as cleanliness < 30 |
| sickness, rng.next()=0.9999 | pig not sick within 1 hour of exposure |
| sickness statistics | over many seeded runs, ~5% of 600 s exposures become sick (tolerance stated in test) |

## 15.2 Action tests
- feed: `ALREADY_FULL` at 100, XP only when hunger ≤ 80, item consumed once, hunger capped at 100
- clean: `ALREADY_CLEAN`, XP only when ≤ 70, does not cure sickness
- treat: `PIG_NOT_SICK`, `INSUFFICIENT_ITEM`, cures sickness only
- sell: healthy 1,200; sick 600; baby → `PIG_NOT_MATURE`; pregnant → `PIG_IS_PREGNANT`; second sell → `PIG_NOT_FOUND`
- buy pig: gold/slot/inventory checks, gender respected, lowest free slot used
- buy slot: level and gold gates, cap at 12
- rename: length/control character validation
- gold never changes without a transaction

## 15.3 Breeding tests
- Every matrix entry: weights sum to 100; `A+B` and `B+A` resolve to the same entry
- Seeded 10,000-sample distribution is within tolerance for each entry
- Undefined/MYTHICAL combination → `BREEDING_COMBINATION_NOT_SUPPORTED`
- Same gender, same pig, sick, pregnant, not mature, no free slot, insufficient gold → correct error and **no state change**
- Result stored at breeding time (changing RNG afterwards does not change the child)
- Birth at `endsAt − 1 s` → nothing; at `endsAt` → exactly one child; calling `advanceWorld` again → still one child; child growth accounts for time since `endsAt`
- Birth after a long offline period (e.g. 3 days) works
- Reserved slot: with 4 slots, 2 adults + 1 pregnancy → `freeSlots = 0` for buying; birth always finds a slot

## 15.4 Save tests
- Round-trip save/load equality
- Corrupt main save falls back to backup; both corrupt → recovery state, no wipe
- Each migration; future `schemaVersion` refused
- Import rejects invalid JSON and invalid schema without touching the existing save
- Invariants (Section 5) hold after every action in a randomized action fuzz test

## 15.5 Economy simulation
`npm run sim:economy` prints the report described in Section 9.

## 15.6 Optional smoke test (Playwright)
Fresh load → buy pig → feed → reload page → pig still there → export save.

---

# 16. ACCEPTANCE CRITERIA

## Phase 1 — Core farm (done when)
- First launch creates the starter state; tutorial works
- Buy a pig (choose gender); it appears in the farm and persists after refresh and after closing the browser
- Hunger/cleanliness decay correctly, including after being away for hours
- Growth works; hungry or sick pigs stop growing at the correct moment
- Feed, clean, medicine work with correct errors
- Adult pig can be sold; gold persists; every gold change has a transaction
- Away summary appears after ≥ 10 minutes

## Phase 2 — Shop, inventory, progression (done when)
- Shop buys food/medicine; inventory screen is correct
- XP and levels work; anti-spam XP rule works
- Slot purchase works with level gates
- Transaction history screen works

## Phase 3 — Breeding (done when)
- Breeding validation, fee, weighted result, pregnancy countdown all work
- Pregnancy and birth persist across refresh; no duplicate births; slot reservation works
- Breeding history works and unsupported combinations show a clear message

## Phase 4 — Polish & PWA (done when)
- Animations, sounds, loading/error/empty states, mobile and desktop layouts polished
- Export/import save, recovery screen, multi-tab notice work
- App installs, and loads and plays fully offline
- All tests pass

---

# 17. DEVELOPMENT ORDER

```text
 1. Project skeleton (Vite + TS + Vitest + lint)
 2. core/types, config, rng, clock
 3. advancePig + advanceWorld + unit tests
 4. Save schema, storage, migrate, export/import + tests
 5. Actions: buyPig, feed, clean, treat, sell + tests
 6. gameStore (dispatch, persist, notify, global interval)
 7. Minimal DOM UI (no Phaser yet): pig list + action buttons  → playable core
 8. Shop, inventory, XP/levels, slots, transaction history
 9. Breeding, pregnancy, birth + tests
10. Phaser MainFarmScene, pig visuals, wandering, effects
11. Responsive UI, tutorial, away summary, toasts
12. Audio
13. PWA (manifest, service worker, offline, update flow)
14. Economy simulation script, edge-case tests, README
```

Do not start Phaser or visual polish before step 7 is playable and the core tests pass.

---

# 18. README REQUIREMENTS

`README.md` must contain: project overview, architecture, install, dev/build/preview commands, test commands, how saves work (storage keys, export/import, browser eviction caveat), how to install as PWA, how to tune `BALANCE`, how to add a breed, asset credits, known limitations (no background notifications, data is per-browser), and implementation assumptions.

---

# 19. OPTIONAL BACKLOG (NOT MVP — do not implement unless explicitly requested)

Solo replacements for the removed social loop, in rough priority order:

1. **Collection book** — track discovered breeds and pig counts.
2. **NPC orders** — a neighbour asks for a specific breed/gender for a bonus price; adds goals.
3. **Random events / market days** — e.g. sell price +20% for a day, rain makes pigs dirtier faster.
4. **Feed all / Clean all** buttons (quality of life).
5. **Achievements** and **daily login reward**.
6. **Farm decorations** as a gold sink.
7. **Capacitor wrapper** to publish to app stores (would also enable local push notifications).

---

# 20. CHANGES FROM v2

- Removed: backend, MongoDB, Socket.io, Docker, authentication, friends, social cleaning, stealing, notifications collection, rate limiting, anti-cheat, FriendFarmScene.
- Added: PWA/offline requirements, local save system with backup, export/import, corruption recovery, multi-tab guard, away summary.
- Fixed: delta-time engine (growth stopped at the exact moment hunger hits 0 or sickness starts); sickness probability no longer depends on how often state is evaluated; `advanceGrowthStage` and weight formula were undefined; `ADULT_MAX` skipped decay inconsistently.
- Filled gaps: buy-pig gender, starter inventory, missing breeding pairs (Pink+Striped, Pink+Superman, Superman+Superman, Mythical), XP spam, level rewards (slots), XP curve to level 10, slot purchases, slot reservation instead of `BIRTH_PENDING`, clock handling.
- Simplified: state is stored as one document; level and growth stage are derived instead of stored.
