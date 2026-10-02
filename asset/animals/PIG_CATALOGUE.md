# UN IN HOMEMADE — PIG CATALOGUE

> **Project:** Ủn Ỉn / UN IN HOMEMADE
> **Type:** Concept catalogue — **what** to draw. 116 pig concepts + 129 modular cosmetics.
> **Format, directions, states, naming, delivery:** `../ASSET_PRODUCTION_STANDARD_v1.md` — that document is normative and wins over anything here.
> **Game rules:** `../../UN_IN_GAME_SPEC_v4_SOLO.md`
> **Ready-to-paste generation prompts:** `../AI_ASSET_GENERATION_PACK.md`

---

# STATUS — REAL PROJECT STATE (A7 asset sync, 2026-10-02)

> This section is generated from the files that actually ship (`public/assets/pigs/base/`, manifest `pigs[]`,
> `src/core/config/speciesTable.ts`), not from design intent. Re-check it with the admin dashboard
> (`npm run admin` → *Kiểm tra dữ liệu*) after any art change.

**Totals:** 69 species in game (27 before A7 + 42 new) · 116 catalogue concepts · 59 source images in `asset/animals/asset/`.

| Status | Count | Meaning |
|---|---|---|
| ✅ COMPLETED | 27 | In game, every required asset present and valid (`assets:check`) |
| 🆕 NEW | 42 | Added in A7 from `asset/animals/asset/`; in game, every required asset present |
| 🟡 PARTIAL | 2 | Source art exists but does not match the concept — not in game, needs review/redraw |
| ⬜ NOT DESIGNED | 60 | Described here, no artwork anywhere yet |

**What "complete" means** (production standard §2, this file §1.2 — the standard is normative):

- **Right** = the one drawn view, 512 × 512, transparent, feet on the 82 % ground line.
- **Left** = runtime horizontal flip of Right (`✓ flip`). No file.
- **Front / Back** = never produced by the standard (`—`, not missing). A concept is not held back for them.
- **Adult** = the drawn sprite. **Baby** = the same sprite scaled ×0.6 at runtime (`FARM_VIEW.PIG_GROWTH_SCALE`). No file.
- **Sleep** frame is optional (DECISIONS Q5: idle + `fx_zzz`); no species ships one today.

## Catalogue concepts

