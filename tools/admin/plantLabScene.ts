// The stage of the admin "Cây đung đưa" page (plantLab.ts): one area's plants on that area's backdrop and plot art, either one plant
// twice side by side (the old whole-picture tilt on the left, the stem bend on the right, same rhythm) or every plant of the area at
// once. Draws what `PlantLabState` says each frame with the game's own breeze and bend (systems/animation/plantBend.ts,
// ui/world/bentPlant.ts).
import * as Phaser from 'phaser';
import { bendRows, breezeAt } from '../../src/systems/animation';
import { BentPlant } from '../../src/ui/world/bentPlant';

export type Stage = 'sprout' | 'grow' | 'ripe' | 'wilt';
export interface Plant {
  id: string;
  name: string;
  art: string;
}
export interface Tune {
  root: number;
  stiff: number;
  lag: number;
  sprout: number;
  grow: number;
  ripe: number;
  wilt: number;
}
export interface LabArea {
  backdrop: string;
  plot: string;
  plants: readonly Plant[];
  /** The game's old sway of this area: degrees by stage, period range, gust. */
  sway: Record<Stage, number> & { periodMs: readonly number[]; gustMs: number; gust: number };
}
export interface PlantLabState {
  area: LabArea;
  plant: string;
  stage: Stage;
  view: 'compare' | 'all';
  /** In "all": bend (true) or the old tilt (false). */
  allBend: boolean;
  speed: number;
  gust: boolean;
  stem: boolean;
  tune: Tune;
  /** Manifest rows by id (texture urls). */
  images: ReadonlyMap<string, { asset?: string }>;
}

interface Slot {
  plot: Phaser.GameObjects.Image;
  img: Phaser.GameObjects.Image;
  bent: BentPlant;
}

const ROWS = 14;

export class PlantLabScene extends Phaser.Scene {
  private slots: Slot[] = [];
  private bg!: Phaser.GameObjects.Image;
  private gfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private asked = new Set<string>();
  private clock = 0;
  private last = 0;
  private readonly verts = new Float32Array(ROWS * 4);

  constructor(private readonly s: PlantLabState) {
    super('plant-lab');
  }

  create() {
    this.bg = this.add.image(0, 0, '__WHITE').setOrigin(0.5).setAlpha(0.9).setVisible(false);
    this.gfx = this.add.graphics().setDepth(5000);
    this.label = this.add.text(12, 10, '', { fontFamily: 'monospace', fontSize: '13px', color: '#fff', backgroundColor: '#0008', padding: { x: 6, y: 4 } }).setDepth(5001);
  }

  /** A texture by asset id (loaded on first ask); whether it is ready. */
  private want(id: string): boolean {
    if (this.textures.exists(id)) return true;
    if (this.asked.has(id)) return false;
    this.asked.add(id);
    const row = this.s.images.get(id);
    if (row?.asset) {
      this.load.image(id, `/assets/${row.asset}`);
      if (!this.load.isLoading()) this.load.start();
    }
    return false;
  }

  private slot(i: number): Slot {
    while (this.slots.length <= i) {
      const plot = this.add.image(0, 0, '__WHITE').setVisible(false);
      const img = this.add.image(0, 0, '__WHITE').setOrigin(0.5, 1).setVisible(false);
      this.slots.push({ plot, img, bent: new BentPlant(this, img, ROWS) });
    }
    return this.slots[i]!;
  }

  override update() {
    const now = performance.now();
    this.clock += (this.last ? Math.min(50, now - this.last) : 16) * this.s.speed;
    this.last = now;
    const { area, stage } = this.s;
    const W = this.scale.width;
    const H = this.scale.height;
    if (this.want(area.backdrop)) {
      this.bg.setTexture(area.backdrop).setPosition(W / 2, H / 2).setVisible(true);
      this.bg.setScale(Math.max(W / this.bg.width, H / this.bg.height));
    } else this.bg.setVisible(false);
    this.gfx.clear();
    const items = this.layout(W, H);
    this.slots.forEach((sl, i) => {
      if (i >= items.length) {
        sl.bent.off();
        sl.img.setVisible(false);
        sl.plot.setVisible(false);
      }
    });
    items.forEach((it, i) => this.drawSlot(this.slot(i), it, i));
    const t = this.s.tune;
    this.label.setText(
      `${stage} · ×${this.s.speed} · cũ ${area.sway[stage]}° · mới ngọn ${t[stage]}°, gốc ${Math.round(t.root * 100)}%, bông cứng từ ${Math.round(t.stiff * 100)}%, trễ ${t.lag.toFixed(2)}`,
    );
  }

