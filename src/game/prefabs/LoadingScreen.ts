// Preload screen: the painted farm backdrop of the current season, a cream card with a bobbing pig,
// a pill progress bar and a rotating tip. Drawn with shapes only — nothing is loaded yet.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { SEASON_LOOKS, type SeasonId } from '../../core/config/seasons';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { fitCamera } from '../config/phaser';
import { backdropRect } from '../view/farmCamera';
import { paintBackdrop } from '../view/backdropPaint';
import type { FarmLayout } from '../view/pigView';

const KEY = 'preload_backdrop';
const L = FARM_VIEW.LOADING;
const font = FARM_VIEW.LABEL.fontFamily;

export class LoadingScreen {
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly percent: Phaser.GameObjects.Text;
  private readonly cx: number;

  constructor(
    private readonly scene: Phaser.Scene,
    layout: FarmLayout,
    season: SeasonId,
    reduceMotion: boolean,
  ) {
    const { width, height } = layout.designSize;
    this.cx = width / 2;
    fitCamera(scene, layout, (view) =>
      this.paintBackdrop(backdropRect(view, width, height, FARM_VIEW.VIEW_MAX_EXTEND), season),
    );
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (scene.textures.exists(KEY)) scene.textures.remove(KEY);
    });
    this.drawCard();
    this.pig(reduceMotion);
    scene.add
      .text(this.cx, L.title.y, vi.desktop.loadingTitle, {
        color: L.title.color,
        fontSize: `${L.title.px}px`,
        fontFamily: font,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.bar = scene.add.graphics().setDepth(2);
    this.percent = scene.add
      .text(this.cx, L.percent.y, '', {
        fontSize: `${L.percent.px}px`,
        fontFamily: font,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.tips(reduceMotion);
    this.setProgress(0);
  }

  /** 0..1 */
  setProgress(p: number) {
    const b = L.bar;
    const x = this.cx - b.width / 2;
    const y = b.y - b.height / 2;
    const r = b.height / 2;
    const g = this.bar.clear();
    g.fillStyle(b.track, 1).fillRoundedRect(x, y, b.width, b.height, r);
    const w = Math.max(b.height, b.width * Phaser.Math.Clamp(p, 0, 1));
    g.fillStyle(b.fill, 1).fillRoundedRect(x, y, w, b.height, r);
    // Glossy top band on the fill.
    g.fillStyle(b.shine, 0.3).fillRoundedRect(
      x + 6,
      y + 4,
      Math.max(0, w - 12),
      b.height * 0.28,
      4,
    );
    const inside = p >= 0.12;
    this.percent
      .setText(t(vi.desktop.loadingPercent, { percent: Math.round(p * 100) }))
      .setColor(inside ? L.percent.color : L.percent.dark)
      .setX(inside ? x + w / 2 : x + w + 28);
  }

  private paintBackdrop(
    rect: { x: number; y: number; width: number; height: number },
    season: SeasonId,
  ) {
    const { scene } = this;
    if (scene.textures.exists(KEY)) scene.textures.remove(KEY);
    const tex = scene.textures.createCanvas(KEY, rect.width, rect.height);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.translate(-rect.x, -rect.y);
    const sky = FARM_VIEW.BACKDROP.sky;
    const grad = ctx.createLinearGradient(0, rect.y, 0, sky.gradientEndY);
    grad.addColorStop(0, sky.top);
    grad.addColorStop(1, sky.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    paintBackdrop(ctx, rect, SEASON_LOOKS[season].backdrop);
    tex.refresh();
    scene.children.getByName(KEY)?.destroy();
    scene.add.image(rect.x, rect.y, KEY).setOrigin(0).setName(KEY).setDepth(-1);
  }

  private drawCard() {
    const c = L.card;
    const x = this.cx - c.width / 2;
    const s = L.shadow;
    this.scene.add
      .graphics()
      .fillStyle(s.color, s.alpha)
      .fillRoundedRect(x, c.y + s.dy, c.width, c.height, c.radius)
      .fillStyle(c.border, 1)
      .fillRoundedRect(
        x - c.borderPx,
        c.y - c.borderPx,
        c.width + c.borderPx * 2,
        c.height + c.borderPx * 2,
        c.radius + c.borderPx,
      )
      .fillStyle(c.color, 1)
      .fillRoundedRect(x, c.y, c.width, c.height, c.radius);
  }

  /** A round pig face peeking over the card; bobs unless reduceMotion. */
  private pig(reduceMotion: boolean) {
    const P = L.pig;
    const r = P.r;
    const g = this.scene.add.graphics();
    g.lineStyle(5, P.outline, 1);
    for (const side of [-1, 1]) {
      const ear = [
        side * r * 0.85,
        -r * 0.35,
        side * r * 0.75,
        -r * 1.05,
        side * r * 0.2,
        -r * 0.8,
      ] as const;
      g.fillStyle(P.body, 1)
        .fillTriangle(...ear)
        .strokeTriangle(...ear);
    }
    g.fillStyle(P.body, 1).fillCircle(0, 0, r).strokeCircle(0, 0, r);
    g.fillStyle(P.snout, 0.55)
      .fillCircle(-r * 0.58, r * 0.22, r * 0.17)
      .fillCircle(r * 0.58, r * 0.22, r * 0.17);
    for (const side of [-1, 1]) {
      g.fillStyle(P.outline, 1).fillCircle(side * r * 0.34, -r * 0.12, r * 0.11);
      g.fillStyle(0xffffff, 1).fillCircle(side * r * 0.34 + r * 0.04, -r * 0.17, r * 0.04);
    }
    g.fillStyle(P.snout, 1)
      .fillEllipse(0, r * 0.3, r * 0.62, r * 0.42)
      .strokeEllipse(0, r * 0.3, r * 0.62, r * 0.42);
    g.fillStyle(P.outline, 1)
      .fillEllipse(-r * 0.12, r * 0.3, r * 0.1, r * 0.16)
      .fillEllipse(r * 0.12, r * 0.3, r * 0.1, r * 0.16);
    const pig = this.scene.add.container(this.cx, P.y, [g]).setDepth(2);
    if (reduceMotion) return;
    this.scene.tweens.add({
      targets: pig,
      y: P.y - P.bobPx,
      duration: P.bobMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private tips(reduceMotion: boolean) {
    const tips = vi.desktop.loadingTips;
    let i = Math.floor(Math.random() * tips.length);
    const text = this.scene.add
      .text(this.cx, L.tip.y, tips[i]!, {
        color: L.tip.color,
        fontSize: `${L.tip.px}px`,
        fontFamily: font,
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.scene.time.addEvent({
      delay: L.tip.everyMs,
      loop: true,
      callback: () => {
        i = (i + 1) % tips.length;
        if (reduceMotion) {
          text.setText(tips[i]!);
          return;
        }
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 180,
          yoyo: true,
          onYoyo: () => text.setText(tips[i]!),
        });
      },
    });
  }
}
