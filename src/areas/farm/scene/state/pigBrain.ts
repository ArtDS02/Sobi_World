// One pig's behaviour state machine (DECISIONS PL-1). Pure: the central PigLife step feeds it the
// world each AI tick and executes the commands it returns on PigMover / PigSprite. Needs and the
// priority come from core/engine/pigLife.ts; this file only sequences the activities, holds the
// target and keeps behaviour from flickering (an activity runs until it is done or out-ranked).
import { PIG_SLEEP } from '../../../../core/config/dayNight';
import { PIG_LIFE } from '../../../../core/config/pigLife';
import {
  behaviorRank,
  chooseBehavior,
  eatMs,
  freeChoice,
  initialSleepiness,
  lifeRoll,
  mopes,
  personalityOf,
  reactMs,
  restMs,
  runSpeed,
  sleepinessAfter,
  sleepinessOnWake,
  traitScale,
  urgentHunger,
  wakeDelayMs,
  wantsSleep,
  type LifeBehavior,
  type Personality,
} from '../../logic/pigLife';
import type { AiState, BrainCommand, BrainWorld, Point } from './brainWorld';
import type { PigRestState } from './sleepCycle';

const WALKING: readonly AiState[] = ['WANDER', 'SEEK_FOOD', 'GO_TO_SLEEP', 'SOCIAL_APPROACH'];
const SLEEP_STATES: readonly AiState[] = ['GO_TO_SLEEP', 'FALLING_ASLEEP', 'SLEEPING'];

export class PigBrain {
  state: AiState;
  sleepiness: number;
  readonly personality: Personality;
  /** A trough meal eaten in the data, still to be shown (PIG_ATE_FROM_TROUGH). */
  meal: { meals: number; hungerBefore: number; readyAt: number } | null = null;
  target: Point | null = null;
  private until = 0;
  private step = 0;
  private lastAt: number;
  private lastSocialAt = -Infinity;
  private friendAt: Point | null = null;

  constructor(
    readonly pigId: string,
    now: number,
    night: boolean,
    msSinceDawn: number,
  ) {
    this.personality = personalityOf(pigId);
    this.sleepiness = initialSleepiness(night, msSinceDawn, this.personality);
    this.state = night && PIG_LIFE.auto.sleep ? 'SLEEPING' : 'IDLE';
    this.lastAt = now;
    this.until = now;
  }

  /** The pose a freshly placed pig starts in (asleep when it appears at night). */
  readonly restPose = (): PigRestState => (this.state === 'SLEEPING' ? 'SLEEPING' : 'IDLE');

  /** The trough fed this pig: it will walk over and eat (meals add up until shown). */
  onMeal(meals: number, hungerBefore: number, now: number) {
    const m = this.meal;
    this.meal = m
      ? {
          meals: m.meals + meals,
          hungerBefore: Math.min(m.hungerBefore, hungerBefore),
          readyAt: m.readyAt,
        }
      : { meals, hungerBefore, readyAt: now + reactMs(this.personality) };
  }

  /** Another pig comes to visit: an idle pig turns toward it and waits. */
  onVisited(fromX: number, now: number): BrainCommand[] {
    if (this.state !== 'IDLE') return [];
    this.until = Math.max(this.until, now + PIG_LIFE.social.holdMaxMs);
    this.lastSocialAt = now;
    return [{ kind: 'face', x: fromX }];
  }

  /** Free for a visit: awake, standing, not busy with a need. */
  get visitable(): boolean {
    return this.state === 'IDLE' || this.state === 'LOOK_AROUND';
  }

  tick(w: BrainWorld): BrainCommand[] {
    const dt = w.now - this.lastAt;
    this.lastAt = w.now;
    this.sleepiness = sleepinessAfter(
      this.sleepiness,
      dt,
      this.state === 'SLEEPING',
      w.night,
      this.personality,
    );
    if (w.paused) {
      this.until += Math.max(0, dt); // timers freeze while the player holds the pig
      return [];
    }
    const want = this.want(w);
    if (this.done(w, want)) return this.finish(w, want);
    if (behaviorRank(want) < behaviorRank(this.serving()) && this.interruptible()) {
      return this.interrupt(w, want);
    }
    return [];
  }

