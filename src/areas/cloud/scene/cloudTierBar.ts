// The Cloud's tier bar (decision 023): the wooden title banner with the tier's name under the field, the arrows that go down
// or up a tier, and the notice over a tier that is not open yet. Draws and reports clicks; CloudScene decides what they do.
import * as Phaser from 'phaser';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { CLOUD_DRESSING_ART } from '../logic/art';
import { CB, PLOTS_PER_TIER, TIER_COUNT } from '../logic/config/content';
import { CLOUD_VIEW, plotCentre, plotIndex, viewableTiers } from './cloudView';

type Img = Phaser.GameObjects.Image;

export interface TierBarDeps {
  /** An image of fixed art (re-pointed by the scene when its texture arrives late). */
  fixed: (x: number, y: number, id: string) => Img;
  /** Hover press on an arrow. */
  press: (img: Img) => void;
  float: (targets: Phaser.GameObjects.GameObject[], px: number) => void;
  paused: () => boolean;
  /** An arrow was clicked: −1 down, +1 up. */
  onStep: (step: number) => void;
  /** The closed tier's notice was clicked. */
  onLocked: () => void;
}

/** The text style of words painted on wood. */
export function signStyle(px: number, color: string, stroke: string, strokePx: number): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: CLOUD_VIEW.label.fontFamily, fontSize: `${px}px`, fontStyle: 'bold', color, stroke, strokeThickness: strokePx };
}

/** The step that opens tier `tier` (0-based), for the closed tier's notice. */
const tierStep = (tier: number) => CB.plotExpansions.find((e) => e.plots === (tier + 1) * PLOTS_PER_TIER);

export class CloudTierBar {
  readonly title: Phaser.GameObjects.Text;
  private readonly up: Img;
  private readonly down: Img;
  private readonly note: Phaser.GameObjects.Text;

  /** `field` is the container of the plots: the closed tier's notice moves with them. */
  constructor(scene: Phaser.Scene, field: Phaser.GameObjects.Container, d: TierBarDeps) {
    const v = CLOUD_VIEW;
    const banner = d.fixed(v.title.x, v.title.y, CLOUD_DRESSING_ART.banner).setDisplaySize(v.title.width, v.title.height).setDepth(v.depth.sign);
    const tt = v.titleText;
    this.title = scene.add.text(v.title.x + 14, v.title.y + 2, '', signStyle(tt.fontPx, tt.color, tt.stroke, tt.strokePx)).setOrigin(0.5).setDepth(v.depth.sign + 1);
    d.float([banner, this.title], 3);
    const arrow = (at: { x: number; y: number }, art: string, step: number, label: string) => {
      const img = d.fixed(at.x, at.y, art).setDisplaySize(v.arrowSize, v.arrowSize).setDepth(v.depth.sign).setInteractive({ useHandCursor: true });
      img.setName(label);
      img.on(Phaser.Input.Events.POINTER_DOWN, () => !d.paused() && d.onStep(step));
      d.press(img);
      d.float([img], 4);
      return img;
    };
    this.down = arrow(v.tierDown, CLOUD_DRESSING_ART.down, -1, vi.cloud.tierDown);
    this.up = arrow(v.tierUp, CLOUD_DRESSING_ART.up, 1, vi.cloud.tierUp);
    const lt = v.lockedText;
    const centre = plotCentre(Math.floor(PLOTS_PER_TIER / 2));
    this.note = scene.add
      .text(centre.x, centre.y, '', { fontFamily: v.label.fontFamily, fontSize: `${lt.fontPx}px`, color: lt.color, backgroundColor: lt.background, padding: { x: 18, y: 8 }, align: 'center' })
      .setOrigin(0.5)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    field.add(this.note);
    this.note.on(Phaser.Input.Events.POINTER_DOWN, () => !d.paused() && d.onLocked());
  }

  /** The title's scale so it stays inside the banner (Text.width is the unscaled width). */
  titleScale(): number {
    return Math.min(1, (CLOUD_VIEW.title.width * CLOUD_VIEW.titleFit) / Math.max(this.title.width, 1));
  }

  /** Name of `tier`, which arrows show, and the notice when it is not open yet (`owned` plots). */
  draw(tier: number, owned: number) {
    const name = vi.cloud.tierNames[tier] ?? '';
    this.title.setText(tier === 0 ? name : t(vi.cloud.tierTitle, { n: tier + 1, name }));
    this.title.setScale(this.titleScale());
    const viewable = viewableTiers(owned, TIER_COUNT);
    this.down.setVisible(tier > 0);
    this.up.setVisible(tier < viewable - 1);
    const step = plotIndex(tier, 0) >= owned ? tierStep(tier) : undefined;
    this.note.setVisible(Boolean(step));
    if (step) this.note.setText(t(vi.cloud.tierLocked, { n: tier + 1, level: step.level ?? 1, gold: `${formatInt(step.price)} ${vi.cloud.coins}` }));
  }
}
