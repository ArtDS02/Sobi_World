// A button that, when disabled, always shows why (spec §10.2).
import type { ActionVm } from '../actionsVm';
import { el } from '../dom';

export function actionButton(vm: ActionVm, onClick: () => void, variant = ''): HTMLElement {
  const disabled = vm.reason !== null;
  const button = el('button', {
    class: `c-button ${variant}`.trim(),
    text: vm.label,
    attrs: { type: 'button', ...(disabled ? { disabled: '', 'aria-disabled': 'true' } : {}) },
    on: { click: () => !disabled && onClick() },
  });
  return el(
    'span',
    { class: 'c-action' },
    button,
    disabled ? el('span', { class: 'c-action__reason', text: vm.reason ?? '' }) : null,
  );
}
