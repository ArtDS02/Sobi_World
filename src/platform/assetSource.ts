// Loads and validates the asset manifest (spec §11.4, DECISIONS R00-7). The URL is relative so the
// same build works on the Vite dev server and under app://game/.
import { parseManifest } from '../core/assets/manifestSchema';
import { ASSET_URL_BASE, createAssetRegistry, type AssetRegistry } from '../core/assets/registry';

export const MANIFEST_URL = `${ASSET_URL_BASE}manifest/assets.json`;

export type AssetLoad = { ok: true; registry: AssetRegistry } | { ok: false; message: string };

type FetchLike = (
  url: string,
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export async function loadAssetRegistry(fetchFn: FetchLike = (u) => fetch(u)): Promise<AssetLoad> {
  let raw: unknown;
  try {
    const res = await fetchFn(MANIFEST_URL);
    if (!res.ok) return { ok: false, message: `${MANIFEST_URL}: HTTP ${res.status}` };
    raw = await res.json();
  } catch (e) {
    return { ok: false, message: `${MANIFEST_URL}: ${e instanceof Error ? e.message : String(e)}` };
  }
  const parsed = parseManifest(raw);
  return parsed.ok
    ? { ok: true, registry: createAssetRegistry(parsed.manifest) }
    : { ok: false, message: parsed.message };
}
