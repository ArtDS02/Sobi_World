// Day / night presentation on the farm (DN): the sky under the backdrop (gradient, stars, moon,
// optional painted sky art), one multiply-tinted rectangle over the world (ambient light), a warm
// additive glow over clickable buildings and the shadow strength. Draws only; the phase comes from
// DayNightDirector. No per-frame work: a look is applied once, or per frame only while it tweens.
import * as Phaser from 'phaser';
import { DAY_NIGHT_VIEW, SKY_ART, type PhaseLook } from '../../core/config/dayNight';
import { FARM_VIEW } from '../../core/config/farmView';
import type { DayBlend } from '../../core/engine/dayNight';
import { mixLook, sameLook } from '../../core/engine/dayNight';
import { SKY_BOTTOM_Y } from '../view/backdropPaint';
import type { WorldRect } from '../view/farmCamera';
import { paintSkyGradient, starPoints } from '../view/skyPaint';
import { textureKey } from '../view/textureKeys';

const SKY_KEY = 'dn_sky';
const GLOW_KEY = 'dn_glow';
const GLOW_PX = 128;
/** Registry key read by FeetShadow (pig shadows follow the light too). */
export const SHADOW_LIGHT_KEY = 'dn_shadow';

export class DayNightLayer {
  private sky: Phaser.GameObjects.Image | null = null;
  private readonly art: Phaser.GameObjects.Image[] = [];
  private readonly stars: Phaser.GameObjects.Graphics;
  private readonly moon: Phaser.GameObjects.Graphics;
  private readonly ambient: Phaser.GameObjects.Rectangle;
  private readonly glows: Phaser.GameObjects.Image[] = [];
  private readonly shadows: Phaser.GameObjects.Shape[] = [];
  private rect: WorldRect | null = null;
  private look: PhaseLook | null = null;
  /** The look being shown or tweened to. */
  private target: PhaseLook | null = null;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    const V = DAY_NIGHT_VIEW;
    this.stars = scene.add.graphics().setDepth(V.skyDepth + 2);
    this.moon = scene.add.graphics().setDepth(V.skyDepth + 3);
    const m = V.moon;
    this.moon.fillStyle(m.halo, m.haloAlpha).fillCircle(m.x, m.y, m.haloR);
    this.moon.fillStyle(m.color, 1).fillCircle(m.x, m.y, m.r);
    this.ambient = scene.add
      .rectangle(0, 0, 1, 1, 0xffffff)
      .setOrigin(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(FARM_VIEW.OVERLAY_DEPTH - V.ambientDepthBelowOverlay)
      .setVisible(false);
    makeGlowTexture(scene);
  }

  /** The painted view rect changed (resize): resize the sky, re-scatter the stars. */
  setView(rect: WorldRect) {
    this.rect = rect;
    this.ambient.setPosition(rect.x, rect.y).setSize(rect.width, rect.height);
    this.stars.clear().fillStyle(DAY_NIGHT_VIEW.starColor, 1);
    for (const s of starPoints(rect)) this.stars.fillCircle(s.x, s.y, s.r);
    for (const img of this.art)
      img.setPosition(rect.x, rect.y).setDisplaySize(rect.width, SKY_BOTTOM_Y - rect.y);
    this.sky?.destroy();
    this.sky = null;
    if (this.scene.textures.exists(SKY_KEY)) this.scene.textures.remove(SKY_KEY);
    if (this.look) this.paint(this.look);
  }

  /** Warm window glow over a lit building (litActions; shown at night, scaled to the art). */
  addLight(img: Phaser.GameObjects.Image, action: string | undefined) {
    if (!action || !DAY_NIGHT_VIEW.litActions.includes(action)) return;
    const g = DAY_NIGHT_VIEW.glow;
    const glow = this.scene.add
      .image(
        img.x,
        img.y - img.displayHeight * img.originY + img.displayHeight * g.centerY,
        GLOW_KEY,
      )
      .setDisplaySize(img.displayWidth * g.width, img.displayHeight * g.height)
      .setTint(g.color)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(FARM_VIEW.OVERLAY_DEPTH - DAY_NIGHT_VIEW.glowDepthBelowOverlay)
      .setAlpha(0);
    this.glows.push(glow);
  }

