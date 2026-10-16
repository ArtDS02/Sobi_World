// The rod (spec V2 §8.3, decision 035): the dock dialog with its three-beat mini-game (fishingGame.ts) — swing the power
// bar to throw near or far, watch the bobber and pull at the real bite (not at a nibble), then hold to keep the fish in
// the green zone until it is reeled in. The score and the depth go to castLine; the catch is read from its events and
// shown big. A streak of catches (kept for the session, presentation only) nudges the score up.
import { art } from '../../../ui/components/icon';
import { el } from '../../../ui/dom';
import { formatDuration, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { castLine } from '../logic/actions/fishing';
import { FISH } from '../logic/config/content';
import type { AquariumEvent } from '../logic/events';
import type { CastDepth } from '../logic/fishing';
import { dockVm } from './dockVm';
import { actionButton, type DialogKit } from './dialogKit';
import {
  biteTimes,
  depthOf,
  fightOver,
  powerAt,
  reactionOf,
  ROD,
  rodScore,
  shadowOf,
  startFight,
  stepFight,
  type Fight,
  type ShadowSize,
} from './fishingGame';

type Phase =
  | { kind: 'idle' }
  | { kind: 'aim'; startedAt: number }
  | { kind: 'wait'; depth: CastDepth; size: ShadowSize; landedAt: number; bite: number; nibbles: number[] }
  | { kind: 'fight'; depth: CastDepth; size: ShadowSize; reaction: number; fight: Fight; last: number }
  | { kind: 'result'; text: string; good: boolean; art: string | null; rare: boolean; isNew: boolean };

/** Catches in a row this session (presentation only). */
let streak = 0;

export function openFishing(k: DialogKit) {
  const F = vi.aquarium.fishing;
  let phase: Phase = { kind: 'idle' };
  let holding = false;
  let showOdds = false;
  /** The live parts the frame loop moves (re-found after every render). */
  let refs: { power?: HTMLElement; bobber?: HTMLElement; status?: HTMLElement; pull?: HTMLElement; zone?: HTMLElement; fish?: HTMLElement; reel?: HTMLElement } = {};

  const set = (next: Phase) => {
    phase = next;
    holding = false;
    k.redraw();
  };

  async function land(score: number, depth: CastDepth, miss: string | null) {
    const before = new Set(k.world()?.collection.discovered.fish ?? []);
    const r = await k.dispatch((s, c) => castLine(s, { score, depth }, c));
    const cast = (r.events ?? []).find((e): e is AquariumEvent & { type: 'AQUARIUM_CAST' } => e.type === 'AQUARIUM_CAST');
    if (!r.ok || !cast) return set({ kind: 'idle' });
    if (cast.itemId === null) {
      streak = 0;
      return set({ kind: 'result', text: miss ?? F.missed, good: false, art: null, rare: false, isNew: false });
    }
    streak += 1;
    const species = cast.speciesId ? FISH[cast.speciesId] : undefined;
    const name = species?.nameVi ?? F.oyster;
    const isNew = !!species && !before.has(species.id);
    const q = F.quality;
    const label = score >= 0.85 ? q.perfect : score >= 0.6 ? q.good : q.ok;
    set({
      kind: 'result',
      text: `${label} ${t(isNew ? F.caughtNew : F.caught, { name })}`,
      good: true,
      art: species?.art ?? null,
      rare: !!species && species.rarity !== 'COMMON' && species.rarity !== 'UNCOMMON',
      isNew,
    });
  }

  /** The button that does the beat's one thing (also Space / Enter). */
  function act() {
    const now = k.now();
    if (phase.kind === 'aim') {
      const depth = depthOf(powerAt(now - phase.startedAt));
      const b = biteTimes(Math.random(), Math.random());
      set({ kind: 'wait', depth, size: shadowOf(Math.random(), depth), landedAt: now, bite: b.bite, nibbles: b.nibbles });
    } else if (phase.kind === 'wait') {
      const since = now - phase.landedAt;
      if (since < phase.bite) void land(0, phase.depth, F.early);
      // The frame loop may lag (a window in the background): a pull after the window is late all the same.
      else if (since > phase.bite + ROD.biteWindowMs) void land(0, phase.depth, F.late);
      else set({ kind: 'fight', depth: phase.depth, size: phase.size, reaction: reactionOf(since - phase.bite), fight: startFight(), last: now });
    }
  }

  function frame() {
    const now = k.now();
    if (phase.kind === 'aim' && refs.power) refs.power.style.left = `${powerAt(now - phase.startedAt) * 100}%`;
    if (phase.kind === 'wait') {
      const since = now - phase.landedAt;
      const nibbling = phase.nibbles.some((n) => since >= n && since < n + ROD.nibbleMs);
      const biting = since >= phase.bite;
      refs.bobber?.classList.toggle('is-nibble', nibbling);
      refs.bobber?.classList.toggle('is-bite', biting);
      refs.pull?.classList.toggle('is-hot', biting);
      if (refs.status) refs.status.textContent = biting ? F.bite : nibbling ? F.nibble : F.waiting;
      if (since > phase.bite + ROD.biteWindowMs) void land(0, phase.depth, F.late);
    }
    if (phase.kind === 'fight') {
      const dt = Math.min(0.05, (now - phase.last) / 1000);
      const fight = stepFight(phase.fight, dt, holding, phase.depth, phase.size, Math.random());
      phase = { ...phase, fight, last: now };
      const zoneH = ROD.fight.zone[phase.depth];
      if (refs.zone) refs.zone.style.cssText = `bottom:${fight.zone * 100}%;height:${zoneH * 100}%`;
      if (refs.fish) {
        refs.fish.style.bottom = `${fight.fish * 100}%`;
        refs.fish.classList.toggle('is-in', fight.fish >= fight.zone && fight.fish <= fight.zone + zoneH);
      }
      if (refs.reel) refs.reel.style.height = `${fight.progress * 100}%`;
      if (refs.status) refs.status.textContent = t(F.reeled, { percent: Math.round(fight.progress * 100) });
      const over = fightOver(fight);
      if (over) {
        const p = phase;
        phase = { kind: 'idle' };
        void land(rodScore(over, p.reaction, p.fight, p.size, streak), p.depth, over === 'escaped' ? F.escaped : null);
      }
    }
  }

  const onKey = (e: KeyboardEvent) => {
    if (!refs.status?.isConnected) return document.removeEventListener('keydown', onKey), document.removeEventListener('keyup', onKey);
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    e.preventDefault();
    if (phase.kind === 'fight') holding = e.type === 'keydown';
    else if (e.type === 'keydown' && !e.repeat) act();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);

  const water = (depth: CastDepth | null, size: ShadowSize | null, bobber: HTMLElement | null) =>
    el(
      'div',
      { class: `aquarium-rod__water${depth !== null ? ` is-depth-${depth}` : ''}` },
      size ? el('span', { class: `aquarium-rod__shadow is-${size}`, attrs: { 'aria-hidden': 'true' } }) : null,
      bobber,
      el('span', { class: 'aquarium-rod__ripple', attrs: { 'aria-hidden': 'true' } }),
    );

  k.open(F.title, (w) => {
    refs = {};
    const dock = dockVm(w, k.now(), k.offset(), 0.6, phase.kind === 'wait' || phase.kind === 'fight' ? phase.depth : 0);
    let stage: HTMLElement;
    const status = (text: string) => (refs.status = el('p', { class: 'aquarium-rod__status', attrs: { 'aria-live': 'polite' }, text }));

    if (phase.kind === 'aim') {
      refs.power = el('span', { class: 'aquarium-rod__marker', attrs: { 'aria-hidden': 'true' } });
      stage = el(
        'div',
        { class: 'aquarium-rod' },
        status(F.aimHint),
        el(
          'div',
          { class: 'aquarium-rod__power', attrs: { role: 'img', 'aria-label': F.aimHint } },
          ...F.depth.map((name, i) => el('span', { class: `aquarium-rod__band is-${i}`, attrs: { style: `flex:${[ROD.depthAt[0], ROD.depthAt[1] - ROD.depthAt[0], 1 - ROD.depthAt[1]][i]}` }, text: name })),
          refs.power,
        ),
        el('button', { class: 'c-button aquarium-rod__go', text: F.throw, attrs: { type: 'button' }, on: { click: act } }),
      );
    } else if (phase.kind === 'wait') {
      refs.bobber = el('span', { class: 'aquarium-rod__bobber', attrs: { 'aria-hidden': 'true' } });
      refs.pull = el('button', { class: 'c-button aquarium-rod__go aquarium-rod__pull', text: F.pull, attrs: { type: 'button' }, on: { click: act } });
      stage = el(
        'div',
        { class: 'aquarium-rod' },
        el('p', { class: 'aquarium-rod__where', text: `${t(F.landed, { where: F.depth[phase.depth] ?? '' })} · ${F.shadow[phase.size]}` }),
        water(phase.depth, phase.size, refs.bobber),
        status(F.waiting),
        el('small', { class: 'c-dialog__hint', text: F.waitHint }),
        refs.pull,
      );
    } else if (phase.kind === 'fight') {
      refs.zone = el('span', { class: 'aquarium-rod__zone' });
      refs.fish = el('span', { class: `aquarium-rod__fish is-${phase.size}`, text: '🐟', attrs: { 'aria-hidden': 'true' } });
      refs.reel = el('i');
      const hold = (on: boolean) => (e: Event) => {
        e.preventDefault();
        holding = on;
      };
      stage = el(
        'div',
        { class: 'aquarium-rod aquarium-rod--fight' },
        el('p', { class: 'aquarium-rod__where', text: `${F.depth[phase.depth] ?? ''} · ${F.shadow[phase.size]}` }),
        el(
          'div',
          { class: 'aquarium-rod__arena' },
          el('div', { class: 'aquarium-rod__bar' }, refs.zone, refs.fish),
          el('div', { class: 'aquarium-rod__reel', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' } }, refs.reel),
          el(
            'button',
            {
              class: 'c-button aquarium-rod__hold',
              text: F.hold,
              attrs: { type: 'button' },
              on: { pointerdown: hold(true), pointerup: hold(false), pointerleave: hold(false), pointercancel: hold(false), contextmenu: (e) => e.preventDefault() },
            },
          ),
        ),
        status(t(F.reeled, { percent: Math.round(phase.fight.progress * 100) })),
        el('small', { class: 'c-dialog__hint', text: F.fightHint }),
      );
    } else {
      const cooling = dock.cooldownMs > 0;
      const result =
        phase.kind === 'result'
          ? el(
              'div',
              { class: `aquarium-rod__result${phase.good ? ' is-good' : ' is-miss'}${phase.rare ? ' is-rare' : ''}${phase.isNew ? ' is-new' : ''}` },
              phase.art ? art(phase.art, 'aquarium-rod__catch') : el('span', { class: 'aquarium-rod__catch is-empty', text: phase.good ? '🦪' : '💨' }),
              el('b', { text: phase.text }),
            )
          : el('p', { class: 'aquarium-rod__status', text: F.intro });
      stage = el(
        'div',
        { class: 'aquarium-rod' },
        result,
        streak > 0 ? el('p', { class: 'aquarium-rod__streak', attrs: { title: F.streakHint } }, el('span', { text: '🔥' }), t(F.streak, { n: streak })) : null,
        actionButton(
          { label: phase.kind === 'result' ? F.again : F.cast, reason: cooling ? t(F.rest, { time: formatDuration(dock.cooldownMs) }) : null },
          () => set({ kind: 'aim', startedAt: k.now() }),
          'aquarium-rod__go',
        ),
      );
    }
    const odds = el(
      'details',
      { class: 'aquarium-rod__odds', attrs: showOdds ? { open: '' } : {}, on: { toggle: (e) => (showOdds = (e.currentTarget as HTMLDetailsElement).open) } },
      el('summary', { text: `${F.oddsShow} · ${t(F.odds, { time: dock.period })}` }),
      el(
        'ul',
        { class: 'aquarium-dialog__odds' },
        ...dock.odds.map((o) =>
          el(
            'li',
            { class: o.known ? '' : 'is-unknown' },
            art(o.art, 'aquarium-dialog__odds-icon'),
            el('span', { text: `${o.name}${o.night ? ' 🌙' : ''}` }),
            el('small', { text: `${o.percent < 1 ? '<1' : Math.round(o.percent)}%` }),
          ),
        ),
      ),
    );
    return el('div', { class: 'aquarium-dialog' }, stage, odds);
  }, (body) => body.closest('.c-dialog__panel')?.classList.add('c-dialog__panel--rod'), 'orders');
  // The power marker, the bobber and the fight move on the frame loop, not on world changes.
  k.onFrame(frame);
}
