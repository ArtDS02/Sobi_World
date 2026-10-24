// The depth and life of an exploration area (adventure-big-update-1 §11, in the spirit of Epic Battle Fantasy 3's maps: framed by
// big foliage, soft light, things that move). Around the playable grid: the zone's wall texture continues outward and darkens, so the
// area sits inside a forest / a mountain / old ruins instead of a flat colour; tall pieces of the zone stand along the top and the
// bottom edges (the top ones behind the party, the bottom ones in front of it); a shadow falls below every wall onto the ground;
// every prop and thing has a soft shadow; shafts of light and drifting cloud shadows cross the ground; leaves and fireflies, dust and
// embers, or old magic float about; water glitters. Where things go comes from the area's id (an area always looks the same). Phaser.
import * as Phaser from 'phaser';
import { hashSeed, mulberry32 } from '../../../core/rng';
import { textureKey } from '../../../ui/world/keys';
import { PROPS, type AreaMap } from '../logic/config/content';
import { thingsOf, WALK_TILES } from '../logic/maps';
import { BEYOND, DRESS, ensureTextures } from './mapDepthKit';

export interface AreaDressing {
  /** Moves what drifts (cloud shadows); `near` = the walker's position, to clear the bottom frame in front of it. */
  update(time: number, walker: { x: number; y: number }): void;
}

/**
 * Dresses `map`. The area's `layer` draws in the order things are added, under the party: `under` adds what lies beneath the ground
 * tiles (the world beyond), then the caller lays the ground, then `ground` adds what lies on it (wall shadows, prop shadows, cloud
 * shadows, glitter). What stands over the party (the bottom frame, light, floating life) goes straight into the scene and is
 * destroyed with the layer. `motion` = false (reduced motion): nothing drifts or floats.
 */
