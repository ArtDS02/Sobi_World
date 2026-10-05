// A button that, when disabled, always shows why (spec §10.2).
import type { ActionVm } from '../actionsVm';
import type { UiIcon } from '../../../../core/config/assetIds';
import { el } from '../../../../ui/dom';
import { icon } from '../../../../ui/components/icon';

export function actionButton(
  vm: Pick<ActionVm, 'label' | 'reason'>,
  onClick: () => void,
  variant = '',
  iconName?: UiIcon,
): HTMLElement {
  const disabled = vm.reason !== null;
  const button = el(
    'button',
    {
      class: `c-button ${variant}`.trim(),
      attrs: { type: 'button', ...(disabled ? { disabled: '', 'aria-disabled': 'true' } : {}) },
      on: { click: () => !disabled && onClick() },
    },
    icon(iconName),
    vm.label,
  );
  return el(
    'span',
    { class: 'c-action' },
    button,
    disabled ? el('span', { class: 'c-action__reason', text: vm.reason ?? '' }) : null,
  );
}
