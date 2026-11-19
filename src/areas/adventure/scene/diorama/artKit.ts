// How the diorama asks for pictures: by id (and state), through a resolver the host supplies (the game: its loaded manifest, Admin: the
// manifest file), never by a path. A picture the manifest does not know comes back as null, and the scene goes without it.
import { loadCard, type Card } from './textures';

/** Picture URL of an asset id (and optional state, e.g. a character's `down_idle`), or null when the manifest has none. */
export type ArtFn = (id: string, state?: string) => string | null;

/** The Forest kit's id for a short name (`prop_tree_oak` → `adv_map_forest_prop_tree_oak`). */
export const forestKit = (name: string): string => `adv_map_forest_${name}`;

/** A picture as a card (see `loadCard`), or null when it has no URL or cannot be loaded. */
export function cardOf(art: ArtFn, id: string, keepShadow = false, state?: string): Promise<Card | null> {
  const url = art(id, state);
  return url ? loadCard(url, keepShadow).catch(() => null) : Promise.resolve(null);
}
