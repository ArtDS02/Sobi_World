// Loading screen (DECISIONS AM-1, AM-2 = the user's mock-up): scenery (LoadingScenery.ts) and an
// ornate wooden sign — a crest medallion with the real pink pig hopping out of it (dust puffs,
// sparkles), a cream panel with the title (the current loading step), a leafy progress bar with the
// percent, carrot and corn, and a tip with a pig icon. Progress is real: PreloadScene feeds the steps
// and the file loader's progress.
import * as Phaser from 'phaser';
import { LOADING_SCREEN as L, LOADING_STEPS, type LoadingStepId } from '../config/loadingScreen';
import { FARM_VIEW } from '../config/farmView';
import type { SeasonId } from '../../../../core/config/seasons';
import { t } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';
import type { FarmLayout } from '../view/pigView';
import { carrot, corn, flower, leaf, sparkle } from './loadingIcons';
import { drawLoadingScenery } from './LoadingScenery';

/** Texture of the pig on the sign, loaded by BootScene before anything else. */
export const LOADING_PIG_KEY = 'loading_pig';

const font = FARM_VIEW.LABEL.fontFamily;
const S = L.sign;
const W = L.wood;
const B = L.bar;

export class LoadingScreen {
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly stripes: Phaser.GameObjects.Graphics;
  private readonly percent: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private shown = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    layout: FarmLayout,
    season: SeasonId,
    private readonly still: boolean, // reduceMotion
  ) {
    drawLoadingScenery(scene, layout, season, still);
    this.drawSign();
    this.pig();
    this.title = scene.add
      .text(S.x, L.title.y, '', {
        color: L.title.color, fontSize: `${L.title.px}px`, fontFamily: font, fontStyle: 'bold',
        stroke: L.title.stroke, strokeThickness: L.title.strokePx,
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.bar = scene.add.graphics().setDepth(3);
    this.stripes = scene.add.graphics().setDepth(3);
    this.barOrnaments();
    this.percent = scene.add
      .text(S.x, B.y, '', {
        color: B.percentColor, fontSize: `${B.percentPx}px`, fontFamily: font, fontStyle: 'bold',
        stroke: B.percentStroke, strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.tips();
    this.setStep('config');
    if (!still) scene.events.on(Phaser.Scenes.Events.UPDATE, (time: number) => this.drawStripes(time));
  }

  /** Overall progress 0..1 (never goes back). */
  setProgress(p: number) {
    this.shown = Math.max(this.shown, Phaser.Math.Clamp(p, 0, 1));
    const x = S.x - B.width / 2;
    const y = B.y - B.height / 2;
    const r = B.height / 2;
    const f = B.framePx;
    const w = Math.max(B.height, B.width * this.shown);
    this.bar
      .clear()
      .fillStyle(B.frame, 1).fillRoundedRect(x - f, y - f, B.width + f * 2, B.height + f * 2, r + f)
      .fillStyle(B.track, 1).fillRoundedRect(x, y, B.width, B.height, r)
      .fillStyle(B.fillDark, 1).fillRoundedRect(x, y + 2, w, B.height - 2, r)
      .fillStyle(B.fill, 1).fillRoundedRect(x, y, w, B.height - 6, r)
      .fillStyle(B.shine, 0.4).fillRoundedRect(x + 10, y + 4, Math.max(0, w - 20), B.height * 0.2, 4);
    this.percent.setText(t(vi.desktop.loadingPercent, { percent: Math.round(this.shown * 100) }));
    if (this.still) this.drawStripes(0);
  }

  /** The title shows the step; the bar jumps to the step's start. */
  setStep(id: LoadingStepId) {
    this.title.setText(vi.desktop.loadingSteps[id]);
    this.setProgress(LOADING_STEPS.find((s) => s.id === id)!.at);
  }

  /** Light diagonal stripes sliding along the filled part of the bar. */
  private drawStripes(time: number) {
    const x = S.x - B.width / 2;
    const y = B.y - B.height / 2;
    const w = Math.max(B.height, B.width * this.shown);
    const g = this.stripes.clear().fillStyle(B.shine, 0.16);
    const shift = ((time / B.stripeMs) * B.stripeEveryPx) % B.stripeEveryPx;
    for (let sx = x - B.height + shift; sx < x + w - 10; sx += B.stripeEveryPx) {
      const a = Math.max(x + 10, sx);
      const z = Math.min(x + w - 10, sx + B.height * 0.5);
      if (z > a) g.fillTriangle(a, y + B.height - 6, z, y + B.height - 6, Math.min(z + 10, x + w - 10), y + 4);
    }
  }

  /** A vine with leaves and flowers along the bar; a carrot and corn on its right end. */
  private barOrnaments() {
    const g = this.scene.add.graphics().setDepth(4);
    const x0 = S.x - B.width / 2 - B.framePx;
    const x1 = S.x + B.width / 2 + B.framePx;
    const top = B.y - B.height / 2 - B.framePx;
    g.lineStyle(4, B.vine, 1).beginPath().moveTo(x0 - 6, B.y);
    for (let x = x0; x <= x1; x += 12) g.lineTo(x, top + Math.sin(x / 26) * 4 - 2);
    g.strokePath();
    for (let x = x0 + 30; x < x1 - 60; x += 78) leaf(g, x, top - 4 + Math.sin(x / 26) * 4, 0.9);
    for (const [dx, dy, s] of [[-14, -12, 1.4], [-24, 10, 1.2], [-4, 16, 1]] as const) leaf(g, x0 + dx, B.y + dy, s);
    flower(g, x0 + 6, top - 2, 1.1);
    flower(g, S.x - 40, top - 6, 0.9, 0xffffff);
    corn(g, x1 + 4, B.y - 12, 1.25);
    carrot(g, x1 - 26, B.y - 4, 1.35, 0.55);
    leaf(g, x1 + 18, B.y + 14, 1.2);
  }

  /** Ornate frame: darker wood with a crest in the middle, curls at the top corners, a cream panel. */
  private drawSign() {
    const x = S.x - S.width / 2;
    const g = this.scene.add.graphics().setDepth(1);
    const C = S.crest;
    const wood = (color: number, grow: number, dy = 0, alpha = 1) => {
      g.fillStyle(color, alpha).fillRoundedRect(x - grow, S.y - grow + dy, S.width + grow * 2, S.height + grow * 2, S.radius + grow);
      g.fillRoundedRect(S.x - C.width / 2 - grow, S.y - C.height - grow + dy, C.width + grow * 2, C.height + S.radius, 26 + grow);
      for (const side of [-1, 1]) g.fillCircle(S.x + side * (S.width / 2 - 6), S.y + 4 + dy, S.curl.r + grow);
    };
    wood(S.shadow.color, 0, S.shadow.dy, S.shadow.alpha);
    wood(W.dark, 6);
    wood(W.mid, 0);
    // Grain and highlight on the frame, curls drawn as spirals.
    g.fillStyle(W.highlight, 0.45).fillRoundedRect(x + 18, S.y + 6, S.width - 36, 6, 3);
    g.fillRoundedRect(S.x - C.width / 2 + 20, S.y - C.height + 6, C.width - 40, 5, 3);
    for (const side of [-1, 1]) {
      const cx = S.x + side * (S.width / 2 - 6);
      g.lineStyle(5, W.dark, 1).strokeCircle(cx, S.y + 4, S.curl.r * 0.62).strokeCircle(cx, S.y + 4, S.curl.r * 0.25);
    }
    const P = S.panel;
    const px = x + P.inset;
    const py = S.y + P.inset;
    const pw = S.width - P.inset * 2;
    const ph = S.height - P.inset * 2;
    g.fillStyle(W.dark, 1).fillRoundedRect(px - 4, py - 4, pw + 8, ph + 8, P.radius + 4);
    g.fillStyle(P.edge, 1).fillRoundedRect(px, py, pw, ph, P.radius);
    g.fillStyle(P.color, 1).fillRoundedRect(px + 4, py + 6, pw - 8, ph - 10, P.radius - 2);
    for (const [nx, ny] of [[x + 14, S.y + S.height - 14], [x + S.width - 14, S.y + S.height - 14]] as const) {
      g.fillStyle(W.nail, 1).fillCircle(nx, ny, 6).fillStyle(W.highlight, 0.8).fillCircle(nx - 2, ny - 2, 2);
    }
    const M = L.medallion;
    g.fillStyle(M.ring, 1).fillCircle(S.x, M.y, M.r);
    g.fillStyle(M.face, 1).fillCircle(S.x, M.y, M.r - 8);
    g.fillStyle(M.hole, 0.9).fillEllipse(S.x, M.y + 6, M.r * 0.95, M.r * 0.46);
  }

  /** The real pig art hopping out of the medallion (a drawn pig if its file failed), dust, sparkles. */
  private pig() {
    const P = L.pig;
    const sc = this.scene;
    const body = sc.textures.exists(LOADING_PIG_KEY)
      ? sc.add.image(0, 0, LOADING_PIG_KEY).setOrigin(0.5, 0.82).setDisplaySize(P.size, P.size)
      : this.drawnPig();
    const baseScale = body.scaleX;
    const pig = sc.add.container(S.x, P.y + P.size * 0.32, [body]).setDepth(2);
    const sparkles = sc.add.graphics().setDepth(2);
    for (const s of P.sparkles) sparkle(sparkles, S.x + s.x, P.y + s.y, s.s);
    if (this.still) return;
    sc.tweens.add({ targets: sparkles, alpha: 0.35, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    sc.tweens.add({
      targets: pig, y: pig.y - P.hopPx, duration: P.hopMs, ease: 'Quad.easeOut', yoyo: true, repeat: -1,
      onYoyo: () => body.setScale(baseScale * (1 + P.squash), baseScale * (1 - P.squash)),
      onRepeat: () => body.setScale(baseScale),
    });
    const D = P.dust;
    sc.time.addEvent({
      delay: D.everyMs,
      loop: true,
      callback: () => {
        for (let i = 0; i < D.count; i++) {
          const side = i % 2 ? 1 : -1;
          const puff = sc.add.circle(S.x + side * (20 + i * 18), L.medallion.y - 6, 14 + i * 4, D.color, D.alpha).setDepth(1.5);
          sc.tweens.add({
            targets: puff, x: puff.x + side * 50, y: puff.y - D.risePx, scale: 1.6, alpha: 0, duration: D.ms,
            onComplete: () => puff.destroy(),
          });
        }
      },
    });
  }

  private drawnPig(): Phaser.GameObjects.Graphics {
    const P = L.pig.drawn;
    const r = P.r;
    const g = this.scene.add.graphics().lineStyle(5, P.outline, 1).fillStyle(P.body, 1);
    for (const side of [-1, 1]) g.fillTriangle(side * r * 0.85, -r * 0.35, side * r * 0.75, -r * 1.05, side * r * 0.2, -r * 0.8);
    g.fillCircle(0, 0, r).strokeCircle(0, 0, r);
    g.fillStyle(P.cheek, 0.45).fillCircle(-r * 0.58, r * 0.24, r * 0.17).fillCircle(r * 0.58, r * 0.24, r * 0.17);
    g.fillStyle(P.outline, 1).fillCircle(-r * 0.34, -r * 0.1, r * 0.1).fillCircle(r * 0.34, -r * 0.1, r * 0.1);
    g.fillStyle(P.snout, 1).fillEllipse(0, r * 0.32, r * 0.66, r * 0.44);
    g.fillStyle(P.outline, 1).fillEllipse(-r * 0.13, r * 0.32, r * 0.11, r * 0.17).fillEllipse(r * 0.13, r * 0.32, r * 0.11, r * 0.17);
    return g.setY(-r);
  }

  /** "🐷 Mẹo: …" line, rotating. */
  private tips() {
    const T = L.tip;
    const tips = vi.desktop.loadingTips;
    let i = Phaser.Math.Between(0, tips.length - 1);
    const icon = this.scene.add.graphics().setDepth(3);
    const text = this.scene.add
      .text(S.x, T.y, '', { color: T.color, fontSize: `${T.px}px`, fontFamily: font })
      .setOrigin(0.5)
      .setDepth(3);
    const show = () => {
      text.setText(tips[i]!);
      const ix = S.x - text.width / 2 - T.iconGap / 2;
      text.setX(S.x + T.iconGap / 2);
      const P = L.pig.drawn;
      icon.clear().fillStyle(P.body, 1).fillRoundedRect(ix - 13, T.y - 11, 26, 22, 7).lineStyle(2, P.outline, 1).strokeRoundedRect(ix - 13, T.y - 11, 26, 22, 7);
      icon.fillStyle(P.snout, 1).fillEllipse(ix, T.y + 3, 12, 8).fillStyle(P.outline, 1).fillCircle(ix - 5, T.y - 4, 1.8).fillCircle(ix + 5, T.y - 4, 1.8);
    };
    show();
    this.scene.time.addEvent({
      delay: T.everyMs,
      loop: true,
      callback: () => {
        i = (i + 1) % tips.length;
        if (this.still) return show();
        this.scene.tweens.add({ targets: [text, icon], alpha: 0, duration: 180, yoyo: true, onYoyo: show });
      },
    });
  }
}
