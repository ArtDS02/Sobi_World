// View-models of the world's goals screens (spec V2 §9): the Order Board, the daily goals with the login reward and
// the achievements, and the Codex. Pure (no DOM): availability comes from dry-running the real actions on the save,
// so a disabled button always says what dispatch would answer.
import type { AssetRegistry } from '../../core/assets/registry';
import { itemArtId } from '../../core/config/assetIds';
import type { ErrorCode } from '../../core/config/errors';
import { codexCounts, claimableMilestones, type CodexKind } from '../../core/collection/codex';
import { metricValue, targetOf } from '../../core/goals/achievements';
import { goalProgress } from '../../core/goals/daily';
import type { Goals, WorldAction } from '../../core/goals/api';
import { loginReward, nextStreak } from '../../core/goals/loginReward';
import { missingLines, slotCount } from '../../core/goals/orders';
import { mulberry32 } from '../../core/rng';
import type { WorldSave } from '../../core/save/world';
import { CONTENT } from '../../core/config/content';
import { formatDuration, formatInt, rewardText, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';

export interface ActionVm {
  label: string;
  /** Why the button is off, null when it works. */
  reason: string | null;
  run: WorldAction;
}

const itemName = (id: string): string => (vi.shop as Record<string, string>)[id] ?? id;

/** The error a dry run of `run` would give; null when it would work. */
export function dryRun(world: WorldSave, run: WorldAction, now: number, dayOffsetMs = 0): ErrorCode | null {
  const r = run(world, { now, rng: mulberry32(0), dayOffsetMs });
  return r.ok ? null : r.error;
}

// ---- Order Board ----------------------------------------------------------------------------------------------

export interface OrderLineVm {
  itemId: string;
  artId: string;
  name: string;
  qty: number;
  have: number;
  enough: boolean;
}

export interface OrderCardVm {
  id: string;
  lines: OrderLineVm[];
  reward: string;
  bonus: string | null;
  deliver: ActionVm;
  reroll: ActionVm;
}

export interface BoardVm {
  hint: string;
  cards: OrderCardVm[];
  /** Empty slots, with when the next order comes. */
  empty: string[];
}

export function boardVm(world: WorldSave, goals: Goals, now: number): BoardVm {
  const { rules } = goals;
  const items = world.inventory.items;
  const cards = world.goals.board.slots.flatMap((order, slot): OrderCardVm[] => {
    if (!order) return [];
    const lacking = missingLines(order, items);
    const deliverRun = goals.deliver(slot);
    const rerollRun = goals.reroll(slot);
    const rerollError = dryRun(world, rerollRun, now);
    const deliverError = dryRun(world, deliverRun, now);
    return [
      {
        id: order.id,
        lines: order.lines.map((l): OrderLineVm => ({
          itemId: l.itemId,
          artId: itemArtId(l.itemId),
          name: itemName(l.itemId),
          qty: l.qty,
          have: items[l.itemId] ?? 0,
          enough: (items[l.itemId] ?? 0) >= l.qty,
        })),
        reward: t(vi.board.reward, { coins: formatInt(order.coins), xp: order.xp }),
        bonus: order.bonus ? t(vi.board.bonus, { qty: order.bonus.qty, item: itemName(order.bonus.itemId) }) : null,
        deliver: {
          label: vi.board.deliver,
          reason: lacking.length > 0 ? t(vi.board.missing, { what: lacking.map((l) => itemName(l.itemId)).join(', ') }) : deliverError ? vi.error[deliverError] : null,
          run: deliverRun,
        },
        reroll: {
          label: t(vi.board.reroll, { gems: rules.orders.rerollGems }),
          reason: rerollError === 'INSUFFICIENT_GOLD' ? vi.board.noGems : rerollError ? vi.error[rerollError] : null,
          run: rerollRun,
        },
      },
    ];
  });
  const open = Math.max(0, slotCount(goals.view(world).worldDevelopment, rules.orders) - cards.length);
  const nextAt = world.goals.board.nextAt;
  const when = nextAt === null ? vi.board.full : nextAt <= now ? vi.board.nextSoon : t(vi.board.nextIn, { time: formatDuration(nextAt - now) });
  return { hint: vi.board.hint, cards, empty: Array.from({ length: open }, () => `${vi.board.emptySlot} · ${when}`) };
}

// ---- Daily goals, login reward, achievements -----------------------------------------------------------------------

export interface DailyGoalVm {
  text: string;
  progress: string;
  /** 0..100 */
  percent: number;
  reward: string;
  status: 'working' | 'ready' | 'claimed';
  claim: ActionVm;
}

export interface DailyGoalsVm {
  goals: DailyGoalVm[];
  bonus: { title: string; reward: string; claim: ActionVm; claimed: boolean };
}

export function dailyGoalsVm(world: WorldSave, goals: Goals, now: number): DailyGoalsVm {
  const { daily } = world.goals;
  const stats = world.progression.stats;
  const list = daily.goals.map((g, index): DailyGoalVm => {
    const done = goalProgress(g, stats);
    const run = goals.claimGoal(index);
    const template = (vi.goals.daily.templates as Record<string, string>)[g.id] ?? g.id;
    return {
      text: t(template, { n: g.target }),
      progress: t(vi.goals.daily.progress, { current: formatInt(done), target: formatInt(g.target) }),
      percent: Math.round((done / g.target) * 100),
      reward: t(vi.goals.daily.reward, { coins: formatInt(g.coins) }),
      status: g.claimed ? 'claimed' : g.reached ? 'ready' : 'working',
      claim: { label: vi.goals.daily.claim, reason: g.claimed ? vi.goals.daily.claimed : g.reached ? null : t(vi.goals.daily.progress, { current: formatInt(done), target: formatInt(g.target) }), run },
    };
  });
  const run = goals.claimBonus();
  const error = dryRun(world, run, now);
  return {
    goals: list,
    bonus: {
      title: t(vi.goals.daily.bonusTitle, { count: list.length || CONTENT.goals.daily.count }),
      reward: t(vi.goals.daily.bonusReward, { coins: formatInt(CONTENT.goals.daily.bonus.coins), xp: CONTENT.goals.daily.bonus.xp }),
      claimed: daily.bonusClaimed,
      claim: { label: vi.goals.daily.bonusClaim, reason: daily.bonusClaimed ? vi.goals.daily.bonusClaimed : error ? vi.goals.daily.bonusHint : null, run },
    },
  };
}

export interface LoginDayVm {
  label: string;
  reward: string;
  /** done = taken in the current streak, next = what the button gives, later = still ahead. */
  state: 'done' | 'next' | 'later';
}

export interface LoginVm {
  days: LoginDayVm[];
  streak: string;
  /** Null once today's reward is taken. */
  claim: WorldAction | null;
}

export function loginVm(world: WorldSave, goals: Goals, day: number): LoginVm {
  const rules = CONTENT.daily;
  const daily = world.progression.daily;
  const open = daily.lastDay === null || day > daily.lastDay;
  // Position in the cycle: the claim would reach `streak`; already claimed shows the last one.
  const streak = open ? nextStreak(daily, day) : daily.streak;
  const cycle = rules.REWARDS.length;
  const start = Math.floor((Math.max(1, streak) - 1) / cycle) * cycle; // first day of this cycle
  const days = rules.REWARDS.map((_, i): LoginDayVm => {
    const n = start + i + 1;
    const state = n < streak || (!open && n === streak) ? 'done' : n === streak ? 'next' : 'later';
    return { label: t(vi.daily.day, { n }), reward: rewardText(loginReward(n, rules)), state };
  });
  const current = open ? (daily.lastDay === day - 1 ? daily.streak : 0) : streak;
  return { days, streak: t(vi.daily.streak, { n: current }), claim: open ? goals.claimLogin(day) : null };
}

export interface AchievementVm {
  id: string;
  name: string;
  progress: string;
  percent: number;
  reward: string;
  status: 'claimable' | 'claimed' | 'locked';
  claim: ActionVm;
}

export function achievementsVm(world: WorldSave, goals: Goals): { summary: string; items: AchievementVm[] } {
  const view = goals.achievementView(world);
  const totals = goals.totals();
  const names = vi.achievements as Record<string, string>;
  const items = goals.rules.achievements.map((d): AchievementVm => {
    const target = targetOf(d, totals);
    const finite = Number.isFinite(target);
    const current = finite ? Math.min(metricValue(d.metric, view), target) : metricValue(d.metric, view);
    const claimed = world.progression.claimed[d.id] !== undefined;
    return {
      id: d.id,
      name: names[d.id] ?? d.id,
      progress: t(vi.achievements.progress, { current: formatInt(current), target: finite ? formatInt(target) : '?' }),
      percent: finite ? Math.round((current / target) * 100) : 0,
      reward: d.xp > 0 ? t(vi.achievements.rewardXp, { gems: d.gems, xp: d.xp }) : t(vi.achievements.reward, { gems: d.gems }),
      status: claimed ? 'claimed' : finite && current >= target ? 'claimable' : 'locked',
      claim: { label: vi.achievements.claim, reason: claimed ? vi.achievements.claimed : finite && current >= target ? null : vi.error.ACHIEVEMENT_LOCKED, run: goals.claimAchievement(d.id) },
    };
  });
  // Claimable first, then in progress, claimed last; config order inside each.
  const rank = { claimable: 0, locked: 1, claimed: 2 } as const;
  items.sort((a, b) => rank[a.status] - rank[b.status]);
  const done = items.filter((i) => i.status !== 'locked').length;
  return { summary: t(vi.achievements.summary, { done, total: items.length }), items };
}

/** Rewards waiting across the goals: the number on the dock dot (today's login gift counts as one). */
export function goalsDot(world: WorldSave, goals: Goals, day: number): number {
  const daily = world.progression.daily;
  const login = daily.lastDay === null || day > daily.lastDay ? 1 : 0;
  return goals.claimableCount(world) + login;
}

// ---- Codex ---------------------------------------------------------------------------------------------------------

export interface CodexEntryVm {
  id: string;
  name: string;
  thumb: string | null;
  found: boolean;
  rarity: string | null;
}

export interface CodexKindVm {
  id: string;
  name: string;
  progress: string;
  entries: CodexEntryVm[];
}

export interface MilestoneVm {
  id: string;
  label: string;
  reward: string;
  status: 'claimable' | 'claimed' | 'locked';
  claim: ActionVm;
}

export interface CodexVm {
  total: string;
  kinds: CodexKindVm[];
  milestones: MilestoneVm[];
}

export function codexVm(world: WorldSave, goals: Goals, kinds: readonly CodexKind[], assets: AssetRegistry | null): CodexVm {
  const found = world.collection.discovered;
  const { total } = codexCounts(found);
  const all = kinds.reduce((n, k) => n + k.entries.length, 0);
  const ready = new Set(claimableMilestones(goals.rules.codex, total, world.collection.claimed).map((m) => m.id));
  return {
    total: t(vi.codex.total, { found: total, total: all }),
    kinds: kinds.map((k): CodexKindVm => {
      const got = new Set(found[k.id] ?? []);
      return {
        id: k.id,
        name: k.name,
        progress: t(vi.codex.progress, { found: k.entries.filter((e) => got.has(e.id)).length, total: k.entries.length }),
        entries: k.entries.map((e): CodexEntryVm => ({
          id: e.id,
          name: got.has(e.id) ? e.name : vi.codex.undiscovered,
          thumb: e.artId ? (assets?.url(e.artId) ?? null) : null,
          found: got.has(e.id),
          rarity: e.rarity ?? null,
        })),
      };
    }),
    milestones: goals.rules.codex.milestones.map((m): MilestoneVm => {
      const claimed = world.collection.claimed.includes(m.id);
      const parts = [m.coins > 0 ? `${formatInt(m.coins)} ${vi.plazaBar.coins}` : '', m.gems > 0 ? `${m.gems} ${vi.plazaBar.gems}` : '', m.xp > 0 ? `${m.xp} KN` : ''].filter(Boolean);
      return {
        id: m.id,
        label: t(vi.codex.milestone, { entries: m.entries }),
        reward: t(vi.codex.reward, { what: parts.join(', ') }),
        status: claimed ? 'claimed' : ready.has(m.id) ? 'claimable' : 'locked',
        claim: { label: vi.codex.claim, reason: claimed ? vi.codex.claimed : ready.has(m.id) ? null : vi.error.ACHIEVEMENT_LOCKED, run: goals.claimMilestone(m.id) },
      };
    }),
  };
}

