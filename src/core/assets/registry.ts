// Asset registry (spec §11.4, art standard §7.2): pure id → entry / url lookups with the runtime
// fallbacks. Built from a validated manifest; never touches the network or the DOM. Knows art ids,
// not species: an Area maps its creatures to art (the farm: areas/farm/scene/view/farmArt.ts).
import { SLEEP_FALLBACK_FX } from '../config/assetIds';
import type { SeasonId } from '../config/seasons';
import { seasonFile } from '../engine/season';
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
  /** Every file of the row, keyed: `asset`, `sleep`, `wake`, `shadow`, `flip`, `anchors` or a state name. */
  files: Record<string, string>;
}

export interface ArtTexture {
  /** Creature art row used (e.g. a species' artId), or that id when the row is missing. */
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
  add('wake', row.wakeAsset);
  add('shadow', row.shadow);
  add('flip', row.assetFlip);
  add('anchors', row.anchors);
  if (row.states && typeof row.states === 'object') {
    for (const [state, path] of Object.entries(row.states)) add(state, path);
  }
  if (row.seasons && typeof row.seasons === 'object') {
    for (const [season, path] of Object.entries(row.seasons)) add(seasonFile(season as SeasonId), path);
  }
  return files;
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

    /** Creature art texture; missing row → url null (flat fill); no sleep frame → idle + fx_zzz. */
    artTexture(artId: string, sleeping = false): ArtTexture {
      const row = pigs.get(artId);
      if (!row) return { artId, url: null, overlay: sleeping ? SLEEP_FALLBACK_FX : null };
      if (sleeping && row.sleepAsset) return { artId, url: url(row.sleepAsset), overlay: null };
      return { artId, url: url(row.asset), overlay: sleeping ? SLEEP_FALLBACK_FX : null };
    },

    /** URL of a creature art frame (`sleep` / `wake`); null when the row has none. */
    artFrame(artId: string, frame: 'sleep' | 'wake'): string | null {
      const row = pigs.get(artId);
      return url((frame === 'sleep' ? row?.sleepAsset : row?.wakeAsset) ?? undefined);
    },

    /** File key to draw for `id` in `season`: its seasonal variant, else the default `asset`. */
    seasonalFile: (id: string, season: SeasonId): string =>
      entries.get(id)?.files[seasonFile(season)] ? seasonFile(season) : 'asset',

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
