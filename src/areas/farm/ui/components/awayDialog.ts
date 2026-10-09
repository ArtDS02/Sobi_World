// "Trong lúc bạn vắng mặt" modal (spec §9.5): the trough line first, then the rest.
import type { AwayVm } from '../awayVm';
import { el } from '../../../../ui/dom';
import { vi } from '../../../../i18n/vi';
import { openDialog } from '../../../../ui/components/dialog';

export function openAwayDialog(host: HTMLElement, vm: AwayVm) {
  const d = openDialog(host, vm.title, vi.away.ok);
  d.body.append(
    el('p', { class: 'c-dialog__info', text: vm.duration }),
    el('p', {
      class: `c-away__trough${vm.troughRanOut ? ' is-alert' : ''}`,
      text: vm.trough,
    }),
    el('ul', { class: 'c-away__list' }, ...vm.lines.map((line) => el('li', { text: line }))),
  );
  return d;
}
