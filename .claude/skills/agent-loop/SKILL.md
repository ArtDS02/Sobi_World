---
name: agent-loop
description: >-
  Runs a Sobi World multi-agent loop end to end for a large, multi-step task (a map set, a batch of battle skills,
  a feature across many files): plan → research → design (opus, once) → per unit: code (sonnet) → check (haiku) →
  review (sonnet, visible work only) → fix (≤3 rounds, opus on round 3) → commit → retrospective. Keeps state on
  disk (docs/agent-loop/<task>/STATE.md) so "tiếp tục việc còn đang dang dở" resumes without redoing steps. Use
  for "/agent-loop <task>", "chạy vòng lặp agent cho …", "tiếp tục loop", or any big task CLAUDE.md routes to
  docs/AGENT_LOOP.md. Not for small fixes (≤ a few files, clear how) — do those directly.
argument-hint: "<mô tả task> | tiếp tục"
---

# /agent-loop

You are the **Chỉ đạo** (orchestrator). You plan, brief, read short reports, update STATE, commit, and decide
when to stop. You do not write feature code, do not open screenshots, and do not re-read whole files an agent
already summarised. Answers to the owner: Vietnamese, AGENT_RULES §7 format. Lessons behind every rule:
`docs/agent-loop/LESSONS.md`.

## 0. Start

1. Argument is `tiếp tục` (or the owner says "tiếp tục việc còn đang dang dở") → go to **§6 Resume**. Stop here.
2. Read `docs/AGENT_RULES.md`, then only the `PROGRESS.md` section about this area (grep the heading; never the
   whole file into a brief). Check `git status --short`, `git log --oneline -5`, current branch.
3. Small task (≤ ~4 files, approach obvious, nothing visible to judge) → tell the owner in one line and do it
   directly, no loop.
4. Pick `<task>` slug (kebab-case). Create `docs/agent-loop/<task>/STATE.md` from `references/state.md` now.
5. Dirty tree you did not make → list it in STATE "Ghi chú", never commit or delete it.

## 1. The flow

| # | Step | Agent · model | Input | Output | Gate to pass | Max | Escalate to owner when |
|---|---|---|---|---|---|---|---|
| P | Plan | Chỉ đạo | owner request, rules, area docs | STATE: units, order, pilot, threshold, rubric, known reds | units each ≤ 1 coder round of work (~40 min / ~250k) | — | scope / gameplay / save change, new art, unclear goal |
| B | Baseline | checker · haiku | brief K0 | known-red list in STATE | — | 1 | reds you cannot explain |
| R | Research | Explore · sonnet (haiku for pure listing). It has no Write tool: it **returns** the text and **you** write `research.md` with Write (its own Bash / PowerShell writes lost the Vietnamese diacritics) | brief R | `docs/agent-loop/<task>/research.md` ≤ 60 lines | names real files / ids / scores to reuse | 1 | — |
| D | Design | designer · **opus** | brief D + research.md | `design.md`: per-unit contract with numbered, **measurable** checks | every check verifiable from a screenshot, a number or a test | 1 (+1 revise) | "Cần chủ dự án quyết" not empty; decision needed before `content/` |
| C | Code | coder · sonnet | brief C (unit) | code + report file + contract checklist | self-check green; every PHẢI THẤY marked built | — | coder says the design cannot be built |
| K | Check | checker · haiku | brief K (commands verbatim) | XANH / ĐỎ + new failures only | `npm run check` green vs baseline; capture done if visible | 2 per round | red that is pre-existing but unknown |
| V | Review | reviewer · sonnet, **fresh per unit** | design.md checks, shots dir, rubric, threshold | score + numbered defects | score ≥ threshold **and** hard rules hold | — | — |
| F | Fix | same coder (SendMessage); round 3 = **new opus coder** | reviewer list verbatim (or checker failure) | as C | as K + V | 3 rounds / unit | 3 rounds failed → stop that unit, report |
| M | Commit | Chỉ đạo | green K (+ passing V) | one commit per unit, STATE updated in it | checker green **after the last edit**, incl. your own edits | — | push / merge only if the owner asked |
| T | Retro | Chỉ đạo | STATE, scores, token/time per agent | LESSONS.md append, PROGRESS entry, §7 report | every lesson cites a file or commit | 1 | — |

Order: P → B → R → D → **pilot unit** (C → K → V → F… → M) → remaining units, each "not lower than the pilot"
(C → K → V → F… → M) → T. Units after the pilot may run two at a time only in `isolation: "worktree"`, each
worktree with its own `npm ci` (never a junction / symlink to `node_modules`).

Skip rules: no visible output → skip V (and R if the area is well known). Pure bug fix → skip D; the brief
holds the acceptance checks. Owner gate in the plan (G0, G1…) → stop after the pilot and wait.

## 2. Hard rules (each one cost a round before — LESSONS.md)

1. **Briefs from templates** in `references/briefs.md`; fill the slots, do not rewrite. Brief = goal, files to
   read (paths, line ranges), files allowed to change, checks, known reds, report path, time limits.
2. Sub-agents read only what the brief names. Never `PROGRESS.md`, `docs/archive/`, `asset/`.
3. **Fresh reviewer per unit**, fresh coder per unit. Continue an agent only inside its own unit.
4. **Review only a complete unit**: the coder report marks every PHẢI THẤY item `✅ dựng` or `⏳ chưa`; any `⏳`
   → back to the coder, no capture, no review.
