# Art & animation chiến đấu Adventure — tự thêm, tự sửa (decision 042, 044)

Trận vẽ bằng sân Phaser (`src/areas/adventure/scene/battle/`). **Mọi thứ nhìn thấy đều đọc từ `content/adventure/battle_fx.json`** và ảnh trong manifest: không cần sửa code để thêm sinh vật, đổi hướng ảnh, đổi màu / hạt / nhịp, hay cho một kỹ năng cách ra đòn riêng.

Công cụ: **Admin → Thế giới → "Xưởng animation trận"** (`npm run admin`, mở `#/battle-lab`): chọn kỹ năng + hai sinh vật, bấm ▶ Chạy; sửa JSON, "Áp dụng thử", "Lưu". Sửa cả file: Admin → Nội dung game → "Animation trận".

## 1. Quy ước ảnh
- **Mọi sinh vật vẽ quay sang PHẢI** (nhìn 3/4 sang phải). Phe ta đứng trái giữ nguyên; quái đứng phải được game tự lật.
- Ảnh cũ chưa đúng quy ước ghi ở `battle_fx.json → creatures`: `"enemy_forest_wolf": { "facing": "left" }` (`left` = ảnh nhìn trái, `front` = chính diện, không bao giờ lật). Khi có ảnh mới quay phải, **xóa `facing`**.
- Khung **512×512**, nền trong suốt, **chân chạm giữa cạnh dưới** (chừa ~4%), thân ~80% chiều cao; trùm tới 95%. Mọi pose của một con cùng tỉ lệ, cùng vị trí chân.
- Phong cách Sobi Farm (nét nâu mềm, màu phẳng bóng nhẹ, mắt to, má hồng) — ảnh mẫu ở `asset/reference/`.

## 2. Key pose
Mỗi con tối đa 6 ảnh tĩnh, id `cb_<art>_<pose>` (`<art>` = id ảnh đang dùng: `pig_knight`, `fish_betta`, `enemy_forest_wolf`…). Chỉ cần ảnh gốc là đánh được; thiếu pose nào game dùng ảnh gốc + chuyển động bằng code.

| Pose | Khi nào hiện | Mô tả |
| --- | --- | --- |
| `idle` | đứng chờ | Đứng sẵn sàng, quay phải |
| `attack` | lấy đà → trúng đòn (cận chiến, dậm) | Lao / vung đòn sang phải |
| `cast` | niệm phép → phóng | Giơ chân / vũ khí, mắt sáng |
| `hurt` | bị trúng | Ngả ra sau, mắt nhắm, nước mắt (ảnh `<art>_hurt` cũ vẫn dùng được) |
| `ko` | bị hạ | Ngồi bệt, mắt xoắn ốc |
| `victory` | (dành sẵn) | Nhảy vui |

### Prompt Gemini (một con, 6 pose một sheet)
Đính kèm ảnh hiện tại của con đó + 1–2 ảnh mẫu Sobi Farm.

```
Character sheet for a cute 2D game creature in the attached Sobi Farm style (soft brown outlines, flat colors with gentle shading,
big eyes, pink cheeks). Keep the creature IDENTICAL to the attached reference (same colors, outfit, proportions).
Draw 6 poses in a 3x2 grid, each in its own square cell of equal size, plain white background, no text, no shadows on the ground.
EVERY pose faces RIGHT (3/4 view looking to the right). Feet touch the bottom center of the cell, same size in every cell.
1 idle: standing ready. 2 attack: lunging forward to the right, mid-swing. 3 cast: raising [paw/weapon], eyes glowing, casting.
4 hurt: knocked back to the left, eyes squeezed shut with tears, wobbly mouth (cute, no blood).
5 knocked out: sitting down dizzy with swirly eyes (cute, no blood). 6 victory: happy jump, cheering.
Creature: [tên + mô tả ngắn, vd. "pink pig knight in silver helmet with red plume, small shield"].
```

