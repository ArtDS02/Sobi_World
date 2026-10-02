// Seasonal weather over the farm (SE-1): petals in spring, sun motes in summer, leaves in autumn,
// snow in winter — a fixed pool of tiny images drifting through the camera view and wrapping
// around. Shapes are drawn once into textures (no art files). Above the world and pigs, under the
// day / night tint; hidden with reduceMotion (spec §10.4). Visual only.
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../../core/config/farmView';
import { SEASON_VIEW, type SeasonWeather as Weather } from '../../core/config/seasons';
import { hashId } from '../view/pigView';

const TEX = 32;
const texKey = (kind: Weather['kind']) => `season_weather_${kind}`;

interface Flake {
  img: Phaser.GameObjects.Image;
  speed: number;
  phase: number;
  spin: number;
}

/** Stable pseudo-random in [0, 1) per flake (no Math.random in the view either: repeatable). */
const unit = (i: number, salt: string) => (hashId(`weather:${i}:${salt}`) % 10007) / 10007;

function drawShape(scene: Phaser.Scene, kind: Weather['kind']) {
  const key = texKey(kind);
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  const c = TEX / 2;
  if (kind === 'petal') g.fillEllipse(c, c, TEX * 0.9, TEX * 0.55);
  else if (kind === 'leaf') {
    g.fillEllipse(c, c, TEX * 0.95, TEX * 0.5);
    g.fillTriangle(c + TEX * 0.4, c, TEX, c - 3, TEX, c + 3);
  } else g.fillCircle(c, c, TEX * 0.45);
  g.generateTexture(key, TEX, TEX);
  g.destroy();
  return key;
}

export class SeasonWeather {
  private flakes: Flake[] = [];
  private weather: Weather | null = null;
  private hidden = false;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Swap to a season's weather (rebuilds the pool). */
  set(weather: Weather) {
    if (weather === this.weather) return;
    this.weather = weather;
    for (const f of this.flakes) f.img.destroy();
    this.flakes = [];
    const key = drawShape(this.scene, weather.kind);
    const view = this.scene.cameras.main.worldView;
    const depth = FARM_VIEW.OVERLAY_DEPTH - SEASON_VIEW.weatherDepthBelowOverlay;
    for (let i = 0; i < weather.count; i++) {
      const size = weather.size[0] + (weather.size[1] - weather.size[0]) * unit(i, 'size');
      const color = weather.colors[Math.floor(unit(i, 'color') * weather.colors.length)] ?? 0xffffff;
      const img = this.scene.add
        .image(view.x + unit(i, 'x') * view.width, view.y + unit(i, 'y') * view.height, key)
        .setDisplaySize(size, weather.kind === 'snow' || weather.kind === 'mote' ? size : size * 0.7)
        .setTint(color)
        .setAlpha(weather.alpha)
        .setDepth(depth)
        .setAngle(unit(i, 'angle') * 360)
        .setVisible(!this.hidden);
      this.flakes.push({
        img,
        speed: weather.fall[0] + (weather.fall[1] - weather.fall[0]) * unit(i, 'speed'),
        phase: unit(i, 'phase') * Math.PI * 2,
        spin: weather.kind === 'snow' || weather.kind === 'mote' ? 0 : (unit(i, 'spin') - 0.5) * 120,
      });
    }
  }

  /** reduceMotion: no weather at all. */
  setHidden(hidden: boolean) {
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    for (const f of this.flakes) f.img.setVisible(!hidden);
  }

  update(timeMs: number, dtMs: number) {
    if (this.hidden || !this.weather) return;
    const view = this.scene.cameras.main.worldView;
    const dt = dtMs / 1000;
    const sway = this.weather.sway;
    for (const f of this.flakes) {
      const img = f.img;
      img.y += f.speed * dt;
      img.x += Math.cos(timeMs / 1000 + f.phase) * sway * dt;
      img.angle += f.spin * dt;
      const pad = img.displayWidth;
      if (img.y > view.bottom + pad) img.y = view.y - pad;
      else if (img.y < view.y - pad) img.y = view.bottom + pad;
      if (img.x > view.right + pad) img.x = view.x - pad;
      else if (img.x < view.x - pad) img.x = view.right + pad;
    }
  }

  destroy() {
    for (const f of this.flakes) f.img.destroy();
    this.flakes = [];
  }
}
