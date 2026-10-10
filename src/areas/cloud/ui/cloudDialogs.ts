// The Cloud's dialogs (plot, spring, cauldron, more plots): each body is rebuilt from the world while the dialog is open,
// so its numbers (time left, what the bag holds) stay true without being closed and reopened.
import { openDialog } from '../../../ui/components/dialog';
import { el, patch } from '../../../ui/dom';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { buildCauldron, buyPlots, collectBrew, collectWater, startBrew, upgradeSpring } from '../logic/actions/buildings';
import { fertilizePlots, harvestFlowers, waterPlots } from '../logic/actions/plants';
import { CB } from '../logic/config/content';
import { nextExpansion } from '../logic/derived';
import { cloudOf } from '../logic/save/lens';
import { cauldronVm, plotCardVm, springVm, type ButtonVm, type CloudRun, type RecipeVm } from './cloudVm';

/** A button that always says why it is off. */
export function actionButton(vm: ButtonVm, onClick: () => void, variant = ''): HTMLElement {
  const off = vm.reason !== null;
  return el(
    'span',
    { class: 'c-action' },
    el('button', {
      class: `c-button ${variant}`.trim(),
      text: vm.label,
      attrs: { type: 'button', ...(off ? { disabled: '', 'aria-disabled': 'true' } : {}) },
      on: { click: () => !off && onClick() },
    }),
    off ? el('span', { class: 'c-action__reason', text: vm.reason ?? '' }) : null,
  );
}

export interface CloudDialogsDeps {
  /** Where dialogs open (one at a time). */
  host: HTMLElement;
  world: () => WorldSave | null;
  now: () => number;
  dayOffsetMs: () => number;
  dispatch: (run: CloudRun) => void;
  /** Re-draws the whole UI (a choice inside a dialog changed). */
  refresh: () => void;
}