Lưu sheet vào thư mục batch (vd. `art_inbox/.batch/adventure-13-combat-poses/<sheet>.png`), nói với Claude: *"cắt sheet combat art"* — Claude cắt bằng `python .claude/skills/image-to-prompt/scripts/cut_blobs.py <batch> --sheet <id> --preview` (cắt theo khối: bỏ đường kẻ ô, vạch đất, chữ nhãn, watermark; 6 pose cùng tỉ lệ, khung 512, chân ở đáy giữa; sheet lạ ghi trong `cut_overrides.json` của batch), duyệt `art.py approve`, thêm dòng manifest (`props`, đường dẫn `props/combat/`), `npm run art:process -- --list=<file>`, `npm run assets:check`, xóa `facing` cũ nếu có. Thứ tự ưu tiên: idle + hurt của mọi con → attack + cast → ko + victory.

## 3. Thêm combat animal mới
1. Admin → Giống heo: thêm loài, bật **Chiến binh** (`fighter`), chọn dòng Guardian.
2. Ảnh gốc quay phải (mục 1). Có ảnh là đánh được; pose khác thêm dần.
3. Thân di chuyển khác (bay, lơ lửng, to nặng): thêm vào `creatures`: `"pig_pegasus": { "body": "flyer" }`. Các thân: `quadruped`, `aquatic`, `flyer`, `floater`, `sprout`, `heavy` (nhịp thở, độ nhún, độ lao ở `bodies`).

## 4. Animation kỹ năng
Kỹ năng **không cần khai báo**: nó dùng công thức của hệ (`elements.<HỆ>`) và kiểu ra đòn theo loại (vật lý đơn → `melee`, vật lý cả phe → `slam`, phép đơn → `projectile`, phép cả phe → `burst`, hỗ trợ → `aura`). Muốn khác, thêm một dòng vào `skills` — chỉ ghi phần khác:

