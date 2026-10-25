// The stroke an element's blow leaves where it lands (decision 042, battle_fx.json `strike`): crossed slashes, a bolt from the sky, a
// column of light, a swirl pulling in, vines growing up. Drawn each frame on the battle's additive stroke layer (fxPlayer.ts).
import * as Phaser from 'phaser';
import type { BattleLook } from '../../../../../content/schemas/adventure/battleFx';
import { AIR_DEPTH } from './fxBursts';
import type { FxAnchor, Timed } from './fxPlayer';
import { PILLAR_KEY } from './fxTextures';

/** Adds an effect that lives `dur` ms. */
export type AddTimed = (dur: number, step: Timed['step'], done?: () => void) => void;

export function playStroke(scene: Phaser.Scene, add: AddTimed, look: BattleLook, a: FxAnchor, strong: boolean) {
  const { chest, feet } = a;
  const dir = a.side === 'ally' ? -1 : 1;
  switch (look.strike) {
    case 'slash':
      for (let i = 0; i < (strong ? 3 : 2); i += 1) {
        const tilt = (i % 2 === 0 ? -1 : 1) * (0.5 + i * 0.25);
        add(260 + i * 40, (t, g) => {
          const r = a.width * 0.6;
          g.lineStyle(10 * (1 - t) + 2, 0xffffff, 1 - t);
          g.beginPath();
          g.arc(chest.x, chest.y, r, tilt - 1.1 * Math.min(1, t * 3), tilt + 1.1 * Math.min(1, t * 3));
          g.strokePath();
          g.lineStyle(18 * (1 - t), look.glow, 0.4 * (1 - t));
          g.strokePath();
        });
      }
      return;
    case 'bolt': {
      for (let n = 0; n < (strong ? 2 : 1); n += 1) {
        const top = { x: chest.x + Phaser.Math.Between(-60, 60) * (n + 1), y: chest.y - 700 };
        const pts = [top];
        for (let i = 1; i < 9; i += 1) pts.push({ x: Phaser.Math.Linear(top.x, chest.x, i / 9) + Phaser.Math.Between(-26, 26), y: Phaser.Math.Linear(top.y, chest.y, i / 9) });
        pts.push(chest);
        add(320, (t, g) => {
          const on = Math.sin(t * 40) > -0.3 ? 1 - t : 0.2 * (1 - t);
          for (const [w, c, al] of [[16, look.glow, 0.35], [5, 0xffffff, 1]] as const) {
            g.lineStyle(w, c, al * on);
            g.strokePoints(pts);
          }
        });
      }
      return;
    }
    case 'beam': {
      const w = a.width * (strong ? 0.95 : 0.7);
      const p = scene.add.image(feet.x, feet.y + 6, PILLAR_KEY).setOrigin(0.5, 1).setDepth(AIR_DEPTH).setBlendMode(Phaser.BlendModes.ADD).setTint(look.glow);
      p.setDisplaySize(w, 900);
      add(550, (t) => p.setAlpha(Math.sin(Math.PI * t)).setDisplaySize(w * (1 - 0.5 * t), 900), () => p.destroy());
      return;
    }
    case 'swirl':
      add(520, (t, g) => {
        g.lineStyle(4, look.glow, 1 - t);
        g.beginPath();
        for (let i = 0; i <= 40; i += 1) {
          const s = i / 40;
          const ang = s * Math.PI * 4 + t * 8 * dir;
          const r = a.width * 0.75 * (1 - s) * (1 - t * 0.6);
          const x = chest.x + Math.cos(ang) * r;
          const y = chest.y + Math.sin(ang) * r * 0.6;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
      });
      return;
    case 'vines':
      for (let i = 0; i < 4; i += 1) {
        const off = (i - 1.5) * a.width * 0.18;
        add(640, (t, g) => {
          const grow = Math.min(1, t * 2.2);
          g.lineStyle(6, look.color, t < 0.7 ? 1 : (1 - t) / 0.3);
          g.beginPath();
          for (let s = 0; s <= 12; s += 1) {
            const k = (s / 12) * grow;
            const x = feet.x + off + Math.sin(k * 6 + i) * 12;
            const y = feet.y - k * a.height * 0.8;
            if (s === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.strokePath();
        });
      }
      return;
    case 'none':
      return;
  }
}