export function createCloudDialogs(d: CloudDialogsDeps) {
  /** The open dialog's body renderer; re-run on every world change. */
  let live: { body: HTMLElement; render: (w: WorldSave) => HTMLElement | null } | null = null;

  function openLive(title: string, render: (w: WorldSave, close: () => void) => HTMLElement | null) {
    const w = d.world();
    if (!w) return;
    const handle = openDialog(d.host, title, vi.cloud.close);
    const draw = (now: WorldSave) => render(now, handle.close);
    live = { body: handle.body, render: draw };
    patch(handle.body, draw(w));
  }

  const run = (action: CloudRun) => d.dispatch(action);

  function openExpand() {
    openLive(vi.cloud.expandTitle, (w, close) => {
      const next = nextExpansion(cloudOf(w));
      if (!next) return el('p', { text: vi.cloud.expandMax });
      const vm: ButtonVm = { label: t(vi.cloud.buy, { gold: formatInt(next.price) }), reason: w.wallet.coins < next.price ? vi.cloud.noGold : null };
      return el(
        'div',
        { class: 'cloud-dialog' },
        el('p', { text: t(vi.cloud.expandBody, { count: next.plots - cloudOf(w).plots.length, plots: next.plots }) }),
        actionButton(vm, () => {
          run((s, c) => buyPlots(s, c));
          close();
        }),
      );
    });
  }

  function openSpring() {
    openLive(vi.cloud.springTitle, (w) => {
      const vm = springVm(w, d.now());
      return el(
        'div',
        { class: 'cloud-dialog' },
        el('p', { class: 'c-dialog__strong', text: vm.stock }),
        el('p', { text: vm.levelText }),
        el('p', { text: vm.flow }),
        actionButton(vm.collect, () => run((s, c) => collectWater(s, c))),
        vm.next ? actionButton(vm.next, () => run((s, c) => upgradeSpring(s, c))) : el('p', { class: 'c-dialog__hint', text: vi.cloud.springMax }),
      );
    });
  }

  function openPlot(index: number) {
    const only = { plots: [index] };
    openLive(t(vi.cloud.plotTitle, { n: index + 1 }), (w, close) => {
      const card = plotCardVm(w, index, d.now(), d.dayOffsetMs(), {
        water: (s, c) => waterPlots(s, only, c),
        fertilize: (s, c) => fertilizePlots(s, only, c),
        harvest: (s, c) => harvestFlowers(s, only, c),
      });
      if (!card || card.stage === 'empty') return null;
      return el(
        'div',
        { class: 'cloud-dialog' },
        el('p', { class: 'c-dialog__strong', text: `${card.flowerName ?? ''} · ${card.stageText}` }),
        ...card.lines.map((line) => el('p', { text: line })),
        el(
          'div',
          { class: 'cloud-dialog__actions' },
          card.water ? actionButton(card.water, () => run((s, c) => waterPlots(s, only, c))) : null,
          card.fertilize ? actionButton(card.fertilize, () => run((s, c) => fertilizePlots(s, only, c))) : null,
          card.harvest
            ? actionButton(card.harvest, () => {
                run((s, c) => harvestFlowers(s, only, c));
                close();
              })
            : null,
        ),
      );
    });
  }

  function openCauldron() {
    let batches = 1;
    let recipeId: string | null = null;
    const stepper = (label: string, change: number, max: number) =>
      el('button', {
        class: 'c-button c-button--ghost',
        text: label,
        attrs: { type: 'button', 'aria-label': label },
        on: {
          click: () => {
            batches = Math.max(1, Math.min(max, batches + change));
            d.refresh();
          },
        },
      });
    openLive(vi.cloud.cauldron, (w) => {
      const vm = cauldronVm(w, d.now());
      if (!vm.built) {
        return el(
          'div',
          { class: 'cloud-dialog' },
          el('p', { text: vm.priceText }),
          actionButton({ label: t(vi.cloud.build, { gold: formatInt(CB.cauldron.price) }), reason: vm.buildReason }, () => run((s, c) => buildCauldron(s, c))),
        );
      }
      if (vm.job) {
        const job = vm.job;
        const collect: ButtonVm = job.ready > 0 ? { label: t(vi.cloud.collect, { count: job.ready }), reason: null } : { label: t(vi.cloud.collect, { count: 0 }), reason: vi.cloud.noneReady };
        return el(
          'div',
          { class: 'cloud-dialog' },
          el(
            'div',
            { class: 'cloud-dialog__job' },
            el('p', { class: 'c-dialog__strong', text: t(vi.cloud.running, { name: job.name }) }),
            el('p', { text: t(vi.cloud.batchesDone, { done: job.done, total: job.total }) }),
            el('p', { text: job.nextIn === null ? vi.cloud.allDone : t(vi.cloud.nextBatch, { time: job.nextIn }) }),
            el('p', { class: 'c-dialog__hint', text: vi.cloud.busyHint }),
          ),
          actionButton(collect, () => run((s, c) => collectBrew(s, c))),
        );
      }
      const chosen: RecipeVm = vm.recipes.find((r) => r.recipe.id === recipeId) ?? vm.recipes[0]!;
      recipeId = chosen.recipe.id;
      const most = Math.max(1, chosen.maxBatches);
      batches = Math.min(batches, most);
      const start: ButtonVm = chosen.maxBatches < 1 ? { label: vi.cloud.start, reason: vi.cloud.missing } : { label: t(vi.cloud.startBatches, { count: batches }), reason: null };
      return el(
        'div',
        { class: 'cloud-dialog' },
        el(
          'div',
          { class: 'cloud-dialog__recipes', attrs: { role: 'radiogroup', 'aria-label': vi.cloud.recipe } },
          ...vm.recipes.map((r) =>
            el(
              'button',
              {
                class: `cloud-dialog__recipe${r === chosen ? ' is-selected' : ''}`,
                attrs: { type: 'button', role: 'radio', 'aria-checked': String(r === chosen) },
                on: {
                  click: () => {
                    recipeId = r.recipe.id;
                    batches = 1;
                    d.refresh();
                  },
                },
              },
              el('b', { text: r.name }),
              el('small', { text: `${vi.cloud.outputs}: ${r.outputs} · ${r.duration}` }),
            ),
          ),
        ),
        el('p', { class: 'c-dialog__hint', text: vi.cloud.inputs }),
        el('ul', { class: 'cloud-dialog__inputs' }, ...chosen.inputs.map((i) => el('li', { class: i.have >= i.need * batches ? '' : 'is-short', text: `${i.name}: ${i.have}/${i.need * batches}` }))),
        el('div', { class: 'cloud-dialog__stepper' }, el('span', { text: vi.cloud.batches }), stepper('−', -1, most), el('b', { text: String(batches) }), stepper('+', 1, most)),
        actionButton(start, () => run((s, c) => startBrew(s, { recipeId: chosen.recipe.id, batches }, c))),
      );
    });
  }

  return {
    openExpand,
    openSpring,
    openPlot,
    openCauldron,
    /** The world changed: the open dialog follows it (and is forgotten once the player closed it). */
    follow(w: WorldSave) {
      if (!live) return;
      if (d.host.childElementCount === 0) live = null;
      else patch(live.body, live.render(w));
    },
    close() {
      live = null;
      d.host.replaceChildren();
    },
    isOpen: () => d.host.childElementCount > 0,
  };
}

export type CloudDialogs = ReturnType<typeof createCloudDialogs>;
