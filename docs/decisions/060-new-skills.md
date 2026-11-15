# 060 — 22 skill mới cho các hệ còn ít (mở băng hẹp decision 021)

**Ngày:** 2026-11-15. **Trạng thái:** chủ dự án đã duyệt nội dung (2026-11-12, ghi ở `docs/animation/vfx3d/SCORES.md` và prompt phiên Fable); áp dụng trong phiên này.

## Bối cảnh
Gameplay đóng băng từ GĐ13 (decision 021). Khi làm lại animation skill (decision 059), các hệ LIGHT (3 skill), VOID (4, không có skill quái), EARTH, WATER, METAL ít skill hơn hẳn các hệ khác. Đề xuất chi tiết, số liệu và lý do: `docs/animation/NEW_SKILLS_PROPOSAL.md`; dữ liệu đã kiểm bằng schema thật: `docs/animation/new_skills.draft.json` (`npx tsx scripts/animation/checkNewSkills.ts`).

## Quyết định
Mở băng **chỉ** cho 22 skill dưới đây, đúng số liệu trong bản nháp. Không đổi schema, không đổi skill cũ, không đổi save.

**Nhóm A — 12 skill quái** (`type: "enemy"`), thêm vào `skills.json`:
`skill_e_glare`, `skill_e_halo_burst`, `skill_e_prism_lance` (LIGHT); `skill_e_void_touch`, `skill_e_rift_pulse`, `skill_e_null_gaze` (VOID); `skill_e_tide_slap`, `skill_e_whirlpool` (WATER); `skill_e_shield_bash`, `skill_e_spike_volley` (METAL); `skill_e_boulder_toss`, `skill_e_sand_veil` (EARTH).
Gắn vào quái theo cột "Gợi ý quái dùng" của đề xuất (thêm vào cuối `skills` của quái):
| Quái | Skill thêm |
|---|---|
| `enemy_rune_wisp` | `skill_e_glare` |
| `enemy_drift_jelly` | `skill_e_halo_burst` |
| `enemy_reef_crab` | `skill_e_tide_slap` |
| `enemy_coral_eel` | `skill_e_whirlpool` |
| `enemy_shell_knight` | `skill_e_shield_bash` |
| `enemy_ancient_guardian` | `skill_e_spike_volley` |
| `enemy_ore_golem` | `skill_e_boulder_toss` |
| `enemy_stone_sentinel` | `skill_e_sand_veil` |
`skill_e_prism_lance` và ba skill VOID **chưa gắn vào quái nào** (chưa có quái LIGHT mạnh / quái VOID): có trong dữ liệu và Battle Lab, gắn khi có quái.

**Nhóm B — 10 skill riêng của loài** (`type: "unique"`), thay Unique của dòng ở một ô qua `species.<id>.unique` (schema đã cho phép; ô khác giữ `null` = của dòng):
| Loài | Ô (mở ở Lv) | Skill mới | Thay skill của dòng |
|---|---|---|---|
| `PIG_VALKYRIE` | 3 (Lv 20) | `skill_qt_prism` | `skill_qt_lumina` |
| `PIG_UNICORN` | 2 (Lv 10) | `skill_qt_dawn_spear` | `skill_qt_guiding_lamp` |
| `PIG_GALAXY` | 3 (Lv 20) | `skill_hk_star_fall` | `skill_hk_void_vortex` |
| `PIG_MYTHICAL` | 2 (Lv 10) | `skill_hk_null_ward` | `skill_hk_phase_shift` |
| `PIG_PIRATE` | 3 (Lv 20) | `skill_nh_whirlpool` | `skill_nh_tsunami` |
| `PIG_POSEIDON` | 2 (Lv 10) | `skill_nh_rising_tide` | `skill_nh_tide_song` |
| `PIG_SAMURAI` | 3 (Lv 20) | `skill_tg_spike_barrage` | `skill_tg_steel_charge` |
| `PIG_KNIGHT` | 2 (Lv 10) | `skill_tg_iron_oath` | `skill_tg_armor_break` |
| `PIG_TURTLE` | 3 (Lv 20) | `skill_qs_boulder_roll` | `skill_qs_quake` |
| `PIG_CRYSTAL` | 2 (Lv 10) | `skill_qs_dust_cloud` | `skill_qs_mountain_shell` |
Loài và ô lấy đúng cột "Loài gợi ý (ô)" của đề xuất. Mỗi loài mất skill của dòng ở ô đó (đề xuất §3 đã nêu); chủ dự án đổi được bằng cách sửa một phần tử của `species.<id>.unique`.

**Animation:** mỗi skill mới có kịch bản trong `battle_fx.json` với một act `vfx3d` riêng, dựng theo `docs/SKILL_ANIMATION_STANDARD.md`; đòn nhiều nhịp dùng `stagger` như Chuỗi Sét.

## Hệ quả
- Đổi độ khó khi gặp 8 quái trên (thêm một lựa chọn skill) và bộ skill của 10 loài. Số liệu nằm trong khoảng của skill cùng loại; kết quả bot cân bằng ở mục cuối.
- Không đổi save: skill là dữ liệu tĩnh, save chỉ lưu level / id loài.
- Sau khi áp dụng, gameplay đóng băng lại như decision 021.

## Bot cân bằng sau khi áp dụng (2026-11-15)
So cùng seed, bản trước (`d733d686`) và sau: `npx tsx scripts/sim-adventure.ts 400 1 <zone> rare`, `npx tsx scripts/simulate-week.ts 1 30 adventure`.
- **Rừng** (mặc định) và **tuần 30 ngày có Adventure**: **không đổi** (quái Rừng không được thêm skill; bot chưa tới cấp mở ô 2 / 3).
- **Núi: khó hơn rõ rệt** (quái đất / kim được Ném Tảng, Màn Cát, Húc Khiên…). Tỉ lệ thắng cả chuyến, trang bị hiếm:
  | Đội | Lv 7 | Lv 9 | Lv 11 | Lv 13 |
  |---|---|---|---|---|
  | tank+dps+support | 11 → 3,8 | 40,3 → 32 | 74 → 68,5 | 89,8 → 84,3 |
  | starter trio | 48,5 → 40 | 94,5 → 89,8 | 93,5 → 85,3 | 99 → 97 |
  | void trio | 0 → 0 | 0 → 0 | 57 → 37,8 | 92,5 → 86,3 |
  | dark+light | 1,5 → 0,8 | 95,3 → 92 | 61,5 → 44,5 | 87 → 82,8 |
  Từ Lv 16 trở lên gần như không đổi (≥ 98 %). Bảng "mỗi dòng × class ở Lv 13" giảm 0–10 điểm (Quy Sơn tanker 94,5 → 87,5, Quang Trụ tanker 93,5 → 83,5).
- **Phế tích**: gần như không đổi, dao động hai chiều trong biên nhiễu (starter trio Lv 20: 15 → 10; nature poison Lv 20: 48 → 56,8; tank+dps+support Lv 24: 0,8 → 3,8).
- **Chủ dự án cần quyết**: chấp nhận Núi khó hơn, hay giảm số (ví dụ power Ném Tảng 1,7 → 1,4, hoặc chỉ gắn skill mới cho quái từ Lv cao). Phiên này **không tự chỉnh số** (decision 021).
