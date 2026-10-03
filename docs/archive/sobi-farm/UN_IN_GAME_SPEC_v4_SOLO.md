# UN IN HOMEMADE — SOLO EDITION
## Implementation Specification v4.1 — Desktop Edition

**Document type:** Game design + technical specification for an AI coding agent
**Target:** Windows desktop game. One installer (`.exe`) creates a Desktop and Start Menu shortcut; double-click opens the game. No terminal, no Node, no localhost, no port, no server process. Fully playable offline from the very first launch.
**Scope:** Single player. No server, no accounts, no friends/social, no network calls at runtime.
**v4.1 change:** the runtime moved from PWA to a desktop shell, the save moved from browser storage to files, and the asset/presentation pipeline was made explicit. Game rules are unchanged. See §19.1.
**In-game language:** Vietnamese. All player-facing strings live in `src/i18n/vi.ts`.
**Supersedes:** `UN_IN_GAME_SPEC_v3_SOLO.md`
**Companion documents:**
- `README.md` — reading order and the agent kickoff prompt
- `asset/ASSET_PRODUCTION_STANDARD_v1.md` — authoritative for every art question. Where the two disagree, the art standard wins on art, this document wins on rules.
- `asset/AI_ASSET_GENERATION_PACK.md` — ready-to-paste generation prompts and the post-processing pipeline
- `asset/animals/PIG_CATALOGUE.md`, `asset/building/ENVIRONMENT_CATALOGUE.md` — the concept catalogues

**Do not read `archive/UN_IN_GAME_SPEC_v3_SOLO.md`.** It is superseded and its balance values are wrong (see §1.1).

---

# 0. IMPLEMENTATION CONTRACT

This document is the source of truth for game rules. The coding AI MUST:

