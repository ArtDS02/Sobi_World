# Admin upgrade log

Branch `admin-upgrade` (from `overnight-hardening`). Baseline before this branch: only the two known slow tests fail (simulation 30-day under load, assetsCheck 80 s). The plan said 8 failing tests; on a clean run the count is 2.

## Decisions
- Step 1: defaults flipped in `defaultSettings` and `newGame`; no migration touches existing saves (test proves it). Admin overview shows a read-only line; the editor comes with step 8.2.