| Concept | Art ID | Species ID | Theme | Baby | Adult | Left | Right | Front | Back | Status | Asset path |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Heo Hồng Cổ Điển | `pig_classic` | `PIG_EARTH_PINK` | Base / Classic Pigs | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_classic.png` |
| Heo Trắng | `pig_white` | `PIG_WHITE` | Base / Classic Pigs | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_white.png` |
| Heo Đen | `pig_black` | `PIG_BLACK` | Base / Classic Pigs | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_black.png` |
| Heo Nâu | `pig_brown` | `PIG_BROWN` | Base / Classic Pigs | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_brown.png` |
| Heo Đốm | `pig_spotted` | `PIG_SPOTTED` | Base / Classic Pigs | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_spotted.png` |
| Heo Em Bé | `pig_baby` | — | Base / Classic Pigs | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Tí Hon | `pig_tiny` | — | Base / Classic Pigs | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Mập | `pig_fat` | — | Base / Classic Pigs | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Bông | `pig_fluffy` | — | Base / Classic Pigs | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Tai Dài | `pig_long_ear` | — | Base / Classic Pigs | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Nông Dân | `pig_farmer` | `PIG_FARMER` | Vietnamese / Countryside Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_farmer.png` |
| Heo Áo Dài | `pig_ao_dai` | `PIG_AO_DAI` | Vietnamese / Countryside Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_ao_dai.png` |
| Heo Tết | `pig_tet` | `PIG_TET` | Vietnamese / Countryside Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_tet.png` |
| Heo Lân | `pig_lan` | `PIG_LAN` | Vietnamese / Countryside Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_lan.png` |
| Heo Ông Địa | `pig_ong_dia` | — | Vietnamese / Countryside Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Thổ Địa | `pig_tho_dia` | — | Vietnamese / Countryside Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Bánh Chưng | `pig_banh_chung` | `PIG_BANH_CHUNG` | Vietnamese / Countryside Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_banh_chung.png` |
| Heo Bánh Dày | `pig_banh_day` | — | Vietnamese / Countryside Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Làng Quê | `pig_village` | — | Vietnamese / Countryside Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Ngư Dân | `pig_fisherman` | — | Vietnamese / Countryside Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Làm Vườn | `pig_gardener` | — | Vietnamese / Countryside Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Cà Phê | `pig_coffee` | — | Vietnamese / Countryside Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Đầu Bếp | `pig_chef` | `PIG_CHEF` | Job / Everyday Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_chef.png` |
| Heo Bác Học | `pig_nerd` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Bác Sĩ | `pig_doctor` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Giáo Viên | `pig_teacher` | `PIG_TEACHER` | Job / Everyday Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_teacher.png` |
| Heo Thám Tử | `pig_detective` | `PIG_DETECTIVE` | Job / Everyday Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_detective.png` |
| Heo Doanh Nhân | `pig_business` | `PIG_BUSINESS` | Job / Everyday Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_business.png` |
| Heo CEO | `pig_ceo` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Họa Sĩ | `pig_artist` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Nhạc Công | `pig_musician` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Rock Star | `pig_rockstar` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Streamer | `pig_streamer` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Idol | `pig_influencer` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Cao Bồi | `pig_cowboy` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Cứu Hỏa | `pig_firefighter` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Phi Công | `pig_pilot` | — | Job / Everyday Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Phi Hành Gia | `pig_astronaut` | `PIG_ASTRONAUT` | Job / Everyday Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_astronaut.png` |
| Heo Cướp Biển | `pig_pirate` | `PIG_PIRATE` | Adventure Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_pirate.png` |
| Heo Ninja | `pig_ninja` | `PIG_NINJA` | Adventure Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_ninja.png` |
| Heo Samurai | `pig_samurai` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Shogun | `pig_shogun` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Hiệp Sĩ | `pig_knight` | `PIG_KNIGHT` | Adventure Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_knight.png` |
| Heo Viking | `pig_viking` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Pháp Sư | `pig_wizard` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Phù Thủy | `pig_witch` | `PIG_WITCH` | Adventure Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_witch.png` |
| Heo Giả Kim | `pig_alchemist` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Cung Thủ | `pig_archer` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Thám Hiểm | `pig_explorer` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Siêu Anh Hùng | `pig_superhero` | `PIG_SUPERMAN` | Adventure Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_superhero.png` |
| Heo Phản Diện | `pig_villain` | — | Adventure Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Cơ Giáp | `pig_robot` | `PIG_ROBOT` | Robot / Sci-Fi Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_robot.png` |
| Heo Mecha | `pig_mecha` | `PIG_MECHA` | Robot / Sci-Fi Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_mecha.png` |
| Heo Cyborg | `pig_cyborg` | `PIG_CYBORG` | Robot / Sci-Fi Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_cyborg.png` |
| Heo Android | `pig_android` | — | Robot / Sci-Fi Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Battlebot | `pig_battlebot` | `PIG_BATTLEBOT` | Robot / Sci-Fi Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_battlebot.png` |
| Heo AI | `pig_ai` | — | Robot / Sci-Fi Collection | — | ✗ | ✗ | ✗ | — | — | 🟡 PARTIAL | `asset/animals/asset/pig_ai.png` (review) |
| Heo Không Gian | `pig_space` | — | Robot / Sci-Fi Collection | — | ✗ | ✗ | ✗ | — | — | 🟡 PARTIAL | `asset/animals/asset/pig_space.png` (review) |
| Heo Ngoài Hành Tinh | `pig_alien` | `PIG_ALIEN` | Robot / Sci-Fi Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_alien.png` |
| Heo UFO | `pig_ufo` | `PIG_UFO` | Robot / Sci-Fi Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_ufo.png` |
| Heo Khai Khoáng | `pig_miningbot` | — | Robot / Sci-Fi Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Steampunk | `pig_steampunk` | — | Robot / Sci-Fi Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Phản Lực | `pig_jet` | — | Robot / Sci-Fi Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Rồng | `pig_dragon` | `PIG_DRAGON` | Fantasy / Dragon Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_dragon.png` |
| Heo Thần Long | `pig_thienlong` | `PIG_MYTHICAL` | Fantasy / Dragon Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_thienlong.png` |
| Heo Phượng Hoàng | `pig_phoenix` | `PIG_PHOENIX` | Fantasy / Dragon Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_phoenix.png` |
| Heo Kỳ Lân | `pig_unicorn` | `PIG_UNICORN` | Fantasy / Dragon Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_unicorn.png` |
| Heo Hồ Ly | `pig_kitsune` | `PIG_KITSUNE` | Fantasy / Dragon Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_kitsune.png` |
| Heo Pegasus | `pig_pegasus` | `PIG_PEGASUS` | Fantasy / Dragon Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_pegasus.png` |
| Heo Mỹ Nhân Ngư | `pig_mermaid` | — | Fantasy / Dragon Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Tiên | `pig_fairy` | — | Fantasy / Dragon Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Golem | `pig_golem` | — | Fantasy / Dragon Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Elf | `pig_elf` | — | Fantasy / Dragon Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Oni | `pig_oni` | `PIG_ONI` | Mythology Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_oni.png` |
| Heo Zeus | `pig_zeus` | `PIG_ZEUS` | Mythology Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_zeus.png` |
| Heo Poseidon | `pig_poseidon` | — | Mythology Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Hades | `pig_hades` | — | Mythology Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Athena | `pig_athena` | — | Mythology Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Valkyrie | `pig_valkyrie` | `PIG_VALKYRIE` | Mythology Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_valkyrie.png` |
| Heo Minotaur | `pig_minotaur` | — | Mythology Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Medusa | `pig_medusa` | — | Mythology Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Thor | `pig_thor` | `PIG_THOR` | Mythology Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_thor.png` |
| Heo Loki | `pig_loki` | — | Mythology Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Bí Ngô | `pig_pumpkin` | `PIG_PUMPKIN` | Horror / Halloween Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_pumpkin.png` |
| Heo Ma | `pig_ghost` | `PIG_GHOST` | Horror / Halloween Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_ghost.png` |
| Heo Ma Cà Rồng | `pig_vampire` | `PIG_VAMPIRE` | Horror / Halloween Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_vampire.png` |
| Heo Zombie | `pig_zombie` | `PIG_ZOMBIE` | Horror / Halloween Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_zombie.png` |
| Heo Xác Ướp | `pig_mummy` | — | Horror / Halloween Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Frankenstein | `pig_franken` | — | Horror / Halloween Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Xương | `pig_skeleton` | — | Horror / Halloween Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Người Sói | `pig_werewolf` | — | Horror / Halloween Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Đi Biển | `pig_beach` | — | Seasonal Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Lướt Sóng | `pig_surfer` | `PIG_SURFER` | Seasonal Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_surfer.png` |
| Heo Thợ Lặn | `pig_diver` | `PIG_DIVER` | Seasonal Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_diver.png` |
| Heo Kem | `pig_icecream` | `PIG_ICECREAM` | Seasonal Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_icecream.png` |
| Heo Noel | `pig_christmas` | — | Seasonal Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Người Tuyết | `pig_snowman` | — | Seasonal Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Tuần Lộc | `pig_reindeer` | — | Seasonal Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Elf Noel | `pig_elf_christmas` | — | Seasonal Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Hộp Quà | `pig_gift` | — | Seasonal Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Bánh Kem | `pig_cake` | — | Food / Fun Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Donut | `pig_donut` | `PIG_DONUT` | Food / Fun Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_donut.png` |
| Heo Burger | `pig_burger` | `PIG_BURGER` | Food / Fun Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_burger.png` |
| Heo Trà Sữa | `pig_boba` | `PIG_BOBA` | Food / Fun Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_boba.png` |
| Heo Dưa Hấu | `pig_watermelon` | `PIG_STRIPED_MELON` | Food / Fun Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_watermelon.png` |
| Heo Bắp | `pig_corn` | — | Food / Fun Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Dâu | `pig_strawberry` | — | Food / Fun Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Buồn Ngủ | `pig_sleepy` | `PIG_SLEEPY` | Funny Personality Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_sleepy.png` |
| Heo Lười | `pig_lazy` | `PIG_LAZY` | Funny Personality Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_lazy.png` |
| Heo Cáu | `pig_angry` | `PIG_ANGRY` | Funny Personality Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_angry.png` |
| Heo Mít Ướt | `pig_crybaby` | `PIG_CRYBABY` | Funny Personality Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_crybaby.png` |
| Heo Ngầu | `pig_cool` | — | Funny Personality Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Đại Gia | `pig_rich` | `PIG_RICH` | Funny Personality Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_rich.png` |
| Heo Ông | `pig_grandpa` | `PIG_GRANDPA` | Funny Personality Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_grandpa.png` |
| Heo Bà | `pig_grandma` | — | Funny Personality Collection | ✗ | ✗ | ✗ | ✗ | — | — | ⬜ NOT DESIGNED | — |
| Heo Quẩy | `pig_party` | `PIG_PARTY` | Funny Personality Collection | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | 🆕 NEW | `pigs/base/pig_party.png` |

## Species in game that are not catalogue concepts (A3 animal species)

| Concept | Art ID | Species ID | Theme | Baby | Adult | Left | Right | Front | Back | Status | Asset path |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Heo Rừng | `pig_boar` | `PIG_BOAR` | Species A3 (Wild) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_boar.png` |
| Heo Cừu | `pig_sheep` | `PIG_SHEEP` | Species A3 (Meadow) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_sheep.png` |
| Heo Ong | `pig_bee` | `PIG_BEE` | Species A3 (Meadow) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_bee.png` |
| Heo Cánh Cụt | `pig_penguin` | `PIG_PENGUIN` | Species A3 (Water) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_penguin.png` |
| Heo Trâu | `pig_buffalo` | `PIG_BUFFALO` | Species A3 (Farm) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_buffalo.png` |
| Heo Hươu Sao | `pig_deer` | `PIG_DEER` | Species A3 (Meadow) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_deer.png` |
| Heo Hổ | `pig_tiger` | `PIG_TIGER` | Species A3 (Wild) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_tiger.png` |
| Heo Gấu Trúc | `pig_panda` | `PIG_PANDA` | Species A3 (Wild) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_panda.png` |
| Heo Kỳ Giông | `pig_axolotl` | `PIG_AXOLOTL` | Species A3 (Water) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_axolotl.png` |
| Heo Hướng Dương | `pig_sunflower` | `PIG_SUNFLOWER` | Species A3 (Meadow) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_sunflower.png` |
| Heo Nhím | `pig_hedgehog` | `PIG_HEDGEHOG` | Species A3 (Wild) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_hedgehog.png` |
| Heo Rùa | `pig_turtle` | `PIG_TURTLE` | Species A3 (Water) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_turtle.png` |
| Heo Cá Chép | `pig_koi` | `PIG_KOI` | Species A3 (Water) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_koi.png` |
| Heo Rồng Con | `pig_dragonling` | `PIG_DRAGONLING` | Species A3 (Mythic) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_dragonling.png` |
| Heo Ngân Hà | `pig_galaxy` | `PIG_GALAXY` | Species A3 (Mythic) | ✓ ×0.6 | ✓ | ✓ flip | ✓ | — | — | ✅ COMPLETED | `pigs/base/pig_galaxy.png` |

## Source inventory — `asset/animals/asset/` (59 files)

Every file was checked visually (all are 512², right-facing side view, feet on 82 %). Duplicates and alternative
versions were **not** copied over live art; the live file keeps its name, sources stay untouched.

| File | Concept | In game | Note / review |
|---|---|---|---|
| `pig_ai.png` | `pig_ai` | — | Hình chỉ là bóng đen viền tím — không thấy lõi AI/hologram như concept; chưa dùng, cần vẽ lại hoặc user xác nhận |
| `pig_alien.png` | `pig_alien` | ✓ dùng → `pig_alien` |  |
| `pig_alien_v2.png` | `pig_alien` | — | Bản thay thế (xanh ngọc, bộ đồ phi hành) — game dùng pig_alien (tím, ăng-ten đúng concept) |
| `pig_angry.png` | `pig_angry` | ✓ dùng → `pig_angry` |  |
| `pig_ao_dai.png` | `pig_ao_dai` | ✓ dùng → `pig_ao_dai` |  |
| `pig_ao_dai_v2.png` | `pig_ao_dai` | — | Bản thay thế (áo dài xanh) — game dùng pig_ao_dai (đỏ/vàng) |
| `pig_astronaut.png` | `pig_astronaut` | ✓ dùng → `pig_astronaut` |  |
| `pig_banh_chung.png` | `pig_banh_chung` | ✓ dùng → `pig_banh_chung` |  |
| `pig_battlebot.png` | `pig_battlebot` | ✓ dùng → `pig_battlebot` |  |
| `pig_boba.png` | `pig_boba` | ✓ dùng → `pig_boba` |  |
| `pig_burger.png` | `pig_burger` | ✓ dùng → `pig_burger` |  |
| `pig_business.png` | `pig_business` | ✓ dùng → `pig_business` |  |
| `pig_chef.png` | `pig_chef` | ✓ dùng → `pig_chef` |  |
| `pig_classic.png` | `pig_classic` | ✓ dùng → `pig_classic` (đã có từ trước, giống hệt) |  |
| `pig_crybaby.png` | `pig_crybaby` | ✓ dùng → `pig_crybaby` |  |
| `pig_cyborg.png` | `pig_cyborg` | ✓ dùng → `pig_cyborg` |  |
| `pig_detective.png` | `pig_detective` | ✓ dùng → `pig_detective` |  |
| `pig_diver.png` | `pig_diver` | ✓ dùng → `pig_diver` |  |
| `pig_donut.png` | `pig_donut` | ✓ dùng → `pig_donut` |  |
| `pig_dragon.png` | `pig_dragon` | ✓ dùng → `pig_dragon` |  |
| `pig_dragonling.png` | `pig_dragonling` | ✓ dùng → `pig_dragonling` (đã có từ trước, giống hệt) |  |
| `pig_farmer.png` | `pig_farmer` | ✓ dùng → `pig_farmer` |  |
| `pig_ghost.png` | `pig_ghost` | ✓ dùng → `pig_ghost` |  |
| `pig_grandpa.png` | `pig_grandpa` | ✓ dùng → `pig_grandpa` |  |
| `pig_icecream.png` | `pig_icecream` | ✓ dùng → `pig_icecream` |  |
| `pig_icecream_v2.png` | `pig_icecream` | — | Bản thay thế (viên kem trên đầu) — game dùng pig_icecream (ốc quế) |
| `pig_kitsune.png` | `pig_kitsune` | ✓ dùng → `pig_kitsune` |  |
| `pig_knight_v2.png` | `pig_knight` | ✓ dùng → `pig_knight` |  |
| `pig_lan.png` | `pig_lan` | ✓ dùng → `pig_lan` |  |
| `pig_lazy.png` | `pig_lazy` | ✓ dùng → `pig_lazy` |  |
| `pig_mecha.png` | `pig_mecha` | ✓ dùng → `pig_mecha` |  |
| `pig_mecha_v2.png` | `pig_mecha` | — | Bản thay thế (giáp người máy đứng 2 chân, phá silhouette heo) — game dùng pig_mecha |
| `pig_mecha_v3.png` | `pig_mecha` | — | Bản thay thế (giáp bạc kiểu phi hành) — game dùng pig_mecha |
| `pig_ninja.png` | `pig_ninja` | ✓ dùng → `pig_ninja` |  |
| `pig_oni.png` | `pig_oni` | — | Bản thay thế (heo hồng sừng đỏ) — game dùng pig_oni_v2 (đỏ, sừng, răng nanh: khớp concept) |
| `pig_oni_v2.png` | `pig_oni` | ✓ dùng → `pig_oni` |  |
| `pig_party.png` | `pig_party` | ✓ dùng → `pig_party` |  |
| `pig_pegasus.png` | `pig_pegasus` | ✓ dùng → `pig_pegasus` |  |
| `pig_pirate.png` | `pig_pirate` | ✓ dùng → `pig_pirate` |  |
| `pig_pumpkin.png` | `pig_pumpkin` | — | Bản khác pig_pumpkin đang dùng (art sheet A3) — không ghi đè; user duyệt |
| `pig_rich.png` | `pig_rich` | ✓ dùng → `pig_rich` |  |
| `pig_robot_v2.png` | `pig_robot` | — | Ứng viên thay pig_robot (giáp xanh, mắt LED) — KHÔNG ghi đè art đang dùng; user duyệt |
| `pig_robot_v3.png` | `pig_robot` | — | Ứng viên thay pig_robot (bạc, cánh) — KHÔNG ghi đè; user duyệt |
| `pig_sleepy.png` | `pig_sleepy` | ✓ dùng → `pig_sleepy` |  |
| `pig_space.png` | `pig_space` | — | Heo tím trơn, không có đồ/thiết bị không gian; chưa dùng, cần vẽ lại hoặc user xác nhận |
| `pig_surfer.png` | `pig_surfer` | ✓ dùng → `pig_surfer` |  |
| `pig_teacher.png` | `pig_teacher` | ✓ dùng → `pig_teacher` |  |
| `pig_tet.png` | `pig_tet` | — | Heo dưa hấu đeo bảng chữ Tết — trùng thân pig_watermelon, không khớp concept áo đỏ/vàng; giữ pig_tet_v3 |
| `pig_tet_v3.png` | `pig_tet` | ✓ dùng → `pig_tet` |  |
| `pig_thienlong.png` | `pig_thienlong` | — | Bản khác pig_thienlong (đồ rồng cam) — không ghi đè; game giữ bản P0 cánh + vương miện |
| `pig_thor.png` | `pig_thor` | ✓ dùng → `pig_thor` |  |
| `pig_ufo.png` | `pig_ufo` | ✓ dùng → `pig_ufo` |  |
| `pig_unicorn.png` | `pig_unicorn` | — | Bản khác pig_unicorn (thân cầu vồng) — không ghi đè; user duyệt |
| `pig_valkyrie_v2.png` | `pig_valkyrie` | ✓ dùng → `pig_valkyrie` |  |
| `pig_vampire.png` | `pig_vampire` | ✓ dùng → `pig_vampire` |  |
| `pig_watermelon.png` | `pig_watermelon` | — | Bản khác pig_watermelon (không mầm lá — catalogue yêu cầu mầm lá) — giữ bản đang dùng |
| `pig_witch.png` | `pig_witch` | ✓ dùng → `pig_witch` |  |
| `pig_zeus.png` | `pig_zeus` | ✓ dùng → `pig_zeus` |  |
| `pig_zombie.png` | `pig_zombie` | ✓ dùng → `pig_zombie` |  |

Renamed on copy: `pig_knight_v2` → `pig_knight`, `pig_valkyrie_v2` → `pig_valkyrie`, `pig_tet_v3` → `pig_tet`,
`pig_oni_v2` → `pig_oni` (no other version in game, so the suffix is dropped — §29 naming).
To use an alternative later: admin → *Asset nguồn* → *Nhập vào game* (never overwrites) → assign it to a species.

---

# 0. DOCUMENT PURPOSE

This catalogue is the list of pig concepts and cosmetics. It does not define file format or production rules — those live in the production standard.

Two documents this file used to reference, `UN_IN_ASSET_LIST_v2_CHARACTERS_PROPS.md` and `UN_IN_ASSET_LIST_v3`, **do not exist and were never written**. Do not look for them and do not reconstruct them. Everything needed is in the four documents listed above.

The goal is a long-term collectible pig system rather than a simple list of character skins.

The asset architecture is:

```text
BASE PIG
   +
