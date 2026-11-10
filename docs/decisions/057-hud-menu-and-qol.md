# 057 — Right-hand HUD menu and quality-of-life items B1–B8 (temporary gameplay thaw of decision 021)

**Date:** 2026-11-10 · **Status:** Đã làm, đóng băng lại (done, frozen again 2026-11-10). Chủ dự án yêu cầu 2026-11-10. Work log: `docs/PLOT_UPGRADE_LOG.md` ("Tiến độ phần B").

## Scope (owner-requested, exactly these eight items; nothing else is unfrozen)
- **B1** Expandable HUD on the right edge of every Area (one small circle that drops a menu down): expand area / plots, upgrade area (Cloud, Garden), skin forge, shop, bag. The shop stall buildings leave the Cloud and Garden scenes; the shop opens from this menu.
- **B2** No quantity limits: the shop takes any quantity (number field + "Max"), the bag has no cap (decision 038 already said so; leftovers are removed). Festival purchase limits stay: they are a gameplay rule of their own.
- **B3** "Harvest hand" pointer over a harvestable flower (Cloud) / crop (Garden).
- **B4** Prettier Cloud caterpillar: an art batch only (`cloud-10-caterpillar`), same manifest ids.
- **B5** Admin: drag-and-drop layout for every Area; scene positions move to `content/<area>/layout.json`.
- **B6** Upgrade effect for a cloud tier / garden zone (presentation only, through FeedbackDirector).
- **B7** Automatic skin by time of day or by season per tier / zone (presentation; the save keeps the player's assignment).
- **B8** Effects intensity setting `off | light | full` (world settings).

## Rules that do not move
Money and Gems only through the ledger; every successful action emits a GameEvent; effects only through FeedbackDirector; `simulate()` stays deterministic (B6–B8 are presentation only); no save is lost. World save v13, Cloud slice v3 and Garden slice v2 are not released yet, so new fields are folded into those migrations instead of a new version number.

## Save changes
World save v13: `settings.effects`. Cloud slice v3: `tierSkinAuto`. Garden slice v2: `zoneSkinAuto`. Each with schema, migration and tests. The two slice fields are optional in the schema, so a slice written by a development build before they existed still loads.

## Freeze
Done 2026-11-10. The new laws joined decision 021's frozen list: right-hand HUD menu, unlimited purchase quantity and bag, automatic skin by time / season, effects intensity.

## What was built (details in `docs/PLOT_UPGRADE_LOG.md`, "Tiến độ phần B")
- **B5**: scene positions of the Cloud, Garden and Aquarium live in `content/<area>/layout.json`; admin page "Bố cục khu" (`#/area-layout`). The Farm and the Plaza keep their existing editor, the Adventure its map builder.
- **B6**: `fx_area_upgrade` through the feedback tables and the FeedbackDirector; the upgrade dialog closes after a successful upgrade so the effect is seen.
- **B7**: table `auto` in `content/shared/plotSkins.json`; a tier / zone on automatic shows the first wished skin the player owns, else the assigned one; the assignment is never changed.
