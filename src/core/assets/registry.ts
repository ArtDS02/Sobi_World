// Asset registry (spec §11.4, art standard §7.2): pure id → entry / url lookups with the runtime
// fallbacks. Built from a validated manifest; never touches the network or the DOM.
import { SLEEP_FALLBACK_FX, TROUGH_PROP_ID, type TroughState } from '../config/assetIds';
import { BREEDS } from '../config/breeds';
import type { BreedId } from '../config/ids';
import type { SkinDef } from '../config/skins';
import {
  MANIFEST_SECTIONS,
  type AssetManifest,
  type AssetStatus,
  type ManifestSection,
  type PigRow,
  type Placement,
} from './manifestSchema';

/** Public URL prefix of every manifest path; relative so it works in dev and under app://. */
export const ASSET_URL_BASE = 'assets/';

export interface AssetEntry {
  id: string;
  section: ManifestSection;
  status: AssetStatus;
  /** Every file of the row, keyed: `asset`, `sleep`, `shadow`, `flip`, `anchors` or a state name. */
  files: Record<string, string>;
}

export interface PigTexture {
  /** Skin row actually used (after the breed-default fallback). */
  skinId: string;
  url: string | null;
  /** Overlay drawn on the fx_above anchor when the sleep frame is missing (DECISIONS Q5). */
  overlay: string | null;
}

export interface SkinRegistry {
  get(id: string): SkinDef | undefined;
  all(): SkinDef[];
  /** Skins with a price, i.e. the shop stock (spec §6.6). */
  forSale(): SkinDef[];
}

const toSkin = (row: PigRow): SkinDef => ({
  id: row.id,
  nameVi: row.nameVi,
  rarity: row.rarity,
  priceGold: row.priceGold,
  allowedBreeds: row.allowedBreeds,
  ...(row.unlock ? { unlock: row.unlock } : {}),
});

function filesOf(row: Record<string, unknown>): Record<string, string> {
  const files: Record<string, string> = {};
  const add = (key: string, v: unknown) => {
    if (typeof v === 'string') files[key] = v;
  };
  add('asset', row.asset);
  add('sleep', row.sleepAsset);
  add('shadow', row.shadow);
  add('flip', row.assetFlip);
  add('anchors', row.anchors);
  if (row.states && typeof row.states === 'object') {
    for (const [state, path] of Object.entries(row.states)) add(state, path);
  }
  return files;
}

/** food == 0 → empty, ≤ half → half, otherwise full (environment catalogue §1). */
export function troughState(food: number, capacity: number): TroughState {
  if (food <= 0) return 'empty';
  return food <= capacity / 2 ? 'half' : 'full';
}

export function createAssetRegistry(manifest: AssetManifest) {
  const entries = new Map<string, AssetEntry>();
  for (const section of MANIFEST_SECTIONS) {
    for (const row of manifest[section]) {
      entries.set(row.id, {
        id: row.id,
        section,
        status: row.status,
        files: filesOf(row as Record<string, unknown>),
      });
    }
  }
  const pigs = new Map(manifest.pigs.map((p) => [p.id, p]));
  const skins = manifest.pigs.map(toSkin);
  const url = (path: string | undefined) => (path ? `${ASSET_URL_BASE}${path}` : null);

  const skinRegistry: SkinRegistry = {
    get: (id) => skins.find((s) => s.id === id),
    all: () => [...skins],
    forSale: () => skins.filter((s) => s.priceGold !== null),
  };

  return {
    manifest,
    skins: skinRegistry,

    resolve: (id: string): AssetEntry | undefined => entries.get(id),

    /** URL of a row's file (`asset` by default, or a state / `sleep` / `shadow` key); null if none. */
    url: (id: string, key = 'asset'): string | null => url(entries.get(id)?.files[key]),

    /** Pig texture with fallbacks: unknown skin → breed default; no sleep frame → idle + fx_zzz. */
    pigTexture(skinId: string, breed: BreedId, sleeping = false): PigTexture {
      const row = pigs.get(skinId) ?? pigs.get(BREEDS[breed].defaultSkin);
      if (!row) return { skinId, url: null, overlay: sleeping ? SLEEP_FALLBACK_FX : null };
      if (sleeping && row.sleepAsset) {
        return { skinId: row.id, url: url(row.sleepAsset), overlay: null };
      }
      return { skinId: row.id, url: url(row.asset), overlay: sleeping ? SLEEP_FALLBACK_FX : null };
    },

    troughUrl: (food: number, capacity: number): string | null =>
      url(entries.get(TROUGH_PROP_ID)?.files[troughState(food, capacity)]),

    /** Placements back to front (stable within a layer); `layer` filters one layer. */
    placements(layer?: number): Placement[] {
      return manifest.layout.placements
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => layer === undefined || p.layer === layer)
        .sort((a, b) => a.p.layer - b.p.layer || a.i - b.i)
        .map(({ p }) => p);
    },

    /** Every row, for the dev gallery and the checker. */
    entries: (): AssetEntry[] => [...entries.values()],
  };
}

export type AssetRegistry = ReturnType<typeof createAssetRegistry>;
