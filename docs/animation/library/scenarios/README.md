# Kịch bản animation (scenarios)

Mỗi skill / trạng thái / hành động chung / phản ứng nguyên tố có **một file kịch bản**. Kịch bản là bản vẽ thi công: phải viết và được duyệt **trước** khi dựng act trong `battle_fx.json` và **trước** khi tạo asset. Thứ tự làm luôn là:

```
Kịch bản (ý tưởng → nhịp → bóc lớp) ─► duyệt ─► asset theo đặc tả ─► dựng từng bước ─► capture + review
```

Vì sao: bản thiết kế cũ (`art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_final.md`, của chủ dự án) có ý tưởng và 4 pha cho từng skill, nhưng **không tách lớp, không đặc tả asset theo lớp, không có bước dựng** → khi dựng, mọi thứ thành "một ảnh tĩnh trượt đi" (`anim:audit`: 64/112 skill). Kịch bản kế thừa ý tưởng của bản thiết kế đó và bổ sung ba phần còn thiếu.

## Vị trí và tên
`scenarios/skills/<skillId>.md` · `scenarios/statuses/<statusId>.md` · `scenarios/actions/<actionId>.md` · `scenarios/reactions/<reactionId>.md`. Tên file = id trong game. `npm run anim:audit` có cột "kịch bản" cho biết skill nào đã có.

## Đầu file (kiểm bằng `tests/scripts/animScenario.test.ts`)
````
```json scenario
{ "id": "skill_nh_tsunami", "kind": "skill", "name": "Sóng Thần Cổ", "element": "WATER", "tier": 2, "durationMs": 1650,
  "status": "draft", "refs": ["REF-WATER-WAVE-001"], "bibles": ["elements/WATER", "actions/cast"],
  "assets": [{ "id": "fx_wave_rise", "state": "new", "layer": "L1", "spec": "flipbook 8 khung…" }], "engine": ["prop_displace"] }
```
````
- `status`: `draft` (đã viết) → `approved` (chủ dự án duyệt nhịp + lớp) → `built` (đã vào `battle_fx.json`) → `verified` (capture + review đạt).
- `assets[].state`: `have` (có trong manifest) · `new` (cần tạo, **bắt buộc** `spec`) · `edit` (có, cần làm lại, bắt buộc `spec`). Test bắt lỗi khi `have` mà không có trong manifest, hoặc `new` mà đã có.
- `engine`: khả năng engine còn thiếu mà kịch bản cần (tên ngắn, xem bảng dưới). Có mục ở đây thì kịch bản chưa thể `built` cho tới khi engine có.

## Bảy mục bắt buộc (đúng thứ tự)
1. **Ý tưởng** — một câu hình ảnh + người chơi phải *cảm thấy* gì (nặng / nhanh / dễ thương / hùng tráng), bậc lực, nguồn ý tưởng (thiết kế gốc).
2. **Hiện tại** — đang dựng thế nào, vì sao kém (cờ `anim:audit`, ảnh capture nếu có).
3. **Kịch bản theo nhịp** — storyboard: mỗi nhịp một dòng `ms | người dùng | hiệu ứng chính | mục tiêu | màn hình | âm thanh`. Đây là thứ duyệt cảm giác.
4. **Bóc lớp** — với từng lớp L0–L4 (STANDARDS §3): thành phần, asset, chuyển động (đường đi, easing, biến hình), xuất hiện → biến mất (ms). Hình chủ đạo L1 phải ghi rõ đạt dấu hiệu sống nào (STANDARDS §2).
5. **Asset** — bảng asset theo lớp; asset mới có đặc tả cho Artist: số khung, cỡ, pivot, hướng, **nội dung từng khung**, nền trong suốt, phong cách Sobi. Ghi phương án dự phòng khi chưa có asset.
6. **Các bước dựng** — thứ tự dựng để mỗi bước xem được: B1 khung nhịp bằng placeholder → B2 thân người dùng / mục tiêu → B3 hình chủ đạo → B4 hạt & vết → B5 phản hồi (hit-stop, rung) → B6 âm → B7 capture + kiểm.
7. **Nghiệm thu** — điều kiện đo được: cờ `anim:audit` phải hết, số đo capture, khung nào phải thấy gì.

## Khả năng engine còn thiếu (đặt tên cố định để gom việc)
| Tên | Nghĩa | Ghi chú |
|---|---|---|
| `prop_displace` | shader displacement (Phaser FX) trên một `prop`: ảnh tĩnh gợn / chảy theo thời gian | decision 049 §6, thử ở P2 |
| `prop_flipbook` | `prop` phát khung của một flipbook `fx_` trong lúc di chuyển (hiện `prop` chỉ 1 ảnh, `strip` đứng yên) | cần cho sóng cuộn khi đang tiến |
| `strip_scale_xy` | `strip` co giãn khác nhau theo chiều ngang / dọc (cột nước cao) | thay được bằng asset dọc riêng |
| `bg_scene` | đổi nền trận tạm thời (biển sâu, biển bão) rồi trả lại | hiện chỉ có `tint` màu |
| `action_by_body` | hành động chung (đánh thường…) có script riêng theo kiểu thân (`bodies`: bốn chân, bay, bơi, nặng…) | hiện `actions.attack` là một script cho mọi con |
| `item_icon_prop` | act `prop` dùng ảnh `ui_item_*` của vật phẩm đang dùng | cho `actions.item` |

Số kịch bản cần từng khả năng (2026-11-05): `prop_displace` 25 · `bg_scene` 12 · `action_by_body` 3 · `prop_flipbook` 3 · `item_icon_prop` 1. Ngoài bảng, một số kịch bản ghi "cần kiểm / ghi engine nếu thiếu" trong mục Bóc lớp (khiên phản ứng khi đỡ đòn, giữ khiên khi Phòng thủ, phản ứng lan sang nhiều mục tiêu, hào quang trùm pha 2, đếm lượt Diệt vong, bóng mờ tách hướng) — kiểm khi dựng, thiếu thì thêm vào bảng.

## Độ phủ
**Đủ 169 kịch bản** (2026-11-05): 112 skill · 26 hành động chung · 25 trạng thái · 6 phản ứng. Test `animScenario.test.ts` bắt buộc mọi skill / trạng thái / hành động / phản ứng trong `content/` có kịch bản — thêm nội dung mới thì viết kịch bản cùng lúc. Asset mới cần: [`ASSETS.md`](ASSETS.md). Cột "kịch bản" trong [`AUDIT.md`](../../../animation-review/audit/AUDIT.md).

Thứ tự dựng đề xuất (khi asset / engine sẵn sàng): pilot `skill_nh_tsunami` (decision 049 §6) → đánh thường + trúng đòn (thấy nhiều nhất) → skill class (heo nào cũng có) → ultimate → skill dòng → quái → trạng thái / phản ứng.