THEMATIC SKIN / BREED
   +
HEAD COSMETIC
   +
FACE COSMETIC
   +
BODY COSMETIC
   +
BACK COSMETIC
   +
HELD PROP
   +
EFFECT / AURA
```

A single cosmetic should be reusable across many pigs whenever possible.

Example:

```text
pig_farmer
+ acc_head_crown
+ acc_body_wings_fairy
= Farmer Angel Pig
```

```text
pig_robot
+ acc_head_witch
+ acc_body_cape_red
= Cyber Witch Pig
```

This modular approach should generate a large number of visual combinations without requiring a unique full-body sprite for every combination.

---

# 1. GLOBAL ART DIRECTION

## 1.1 Master Style

All pig assets should follow this visual language unless a collection explicitly overrides it.

```text
Cute 2D cartoon game art, chibi proportions, flat colors with soft cel-shading,
clean rounded outlines, warm pastel palette, friendly and playful personality,
casual mobile game aesthetic, Vietnamese countryside influence where appropriate,
consistent top-left lighting, readable silhouette, polished game-ready sprite,
no text, no letters, no watermark, no logo.
```

## 1.2 Character Format

Default pig skin:

- 512 × 512 px
- Transparent PNG
- Single character
- Full body
- Side view
- **Facing right — one direction only. Left is a runtime horizontal flip. Front and back views are never produced** (production standard §2)
- Neutral or happy expression
- Feet fully visible
- **All four feet resting on the same invisible ground line at y = 82% of the canvas.** Every pig in the catalogue shares this line, otherwise pigs sit at different heights and the farm looks broken
- Centered composition
- No ground/shadow baked into the asset
- No props that are not worn on the body
- No text
- No UI
- No watermark
- No background

**Second required frame — sleep.** Each pig in the P1 wave also ships `<pig_id>_sleep.png`: same pig lying down, eyes closed, same facing, identical palette and line weight. This is the one visual state that cannot be faked with a tween. The other seven states in the game spec (`idle`, `walk`, `eat`, `clean`, `happy`, `sick`, `pregnant`) are produced at runtime from the idle frame plus eight shared `fx_*` overlays — see production standard §3. Do **not** draw per-pig state frames beyond `_sleep`.

## 1.3 Cosmetic Format

Default cosmetic:

- 256 × 256 px
- Transparent PNG
- Single isolated item
- Designed for modular composition
- No baked pig body
- No background
- Clean edges
- Consistent lighting
- Anchor position defined in `anchors.json`

**Symmetry flag — required on every cosmetic.** Because pigs face left by horizontal flip, anything with a handedness breaks when mirrored: a one-eye item (`acc_head_pirate`), a prop held on one side (`acc_prop_*`, the chef's pan, the wizard's staff), asymmetric hair, a single earring.

- `symmetric: true` — flips freely, one file.
- `symmetric: false` — ships one extra mirrored file, `<id>_flip.png`, and the renderer picks by facing.

About 15 of the 129 cosmetics in this catalogue need the flip file, so the real cost of two facings is roughly **+12%**, not +300%. Set the flag in `assets.json` (production standard §7.2) at the same time as the art is delivered, never later.

## 1.4 Silhouette Rule

At gameplay scale, the pig must remain recognizable.

Avoid:

- Excessive tiny details
- Very thin accessories
- Objects completely covering the face
- Extremely wide accessories that destroy the pig silhouette
- Dark outlines that visually merge with other cosmetics

---

# 2. RARITY SYSTEM

| Rarity | Key | Meaning | Typical Use |
|---|---|---|---|
| Common | P1 | Simple, recognizable | Normal unlock |
| Rare | P2 | Strong theme/personality | Collection / event |
| Epic | P3 | Elaborate visual identity | Gacha / achievement |
| Legendary | P4 | Premium signature design | Major event / special reward |
| Mythic | P5 | Extremely distinctive | Ultra-rare collection |

### Recommended distribution

```text
P1 = 35%
P2 = 35%
P3 = 20%
P4 = 8%
P5 = 2%
```

These percentages are design targets, not mandatory production quantities.

---

# 3. BASE / CLASSIC PIGS

These are the foundation of the collection.

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_classic` | Heo Hồng Cổ Điển | Classic pink pig | P1 |
| `pig_white` | Heo Trắng | Cream-white pig | P1 |
| `pig_black` | Heo Đen | Cute black pig | P1 |
| `pig_brown` | Heo Nâu | Warm brown pig | P1 |
| `pig_spotted` | Heo Đốm | Pink body with dark spots | P1 |
| `pig_baby` | Heo Em Bé | Smaller body, oversized head | P1 |
| `pig_tiny` | Heo Tí Hon | Miniature pig proportions | P2 |
| `pig_fat` | Heo Mập | Round oversized body | P1 |
| `pig_fluffy` | Heo Bông | Extra fluffy silhouette | P2 |
| `pig_long_ear` | Heo Tai Dài | Long expressive ears | P1 |

