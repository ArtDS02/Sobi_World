// Tutorial coach card over the farm (spec §10.3): never blocks the canvas, always skippable.
import { vi } from '../../i18n/vi';
import { el } from '../dom';
import type { TutorialVm } from '../tutorialVm';
import { actionButton } from './actionButton';

export function renderTutorialCard(
  vm: TutorialVm,
  on: { next: () => void; skip: () => void },
): HTMLElement {
  return el(
    'section',
    { class: 'c-coach', attrs: { 'aria-label': vm.title, 'aria-live': 'polite' } },
    el('p', { class: 'c-coach__progress', text: vm.progress }),
    el('p', { class: 'c-coach__text', text: vm.text }),
    el(
      'div',
      { class: 'c-coach__actions' },
      el('button', {
        class: 'c-button c-button--ghost',
        text: vi.action.skip,
        attrs: { type: 'button' },
        on: { click: on.skip },
      }),
      actionButton(vm.next, on.next),
    ),
  );
}