export function dressArea(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  map: AreaMap,
  zone: string,
  motion: boolean,
): { under: () => void; ground: () => AreaDressing } {
  ensureTextures(scene);
  const dress = DRESS[zone] ?? DRESS.forest!;
  const t = map.tile;
  const W = map.cols * t;
  const H = map.rows * t;
  const rng = mulberry32(hashSeed('adventure-depth', map.id));
  const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    layer.add(o);
    return o;
  };
  const over: Phaser.GameObjects.GameObject[] = [];
  const top = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    over.push(o);
    return o;
  };
  layer.once(Phaser.GameObjects.Events.DESTROY, () => over.forEach((o) => o.destroy()));
  return {
    under: () => {
      // The world beyond the grid: the zone's wall texture, darker the further it goes.
      const wallKey = textureKey(`adv_tile_${zone}_wall`);
      if (scene.textures.exists(wallKey)) {
        const beyond = add(
          scene.add
            .tileSprite(-BEYOND, -BEYOND, W + BEYOND * 2, H + BEYOND * 2, wallKey)
            .setOrigin(0)
            .setDepth(-30)
            .setTint(dress.beyond),
        );
        beyond.setTileScale(t / Math.max(1, scene.textures.get(wallKey).getSourceImage().width));
      } else {
        add(
          scene.add
            .rectangle(-BEYOND, -BEYOND, W + BEYOND * 2, H + BEYOND * 2, dress.beyond)
            .setOrigin(0)
            .setDepth(-30),
        );
      }
      const dark = add(scene.add.graphics().setDepth(-29));
      for (let i = 0; i < 10; i += 1) {
        const k = i / 10;
        const pad = BEYOND * (1 - k);
        dark
          .lineStyle(BEYOND / 10 + 1, 0x1a2a14, 0.07 * (1 - k) + 0.02)
          .strokeRect(
            -pad + BEYOND / 20,
            -pad + BEYOND / 20,
            W + pad * 2 - BEYOND / 10,
            H + pad * 2 - BEYOND / 10,
          );
      }
    },
    ground: () => {
      // A shadow below every wall tile onto the ground under it (the wall stands up), and a soft dark rim along the grid's edge.
      const shade = add(scene.add.graphics().setDepth(-8));
      map.terrain.forEach((row, y) =>
        [...row].forEach((c, x) => {
          if (WALK_TILES.has(c)) return;
          const below = map.terrain[y + 1]?.[x];
          if (below && WALK_TILES.has(below))
            for (let k = 0; k < 6; k += 1)
              shade
                .fillStyle(0x10200a, 0.16 * (1 - k / 6))
                .fillRect(x * t, (y + 1) * t + k * (t / 12), t, t / 12 + 0.5);
        }),
      );

      // Tall pieces framing the area: behind the party along the top, in front of it along the bottom.
      const frameKeys = dress.frame
        .map((id) => textureKey(id))
        .filter((k) => scene.textures.exists(k));
      const front: Phaser.GameObjects.Image[] = [];
      if (frameKeys.length > 0) {
        for (const edge of ['top', 'bottom'] as const) {
          for (let x = -t * 2; x < W + t * 2; x += t * (1.6 + rng.next() * 1.2)) {
            const k = frameKeys[Math.floor(rng.next() * frameKeys.length)]!;
            const img = scene.add
              .image(
                x,
                edge === 'top' ? t * 0.9 + rng.next() * t * 0.4 : H + t * (0.9 + rng.next() * 0.6),
                k,
              )
              .setOrigin(0.5, 1);
            const width = t * (2.4 + rng.next() * 1.4);
            img
              .setDisplaySize(width, (width * img.height) / Math.max(1, img.width))
              .setFlipX(rng.next() < 0.5);
            if (edge === 'top') add(img.setTint(0xd8e0d0));
            else front.push(top(img.setDepth(1_000_000).setTint(0xb8c4b0)));
          }
        }
      }

      // Soft shadows under the props and the things.
      const shadows = add(scene.add.graphics().setDepth(-7));
      for (const p of map.props) {
        const def = PROPS[p.prop];
        if (def)
          shadows
            .fillStyle(0x000000, 0.16)
            .fillEllipse(
              (p.x + def.w / 2) * t,
              (p.y + def.h) * t - 4,
              def.w * t * 0.95,
              Math.max(10, t * 0.45),
            );
      }
      for (const th of thingsOf(map))
        if (th.kind !== 'exit')
          shadows
            .fillStyle(0x000000, 0.14)
            .fillEllipse((th.x + th.w / 2) * t, (th.y + th.h) * t - 3, th.w * t * 0.8, t * 0.35);

      // Glitter on the water.
      const water: { x: number; y: number }[] = [];
      map.terrain.forEach((row, y) =>
        [...row].forEach((c, x) => c === '~' && water.push({ x, y })),
      );

      // Shafts of light.
      const shafts: Phaser.GameObjects.Image[] = [];
      for (let i = 0; i < dress.shafts; i += 1) {
        const s = scene.add
          .image(
            W * ((i + 0.5 + (rng.next() - 0.5) * 0.6) / dress.shafts),
            H * (0.35 + rng.next() * 0.3),
            'adv-fx-shaft',
          )
          .setDisplaySize(t * (3 + rng.next() * 2), H * 1.1)
          .setRotation(-0.42)
          .setTint(dress.shaftColor)
          .setAlpha(0.13)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(999_000);
        shafts.push(top(s));
      }

      // Cloud shadows drifting across the ground.
      const clouds: { img: Phaser.GameObjects.Image; speed: number }[] = [];
      for (let i = 0; i < 3; i += 1) {
        const img = scene.add
          .image(rng.next() * W, rng.next() * H, 'adv-fx-blob')
          .setDisplaySize(t * (8 + rng.next() * 6), t * (5 + rng.next() * 3))
          .setTint(0x0a1406)
          .setAlpha(0.09)
          .setDepth(-6);
        clouds.push({ img: add(img), speed: 6 + rng.next() * 8 });
      }

      if (motion) {
        for (const m of dress.motes) {
          const emitter = scene.add.particles(
            0,
            0,
            m.kind === 'leaf' ? 'adv-fx-leaf' : 'adv-fx-dot',
            {
              x: { min: 0, max: W },
              y: { min: m.kind === 'leaf' ? -t : 0, max: m.kind === 'leaf' ? H * 0.6 : H },
              lifespan: m.kind === 'leaf' ? { min: 6000, max: 9000 } : { min: 2500, max: 4500 },
              speedX: m.kind === 'leaf' ? { min: 10, max: 30 } : { min: -8, max: 8 },
              speedY:
                m.kind === 'leaf'
                  ? { min: 18, max: 34 }
                  : m.kind === 'ember'
                    ? { min: -30, max: -12 }
                    : { min: -10, max: 6 },
              rotate: m.kind === 'leaf' ? { min: 0, max: 360 } : 0,
              scale:
                m.kind === 'leaf'
                  ? { min: 0.6, max: 1.1 }
                  : m.kind === 'firefly'
                    ? { start: 0.35, end: 0.15 }
                    : { start: 0.28, end: 0 },
              alpha:
                m.kind === 'leaf'
                  ? { start: 0.95, end: 0 }
                  : {
                      onEmit: () => 0,
                      onUpdate: (
                        _p: Phaser.GameObjects.Particles.Particle,
                        _k: string,
                        tt: number,
                      ) => Math.sin(tt * Math.PI) * 0.9,
                    },
              tint: m.colors as number[],
              frequency: m.kind === 'leaf' ? 520 : 160,
              quantity: 1,
              blendMode: m.kind === 'leaf' ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD,
            },
          );
          top(emitter.setDepth(m.kind === 'leaf' ? 999_500 : 999_400));
        }
        if (water.length > 0) {
          const xs = water.map((w) => w.x);
          const ys = water.map((w) => w.y);
          const glints = scene.add.particles(0, 0, 'adv-fx-dot', {
            x: { min: Math.min(...xs) * t, max: (Math.max(...xs) + 1) * t },
            y: { min: Math.min(...ys) * t, max: (Math.max(...ys) + 1) * t },
            lifespan: 900,
            scale: { start: 0.32, end: 0 },
            alpha: { start: 0.9, end: 0 },
            tint: [0xffffff, 0xd8f4ff],
            frequency: Math.max(40, 2400 / Math.max(1, water.length / 8)),
            blendMode: Phaser.BlendModes.ADD,
          });
          glints.setDepth(-5);
          add(glints);
        }
      }

      return {
        update(time, walker) {
          if (motion) {
            shafts.forEach((s, i) => s.setAlpha(0.1 + 0.06 * Math.sin(time / 2400 + i * 1.7)));
            for (const c of clouds) {
              c.img.x += c.speed / 60;
              if (c.img.x > W + c.img.displayWidth) c.img.x = -c.img.displayWidth;
            }
          }
          // The frame in front never hides the party: it fades where the walker is close.
          for (const f of front)
            f.setAlpha(Math.abs(f.x - walker.x) < t * 2.5 && walker.y > H - t * 4 ? 0.35 : 1);
        },
      };
    },
  };
}
