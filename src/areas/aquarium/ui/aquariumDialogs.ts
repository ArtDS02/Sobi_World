// The Aquarium's dialogs (a fish, the sale, the rod, the bag of fish, the tank, breeding): each body is rebuilt from the
// world while the dialog is open, so its numbers (time left, what the bag holds) stay true without being closed and
// reopened. The pieces live in fishDialogs.ts, fishingDialog.ts and tankDialogs.ts; this file composes them.
import { createDialogKit, type AquariumDialogsDeps } from './dialogKit';
import { fishDialogs } from './fishDialogs';
import { openFishing } from './fishingDialog';
import { tankDialogs } from './tankDialogs';

export { actionButton, type AquariumDialogsDeps } from './dialogKit';

export function createAquariumDialogs(d: AquariumDialogsDeps) {
  const { kit, follow, close, isOpen } = createDialogKit(d);
  return {
    ...fishDialogs(kit),
    ...tankDialogs(kit),
    openFishing: () => openFishing(kit),
    follow,
    close,
    isOpen,
  };
}

export type AquariumDialogs = ReturnType<typeof createAquariumDialogs>;
