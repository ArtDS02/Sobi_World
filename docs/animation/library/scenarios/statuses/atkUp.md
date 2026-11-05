# Kịch bản trạng thái: Tăng công (`atkUp`)

```json scenario
{
  "id": "atkUp", "kind": "status", "name": "Tăng công", "element": "NONE", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": [], "bibles": ["actions/status", "actions/buff-and-heal"],
  "assets": [
    { "id": "fx_buff_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô #ff7a3a)" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trạng thái **tăng** — đọc được khi bỏ màu nhờ hình riêng: **mũi nhọn / móng sắc lóe** vút lên; năng lượng vút **lên** (bible [status](../../bibles/actions/status.md) §2: tăng hướng lên, giảm hướng xuống; không lấy hình của trạng thái ngược rồi lật). Màu chủ đạo `#ff7a3a`. T0: không rung, không khựng.

## 2. Hiện tại
`battle_fx.json → statuses.atkUp`: apply / loop / expire / layers. Lúc dính: decal, burst spark_rise, move, sound, strip fx_pow_star. Các trạng thái tăng dùng chung khuôn vòng + hạt bay lên, phân biệt chủ yếu bằng màu và một vật nhỏ.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| Dính | 0–600 | gồng, phồng 1,1, vai nhô | cột sáng mảnh **vút lên** từ chân; **mũi nhọn / móng sắc lóe** vút lên; icon `st_*` bật lên cạnh đầu | "vút" sáng |
| Duy trì | mỗi 1,6–2,5 s, ≤ 400 ms | — | tia cam nhỏ bốc từ vai mỗi 1,6 s | không |
| Hết | 300–500 | xìu nhẹ về bình thường | hình tan thành hạt **rơi** xuống (ngược pha dính) | ngân nhẹ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | cột sáng lên | `fx_buff_rise` | `strip` tô `#ff7a3a` ở `feet` lúc dính |
| L2 | viền sáng thân | — | `glow #ff7a3a` 200 ms |
| L3 | hình riêng của trạng thái | `fxs_spark` (+ vật hiện có trong script) | lúc dính: hình đi lên; duy trì: tia cam nhỏ bốc từ vai mỗi 1,6 s (`loop.every`) |
| L4 | phản ứng thân | — | gồng, phồng 1,1, vai nhô (`move`, không rung màn) |

## 5. Asset
`fx_buff_rise` **mới** (dùng chung cho mọi trạng thái tăng, tô theo màu riêng); `fxs_spark` và các vật trong script hiện tại có sẵn. Dự phòng: `burst buff_arrows` + `decal ring`.

## 6. Các bước dựng
B1 `apply` ≤ 600 ms, `loop.every` như bảng, `expire` ≤ 500 · B2 phản ứng thân · B3 fx_buff_rise · B4 hình riêng + loop · B5 không rung · B6 âm sáng · B7 capture (suite statuses: apply / loop / expire).

## 7. Nghiệm thu
Harness: không `DUPLICATE_SCRIPT` với trạng thái khác (khác hình, không chỉ khác màu); expire thay đổi ≥ 8 % khung; ảnh dính đọc được **hướng lên** khi xem đen trắng. Rubric status ≥ 85.
