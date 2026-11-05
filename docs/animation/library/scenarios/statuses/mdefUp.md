# Kịch bản trạng thái: Tăng thủ phép (`mdefUp`)

```json scenario
{
  "id": "mdefUp", "kind": "status", "name": "Tăng thủ phép", "element": "NONE", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": [], "bibles": ["actions/status", "actions/buff-and-heal"],
  "assets": [
    { "id": "fx_buff_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô #5ad8c8)" },
    { "id": "fxs_rune_b", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trạng thái **tăng** — đọc được khi bỏ màu nhờ hình riêng: **vòng rune bao quanh** thân (mờ, quay); năng lượng vút **lên** (bible [status](../../bibles/actions/status.md) §2: tăng hướng lên, giảm hướng xuống; không lấy hình của trạng thái ngược rồi lật). Màu chủ đạo `#5ad8c8`. T0: không rung, không khựng.

## 2. Hiện tại
`battle_fx.json → statuses.mdefUp`: apply / expire / layers. Lúc dính: strip fx_wind_swirl, burst metal_pop, move, sound. Các trạng thái tăng dùng chung khuôn vòng + hạt bay lên, phân biệt chủ yếu bằng màu và một vật nhỏ.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| Dính | 0–600 | đứng thẳng, viền ngọc | cột sáng mảnh **vút lên** từ chân; **vòng rune bao quanh** thân (mờ, quay); icon `st_*` bật lên cạnh đầu | "vút" sáng |
| Duy trì | mỗi 1,6–2,5 s, ≤ 400 ms | — | vòng rune mờ quay rất chậm | không |
| Hết | 300–500 | xìu nhẹ về bình thường | hình tan thành hạt **rơi** xuống (ngược pha dính) | ngân nhẹ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | cột sáng lên | `fx_buff_rise` | `strip` tô `#5ad8c8` ở `feet` lúc dính |
| L2 | viền sáng thân | — | `glow #5ad8c8` 200 ms |
| L3 | hình riêng của trạng thái | `fxs_rune_b` (+ vật hiện có trong script) | lúc dính: hình đi lên; duy trì: vòng rune mờ quay rất chậm (`loop.every`) |
| L4 | phản ứng thân | — | đứng thẳng, viền ngọc (`move`, không rung màn) |

## 5. Asset
`fx_buff_rise` **mới** (dùng chung cho mọi trạng thái tăng, tô theo màu riêng); `fxs_rune_b` và các vật trong script hiện tại có sẵn. Dự phòng: `burst buff_arrows` + `decal ring`.

## 6. Các bước dựng
B1 `apply` ≤ 600 ms, `loop.every` như bảng, `expire` ≤ 500 · B2 phản ứng thân · B3 fx_buff_rise · B4 hình riêng + loop · B5 không rung · B6 âm sáng · B7 capture (suite statuses: apply / loop / expire).

## 7. Nghiệm thu
Harness: không `DUPLICATE_SCRIPT` với trạng thái khác (khác hình, không chỉ khác màu); expire thay đổi ≥ 8 % khung; ảnh dính đọc được **hướng lên** khi xem đen trắng. Rubric status ≥ 85.
