// The rod's water scene (decision 035, drawn by fishingDialog.ts): the sky and the far isle, the pier with the rod, the
// three bands of water (near shore / mid-lake / far out), and — once thrown — the line, the bobber and the fish's shadow.
// Aiming, the bands are the power bar: a marker swings along them and a ring shows where the throw would land.
import { el } from '../../../ui/dom';
import { vi } from '../../../i18n/vi';
import type { CastDepth } from '../logic/fishing';
import { ROD, type ShadowSize } from './fishingGame';

/** Where on the water (percent of the scene's width) a throw of `power` lands: from the pier's end out to the horizon. */
export const waterX = (power: number) => 27 + power * 66;
/** The rod (its butt on the pier, its tip over the water) and the waterline, in scene percent. */
const ROD_BUTT = { x: 9, y: 44 };
const TIP = { x: 23, y: 12 };
const WATERLINE = 46;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** The line from the rod's tip to the bobber: slack while waiting, taut and under water on a bite or in the fight. */
export const linePath = (x: number, taut: boolean) =>
  taut ? `M${TIP.x} ${TIP.y} L${x} ${WATERLINE + 10}` : `M${TIP.x} ${TIP.y} Q${(TIP.x + x) / 2} ${WATERLINE + 4} ${x} ${WATERLINE - 3}`;

export type SceneBeat =
  | { kind: 'idle' }
  | { kind: 'aim' }
  | { kind: 'wait' | 'fight'; depth: CastDepth; power: number; size: ShadowSize };

/** The live parts the dialog's frame loop moves. */
export interface SceneParts {
  scene: HTMLElement;
  power?: HTMLElement;
  target?: HTMLElement;
  bobber?: HTMLElement;
  line?: SVGPathElement;
}

/** `onTap` (aim and wait only): a tap on the water throws or pulls too; the big button stays the obvious way. */
export function rodScene(beat: SceneBeat, onTap: () => void): SceneParts {
  const parts: Partial<SceneParts> = {};
  const cast = beat.kind === 'wait' || beat.kind === 'fight' ? beat : null;
  const edges = [0, ROD.depthAt[0], ROD.depthAt[1], 1];
  const zones = el(
    'div',
    { class: `aquarium-rod__zones${beat.kind === 'aim' ? ' is-aim' : ''}`, attrs: { 'aria-hidden': 'true' } },
    ...vi.aquarium.fishing.depth.map((name, i) =>
      el('span', {
        class: `is-${i}${cast?.depth === i ? ' is-on' : ''}`,
        attrs: { style: `left:${waterX(edges[i]!)}%;width:${waterX(edges[i + 1]!) - waterX(edges[i]!)}%` },
        text: name,
      }),
    ),
    beat.kind === 'aim' ? (parts.power = el('span', { class: 'aquarium-rod__marker' })) : null,
  );
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'aquarium-rod__line');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const rod = document.createElementNS(SVG_NS, 'path');
  rod.setAttribute('class', 'is-rod');
  rod.setAttribute('d', `M${ROD_BUTT.x} ${ROD_BUTT.y} L${TIP.x} ${TIP.y}`);
  svg.append(rod);
  let extra: HTMLElement[] = [];
  if (beat.kind === 'aim') {
    parts.target = el('span', { class: 'aquarium-rod__target', attrs: { 'aria-hidden': 'true' } });
    extra = [parts.target];
  } else if (cast) {
    const line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', linePath(waterX(cast.power), cast.kind === 'fight'));
    svg.append(line);
    parts.line = line;
    const at = { 'aria-hidden': 'true', style: `left:${waterX(cast.power)}%` };
    parts.bobber = el('span', { class: `aquarium-rod__bobber${cast.kind === 'fight' ? ' is-bite' : ''}`, attrs: at }, el('b', { text: '!' }));
    extra = [
      el('span', { class: `aquarium-rod__shadow is-${cast.size}`, attrs: at }),
      el('span', { class: 'aquarium-rod__ripple', attrs: at }),
      el('span', { class: 'aquarium-rod__splash', attrs: at }),
      parts.bobber,
    ];
  }
  const live = beat.kind === 'aim' || beat.kind === 'wait';
  const scene = el(
    'div',
    {
      class: `aquarium-rod__scene${cast ? ` is-depth-${cast.depth}` : ''}${beat.kind === 'fight' ? ' is-bite' : ''}${live ? ' is-live' : ''}`,
      on: live ? { click: onTap } : {},
    },
    el('span', { class: 'aquarium-rod__isle', attrs: { 'aria-hidden': 'true' } }),
    zones,
    el('span', { class: 'aquarium-rod__pier', attrs: { 'aria-hidden': 'true' } }),
    svg,
    ...extra,
  );
  return { ...parts, scene };
}

/** Throw → wait → reel: which beat the player is in (`at` 0..2, -1 for none). */
export const rodSteps = (at: number) =>
  el('ol', { class: 'aquarium-rod__steps' }, ...vi.aquarium.fishing.steps.map((name, i) => el('li', { class: i === at ? 'is-on' : i < at ? 'is-done' : '', text: name })));

/** A small pill: the depth, the shadow's size. */
export const rodTag = (text: string, tone = '') => el('span', { class: `aquarium-rod__tag ${tone}`.trim(), text });