---

# 4. VIETNAMESE / COUNTRYSIDE COLLECTION

The Vietnamese collection should reinforce the identity of the game.

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_farmer` | Heo Nông Dân | Nón lá/straw hat, overalls, straw in mouth | P1 |
| `pig_ao_dai` | Heo Áo Dài | Cute Vietnamese áo dài | P2 |
| `pig_tet` | Heo Tết | Red/gold New Year outfit | P2 |
| `pig_lan` | Heo Lân | Lion-dance inspired costume | P2 |
| `pig_ong_dia` | Heo Ông Địa | Festive red/gold character | P3 |
| `pig_tho_dia` | Heo Thổ Địa | Friendly earth-spirit interpretation | P3 |
| `pig_banh_chung` | Heo Bánh Chưng | Green square bánh chưng costume | P2 |
| `pig_banh_day` | Heo Bánh Dày | White round bánh dày-inspired costume | P2 |
| `pig_village` | Heo Làng Quê | Traditional rural clothing | P1 |
| `pig_fisherman` | Heo Ngư Dân | Straw hat, fishing basket | P1 |
| `pig_gardener` | Heo Làm Vườn | Gardening clothes and tools | P1 |
| `pig_coffee` | Heo Cà Phê | Vietnamese coffee seller theme | P2 |

---

# 5. JOB / EVERYDAY COLLECTION

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_chef` | Heo Đầu Bếp | Chef hat and apron | P1 |
| `pig_nerd` | Heo Bác Học | Round glasses, book/flask | P1 |
| `pig_doctor` | Heo Bác Sĩ | White coat, medical bag | P1 |
| `pig_teacher` | Heo Giáo Viên | Glasses, book, pointer | P1 |
| `pig_detective` | Heo Thám Tử | Detective hat, coat, magnifying glass | P1 |
| `pig_business` | Heo Doanh Nhân | Suit, tie, briefcase | P1 |
| `pig_ceo` | Heo CEO | Premium business suit | P2 |
| `pig_artist` | Heo Họa Sĩ | Beret, palette, brush | P1 |
| `pig_musician` | Heo Nhạc Công | Small instrument | P1 |
| `pig_rockstar` | Heo Rock Star | Guitar, sunglasses, jacket | P2 |
| `pig_streamer` | Heo Streamer | Headset and microphone | P2 |
| `pig_influencer` | Heo Idol | Camera/phone, fashionable outfit | P2 |
| `pig_cowboy` | Heo Cao Bồi | Cowboy hat and scarf | P1 |
| `pig_firefighter` | Heo Cứu Hỏa | Helmet and firefighter gear | P1 |
| `pig_pilot` | Heo Phi Công | Pilot cap and aviator glasses | P1 |
| `pig_astronaut` | Heo Phi Hành Gia | Full space suit | P2 |

---

