// "Trong lúc bạn vắng mặt" modal (spec §5, §9.5): the trough line first, then what happened and what
// needs care, each with a button to the place when there is one.
import type { AwayVm } from '../awayVm';
import type { FarmGoto } from '../../logic/summary';
import { el } from '../../../../ui/dom';
import { vi } from '../../../../i18n/vi';
import { openDialog } from '../../../../ui/components/dialog';

export function openAwayDialog(host: HTMLElement, vm: AwayVm, go: (goto: FarmGoto) => void) {
  const d = openDialog(host, vm.title, vi.away.ok);
  const button = (label: string, goto: FarmGoto) =>
    el('button', {
      class: 'c-button c-button--ghost c-away__go',
      text: label,
      attrs: { type: 'button' },
      on: {
        click: () => {
          d.close();
          go(goto);
        },
      },
    });
  d.body.append(
    el('p', { class: 'c-dialog__info', text: vm.duration }),
    el(
      'p',
      { class: `c-away__trough${vm.troughRanOut ? ' is-alert' : ''}` },
      vm.trough,
      vm.troughAction ? button(vm.troughAction.label, vm.troughAction.goto) : '',
    ),
    el(
      'ul',
      { class: 'c-away__list' },
      ...vm.lines.map((line) =>
        el(
          'li',
          { class: `c-away__line is-${line.tone}` },
          line.text,
          line.action ? button(line.action.label, line.action.goto) : '',
        ),
      ),
    ),
  );
  return d;
}
