// Everything in the plaza that moves by itself (spec §3.1: a living world, never in the way): drifting clouds,
// the sea's foam, the fountain's water, the portal's glow and sparkles, signs swaying, lamps glowing, butterflies,
// animals, and the dust of footsteps. Built from the scene's drawn placements; it owns what it creates and
// releases it in `destroy`. A door the character is near wakes up (`setNear`); with reduced motion it all calms.
import * as Phaser from 'phaser';
import type { PlazaLayout, PlazaPlacement } from '../../../../content/schemas/plaza/layout';
import type { Rect } from '../../../systems/character';
import { DOT, SOFT_GLOW, ensureSoftTextures } from '../../../ui/world/softTextures';
import { Butterflies, idleAnimal } from './ambientLife';
import { Clouds, Shore } from './ambientSky';
import { PLAZA_AMBIENT } from './ambientConfig';

export interface DrawnPlacement {
  p: PlazaPlacement;
  img: Phaser.GameObjects.Image;
  bounds: Rect;
}

export interface AmbientDeps {
  layout: PlazaLayout;
  /** The name written on a door's signpost. */
  nameOf: (portal: string) => string | undefined;
  /** Reduced motion: movement and particles stop. */
  calm: () => boolean;
}

interface Sign {
  portal: string;
  box: Phaser.GameObjects.Container;
  sway: Phaser.Tweens.Tween;
}