# 6. ADVENTURE COLLECTION

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_pirate` | Heo Cướp Biển | Tricorne, eyepatch, belt | P2 |
| `pig_ninja` | Heo Ninja | Stealth suit, red headband | P2 |
| `pig_samurai` | Heo Samurai | Mini samurai armor | P2 |
| `pig_shogun` | Heo Shogun | Elaborate kabuto and armor | P3 |
| `pig_knight` | Heo Hiệp Sĩ | Silver armor and shield | P1 |
| `pig_viking` | Heo Viking | Horned helmet, shield | P2 |
| `pig_wizard` | Heo Pháp Sư | Star hat and magic staff | P1 |
| `pig_witch` | Heo Phù Thủy | Purple witch outfit | P2 |
| `pig_alchemist` | Heo Giả Kim | Potion bottles and coat | P2 |
| `pig_archer` | Heo Cung Thủ | Hood, bow and quiver | P2 |
| `pig_explorer` | Heo Thám Hiểm | Explorer hat, backpack | P1 |
| `pig_superhero` | Heo Siêu Anh Hùng | Mask and cape | P1 |
| `pig_villain` | Heo Phản Diện | Dark cape and mischievous look | P2 |

---

# 7. ROBOT / SCI-FI COLLECTION

This collection expands the original `pig_robot` into a complete technological universe.

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_robot` | Heo Cơ Giáp | Metallic body, cyan LEDs | P2 |
| `pig_mecha` | Heo Mecha | Chunky combat armor | P2 |
| `pig_cyborg` | Heo Cyborg | Organic + mechanical body | P2 |
| `pig_android` | Heo Android | Clean white synthetic body | P3 |
| `pig_battlebot` | Heo Battlebot | Arena combat robot | P3 |
| `pig_ai` | Heo AI | Futuristic AI core and hologram | P3 |
| `pig_space` | Heo Không Gian | Futuristic space explorer | P2 |
| `pig_alien` | Heo Ngoài Hành Tinh | Purple skin, antennae, large eyes | P2 |
| `pig_ufo` | Heo UFO | UFO pilot pig | P3 |
| `pig_miningbot` | Heo Khai Khoáng | Industrial mining robot | P2 |
| `pig_steampunk` | Heo Steampunk | Brass gears and goggles | P3 |
| `pig_jet` | Heo Phản Lực | Jetpack and aerodynamic armor | P3 |

### Robot modular accessories

| File | Item |
|---|---|
| `acc_head_robot_helmet.png` | Mũ Robot |
| `acc_head_robot_visor.png` | Kính HUD |
| `acc_head_robot_antenna.png` | Ăng-ten |
| `acc_body_robot_armor.png` | Giáp Robot |
| `acc_body_robot_core.png` | Energy Core |
| `acc_body_robot_jetpack.png` | Jetpack |
| `acc_body_robot_wings.png` | Cánh Cơ Khí |
| `acc_body_robot_backpack.png` | Ba-lô Công Nghệ |
| `acc_prop_robot_drill.png` | Khoan Robot |
| `acc_prop_robot_wrench.png` | Cờ-lê Robot |

---

# 8. FANTASY / DRAGON COLLECTION

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_dragon` | Heo Rồng | Dragon onesie, horns, wings | P2 |
| `pig_thienlong` | Heo Thần Long | Gold/blue celestial dragon | P4 |
| `pig_phoenix` | Heo Phượng Hoàng | Fiery feathers and wings | P4 |
| `pig_unicorn` | Heo Kỳ Lân | Pastel mane and golden horn | P2 |
| `pig_kitsune` | Heo Hồ Ly | Fox ears and tails | P3 |
| `pig_pegasus` | Heo Pegasus | White wings, celestial theme | P3 |
| `pig_mermaid` | Heo Mỹ Nhân Ngư | Ocean fantasy | P3 |
| `pig_fairy` | Heo Tiên | Fairy wings and sparkle | P2 |
| `pig_golem` | Heo Golem | Stone-like body, glowing core | P3 |
| `pig_elf` | Heo Elf | Pointed ears and fantasy clothes | P2 |

---

# 9. MYTHOLOGY COLLECTION

Use a cute parody-inspired interpretation rather than realistic historical depiction.

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_oni` | Heo Oni | Small horns, red/blue theme | P2 |
| `pig_zeus` | Heo Zeus | Crown, toga, lightning | P3 |
| `pig_poseidon` | Heo Poseidon | Trident and ocean theme | P3 |
| `pig_hades` | Heo Hades | Dark cape, flame motif | P3 |
| `pig_athena` | Heo Athena | Helmet and shield | P3 |
| `pig_valkyrie` | Heo Valkyrie | Winged helmet, armor | P3 |
| `pig_minotaur` | Heo Minotaur | Cute horned costume | P3 |
| `pig_medusa` | Heo Medusa | Snake-hair inspired hood | P3 |
| `pig_thor` | Heo Thor | Hammer and lightning | P3 |
| `pig_loki` | Heo Loki | Horned helmet and green costume | P3 |

---

# 10. HORROR / HALLOWEEN COLLECTION

Keep horror cute and family-friendly.

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_pumpkin` | Heo Bí Ngô | Pumpkin costume | P2 |
| `pig_ghost` | Heo Ma | White ghost sheet | P1 |
| `pig_vampire` | Heo Ma Cà Rồng | Cape and tiny fangs | P2 |
| `pig_zombie` | Heo Zombie | Torn clothes, funny expression | P2 |
| `pig_mummy` | Heo Xác Ướp | Wrapped bandages | P2 |
| `pig_franken` | Heo Frankenstein | Bolts and stitched costume | P3 |
| `pig_skeleton` | Heo Xương | Cartoon skeleton costume | P2 |
| `pig_werewolf` | Heo Người Sói | Fluffy ears and claws | P2 |

---

# 11. SEASONAL COLLECTION

## Spring / New Year

- `pig_tet`
- `pig_lan`
- `pig_ao_dai`
- `pig_banh_chung`

## Summer

| Key | Name | Priority |
|---|---|---|
| `pig_beach` | Heo Đi Biển | P1 |
| `pig_surfer` | Heo Lướt Sóng | P2 |
| `pig_diver` | Heo Thợ Lặn | P2 |
| `pig_icecream` | Heo Kem | P1 |

## Autumn / Halloween

- `pig_pumpkin`
- `pig_ghost`
- `pig_vampire`
- `pig_witch`
- `pig_mummy`

## Winter / Christmas

| Key | Name | Priority |
|---|---|---|
| `pig_christmas` | Heo Noel | P1 |
| `pig_snowman` | Heo Người Tuyết | P1 |
| `pig_reindeer` | Heo Tuần Lộc | P2 |
| `pig_elf_christmas` | Heo Elf Noel | P2 |
| `pig_gift` | Heo Hộp Quà | P2 |

---

# 12. FOOD / FUN COLLECTION

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_icecream` | Heo Kem | Ice cream costume | P1 |
| `pig_cake` | Heo Bánh Kem | Birthday cake theme | P2 |
| `pig_donut` | Heo Donut | Donut ring costume | P2 |
| `pig_burger` | Heo Burger | Funny burger costume | P2 |
| `pig_boba` | Heo Trà Sữa | Boba cup accessories | P1 |
| `pig_watermelon` | Heo Dưa Hấu | Summer fruit theme — green body, dark green vertical stripes, leaf sprout on head | **P0 — breed default** |
| `pig_corn` | Heo Bắp | Corn costume | P1 |
| `pig_strawberry` | Heo Dâu | Strawberry theme | P1 |

---

# 13. FUNNY PERSONALITY COLLECTION

These skins emphasize personality rather than lore.

| Key | Name | Concept | Priority |
|---|---|---|---|
| `pig_sleepy` | Heo Buồn Ngủ | Nightcap, sleepy eyes | P1 |
| `pig_lazy` | Heo Lười | Pajamas, pillow | P1 |
| `pig_angry` | Heo Cáu | Angry eyebrows | P1 |
| `pig_crybaby` | Heo Mít Ướt | Big teardrops | P1 |
| `pig_cool` | Heo Ngầu | Sunglasses | P1 |
| `pig_rich` | Heo Đại Gia | Gold accessories | P2 |
| `pig_grandpa` | Heo Ông | Gray hair, glasses | P1 |
| `pig_grandma` | Heo Bà | Scarf, glasses | P1 |
| `pig_baby` | Heo Em Bé | Pacifier, baby bonnet | P1 |
| `pig_party` | Heo Quẩy | Party hat, confetti | P1 |

