// The plaza's doors (spec §3.1): one per Area. A door is open when its Area is built and unlocked;
// otherwise it shows why not — the Area is not built yet, or what it still needs. Pure.
import type { AreaInfo } from '../../../core/area-registry/registry';
import type { UnlockGap } from '../../../core/progression/levels';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';

export type PortalStatus = 'open' | 'locked' | 'soon';

export interface PortalView {
  /** The `portalInPlaza` id of the layout placement. */
  portal: string;
  areaId: string;
  name: string;
  status: PortalStatus;
  /** What the Area still needs to open, as readable lines (empty when open). */
  conditions: string[];
}

function conditionLine(gap: UnlockGap, names: ReadonlyMap<string, string>): string {
  if (gap.kind === 'worldDevelopment') {
    return t(vi.plaza.needWorldDevelopment, { need: gap.need, have: gap.have });
  }
  return t(vi.plaza.needAreaLevel, {
    area: names.get(gap.areaId) ?? vi.plaza.unknownArea,
    need: gap.need,
    have: gap.have,
  });
}

/** The doors by portal id. */
export function portalViews(infos: readonly AreaInfo[]): Map<string, PortalView> {
  const names = new Map(infos.map((i) => [i.manifest.id, i.manifest.name.vi]));
  return new Map(
    infos.map((info): [string, PortalView] => [
      info.manifest.portalInPlaza,
      {
        portal: info.manifest.portalInPlaza,
        areaId: info.manifest.id,
        name: info.manifest.name.vi,
        status: info.planned ? 'soon' : info.unlocked ? 'open' : 'locked',
        conditions: info.unlocked ? [] : info.gaps.map((g) => conditionLine(g, names)),
      },
    ]),
  );
}

export interface PortalPrompt {
  /** What the interact key does; null when the door is closed (the key does nothing). */
  action: string | null;
  /** The headline: the action, or why the door is closed. */
  title: string;
  /** Lines under it: the conditions of a closed door. */
  lines: string[];
}

export function portalPrompt(view: PortalView): PortalPrompt {
  if (view.status === 'open') {
    return { action: t(vi.plaza.enter, { name: view.name }), title: t(vi.plaza.enter, { name: view.name }), lines: [] };
  }
  const lines = view.conditions.length > 0 ? [vi.plaza.conditions, ...view.conditions] : [];
  const title = view.status === 'soon' ? `${view.name} — ${vi.plaza.soon}` : t(vi.plaza.locked, { name: view.name });
  return { action: null, title, lines };
}
