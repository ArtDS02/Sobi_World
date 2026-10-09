// Keys of the app shell (spec §4): I = bag, C = Codex, the menu key = settings (and closes whatever is
// open); Esc always closes an open popup. The keys are the player's own (core/settings), read at press time.
import type { PanelId } from '../../../ui/components/popup';
import type { ControlInput } from '../../../ui/world/controlInput';

export interface HotkeyDeps {
  input: ControlInput | undefined;
  /** The popup now open. */
  panel: () => PanelId | null;
  /** A dialog sits on top: it handles its own keys. */
  dialogOpen: () => boolean;
  go: (panel: PanelId | null) => void;
}

/** Returns the way to stop listening. */
export function bindHotkeys(d: HotkeyDeps): () => void {
  // Esc closes the popup unless a dialog sits on top. When Esc is also the menu key, the menu handler
  // does the closing, so one press never closes and reopens.
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !d.panel() || d.dialogOpen()) return;
    if (d.input?.controlOf(e.code) === 'menu') return;
    d.go(null);
  };
  document.addEventListener('keydown', onKey);
  const toggle = (panel: PanelId) => () => {
    if (!d.dialogOpen()) d.go(d.panel() === panel ? null : panel);
  };
  const offs = [
    d.input?.onPress('inventory', toggle('inventory')),
    d.input?.onPress('codex', toggle('collection')),
    d.input?.onPress('menu', () => {
      if (!d.dialogOpen()) d.go(d.panel() ? null : 'settings');
    }),
  ];
  return () => {
    document.removeEventListener('keydown', onKey);
    for (const off of offs) off?.();
  };
}