---

# 14. MODULAR COSMETICS SYSTEM

Directory:

```text
sprites/
└── cosmetics/
    ├── head/
    ├── face/
    ├── body/
    ├── back/
    ├── prop/
    └── effects/
```

Default resolution:

```text
256 × 256 px
transparent PNG
```

All cosmetics should be independent assets whenever possible.

---

# 15. HEADWEAR

Filename prefix:

```text
acc_head_*.png
```

| File | Item |
|---|---|
| `acc_head_non_la.png` | Nón Lá Việt Nam |
| `acc_head_straw_hat.png` | Mũ Rơm |
| `acc_head_chef.png` | Mũ Đầu Bếp |
| `acc_head_witch.png` | Mũ Phù Thủy |
| `acc_head_glasses.png` | Kính Tròn |
| `acc_head_crown.png` | Vương Miện |
| `acc_head_pirate.png` | Mũ Cướp Biển |
| `acc_head_nightcap.png` | Mũ Ngủ |
| `acc_head_cowboy.png` | Mũ Cao Bồi |
| `acc_head_detective.png` | Mũ Thám Tử |
| `acc_head_samurai.png` | Kabuto Samurai |
| `acc_head_viking.png` | Mũ Viking |
| `acc_head_knight.png` | Mũ Hiệp Sĩ |
| `acc_head_wizard.png` | Mũ Pháp Sư |
| `acc_head_superhero_mask.png` | Mặt Nạ Siêu Anh Hùng |
| `acc_head_robot_helmet.png` | Mũ Robot |
| `acc_head_robot_visor.png` | HUD Visor |
| `acc_head_robot_antenna.png` | Ăng-ten |
| `acc_head_astronaut.png` | Mũ Phi Hành Gia |
| `acc_head_space_antenna.png` | Antenna Không Gian |
| `acc_head_oni_horns.png` | Sừng Oni |
| `acc_head_dragon_horns.png` | Sừng Rồng |
| `acc_head_unicorn_horn.png` | Sừng Kỳ Lân |
| `acc_head_fox_ears.png` | Tai Hồ Ly |
| `acc_head_elf_ears.png` | Tai Elf |
| `acc_head_pharaoh.png` | Mũ Pharaoh |
| `acc_head_santa.png` | Mũ Noel |
| `acc_head_reindeer.png` | Sừng Tuần Lộc |
| `acc_head_party.png` | Mũ Sinh Nhật |
| `acc_head_flower_crown.png` | Vòng Hoa |

---

# 16. FACE COSMETICS

Filename prefix:

```text
acc_face_*.png
```

| File | Item |
|---|---|
| `acc_face_sunglasses.png` | Kính Râm |
| `acc_face_round_glasses.png` | Kính Tròn |
| `acc_face_monocle.png` | Kính Một Mắt |
| `acc_face_eyepatch.png` | Bịt Mắt Hải Tặc |
| `acc_face_mask_ninja.png` | Khẩu Trang Ninja |
| `acc_face_superhero.png` | Mặt Nạ Anh Hùng |
| `acc_face_vampire_fangs.png` | Răng Nanh |
| `acc_face_oni_mask.png` | Mặt Nạ Oni |
| `acc_face_robot_eye.png` | Mắt Robot |
| `acc_face_cyber_visor.png` | Cyber Visor |
| `acc_face_blush.png` | Má Hồng |
| `acc_face_sleepy.png` | Mắt Buồn Ngủ |
| `acc_face_angry.png` | Lông Mày Cáu |
| `acc_face_cool.png` | Kính Ngầu |

---

# 17. BODY / CLOTHING COSMETICS

Filename prefix:

```text
acc_body_*.png
```

| File | Item |
|---|---|
| `acc_body_satchel.png` | Túi Mây / Cặp Sách |
| `acc_body_cape_red.png` | Áo Choàng Đỏ |
| `acc_body_cape_blue.png` | Áo Choàng Xanh |
| `acc_body_cape_dark.png` | Áo Choàng Bóng Tối |
| `acc_body_farmer_overalls.png` | Quần Yếm Nông Dân |
| `acc_body_chef_apron.png` | Tạp Dề Đầu Bếp |
| `acc_body_business_suit.png` | Vest |
| `acc_body_ao_dai.png` | Áo Dài |
| `acc_body_samurai_armor.png` | Giáp Samurai |
| `acc_body_knight_armor.png` | Giáp Hiệp Sĩ |
| `acc_body_viking_armor.png` | Giáp Viking |
| `acc_body_robot_armor.png` | Giáp Robot |
| `acc_body_robot_core.png` | Energy Core |
| `acc_body_robot_jetpack.png` | Jetpack |
| `acc_body_space_suit.png` | Space Suit |
| `acc_body_superhero.png` | Suit Siêu Anh Hùng |
| `acc_body_witch_cape.png` | Cape Phù Thủy |
| `acc_body_dragon_armor.png` | Giáp Rồng |
| `acc_body_fairy_dress.png` | Váy Tiên |
| `acc_body_tuxedo.png` | Tuxedo |
| `acc_body_pajamas.png` | Đồ Ngủ |
| `acc_body_santa.png` | Đồ Noel |

---

# 18. BACK ACCESSORIES

Filename prefix:

```text
acc_back_*.png
```

| File | Item |
|---|---|
| `acc_back_basket.png` | Giỏ Rau Củ |
| `acc_back_satchel.png` | Ba-lô |
| `acc_back_wings_fairy.png` | Cánh Tiên |
| `acc_back_wings_angel.png` | Cánh Thiên Thần |
| `acc_back_wings_dragon.png` | Cánh Rồng |
| `acc_back_wings_phoenix.png` | Cánh Phượng Hoàng |
| `acc_back_wings_bat.png` | Cánh Dơi |
| `acc_back_robot_wings.png` | Cánh Cơ Khí |
| `acc_back_jetpack.png` | Jetpack |
| `acc_back_space_pack.png` | Bình Oxy |
| `acc_back_quiver.png` | Bao Tên |
| `acc_back_guitar.png` | Guitar |
| `acc_back_magic_scroll.png` | Cuộn Phép |
| `acc_back_treasure.png` | Túi Kho Báu |
| `acc_back_umbrella.png` | Ô |
| `acc_back_bamboo_basket.png` | Giỏ Tre |

---

# 19. HELD PROPS

Filename prefix:

```text
acc_prop_*.png
```

| File | Item |
|---|---|
| `acc_prop_book.png` | Sách |
| `acc_prop_flask.png` | Bình Thí Nghiệm |
| `acc_prop_spatula.png` | Xẻng Nấu Ăn |
| `acc_prop_frying_pan.png` | Chảo |
| `acc_prop_fishing_rod.png` | Cần Câu |
| `acc_prop_magnifier.png` | Kính Lúp |
| `acc_prop_sword.png` | Kiếm |
| `acc_prop_shield.png` | Khiên |
| `acc_prop_bow.png` | Cung |
| `acc_prop_magic_staff.png` | Trượng Phép |
| `acc_prop_trident.png` | Đinh Ba |
| `acc_prop_hammer.png` | Búa |
| `acc_prop_robot_drill.png` | Khoan Robot |
| `acc_prop_robot_wrench.png` | Cờ-lê Robot |
| `acc_prop_laser_gun.png` | Súng Laser đồ chơi |
| `acc_prop_microphone.png` | Micro |
| `acc_prop_guitar.png` | Guitar |
| `acc_prop_camera.png` | Máy Ảnh |
| `acc_prop_phone.png` | Điện Thoại |
| `acc_prop_boba.png` | Ly Trà Sữa |
| `acc_prop_icecream.png` | Kem |
| `acc_prop_tet_lucky_money.png` | Bao Lì Xì |
| `acc_prop_lantern.png` | Đèn Lồng |

---

# 20. EFFECT / AURA COSMETICS

Effects should be optional and rendered behind or around the pig.

Filename prefix:

```text
acc_fx_*.png
```

