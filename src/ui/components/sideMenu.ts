// The right-hand menu every Area shares (decision 057, B1): one small circle at the right edge; pressing it drops the
// menu down (expand, upgrade, forge, shop, bag — what the Area gives), pressing it again, pressing outside or Escape
// folds it back. Each entry says why it is off. It lives in its own host so the HUD redrawing every second never replays the drop
// or steals the focus. The drop animation is CSS only and is switched off by "Giảm chuyển động".
import { vi } from '../../i18n/vi';
import type { SideMenuItem, SideMenuPos } from '../world/sideMenuVm';
import { el, patch } from '../dom';
import { art } from './icon';

export interface SideMenu {
  /** Draws the menu (null / no entries = nothing is shown). */
  render(items: readonly SideMenuItem[] | null, pos?: SideMenuPos): void;
  isOpen(): boolean;
  close(): void;
  dispose(): void;
}

let seq = 0;

export function createSideMenu(host: HTMLElement): SideMenu {
  const panelId = `sidemenu-${(seq += 1)}`;
  let open = false;
  /** True for the one draw right after opening: only that draw plays the drop. */
  let fresh = false;
  let items: readonly SideMenuItem[] | null = null;
  let pos: SideMenuPos | undefined;
  host.classList.add('c-sidemenu-host');

  const onOutside = (e: Event) => {
    if (open && !(e.target instanceof Node && host.contains(e.target))) set(false);
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open || e.key !== 'Escape') return;
    e.stopPropagation();
    set(false);
    host.querySelector<HTMLElement>('.c-sidemenu__toggle')?.focus();
  };
  function listen(on: boolean) {
    const f = on ? 'addEventListener' : 'removeEventListener';
    document[f]('pointerdown', onOutside, true);
    document[f]('keydown', onKey as EventListener, true);
  }

  function set(next: boolean) {
    if (open === next) return;
    open = next;
    fresh = next;
    listen(next);
    draw();
  }

  function entry(i: SideMenuItem): HTMLElement {
    const off = i.reason !== null;
    return el(
      'button',
      {
        class: `c-sidemenu__item${off ? ' is-off' : ''}`,
        data: { item: i.id },
        attrs: { type: 'button', title: off ? `${i.label} — ${i.reason ?? ''}` : i.label, ...(off ? { 'aria-disabled': 'true' } : {}) },
        on: {
          click: () => {
            if (off) return;
            set(false);
            i.onClick();
          },
        },
      },
      el('span', { class: 'c-sidemenu__icon' }, art(i.icon, 'c-icon')),
      el('span', { class: 'c-sidemenu__text' }, el('b', { text: i.label }), off ? el('small', { text: i.reason ?? '' }) : null),
    );
  }

  function draw() {
    if (!items || items.length === 0) {
      if (open) {
        open = false;
        listen(false);
      }
      return patch(host, null);
    }
    // The focus survives a redraw: the same entry (or the circle) is focused again.
    const focused = document.activeElement instanceof HTMLElement && host.contains(document.activeElement) ? document.activeElement : null;
    const key = focused ? (focused.dataset.item ?? 'toggle') : null;
    const s = vi.sideMenu;
    const node = el(
      'div',
      { class: `c-sidemenu${open ? ' is-open' : ''}`, attrs: { style: `--side-top: ${pos?.top ?? 23}%` } },
      el(
        'button',
        {
          class: 'c-sidemenu__toggle',
          attrs: { type: 'button', 'aria-expanded': String(open), 'aria-controls': panelId, 'aria-label': open ? s.close : s.open, title: open ? s.close : s.open },
          on: { click: () => set(!open) },
        },
        el('span', { class: 'c-sidemenu__dots', attrs: { 'aria-hidden': 'true' } }, el('i'), el('i'), el('i')),
      ),
      open ? el('div', { class: `c-sidemenu__panel${fresh ? ' is-fresh' : ''}`, attrs: { id: panelId, role: 'group', 'aria-label': s.title } }, ...items.map(entry)) : null,
    );
    fresh = false;
    patch(host, node);
    if (key) host.querySelector<HTMLElement>(key === 'toggle' ? '.c-sidemenu__toggle' : `[data-item="${key}"]`)?.focus();
  }

  return {
    render(next, at) {
      items = next;
      pos = at;
      draw();
    },
    isOpen: () => open,
    close: () => set(false),
    dispose() {
      listen(false);
      patch(host, null);
    },
  };
}
