# 044 — Animation trận: kịch bản theo mốc thời gian, art key pose + VFX (đợt animation adventure-12/13)

**Ngày:** 2026-10-29 · **Trạng thái:** đã làm (engine + nội dung), chờ chủ dự án duyệt trong app.
**Bối cảnh:** chủ dự án render 2 batch Gemini — `adventure-12-animation` (29 sheet: hạt `fxs_*`, biểu tượng trạng thái `st_*`, hiệu ứng 4 khung `fx_*`, vật thể `fxp_*`) và `adventure-13-combat-poses` (key pose `cb_<art>_<pose>`) — kèm bản thiết kế `all_animation_sobi_adventure_final.md` (112 skill, hành động chung, 25 trạng thái, 6 phản ứng nguyên tố; Phụ lục C = 20 khả năng engine). Decision 042 đã có sân Phaser + `battle_fx.json`, nhưng mỗi skill chỉ đổi được "look" (màu, đạn, va chạm) trên 5 khung ra đòn cố định — không diễn được thiết kế mới (vật thể bay / rơi / trồi, nhiều nhịp, lệch nhịp từng mục tiêu, khựng hình, cut-in…).
**Số decision:** chủ dự án gọi là "043" nhưng 043 đã dùng cho bản đồ thế giới → dùng 044.

## 1. Lựa chọn: kịch bản khai báo (`script`) trong battle_fx.json
Giữ nguyên kiến trúc 042: **dữ liệu** ở `content/adventure/battle_fx.json` (schema `content/schemas/adventure/battleFx.ts` + `battleScript.ts`), **thời gian thuần có test** ở `ui/` (`battleMotion.ts`, `battleScript.ts`, `battlePose.ts`, `battleMoves.ts`, `battlePlan.ts`), **Phaser chỉ phát cue** ở `scene/battle/` (`fxActs.ts`, `fxProps.ts`, `fxLines.ts`, `statusBadges.ts`).

Một kịch bản là danh sách **act**: `{ "do": …, "at": ms, "who": …, … }`. `at` tính từ đầu nhịp (sau vòng phép nếu có), tốc độ thường; engine nhân theo tốc độ bước (x2 = 0,55; bước dài bị nén ≤ 5,6 s). `who`: `actor`, `target`, `targets` (từng mục tiêu, lệch nhau `stagger`), `allies`, `foes`, `field` (cả màn).

| `do` | Khả năng (Phụ lục C) | Tham số chính |
| --- | --- | --- |
| `pose` | key pose ép trong `dur` | `pose` |
| `move` | **actor_moves**, **enemy_look** (`look`) | `move`: dash, dash_through, lunge, recoil, hop, jump, lift, knock, spin, spin_roll, vanish, appear, exit_top, dive, wiggle, puff_up, squash, shake, walk_sideways, rear, sink, float, tilt, look, bounce; `x`,`y`,`deg`,`scale`,`n` |
| `glow` | thân sáng / tô màu | `color`, `bright`, `tint` |
| `burst` | hạt (**sprite_particles**: burst có `art: fxs_…`) | `ref`, `spot`, `tint`, `more` |
| `strip` | **strip_frames** (tô màu ảnh trắng, chọn dải khung, giữ khung cuối) | `img: fx_…`, `size`, `tint`, `frames`, `dur`, `hold`, `under` |
| `prop` | **prop_actor** (+ **shadow_marker** khi `shadow`) | `img: fxp_…`, `path`: fall, rise, sweep, orbit, pop, grow, throw, fly, stretch, hover; `size`, `spin`, `arc` |
| `beam`, `tether`, `cone` | **beam**, **tether**, **cone** | `color`, `width`/`wave`, `through`, `ref` |
| `decal` | **ground_decal** (vẽ dưới sinh vật) | `kind`: puddle/scorch/crack/rune/ring hoặc `img`+`frame` |
| `marker` | **shadow_marker** | `size` |
| `trail` | **afterimage_trail** | `every`, `color` |
| `tint` | **bg_tint** (`focus`: vignette quanh mục tiêu) | `color`, `alpha`, `fade` |
| `punch` | **camera_punch** | `zoom` |
| `stop` | **hit_stop**: sân Phaser đứng yên (thân giữ pose, hạt / tween / effect chờ), âm thanh và số DOM vẫn chạy | `dur` |
| `split` | **color_split** | `dur` |
| `shake`, `flash` | đã có, nay khai báo được | |
| `sound` | **sound_layers** (mỗi act một âm `adv_…`; chỉ phát khi là audio key của game, thiếu file = im) | `sound` |
| `cutin` | **ult_cutin**: dải màu chéo quét qua, ảnh người dùng trượt vào, phần còn lại tối 50 % | `color` |

