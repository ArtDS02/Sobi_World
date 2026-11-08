# 054 — Seasonal pig show (D3)

- A season is `seasonDays` (28) days of local game time (`showSeason`). Each pig may enter once per season; adult, healthy, not pregnant.
- Score = quality tier + rarity + traits (incl. the hidden one) + bond hearts + generation + family-tree depth + care, plus a jitter drawn from the injected `ctx.rng` (never `Math.random`). The score picks the place (1–3) or participation; every number is in `content/farm/show.json` (admin: Nội dung game › Hội thi heo).
- Prizes: Sobi Coin through the farm's `changeGold` and festival tokens through a farm-level ledger post (`currency: eventTokens`); both land in the world wallet via the farm lens (`FarmGame.tokens` is mirrored only while the wallet holds some, written back only when an action set it).
- Save: `areas.sobi_farm.showEntries` is optional, so no migration is needed (absent = nobody entered yet). The lens carries it through every farm action.
- UI: a "Dự thi" button in the pig panel with the reason when off ("Đã thi mùa này"…); toast + FeedbackDirector row for `SHOW_ENTERED`. No art (decision 017).
