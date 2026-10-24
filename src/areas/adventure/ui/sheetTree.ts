// The class skill tree drawn as a graph (adventure-big-update-1 §16): rows of round nodes by tier, curved lines to what each one
// needs (gold once met), level pips, the state of each node (locked, can open, open, at the top, carried) and the picked node's card.
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { el } from '../../../ui/dom';
import { NODES } from '../logic/config/content';
import type { NodeVm, SheetVm } from './fighterVm';
import { skillIcon } from './viewKit';

/** Where each node of a class tree stands: its row (tier) and its place across the row (0–1), the core between its branches. */
export function treeLayout(nodes: readonly { id: string; tier: number; branch: 'core' | 'left' | 'right' }[]): Map<string, { row: number; x: number }> {
  const side = (b: string) => (b === 'left' ? -1 : b === 'right' ? 1 : 0);
  const children = (id: string) => nodes.filter((n) => NODES[n.id]?.requires.some((r) => r.node === id));
  const score = new Map<string, number>();
  for (const n of nodes) {
    const kids = children(n.id);
    score.set(n.id, side(n.branch) + (kids.length > 0 ? (kids.reduce((s, k) => s + side(k.branch), 0) / kids.length) * 0.5 : 0));
  }
  const tiers = [...new Set(nodes.map((n) => n.tier))].sort((a, b) => a - b);
  const out = new Map<string, { row: number; x: number }>();
  tiers.forEach((tier, row) => {
    const inRow = nodes.filter((n) => n.tier === tier).sort((a, b) => (score.get(a.id) ?? 0) - (score.get(b.id) ?? 0));
    inRow.forEach((n, i) => out.set(n.id, { row, x: (i + 0.5) / inRow.length }));
  });
  return out;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

/** The class tree as a graph: rows of round nodes (tier 1 on top), lines to what each one needs, the picked node's card below. */
export function treeGraph(v: SheetVm, picked: string | null, onPick: (nodeId: string) => void, card: (n: NodeVm) => HTMLElement, scroll: HTMLElement | null): HTMLElement {
  const at = treeLayout(v.nodes);
  const rows = Math.max(1, ...[...at.values()].map((p) => p.row + 1));
  const ROW = 104;
  const height = rows * ROW;
  const lines = svgEl('svg', { class: 'adventure-tree__lines', viewBox: '0 0 100 ' + height, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  for (const n of v.nodes) {
    const to = at.get(n.id)!;
    for (const r of NODES[n.id]?.requires ?? []) {
      const from = at.get(r.node);
      if (!from) continue;
      const met = (v.nodes.find((x) => x.id === r.node)?.level ?? 0) >= r.level;
      const y1 = from.row * ROW + ROW / 2 + 30;
      const y2 = to.row * ROW + ROW / 2 - 30;
      const mid = (y1 + y2) / 2;
      lines.append(
        svgEl('path', {
          d: ['M', from.x * 100, y1, 'C', from.x * 100, mid, to.x * 100, mid, to.x * 100, y2].join(' '),
          class: 'adventure-tree__line' + (met ? ' is-met' : '') + (n.level > 0 ? ' is-open' : ''),
          'vector-effect': 'non-scaling-stroke',
        }),
      );
    }
  }
  const state = (n: NodeVm) => (n.level > 0 ? (n.step === null ? 'maxed' : 'open') : n.step?.reason ? 'locked' : 'ready');
  const pick = picked && v.nodes.some((n) => n.id === picked) ? picked : (v.nodes.find((n) => state(n) === 'ready')?.id ?? v.nodes[0]?.id ?? null);
  const dots = v.nodes.map((n) => {
    const p = at.get(n.id)!;
    return el(
      'button',
      {
        class: `adventure-tree__dot is-${state(n)}${n.carried ? ' is-carried' : ''}${n.id === pick ? ' is-picked' : ''}`,
        attrs: { type: 'button', style: `left:${p.x * 100}%;top:${p.row * ROW + ROW / 2}px`, title: n.skill.name, 'aria-pressed': String(n.id === pick) },
        on: { click: () => onPick(n.id) },
      },
      skillIcon(n.skill.id, n.skill.element, n.skill.name),
      el('span', { class: 'adventure-tree__pips', attrs: { 'aria-hidden': 'true' } }, ...Array.from({ length: n.skill.maxLevel }, (_, i) => el('i', { class: i < n.level ? 'is-on' : '' }))),
      el('small', { class: 'adventure-tree__dot-name', text: n.skill.name }),
    );
  });
  const n = v.nodes.find((x) => x.id === pick);
  return el(
    'div',
    { class: 'adventure-tree' },
    el('div', { class: 'adventure-tree__head' }, el('b', { class: 'adventure-tree__sp', text: t(vi.adventure.sheet.treeSp, { sp: v.sp }) }), el('small', { text: v.loadoutTitle })),
    el('small', { class: 'adventure-ui__note', text: vi.adventure.sheet.treeHint }),
    scroll,
    el('div', { class: 'adventure-tree__graph', attrs: { style: `height:${height}px` } }, lines, ...dots),
    n ? card(n) : el('p', { class: 'adventure-ui__note', text: vi.adventure.sheet.treePick }),
  );
}