  /** A static soft shadow whose strength follows the light. */
  addShadow(shape: Phaser.GameObjects.Shape) {
    this.shadows.push(shape);
    if (this.look) shape.setAlpha(Math.min(1, this.look.shadow));
  }

  /** Painted sky art for the blended phases, when the manifest has it (SKY_ART, empty today). */
  setSkyArt(blend: DayBlend) {
    for (const img of this.art) img.destroy();
    this.art.length = 0;
    const rect = this.rect;
    if (!rect) return;
    const add = (id: string | undefined, alpha: number) => {
      if (!id || alpha <= 0 || !this.scene.textures.exists(textureKey(id))) return;
      const img = this.scene.add
        .image(rect.x, rect.y, textureKey(id))
        .setOrigin(0)
        .setDisplaySize(rect.width, SKY_BOTTOM_Y - rect.y)
        .setDepth(DAY_NIGHT_VIEW.skyDepth + 1)
        .setAlpha(alpha);
      this.art.push(img);
    };
    add(SKY_ART[blend.from], 1 - blend.t);
    add(SKY_ART[blend.to], blend.t);
  }

  /** Shows `look`, tweened over `ms` from the one on screen (instant when ms = 0 or first). */
  show(look: PhaseLook, ms: number) {
    if (this.target && sameLook(this.target, look)) return;
    this.target = look;
    const from = this.look;
    this.tween?.remove();
    this.tween = null;
    if (!from || ms <= 0) {
      this.paint(look);
      return;
    }
    const counter = { t: 0 };
    this.tween = this.scene.tweens.add({
      targets: counter,
      t: 1,
      duration: ms,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.paint(mixLook(from, look, counter.t)),
      onComplete: () => {
        this.tween = null;
        this.paint(look);
      },
    });
  }

  private paint(look: PhaseLook) {
    this.look = look;
    this.paintSky(look);
    this.stars.setAlpha(look.stars).setVisible(look.stars > 0.01);
    this.moon.setAlpha(look.moon).setVisible(look.moon > 0.01);
    this.ambient.setFillStyle(look.ambient).setVisible(look.ambient !== 0xffffff);
    const glowAlpha = look.lights * DAY_NIGHT_VIEW.glow.alpha;
    for (const g of this.glows) g.setAlpha(glowAlpha).setVisible(glowAlpha > 0.01);
    const shadow = Math.min(1, look.shadow);
    for (const s of this.shadows) s.setAlpha(shadow);
    this.scene.registry.set(SHADOW_LIGHT_KEY, shadow);
  }

  /** The gradient lives in a 1 px wide texture stretched over the sky band (cheap to repaint). */
  private paintSky(look: PhaseLook) {
    const rect = this.rect;
    if (!rect) return;
    const height = Math.max(1, Math.ceil(SKY_BOTTOM_Y - rect.y));
    let tex = this.scene.textures.exists(SKY_KEY)
      ? (this.scene.textures.get(SKY_KEY) as Phaser.Textures.CanvasTexture)
      : null;
    if (!tex) {
      tex = this.scene.textures.createCanvas(SKY_KEY, 1, height);
      if (!tex) return;
      this.sky = this.scene.add
        .image(rect.x, rect.y, SKY_KEY)
        .setOrigin(0)
        .setDisplaySize(rect.width, height)
        .setDepth(DAY_NIGHT_VIEW.skyDepth);
    }
    const ctx = tex.getContext();
    ctx.setTransform(1, 0, 0, 1, 0, -rect.y);
    paintSkyGradient(ctx, 0, rect.y, 1, look);
    tex.refresh();
  }

  destroy() {
    this.tween?.remove();
    if (this.scene.textures.exists(SKY_KEY)) this.scene.textures.remove(SKY_KEY);
  }
}

/** A soft white radial blob, tinted warm per glow. */
function makeGlowTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(GLOW_KEY)) return;
  const tex = scene.textures.createCanvas(GLOW_KEY, GLOW_PX, GLOW_PX);
  if (!tex) return;
  const ctx = tex.getContext();
  const r = GLOW_PX / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GLOW_PX, GLOW_PX);
  tex.refresh();
}
