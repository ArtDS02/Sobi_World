// The ground of an exploration area: each tile laid from the zone's tile art (the kit's own where mapKit.ts has one, a quarter of a
// seamless kit tile per tile so its pattern spans 2 × 2; else the older `adv_tile_<zone>_*`), flat colours where neither is loaded.
// Phaser.
import type * as Phaser from 'phaser';
import { textureKey } from '../../../ui/world/keys';
import type { AreaMap } from '../logic/config/content';
import { kitTile } from './mapKit';

const GROUND: Record<string, Record<string, number>> = {
  forest: { '.': 0x9fcf7c, ',': 0xd9c08a, '=': 0xb88a55, '#': 0x4f7a3c, '~': 0x6fb6d9 },
  mountain: { '.': 0xc9b28c, ',': 0xe0cfa6, '=': 0x9a7650, '#': 0x7a6450, '~': 0xe0703a },
  ruins: { '.': 0xc8c3b0, ',': 0xe6dfc9, '=': 0xa08868, '#': 0x6d6878, '~': 0x6aa6c8 },
  coast: { '.': 0xf0e0b0, ',': 0xe8d4a0, '=': 0xb08860, '#': 0x8a8070, '~': 0x4aa8d8 },
};
const TILE_NAME: Record<string, string> = { '.': 'ground', ',': 'path', '=': 'bridge', '#': 'wall', '~': 'water', '^': 'ground', s: 'path', c: 'ground', F: 'wall', w: 'water' };
/** The layout v2 tiles drawn with a base tile until the kit's own (decision 045): its base character and a tint. */
const TILE_BASE: Record<string, [string, number]> = { '^': ['.', 0xf2f7e6], s: [',', 0xcfc0a8], c: ['.', 0xcbb0dc], F: ['#', 0xb8a894], w: ['~', 0xe8f6ff] };

const zoneOf = (map: AreaMap): string => map.zoneId.replace(/^zone_/, '');

/** The colour beyond an area's edge (its walls), seen when the camera shows past the edge. */
export const edgeColour = (map: AreaMap): number => (GROUND[zoneOf(map)] ?? GROUND.forest!)['#']!;

/** The quarter frame (`q<col><row>`) of a seamless kit tile for tile (x, y), made once per texture. */
function quarter(scene: Phaser.Scene, key: string, x: number, y: number): string {
  const name = `q${x % 2}${y % 2}`;
  const tex = scene.textures.get(key);
  if (!tex.has(name)) {
    const src = tex.getSourceImage();
    const w = Math.floor(src.width / 2);
    const h = Math.floor(src.height / 2);
    tex.add(name, 0, (x % 2) * w, (y % 2) * h, w, h);
  }
  return name;
}

/** Lays the ground tiles of `map` into `layer`, under everything else. */
export function layGround(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, map: AreaMap, zone: string) {
  const t = map.tile;
  const colours = GROUND[zone] ?? GROUND.forest!;
  const ground = scene.add.graphics().setDepth(-10);
  map.terrain.forEach((row, y) =>
    [...row].forEach((c, x) => {
      const kit = kitTile(zone, c, x, y);
      const own = kit && scene.textures.exists(textureKey(kit.id));
      const tex = own ? textureKey(kit.id) : textureKey(`adv_tile_${zone}_${TILE_NAME[c] ?? 'ground'}`);
      const [base, plain] = TILE_BASE[c] ?? [c, 0xffffff];
      if (scene.textures.exists(tex)) {
        // A kit tile spans 2 × 2 tiles (a quarter of it on each), so its pattern repeats half as often.
        const img = scene.add.image(x * t, y * t, tex, own ? quarter(scene, tex, x, y) : undefined);
        layer.add(img.setOrigin(0).setDisplaySize(t, t).setDepth(-10).setTint(own ? kit.tint : plain));
      } else ground.fillStyle(colours[base] ?? 0x88aa77, 1).fillRect(x * t, y * t, t + 0.5, t + 0.5);
    }),
  );
  layer.add(ground);
}
