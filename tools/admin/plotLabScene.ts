// The stage of the admin "Khuông & cảnh bậc" page (plotLab.ts): one cloud tier / garden zone exactly as the game draws it — backdrop
// with the tier's tint or the skin's mood, the plots on the plain or skinned bed, the rank frame and every scenery layer of the
// chosen rank (src/systems/animation/rankScenery.ts, drawn by ui/world/rankScenery.ts). Reads `PlotLabState` each frame.
import * as Phaser from 'phaser';
import { CLOUD_BACKDROP_ART, CLOUD_PLOT_ART } from '../../src/areas/cloud/logic/art';
import { CLOUD_DESIGN, CLOUD_FRAME, CLOUD_SCENERY, CLOUD_VIEW, plotCentre as cloudCentre } from '../../src/areas/cloud/scene/cloudView';
import { GARDEN_BACKDROP_ART, PLOT_ART } from '../../src/areas/garden/logic/art';
import { GARDEN_DESIGN, GARDEN_FRAME, GARDEN_SCENERY, GARDEN_VIEW } from '../../src/areas/garden/scene/gardenView';
import { skinArtId, skinBackdropArt, skinTheme } from '../../src/core/config/plotSkins';
import { type RankFrame, type SceneryLayer } from '../../src/systems/animation/rankScenery';
import { RankScenery } from '../../src/ui/world/rankScenery';
import { RankLook } from '../../src/ui/world/rankLook';

export type PlotLabArea = 'cloud' | 'garden';

export interface PlotLabState {
  area: PlotLabArea;
  /** Cloud tier / garden zone, 0-based. */
  group: number;
  /** Upgrade rank 1..5. */
  rank: number;
  /** The skin worn, null = plain. */
  skin: string | null;
  night: boolean;
  /** Also draw the old pasted sprites (RANK_SPRITES_ON is off in the game) to compare. */
  sprites: boolean;
  /** "Giảm chuyển động": the scenery stands still. */
  still: boolean;
  /** Manifest rows by id (texture urls). */
  images: ReadonlyMap<string, { asset?: string }>;
}

interface Geometry {
  design: { width: number; height: number };
  backdrop: string;
  scenery: readonly SceneryLayer[];
  frame: RankFrame;
  /** Centres of the plots and the scale of a bed. */
  slots: { x: number; y: number }[];
  scale: number;
  tint: (group: number) => number;
  bed: (skin: string | null) => string;
}

const GEOMETRY: Record<PlotLabArea, Geometry> = {
  cloud: {
    design: CLOUD_DESIGN,
    backdrop: CLOUD_BACKDROP_ART,
    scenery: CLOUD_SCENERY,
    frame: CLOUD_FRAME,
    slots: Array.from({ length: 15 }, (_, i) => cloudCentre(i)),
    scale: 1,
    tint: (g) => CLOUD_VIEW.tierTints[g] ?? 0xffffff,
    bed: (skin) => (skin ? skinArtId(skin, 'cloud') : CLOUD_PLOT_ART),
  },
  garden: {
    design: GARDEN_DESIGN,
    backdrop: GARDEN_BACKDROP_ART,
    scenery: GARDEN_SCENERY,
    frame: GARDEN_FRAME,
    slots: Array.from({ length: 24 }, (_, i) => ({ x: GARDEN_VIEW.field.x + (i % GARDEN_VIEW.columns) * GARDEN_VIEW.field.stepX, y: GARDEN_VIEW.field.y + Math.floor(i / GARDEN_VIEW.columns) * GARDEN_VIEW.field.stepY })),
    scale: GARDEN_VIEW.plotScale,
    tint: (g) => GARDEN_VIEW.zoneTints[g] ?? 0xffffff,
    bed: (skin) => (skin ? skinArtId(skin, 'soil') : PLOT_ART.soil),
  },
};

export class PlotLabScene extends Phaser.Scene {
  private built: { area: PlotLabArea; scenery: RankScenery; look: RankLook; backdrop: Phaser.GameObjects.Image; beds: Phaser.GameObjects.Image[] } | null = null;
  private fixedArt: [Phaser.GameObjects.Image, string][] = [];
  private asked = new Set<string>();
  private drawnKey = '';

  constructor(private readonly s: PlotLabState) {
    super('plot-lab');
  }

  /** Loads a texture on first ask; whether it is ready. */
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

  private build(area: PlotLabArea) {
    this.children.removeAll(true);
    this.fixedArt = [];
    const g = GEOMETRY[area];
    const backdrop = this.add.image(g.design.width / 2, g.design.height / 2, '__WHITE').setDepth(-1000);
    const beds = g.slots.map((p) => this.add.image(p.x, p.y, '__WHITE').setScale(g.scale).setDepth(10));
    const scenery = new RankScenery(this, g.scenery, (x, y, id) => {
      const img = this.add.image(x, y, '__WHITE');
      this.fixedArt.push([img, id]);
      return img;
    }, g.frame);
    const look = new RankLook(this, [], () => this.add.image(0, 0, '__WHITE'), { design: g.design, field: g.frame, depth: 3200, area });
    this.built = { area, scenery, look, backdrop, beds };
    this.drawnKey = '';
  }

  override update(time: number) {
    const s = this.s;
    if (!this.built || this.built.area !== s.area) this.build(s.area);
    const b = this.built!;
    const g = GEOMETRY[s.area];
    const W = this.scale.width;
    const H = this.scale.height;
    const cam = this.cameras.main;
    cam.setZoom(Math.min(W / g.design.width, H / g.design.height));
    cam.centerOn(g.design.width / 2, g.design.height / 2);
    // Textures arrive late: point every image at its art as soon as it is loaded.
    for (const [img, id] of this.fixedArt) if (this.want(id) && img.texture.key !== id) img.setTexture(id);
    const theme = skinTheme(s.skin);
    const bedId = g.bed(s.skin);
    const own = skinBackdropArt(s.skin, s.area);
    const art = own && this.want(own) ? own : g.backdrop;
    if (this.want(art)) b.backdrop.setTexture(art).setDisplaySize(g.design.width, g.design.height);
    if (art === own) b.backdrop.clearTint();
    else b.backdrop.setTint(theme?.backdrop ?? g.tint(s.group));
    const wet = s.area === 'garden' && s.skin ? skinArtId(s.skin, 'soil_wet') : PLOT_ART.wet;
    b.beds.forEach((bed, i) => {
      const id = s.area === 'garden' && i % 5 === 2 ? wet : bedId;
      if (this.want(id)) bed.setTexture(id);
    });
    const key = `${s.area}|${s.group}|${s.rank}|${s.skin}|${s.sprites}`;
    if (key !== this.drawnKey) {
      this.drawnKey = key;
      b.scenery.draw(s.group, s.sprites ? s.rank : 1, theme);
      b.look.draw(s.group, s.rank, theme);
    }
    b.scenery.update(time, s.night, s.still);
    b.look.update(time, s.night, s.still);
  }
}
