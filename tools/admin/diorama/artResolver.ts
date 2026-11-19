// Admin's picture resolver for the diorama: reads the manifest file (`public/assets/manifest/assets.json`) once and answers
// `art(id, state?)` with the URL of the picture, like the other labs do. The game gives the view its own loaded manifest instead.
import type { ArtFn } from '../../../src/areas/adventure/scene/diorama/artKit';

interface Row {
  id: string;
  asset?: string;
  states?: Record<string, string>;
}

let cached: Promise<ArtFn> | null = null;

export function loadArt(): Promise<ArtFn> {
  cached ??= fetch('/assets/manifest/assets.json')
    .then((r) => r.json() as Promise<Record<string, unknown>>)
    .then((m) => {
      const rows = new Map<string, Row>();
      for (const list of Object.values(m)) if (Array.isArray(list)) for (const row of list as Row[]) if (row && typeof row.id === 'string') rows.set(row.id, row);
      return (id: string, state?: string) => {
        const row = rows.get(id);
        const path = state ? row?.states?.[state] : (row?.asset ?? row?.states?.down_idle);
        return path ? `/assets/${path}` : null;
      };
    });
  return cached;
}