  private want(w: BrainWorld): LifeBehavior {
    const asleep = this.state === 'SLEEPING' || this.state === 'FALLING_ASLEEP';
    const sleep = wantsSleep({
      sleepiness: this.sleepiness,
      night: w.night,
      asleep,
      sinceDayMs: w.sinceDayMs,
      wakeDelayMs: wakeDelayMs(this.pigId, this.personality),
    });
    const meal = this.meal && w.now >= this.meal.readyAt ? this.meal : null;
    return chooseBehavior({ meal, sleep, sick: w.care.isSick, pregnant: w.care.pregnant });
  }

  /** The behaviour the current state serves. */
  private serving(): LifeBehavior {
    if (this.state === 'SEEK_FOOD' || this.state === 'EATING') {
      return this.meal && urgentHunger(this.meal.hungerBefore) ? 'eatUrgent' : 'eat';
    }
    if (SLEEP_STATES.includes(this.state)) return 'sleep';
    return this.state === 'REST' ? 'rest' : 'free';
  }

  private interruptible(): boolean {
    return this.state !== 'EATING' && this.state !== 'WAKING_UP';
  }

  private done(w: BrainWorld, want: LifeBehavior): boolean {
    if (this.state === 'SLEEPING') return want !== 'sleep';
    if (WALKING.includes(this.state)) return !w.walking || w.now >= this.until;
    return w.now >= this.until;
  }

  private set(state: AiState, ms: number, now: number, target: Point | null = this.target) {
    this.state = state;
    this.until = now + ms;
    this.target = target;
  }

  /** A higher need out-ranks the current activity: asleep pigs wake up first. */
  private interrupt(w: BrainWorld, want: LifeBehavior): BrainCommand[] {
    if (this.state === 'SLEEPING' || this.state === 'FALLING_ASLEEP') return this.wake(w);
    if (this.state === 'SEEK_FOOD') w.releaseFeed();
    return [{ kind: 'stop' }, ...this.start(w, want)];
  }

  private wake(w: BrainWorld): BrainCommand[] {
    if (!w.night) this.sleepiness = sleepinessOnWake(this.sleepiness, w.sinceDayMs);
    this.set('WAKING_UP', PIG_SLEEP.wakeUpMs, w.now, null);
    return [{ kind: 'rest', rest: 'WAKING_UP' }];
  }

  /** The current activity is over: its follow-up, or whatever the needs ask for now. */
  private finish(w: BrainWorld, want: LifeBehavior): BrainCommand[] {
    const S = PIG_SLEEP;
    switch (this.state) {
      case 'SEEK_FOOD':
        this.set('EATING', eatMs(this.meal?.meals ?? 1), w.now);
        return [{ kind: 'stop' }, { kind: 'eat' }];
      case 'EATING':
        this.meal = null;
        w.releaseFeed();
        return this.afterMeal(w);
      case 'GO_TO_SLEEP':
        if (want !== 'sleep') return this.start(w, want);
        this.set('FALLING_ASLEEP', S.fallAsleepMs, w.now);
        return [{ kind: 'stop' }, { kind: 'rest', rest: 'FALLING_ASLEEP' }];
      case 'FALLING_ASLEEP':
        if (want !== 'sleep') return this.wake(w);
        this.set('SLEEPING', 0, w.now);
        return [{ kind: 'rest', rest: 'SLEEPING' }];
      case 'SLEEPING':
        return this.wake(w);
      case 'WAKING_UP':
        return [{ kind: 'rest', rest: 'IDLE' }, ...this.start(w, want)];
      case 'SOCIAL_APPROACH':
        this.set(
          'SOCIAL',
          this.roll(5, PIG_LIFE.social.holdMinMs, PIG_LIFE.social.holdMaxMs),
          w.now,
        );
        return [
          { kind: 'stop' },
          ...(this.friendAt ? [{ kind: 'face' as const, x: this.friendAt.x }] : []),
        ];
      case 'SOCIAL':
        this.lastSocialAt = w.now;
        return this.idle(w);
      case 'WANDER':
      case 'LOOK_AROUND':
        return this.idle(w);
      default:
        return this.start(w, want);
    }
  }