/** A small deterministic generator for the little random choices (starts, pauses, flight). */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export class PlazaAmbient {
  private readonly random = seeded(7919);
  private readonly clouds: Clouds;
  private readonly shore: Shore;
  private butterflies: Butterflies | null = null;
  private readonly signs: Sign[] = [];
  private readonly lamps: Phaser.GameObjects.Image[] = [];
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private readonly emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private portalEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private portalGlow: Phaser.GameObjects.Image | null = null;
  private readonly dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private near: string | null = null;
  private wasCalm = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly deps: AmbientDeps,
    drawn: DrawnPlacement[],
  ) {
    ensureSoftTextures(scene);
    this.clouds = new Clouds(scene, deps.layout);
    this.shore = new Shore(scene, deps.layout);
    this.dust = this.makeDust();
    for (const d of drawn) {
      if (d.p.sign) this.makeSign(d);
      if (d.p.glow) this.makeLamp(d);
      if (d.p.idle) this.tweens.push(idleAnimal(scene, d.img, d.p.idle, this.random));
      if (d.p.id === 'prop_fountain') this.makeFountain(d);
      if (d.p.portal === 'portal_gate') this.makePortal(d);
      if (d.p.portal === 'garden_gate') {
        this.butterflies = new Butterflies(scene, d.bounds, d.img.depth + 1, this.random);
      }
    }
  }

  update(dtMs: number) {
    const calm = this.deps.calm();
    if (calm !== this.wasCalm) this.applyCalm(calm);
    if (calm) return;
    this.clouds.update(dtMs, this.deps.layout.designSize.width);
    this.butterflies?.update(dtMs, this.random);
  }

  /** The door the character is close to (a `portal` id), or null. Wakes that door's sign and effects. */
  setNear(portal: string | null) {
    if (portal === this.near) return;
    this.near = portal;
    this.portalEmitter?.setFrequency(this.sparkleMs());
    if (!portal || this.deps.calm()) return;
    const sign = this.signs.find((s) => s.portal === portal);
    if (!sign) return;
    // A short bounce and a handful of sparkles, once per arrival.
    const S = PLAZA_AMBIENT.signs;
    this.scene.tweens.add({
      targets: sign.box,
      angle: { from: -S.nearBounceDeg, to: S.nearBounceDeg },
      duration: 160,
      yoyo: true,
      repeat: 2,
      onComplete: () => sign.box.setAngle(0),
    });
    this.dust.emitParticleAt(sign.box.x, sign.box.y - sign.box.height * 0.6, S.sparkles);
  }

  /** One footstep on dirt: a little puff. */
  puff(x: number, y: number) {
    if (this.deps.calm()) return;
    this.dust.emitParticleAt(x, y, 2);
  }

  /** The day's light: how much the lamps shine (0..1). */
  setLampLevel(level: number) {
    const L = PLAZA_AMBIENT.lamps;
    const alpha = L.alpha[0] + (L.alpha[1] - L.alpha[0]) * level;
    for (const glow of this.lamps) glow.setAlpha(alpha).setVisible(alpha > 0.01);
  }

  destroy() {
    this.clouds.destroy();
    this.shore.destroy();
    this.butterflies?.destroy();
    for (const t of this.tweens) t.stop();
    for (const s of this.signs) {
      s.sway.stop();
      this.scene.tweens.killTweensOf(s.box);
      s.box.destroy();
    }
    for (const g of [...this.lamps, ...(this.portalGlow ? [this.portalGlow] : [])]) {
      this.scene.tweens.killTweensOf(g);
      g.destroy();
    }
    for (const e of [...this.emitters, this.dust]) e.destroy();
  }

  private applyCalm(calm: boolean) {
    this.wasCalm = calm;
    this.butterflies?.setVisible(!calm);
    for (const e of this.emitters) {
      if (calm) e.stop();
      else e.start();
    }
    for (const t of this.tweens) {
      if (calm) t.pause();
      else t.resume();
    }
    for (const s of this.signs) {
      if (calm) s.sway.pause();
      else s.sway.resume();
    }
  }

  private sparkleMs() {
    const P = PLAZA_AMBIENT.portal.sparkleMs;
    return this.near === 'portal_gate' ? P.near : P.far;
  }

  private makeDust() {
    const D = PLAZA_AMBIENT.dust;
    return this.scene.add
      .particles(0, 0, DOT, {
        emitting: false,
        lifespan: D.lifeMs,
        speedX: { min: -14, max: 14 },
        speedY: { min: -22, max: -6 },
        scale: { start: 1.6, end: 3.2 },
        alpha: { start: 0.55, end: 0 },
        tint: D.color,
        maxAliveParticles: D.maxAlive,
      })
      .setDepth(5_000);
  }

  private makeSign(d: DrawnPlacement) {
    const S = PLAZA_AMBIENT.signs;
    const name = this.deps.nameOf(d.p.sign!);
    // The board's text sits on the art; the whole sign sways about the foot of its post.
    const box = this.scene.add.container(d.img.x, d.img.y).setDepth(d.img.depth);
    const height = d.img.displayHeight;
    d.img.setPosition(0, 0);
    box.add(d.img);
    box.setSize(d.img.displayWidth, height);
    if (name) {
      const [first, ...rest] = name.split(' ');
      const text = this.scene.add
        .text(0, -height * (1 - S.board.centre), rest.length > 0 ? `${first}\n${rest.join(' ')}` : name, {
          color: S.color,
          fontSize: `${S.fontPx}px`,
          fontFamily: S.fontFamily,
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: -6,
        })
        .setOrigin(0.5);
      const fit = (d.img.displayWidth * S.board.width) / Math.max(text.width, 1);
      if (fit < 1) text.setScale(fit);
      box.add(text);
    }
    const sway = this.scene.tweens.add({
      targets: box,
      angle: { from: -S.swayDeg, to: S.swayDeg },
      duration: S.swayMs,
      delay: this.random() * S.swayMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.signs.push({ portal: d.p.sign!, box, sway });
  }

  private makeLamp(d: DrawnPlacement) {
    const L = PLAZA_AMBIENT.lamps;
    const glow = this.scene.add
      .image(d.bounds.x + d.bounds.width / 2, d.bounds.y + d.bounds.height * 0.16, SOFT_GLOW)
      .setTint(L.glowColor)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(L.radius * 2, L.radius * 2)
      .setDepth(d.img.depth + 1)
      .setAlpha(0)
      .setVisible(false);
    // The flame breathes: the glow's size wobbles, its alpha stays where the day's light put it.
    this.tweens.push(
      this.scene.tweens.add({
        targets: glow,
        scale: glow.scale * (1 + L.flicker),
        duration: L.flickerMs * (0.8 + this.random() * 0.5),
        delay: this.random() * L.flickerMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
    );
    this.lamps.push(glow);
  }

  private makeFountain(d: DrawnPlacement) {
    const F = PLAZA_AMBIENT.fountain;
    const x = d.bounds.x + d.bounds.width / 2;
    const y = d.bounds.y + d.bounds.height * F.spoutAt;
    const emitter = this.scene.add
      .particles(x, y, DOT, {
        frequency: F.frequencyMs,
        lifespan: F.lifespanMs,
        angle: { min: -112, max: -68 },
        speed: { min: F.speed[0], max: F.speed[1] },
        gravityY: F.gravity,
        scale: { min: F.scale[0], max: F.scale[1] },
        alpha: { start: 0.9, end: 0 },
        tint: F.color,
      })
      .setDepth(d.img.depth + 1);
    this.emitters.push(emitter);
  }

  /** The gate of Sobi Adventure: a pulsing violet glow behind its opening and sparkles drifting up around it. */
  private makePortal(d: DrawnPlacement) {
    const P = PLAZA_AMBIENT.portal;
    const cx = d.bounds.x + d.bounds.width / 2;
    const cy = d.bounds.y + d.bounds.height * P.glowCentre;
    const glow = this.scene.add
      .image(cx, cy, SOFT_GLOW)
      .setTint(P.glowColor)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(d.bounds.width * P.glowSize.w * 1.6, d.bounds.height * P.glowSize.h * 1.4)
      .setDepth(d.img.depth + 1)
      .setAlpha(P.glowAlpha[0]);
    this.tweens.push(
      this.scene.tweens.add({ targets: glow, alpha: P.glowAlpha[1], duration: P.glowPeriodMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
    );
    this.portalGlow = glow;
    const zone = new Phaser.Geom.Ellipse(0, 0, d.bounds.width * 0.8, d.bounds.height * 0.8);
    this.portalEmitter = this.scene.add
      .particles(cx, cy, DOT, {
        frequency: P.sparkleMs.far,
        lifespan: P.sparkleLifeMs,
        emitZone: { type: 'random', source: zone, quantity: 1 },
        speedY: { min: -26, max: -8 },
        speedX: { min: -12, max: 12 },
        scale: { start: 1.8, end: 0.4 },
        alpha: { start: 0.9, end: 0 },
        tint: P.sparkleColor,
        blendMode: 'ADD',
      })
      .setDepth(d.img.depth + 2);
    this.emitters.push(this.portalEmitter);
  }
}
