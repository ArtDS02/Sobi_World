// Pig art that is not in the preload list (R12A): loaded on demand, its anchors parsed once, and freed again
// once no pig wears it. Preloaded breed defaults are never freed.
import * as Phaser from 'phaser';
import { parseAnchors, type Anchors } from '../../../../core/assets/anchors';
import type { AssetRegistry } from '../../../../core/assets/registry';
import { queueLoadList } from '../scenes/PreloadScene';
import { anchorsKey, artLoadList, artTextureKeys } from '../view/textureKeys';

export class PigArt {
  private readonly anchors = new Map<string, Anchors>();
  /** Pig art rows whose files were requested after preload (loaded once, failures fall back). */
  private readonly requested = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly assets: AssetRegistry,
    /** Called when a late load finishes: the scene re-syncs to show it. */
    private readonly loaded: () => void,
  ) {}

  /** Pig art missing after preload: load it once, then `loaded`. */
  request(artId: string) {
    if (this.requested.has(artId)) return;
    this.requested.add(artId);
    const { load } = this.scene;
    if (queueLoadList(load, artLoadList(this.assets, artId)) === 0) return;
    load.once(Phaser.Loader.Events.COMPLETE, () => this.loaded());
    load.start();
  }

  anchorsOf(artId: string): Anchors {
    const cached = this.anchors.get(artId);
    if (cached) return cached;
    const raw: unknown = this.scene.cache.json.get(anchorsKey(artId));
    const parsed = parseAnchors(raw);
    // Only cache once the json is in (or the art row has none), so a late load still applies.
    if (raw !== undefined || !this.assets.url(artId, 'anchors')) this.anchors.set(artId, parsed);
    return parsed;
  }

  /** Frees the late-loaded art that no pig (staying or leaving) wears now; wearing it again reloads it. */
  release(worn: ReadonlySet<string>) {
    if (this.requested.size === 0) return;
    for (const artId of this.requested) {
      if (worn.has(artId)) continue;
      for (const key of artTextureKeys(artId)) if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      this.scene.cache.json.remove(anchorsKey(artId));
      this.anchors.delete(artId);
      this.requested.delete(artId);
    }
  }
}
