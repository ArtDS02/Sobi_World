// Loading screen (DECISIONS AM-1): countryside scenery (LoadingScenery.ts) and a wooden farm sign —
// a pig peeking over the top (blinks, wiggles its ears), a two-line title, a striped progress bar,
// the percent and the current loading step — plus a rotating tip on a pill below. Progress is real:
// PreloadScene feeds it the loading steps and the file loader's progress. Shapes only.
import * as Phaser from 'phaser';
import { LOADING_SCREEN as L, LOADING_STEPS, type LoadingStepId } from '../../core/config/loadingScreen';
import { FARM_VIEW } from '../../core/config/farmView';
import type { SeasonId } from '../../core/config/seasons';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { drawLoadingScenery } from './LoadingScenery';
import type { FarmLayout } from '../view/pigView';

const font = FARM_VIEW.LABEL.fontFamily;
const S = L.sign;
const W = L.wood;

export class LoadingScreen {
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly stripes: Phaser.GameObjects.Graphics;
  private readonly percent: Phaser.GameObjects.Text;
  private readonly status: Phaser.GameObjects.Text;
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
    const title = vi.desktop.loadingTitle.toUpperCase().split('\n');
    title.forEach((line, i) =>
      scene.add
        .text(S.x, L.title.y + (i - (title.length - 1) / 2) * L.title.lineGap, line, {
          color: L.title.color, fontSize: `${L.title.px}px`, fontFamily: font, fontStyle: 'bold',
          stroke: L.title.stroke, strokeThickness: L.title.strokePx,
        })
        .setOrigin(0.5)
        .setDepth(3),
    );
    this.bar = scene.add.graphics().setDepth(3);
    this.stripes = scene.add.graphics().setDepth(3);
    this.percent = this.label(L.percent.y, L.percent.px, L.percent.color, true);
    this.status = this.label(L.status.y, L.status.px, L.status.color, false);
    this.tips();
    this.setStep('config');
    this.setProgress(0);
    if (!still) scene.events.on(Phaser.Scenes.Events.UPDATE, (time: number) => this.drawStripes(time));
  }

  /** Overall progress 0..1 (never goes back). */
  setProgress(p: number) {
    this.shown = Math.max(this.shown, Phaser.Math.Clamp(p, 0, 1));
    const b = L.bar;
    const x = S.x - b.width / 2;
    const y = b.y - b.height / 2;
    const r = b.height / 2;
    const f = b.framePx;
    const w = Math.max(b.height, b.width * this.shown);
    this.bar
      .clear()
      .fillStyle(b.frame, 1).fillRoundedRect(x - f, y - f, b.width + f * 2, b.height + f * 2, r + f)
      .fillStyle(b.track, 1).fillRoundedRect(x, y, b.width, b.height, r)
      .fillStyle(b.fillDark, 1).fillRoundedRect(x, y + 3, w, b.height - 3, r)
      .fillStyle(b.fill, 1).fillRoundedRect(x, y, w, b.height - 5, r)
      .fillStyle(b.shine, 0.35).fillRoundedRect(x + 8, y + 5, Math.max(0, w - 16), b.height * 0.22, 4);
    this.percent.setText(t(vi.desktop.loadingPercent, { percent: Math.round(this.shown * 100) }));
    if (this.still) this.drawStripes(0);
  }

  /** The step shown under the bar (and the bar jumps to the step's start). */
  setStep(id: LoadingStepId) {
    this.status.setText(vi.desktop.loadingSteps[id]);
    this.setProgress(LOADING_STEPS.find((s) => s.id === id)!.at);
  }

  /** Light diagonal stripes sliding along the filled part of the bar. */
  private drawStripes(time: number) {
    const b = L.bar;
    const x = S.x - b.width / 2;
    const y = b.y - b.height / 2;
    const w = Math.max(b.height, b.width * this.shown);
    const g = this.stripes.clear().fillStyle(b.shine, 0.18);
    const shift = ((time / b.stripeMs) * b.stripeEveryPx) % b.stripeEveryPx;
    for (let sx = x - b.height + shift; sx < x + w - 8; sx += b.stripeEveryPx) {
      const a = Math.max(x + 8, sx);
      const z = Math.min(x + w - 8, sx + b.height * 0.5);
      if (z > a) g.fillTriangle(a, y + b.height - 6, z, y + b.height - 6, Math.min(z + 10, x + w - 8), y + 4);
    }
  }

  private label(y: number, px: number, color: string, bold: boolean) {
    return this.scene.add
      .text(S.x, y, '', { color, fontSize: `${px}px`, fontFamily: font, fontStyle: bold ? 'bold' : 'normal' })
      .setOrigin(0.5)
      .setDepth(3);
  }

  /** Two posts, a planked board in a darker frame, a cream panel for the text, nails, highlight. */
  private drawSign() {
    const x = S.x - S.width / 2;
    const g = this.scene.add.graphics().setDepth(1);
    const P = S.posts;
    for (const side of [-1, 1]) {
      const px = S.x + side * P.dx - P.width / 2;
      g.fillStyle(W.dark, 1).fillRoundedRect(px - 3, S.y, P.width + 6, P.bottom - S.y, 8);
      g.fillStyle(W.mid, 1).fillRoundedRect(px, S.y, P.width, P.bottom - S.y - 3, 6);
      g.fillStyle(W.highlight, 0.4).fillRect(px + 6, S.y, 6, P.bottom - S.y - 10);
    }
    g.fillStyle(S.shadow.color, S.shadow.alpha).fillRoundedRect(x, S.y + S.shadow.dy, S.width, S.height, S.radius);
    g.fillStyle(W.dark, 1).fillRoundedRect(x, S.y, S.width, S.height, S.radius);
    const fp = S.framePx;
    const inner = { x: x + fp, y: S.y + fp, w: S.width - fp * 2, h: S.height - fp * 2 };
    g.fillStyle(W.face, 1).fillRoundedRect(inner.x, inner.y, inner.w, inner.h, S.radius - fp / 2);
    const plank = inner.h / S.plankCount;
    for (let i = 1; i < S.plankCount; i++) g.fillStyle(W.mid, 1).fillRect(inner.x + 6, inner.y + plank * i - 2, inner.w - 12, 4);
    g.lineStyle(2, W.grain, 0.7);
    for (let i = 0; i < S.plankCount; i++) {
      const py = inner.y + plank * i + plank * 0.5;
      g.lineBetween(inner.x + 30, py - 8, inner.x + inner.w * 0.32, py - 8).lineBetween(inner.x + inner.w * 0.6, py + 10, inner.x + inner.w - 34, py + 10);
    }
    g.fillStyle(W.highlight, 0.55).fillRoundedRect(inner.x + 14, inner.y + 6, inner.w - 28, 8, 4);
    const pn = S.panel;
    const panel = { x: x + pn.inset, y: S.y + pn.top, w: S.width - pn.inset * 2, h: S.height - pn.top - pn.bottom };
    g.fillStyle(pn.border, 1).fillRoundedRect(panel.x - pn.borderPx, panel.y - pn.borderPx, panel.w + pn.borderPx * 2, panel.h + pn.borderPx * 2, pn.radius + pn.borderPx);
    g.fillStyle(pn.color, 1).fillRoundedRect(panel.x, panel.y, panel.w, panel.h, pn.radius);
    for (const [nx, ny] of [[x + 26, S.y + 26], [x + S.width - 26, S.y + 26], [x + 26, S.y + S.height - 26], [x + S.width - 26, S.y + S.height - 26]] as const) {
      g.fillStyle(W.nail, 1).fillCircle(nx, ny, 6).fillStyle(W.highlight, 0.8).fillCircle(nx - 2, ny - 2, 2);
    }
  }

  /** A round pig face peeking over the sign with hooves on its edge; blinks, wiggles ears, bobs. */
  private pig() {
    const P = L.pig;
    const r = P.r;
    const sc = this.scene;
    const ear = (side: number) => {
      const g = sc.add.graphics().lineStyle(5, P.outline, 1).fillStyle(P.body, 1);
      const pts = [0, 0, side * r * 0.1, -r * 0.72, side * r * 0.62, -r * 0.2] as const;
      g.fillTriangle(...pts).strokeTriangle(...pts).fillStyle(P.cheek, 0.6).fillTriangle(side * r * 0.12, -r * 0.08, side * r * 0.16, -r * 0.5, side * r * 0.42, -r * 0.18);
      return sc.add.container(side * r * 0.5, -r * 0.62, [g]);
    };
    const ears = [ear(-1), ear(1)];
    const head = sc.add.graphics().lineStyle(5, P.outline, 1).fillStyle(P.body, 1).fillCircle(0, 0, r).strokeCircle(0, 0, r);
    head.fillStyle(P.cheek, 0.45).fillCircle(-r * 0.58, r * 0.24, r * 0.17).fillCircle(r * 0.58, r * 0.24, r * 0.17);
    const eyes = sc.add.graphics();
    for (const side of [-1, 1]) {
      eyes.fillStyle(P.outline, 1).fillEllipse(side * r * 0.34, -r * 0.1, r * 0.2, r * 0.26);
      eyes.fillStyle(0xffffff, 1).fillCircle(side * r * 0.34 + r * 0.04, -r * 0.16, r * 0.05);
    }
    const snout = sc.add.graphics().lineStyle(4, P.outline, 1).fillStyle(P.snout, 1);
    snout.fillEllipse(0, 0, r * 0.66, r * 0.44).strokeEllipse(0, 0, r * 0.66, r * 0.44);
    snout.fillStyle(P.outline, 1).fillEllipse(-r * 0.13, 0, r * 0.11, r * 0.17).fillEllipse(r * 0.13, 0, r * 0.11, r * 0.17);
    const nose = sc.add.container(0, r * 0.32, [snout]);
    const hooves = sc.add.graphics().lineStyle(4, P.outline, 1).fillStyle(P.body, 1);
    for (const side of [-1, 1]) hooves.fillEllipse(side * r * 0.8, r * 0.92, r * 0.42, r * 0.3).strokeEllipse(side * r * 0.8, r * 0.92, r * 0.42, r * 0.3);
    const pig = sc.add.container(S.x, P.y, [...ears, head, eyes, nose, hooves]).setDepth(2);
    if (this.still) return;
    sc.tweens.add({ targets: pig, y: P.y - P.bobPx, duration: P.bobMs, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    sc.tweens.add({ targets: nose, scaleX: 1.08, scaleY: 0.94, duration: P.bobMs / 2, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    ears.forEach((e, i) =>
      sc.tweens.add({ targets: e, angle: (i ? 1 : -1) * P.earWiggleDeg, duration: P.earMs, delay: i * 200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1, repeatDelay: P.earMs }),
    );
    sc.time.addEvent({
      delay: P.blinkEveryMs,
      loop: true,
      callback: () => sc.tweens.add({ targets: eyes, scaleY: 0.1, y: -r * 0.1 * 0.9, duration: P.blinkMs, yoyo: true }),
    });
  }

  private tips() {
    const T = L.tip;
    const tips = vi.desktop.loadingTips;
    let i = Phaser.Math.Between(0, tips.length - 1);
    const pill = this.scene.add.graphics().setDepth(3);
    const text = this.scene.add
      .text(S.x, T.y, '', { color: T.color, fontSize: `${T.px}px`, fontFamily: font })
      .setOrigin(0.5)
      .setDepth(4);
    const show = () => {
      text.setText(tips[i]!);
      const w = text.width + T.padX * 2;
      pill.clear().fillStyle(T.pill, T.pillAlpha).fillRoundedRect(S.x - w / 2, T.y - T.height / 2, w, T.height, T.height / 2);
    };
    show();
    this.scene.time.addEvent({
      delay: T.everyMs,
      loop: true,
      callback: () => {
        i = (i + 1) % tips.length;
        if (this.still) return show();
        this.scene.tweens.add({ targets: [text, pill], alpha: 0, duration: 180, yoyo: true, onYoyo: show });
      },
    });
  }
}