`$color`, `$glow` (màu của look), `$spark`, `$boom` (hạt / va chạm của hệ — bảng "Hạt theo hệ") được điền lúc chạy, nên kỹ năng lớp tự lấy hệ của người dùng.

Các khối mới của `battle_fx.json`:
- `skills.<id>`: thêm `script`, `stagger` (ms giữa các mục tiêu: số bay, phản ứng, KO lệch theo — **stagger**), `circle` (skill có script mặc định **không** vòng phép; script tự mở đầu), `timing` như cũ (nhịp trúng `impact` là lúc số hiện).
- `actions`: kịch bản hành động chung — `attack` (đánh thường), `guard`, `stunned`, `frozen`, `item`, `hit`, `heavy`, `miss`, `heal`, `regen`, `buff`, `debuff`, `dot_poison`, `dot_burn`, `ko`, `revive`, `victory`, `enter_ally`, `enter_enemy`, `boss_phase` (**boss_phase** chạy ở sự kiện `phase` của trận).
- `statuses.<status>`: `icon` (`st_…`), `apply` (khi gắn — thay mũi tên buff/debuff chung), `loop` (`every` ms + script khi còn hiệu lực), `tint` (tô thân), `cover` (khung ảnh phủ thân, vd. băng). Biểu tượng hiện cạnh đầu, tối đa 3, nhiều hơn thì luân phiên (**status_overlay**); trạng thái lấy từ DOM (`data-statuses`).
- `elementReactions.<reaction_…>`: phát ở sự kiện `reaction`.
- `particles.<id>.art` / `tintArt`: hạt dùng ảnh `fxs_…`, hình vẽ bằng code làm dự phòng.
- `elements.<HỆ>.spark` / `boom`.

## 2. Giữ đúng ràng buộc
- **Không đổi logic trận, không đổi save:** chỉ đọc sự kiện của bước (`damage`, `status`, `reaction`, `phase`, `skip`, `revive`, `end`…). `battleMotion.ts` thêm `marks` và `speed`; stagger chỉ dời thời điểm hiển thị.
- **Giảm chuyển động:** bỏ mọi act trừ `sound`; biểu tượng trạng thái vẫn hiện (đứng yên), không loop, không khựng hình.
- **Thiếu ảnh:** `strip` / `prop` thiếu file → quầng sáng màu look; hạt thiếu `fxs_` → hình vẽ bằng code; key pose thiếu → ảnh gốc (042).
- **Hiệu năng:** ảnh chỉ trận dùng (`props/combat/`, `fx/battle/`, `ui/status/`) **không** tải trước ở Farm (`farmLoadList`); sân trận tải `fxs_*`, `st_*` lúc tạo, ảnh mỗi bước tải khi bước bắt đầu.
- Mọi file ≤ 300 dòng (guard): engine tách `fxActs` / `fxProps` / `fxLines` / `statusBadges`, `battleMoves`.

## 3. Art của đợt này (đã đưa vào game)
- `fx_*` (22): ghép 4 khung thành dải ngang 1024×256 (khung 256), dòng manifest section `fx` có `frames`, đường dẫn `fx/battle/`. `fx_shield_dome` khung 4 ảnh Gemini bị nhạt mất → dựng bằng code từ khung 3 (45 %).
- `fxs_*` (24): `fx` + `particle` (64²). `fxp_*` (48): `fx`, 512² (`scripts/assets/sizes.ts`), B7–B12 nguồn ~300 px được phóng (hơi mờ). `st_*` (24): `ui/status/`, 128².
- `cb_<art>_<pose>` (43 con × 6): `props/combat/`, 512², cùng tỉ lệ cho 6 pose của một con, chân ở đáy giữa (cắt bằng `cut_blobs.py`). Quái có pose quay phải → xóa `facing`. `pig_crystal`: ảnh idle thành ảnh gốc (+ ngủ / thức bằng `art:sleep`).
- Công cụ cắt: `.claude/skills/image-to-prompt/scripts/cut_blobs.py` (cắt theo khối, bỏ đường kẻ ô / vạch đất / chữ nhãn / watermark; ghi đè từng sheet trong `cut_overrides.json` của batch).

## 4. Admin
"Xưởng animation trận" (`#/battle-lab`): thêm số đồng đội / quái (1–3, đòn diện rộng trúng cả hàng có stagger), trạng thái skill gắn, phản ứng nguyên tố, trùm đổi pha, thắng trận, giảm chuyển động. Ô JSON phần riêng nhận cả `script`.