5. **Escalate the model early**: the same visual defect reported in two consecutive reviews → round 3 now,
   opus coder, even if the round count is not used up.
6. **Measurements on disk**: agents write numbers (FPS + adapter name, scores, timings) to
   `art_inbox/agent-loop/<task>/<unit>/v<n>/report.md` (gitignored). A lost hand-back loses nothing.
   **Verify, don't trust**: after each hand-back `ls` the report path; missing → paste the hand-back there
   yourself (a coder claimed it wrote the file and had not — LESSONS §6). Same for `research.md`.
6b. **Contract ✅ means observed**, not "written": a flag or command marked ✅ must have been run. An item
   the coder built but did not run goes to the checker brief as an explicit command.
7. **One capture dir per round** (`…/<unit>/v<n>/`); reviewers never see an older round's images.
8. **Hard time limits** in every brief for long commands (test suite 10 min, e2e 15 min, capture 10 min);
   run them in the background with a timeout. A hang is reported, not waited out.
9. **You never open images** and never run status-poking commands in a loop; read the agent's report and
   `git diff --stat`. Open diff hunks only for save, `src/core/`, money, `content/`.
10. **Any edit you make yourself** (even a test timeout) goes through the checker (or at least
    `npm run typecheck` + the touched tests) before commit.
11. Perf numbers name the GPU: `ANIM_GPU=high` (discrete) / `low` (integrated); the report prints the adapter.
12. STATE is written **before** each hand-off and **right after** each report — one line per report, with
    the time from `date +%H:%M` (never estimated) and the agent's tokens / minutes from its completion notice.
    Put `t=$(date +%H:%M)` **in the same command** that writes STATE and use `$t`; never type a time.
13. **Before an owner gate, verify the design mechanically**: every id / lore key / enemy / slot the design cites
    exists in `content/`, new ids and names do not collide (one `node -e` script). Send the gate only when clean.

## 3. Rubrics and thresholds (write the chosen one into design.md)

| Work | Rubric | Threshold |
|---|---|---|
| Adventure map / scene | `docs/maps/MAP_SCENE_STANDARD.md` §8 (5 × 2) | > 7,5 and criterion 2 ≥ 1,5 |
| Battle skill VFX | `docs/SKILL_ANIMATION_STANDARD.md` §7 | ≥ max(7, lowest approved score of the same element and attack kind); ults ≥ 7,5 |
| UI / screen | design.md checks + AGENT_RULES §8 (placeholder OK before GĐ14) | all checks ✅ |
| Logic only | tests named in design.md | all green, regression test red without the fix |

The owner's score is final. The reviewer reads the threshold from design.md, never from memory.

## 4. Cost guard

Typical cost (forest-diorama): coder 150–280k tokens / round, checker 12–30k, fresh reviewer 75–90k,
designer once. Small logic unit (skill-audit-tool): research 80k, coder 44k, checker 16k. Warning signs → act:
- coder round > 300k or > 50 min → the unit is too big; split it in STATE.
- reviewer > 120k → you reused it across units; open a fresh one.
- your own context passes ~250k → write STATE, finish the current unit, tell the owner to continue in a new
  session with `/agent-loop tiếp tục`.

## 5. Commit

- Per unit, after K green (and V passing): `git add` only the unit's files + STATE (+ design / research the
  first time). Message: `<type>(<scope>): <unit> - <what changed> (review x.x)`; trailer per the session's
  attribution reminder.
- Never commit files listed in STATE "Ghi chú" as not ours; never `--no-verify`; never force-push; push only
  when the owner asked.

## 6. Resume ("tiếp tục")

1. Read only: newest `docs/agent-loop/*/STATE.md` (by mtime, "Đang làm" not "—"), `git log --oneline -10`,
   `git status --short`. Do not re-plan, do not re-read docs summarised in STATE.
2. Reconcile:
   - in "Xong" with a commit → skip;
   - "Đang làm" without a commit but with changes → checker on the partial work; green → commit and move on;
     red → **new** coder: "Brief đang chạy" + "phần dở đã có, chỉ hoàn thiện" + checker failures;
   - "Đang làm" with no changes → re-send "Brief đang chạy" verbatim;
   - at review with shots but no score → review only.
3. Tell the owner 2–3 lines (where, what next) and continue without waiting.
4. STATE vs git disagree → trust git, fix STATE. Old agent IDs are dead after a crash → always new agents.

## 7. Finish

1. T: append to `docs/agent-loop/LESSONS.md` (what worked, what cost a round, with commit / file), add the
   `PROGRESS.md` entry (✅ / 🧪 / ⚠️ / 👉), STATE "Đang làm: — (VIỆC XONG)".
2. Report to the owner with `references/report.md` (AGENT_RULES §7 + score table + cost line).

## References

- `references/state.md` — STATE.md template.
- `references/briefs.md` — briefs K0, R, D, C, F, K, V (fill the slots).
- `references/design.md` — design.md template (per-unit contract, measurable checks, default KHÔNG ĐƯỢC).
- `references/report.md` — final report template.
- Agents: `.claude/agents/{designer,coder,checker,reviewer}.md`. Process doc: `docs/AGENT_LOOP.md`.