  /** Where each plant stands: one plant twice (compare) or the whole area in a grid. */
  private layout(W: number, H: number): { plant: Plant; x: number; y: number; height: number; bend: boolean; k: number }[] {
    const { area } = this.s;
    if (this.s.view === 'compare') {
      const plant = area.plants.find((p) => p.id === this.s.plant) ?? area.plants[0];
      if (!plant) return [];
      return [false, true].map((bend, i) => ({ plant, x: W * (i ? 0.7 : 0.3), y: H * 0.8, height: H * 0.55, bend, k: 0 }));
    }
    const n = area.plants.length;
    const cols = Math.max(1, Math.ceil(Math.sqrt((n * W) / H)));
    const rows = Math.ceil(n / cols);
    const cellW = W / cols;
    const cellH = (H - 40) / rows;
    return area.plants.map((plant, k) => ({
      plant,
      x: cellW * ((k % cols) + 0.5),
      y: 40 + cellH * (Math.floor(k / cols) + 0.86),
      height: Math.min(cellH * 0.82, cellW * 0.9),
      bend: this.s.allBend,
      k,
    }));
  }

  private drawSlot(sl: Slot, it: { plant: Plant; x: number; y: number; height: number; bend: boolean; k: number }, i: number) {
    const { area, stage, tune } = this.s;
    const key = `${it.plant.art}_${stage}`;
    const ready = this.want(key);
    if (this.want(area.plot)) {
      sl.plot.setTexture(area.plot).setVisible(true).setDepth(10 + i * 2);
      const pw = it.height * 1.05;
      sl.plot.setPosition(it.x, it.y - pw * 0.06).setScale(pw / sl.plot.width);
    }
    if (!ready) {
      sl.bent.off();
      sl.img.setVisible(false);
      return;
    }
    if (sl.img.texture.key !== key) sl.img.setTexture(key);
    const scale = it.height / sl.img.height;
    sl.img.setVisible(true).setPosition(it.x, it.y).setScale(scale).setDepth(11 + i * 2);
    // The game's rhythm: each plant its own period and phase, all stirred by one slow gust.
    const sw = area.sway;
    const breeze = breezeAt(this.clock, it.k, sw);
    const phase = breeze.phase;
    const gust = this.s.gust ? breeze.gust : 1;
    if (!it.bend) {
      sl.bent.off();
      sl.img.setAngle(Math.sin(phase) * sw[stage] * gust);
      if (this.s.stem) this.drawTilt(it.x, it.y, it.height, Phaser.Math.DegToRad(sl.img.angle));
      return;
    }
    sl.img.setAngle(0);
    const amp = Phaser.Math.DegToRad(tune[stage]) * gust;
    sl.bent.draw(amp, phase, tune);
    if (this.s.stem) this.drawStem(it.x, it.y, scale, sl.img.width, sl.img.height, amp, phase);
  }

  /** The old tilt's axis: one straight line from the base. */
  private drawTilt(x: number, y: number, height: number, angle: number) {
    this.gfx.lineStyle(3, 0x33e0ff, 0.95).lineBetween(x, y, x + Math.sin(angle) * height, y - Math.cos(angle) * height);
    this.gfx.fillStyle(0xffe14a, 1).fillCircle(x, y, 4);
  }

  /** The bent stem: the centre line of the rows, the fixed root and where the rigid top starts. */
  private drawStem(x: number, y: number, scale: number, w: number, h: number, amp: number, phase: number) {
    const tune = this.s.tune;
    bendRows(this.verts, ROWS, w, h, amp, phase, tune);
    const at = (k: number) => ({ x: x + ((this.verts[k * 4]! + this.verts[k * 4 + 2]!) / 2) * scale, y: y + ((this.verts[k * 4 + 1]! + this.verts[k * 4 + 3]!) / 2) * scale });
    this.gfx.lineStyle(3, 0xff7ad0, 0.95).beginPath();
    for (let k = ROWS - 1; k >= 0; k--) {
      const p = at(k);
      if (k === ROWS - 1) this.gfx.moveTo(p.x, p.y);
      else this.gfx.lineTo(p.x, p.y);
    }
    this.gfx.strokePath();
    const mark = (share: number, colour: number) => {
      const p = at(Math.round((1 - share) * (ROWS - 1)));
      this.gfx.fillStyle(colour, 1).fillCircle(p.x, p.y, 4.5);
    };
    mark(tune.root, 0xffe14a);
    mark(tune.stiff, 0x8bff8b);
  }
}
