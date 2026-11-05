# Kịch bản trạng thái: Giảm né (`evaDown`)

```json scenario
{
  "id": "evaDown", "kind": "status", "name": "Giảm né", "element": "NONE", "tier": 0, "durationMs": 650,
  "status": "draft", "refs": [], "bibles": ["actions/status", "actions/buff-and-heal"],
  "assets": [
    { "id": "fx_debuff_sink", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô #7a6a5a)" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trạng thái **giảm** — đọc được khi bỏ màu nhờ hình riêng: **thân lún** + bóng đổ đậm hơn (nặng nề); năng lượng chảy **xuống** (bible [status](../../bibles/actions/status.md) §2: tăng hướng lên, giảm hướng xuống; không lấy hình của trạng thái ngược rồi lật). Màu chủ đạo `#7a6a5a`. T0: không rung, không khựng.

## 2. Hiện tại
`battle_fx.json → statuses.evaDown`: apply / loop / expire. Lúc dính: move, burst debuff_arrows, burst pebble_ring, prop fxp_boulder, sound. Các trạng thái giảm dùng chung khuôn tím #6b4a8a (mũi tên xuống + khói), phân biệt chủ yếu bằng một vật nhỏ — dễ lẫn nhau (C4).

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| Dính | 0–650 | lún 4 px, chân dính đất | khói nặng **chảy xuống** từ đầu bao thân, đọng ở chân; **thân lún** + bóng đổ đậm hơn (nặng nề); icon `st_*` rơi xuống cạnh đầu | "phù" trầm |
| Duy trì | mỗi 2 s, ≤ 400 ms | — | bóng đổ đậm, thỉnh thoảng bụi nhỏ ở chân | không |
| Hết | 300–500 | thân sáng lại, đứng thẳng | khói tan **bay lên**, màu thân trở lại | ngân nhẹ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | khói chảy xuống | `fx_debuff_sink` | `strip` tô `#7a6a5a` ở `feet` lúc dính |
| L2 | tint tối nhẹ thân | — | `glow #7a6a5a` + `tint` (status `tint`) khi duy trì |
| L3 | hình riêng của trạng thái | `fxs_puff` (+ vật hiện có trong script) | lúc dính: hình đi xuống; duy trì: bóng đổ đậm, thỉnh thoảng bụi nhỏ ở chân (`loop.every`) |
| L4 | phản ứng thân | — | lún 4 px, chân dính đất (`move`, không rung màn) |

## 5. Asset
`fx_debuff_sink` **mới** (dùng chung cho mọi trạng thái giảm, tô theo màu riêng); `fxs_puff` và các vật trong script hiện tại có sẵn. Dự phòng: `burst debuff_smoke` + `debuff_arrows`.

## 6. Các bước dựng
B1 `apply` ≤ 650 ms, `loop.every` như bảng, `expire` ≤ 500 · B2 phản ứng thân · B3 fx_debuff_sink · B4 hình riêng + loop · B5 không rung · B6 âm trầm · B7 capture (suite statuses: apply / loop / expire).

## 7. Nghiệm thu
Harness: không `DUPLICATE_SCRIPT` với trạng thái khác (khác hình, không chỉ khác màu); expire thay đổi ≥ 8 % khung; ảnh dính đọc được **hướng xuống** khi xem đen trắng. Rubric status ≥ 85.
