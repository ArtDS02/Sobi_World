// The rod (spec V2 §8.3, decision 035): the dock dialog with its three-beat mini-game (fishingGame.ts) — swing the power
// bar to throw near or far, watch the bobber and pull at the real bite (an early pull only startles the fish, twice),
// then hold to keep the fish in the green zone until it is reeled in. One water scene (the pier, the rod, the line and
// the bobber) shows where the line went. The score and the depth go to castLine; the catch is read from its events and
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
import { linePath, rodScene, rodSteps as steps, rodTag as tag, waterX, type SceneParts } from './fishingScene';
import { actionButton, type DialogKit } from './dialogKit';
import {
  biteTimes,
  depthOf,
  earlyPull,
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
  | { kind: 'wait'; depth: CastDepth; power: number; size: ShadowSize; landedAt: number; bite: number; nibbles: number[]; early: number; startledAt: number | null }
  | { kind: 'fight'; depth: CastDepth; power: number; size: ShadowSize; reaction: number; fight: Fight; last: number }
  | { kind: 'result'; text: string; good: boolean; art: string | null; rare: boolean; isNew: boolean; size: ShadowSize | null };

/** Catches in a row this session (presentation only). */
let streak = 0;

/** How long the "too early" note stays before the status goes back to the bobber. */
const STARTLE_NOTE_MS = 1800;

export function openFishing(k: DialogKit) {
  const F = vi.aquarium.fishing;
  let phase: Phase = { kind: 'idle' };
  let holding = false;
  let showOdds = false;
  /** The dialog body while open (the keys stop listening once it is gone). */
  let root: HTMLElement | null = null;
  /** The live parts the frame loop moves (re-found after every render). */
  let refs: Partial<SceneParts> & Partial<Record<'status' | 'pull' | 'arena' | 'zone' | 'fish' | 'reel' | 'reelText' | 'hold', HTMLElement>> = {};

  const set = (next: Phase) => {
    phase = next;
    holding = false;
    k.redraw();
  };

  async function land(score: number, depth: CastDepth, miss: string | null, size: ShadowSize | null) {
    const before = new Set(k.world()?.collection.discovered.fish ?? []);
    const r = await k.dispatch((s, c) => castLine(s, { score, depth }, c));
    const cast = (r.events ?? []).find((e): e is AquariumEvent & { type: 'AQUARIUM_CAST' } => e.type === 'AQUARIUM_CAST');
    if (!r.ok || !cast) return set({ kind: 'idle' });
    if (cast.itemId === null) {
      streak = 0;
      return set({ kind: 'result', text: miss ?? F.missed, good: false, art: null, rare: false, isNew: false, size: null });
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
      size,
    });
  }

  /** The button that does the beat's one thing (also Space / Enter). */
  function act() {
    const now = k.now();
    if (phase.kind === 'aim') {
      const power = powerAt(now - phase.startedAt);
      const depth = depthOf(power);
      const b = biteTimes(Math.random(), Math.random());
      set({ kind: 'wait', depth, power, size: shadowOf(Math.random(), depth), landedAt: now, bite: b.bite, nibbles: b.nibbles, early: 0, startledAt: null });
    } else if (phase.kind === 'wait') {
      const since = now - phase.landedAt;
      if (since < phase.bite) {
        const early = phase.early + 1;
        const next = earlyPull(since, early, Math.random());
        if (next === 'gone') return void land(0, phase.depth, F.early, null);
        // Only startled: the fish comes back later, with no more nibbles before that.
        phase = { ...phase, bite: next.bite, nibbles: [], early, startledAt: now };
        if (refs.status) refs.status.textContent = t(F.startled, { n: ROD.earlyGrace - early + 1 });
        const s = refs.scene;
        if (s) {
          s.classList.remove('is-startled');
          void s.offsetWidth; // restart the splash animation
          s.classList.add('is-startled');
        }
      }
      // The frame loop may lag (a window in the background): a pull after the window is late all the same.
      else if (since > phase.bite + ROD.biteWindowMs) void land(0, phase.depth, F.late, null);
      else set({ kind: 'fight', depth: phase.depth, power: phase.power, size: phase.size, reaction: reactionOf(since - phase.bite), fight: startFight(phase.depth), last: now });
    }
  }

  function frame() {
    const now = k.now();
    if (phase.kind === 'aim') {
      const power = powerAt(now - phase.startedAt);
      if (refs.power) refs.power.style.left = `${waterX(power)}%`;
      if (refs.target) refs.target.style.left = `${waterX(power)}%`;
    }
    if (phase.kind === 'wait') {
      const since = now - phase.landedAt;
      const nibbling = phase.nibbles.some((n) => since >= n && since < n + ROD.nibbleMs);
      const biting = since >= phase.bite;
      const noting = phase.startledAt !== null && now - phase.startledAt < STARTLE_NOTE_MS;
      refs.bobber?.classList.toggle('is-nibble', nibbling);
      refs.bobber?.classList.toggle('is-bite', biting);
      refs.scene?.classList.toggle('is-bite', biting);
      refs.pull?.classList.toggle('is-hot', biting);
      refs.line?.setAttribute('d', linePath(waterX(phase.power), biting));
      if (refs.status && (biting || !noting)) refs.status.textContent = biting ? F.bite : nibbling ? F.nibble : F.waiting;
      refs.status?.classList.toggle('is-hot', biting);
      if (since > phase.bite + ROD.biteWindowMs) void land(0, phase.depth, F.late, null);
    }
    if (phase.kind === 'fight') {
      const dt = Math.min(0.05, (now - phase.last) / 1000);
      const fight = stepFight(phase.fight, dt, holding, phase.depth, phase.size, Math.random());
      phase = { ...phase, fight, last: now };
      const zoneH = ROD.fight.zone[phase.depth];
      const isIn = fight.fish >= fight.zone && fight.fish <= fight.zone + zoneH;
      const slipping = !isIn && fight.progress < 0.25;
      if (refs.zone) refs.zone.style.cssText = `bottom:${fight.zone * 100}%;height:${zoneH * 100}%`;
      if (refs.fish) refs.fish.style.bottom = `${fight.fish * 100}%`;
      refs.arena?.classList.toggle('is-in', isIn);
      refs.arena?.classList.toggle('is-slip', slipping);
      refs.hold?.classList.toggle('is-held', holding);
      if (refs.reel) refs.reel.style.height = `${fight.progress * 100}%`;
      if (refs.reelText) refs.reelText.textContent = `${Math.round(fight.progress * 100)}%`;
      if (refs.status) refs.status.textContent = slipping ? F.slipping : t(F.reeled, { percent: Math.round(fight.progress * 100) });
      refs.status?.classList.toggle('is-hot', slipping);
      const over = fightOver(fight);
      if (over) {
        const p = phase;
        phase = { kind: 'idle' };
        void land(rodScore(over, p.reaction, p.fight, p.size, streak), p.depth, over === 'escaped' ? F.escaped : null, p.size);
      }
    }
  }

  const onKey = (e: KeyboardEvent) => {
    if (!root?.isConnected) return document.removeEventListener('keydown', onKey), document.removeEventListener('keyup', onKey);
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    e.preventDefault();
    if (phase.kind === 'fight') holding = e.type === 'keydown';
    else if (e.type === 'keydown' && !e.repeat) act();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);

  /** The water scene for the beat; its live parts go to refs. */
  function scene(): HTMLElement {
    const parts = rodScene(phase.kind === 'wait' || phase.kind === 'fight' ? phase : phase.kind === 'aim' ? phase : { kind: 'idle' }, act);
    Object.assign(refs, parts);
    return parts.scene;
  }

  k.open(F.title, (w) => {
    refs = {};
    const dock = dockVm(w, k.now(), k.offset(), 0.6, phase.kind === 'wait' || phase.kind === 'fight' ? phase.depth : 0);
    let stage: HTMLElement;
    const status = (text: string) => (refs.status = el('p', { class: 'aquarium-rod__status', attrs: { 'aria-live': 'polite' }, text }));
    const hint = (text: string) => el('small', { class: 'aquarium-rod__hint', text });

    if (phase.kind === 'aim') {
      stage = el(
        'div',
        { class: 'aquarium-rod' },
        steps(0),
        scene(),
        hint(F.aimHint),
        el('button', { class: 'c-button aquarium-rod__go', text: F.throw, attrs: { type: 'button' }, on: { click: act } }),
      );
    } else if (phase.kind === 'wait') {
      refs.pull = el('button', { class: 'c-button aquarium-rod__go aquarium-rod__pull', text: F.pull, attrs: { type: 'button' }, on: { click: act } });
      stage = el(
        'div',
        { class: 'aquarium-rod' },
        steps(1),
        scene(),
        el('div', { class: 'aquarium-rod__tags' }, tag(F.depth[phase.depth] ?? ''), tag(F.shadow[phase.size], `is-${phase.size}`)),
        status(F.waiting),
        hint(F.waitHint),
        refs.pull,
      );
    } else if (phase.kind === 'fight') {
      const f = phase.fight;
      refs.zone = el('span', { class: 'aquarium-rod__zone', attrs: { style: `bottom:${f.zone * 100}%;height:${ROD.fight.zone[phase.depth] * 100}%` } });
      refs.fish = el('span', { class: `aquarium-rod__fish is-${phase.size}`, text: '🐟', attrs: { 'aria-hidden': 'true', style: `bottom:${f.fish * 100}%` } });
      refs.reel = el('i', { attrs: { style: `height:${f.progress * 100}%` } });
      refs.reelText = el('b', { text: `${Math.round(phase.fight.progress * 100)}%` });
      const hold = (on: boolean) => (e: Event) => {
        e.preventDefault();
        holding = on;
      };
      refs.hold = el(
        'button',
        {
          class: 'c-button aquarium-rod__hold',
          attrs: { type: 'button' },
          on: { pointerdown: hold(true), pointerup: hold(false), pointerleave: hold(false), pointercancel: hold(false), contextmenu: (e) => e.preventDefault() },
        },
        el('span', { class: 'aquarium-rod__hold-icon', text: '🎣', attrs: { 'aria-hidden': 'true' } }),
        el('span', { text: F.hold }),
      );
      refs.arena = el(
        'div',
        { class: 'aquarium-rod__arena is-in' },
        el('div', { class: 'aquarium-rod__bar' }, el('span', { class: 'aquarium-rod__bubbles', attrs: { 'aria-hidden': 'true' } }), refs.zone, refs.fish),
        el(
          'div',
          { class: 'aquarium-rod__reel', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' } },
          el('span', { class: 'aquarium-rod__reel-track' }, refs.reel),
          refs.reelText,
        ),
        refs.hold,
      );
      stage = el(
        'div',
        { class: 'aquarium-rod aquarium-rod--fight' },
        steps(2),
        el('div', { class: 'aquarium-rod__tags' }, tag(F.depth[phase.depth] ?? ''), tag(F.shadow[phase.size], `is-${phase.size}`)),
        refs.arena,
        status(t(F.reeled, { percent: Math.round(phase.fight.progress * 100) })),
        hint(F.fightHint),
      );
    } else {
      const cooling = dock.cooldownMs > 0;
      const result =
        phase.kind === 'result'
          ? el(
              'div',
              { class: `aquarium-rod__result${phase.good ? ' is-good' : ' is-miss'}${phase.rare ? ' is-rare' : ''}${phase.isNew ? ' is-new' : ''}` },
              phase.good ? el('span', { class: 'aquarium-rod__rays', attrs: { 'aria-hidden': 'true' } }) : null,
              phase.art ? art(phase.art, 'aquarium-rod__catch') : el('span', { class: 'aquarium-rod__catch is-empty', text: phase.good ? '🦪' : '💨' }),
              el('b', { text: phase.text }),
              phase.good && phase.size ? tag(F.shadow[phase.size], `is-${phase.size}`) : null,
            )
          : scene();
      stage = el(
        'div',
        { class: 'aquarium-rod' },
        result,
        phase.kind === 'result' ? null : el('p', { class: 'aquarium-rod__lead', text: F.intro }),
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
    return (root = el('div', { class: 'aquarium-dialog' }, stage, odds));
  }, (body) => body.closest('.c-dialog__panel')?.classList.add('c-dialog__panel--rod'), 'orders');
  // The power marker, the bobber and the fight move on the frame loop, not on world changes.
  k.onFrame(frame);
}