```json
"skill_mm_poison_thorn": {
  "delivery": "projectile",
  "projectile": { "core": "shard", "size": 22, "trail": "thorn_trail", "arc": 70 },
  "impact": ["nature_leaves", "thorn_poison"],
  "color": "#b06ae0"
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `delivery` | `melee` lao tới · `slam` nhảy dậm · `projectile` bắn đạn · `burst` nổ tại chỗ · `aura` hào quang |
| `timing` | `{ "release": 260, "impact": 520, "end": 760 }` ms: hết lấy đà / trúng (số bay hiện lúc này) / xong |
| `color`, `glow` | màu chính (vòng phép, dây leo) và màu sáng |
| `projectile` | `core`: hình hạt hoặc ảnh `fx_…`; `size` px; `trail`: burst để lại phía sau (hoặc `null`); `arc`: độ vồng px |
| `impact` | danh sách burst (hoặc ảnh `fx_…`) nổ ở mục tiêu |
| `strike` | nét vẽ thêm: `none`, `slash` (chém chéo), `bolt` (sét từ trời), `beam` (cột sáng), `swirl` (xoáy), `vines` (dây leo) |
| `ring` | màu vòng loang dưới chân, `null` = không |
| `flash` | màu chớp toàn màn, `null` = không |
| `shake` | độ rung (px, 0–30) |

**Burst** (`particles.<tên>`) là một chùm hạt: `shape` (`glow`, `spark`, `star`, `leaf`, `petal`, `drop`, `rock`, `bubble`, `shard`, `ring`, `smoke`, `plus`, `arrow`, `rune`), `colors`, `count` (≤ 120), `speed` [min,max] px/s, `angle` độ (0 phải, −90 lên; tự lật cho quái), `cone` độ, `life` [min,max] ms, `size` [min,max] px, `shrink` (cỡ lúc tắt / lúc sinh), `gravity` (âm = bay lên), `spin` vòng/s, `spread` px, `flat`, `alpha`, `add` (false = vẽ đè, không phát sáng), `at` (`chest` / `feet` / `head`), `wait` ms.

**Ảnh VFX vẽ tay** (`fx_<tên>.png`, dải khung ngang khung vuông, dòng manifest có `frames`) dùng được ở `impact` và `projectile.core`; khi chưa có file thì không vẽ gì (đạn rơi về hình `glow`).

`reactions` là các chùm chung: `hit`, `heavy`, `heal`, `buff`, `debuff`, `miss`, `ko`, `tears`, `guard`, `stun`, `teleport`, `aura`, `charge`, `slam`.

Lưu ý: sai tham chiếu (burst không tồn tại…) bị chặn khi "Áp dụng thử" / "Lưu" với lỗi ghi rõ chỗ sai; game không bao giờ nhận file sai.

## 5. Kịch bản animation (decision 044)
Mỗi kỹ năng (và mỗi hành động chung, trạng thái, phản ứng nguyên tố) có thể có **kịch bản**: danh sách act có thời điểm, khai báo trong `battle_fx.json`. Cả 112 kỹ năng đã có kịch bản theo bản thiết kế `all_animation_sobi_adventure_final.md`.

```json
"skill_qt_ray": {
  "timing": { "release": 260, "impact": 440, "end": 950 },
  "script": [
    { "do": "pose", "at": 0, "who": "actor", "dur": 260, "pose": "cast" },
    { "do": "beam", "at": 260, "who": "target", "dur": 400, "color": "#fff3b0", "width": 14 },
    { "do": "strip", "at": 440, "who": "target", "img": "fx_pow_star", "tint": "#ffd66a" },
    { "do": "stop", "at": 440, "who": "actor", "dur": 50 },
    { "do": "sound", "at": 440, "who": "actor", "sound": "adv_light_hit" }
  ]
}
```

- `at` ms từ đầu nhịp (tốc độ thường; x2 và nén bước tự nhân). `impact` của `timing` là lúc số bay hiện.
- `who`: `actor`, `target`, `targets` (từng mục tiêu, lệch nhau `stagger`), `allies`, `foes`, `allyside` / `foeside` (giữa một phe), `field` (cả màn).
- `do`: `pose`, `move` (dash, dash_through, lunge, recoil, hop, jump, lift, knock, spin, spin_roll, vanish, appear, exit_top, dive, wiggle, puff_up, squash, shake, walk_sideways, rear, sink, float, tilt, look, bounce), `glow`, `burst`, `strip` (`fx_…` 4 khung), `prop` (`fxp_…` / `fxs_…` theo `path`: fall, rise, sweep, orbit, pop, grow, throw, fly, stretch, hover), `beam`, `tether`, `cone`, `decal`, `marker`, `trail`, `tint`, `punch`, `stop` (khựng hình), `split`, `shake`, `flash`, `sound`, `cutin`.
- `$color` / `$glow` / `$spark` / `$boom`: màu, hạt và va chạm của hệ (kỹ năng lớp lấy hệ người dùng).
- `skills.<id>.stagger`: ms giữa các mục tiêu (số, phản ứng lệch theo). Skill có kịch bản không có vòng phép trừ khi `"circle": true`.
- `actions` (đánh thường, thủ, choáng, đóng băng, vật phẩm, trúng, chí mạng, né, hồi máu, buff, debuff, độc / bỏng đầu lượt, gục, hồi sinh, thắng, vào trận, trùm đổi pha), `statuses.<id>` (`icon`, `apply`, `loop`, `tint`, `cover`), `elementReactions.<reaction_…>`.
- Thiếu ảnh → quầng sáng màu hệ (không lỗi). Giảm chuyển động → chỉ còn âm thanh, số và biểu tượng trạng thái.
- Thử trong "Xưởng animation trận": chọn số đồng đội / quái (1–3), phản ứng nguyên tố, trùm đổi pha, thắng trận, giảm chuyển động; ô JSON nhận cả `script`.
