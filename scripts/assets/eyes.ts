// Eye boxes for species the auto detector of eyelids.ts cannot read (glasses, masks, visors,
// costume eyes, eyes already drawn closed). Pixel boxes on the 512² idle frame, near eye first.
// `wakeIsIdle`: the idle has closed happy / crying eyes, so the wake frame is the idle.
// A species not listed here uses detectEyes(); `extra` adds boxes to what the detector found and
// `drop` removes detected boxes whose top-left lies inside the given box (false positives).
import type { Box, EyeSpec } from './eyelids';

export interface EyeOverride {
  eyes?: readonly EyeSpec[];
  extra?: readonly EyeSpec[];
  drop?: readonly Box[];
  wakeIsIdle?: boolean;
  /** The idle already shows the pig asleep (eyes drawn closed): sleep and wake frames = the idle. */
  closedInIdle?: boolean;
}

const mask = (...box: Box): EyeSpec => ({ box, mode: 'mask' });
const oval = (...box: Box): EyeSpec => ({ box, mode: 'oval' });
const patch = (...box: Box): EyeSpec => ({ box, mode: 'patch' });

export const EYE_OVERRIDES: Record<string, EyeOverride> = {
  pig_pumpkin: { closedInIdle: true },
  pig_crybaby: { closedInIdle: true },
  pig_party: { closedInIdle: true },
  pig_teacher: { eyes: [oval(296, 220, 316, 246), oval(370, 212, 388, 236)] },
  pig_grandpa: { eyes: [oval(303, 221, 317, 237), oval(384, 216, 396, 232)] },
  pig_tet: { eyes: [mask(302, 214, 326, 250), mask(392, 228, 406, 248)] },
  pig_lan: { eyes: [mask(306, 236, 342, 280)] },
  pig_ninja: { eyes: [oval(282, 184, 324, 228), oval(372, 186, 390, 218)] },
  pig_surfer: { eyes: [oval(299, 186, 331, 226), oval(382, 180, 400, 200)] },
  pig_diver: { eyes: [oval(310, 186, 338, 212), oval(382, 182, 400, 202)] },
  pig_mecha: { eyes: [oval(336, 202, 368, 234), oval(420, 204, 434, 232)] },
  pig_cyborg: { eyes: [oval(304, 192, 346, 238), oval(400, 186, 422, 220)] },
  pig_rich: { eyes: [oval(300, 204, 332, 236), oval(364, 188, 384, 210)] },
  pig_battlebot: { eyes: [oval(272, 228, 308, 264), oval(340, 212, 360, 234)] },
  pig_ufo: { eyes: [mask(258, 214, 276, 238), mask(298, 196, 314, 218)] },
  pig_sleepy: { closedInIdle: true },
  pig_tiger: { eyes: [mask(300, 184, 350, 242), oval(395, 179, 413, 215)] },
  pig_angry: { extra: [mask(342, 222, 364, 250)] },
  pig_astronaut: { extra: [mask(336, 162, 354, 186)] },
  pig_oni: { extra: [mask(300, 196, 338, 238)] },
  pig_pegasus: { drop: [[80, 230, 140, 280]], extra: [mask(384, 196, 404, 232)] },
  pig_bee: { drop: [[140, 180, 220, 270]] },
  pig_penguin: { drop: [[380, 160, 420, 200]], extra: [oval(395, 176, 417, 216)] },
  pig_panda: { eyes: [patch(300, 185, 347, 235), patch(395, 172, 417, 210)] },
};