| File | Effect |
|---|---|
| `acc_fx_sparkle.png` | Lấp Lánh |
| `acc_fx_hearts.png` | Tim |
| `acc_fx_stars.png` | Sao |
| `acc_fx_magic.png` | Ma Thuật |
| `acc_fx_fire.png` | Lửa |
| `acc_fx_ice.png` | Băng |
| `acc_fx_lightning.png` | Điện |
| `acc_fx_smoke.png` | Khói |
| `acc_fx_cyber.png` | Cyber Particles |
| `acc_fx_hologram.png` | Hologram |
| `acc_fx_gold.png` | Golden Aura |
| `acc_fx_rainbow.png` | Rainbow Aura |
| `acc_fx_cloud.png` | Mây |
| `acc_fx_cherry_blossom.png` | Cánh Hoa |
| `acc_fx_tet_confetti.png` | Pháo Giấy |

---

# 21. COLLECTION BUNDLES

Bundles can combine several assets into a recognizable theme.

## 21.1 Cyber Pig Bundle

```text
pig_robot
+ acc_head_robot_helmet
+ acc_face_cyber_visor
+ acc_body_robot_armor
+ acc_back_robot_wings
+ acc_fx_cyber
```

## 21.2 Space Pig Bundle

```text
pig_space
+ acc_head_astronaut
+ acc_body_space_suit
+ acc_back_space_pack
+ acc_fx_stars
```

## 21.3 Dragon King Bundle

```text
pig_thienlong
+ acc_head_dragon_horns
+ acc_body_dragon_armor
+ acc_back_wings_dragon
+ acc_fx_cloud
```

## 21.4 Vietnamese Festival Bundle

```text
pig_tet
+ acc_head_non_la
+ acc_body_ao_dai
+ acc_prop_tet_lucky_money
+ acc_prop_lantern
+ acc_fx_tet_confetti
```

## 21.5 Wizard Pig Bundle

```text
pig_wizard
+ acc_head_wizard
+ acc_body_witch_cape
+ acc_prop_magic_staff
+ acc_fx_magic
```

---

# 22. LEGENDARY / MYTHIC DESIGN RULE

P4 and P5 assets should not simply add more decorations.

They should introduce:

1. Unique silhouette
2. Distinct color identity
3. Signature accessory
4. Optional aura
5. Small animated-looking visual cues
6. Strong collection identity

Example:

```text
P2:
pig_robot

P3:
pig_mecha

P4:
pig_ai

P5:
pig_thienlong
```

A higher rarity must feel more special visually, but should not become unreadable.

---

# 23. AI IMAGE GENERATION MASTER PROMPT

> ⚠️ **Superseded by `../AI_ASSET_GENERATION_PACK.md`.** The prompts in §23–§27 and §37 predate the production standard: they do not enforce the 82% ground line, they do not forbid held scene props, and they do not forbid captions — which is exactly how `style_reference_pigs_alt.png` ended up with filenames burned into the image and frying pans fused to the pig bodies. Use the generation pack instead; it carries corrected versions of all of these plus a filled-in prompt for every P0 and P1 asset.
>
> Kept below for reference only.

Use this as the base prompt for pig skins.

```text
Cute 2D cartoon game art, chibi pig character, flat colors with soft cel-shading,
clean rounded outlines, warm pastel palette, friendly playful personality,
high-quality casual mobile game character design, consistent top-left lighting.

Single full-body pig character, side view facing right, all four feet visible,
centered composition, readable silhouette, neutral or happy expression.

[SKIN CONCEPT]

The character must remain clearly recognizable as a pig.
The costume and theme should be integrated naturally into the pig silhouette.
Use simple shapes and clean visual hierarchy suitable for a small mobile game sprite.

Transparent background, isolated character, no environment,
no ground, no text, no letters, no watermark, no logo,
no UI, no border.

512x512 px.
```

---

# 24. AI IMAGE GENERATION — ROBOT MASTER PROMPT

```text
Cute 2D cartoon game art, chibi pig robot character,
side view facing right, full body, all four feet visible.

Compact friendly mecha design, rounded mechanical armor,
small mechanical joints, simple panels, glowing cyan energy core,
cute expressive LED eyes, rounded robot shapes rather than realistic military machinery.

Flat colors with soft cel-shading, clean rounded outlines,
warm friendly casual mobile game aesthetic,
consistent top-left lighting, readable silhouette.

Transparent background, isolated character,
no environment, no floor, no text, no watermark, no logo.

512x512 px.
```

---

# 25. AI IMAGE GENERATION — MYTHOLOGY MASTER PROMPT

```text
Cute 2D cartoon game art, chibi pig inspired by [MYTHOLOGY],
side view facing right, full body, all four feet visible.

Whimsical fantasy interpretation, cute rather than realistic,
rounded proportions, simplified iconic costume elements,
recognizable pig face and body.

Flat colors, soft cel-shading, clean rounded outlines,
warm pastel palette, playful casual mobile game aesthetic,
consistent top-left lighting.

Transparent background, isolated character,
no environment, no text, no watermark, no logo.

512x512 px.
```

---

# 26. AI IMAGE GENERATION — COSMETIC MASTER PROMPT

```text
Single modular game cosmetic accessory: [ITEM].

Cute 2D cartoon game art, clean rounded shape language,
soft cel-shading, warm pastel palette,
consistent top-left lighting.

Designed specifically to fit a chibi pig character,
clear silhouette, readable at small mobile-game scale,
centered isolated object.

Transparent background, PNG asset,
no pig body, no character, no environment,
no text, no letters, no watermark, no logo.

256x256 px.
```

---

# 27. NEGATIVE PROMPT

Use where the image model supports negative prompts.

```text
photorealistic, realistic pig, 3D render, realistic fur,
complex background, scenery, landscape, multiple characters,
front view, back view, cropped body, missing feet,
extra legs, extra ears, deformed anatomy,
text, letters, logo, watermark, UI, frame,
dark horror, gore, blood, weapon realism,
low resolution, blurry edges, noisy image
```

---

# 28. ANCHOR SYSTEM

Each base pig should expose standardized anchors.

Example:

```json
{
  "head":      { "x": 0.53, "y": 0.25 },
  "face":      { "x": 0.58, "y": 0.31 },
  "body":      { "x": 0.48, "y": 0.50 },
  "back":      { "x": 0.30, "y": 0.46 },
  "hand_prop": { "x": 0.64, "y": 0.61 },
  "feet":      { "x": 0.50, "y": 0.82 },
  "fx_above":  { "x": 0.50, "y": 0.10 }
}
```

Values are normalized from `0.0` to `1.0` against the 512 × 512 canvas. Anchors are **required**, not optional, and ship as `<pig_id>.anchors.json` next to the sprite.

- `feet.y` is **fixed at 0.82 for every pig** — it is the shared ground line from §1.2, not a per-pig value.
- `fx_above` is where the shared overlays `fx_sick`, `fx_pregnant` and `fx_zzz` attach.
- The other five are calibrated per base pig during implementation.

**Mirror rule.** When a sprite is flipped to face left, every anchor mirrors as `x' = 1 - x`. The renderer must apply this. It is one line of code and forgetting it is the most likely cosmetic bug in the project: hats drift off the wrong side of the head only when the pig walks left, which is easy to miss in testing.

---

# 29. ASSET NAMING RULES

Use lowercase snake_case.

Correct:

```text
pig_robot.png
pig_thienlong.png
acc_head_robot_helmet.png
acc_body_robot_armor.png
acc_back_wings_dragon.png
acc_prop_magic_staff.png
acc_fx_cyber.png
```

Avoid:

```text
PigRobot.png
Robot Helmet Final.png
pig-new-final2.png
asset123.png
```

Versioning should be handled by Git/source control rather than embedding arbitrary version numbers into production filenames.

---

# 30. DIRECTORY STRUCTURE

Recommended:

