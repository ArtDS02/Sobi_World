// The Garden's dialogs (plot, workshop, sprinkler, more plots): each body is rebuilt from the world while the dialog
// is open, so its numbers (time left, what the bag holds) stay true without being closed and reopened.
import { openDialog } from '../../../ui/components/dialog';
import { el, patch } from '../../../ui/dom';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { buildWorkshop, buyPlots, collectCraft, startCraft, upgradeSprinkler } from '../logic/actions/buildings';
import { fertilizePlots, harvestPlots, waterPlots } from '../logic/actions/plants';
import { GB, type BuildingId } from '../logic/config/content';
import { nextExpansion } from '../logic/derived';
import { gardenOf } from '../logic/save/lens';
import { plotCardVm, sprinklerVm, workshopVm, type ButtonVm, type GardenRun, type RecipeVm } from './gardenVm';

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

export interface GardenDialogsDeps {
  /** Where dialogs open (one at a time). */
  host: HTMLElement;
  world: () => WorldSave | null;
  now: () => number;
  dispatch: (run: GardenRun) => void;
  /** Re-draws the whole UI (a choice inside a dialog changed). */
  refresh: () => void;
}

export function createGardenDialogs(d: GardenDialogsDeps) {
  /** The open dialog's body renderer; re-run on every world change. */
  let live: { body: HTMLElement; render: (w: WorldSave) => HTMLElement | null } | null = null;

  function openLive(title: string, render: (w: WorldSave, close: () => void) => HTMLElement | null) {
    const w = d.world();
    if (!w) return;
    const handle = openDialog(d.host, title, vi.garden.close);
    const draw = (now: WorldSave) => render(now, handle.close);
    live = { body: handle.body, render: draw };
    patch(handle.body, draw(w));
  }

  const run = (action: GardenRun) => d.dispatch(action);

  function openExpand() {
    openLive(vi.garden.expandTitle, (w, close) => {
      const next = nextExpansion(gardenOf(w));
      if (!next) return el('p', { text: vi.garden.expandMax });
      const vm: ButtonVm = { label: t(vi.garden.buy, { gold: formatInt(next.price) }), reason: w.wallet.coins < next.price ? vi.garden.noGold : null };
      return el(
        'div',
        { class: 'garden-dialog' },
        el('p', { text: t(vi.garden.expandBody, { count: next.plots - gardenOf(w).plots.length, plots: next.plots }) }),
        actionButton(vm, () => {
          run((s, c) => buyPlots(s, c));
          close();
        }),
      );
    });
  }

  function openSprinkler() {
    openLive(vi.garden.sprinklerTitle, (w) => {
      const vm = sprinklerVm(w);
      return el(
        'div',
        { class: 'garden-dialog' },
        el('p', { text: vm.text }),
        vm.next ? actionButton(vm.next, () => run((s, c) => upgradeSprinkler(s, c))) : el('p', { class: 'c-dialog__hint', text: vi.garden.sprinklerMax }),
      );
    });
  }

  function openPlot(index: number) {
    const only = { plots: [index] };
    openLive(t(vi.garden.plotTitle, { n: index + 1 }), (w, close) => {
      const card = plotCardVm(w, index, d.now(), {
        water: (s, c) => waterPlots(s, only, c),
        fertilize: (s, c) => fertilizePlots(s, only, c),
        harvest: (s, c) => harvestPlots(s, only, c),
      });
      if (!card || card.stage === 'empty') return null;
      return el(
        'div',
        { class: 'garden-dialog' },
        el('p', { class: 'c-dialog__strong', text: `${card.cropName ?? ''} · ${card.stageText}` }),
        ...card.lines.map((line) => el('p', { text: line })),
        el(
          'div',
          { class: 'garden-dialog__actions' },
          card.water ? actionButton(card.water, () => run((s, c) => waterPlots(s, only, c))) : null,
          card.fertilize ? actionButton(card.fertilize, () => run((s, c) => fertilizePlots(s, only, c))) : null,
          card.harvest
            ? actionButton(card.harvest, () => {
                run((s, c) => harvestPlots(s, only, c));
                close();
              })
            : null,
        ),
      );
    });
  }

  function openWorkshop(building: BuildingId) {
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
    openLive(building === 'mill' ? vi.garden.mill : vi.garden.composter, (w) => {
      const vm = workshopVm(w, building, d.now());
      if (!vm.built) {
        return el(
          'div',
          { class: 'garden-dialog' },
          el('p', { text: vm.priceText }),
          actionButton({ label: t(vi.garden.build, { gold: formatInt(GB.buildings[building].price) }), reason: vm.buildReason }, () => run((s, c) => buildWorkshop(s, { building }, c))),
        );
      }
      if (vm.job) {
        const job = vm.job;
        const collect: ButtonVm = job.ready > 0 ? { label: t(vi.garden.collect, { count: job.ready }), reason: null } : { label: t(vi.garden.collect, { count: 0 }), reason: vi.garden.noneReady };
        return el(
          'div',
          { class: 'garden-dialog' },
          el(
            'div',
            { class: 'garden-dialog__job' },
            el('p', { class: 'c-dialog__strong', text: t(vi.garden.running, { name: job.name }) }),
            el('p', { text: t(vi.garden.batchesDone, { done: job.done, total: job.total }) }),
            el('p', { text: job.nextIn === null ? vi.garden.allDone : t(vi.garden.nextBatch, { time: job.nextIn }) }),
            el('p', { class: 'c-dialog__hint', text: vi.garden.busyHint }),
          ),
          actionButton(collect, () => run((s, c) => collectCraft(s, { building }, c))),
        );
      }
      const chosen: RecipeVm = vm.recipes.find((r) => r.recipe.id === recipeId) ?? vm.recipes[0]!;
      recipeId = chosen.recipe.id;
      const most = Math.max(1, chosen.maxBatches);
      batches = Math.min(batches, most);
      const start: ButtonVm = chosen.maxBatches < 1 ? { label: vi.garden.start, reason: vi.garden.missing } : { label: t(vi.garden.startBatches, { count: batches }), reason: null };
      return el(
        'div',
        { class: 'garden-dialog' },
        el(
          'div',
          { class: 'garden-dialog__recipes', attrs: { role: 'radiogroup', 'aria-label': vi.garden.recipe } },
          ...vm.recipes.map((r) =>
            el(
              'button',
              {
                class: `garden-dialog__recipe${r === chosen ? ' is-selected' : ''}`,
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
              el('small', { text: `${vi.garden.outputs}: ${r.outputs} · ${r.duration}` }),
            ),
          ),
        ),
        el('p', { class: 'c-dialog__hint', text: vi.garden.inputs }),
        el('ul', { class: 'garden-dialog__inputs' }, ...chosen.inputs.map((i) => el('li', { class: i.have >= i.need * batches ? '' : 'is-short', text: `${i.name}: ${i.have}/${i.need * batches}` }))),
        el('div', { class: 'garden-dialog__stepper' }, el('span', { text: vi.garden.batches }), stepper('−', -1, most), el('b', { text: String(batches) }), stepper('+', 1, most)),
        actionButton(start, () => run((s, c) => startCraft(s, { building, recipeId: chosen.recipe.id, batches }, c))),
      );
    });
  }

  return {
    openExpand,
    openSprinkler,
    openPlot,
    openWorkshop,
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

export type GardenDialogs = ReturnType<typeof createGardenDialogs>;