- Read the whole document before writing code.
- Implement rules exactly as written. Do not invent core gameplay rules defined here.
- Treat every item marked **[D#]** in Section 2 as a fixed decision.
- When something is genuinely undefined, choose the simplest option and record it in `README.md` under "Implementation assumptions".
- Keep all gameplay logic in `src/core/` as pure TypeScript (Section 4).
- Not add: backend, database server, local HTTP server or open port, SQLite, accounts, analytics, ads, monetization, in-app purchase, multiplayer, auto-updater, or runtime network requests.
- Keep the presentation driven by ids and events: gameplay code never names an asset file (only ids resolved through `assets.json`, §11 and the art standard §7), and every animation, effect and sound is triggered by a `GameEvent` or by derived state (§11.3), never by the UI guessing what an action did.
- Use original or generated assets only. Never copy sprites, sounds, logos, UI or code from any existing commercial game.
- Not start Section 20 (Backlog) unless explicitly asked.

---

# 1. WHY v4 EXISTS — the three problems in v3

v3 was structurally sound: pure core, injected clock and rng, a piecewise time engine, golden-value tests. Those parts are kept almost unchanged. Three things made it specify a game that does not work as a game.

### 1.1 The player never had to play

v3 balance: hunger −5 per 10 min (full bar = 200 min), cleanliness −3 per 15 min (reaches the sickness threshold at 350 min), PINK growth = 120 min.

A pink pig therefore reached ADULT with **zero interaction** — never hungry, never dirty, never sick. Feeding and cleaning were decorative. v3 documented this in its own balance note and then instructed the agent not to fix it.

**v4 fix:** hunger and cleanliness budgets are derived from each breed's growth time (Section 6.3), so an unattended pig stalls at about 33% growth and becomes sick-eligible at about 63% of the way to adult.

### 1.2 There was nothing to spend gold on and nothing to aim at

Gold sources: selling pigs. Gold sinks: pigs, food, medicine, 8 slot unlocks. Caps: level 10, 12 slots, 4 breeds. After roughly one evening the player owns everything purchasable and the loop has no target. Every feature that would have made it a game sat in v3 section 19 marked "do not implement".

**v4 fix:** three systems promoted from backlog into MVP — **feed trough** (turns feeding into resource planning that also works offline), **NPC orders** (goals, and a reason to breed a specific breed and gender), **collection book plus skin shop** (a gold sink that scales to the 245 assets already drawn).

### 1.3 The spec and the asset bible describe two different games

The spec has **4 breeds**. The asset bible has **116 pig concepts and 129 cosmetics**, a P1–P5 rarity ladder, collection bundles and seasonal events. No mapping table existed between them, and `Pig` had no field that could ever reference an asset. An agent handed both documents would either ignore 245 assets or invent a system.

**v4 fix:** breed and appearance become two independent axes (Section 5.2). `breed` drives economy and breeding. `skinId` drives what you see and is sourced from the asset bible. Section 6.6 gives the explicit mapping.

---

# 2. DECISIONS REGISTER

**CONFIRMED** = carried from v3 unchanged. **CHANGED** = v3 had a different value; the old value is stated so the change is auditable. **NEW** = added in v4.

| ID | Decision | Status |
|---|---|---|
| D1 | Platform is a **Windows desktop app**: an Electron shell around one TypeScript/Vite codebase, shipped as an NSIS installer with Desktop and Start Menu shortcuts (§13). The browser build (`npm run dev`) is a development target only, never a product. No mobile target in v1. | CHANGED (v4.0: PWA, PC + mobile) |
| D2 | No backend, no server process, no database. The save is one versioned JSON document stored as a **file** in the per-user data directory, written atomically with rotating backups, behind the `SaveStorage` port (§9). JSON export/import uses native file dialogs. The dev browser build uses an IndexedDB adapter behind the same port. | CHANGED (v4.0: IndexedDB + localStorage mirror) |
| D3 | `growthStage` is derived from `growthProgress`, never stored: BABY `< 30`, YOUNG `30 <= p < 100`, ADULT `= 100`. | CONFIRMED |
| D4 | ADULT is the final stage. Hunger and cleanliness keep decaying in every stage. | CONFIRMED |
| D5 | Sickness uses the exponential model of Section 7.2 — memoryless, so the result does not depend on how often the engine runs. | CONFIRMED |
| D6 | When buying a pig the player chooses gender. Newborn gender is 50/50 random. | CONFIRMED |
| D7 | Starter kit: 5,000 gold, 0 pigs, 10 x FOOD_BASIC, 1 x MEDICINE_COMMON, 4 slots, trough capacity 20, trough empty. | CHANGED (v3: 5 food) |
| D8 | A pregnancy reserves a pig slot at breeding time. Birth can never fail. | CONFIRMED |
| D9 | The breeding matrix covers all non-MYTHICAL pairs (Section 6.5). | CONFIRMED |
| D10 | `PIG_MYTHICAL` cannot breed (`BREEDING_COMBINATION_NOT_SUPPORTED`). | CONFIRMED |
| D11 | XP for feed and clean is only awarded when the action is effective (anti-spam). | CONFIRMED |
| D12 | Level cap 10. Extra pig slots (5–12) cost gold and are level-gated. | CONFIRMED |
| D13 | `level` is derived from `xp`, never stored. | CONFIRMED |
| D14 | `deltaSeconds = max(0, now - lastTickedAt)`. If the device clock moved backwards, resync `lastTickedAt = now` with no other state change. | CONFIRMED |
| D15 | The client is trusted. No anti-cheat, rate limiting or auth. | CONFIRMED |
| D16 | Hunger and cleanliness budgets are **per breed**, derived from growth time: `hungerFullSec = growthSec / 3`, `cleanFullSec = growthSec * 0.75`. | NEW |
| D17 | A farm-level **feed trough** auto-feeds pigs while it holds food, including while the app is closed. This is the primary feeding mechanic; tapping one pig is the manual fallback. | NEW |
| D18 | `happiness` is **derived** from cleanliness, hunger and sickness, never stored, and it sets the sell multiplier (0.7x–1.2x). It replaces v3's flat `SICK_PRICE_MULTIPLIER = 0.5`. | CHANGED |
| D19 | Appearance (`skinId` plus `cosmetics`) is independent of `breed`. Skins are bought with gold or unlocked by collection milestones. **No gacha, no random paid boxes, no real money.** | NEW |
| D20 | Up to 3 **NPC orders** are active at a time, regenerated on a 4-hour boundary derived from the clock so they are reproducible offline. | NEW |
| D21 | Pigs never die and are never removed by neglect. Neglect costs **time and sell price**, nothing else. This is a relaxing game. | NEW |
| D22 | `pregnancySec` is per breed (the mother's breed), not one global constant. | CHANGED (v3: flat 3,600 s) |
| D23 | Sprites are drawn **facing right only**; left is a horizontal flip at runtime. Back and front views are never produced. See the art standard, section 2. | NEW |
| D24 | Every asset (image, sprite sheet, audio, layout) is addressed by a stable **id** and resolved through `public/assets/manifest/assets.json` (manifest v2, art standard §7.2). Each row carries a lifecycle `status`: `placeholder` → `production` → `final`. The game must run, complete, with every row at `placeholder`; upgrading art is a file + row change, never a TypeScript change. | NEW (v4.1) |
| D25 | Every successful action emits at least one `GameEvent` (§8.0). Presentation — animation, VFX, sound, toast — is driven only by events and derived state through one `FeedbackDirector` (§11.3). The render loop is visual only and never writes game state. | NEW (v4.1) |
| D26 | Distribution: per-user NSIS installer, app icon, Desktop + Start Menu shortcut. Uninstalling keeps the save. A new version is installed over the old one; save migrations (§9.2) handle the rest. No auto-updater, no code-signing requirement for v1. | NEW (v4.1) |

---

# 3. PRODUCT OVERVIEW

## 3.1 Core loop

```text
Stock the trough ──► pigs eat and grow while you are away
        │
        ▼
Come back ──► clean, cure, check happiness ──► sell at a good multiplier
        │                                            │
        ├──► breed adults ──► rarer breeds ──────────┤
        │                                            ▼
        └──► fill NPC orders ──► bonus gold ──► skins, slots, better breeds
                                                     │
                                          collection book fills up
```

Compared with v3 the loop now has: a reason to prepare before logging off (trough), a reason to come back on time (happiness decays into a worse price), a target (orders and collection), and a sink (skins and slots).

## 3.2 Design priorities

1. Fun and understandable gameplay
2. A local save that never silently loses data
3. Correct time simulation across hours and days away
4. Fast, responsive UI on phone and PC
5. Pure, testable game logic
6. Cheap to expand with new breeds, skins and cosmetics

## 3.3 Session shape the design targets

- **Short session, 2–3 min:** refill the trough, clean everyone, collect an order, log off.
- **Medium session, 10–15 min:** the above plus breeding decisions and a shop trip.
- **Away, 2–24 h:** the trough carries growth; happiness decays; nothing is lost.

---

# 4. TECHNOLOGY STACK

- TypeScript (strict), Vite
- Phaser 3 — farm world, pigs, animations, effects only
- Plain DOM/CSS overlays for all menus, panels and modals
- `zod` — validate save data on load and import
- Electron — desktop shell (main process + preload + renderer), `electron-builder` — NSIS installer (D1, D26)
- `idb` — IndexedDB adapter for the **dev browser build only** (D2)
- Vitest — unit and integration tests; Playwright (`_electron`) — one smoke test against the packaged app
- No Node/Express/MongoDB/Socket.io/Docker, no SQLite, no HTTP server of any kind, no `vite-plugin-pwa`/service worker

Layers (the arrows are the only allowed dependency directions):

```text
Application (Ủn Ỉn Homemade.exe)
├── Presentation   src/ui (DOM menus/HUD) · src/game (Phaser farm) · src/game/feedback (FeedbackDirector)
│        │ dispatch / subscribe / onEvents
├── Application    src/store (gameStore: one 1 s loop, dispatch, persist policy, event fan-out)
│        │
├── Game Core      src/core (pure: config, engine, actions, events, save schema/migrate, asset schema)
│        │ SaveStorage port (load/save), AssetSource port
├── Data/Platform  src/platform/desktop (file save via preload IPC) · src/platform/web (IndexedDB, dev only)
└── Runtime        electron/ (main: window, app:// protocol, single instance, file IO, dialogs; preload: contextBridge)
```

Data flow for every gameplay action:

```text
Input (DOM button / Phaser pointer) → gameStore.dispatch(action)
        → advanceWorld(state, now, rng)   // catch up time first
        → action(state, args, {now, rng}) // validate + return { state, events }
        → commit + notify subscribers      // DOM HUD, MainFarmScene.reconcile(state)
        → FeedbackDirector(events)         // animation → VFX → sound → toast (§11.3)
        → persist via SaveStorage           // async; failure is surfaced, never swallowed (§9.2)
```

Two loops, never mixed: the **simulation loop** (one 1 s interval in the store, §7.1) is the only thing that changes state; the **render loop** (Phaser, ~60 fps) only draws, tweens and plays effects.

## 4.1 Directory structure

```text
un-in-homemade/
├── build/                     # installer resources: icon.ico, icon.png (1024), installer art
├── electron/                  # Runtime. Node APIs allowed here only.
│   ├── main.ts                # window, app:// protocol, single-instance, IPC handlers, quit flush
│   ├── preload.ts             # contextBridge → window.unin (save, dialogs, app)
│   └── saveFiles.ts           # atomic write, backup rotation, read chain (§9.1)
├── public/
│   └── assets/
│       ├── pigs/{base,skins,cosmetics}/
│       ├── environment/ buildings/ props/ ui/ fx/ audio/
│       └── manifest/assets.json      # manifest v2, see art standard §7.2
├── src/
│   ├── core/                  # PURE TypeScript. No DOM, no Node, no Phaser,
│   │   │                      # no Date.now(), no Math.random(), no exceptions.
│   │   ├── config/            # breeds, items, skins, breedingMatrix,
│   │   │                      # levels, orders, balance, errors
│   │   ├── engine/            # advancePig, advanceWorld, trough, pricing,
│   │   │                      # breeding, happiness, orders
│   │   ├── actions/           # feedPig, cleanPig, treatPig, buyPig, sellPig,
│   │   │                      # breedPigs, buySlot, renamePig, fillTrough,
│   │   │                      # buySkin, equipSkin, fulfillOrder
│   │   ├── save/              # schema, migrate, exportImport, port.ts (SaveStorage interface)
│   │   ├── assets/            # manifestSchema (zod), registry (id → entry, fallbacks)
│   │   ├── rng.ts             # Rng interface, seeded rng (tests)
│   │   ├── clock.ts           # Clock interface + fake clock
│   │   ├── events.ts          # GameEvent types
│   │   └── types.ts
│   ├── platform/              # Data layer adapters. Browser/IPC APIs allowed here.
│   │   ├── index.ts           # Platform interface + detection (window.unin present → desktop)
│   │   ├── desktop/           # FileSaveStorage, native dialogs, instance guard (via window.unin)
│   │   └── web/               # IdbSaveStorage, download/upload, BroadcastChannel tab guard (dev)
│   ├── store/                 # gameStore, runtime (realClock, defaultRng)
│   ├── game/                  # Phaser: scenes/, prefabs/, fx/, audio/, feedback/, config/
│   ├── ui/                    # DOM components/screens
│   ├── i18n/vi.ts
│   └── main.ts
├── tests/{unit,e2e}/
├── scripts/                   # simulate-economy, make-placeholders, assets-check, process-art
└── README.md
```

Rule, non-negotiable: `src/core/` never imports from `game/`, `ui/`, `store/`, `platform/` or any browser/Node API — with **no file-level exceptions** (v4.0 allowed `save/storage.ts`; v4.1 moves storage to `src/platform/`). `now` and `rng` are always injected. Browser APIs live in `src/platform/`, `src/store/`, `src/ui/`, `src/game/`; Node APIs live only in `electron/`.

---

# 5. DATA MODEL

All timestamps are epoch milliseconds. Where the save document is stored is the platform's business (§9.1); the document itself is identical on every platform.

## 5.1 Save document

```ts
type Gender = "MALE" | "FEMALE";
type BreedId = "PIG_EARTH_PINK" | "PIG_STRIPED_MELON" | "PIG_SUPERMAN" | "PIG_MYTHICAL";
type ItemId  = "FOOD_BASIC" | "MEDICINE_COMMON";
type GrowthStage = "BABY" | "YOUNG" | "ADULT";   // derived, never stored
type CosmeticSlot = "head" | "face" | "body" | "back" | "prop" | "fx";

interface SaveGame {
  schemaVersion: 2;
  createdAt: number;
  updatedAt: number;
  player: {
    gold: number;
    xp: number;
    unlockedSlots: number;
    ownedSkins: string[];        // skinId list, always contains the 4 breed defaults
  };
  pigs: Pig[];
  trough: {
    food: number;                // units currently in the trough
    capacity: number;            // grows with level, see 6.4
    lastResolvedAt: number;      // last time auto-feeding was simulated
  };
  inventory: Record<ItemId, number>;
  orders: Order[];               // at most 3, see 8.13
  collection: {
    discoveredBreeds: BreedId[];
    discoveredSkins: string[];
  };
  transactions: Transaction[];   // newest first, max 200, oldest dropped
  breedingRecords: BreedingRecord[]; // newest first, max 100, oldest dropped
  settings: {
    musicOn: boolean;
    sfxOn: boolean;
    reduceMotion: boolean;
    tutorialDone: boolean;
    lastExportAt: number | null;
  };
}
```

## 5.2 Pig — breed and appearance are separate axes (D19)

```ts
interface Pig {
  id: string;                    // uuid
  slotIndex: number;             // unique, 0 <= slotIndex < unlockedSlots
  breed: BreedId;                // ECONOMY axis: stats, price, breeding
  skinId: string;                // VISUAL axis: which artwork to draw
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  name: string;                  // 1–16 chars
  gender: Gender;
  growthProgress: number;        // 0–100
  hunger: number;                // 0–100 (float internally, floor for display)
  cleanliness: number;           // 0–100
  isSick: boolean;
  pregnancy: null | {
    startedAt: number;
    endsAt: number;
    fatherId: string;
    childBreed: BreedId;         // decided at breeding time
    childGender: Gender;         // decided at breeding time
  };
  lastTickedAt: number;
  createdAt: number;
}
```

`breed` never changes. `skinId` and `cosmetics` are pure cosmetics and never affect any number. A new pig gets `skinId = BREEDS[breed].defaultSkin` (Section 6.6) and empty cosmetics.

## 5.3 Orders, transactions, breeding records

```ts
interface Order {
  id: string;                    // deterministic: `${windowIndex}:${slot}`
  createdAt: number;             // start of the 4-hour window
  expiresAt: number;             // createdAt + ORDER_TTL_MS
  wantBreed: BreedId;
  wantGender: Gender | null;     // null = any
  minHappiness: number;          // 0, 50 or 75
  rewardGold: number;
  rewardXp: number;
  fulfilledAt: number | null;
}

interface Transaction {
  id: string;
  at: number;
  type: "INITIAL_GOLD" | "SHOP_PURCHASE" | "PIG_PURCHASE" | "PIG_SELL"
      | "BREEDING_FEE" | "SLOT_PURCHASE" | "TROUGH_FILL" | "SKIN_PURCHASE"
      | "ORDER_REWARD" | "DISCOVERY_BONUS";
  amount: number;                // signed gold delta
  refId?: string;
  note?: string;
}

interface BreedingRecord {
  id: string;
  at: number;
  motherId: string; fatherId: string;
  motherBreed: BreedId; fatherBreed: BreedId;
  childBreed: BreedId; childGender: Gender;
  bornAt: number | null;         // null until birth
}
```

## 5.4 Derived values (never stored)

```text
growthStage = BABY | YOUNG | ADULT             from growthProgress (D3)
weight      = 1 + (maxWeight - 1) * growthProgress / 100          (display only)
level       = highest level whose xp threshold <= player.xp
happiness   = clamp(round(0.55*cleanliness + 0.45*hunger) - (isSick ? 40 : 0), 0, 100)
sellPrice   = floor(BREEDS[breed].sellGold * (0.7 + 0.5 * happiness / 100))
freeSlots   = unlockedSlots - pigs.length - count(pigs where pregnancy != null)
```

A pregnant pig already occupies its own slot; the extra subtraction reserves a slot for the unborn child (D8).

**Note on `happiness`:** at 100 the pig sells for 1.2x, at 0 for 0.7x. A neglected sick pig lands near 0.7x, which is a softer penalty than v3's flat 0.5x but applies continuously instead of as a cliff, so care is rewarded at every level rather than only at the sick/not-sick boundary.

## 5.5 Invariants

Enforced by `zod` on load and covered by a fuzz test: no negative gold, inventory or trough food; `slotIndex` unique and `< unlockedSlots`; `0 <= hunger, cleanliness <= 100`; `0 <= growthProgress <= 100`; `trough.food <= trough.capacity`; `pigs.length + pregnantCount <= unlockedSlots`; every `skinId` in a pig is present in `player.ownedSkins`; `orders.length <= 3`.

---

# 6. CONFIGURATION — single source of truth

All numbers live in `src/core/config/`. No magic numbers elsewhere. TUNABLE values are expected to change during balancing.

## 6.1 Breeds

| Breed ID | Name (vi) | Buy | Base sell | Growth | Pregnancy | Max weight | Breedable | Default skin |
|---|---|---:|---:|---:|---:|---:|---|---|
| PIG_EARTH_PINK | Heo Hồng Đất | 500 | 1,200 | 7,200 s (2 h) | 3,600 s | 50 kg | yes | `pig_classic` |
| PIG_STRIPED_MELON | Heo Sọc Dưa | — | 3,000 | 14,400 s (4 h) | 5,400 s | 80 kg | yes | `pig_watermelon` |
| PIG_SUPERMAN | Heo Siêu Nhân | — | 12,000 | 28,800 s (8 h) | 10,800 s | 120 kg | yes | `pig_superhero` |
| PIG_MYTHICAL | Heo Thần Thoại | — | 50,000 | 86,400 s (24 h) | — | 250 kg | **no (D10)** | `pig_thienlong` |

Only PIG_EARTH_PINK can be bought. Everything else comes from breeding.

## 6.2 Derived per-breed care budgets (D16)

`hungerFullSec = growthSec / 3` — an unattended pig stalls at ~33% growth.
`cleanFullSec  = growthSec * 0.75` — the sickness threshold (cleanliness 30) is crossed at 0.7 x cleanFullSec, i.e. ~52% of growth time.

The agent MUST compute these from `growthSec` rather than hard-coding the results. The table is a check, not the source:

| Breed | hungerFullSec | hunger/s | cleanFullSec | clean/s | Sickness risk starts at |
|---|---:|---:|---:|---:|---:|
| PIG_EARTH_PINK | 2,400 | 0.041667 | 5,400 | 0.018519 | t = 3,780 s (63 min) |
| PIG_STRIPED_MELON | 4,800 | 0.020833 | 10,800 | 0.009259 | t = 7,560 s (2.1 h) |
| PIG_SUPERMAN | 9,600 | 0.010417 | 21,600 | 0.004630 | t = 15,120 s (4.2 h) |
| PIG_MYTHICAL | 28,800 | 0.003472 | 64,800 | 0.001543 | t = 45,360 s (12.6 h) |

## 6.3 Items

| Item | Price | Effect |
|---|---:|---|
| FOOD_BASIC | 25 | hunger +50 (capped at 100). Also the unit the trough consumes. |
| MEDICINE_COMMON | 100 | cures sickness |

## 6.4 Balance constants (TUNABLE)

```ts
export const BALANCE = {
  START_GOLD: 5000,
  START_SLOTS: 4,
  START_INVENTORY: { FOOD_BASIC: 10, MEDICINE_COMMON: 1 },
  START_TROUGH_CAPACITY: 20,

  HUNGER_MAX: 100,
  CLEAN_MAX: 100,
  FOOD_HUNGER_RESTORE: 50,

  STAGE_YOUNG_AT: 30,
  SICK_CLEAN_THRESHOLD: 30,
  SICK_CHANCE_PER_INTERVAL: 0.05,       // 5% ...
  SICK_INTERVAL_SEC: 600,               // ... per 10 minutes of exposure
  SICK_STARVING_MULTIPLIER: 2,          // doubled while hunger = 0 (D21: no death)

  // Trough (D17)
  TROUGH_AUTO_FEED_AT: 50,              // a pig auto-eats when hunger falls to this
  TROUGH_CAPACITY_PER_LEVEL: 10,        // capacity = START + (level-1) * this, cap 120

  // Happiness (D18)
  HAPPY_CLEAN_WEIGHT: 0.55,
  HAPPY_HUNGER_WEIGHT: 0.45,
  HAPPY_SICK_PENALTY: 40,
  SELL_MULT_MIN: 0.7,
  SELL_MULT_SPAN: 0.5,                  // price mult = MIN + SPAN * happiness/100

  BREEDING_FEE: 200,

  XP_EFFECTIVE_FEED_MAX_HUNGER: 80,
  XP_EFFECTIVE_CLEAN_MAX_CLEAN: 70,
  XP: { FEED: 2, CLEAN: 2, SELL: 10, BREED: 15, ORDER: 25, DISCOVERY: 30 },

  MAX_LEVEL: 10,
  LEVEL_XP: [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700],

  MAX_SLOTS: 12,
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

  // Orders (D20)
  ORDER_WINDOW_MS: 4 * 3600 * 1000,
  ORDER_TTL_MS:    8 * 3600 * 1000,     // an order outlives its window by one window
  ORDER_MAX_ACTIVE: 3,
  ORDER_REWARD_MULT: { 0: 1.5, 50: 1.8, 75: 2.2 },  // keyed by minHappiness

  DISCOVERY_BONUS_GOLD: 500,            // first time a breed or skin is seen
} as const;
```

**Sanity check the agent should reproduce in `sim:economy`:** a PINK pig from birth to adult consumes exactly 6 food units — hunger drains 100 over 2,400 s, auto-feed tops up +50 each time it falls to 50, so one unit per 1,200 s across the 7,200 s growth. At 25 gold that is 150 gold of food, against a 500 purchase and a 1,200 base sell:

| Happiness at sale | Sell price | Food | Net profit |
|---:|---:|---:|---:|
| 0 | 840 | 150 | **190** |
| 50 | 1,140 | 150 | **490** |
| 100 | 1,440 | 150 | **790** |

**Care is worth 4.2x the margin.** That ratio is the entire point of the rebalance, and §14.7 turns it into a build-failing assertion so a later balance edit cannot quietly destroy it.

## 6.5 Breeding matrix

Keys are canonical: the two breed IDs sorted alphabetically, joined with `:`. Weights sum to 100. Unchanged from v3.

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

`matrixKey(a, b) = [a, b].sort().join(":")`. Undefined combination gives `BREEDING_COMBINATION_NOT_SUPPORTED` — never fall back silently.

## 6.6 Breed to artwork mapping — the bridge to the asset bible

This table is what v3 was missing. It is the **only** place the game rules touch the art catalogue.

| BreedId | Default skin | Where it is in the pig catalogue | Concept art location |
|---|---|---|---|
| PIG_EARTH_PINK | `pig_classic` | §3 Base / Classic | row 1, col 1 — plain pink pig |
| PIG_STRIPED_MELON | `pig_watermelon` | §12 Food / Fun | row 1, col 2 — green striped melon pig |
| PIG_SUPERMAN | `pig_superhero` | §5 Job / Everyday | row 1, col 3 — purple pig, red cape |
| PIG_MYTHICAL | `pig_thienlong` | §22 Legendary / Mythic | row 1, col 4 — gold, winged, crowned |

All four already exist as concept art. They are the **top row of `asset/reference/style_reference_environment.png`, left to right in exactly this order**, and also the first four cells of row 1 in `asset/reference/style_reference_pigs.png`. Neither catalogue said so; both do now.

**Skin catalogue rule.** Every other skin in the asset bible is a purely cosmetic alternative. A skin declares which breeds may wear it:

```ts
interface SkinDef {
  id: string;                    // pig_farmer, pig_witch, ...
  nameVi: string;
  rarity: "P1" | "P2" | "P3" | "P4" | "P5";
  priceGold: number | null;      // null = not purchasable, unlock only
  unlock?: { kind: "LEVEL"; level: number } | { kind: "COLLECTION"; count: number };
  allowedBreeds: BreedId[] | "ALL";
  // v4.1: no `asset` path here. The skin id IS its asset id; the file path,
  // sleep frame and anchors live only in the manifest row with the same id (D24).
}
```

Suggested price ladder, TUNABLE: P1 = 2,000; P2 = 6,000; P3 = 15,000; P4 = 40,000; P5 = unlock only. This is the gold sink that section 1.2 was missing — at P3 and above it consumes the profit of several SUPERMAN sales.

**MVP scope for skins:** ship the 13 P1 skins listed in the asset bible section 33 plus the 4 breed defaults. The remaining ~100 concepts are data rows added later with no code change.

---

# 7. TIME SIMULATION ENGINE

No per-pig timers. State is reconstructed from timestamps, so the game behaves identically after a refresh, after closing the browser, or after days away.

## 7.1 When to advance

`advanceWorld(state, now, rng)` MUST be called on app load, on `visibilitychange` when the tab becomes visible, before every action, and on one global 1-second interval while visible. One interval for the whole game, never one per pig. It is cheap (at most 12 pigs) and idempotent for the same `now`.

## 7.2 `advancePig` — piecewise, unchanged from v3 except for the rates

The engine computes exactly how long the pig was allowed to grow, instead of applying growth across a whole delta in which the pig may have starved halfway.

```ts
export function advancePig(pig: Pig, now: number, rng: Rng): Pig {
  const dt = (now - pig.lastTickedAt) / 1000;
  if (dt <= 0) return { ...pig, lastTickedAt: now };            // D14

  const cfg = BREEDS[pig.breed];
  const hungerRate = 100 / cfg.hungerFullSec;                   // D16, per breed
  const cleanRate  = 100 / cfg.cleanFullSec;                    // D16, per breed

  // Seconds from lastTickedAt at which thresholds are crossed
  const tHungerZero = pig.hunger / hungerRate;
  const tCleanBelow = pig.cleanliness > BALANCE.SICK_CLEAN_THRESHOLD
    ? (pig.cleanliness - BALANCE.SICK_CLEAN_THRESHOLD) / cleanRate
    : 0;

  // D5 — memoryless sickness onset. Starving doubles the hazard (D21).
  let tSick = Infinity;
  if (!pig.isSick) {
    const exposure = dt - tCleanBelow;
    if (exposure > 0) {
      const starving = tHungerZero < tCleanBelow;
      const base = -Math.log(1 - BALANCE.SICK_CHANCE_PER_INTERVAL) / BALANCE.SICK_INTERVAL_SEC;
      const lambda = base * (starving ? BALANCE.SICK_STARVING_MULTIPLIER : 1);
      const sample = -Math.log(1 - rng.next()) / lambda;        // rng.next() in [0, 1)
      if (sample < exposure) tSick = tCleanBelow + sample;
    }
  }

  // Growth only while fed, healthy and not yet adult
  let growthSeconds = 0;
  if (!pig.isSick && pig.growthProgress < 100) {
    const tToAdult = (100 - pig.growthProgress) * cfg.growthSec / 100;
    growthSeconds = Math.min(dt, tHungerZero, tSick, tToAdult);
  }

  const growthProgress = Math.min(100, pig.growthProgress + growthSeconds * 100 / cfg.growthSec);

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

Why the exponential model matters, restated so nobody "simplifies" it away: with `lambda = -ln(1 - 0.05) / 600`, running this once over 600 s and running it 600 times over 1 s each both give exactly a 5% chance. A naive "5% roll per tick" would make the pig's health depend on how often the browser happened to run the loop.

Rules:
- Sickness freezes growth, blocks breeding, and drags happiness down 40 points. Cleaning does not cure it; only medicine does.
- Hunger at 0 freezes growth and doubles the sickness hazard. It never kills (D21).
- Hunger and cleanliness never leave `[0, 100]`.
- Adults keep decaying (D4) and can still get sick.
- Pregnancy does not change decay.

## 7.3 `resolveTrough` — auto-feeding, closed form (D17)

Called by `advanceWorld` **before** `advancePig`, over the same window. Pigs are processed in ascending `slotIndex` so the outcome is deterministic when food runs short.

```text
For each pig in slotIndex order, while trough.food > 0:
  r        = 100 / BREEDS[pig.breed].hungerFullSec       // hunger per second
  tFirst   = max(0, (pig.hunger - TROUGH_AUTO_FEED_AT) / r)   // when it first drops to 50
  if tFirst >= dt: continue                              // not hungry enough in this window
  period   = FOOD_HUNGER_RESTORE / r                     // seconds between two auto-feeds
  possible = 1 + floor((dt - tFirst) / period)
  eaten    = min(possible, trough.food)
  trough.food -= eaten
  pig.hunger   = min(100, pig.hunger + eaten * FOOD_HUNGER_RESTORE)
  // Feeding is credited at the moment it happens, so hunger decay for the
  // remaining window is applied afterwards by advancePig over the same dt.
```

Then set `trough.lastResolvedAt = now` and run `advancePig` for every pig.

**Ordering note the agent must respect:** `resolveTrough` adds hunger for the window, `advancePig` then subtracts decay for the same window. Doing it in the other order makes a pig that ate at t=0 look starved. Cover this with a test: a pig at hunger 50 with a stocked trough and `dt` = 2 periods must end the window above 50, not at 0.

Auto-feeding emits no per-meal event. `advanceWorld` emits `TROUGH_EMPTY` once when the trough reaches 0 with at least one hungry pig.

## 7.4 `advanceWorld`

```text
1. resolveTrough(state, now)                      // 7.3
2. For every pig: pig = advancePig(pig, now, rng)
3. Resolve pregnancies where pregnancy.endsAt <= now  (8.7)
4. Refresh orders whose window has rolled over, drop expired ones (8.13)
5. Diff before/after and return GameEvents:
     PIG_HUNGRY_ZERO, PIG_BECAME_SICK, PIG_BECAME_ADULT, BIRTH,
     TROUGH_EMPTY, ORDER_NEW, ORDER_EXPIRED, LEVEL_UP, DISCOVERY
6. Persist immediately if any event occurred — this is what stops a player
   from reloading the page to re-roll a sickness result.
```

---

# 8. ACTIONS

Every action is a pure function. Each one first runs `advanceWorld`, then validates, then returns a **new** state. Validation failures never modify state. The store persists only on `ok: true`.

```ts
type ActionContext = { now: number; rng: Rng };
type ActionResult =
  | { ok: true;  state: SaveGame; events: GameEvent[] }
  | { ok: false; error: ErrorCode };
```

Error codes:

```text
INVALID_REQUEST  PIG_NOT_FOUND  INSUFFICIENT_GOLD  INSUFFICIENT_ITEM
PIG_NOT_MATURE  PIG_IS_SICK  PIG_IS_PREGNANT  PIG_NOT_SICK
ALREADY_FULL  ALREADY_CLEAN  INVALID_BREEDING_PARTNERS
BREEDING_COMBINATION_NOT_SUPPORTED  NO_PIG_SLOT
LEVEL_TOO_LOW  MAX_SLOTS_REACHED  SAVE_CORRUPT  SAVE_TOO_NEW
TROUGH_FULL  SKIN_NOT_OWNED  SKIN_ALREADY_OWNED  SKIN_BREED_NOT_ALLOWED
ORDER_NOT_FOUND  ORDER_EXPIRED  ORDER_REQUIREMENTS_NOT_MET
```

## 8.0 Action feedback events (D25, v4.1)

Every successful action returns at least one event describing **what the player did**, in addition to any world events produced by the catch-up. These events are pure data; they are what the presentation layer animates and sounds (§11.3). The UI must never infer feedback by diffing states.

| Action | Event(s) |
|---|---|
| `buyPig` | `PIG_BOUGHT { pigId, breed }` (+ `DISCOVERY` when new) |
| `feedPig` | `PIG_FED { pigId }` |
| `cleanPig` / `cleanAll` | `PIG_CLEANED { pigIds }` |
| `treatPig` | `PIG_TREATED { pigId }` |
| `fillTrough` | `TROUGH_FILLED { units, fromInventory, gold }` |
| `buyItem` | `ITEM_BOUGHT { itemId, quantity, gold }` |
| `sellPig` | `PIG_SOLD { pigId, gold }` |
| `renamePig` | `PIG_RENAMED { pigId }` |
| `buySlot` | `SLOT_BOUGHT { slots, gold }` |
| `breedPigs` | `BREEDING_STARTED { motherId, fatherId, endsAt }` |
| `buySkin` / `equipSkin` | `SKIN_BOUGHT { skinId, gold }` / `SKIN_EQUIPPED { pigId, skinId }` |
| `fulfillOrder` | `ORDER_FULFILLED { orderId, gold }` |

`XP` gains that cross a level boundary add `LEVEL_UP` (already in §7.4). Gold amounts in events are signed as in the transaction, so `coin_collect` (§12) is "any event whose `gold > 0`".

## 8.1 `buyPig({ breed, gender })`
- `breed` must be PIG_EARTH_PINK, else `INVALID_REQUEST`. `gender` must be MALE or FEMALE (D6).
- `freeSlots >= 1` else `NO_PIG_SLOT`; `gold >= 500` else `INSUFFICIENT_GOLD`.
- Creates a pig in the lowest free `slotIndex`: BABY, progress 0, hunger 100, cleanliness 100, not sick, `skinId = BREEDS[breed].defaultSkin`, no cosmetics, `lastTickedAt = now`, default name from a Vietnamese pool ("Ủn Hồng", "Ủn Mập", "Ủn Béo", ...).
- Gold −500, transaction `PIG_PURCHASE`. Records a breed discovery if new (8.14).

## 8.2 `feedPig({ pigId })` — manual fallback
- Pig exists; `hunger < 100` else `ALREADY_FULL`; `inventory.FOOD_BASIC >= 1` else `INSUFFICIENT_ITEM`.
- Consume 1 food, `hunger = min(100, hunger + 50)`.
- XP +2 only if hunger before feeding was <= 80 (D11).

## 8.3 `cleanPig({ pigId })`
- Pig exists; `cleanliness < 100` else `ALREADY_CLEAN`. Free, no item.
- `cleanliness = 100`. XP +2 only if cleanliness before was <= 70 (D11). Does not cure sickness.

## 8.4 `cleanAll()` — MVP quality of life, promoted from v3 backlog
- Cleans every pig with `cleanliness < 100` in one dispatch. XP is awarded per pig under the same D11 rule. Never errors; if nothing was dirty it returns `ok: true` with no events.
- Rationale: with 12 slots, tapping each pig every session is the single most tedious thing in the v3 design.

## 8.5 `treatPig({ pigId })`
- Pig exists and `isSick` else `PIG_NOT_SICK`; `inventory.MEDICINE_COMMON >= 1` else `INSUFFICIENT_ITEM`.
- Consume 1 medicine, `isSick = false`. Does not restore hunger or cleanliness. No XP.

## 8.6 `fillTrough({ units })`
- `units` is an integer >= 1. `trough.food + units <= trough.capacity` else `TROUGH_FULL`.
- Takes from `inventory.FOOD_BASIC` first; if inventory is short, the shortfall is bought at shop price in the same action, requiring `gold >= shortfall * 25` else `INSUFFICIENT_GOLD`.
- Writes one `TROUGH_FILL` transaction for the gold actually spent (0 if it all came from inventory).
- `trough.capacity = min(120, START_TROUGH_CAPACITY + (level - 1) * TROUGH_CAPACITY_PER_LEVEL)`, recomputed on every level up.

## 8.7 `sellPig({ pigId })`
- Pig exists; `growthProgress = 100` else `PIG_NOT_MATURE`; not pregnant else `PIG_IS_PREGNANT`.
- `price = floor(BREEDS[breed].sellGold * (0.7 + 0.5 * happiness / 100))`, computed after `advanceWorld` (D18).
- Remove pig, gold + price, XP +10, transaction `PIG_SELL` with a note recording breed and happiness.
- Selling the same pig twice returns `PIG_NOT_FOUND` the second time.

## 8.8 `breedPigs({ pigAId, pigBId })`
Validation, in this exact order:
1. Both exist and `pigAId !== pigBId`, else `INVALID_BREEDING_PARTNERS`
2. Both `growthProgress = 100`, else `PIG_NOT_MATURE`
3. Neither sick, else `PIG_IS_SICK`
4. Neither pregnant, else `PIG_IS_PREGNANT`
5. Opposite genders, else `INVALID_BREEDING_PARTNERS`
6. Combination in the matrix and neither MYTHICAL, else `BREEDING_COMBINATION_NOT_SUPPORTED`
7. `freeSlots >= 1`, else `NO_PIG_SLOT` (reserves the child's slot, D8)
8. `gold >= 200`, else `INSUFFICIENT_GOLD`

Effect: gold −200 (`BREEDING_FEE`), XP +15. The **female** becomes pregnant with `endsAt = now + BREEDS[mother.breed].pregnancySec * 1000` (D22). `childBreed` (weighted random from the matrix) and `childGender` (50/50) are both decided **now**, so the result cannot change later. The male is unaffected and may breed again immediately. Append a `BreedingRecord` with `bornAt = null`.

## 8.9 Birth — automatic, inside `advanceWorld`
For each pregnant pig with `now >= pregnancy.endsAt`:
1. Create the child in the lowest free slot (guaranteed by D8): BABY, `childBreed`, `childGender`, hunger 100, cleanliness 100, `skinId = BREEDS[childBreed].defaultSkin`, **`lastTickedAt = pregnancy.endsAt`**, then run `advancePig(child, now)` so offline growth counts.
2. Mother's `pregnancy = null`.
3. `BreedingRecord.bornAt = pregnancy.endsAt`.
4. Emit `BIRTH`, and `DISCOVERY` if the breed is new (8.14).

Births are keyed by clearing `pregnancy`, so running `advanceWorld` twice can never create a duplicate.

## 8.10 `buyItem({ itemId, quantity })`
- Known item; `quantity` integer 1–99; total `price * quantity` else `INSUFFICIENT_GOLD`. Transaction `SHOP_PURCHASE`.

## 8.11 `buySlot()`
- Next slot = `unlockedSlots + 1`; `> MAX_SLOTS` gives `MAX_SLOTS_REACHED`.
- `level >= requiredLevel` else `LEVEL_TOO_LOW`; `gold >= cost` else `INSUFFICIENT_GOLD`.
- `unlockedSlots += 1`, transaction `SLOT_PURCHASE`.

## 8.12 `renamePig({ pigId, name })`
- Trim, 1–16 characters after trimming, strip control characters, else `INVALID_REQUEST`.

## 8.13 Skins — `buySkin({ skinId })` and `equipSkin({ pigId, skinId })` (D19)
- `buySkin`: skin exists else `INVALID_REQUEST`; not already owned else `SKIN_ALREADY_OWNED`; `priceGold != null` and `gold >= priceGold` else `INSUFFICIENT_GOLD`; any `unlock` condition met else `LEVEL_TOO_LOW`. Adds to `player.ownedSkins`, transaction `SKIN_PURCHASE`, records a skin discovery (8.14).
- `equipSkin`: skin owned else `SKIN_NOT_OWNED`; `allowedBreeds` includes the pig's breed or is `"ALL"` else `SKIN_BREED_NOT_ALLOWED`. Sets `pig.skinId`. Free and reversible. **Changes no number anywhere.**
- Cosmetic slots follow the same pattern and are additive: at most one item per slot, `equipCosmetic({ pigId, slot, cosmeticId | null })`.

## 8.14 Orders (D20)

**Generation is derived from the clock, so it is reproducible and needs no stored seed.**

```text
windowIndex = floor(now / ORDER_WINDOW_MS)
For slot in 0..2:
  seed  = hash(windowIndex, slot)              // stable 32-bit hash
  rng   = mulberry32(seed)
  order = {
    id: `${windowIndex}:${slot}`,
    createdAt: windowIndex * ORDER_WINDOW_MS,
    expiresAt: createdAt + ORDER_TTL_MS,
    wantBreed:   weightedPick(rng, breedsDiscoveredByPlayer),
    wantGender:  rng.next() < 0.4 ? pick(rng, ["MALE","FEMALE"]) : null,
    minHappiness: pick(rng, [0, 50, 75]),
    rewardGold:  round(BREEDS[wantBreed].sellGold * ORDER_REWARD_MULT[minHappiness]),
    rewardXp:    BALANCE.XP.ORDER,
    fulfilledAt: null,
  }
```

Only breeds the player has discovered can be requested, so an order is never impossible. During `advanceWorld`, orders whose `expiresAt <= now` are dropped (`ORDER_EXPIRED`) and the current window's orders are added if missing (`ORDER_NEW`). A fulfilled order keeps `fulfilledAt` set until it expires, so it cannot be claimed twice.

`fulfillOrder({ orderId, pigId })`:
- Order exists and not fulfilled, else `ORDER_NOT_FOUND`; `now < expiresAt` else `ORDER_EXPIRED`.
- Pig exists, ADULT, not pregnant; `pig.breed === wantBreed`; gender matches when `wantGender != null`; `happiness >= minHappiness`. Any mismatch gives `ORDER_REQUIREMENTS_NOT_MET`.
- Removes the pig (it is sold into the order), gold + `rewardGold`, XP + `rewardXp`, `fulfilledAt = now`, transaction `ORDER_REWARD`.

Orders are the difference between "sell whatever is ready" and "plan which pig to raise". At `minHappiness: 75` the reward is 2.2x base, which beats a perfectly cared-for normal sale (1.2x) by a wide margin — that is the intended pull.

## 8.15 Collection book
`collection.discoveredBreeds` and `discoveredSkins` are append-only. The first time a breed is owned (bought, born or equipped) or a skin is acquired, append it, grant `DISCOVERY_BONUS_GOLD` and `XP.DISCOVERY`, write a `DISCOVERY_BONUS` transaction and emit `DISCOVERY`. The book screen shows every known breed and skin with the undiscovered ones as silhouettes.

## 8.16 XP, level and gold
- `addXP` never lowers XP. If `level` increased, emit `LEVEL_UP { level }` and recompute `trough.capacity`.
- XP keeps accumulating past the level-10 threshold internally but displays as capped.
- **Every gold change goes through one helper that also writes a `Transaction`.** Never change gold anywhere else. This is covered by a test.

---

# 9. PERSISTENCE

## 9.1 Save and load (D2)
- Persist after every successful action, on every event from `advanceWorld`, every 30 s while the window is visible, on `visibilitychange -> hidden` (window minimised) and `pagehide`, and when the main process asks for a flush before quitting (§13.1). The store keeps one write queue; writes never overlap.
- The store talks to storage only through the `SaveStorage` port (`src/core/save/port.ts`): `load(): Promise<LoadResult>` and `save(save): Promise<void>`. Parsing, validation (`zod`) and migration stay in core; the adapter only moves JSON strings.
- **Desktop adapter (the product).** Files live in the per-user data directory (`app.getPath('userData')`, on Windows `%APPDATA%\Un In Homemade\`):

  ```text
  saves/save.json                         current save
  saves/save.json.tmp                     write target: write → flush → rename over save.json (atomic)
  saves/backups/save-YYYYMMDD-HHmmss.json rotating backups, newest 10 kept
  ```

  A backup is taken from the last good `save.json` before the first write of each session and then at most once every 15 minutes, so the 10 backups span hours, not seconds. The renderer never touches the file system: it calls `window.unin.save.*`, which the preload forwards over IPC to `electron/saveFiles.ts`.
- **Dev browser adapter.** IndexedDB database `un-in-homemade`, store `saves`, key `current`, plus the v4.0 localStorage mirror (`un-in-homemade:save:mirror`) and backup (`un-in-homemade:save:backup`). Kept so `npm run dev` stays a fast iteration loop; it is not shipped.
- First launch creates the starter state (D7) with an `INITIAL_GOLD` transaction.

Why files rather than SQLite or a local server: the save is one small document (at most 12 pigs, 200 transactions, 100 breeding records — tens of kilobytes) that is always read and written whole. A database adds a native module and a schema with nothing to query; a local HTTP API adds a port and a firewall prompt. A JSON file with atomic replace and backups is the simplest thing that is also durable, inspectable and easy to copy between machines.

## 9.2 Corruption and safety
- Read chain: `save.json` → newest valid backup → next backup … → **recovery screen** offering choose-a-backup, import-from-file, or start-new-game with an explicit confirmation. (Browser adapter: primary → mirror → backup → recovery.) **Never silently wipe, never delete a file that failed to parse** — rename it to `save.corrupt-YYYYMMDD-HHmmss.json` so it can be inspected.
- `schemaVersion` greater than the app's version gives `SAVE_TOO_NEW`; stop the chain (do not fall back to an older copy) and refuse every write.
- `migrate(raw)` runs sequential `vN -> vN+1` migrations. v3 saves are `schemaVersion: 1`; the v1 to v2 migration must add `trough`, `orders`, `collection`, `player.ownedSkins`, `settings.reduceMotion`, and set `skinId`/`cosmetics` on every existing pig from the breed defaults. Unit-test each migration plus a "future version" case.
- **A failed write is never swallowed.** The store exposes `saveError` in its snapshot; the UI shows a persistent banner ("Chưa lưu được — đang thử lại"), the store retries with backoff (1 s, 5 s, 30 s, then every 30 s), and the in-memory state is kept. Quitting while a write is pending waits for the queue (at most 3 s) before the window closes.

## 9.3 Export and import
- Settings screen offers **Export save** (native save dialog, default name `un-in-save-YYYYMMDD-HHmm.json`), **Import save** (native open dialog, validate, confirm overwrite, the current save becomes a backup first) and **Open save folder** (opens `saves/` in Explorer). The browser adapter falls back to download/file input.
- Update `settings.lastExportAt`. If the last export is older than 7 days, show one gentle reminder per session — files survive app updates and uninstall, but not a dead disk.
- Copying `save.json` to another machine (or keeping the data folder in a synced folder such as OneDrive) is the supported way to move a farm. Running the game on two machines at the same time against a synced folder is not supported; the README says so.

## 9.4 One running instance
- Desktop: the main process takes `app.requestSingleInstanceLock()`. A second launch does not open a second window; it focuses and restores the existing one. Two writers on one save are therefore impossible on one machine.
- Dev browser build only: detect a second tab with `BroadcastChannel`; the second tab shows "Game đang mở ở tab khác" and is read-only.
- v4.0's `navigator.storage.persist()` call and the Install / Add to Home Screen hint are removed: they only existed to fight browser eviction.

## 9.5 Away summary
If the player was away >= 10 minutes, show a "Trong lúc bạn vắng mặt" modal built from the `advanceWorld` events: pigs that reached adulthood, pigs that ran out of food, pigs that got sick, births, whether the trough ran dry and when, expired and new orders.

The trough line is the important one — "Máng ăn hết lúc 03:20, 4 heo ngừng lớn trong 5 giờ" is the feedback that teaches the player to stock up before logging off.

---

# 10. UI / UX

## 10.1 Layout

```text
┌────────────────────────────────────────────────┐
│ Lv 3  XP 320/500      Gold 8,420   🥣 12/30  ⚙ │
├────────────────────────────────────────────────┤
│                                                │
│                  FARM AREA (Phaser)            │
│         🐖            🐖                       │
│                 🐖                             │
│                                                │
├────────────────────────────────────────────────┤
│ Farm    Shop    Kho    Đơn hàng    Bộ sưu tập  │
└────────────────────────────────────────────────┘
```

The trough gauge sits in the top bar next to gold, because it is the number the player must act on before logging off. Tapping it opens the fill dialog. It turns red at 0.

## 10.2 Selected pig panel

```text
Tên (chạm để đổi)     Giống     Giới tính     [Skin ▾]
Tăng trưởng ▓▓▓▓░░░░ 55%   (BABY / YOUNG / ADULT)
Cân nặng   Đói   Sạch   Sức khỏe   😊 Vui vẻ 82  → giá bán x1.11
Mang thai: còn 42 phút

[Cho ăn] [Tắm] [Thuốc] [Phối giống] [Bán] [Giao đơn]
```

- Invalid actions are **disabled with a visible reason** ("Chưa trưởng thành", "Hết thuốc", "Hết chỗ chứa", "Chưa đủ vui vẻ").
- The happiness row must show the resulting **price multiplier**, not just a number. That single line is what makes care legible; without it the player cannot see why cleaning matters.
- Selling asks for confirmation showing the final price. Mandatory for SUPERMAN and MYTHICAL.
- Breeding opens a picker of valid partners and shows the matrix probabilities before confirming.
- Toasts for events: sick, adult, birth, level up, trough empty, new order.

## 10.3 First-run tutorial
Skippable, 5 steps: buy a pig (choose gender) → fill the trough → clean → see growth → read the happiness-to-price line. Stored in `settings.tutorialDone`. Step 2 is new and is the step that teaches the actual loop.

## 10.4 Window and layout (v4.1: desktop)
- The game runs in one desktop window: default 1280 × 800, minimum 1024 × 640, resizable, remembers its size and position, F11 toggles fullscreen. Layout is comfortable from 1024 to 1920 px wide; no mobile layout is required in v1 (D1).
- Click targets >= 44 px, no hover-only interaction, no horizontal scrolling, keyboard focus visible. Menus may use a side panel; the farm view stays visible behind modals.
- The Phaser canvas resizes with its container and keeps the farm layout's aspect by letterboxing with the environment background, never by stretching sprites.
- `settings.reduceMotion` disables wandering, particles and non-essential tweens. Also respect `prefers-reduced-motion` as the initial value.

## 10.5 i18n
All strings in `src/i18n/vi.ts`. No hard-coded player-facing text anywhere else.

---

# 11. PHASER, SCENE AND PRESENTATION

Scenes: `BootScene` (read manifest, generate fallback textures), `PreloadScene` (load what the farm needs, show a progress bar), `MainFarmScene` (the farm). Menus, panels and modals stay DOM (§4); Phaser draws the world only.

Pig visual state is derived from data, never stored: `idle`, `walk`, `eat`, `clean`, `sleep`, `happy`, `sick`, `pregnant`.

**These states are produced by composition, not by drawing a new pig for each one.** The art standard section 3 is normative; the rule for the programmer is:

| State | How it is rendered | New art needed |
|---|---|---|
| idle | base sprite + slow breathing scale tween | no |
| walk | base sprite + squash/stretch tween + flipX for direction (D23) | no |
| eat | base sprite rotated ~8 deg toward the trough + crumb particles | no |
| clean | base sprite + bubble particle emitter + brief brightness tween | no |
| sleep | dedicated `_sleep` frame (lying down, eyes closed) | **yes, 1 frame** |
| happy | base sprite + hop tween + heart particles | no |
| sick | base sprite + green tint + `fx_sick` overlay (sweat drop, wobble) | overlay only |
| pregnant | base sprite + `fx_pregnant` badge above the pig | overlay only |

So a fully expressive pig costs **2 drawn images** (`idle`, `sleep`) plus two shared overlays reused by every pig, not 8 images per pig. Sprite scale grows with `growthProgress` (baby small, adult larger), which lets placeholder art work before final art exists.

Wandering is visual only, stays inside farm bounds, pauses during interaction animations, and never changes game state. Draw order is sorted by Y so a pig lower on screen renders in front — that plus a small scale change with Y is the entire depth illusion and is why front and back views are unnecessary (D23).

**Placeholder assets MUST work before final art exists.** Final art is swapped in through `public/assets/manifest/assets.json` with no code change (D24).

## 11.1 Farm scene layout (v4.1)

The farm is one fixed-size logical scene (design size 1600 × 900, scaled to the canvas). Its composition is **data** — the `layout` section of the manifest (art standard §7.2), in normalised 0–1 coordinates — so art can be re-arranged without code:

| Layer (back → front) | Content | Asset ids |
|---|---|---|
| 0 sky | sky gradient, clouds (may drift slowly) | `env_sky`, `env_cloud_*` |
| 1 far | hills, distant trees | `env_hills_far`, `env_trees_mid` |
| 2 ground | grass field, tiled or one image | `env_ground_grass` |
| 3 structures | pig house, hay shed, well, fence row, order board, small props | `prop_pig_house`, `prop_hay_shed`, `prop_water_well`, `prop_fence_section`, `prop_order_board`, `prop_*` |
| 4 actors | trough (3 states) and pigs, **Y-sorted together** | `prop_feed_trough_*`, skins |
| 5 overlays | `fx_*` attached to the `fx_above` anchor, particles | `fx_*` |
| DOM | top bar, panels, dialogs, toasts | `ui_*` |

`layout` also defines `walkArea` (rect the pigs wander in), the `trough` and `orderBoard` positions, the `pigScale` range by Y (0.85–1.0) and where each structure/prop sits. Missing environment assets fall back to flat colour fills so the scene always renders (§11.4).

## 11.2 Entity sync

`MainFarmScene` keeps `Map<pigId, PigSprite>` and reconciles it with every store snapshot: create sprites for new pigs, update texture/scale/overlays for existing ones, destroy (with a short exit tween) the ones that are gone. The mapping `(pig, now, layout) → { textureId, scale, flipX, overlays, visualState }` is a pure function with unit tests; Phaser code only applies its result. Clicking a pig selects it (DOM panel updates), clicking empty ground deselects.

## 11.3 Presentation event contract (D25)

One `FeedbackDirector` (`src/game/feedback/`) subscribes to `store.onEvents` and is the only place that turns events into presentation. Order per event: **animation → VFX → sound → UI toast**. The table is data (`feedbackTable.ts`), so adding an event is one row, not edits in several files.

| Event | Animation (pig/scene) | VFX | Sound (§12) | UI |
|---|---|---|---|---|
| `PIG_BOUGHT` | pig drops in with a bounce | `fx_sparkle` | `ui_click` | toast |
| `PIG_FED` | `eat` state 1.5 s | `fx_crumb` | `feed_munch` | — |
| `TROUGH_FILLED` | trough sprite swaps state, small shake | `fx_crumb` | `feed_munch` | gauge updates |
| `PIG_CLEANED` | `clean` state per pig, staggered | `fx_bubble` | `water_splash` | — |
| `PIG_TREATED` | `happy` hop, sick tint fades | `fx_sparkle` | `ui_click` | toast |
| `PIG_SOLD` | pig hops off-screen | `fx_coin` burst | `coin_collect` | toast with price |
| `BREEDING_STARTED` | both pigs `happy` | `fx_heart` | `breed_chime` | toast |
| `BIRTH` | newborn pops in next to mother | `fx_heart`, `fx_sparkle` | `birth_fanfare` | toast |
| `PIG_BECAME_ADULT` | scale tween to adult size | `fx_sparkle` | `level_up` | toast |
| `PIG_BECAME_SICK` | sick state | `fx_sick` | `notify` | toast |
| `LEVEL_UP` | — | `fx_sparkle` near top bar | `level_up` | toast |
| `TROUGH_EMPTY`, `ORDER_NEW` | trough / board wiggle | — | `notify` | toast |
| `ORDER_FULFILLED`, `DISCOVERY` | — | `fx_coin` | `coin_collect` | toast |
| `SKIN_BOUGHT`, `SLOT_BOUGHT`, `ITEM_BOUGHT`, `PIG_RENAMED` | — | — | `ui_click` | toast |
| `SKIN_EQUIPPED` | texture swap with a puff | `fx_sparkle` | `ui_click` | — |
| rejected action (`ok: false`) | — | — | `ui_error` | toast with reason |

`coin_collect` additionally plays for any event whose `gold > 0` that is not listed above. Events produced by a long catch-up (opening the game after hours away) are **not** replayed as animations; they feed the away summary (§9.5). The director animates only events from actions and from ticks while the window is visible. `reduceMotion` keeps sounds and toasts and drops tweens and particles.

## 11.4 Loading and missing assets

- `BootScene` loads and validates the manifest. An invalid manifest is a startup error screen with the validation message (a development bug, not a player state).
- `PreloadScene` loads environment, trough, fx, UI icons, audio and the skins of the pigs currently on the farm, with a progress bar. Other skins load lazily; shop and collection use DOM `<img>` thumbnails resolved through the registry.
- Missing or failed file → generated placeholder texture (rounded rectangle in the breed colour, feet on the 82 % line); missing skin → breed default; missing `_sleep` → idle + `fx_zzz`; missing audio → silence. Each fallback is logged once, in development builds only.

---

# 12. AUDIO

Canonical keys — these replace the two conflicting naming schemes in the v3 spec and the v4 environment asset list:

| Key | Trigger |
|---|---|
| `music_farm` | Background loop |
| `ui_click` | Any button |
| `ui_error` | Rejected action |
| `pig_oink_happy` | Pig tapped, happiness >= 50 |
| `pig_oink_hungry` | Pig tapped, hunger < 30 |
| `feed_munch` | Feeding, manual or trough refill |
| `water_splash` | Cleaning |
| `coin_collect` | Any positive gold change |
| `breed_chime` | Breeding confirmed |
| `birth_fanfare` | Birth |
| `level_up` | Level up or stage change |
| `notify` | Order appeared, trough empty |

Audio files are resolved through the `audio` section of the manifest by these exact keys (art standard §7.2); a missing file plays nothing. Music starts on launch in the desktop app (the shell disables the autoplay gesture requirement); the dev browser build starts it after the first user gesture. Toggles `musicOn` / `sfxOn` live in `settings`. Use original or CC0 audio and list credits in `README.md`, the credits screen and the manifest row (`credit`, `license`).

---

# 13. DESKTOP RUNTIME, PACKAGING AND OFFLINE (v4.1)

## 13.1 Process model
- **Main process** (`electron/main.ts`): creates the window (§10.4), registers the privileged `app://` scheme with `protocol.handle` and serves the built `dist/` from inside the app package, takes the single-instance lock (§9.4), handles save IPC (§9.1) and native dialogs (§9.3), and on `before-quit` asks the renderer to flush the save queue (max 3 s).
- **Preload** (`electron/preload.ts`): exposes exactly one object through `contextBridge`, `window.unin = { save: { load, write, listBackups, restoreBackup, exportTo, importFrom, openFolder }, app: { version, onFlushRequest } }`. Nothing else from Node reaches the page.
- **Renderer**: the same Vite build as the browser target. `src/platform/index.ts` picks the desktop adapters when `window.unin` exists, the web adapters otherwise.
- **No HTTP server, no port, no localhost** in the shipped app: `loadURL('app://game/index.html')`. Vite builds with `base: './'` so every asset URL is relative.

## 13.2 Security and offline
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`. A Content-Security-Policy allows only `'self'` / `app:` sources.
- Navigation away from `app://`, `window.open`, and every permission request are denied. Every `http(s)` request from the renderer is cancelled by a session `webRequest` filter: the game makes **zero** network requests and works with the network unplugged from the first launch.
- No CDN fonts or scripts, no analytics, no telemetry, no crash upload.

## 13.3 Packaging and installation
- `electron-builder`, Windows target `nsis`, per-user install (no admin prompt), `oneClick: false` with a chosen install folder, Desktop and Start Menu shortcuts, product name "Ủn Ỉn Homemade", executable `UnInHomemade.exe`, app id `com.uninhomemade.game`, icon `build/icon.ico` generated from a 1024 px `build/icon.png` (art standard §7.3).
- Uninstall removes the program and **never** `%APPDATA%\Un In Homemade\` (D26).
- Scripts: `npm run dev` (browser, fast iteration), `npm run dev:desktop` (Electron against the Vite dev server — the only place a dev port exists), `npm run build` (renderer + electron), `npm run dist:win` (installer into `release/`).
- The installer is not code-signed in v1; Windows SmartScreen shows "More info → Run anyway". Documented in README.

## 13.4 Updates
No auto-updater (it would need the network). A new version is a new installer run over the old one; the save in the user data folder is untouched and migrated on next load (§9.2). The credits screen shows the app version.

## 13.5 Limitations to document in README
A closed desktop app cannot deliver background notifications; the away-summary modal (9.5) is the deliberate substitute. Saves are per Windows user; moving them is a file copy (§9.3).

---

# 14. TESTING

Vitest. All `core` tests use a fake clock and a seeded RNG (`mulberry32`); tests never call `Date.now()` or `Math.random()`.

## 14.1 Engine golden values
PINK baby, progress 0, hunger 100, cleanliness 100, trough empty unless stated. Rates from 6.2.

| Case | Expected |
|---|---|
| advance 1,200 s | hunger 50, cleanliness 77.8, progress 16.67 |
| advance 2,400 s | hunger 0, cleanliness 55.6, progress 33.33 |
| advance 7,200 s, no trough | hunger 0, progress **33.33** — growth stopped at t=2,400 |
| advance 7,200 s, trough stocked with 10 | progress 100 (adult), trough food 4 |
| cleanliness crosses 30 | exactly at t = 3,780 s |
| sick pig advance | growth unchanged; hunger and cleanliness still decay |
| `now < lastTickedAt` | no change except `lastTickedAt = now` |
| split invariance | `advance(a+b)` equals `advance(a)` then `advance(b)` with a never-sick RNG |
| sickness, `rng.next() = 0` | sick the moment cleanliness drops below 30 |
| sickness, `rng.next() = 0.9999` | not sick within 1 h of exposure |
| sickness statistics | over many seeded runs ~5% of 600 s exposures become sick (state the tolerance) |
| starving hazard | with hunger 0, measured sickness rate is ~2x the fed rate |

## 14.2 Trough tests (new, and the most failure-prone area)
- Order of operations: pig at hunger 50, trough 5, `dt` = 2 periods ends **above 50**, not 0.
- Trough with 1 unit and 3 hungry pigs: the pig with the lowest `slotIndex` eats; the result is identical on every run.
- Trough empty for the whole window: identical to v3 behaviour, growth stalls at `tHungerZero`.
- `advanceWorld` twice with the same `now` consumes food only once (idempotence).
- 3-day offline window with a full trough: food is consumed, never negative, and growth is capped at 100.
- `fillTrough` beyond capacity gives `TROUGH_FULL` and changes nothing.

## 14.3 Action tests
feed (`ALREADY_FULL`, XP only when <= 80, item consumed once, cap at 100); clean (`ALREADY_CLEAN`, XP only when <= 70, does not cure); `cleanAll` (no error on a clean farm, per-pig XP rule); treat (`PIG_NOT_SICK`, `INSUFFICIENT_ITEM`); sell (happiness multiplier at 0, 50 and 100; baby gives `PIG_NOT_MATURE`; pregnant gives `PIG_IS_PREGNANT`; second sell gives `PIG_NOT_FOUND`); buyPig (gold/slot checks, gender respected, lowest free slot); buySlot (level and gold gates, cap at 12); rename validation; **gold never changes without a transaction**.

## 14.4 Breeding tests
Every matrix entry sums to 100 and `A+B` resolves the same as `B+A`; seeded 10,000-sample distribution within tolerance; undefined and MYTHICAL combinations rejected; same gender, same pig, sick, pregnant, immature, no free slot and insufficient gold each give the right error **with no state change**; the child is fixed at breeding time (changing the RNG afterwards does not change it); birth at `endsAt − 1 s` gives nothing and at `endsAt` gives exactly one child; running `advanceWorld` again still gives one child; child growth counts time since `endsAt`; birth after 3 days offline works; with 4 slots, 2 adults and 1 pregnancy, `freeSlots = 0` for buying but birth always finds a slot; per-breed `pregnancySec` is respected (D22).

## 14.5 Orders and collection tests
Same `windowIndex` always generates the same 3 orders; a different window generates different ones; only discovered breeds appear; expiry drops the order and emits `ORDER_EXPIRED`; `fulfillOrder` rejects wrong breed, wrong gender and insufficient happiness; a fulfilled order cannot be claimed twice; discovery bonus fires exactly once per breed and per skin.

## 14.6 Save tests
Round-trip equality; each migration including **v1 (a real v3 save) to v2**; future `schemaVersion` refused and the chain stops; import rejects invalid JSON and invalid schema without touching the existing save; invariants (5.5) hold after every action in a randomised fuzz test. Per adapter: **desktop** (`electron/saveFiles.ts`, tested with a temp directory) — interrupted write leaves the previous `save.json` intact, corrupt `save.json` falls back to the newest valid backup and is renamed `save.corrupt-*`, backup rotation keeps 10 and respects the 15-minute spacing; **web** — corrupt IndexedDB falls back to the mirror, then the backup. **Store** — a failing `SaveStorage.save` sets `saveError`, keeps the state and retries.

## 14.7 Economy simulation
`npm run sim:economy` prints, per breed: base sell, growth hours, food units needed to reach adult, food cost, net gold per hour per slot at happiness 0 / 50 / 100, and hours of play to afford each slot unlock and each skin tier. **Fail the build if net gold per hour at happiness 100 is not at least 2x the value at happiness 0** — that ratio is the mechanical statement of "caring for pigs matters", and a future balance edit that breaks it should not pass silently.

## 14.8 Smoke test (Playwright + Electron)
Against the unpacked production build (`_electron.launch`), with a temporary user data directory: first launch → buy pig → fill trough → close the app → relaunch → pig and trough still there → export save to a temp file. Also assert that no network request was attempted.

## 14.9 Asset tests
`npm run assets:check` (part of `npm run check`): manifest passes its zod schema; every id referenced by config (breed default skins, shop skins, the 12 audio keys, the fx set, trough states, layout ids) has a row; every path exists; images match the size, alpha and naming rules of the art standard §4 and §7 for their `status`; no orphan files under `public/assets/`; `grep` finds no `.png`/`.ogg`/`.mp3` literal under `src/`.

---

# 15. ACCEPTANCE CRITERIA

**Phase 1 — Core farm.** First launch creates the starter state; the tutorial works. Buying a pig (with gender) puts it on the farm and it survives closing and relaunching the game. Hunger and cleanliness decay correctly including across hours away. Growth works and stops at the exact moment hunger hits 0 or sickness starts. Feed, clean, cleanAll, medicine work with the correct errors. An adult can be sold, the happiness multiplier is visible and correct, every gold change has a transaction. The away summary appears after >= 10 minutes.

**Phase 2 — Trough, shop, progression.** Filling the trough works from inventory and from gold. Pigs auto-eat while away and the away summary reports when the trough ran dry. Shop, inventory, XP, levels, the anti-spam XP rule, level-gated slot purchases and the transaction history screen all work.

**Phase 3 — Breeding, orders, collection.** Breeding validation, fee, weighted result and per-breed pregnancy countdown work. Pregnancy and birth survive a relaunch with no duplicates and the slot reservation holds. Orders generate deterministically, expire, and pay out. The collection book fills and pays the discovery bonus once. Skins can be bought and equipped and change nothing but the picture.

**Phase 4 — Presentation.** The farm scene renders every layer of §11.1; all 8 pig states work; every row of §11.3 produces its animation, effect, sound and toast; music and all 11 sound effects play; loading, error and empty states exist; `reduceMotion` honoured. All v1-scope assets (art standard §10, waves 1–2) are at `status: production` or `final`.

**Phase 5 — Desktop release.** One installer; Desktop and Start Menu shortcuts with the app icon; double-click opens the game with no terminal, server, port or network; save survives quit, crash, reinstall and uninstall; backups, recovery, export/import and "open save folder" work; a second launch focuses the running window; all tests pass, including 14.7, 14.8 and 14.9; verified on a Windows machine without Node installed.

---

# 16. DEVELOPMENT ORDER

```text
 1. Project skeleton (Vite + TS + Vitest + lint)                       done (S00)
 2. core/types, config, rng, clock                                     done (S02)
 3. advancePig + advanceWorld + unit tests           ← 14.1             done (S03, S04B)
 4. resolveTrough + trough tests                     ← 14.2             done (S04A)
 5. Save schema, storage, migrate, export/import + tests                done (S05)
 6. Actions: buyPig, feed, clean, cleanAll, treat, fillTrough, sell     done (S06A, S06B)
 7. gameStore (dispatch, persist, notify, one global interval)          done (S07)
 8. Minimal DOM UI, no Phaser: pig list + action buttons + trough gauge done (S08A, S08B)
        ← THE GAME MUST BE PLAYABLE AND FUN HERE. Stop and play it.
 9. Platform seam: SaveStorage port out of core, saveError, base './'   (v4.1)
10. Desktop shell + file save + installer — play step 8 from the installed app
11. Shop, inventory, XP/levels, slots, transaction history
12. Asset foundation: manifest v2, registry, placeholders, assets:check
13. Phaser farm scene (layout, entity sync, trough, picking) + action events + FeedbackDirector
14. Breeding, pregnancy, birth + tests
15. Orders + collection book + skin shop + tests
16. Economy simulation script + invariant fuzz
17. Pig visual states, wandering, overlays, reduceMotion
18. Audio
19. UX completion: desktop layout, tutorial, away summary, settings, recovery
20. Presentation polish, final packaging, QA, README
    Art waves (art standard §10) run in parallel from step 12 on.
```

Do not start Phaser or visual polish before step 8 is playable and the core tests pass. If the game is not enjoyable as a text list of pigs with buttons, no amount of art will fix it — and step 8 is the cheapest possible place to discover that. The desktop shell comes early (step 10) on purpose: every later step is then verified in the real runtime, not in a browser tab.

---

# 17. README REQUIREMENTS

Overview, architecture (the layer diagram of §4), how to install and play (installer, SmartScreen note), dev/build/dist commands, test commands, how saves work (folder, atomic write, backups, recovery, export/import, moving a farm to another machine), how to tune `BALANCE`, how to add a breed, how to add or upgrade a skin or any asset **without touching code** (manifest row + file + `assets:check`), asset and audio credits, known limitations (no background notifications, Windows only, saves are per Windows user, not code-signed), and implementation assumptions.

---

# 18. OPEN DECISIONS FOR THE DESIGNER

The agent must implement the value shown; these are flagged because they are judgement calls, not oversights.

| # | Question | v4 default | Why it might change |
|---|---|---|---|
| Q1 | Should `cleanAll` also feed? | No — trough handles feeding | A single "chăm sóc tất cả" button is simpler, but removes the trough decision |
| Q2 | Is 3 hours of stall (PINK, empty trough) too punishing? | No — nothing is lost, only time | If playtesting shows frustration, raise `hungerFullSec` to `growthSec / 2` |
| Q3 | Should MYTHICAL be breedable at level 10? | No (D10) | It is the only "end" the game has; unlocking it might be a better ending |
| Q4 | Skin prices | 2k / 6k / 15k / 40k | Depends entirely on how fast gold actually accrues; check `sim:economy` first |
| Q5 | Order reward multipliers | 1.5 / 1.8 / 2.2 | If orders dominate normal selling, lower the top tier to 1.9 |

---

# 19. CHANGES FROM v3

**Kept unchanged:** pure-core architecture, injected clock and rng, the piecewise `advancePig` and its exponential sickness model, the derived `growthStage` and `level`, slot reservation for pregnancy (D8), the breeding matrix, the save/backup/recovery/export philosophy, the "playable before Phaser" development order.

**Fixed:**
- Rebalanced hunger and cleanliness per breed (D16) so the game requires play at all. This is the single most important change.
- Replaced the flat sick price cliff with a continuous happiness multiplier (D18), so care pays off at every level.
- Per-breed pregnancy duration (D22) instead of one hour for everything including the 24-hour mythical pig.
- Canonical audio key list, replacing two conflicting naming schemes.

**Added:**
- Feed trough with closed-form offline auto-feeding (D17) — the mechanic that makes an idle game work while closed.
- NPC orders, deterministically generated from the clock (D20) — goals and a reason to raise a specific pig.
- Collection book and gold-sink skin shop (D19) — an endgame target, and the bridge that finally makes the 245 drawn assets reachable from the data model.
- `cleanAll`, promoted from backlog because 12 individual taps per session is the worst part of the v3 design.
- `settings.reduceMotion`.
- IndexedDB with a localStorage mirror (D2), for write performance rather than durability. *(Superseded in v4.1 by file saves — §19.1.)*
- An explicit breed-to-artwork mapping (6.6) and a rendered-state table (section 11), so the spec and the asset bible finally describe the same game.

**Explicitly rejected:** pig death or removal by neglect (D21 — wrong for a cozy game), gacha or paid boxes (D19), and four-directional sprites (D23 — see the art standard for the full reasoning).

## 19.1 Changes in v4.1 (desktop edition)

**Why:** the product goal is "install, double-click the icon, play offline" with a game that feels finished — characters, environment, animation, effects and sound — not a web page. A PWA needs a host and a browser profile; the save lived in storage the browser may evict. Game rules, balance and golden values are **unchanged**.

| Area | v4.0 | v4.1 |
|---|---|---|
| Runtime (D1) | PWA, PC + mobile browser | Windows desktop app, Electron shell, `app://` protocol, no server or port (§13) |
| Save (D2) | IndexedDB + localStorage mirror | JSON file, atomic write, 10 rotating backups, native export/import; IndexedDB kept for the dev browser build (§9) |
| Core purity | `save/storage.ts` exception | No exceptions; storage behind the `SaveStorage` port in `src/platform/` (§4.1) |
| Multi-instance | BroadcastChannel second-tab lock | Single-instance lock (§9.4) |
| Assets (D24) | manifest v1 example | manifest v2: lifecycle `status`, `environment`, `audio`, `layout`, frames, credits (art standard §7.2) |
| Presentation (D25) | "play events (toast/sound/animation)" | Action events for every action (§8.0), farm layout (§11.1), entity sync (§11.2), event contract (§11.3), loading and fallbacks (§11.4) |
| Distribution (D26) | static hosting | NSIS installer, shortcuts, icon, uninstall keeps saves, update = install over (§13.3–13.4) |
| Layout | 360 px mobile → desktop | Desktop window 1024 px minimum (§10.4) |
| Removed | service worker, manifest.webmanifest, install hint, `navigator.storage.persist()`, update prompt, `npm run preview` hosting | — |

---

# 20. BACKLOG — not MVP, do not implement unless asked

1. **Crops and the veggie patch.** The environment asset list already specifies garden beds, cabbage, corn, apples and sunflowers. The natural design is a second food tier: home-grown food is free but takes real time, bought food is instant but costs gold. This is the best next system and it is deliberately out of v1 because the trough must prove itself first.
2. **Farm decorations** as a second gold sink, with a small happiness bonus feeding the `decorBonus` term reserved in 5.4.
3. **Random events and market days** — sell price +20% for a day, rain makes pigs dirtier faster.
4. **Achievements** and a daily login reward.
5. **Seasonal skin rotation** driven by the asset bible's seasonal collections.
6. **Other platforms** — macOS/Linux builds of the desktop shell, or a Capacitor wrapper for mobile stores (which would also enable real local push notifications, "Ủn đẻ rồi!"). v4.1 is Windows only (D1).
7. **Cosmetics equip system** (hats, glasses, capes on any pig). The data field `Pig.cosmetics` exists and stays empty in v1; no equip action, no cosmetic shop (DECISIONS C3). The 129 cosmetic concepts and the anchor system (art standard §5) are ready for it.
8. **Optional cloud backup** of the save file. Not needed in v1: keeping the data folder inside a synced folder already moves a farm between machines (§9.3).

---

# APPENDIX A — CONFIG FILES, VERBATIM

These are not illustrations. Create them exactly as written. Every number in them is traceable to a section above, and nothing else in the codebase may hard-code any of these values.

## A.1 `src/core/config/breeds.ts`

```ts
import type { BreedId } from "../types";

export interface BreedDef {
  id: BreedId;
  nameVi: string;
  buyGold: number | null;      // null = cannot be bought, only bred
  sellGold: number;            // base price before the happiness multiplier
  growthSec: number;
  pregnancySec: number | null; // null = cannot breed (D10)
  maxWeight: number;           // display only
  breedable: boolean;
  defaultSkin: string;         // §6.6
  hungerFullSec: number;       // derived, D16
  cleanFullSec: number;        // derived, D16
}

/** D16 — care budgets are derived from growth time, never hand-tuned per breed. */
const care = <T extends { growthSec: number }>(b: T) => ({
  ...b,
  hungerFullSec: b.growthSec / 3,
  cleanFullSec: b.growthSec * 0.75,
});

export const BREEDS: Record<BreedId, BreedDef> = {
  PIG_EARTH_PINK: care({
    id: "PIG_EARTH_PINK", nameVi: "Heo Hồng Đất",
    buyGold: 500, sellGold: 1200,
    growthSec: 7200, pregnancySec: 3600,
    maxWeight: 50, breedable: true, defaultSkin: "pig_classic",
  }),
  PIG_STRIPED_MELON: care({
    id: "PIG_STRIPED_MELON", nameVi: "Heo Sọc Dưa",
    buyGold: null, sellGold: 3000,
    growthSec: 14400, pregnancySec: 5400,
    maxWeight: 80, breedable: true, defaultSkin: "pig_watermelon",
  }),
  PIG_SUPERMAN: care({
    id: "PIG_SUPERMAN", nameVi: "Heo Siêu Nhân",
    buyGold: null, sellGold: 12000,
    growthSec: 28800, pregnancySec: 10800,
    maxWeight: 120, breedable: true, defaultSkin: "pig_superhero",
  }),
  PIG_MYTHICAL: care({
    id: "PIG_MYTHICAL", nameVi: "Heo Thần Thoại",
    buyGold: null, sellGold: 50000,
    growthSec: 86400, pregnancySec: null,
    maxWeight: 250, breedable: false, defaultSkin: "pig_thienlong",
  }),
};

export const BREED_IDS = Object.keys(BREEDS) as BreedId[];
```

## A.2 `src/core/config/skins.ts` — the MVP skin set

17 entries: the 4 breed defaults (owned from the start, `priceGold: null`) plus the 13 P1 skins the shop sells. The remaining ~100 concepts in the pig catalogue are added later as rows in `assets.json` with no code change.

```ts
import type { BreedId } from "../types";

export interface SkinDef {
  id: string;
  nameVi: string;
  rarity: "P1" | "P2" | "P3" | "P4" | "P5";
  priceGold: number | null;   // null = not purchasable (owned from start, or unlock-only)
  unlock?: { kind: "LEVEL"; level: number } | { kind: "COLLECTION"; count: number };
  allowedBreeds: BreedId[] | "ALL";
  isBreedDefault?: true;
}

export const SKINS: Record<string, SkinDef> = {
  // --- Breed defaults. Always owned. Never purchasable. ---
  pig_classic:    { id: "pig_classic",    nameVi: "Heo Hồng Cổ Điển", rarity: "P1", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },
  pig_watermelon: { id: "pig_watermelon", nameVi: "Heo Dưa Hấu",      rarity: "P1", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },
  pig_superhero:  { id: "pig_superhero",  nameVi: "Heo Siêu Nhân",    rarity: "P1", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },
  pig_thienlong:  { id: "pig_thienlong",  nameVi: "Heo Thiên Long",   rarity: "P5", priceGold: null, allowedBreeds: "ALL", isBreedDefault: true },

  // --- Shop stock. P1 ladder = 2,000 gold (§6.6, TUNABLE). ---
  pig_white:     { id: "pig_white",     nameVi: "Heo Trắng",     rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_black:     { id: "pig_black",     nameVi: "Heo Đen",       rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_brown:     { id: "pig_brown",     nameVi: "Heo Nâu",       rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_farmer:    { id: "pig_farmer",    nameVi: "Heo Nông Dân",  rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_chef:      { id: "pig_chef",      nameVi: "Heo Đầu Bếp",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_nerd:      { id: "pig_nerd",      nameVi: "Heo Mọt Sách",  rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_knight:    { id: "pig_knight",    nameVi: "Heo Hiệp Sĩ",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_wizard:    { id: "pig_wizard",    nameVi: "Heo Pháp Sư",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_cowboy:    { id: "pig_cowboy",    nameVi: "Heo Cao Bồi",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_detective: { id: "pig_detective", nameVi: "Heo Thám Tử",   rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_ghost:     { id: "pig_ghost",     nameVi: "Heo Ma",        rarity: "P1", priceGold: 2000, allowedBreeds: "ALL" },
  pig_christmas: { id: "pig_christmas", nameVi: "Heo Giáng Sinh", rarity: "P1", priceGold: 2000, allowedBreeds: "ALL",
                   unlock: { kind: "LEVEL", level: 3 } },
  pig_tet:       { id: "pig_tet",       nameVi: "Heo Tết",       rarity: "P1", priceGold: 2000, allowedBreeds: "ALL",
                   unlock: { kind: "LEVEL", level: 3 } },
};

export const STARTER_SKINS = Object.values(SKINS)
  .filter((s) => s.isBreedDefault)
  .map((s) => s.id);
```

`player.ownedSkins` starts as `STARTER_SKINS` (D7). Artwork paths are **not** in this file — they live in `assets.json` (art standard §7.2), which is what keeps art swappable without a code change.

## A.3 `src/core/config/names.ts` — default pig names

```ts
/** Used by buyPig and by birth. Pick with the injected rng, never Math.random(). */
export const PIG_NAME_POOL = [
  "Ủn Hồng", "Ủn Mập", "Ủn Béo", "Ủn Tròn", "Ủn Xinh", "Ủn Ngoan",
  "Ỉn Con", "Ỉn Bé", "Ỉn Múp", "Ỉn Nhỏ", "Bé Ủn", "Bé Ỉn",
  "Cu Ủn", "Nàng Ỉn", "Mít Ướt", "Bánh Bao", "Xôi Gấc", "Chè Đỗ",
  "Kẹo Bông", "Hạt Dẻ", "Su Kem", "Bắp Rang",
];
```

If the pool is exhausted (more than 22 pigs have ever been named), append a number: `Ủn Hồng 2`.

## A.4 Error codes — `src/core/config/errors.ts`

```ts
export const ERRORS = [
  "INVALID_REQUEST", "PIG_NOT_FOUND", "INSUFFICIENT_GOLD", "INSUFFICIENT_ITEM",
  "PIG_NOT_MATURE", "PIG_IS_SICK", "PIG_IS_PREGNANT", "PIG_NOT_SICK",
  "ALREADY_FULL", "ALREADY_CLEAN", "INVALID_BREEDING_PARTNERS",
  "BREEDING_COMBINATION_NOT_SUPPORTED", "NO_PIG_SLOT",
  "LEVEL_TOO_LOW", "MAX_SLOTS_REACHED", "SAVE_CORRUPT", "SAVE_TOO_NEW",
  "TROUGH_FULL", "SKIN_NOT_OWNED", "SKIN_ALREADY_OWNED", "SKIN_BREED_NOT_ALLOWED",
  "ORDER_NOT_FOUND", "ORDER_EXPIRED", "ORDER_REQUIREMENTS_NOT_MET",
] as const;

export type ErrorCode = (typeof ERRORS)[number];
```

Every code in this list MUST have a Vietnamese message in Appendix B. A unit test asserts that mapping is total — a missing message is a bug, not a fallback.

---

# APPENDIX B — `src/i18n/vi.ts`, COMPLETE

The whole player-facing string set. No Vietnamese text may appear anywhere else in the codebase (§10.5). `{x}` placeholders are interpolated at call time.

**v4.1:** the `settings` group lost `install`/`installHint` and gained the save-folder strings; `saveStatus` and `desktop` groups are new; the `update` group is removed (no in-app update, §13.4); `multiTab` is used by the dev browser build only. Tasks that touch these screens apply the changes to `src/i18n/vi.ts`; groups added during implementation (for example `vi.ui`, DECISIONS S08A-1) are recorded in `DECISIONS.md`.

```ts
export const vi = {
  app: {
    title: "Ủn Ỉn Homemade",
    loading: "Đang tải...",
  },

  nav: {
    farm: "Nông trại",
    shop: "Cửa hàng",
    inventory: "Kho",
    orders: "Đơn hàng",
    collection: "Bộ sưu tập",
    history: "Lịch sử",
    settings: "Cài đặt",
  },

  hud: {
    level: "Cấp {level}",
    xp: "{current}/{next} KN",
    gold: "{amount} vàng",
    trough: "Máng ăn {food}/{capacity}",
    troughEmpty: "Máng ăn trống!",
  },

  stage: {
    BABY: "Heo con",
    YOUNG: "Heo choai",
    ADULT: "Trưởng thành",
  },

  gender: {
    MALE: "Đực",
    FEMALE: "Cái",
    any: "Bất kỳ",
  },

  stat: {
    growth: "Tăng trưởng",
    weight: "Cân nặng",
    hunger: "No",
    cleanliness: "Sạch sẽ",
    health: "Sức khỏe",
    happiness: "Vui vẻ",
    healthy: "Khỏe mạnh",
    sick: "Đang bệnh",
    pregnant: "Đang mang thai",
    pregnantLeft: "Còn {time} nữa sinh",
    priceMultiplier: "Giá bán x{mult}",
  },

  action: {
    feed: "Cho ăn",
    clean: "Tắm",
    cleanAll: "Tắm tất cả",
    treat: "Chữa bệnh",
    breed: "Phối giống",
    sell: "Bán",
    fulfillOrder: "Giao đơn",
    buy: "Mua",
    fillTrough: "Đổ máng",
    rename: "Đổi tên",
    equip: "Mặc",
    equipped: "Đang mặc",
    confirm: "Xác nhận",
    cancel: "Hủy",
    close: "Đóng",
    skip: "Bỏ qua",
    next: "Tiếp",
  },

  // Every code in ERRORS must appear here. A test asserts the mapping is total.
  error: {
    INVALID_REQUEST: "Yêu cầu không hợp lệ.",
    PIG_NOT_FOUND: "Không tìm thấy heo này.",
    INSUFFICIENT_GOLD: "Không đủ vàng.",
    INSUFFICIENT_ITEM: "Không đủ vật phẩm.",
    PIG_NOT_MATURE: "Heo chưa trưởng thành.",
    PIG_IS_SICK: "Heo đang bệnh.",
    PIG_IS_PREGNANT: "Heo đang mang thai.",
    PIG_NOT_SICK: "Heo không bị bệnh.",
    ALREADY_FULL: "Heo đang no.",
    ALREADY_CLEAN: "Heo đang sạch.",
    INVALID_BREEDING_PARTNERS: "Cặp phối giống không hợp lệ. Cần một đực và một cái.",
    BREEDING_COMBINATION_NOT_SUPPORTED: "Hai giống này chưa phối được với nhau.",
    NO_PIG_SLOT: "Hết chỗ chứa. Mua thêm chuồng hoặc bán bớt heo.",
    LEVEL_TOO_LOW: "Chưa đủ cấp độ.",
    MAX_SLOTS_REACHED: "Đã mở hết chuồng.",
    SAVE_CORRUPT: "File lưu bị lỗi.",
    SAVE_TOO_NEW: "File lưu thuộc phiên bản mới hơn. Hãy cập nhật game.",
    TROUGH_FULL: "Máng ăn đã đầy.",
    SKIN_NOT_OWNED: "Bạn chưa sở hữu bộ đồ này.",
    SKIN_ALREADY_OWNED: "Bạn đã có bộ đồ này rồi.",
    SKIN_BREED_NOT_ALLOWED: "Giống heo này không mặc được bộ đồ đó.",
    ORDER_NOT_FOUND: "Không tìm thấy đơn hàng.",
    ORDER_EXPIRED: "Đơn hàng đã hết hạn.",
    ORDER_REQUIREMENTS_NOT_MET: "Heo chưa đáp ứng yêu cầu của đơn hàng.",
  },

  // Shown on a disabled button so the player knows why, not just that.
  disabled: {
    notMature: "Chưa trưởng thành",
    isSick: "Đang bệnh",
    isPregnant: "Đang mang thai",
    noMedicine: "Hết thuốc",
    noFood: "Hết thức ăn",
    noSlot: "Hết chỗ chứa",
    notHungry: "Đang no",
    notDirty: "Đang sạch",
    notSick: "Không bệnh",
    noPartner: "Không có bạn phối phù hợp",
    happinessTooLow: "Chưa đủ vui vẻ ({current}/{required})",
    cannotBreed: "Giống này không phối được",
  },

  event: {
    becameAdult: "{name} đã trưởng thành!",
    becameSick: "{name} bị bệnh rồi!",
    hungryZero: "{name} đói lả, ngừng lớn.",
    birth: "{mother} vừa sinh {child}!",
    troughEmpty: "Máng ăn đã hết. Heo sẽ ngừng lớn.",
    levelUp: "Lên cấp {level}!",
    discovery: "Khám phá mới: {name}! +{gold} vàng",
    orderNew: "Có đơn hàng mới.",
    orderExpired: "Một đơn hàng đã hết hạn.",
    sold: "Đã bán {name} được {gold} vàng.",
    orderFulfilled: "Giao đơn thành công! +{gold} vàng",
  },

  away: {
    title: "Trong lúc bạn vắng mặt",
    duration: "Bạn đã đi vắng {time}.",
    grewUp: "{count} heo đã trưởng thành",
    gotSick: "{count} heo bị bệnh",
    born: "{count} heo con chào đời",
    troughRanOut: "Máng ăn hết lúc {time}, {count} heo ngừng lớn trong {duration}",
    troughOk: "Máng ăn vẫn còn thức ăn. Heo lớn bình thường.",
    nothing: "Mọi thứ vẫn ổn.",
    ok: "Vào nông trại",
  },

  shop: {
    title: "Cửa hàng",
    tabItems: "Vật phẩm",
    tabPigs: "Heo giống",
    tabSlots: "Chuồng",
    tabSkins: "Bộ đồ",
    FOOD_BASIC: "Thức ăn",
    FOOD_BASIC_desc: "Tăng 50 độ no. Cũng là đơn vị đổ vào máng ăn.",
    MEDICINE_COMMON: "Thuốc",
    MEDICINE_COMMON_desc: "Chữa khỏi bệnh cho một con heo.",
    slotNext: "Chuồng thứ {n}",
    slotLocked: "Cần cấp {level}",
    quantity: "Số lượng",
    total: "Tổng: {gold} vàng",
    owned: "Đã sở hữu",
  },

  trough: {
    title: "Đổ máng ăn",
    current: "Hiện có {food}/{capacity}",
    fromInventory: "Lấy từ kho: {n}",
    toBuy: "Mua thêm: {n} ({gold} vàng)",
    hint: "Heo tự ăn từ máng kể cả khi bạn tắt game. Đổ đầy trước khi nghỉ.",
    fill: "Đổ {n} phần",
  },

  breed: {
    title: "Chọn bạn phối",
    fee: "Phí phối giống: {gold} vàng",
    chances: "Tỉ lệ ra giống con",
    duration: "Thời gian mang thai: {time}",
    noPartners: "Chưa có con nào đủ điều kiện phối với {name}.",
    confirm: "Phối giống",
  },

  sell: {
    title: "Bán {name}?",
    base: "Giá gốc: {gold}",
    multiplier: "Vui vẻ {happiness} → x{mult}",
    final: "Nhận được: {gold} vàng",
    warning: "Heo quý! Bán rồi không lấy lại được.",
  },

  order: {
    title: "Đơn hàng",
    want: "Cần: {breed}",
    wantGender: "Giới tính: {gender}",
    minHappiness: "Vui vẻ tối thiểu: {value}",
    reward: "Thưởng: {gold} vàng + {xp} KN",
    expiresIn: "Còn {time}",
    fulfilled: "Đã giao",
    empty: "Chưa có đơn hàng nào. Đơn mới xuất hiện mỗi 4 tiếng.",
    pickPig: "Chọn heo để giao",
  },

  collection: {
    title: "Bộ sưu tập",
    breeds: "Giống heo",
    skins: "Bộ đồ",
    progress: "{found}/{total}",
    undiscovered: "Chưa khám phá",
  },

  history: {
    title: "Lịch sử",
    transactions: "Giao dịch",
    breeding: "Phối giống",
    empty: "Chưa có gì.",
    INITIAL_GOLD: "Vốn ban đầu",
    SHOP_PURCHASE: "Mua hàng",
    PIG_PURCHASE: "Mua heo",
    PIG_SELL: "Bán heo",
    BREEDING_FEE: "Phí phối giống",
    SLOT_PURCHASE: "Mở chuồng",
    TROUGH_FILL: "Đổ máng",
    SKIN_PURCHASE: "Mua bộ đồ",
    ORDER_REWARD: "Thưởng đơn hàng",
    DISCOVERY_BONUS: "Thưởng khám phá",
  },

  settings: {
    title: "Cài đặt",
    music: "Nhạc nền",
    sfx: "Âm thanh",
    reduceMotion: "Giảm chuyển động",
    export: "Xuất file lưu",
    import: "Nhập file lưu",
    importWarning: "Nhập file sẽ ghi đè dữ liệu hiện tại. Bản cũ được giữ làm sao lưu.",
    lastExport: "Lần xuất gần nhất: {date}",
    neverExported: "Chưa xuất lần nào",
    exportReminder: "Đã lâu bạn chưa xuất file lưu. Nên xuất một bản để phòng khi hỏng ổ đĩa.",
    openSaveFolder: "Mở thư mục lưu",
    saveFolderHint: "Nông trại được lưu trong máy, tự sao lưu 10 bản gần nhất. Chép thư mục này sang máy khác để chơi tiếp.",
    restoreBackup: "Khôi phục bản sao lưu",
    backupAt: "Bản lưu lúc {date}",
    reset: "Chơi lại từ đầu",
    resetWarning: "Toàn bộ nông trại sẽ bị xóa. Không thể hoàn tác.",
    credits: "Thông tin",
  },

  recovery: {
    title: "Không đọc được dữ liệu",
    body: "File lưu bị lỗi và bản sao lưu cũng không dùng được. Bạn có thể nhập file đã xuất trước đó, hoặc bắt đầu nông trại mới.",
    importSave: "Nhập file lưu",
    startNew: "Bắt đầu mới",
  },

  multiTab: {
    title: "Game đang mở ở tab khác",
    body: "Để tránh mất dữ liệu, tab này chỉ xem được. Đóng các tab khác rồi tải lại.",
    reload: "Tải lại",
  },

  saveStatus: {
    error: "Chưa lưu được — đang thử lại...",
    recovered: "Đã lưu lại được.",
  },

  desktop: {
    loadingAssets: "Đang chuẩn bị nông trại... {percent}%",
    manifestError: "Không đọc được danh sách tài nguyên của game.",
    version: "Phiên bản {version}",
  },

  tutorial: {
    step1: "Mua con heo đầu tiên. Chọn giống đực hay cái tùy bạn.",
    step2: "Đổ thức ăn vào máng. Heo sẽ tự ăn, kể cả khi bạn tắt game.",
    step3: "Tắm cho heo. Heo bẩn lâu sẽ đổ bệnh và ngừng lớn.",
    step4: "Heo lớn dần theo thời gian thật. Quay lại sau nhé.",
    step5: "Heo càng vui vẻ, bán càng được giá. Chăm kỹ là lời nhiều.",
  },

  time: {
    seconds: "{n} giây",
    minutes: "{n} phút",
    hours: "{n} giờ",
    days: "{n} ngày",
    hoursMinutes: "{h} giờ {m} phút",
  },
} as const;
```

---

# APPENDIX C — AGENT SELF-CHECK

Before reporting the project complete, verify every line. Each maps to a section above.

**Rules correctness**
- [ ] `src/core/` imports nothing from `game/`, `ui/`, `store/`, `platform/` or any browser/Node API — no file-level exceptions
- [ ] No `Date.now()` or `Math.random()` anywhere under `src/core/`
- [ ] Hunger and cleanliness rates are computed from `growthSec`, not hard-coded (D16)
- [ ] `resolveTrough` runs **before** `advancePig` in the same window (§7.3)
- [ ] `growthStage`, `level`, `happiness`, `weight`, `freeSlots` are computed, never stored
- [ ] Every gold change goes through the one helper that writes a `Transaction` (§8.16)
- [ ] `advanceWorld` called twice with the same `now` changes nothing

**Balance sanity** — run `npm run sim:economy`
- [ ] A PINK pig with an empty trough stalls at 33.33% growth, not 100%
- [ ] Net gold per hour at happiness 100 is at least 2x the value at happiness 0 (§14.7)
- [ ] A PINK pig needs about 6 food units to reach adult

**Save**
- [ ] A v3 save (`schemaVersion: 1`) migrates cleanly to v2
- [ ] Corrupt `save.json` falls back to the newest valid backup, then the recovery screen — never a silent wipe; the corrupt file is kept as `save.corrupt-*`
- [ ] Killing the app during a write never leaves an unreadable `save.json` (atomic replace)
- [ ] A failed write shows the save-error banner and retries; nothing is swallowed
- [ ] Export produces a file that imports back to an identical state

**Content**
- [ ] Every `ErrorCode` has a Vietnamese message (test asserts totality)
- [ ] No Vietnamese string exists outside `src/i18n/vi.ts`
- [ ] Game runs on placeholder rectangles with no real art present
- [ ] Every asset is loaded through `assets.json`, none by a hard-coded path; `npm run assets:check` passes
- [ ] Every v1-scope manifest row is `production` or `final`; credits are filled for audio
- [ ] Every row of the presentation contract (§11.3) produces its animation, effect, sound and toast

**Platform**
- [ ] The installer creates Desktop and Start Menu shortcuts with the app icon; double-click opens the game
- [ ] No terminal, Node, server, port or localhost is needed; the shipped app makes zero network requests
- [ ] Works with the network unplugged from the very first launch
- [ ] A second launch focuses the running window (single instance)
- [ ] Uninstall and reinstall keep the save; installing a new version over the old one migrates it
- [ ] Usable at 1024 × 640; all click targets at least 44 px
- [ ] `prefers-reduced-motion` respected as the initial value of `settings.reduceMotion`
- [ ] Verified on a Windows machine without Node or development tools