```text
assets/
└── pigs/
    ├── base/
    ├── skins/
    │   ├── vietnam/
    │   ├── jobs/
    │   ├── adventure/
    │   ├── robot/
    │   ├── fantasy/
    │   ├── mythology/
    │   ├── horror/
    │   ├── seasonal/
    │   ├── food/
    │   └── funny/
    │
    └── cosmetics/
        ├── head/
        ├── face/
        ├── body/
        ├── back/
        ├── prop/
        └── effects/
```

---

# 31. METADATA SCHEMA

> ⚠️ **Superseded.** The shapes below were a sketch. The schema the game code actually reads is `public/assets/manifest/assets.json`, defined in production standard §7.2 — it adds the fields the skin shop needs (`priceGold`, `rarity`, `allowedBreeds`, `sleepAsset`, `symmetric`, `assetFlip`). Write metadata in that shape. The blocks below are kept only to show the intent.

Each pig should have metadata similar to:

```json
{
  "id": "pig_robot",
  "name": "Heo Cơ Giáp",
  "collection": "robot",
  "rarity": "P2",
  "asset": "pigs/skins/robot/pig_robot.png",
  "tags": [
    "robot",
    "sci-fi",
    "mecha",
    "technology"
  ],
  "compatible_cosmetics": [
    "head",
    "face",
    "back",
    "prop",
    "effect"
  ]
}
```

Each cosmetic:

```json
{
  "id": "acc_head_robot_helmet",
  "name": "Mũ Robot",
  "slot": "head",
  "rarity": "P2",
  "asset": "pigs/cosmetics/head/acc_head_robot_helmet.png",
  "tags": [
    "robot",
    "sci-fi"
  ]
}
```

---

# 32. COMPATIBILITY RULES

Cosmetics should have compatibility metadata.

Example:

```json
{
  "id": "acc_head_astronaut",
  "slot": "head",
  "compatible_tags": [
    "space",
    "robot",
    "sci-fi",
    "human"
  ]
}
```

Possible compatibility states:

```text
compatible
conditional
incompatible
```

A cosmetic should be marked `conditional` when it visually overlaps another cosmetic.

Example:

```text
acc_head_wizard
+
acc_head_astronaut
```

Both occupy the head slot, so they cannot normally be equipped simultaneously.

---

# 33. PRODUCTION PRIORITY

> Waves, exact counts and the order to actually produce in: production standard §10. Ready-to-paste prompts for every P0 and P1 pig: `../AI_ASSET_GENERATION_PACK.md`.

## P0 — Breed defaults, before anything else

These four are the **only** artwork the game cannot run without, because every pig in the game is one of these four breeds (game spec §6.6). Produce these plus their `_sleep` frames first.

- `pig_classic` — PIG_EARTH_PINK (Heo Hồng Đất)
- `pig_watermelon` — PIG_STRIPED_MELON (Heo Sọc Dưa)
- `pig_superhero` — PIG_SUPERMAN (Heo Siêu Nhân)
- `pig_thienlong` — PIG_MYTHICAL (Heo Thần Thoại)

All four already exist as concept art in `../reference/style_reference_environment.png`, top row, left to right in exactly this order.

## P1 — Core

Create next (`pig_classic` and `pig_superhero` already done in P0):

- pig_classic
- pig_white
- pig_black
- pig_brown
- pig_farmer
- pig_chef
- pig_nerd
- pig_knight
- pig_wizard
- pig_cowboy
- pig_detective
- pig_superhero
- pig_ghost
- pig_christmas
- pig_tet

Core cosmetics:

- nón lá
- straw hat
- chef hat
- glasses
- crown
- pirate hat
- nightcap
- cape
- satchel
- basket
- fairy wings
- sunglasses
- sword
- shield
- book
- magic staff

## P2 — Expansion

Create next:

- robot
- mecha
- cyborg
- ninja
- samurai
- pirate
- dragon
- unicorn
- kitsune
- vampire
- mummy
- pumpkin
- space
- alien
- viking
- rockstar
- streamer
- fisherman
- Tet
- lion dance

## P3 — Premium

- android
- AI
- UFO
- steampunk
- phoenix
- pegasus
- oni
- Zeus
- Athena
- Poseidon
- Hades
- Valkyrie
- Medusa
- Minotaur
- Ong Dia
- Tho Dia

## P4/P5 — Signature

Recommended candidates:

```text
pig_thienlong
pig_phoenix
pig_ai
pig_zeus
pig_ong_dia
```

These should receive bespoke visual treatment instead of merely recoloring existing skins.

---

# 34. DESIGN CONSISTENCY CHECKLIST

Before accepting an asset:

### Character

- [ ] Clearly recognizable as a pig
- [ ] Side view facing right
- [ ] Full body visible
- [ ] Four feet readable
- [ ] Silhouette readable
- [ ] Expression friendly
- [ ] Proportions match existing pigs

### Art

- [ ] 2D cartoon
- [ ] Flat colors
- [ ] Soft cel-shading
- [ ] Rounded outlines
- [ ] Top-left lighting
- [ ] Warm palette
- [ ] No unwanted background

### Technical

- [ ] Correct PNG
- [ ] Transparent background
- [ ] Correct resolution
- [ ] Correct filename
- [ ] No watermark
- [ ] No text
- [ ] No logo
- [ ] No accidental extra objects

### Modular cosmetic

- [ ] Correct slot
- [ ] Correct anchor
- [ ] Does not cover face unnecessarily
- [ ] Does not create impossible overlap
- [ ] Works on at least 3 base pigs

---

# 35. FUTURE COLLECTION EXPANSION

The asset system should remain open for future themes:

```text
Cyberpunk
Underwater
Dinosaur
Ancient Egypt
Space Opera
Fairy Tale
Sports
School
Music
Circus
Construction
Military parody
Detective
Winter
Spring
Summer
Autumn
Vietnamese festivals
Food
Internet meme-inspired original designs
```

Avoid direct copies of copyrighted characters, logos or recognizable franchise costumes.

The target is:

```text
Original Ủn Ỉn identity
+
familiar theme
+
cute pig interpretation
```

rather than a direct imitation of an existing franchise.

---

# 36. FINAL ASSET PHILOSOPHY

The game should feel like:

> **“A world where any pig can become anything.”**

The player should be able to transform one base pig into:

```text
Farmer
→ Chef
→ Ninja
→ Robot
→ Wizard
→ Dragon
→ Astronaut
→ Superhero
→ Festival Pig
→ Mythical Pig
```

without replacing the underlying pig identity.

The most important visual principles are:

1. **Cute first**
2. **Pig readability first**
3. **Strong silhouette**
4. **Modular reuse**
5. **Theme diversity**
6. **Vietnamese identity where appropriate**
7. **Original designs rather than franchise copies**
8. **Simple enough for AI generation**
9. **Consistent enough to coexist in one game**
10. **Premium rarity should feel special without becoming visually noisy**

---

# 37. MASTER GENERATION SHORTCUT

For batch AI generation, use:

```text
[STYLE]
Cute 2D chibi cartoon game art, flat colors, soft cel-shading,
clean rounded outlines, warm pastel palette, friendly casual mobile game style,
consistent top-left lighting.

[CHARACTER]
Single full-body pig, side view facing right, four feet visible,
centered, readable silhouette.

[THEME]
{THEME DESCRIPTION}

[ACCESSORY]
{ACCESSORY DESCRIPTION}

[OUTPUT]
Transparent PNG, 512x512, no background, no text, no watermark,
no logo, no UI.
```

For cosmetics:

```text
[STYLE]
Cute 2D cartoon game asset, rounded shapes, soft cel-shading,
warm pastel palette, clean edges, consistent top-left lighting.

[ITEM]
{ITEM DESCRIPTION}

[OUTPUT]
Single isolated modular accessory, transparent PNG,
256x256, no pig body, no background, no text, no watermark.
```

---

# END OF PIG CATALOGUE

Companion documents:
- `../ASSET_PRODUCTION_STANDARD_v1.md` — format, directions, states, naming, delivery (normative)
- `../AI_ASSET_GENERATION_PACK.md` — ready-to-paste generation prompts
- `../../UN_IN_GAME_SPEC_v4_SOLO.md` — game rules