  /** Fed: walk back into the farm first (unless sleep / another meal comes first), then go on. */
  private afterMeal(w: BrainWorld): BrainCommand[] {
    const want = this.want(w);
    const leave = (want === 'free' || want === 'rest') && !w.still;
    return leave ? this.wander(w) : this.start(w, want);
  }

  private start(w: BrainWorld, want: LifeBehavior): BrainCommand[] {
    if (want === 'eatUrgent' || want === 'eat') return this.seekFood(w);
    if (want === 'sleep') return this.goToSleep(w);
    if (want === 'rest') {
      this.set('REST', PIG_LIFE.idle.restInPlaceMs, w.now, null);
      return [{ kind: 'stop' }];
    }
    return this.free(w);
  }

  private seekFood(w: BrainWorld): BrainCommand[] {
    if (w.still) {
      this.set('EATING', eatMs(this.meal?.meals ?? 1), w.now, null);
      return [{ kind: 'eat' }];
    }
    const spot = w.feedSpot();
    if (!spot) {
      this.meal = null; // no trough on the farm: nothing to walk to (fallback: free time)
      return this.free(w);
    }
    this.set('SEEK_FOOD', PIG_LIFE.feed.maxSeekMs, w.now, spot);
    return [{ kind: 'walk', to: spot, speed: runSpeed(this.personality) }];
  }

  private goToSleep(w: BrainWorld): BrainCommand[] {
    if (!w.night || w.still) {
      this.set('FALLING_ASLEEP', PIG_SLEEP.fallAsleepMs, w.now, null); // a nap where it stands
      return [{ kind: 'stop' }, { kind: 'rest', rest: 'FALLING_ASLEEP' }];
    }
    const spot = w.sleepSpot();
    this.set('GO_TO_SLEEP', PIG_LIFE.feed.maxSeekMs, w.now, spot);
    return [{ kind: 'walk', to: spot, speed: 1 }];
  }

  private free(w: BrainWorld): BrainCommand[] {
    this.step += 1;
    const p = this.personality;
    const moping = mopes(w.care);
    const cooled = w.now - this.lastSocialAt >= PIG_LIFE.social.cooldownMs;
    const socialRoll = lifeRoll(this.pigId, this.step, 2);
    const friend =
      !w.still && cooled && socialRoll < PIG_LIFE.social.chance * p.social ? w.friend() : null;
    const roll = lifeRoll(this.pigId, this.step, 1);
    const choice = freeChoice(p, roll, socialRoll, {
      night: w.night,
      moping,
      friendReady: !!friend,
    });
    if (choice === 'social' && friend) return this.visit(w, friend);
    if (choice === 'wander' && !w.still) return this.wander(w);
    if (choice === 'lookAround') {
      this.set('LOOK_AROUND', PIG_LIFE.idle.lookAroundMs, w.now, null);
      return [{ kind: 'lookAround' }];
    }
    return this.idle(w);
  }

  private visit(w: BrainWorld, friend: { id: string; at: Point }): BrainCommand[] {
    const side = w.pos.x < friend.at.x ? -1 : 1;
    const to = { x: friend.at.x + side * PIG_LIFE.social.sideGapPx, y: friend.at.y };
    this.friendAt = friend.at;
    this.lastSocialAt = w.now;
    this.set('SOCIAL_APPROACH', PIG_LIFE.feed.maxSeekMs, w.now, to);
    return [
      { kind: 'callFriend', id: friend.id },
      { kind: 'walk', to, speed: 1 },
    ];
  }

  private wander(w: BrainWorld): BrainCommand[] {
    this.step += 1;
    const to = w.wanderTo(this.step);
    const speed = traitScale(this.personality.energy) * (mopes(w.care) ? 0.8 : 1);
    this.set('WANDER', PIG_LIFE.feed.maxSeekMs, w.now, to);
    return [{ kind: 'walk', to, speed }];
  }

  private idle(w: BrainWorld): BrainCommand[] {
    const ms = restMs(this.personality, lifeRoll(this.pigId, this.step, 3), mopes(w.care));
    this.set('IDLE', ms, w.now, null);
    return [];
  }

  private roll(salt: number, min: number, max: number): number {
    return min + lifeRoll(this.pigId, this.step, salt) * (max - min);
  }
}
