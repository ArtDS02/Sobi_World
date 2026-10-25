// Where the battle stage draws each fighter (decision 042): the DOM lays the field out (spots, nameplates, target markers) and keeps an
// empty box for each body; the stage draws the fighter in that box. The boxes are measured only when the battle was redrawn, the
// window resized or a second has passed, never every frame.
import type { StageUnit } from '../scene/battle/battleUnits';

export interface StageCache {
  drawn: number;
  size: string;
  at: number;
  units: readonly StageUnit[];
}

/** The fighters on the field under `root` (page px), from the cache while nothing changed. */
export function measureStage(root: HTMLElement, cache: StageCache, drawn: number, host: HTMLElement): readonly StageUnit[] {
  const now = performance.now();
  const size = `${host.clientWidth}x${host.clientHeight}`;
  if (cache.drawn === drawn && cache.size === size && now - cache.at < 1000) return cache.units;
  const units: StageUnit[] = [];
  for (const unit of root.querySelectorAll<HTMLElement>('.adventure-ui__battle [data-unit]')) {
    const body = unit.querySelector<HTMLElement>('[data-body]');
    if (!body) continue;
    const r = body.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    units.push({
      id: unit.dataset.unit!,
      side: unit.dataset.side === 'enemy' ? 'enemy' : 'ally',
      art: unit.dataset.art ?? '',
      mirrored: unit.classList.contains('is-mirrored'),
      feet: { x: r.left + r.width / 2, y: r.bottom },
      width: r.width,
      height: r.height,
      down: unit.classList.contains('is-down'),
      aimable: unit.classList.contains('is-aimable'),
    });
  }
  cache.drawn = drawn;
  cache.size = size;
  cache.at = now;
  cache.units = units;
  return units;
}
