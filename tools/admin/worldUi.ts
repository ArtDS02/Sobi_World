// Shared building blocks of the World pages (design reference: "Xưởng animation trận"). Plain HTML strings like the rest of the
// admin; styles in worldUi.css under `.wpage`. No business logic here: pages pass their own text, options and handlers.
import { esc } from './labels';
import { optionHtml, type Visual } from './richSelect';
import type { Facet } from './worldFilters';

/** Page header: a short description of what the screen does and its main actions (the title is in the dashboard's header). */
export const pageIntro = (description: string, actions = ''): string =>
  `<section class="wintro"><p>${description}</p>${actions ? `<div class="wintro__acts">${actions}</div>` : ''}</section>`;

/** A titled panel (a configuration or detail group). `fold` makes it collapsible. */
export function panel(title: string, body: string, o: { icon?: string; note?: string; fold?: boolean; open?: boolean; className?: string } = {}): string {
  const head = `<span class="wpanel__title">${o.icon ? `<span aria-hidden="true">${o.icon}</span> ` : ''}${esc(title)}</span>${o.note ? `<span class="wpanel__note">${o.note}</span>` : ''}`;
  if (o.fold) return `<details class="wpanel ${o.className ?? ''}"${o.open === false ? '' : ' open'}><summary class="wpanel__head">${head}</summary><div class="wpanel__body">${body}</div></details>`;
  return `<section class="wpanel ${o.className ?? ''}"><header class="wpanel__head">${head}</header><div class="wpanel__body">${body}</div></section>`;
}

/** Filter bar: search + filters + actions on a wrapping grid, with a live "N / M" result line. */
export const filterBar = (controls: string, result: string): string =>
  `<div class="wfilters"><div class="wfilters__row">${controls}</div><p class="wfilters__result" role="status">${result}</p></div>`;

/** A labelled control cell of a filter bar. `set` highlights a filter that is narrowing the list. */
export const filterCell = (label: string, control: string, set = false): string =>
  `<label class="wf${set ? ' is-set' : ''}"><span class="wf__label">${esc(label)}</span>${control}</label>`;

export const searchBox = (value: string, placeholder: string): string =>
  `<input class="wf__search" type="search" placeholder="${esc(placeholder)}" value="${esc(value)}" data-q aria-label="${esc(placeholder)}" />`;

/** A filter dropdown built from the facets of the data present: "all" first, each value with its count. */
export function facetSelect(attr: string, allLabel: string, facets: readonly Facet[], selected: string, visual: (value: string) => Visual = () => ({}), unit = ''): string {
  const total = facets.reduce((n, f) => n + f.count, 0);
  const all = optionHtml('', allLabel, !selected, { icon: '🗂️', sub: `${total}${unit}` });
  const rows = facets.map((f) => optionHtml(f.value, f.label, f.value === selected, { ...visual(f.value), sub: `${f.count}${unit}` })).join('');
  return `<select ${attr} data-rich>${all}${rows}</select>`;
}

export const emptyState = (icon: string, text: string, action = ''): string =>
  `<div class="wempty"><span class="wempty__icon" aria-hidden="true">${icon}</span><p>${text}</p>${action}</div>`;

export const loadingState = (text: string): string => `<div class="wempty"><span class="wempty__icon" aria-hidden="true">⏳</span><p>${esc(text)}</p></div>`;

export const errorState = (text: string): string => `<div class="wempty wempty--error"><span class="wempty__icon" aria-hidden="true">⚠️</span><p>${text}</p></div>`;

export type Tone = 'ok' | 'warn' | 'error' | 'info' | 'off';
export const statusBadge = (tone: Tone, text: string): string => `<span class="wbadge wbadge--${tone}">${text}</span>`;
