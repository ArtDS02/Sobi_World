// The battle screen (spec §15.4–15.5, §17; adventure-big-update-1): the zone's painting behind, our team on the left facing right and the
// enemies on the right facing left, each with a small nameplate (element, name, level, health, statuses; the enemies' intent). The turn
// bar sits at the very top: the one acting slides into the lit slot at its head. The command dock at the bottom keeps the screen quiet:
// the team on the left, three tabs (main skills, class skills, items) whose list opens only when a tab is clicked, Defend / Flee, and
// the round Attack button. Choosing an action puts a target marker (a ring with an X) on everything it can reach — one big marker over
// a whole side for a skill that hits a side — and the action runs only when a marker is clicked. The last step plays over the field
// (battleStage.ts draws the magic circles, effects and reactions on a canvas; the numbers and the banner are DOM, battleFxView.ts).
import { vi } from '../../../i18n/vi';
import { el } from '../../../ui/dom';
import { adventureOf } from '../logic/save/lens';
import type { Run } from '../logic/state';
import { FX_MS, bannerEl, stepEffects } from './battleFxView';
import { type UnitVm, battleVm } from './battleVm';
import { type ViewCtx, iconOf, roundButton } from './viewKit';
import { ACTION_ART } from './vmKit';
import { choose } from './battleCommand';
import { commands, party } from './battleDock';
import { sideMarker, turnBar, unitOnField } from './battleField';


/** The battle on screen; `replay` = a battle just won, played to its last blow under the battle board (no commands). */
export function renderBattle(ctx: ViewCtx, replay?: Run): HTMLElement {
  const { state } = ctx;
  const run = replay ?? adventureOf(ctx.world).run!;
  const vm = battleVm(ctx.world, run)!;
  const step = stepEffects(run, run.battle, state.fast);
  const live = step.elapsed < step.motion.total + FX_MS;
  const floatersOf = (id: string) => (live ? step.fx.floaters.filter((f) => f.unit === id) : []);
  const fxBanner = live ? step.fx.banner : null;
  const actor = vm.units.find((u) => u.id === vm.actor);
  const mine = actor?.side === 'ally';
  const attack = vm.actions.find((a) => a.kind === 'attack');
  const enemies = vm.units.filter((u) => u.side === 'enemy');
  const allies = vm.units.filter((u) => u.side === 'ally');
  // Knocked out in this step: the stage plays its fall when the blow lands, so it is drawn standing while the step plays (not by
  // the clock: a markup that changed mid-step would rebuild the field and restart the numbers).
  const fallsLater = (u: UnitVm) =>
    live && u.down && step.motion.reactions.some((r) => r.unit === u.id && r.kind === 'ko');
  const aim = state.aim?.action ?? null;
  const sideAim = aim && (aim.aim === 'enemies' || aim.aim === 'allies' || aim.aim === 'all');
  return el(
    'div',
    {
      class: `adventure-ui__battle${state.fast ? ' is-fast' : ''}${aim ? ' is-aiming' : ''}${replay ? ' is-replay' : ''}`,
    },
    replay ? null : turnBar(vm),
    replay
      ? null
      : el(
          'div',
          { class: 'adventure-ui__tools' },
          roundButton(
            ACTION_ART.auto,
            vi.adventure.battle.auto,
            state.auto,
            () => ((state.auto = !state.auto), ctx.rerender()),
          ),
          roundButton(
            ACTION_ART.speed,
            vi.adventure.battle.speed,
            state.fast,
            () => ((state.fast = !state.fast), ctx.rerender()),
          ),
          roundButton(
            ACTION_ART.skill,
            vi.adventure.battle.log.title,
            state.log,
            () => ((state.log = !state.log), ctx.rerender()),
          ),
        ),
    el(
      'div',
      { class: 'adventure-ui__field' },
      ...allies.map((u, i) =>
        unitOnField(u, i, vm, ctx, run, floatersOf(u.id), step.shown, fallsLater(u)),
      ),
      ...enemies.map((u, i) =>
        unitOnField(u, i, vm, ctx, run, floatersOf(u.id), step.shown, fallsLater(u)),
      ),
      sideAim && (aim.aim === 'enemies' || aim.aim === 'all')
        ? sideMarker('enemy', enemies, aim, ctx)
        : null,
      sideAim && (aim.aim === 'allies' || aim.aim === 'all')
        ? sideMarker('ally', allies, aim, ctx)
        : null,
    ),
    fxBanner
      ? bannerEl(fxBanner, vm.units.find((u) => u.id === fxBanner.unit)?.art ?? null, step.shown)
      : null,
    state.log && !replay
      ? el(
          'ol',
          { class: 'adventure-ui__log', attrs: { 'aria-live': 'polite' } },
          ...vm.log.slice(-40).map((line) => el('li', { text: line })),
        )
      : null,
    replay
      ? null
      : el(
          'div',
          { class: 'adventure-ui__dock' },
          party(vm),
          commands(vm, ctx, actor),
          attack && mine && !state.aim
            ? el(
                'button',
                {
                  class: `adventure-ui__attack${attack.reason ? ' is-off' : ''}`,
                  attrs: { type: 'button', title: attack.detail },
                  on: { click: () => choose(attack, vm, ctx) },
                },
                iconOf(attack.art, attack.label),
                el('span', { text: attack.label }),
              )
            : el('span', { class: 'adventure-ui__attack-gap' }),
        ),
  );
}
