// Asset registry (spec §11.4, art standard §7.2): pure id → entry / url lookups with the runtime
// fallbacks. Built from a validated manifest; never touches the network or the DOM.
import { SLEEP_FALLBACK_FX, TROUGH_PROP_ID, type TroughState } from '../config/assetIds';
import { BREEDS } from '../config/breeds';
import type { BreedId } from '../config/ids';
import {
  MANIFEST_SECTIONS,
  type AssetManifest,
  type AssetStatus,
  type ManifestSection,
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
  /** Pig art row used (the species' artId), or that id when the row is missing. */
  artId: string;
  url: string | null;
  /** Overlay drawn on the fx_above anchor when the sleep frame is missing (DECISIONS Q5). */
  overlay: string | null;
}

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
  const url = (path: string | undefined) => (path ? `${ASSET_URL_BASE}${path}` : null);

  return {
    manifest,

    resolve: (id: string): AssetEntry | undefined => entries.get(id),

    /** URL of a row's file (`asset` by default, or a state / `sleep` / `shadow` key); null if none. */
    url: (id: string, key = 'asset'): string | null => url(entries.get(id)?.files[key]),

    /** Species texture; missing row → url null (flat fill); no sleep frame → idle + fx_zzz. */
    pigTexture(breed: BreedId, sleeping = false): PigTexture {
      const artId = BREEDS[breed].artId;
      const row = pigs.get(artId);
      if (!row) return { artId, url: null, overlay: sleeping ? SLEEP_FALLBACK_FX : null };
      if (sleeping && row.sleepAsset) return { artId, url: url(row.sleepAsset), overlay: null };
      return { artId, url: url(row.asset), overlay: sleeping ? SLEEP_FALLBACK_FX : null };
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
