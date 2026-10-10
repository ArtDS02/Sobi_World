// The body of each popup (DECISIONS R05C-1): what the shell shows for a panel id. The shell (app.ts) owns the state
// and the handlers; this only picks the screen and hands it what it needs.
import type { AssetRegistry } from '../../../core/assets/registry';
import { renderMarketScreen } from '../../../ui/goals/marketScreen';
import { renderCodexPanel, renderGoalsPanel, renderOrdersPanel, type OrdersTab, type WorldPanelDeps } from '../../../ui/goals/panels';
import { localOffsetMs } from '../../../ui/localDay';
import type { PanelId } from '../../../ui/components/popup';
import type { FarmGame } from '../logic/types';
import type { AppOptions } from './appTypes';
import { openOrderDialog, type Act } from './dialogs';
import type { InventoryHandlers } from './screens/inventoryScreen';
import { renderInventoryScreen } from './screens/inventoryScreen';
import { renderHistoryScreen } from './screens/historyScreen';
import { renderMenuScreen } from './screens/menuScreen';
import { renderOrdersScreen } from './screens/ordersScreen';
import { renderPigPopup, renderWellPopup } from './screens/farmScreen';
import { renderSettingsScreen } from './screens/settingsScreen';
import { renderShopScreen, type ShopHandlers, type ShopTab } from './screens/shopScreen';
import type { createSession } from './session';
import type { settingsHandlers } from './settingsHandlers';

export interface PanelCtx {
  now: () => number;
  assets: AssetRegistry | null;
  opts: AppOptions;
  ui: { selectedPigId: string | null; shopTab: ShopTab; ordersTab: OrdersTab };
  pig: Parameters<typeof renderPigPopup>[3] & { act: (run: Parameters<Act>[0]) => void };
  shop: ShopHandlers;
  inventory: InventoryHandlers;
  session: ReturnType<typeof createSession>;
  settings: ReturnType<typeof settingsHandlers>;
  dialogs: HTMLElement;
  act: Act;
  go: (id: PanelId | null) => void;
  rerender: () => void;
}

/** What the world's own popups need (null in DOM tests of the farm alone). */
function worldDeps(c: PanelCtx): WorldPanelDeps | null {
  const { world } = c.opts;
  const save = world?.save();
  return world && save ? { world: save, goals: world.goals, codexKinds: world.codexKinds(), assets: c.assets, now: c.now(), act: (run) => world.act(run) } : null;
}

/** Body of the popup, or null when it cannot show (the pig was sold…). */
export function renderPanel(c: PanelCtx, save: FarmGame, panel: PanelId): HTMLElement | null {
  const now = c.now();
  const world = worldDeps(c);
  switch (panel) {
    case 'pig': {
      const pig = save.pigs.find((p) => p.id === c.ui.selectedPigId);
      return pig ? renderPigPopup(save, pig, now, c.pig) : null;
    }
    case 'well':
      return renderWellPopup(save, now, c.pig.act);
    case 'shop':
      return renderShopScreen(save, now, c.ui.shopTab, c.shop, c.assets);
    case 'inventory':
      return renderInventoryScreen(save, c.inventory, c.assets ?? undefined, now);
    case 'history':
      return renderHistoryScreen(save);
    case 'orders': {
      const farmOrders = renderOrdersScreen(save, now, { deliver: (card) => openOrderDialog(c.dialogs, card, c.act) });
      return world ? renderOrdersPanel(world, c.ui.ordersTab, (tab) => { c.ui.ordersTab = tab; c.rerender(); }, farmOrders) : farmOrders;
    }
    case 'settings':
      return renderSettingsScreen(save, c.session.settingsVm(save), c.settings, c.opts.keySettings, c.opts.characterChoice);
    case 'market':
      return renderMarketScreen(now, localOffsetMs(now));
    case 'menu':
      return renderMenuScreen(c.go);
    case 'collection':
      return world ? renderCodexPanel(world) : null;
    case 'achievements':
      return world ? renderGoalsPanel(world) : null;
  }
}
