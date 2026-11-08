# 055 — The Rift by the day, with a local scoreboard (D4)

- The seed of a Rift trip is the game day's (`riftDaySeed(riftDay)`, from the injected clock + local offset), so every trip of a day faces the same floors, as the day's rule already did. A new day gives new floors.
- Each finished trip (win, retreat or loss) writes a row `{day, floor, at, result}` to `rift.board` of the Adventure slice (newest first, 20 rows). The camp panel between floors shows the best five. Offline, local only; nothing is sent anywhere.
- Save: Adventure slice v8 (migration 7 → 8 adds an empty `board`). No art (decision 017).
