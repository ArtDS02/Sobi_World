# Kịch bản hành động: Phòng thủ (`guard`)

```json scenario
{
  "id": "guard", "kind": "action", "name": "Phòng thủ", "element": "NONE", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states", "actions/buff-and-heal"],
  "assets": [
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô xanh nhạt)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (khi bị đánh lúc thủ)" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Gồng người**, **khiên bật lên** trước mặt, **giữ** tới hết lượt người khác (thân run 1 px); khi bị đánh lúc đang thủ: khiên **lóe trắng "clang"**, thân chỉ lùi **8** (thay 24) — phòng thủ phải **thấy** được tác dụng.

## 2. Hiện tại
squash 0,86 + recoil + `fx_shield_dome` khung 0–2 hold. Không giữ đến hết lượt, không phản ứng khi bị đánh.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Gồng | 0–300 | hạ trọng tâm (sy 0,86, sx 1,08), lùi 6 | khiên **ghép** trước mặt, 6 tia bật | "thunk" |
| 2 Giữ | 300–600+ | run 1 px | khiên mờ 30 % **giữ** (layer) tới hết lượt người khác | "ting" |
| Bị đánh | 200 | lùi **8** | khiên **gợn + lóe trắng**, tia kim | "clang" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | khiên | `fx_shield_form` | ghép `[0,3]` → giữ khung 3 alpha 0,3 (cần trạng thái "đang thủ" như một status layer tạm) |
| L3 | tia; lóe khi đỡ | `fxs_spark`, `fx_metal_spark` | `burst spark_pop`; khi bị đánh `strip fx_metal_spark` |
| L4 | gồng; giảm lùi khi bị đánh | — | `move squash` (giữ); hit khi `guard` → knock 8 (cần cờ trong `battlePose`) |

## 5. Asset
`fx_shield_form`, `fx_metal_spark` **mới**. Engine: giữ khiên tới hết lượt + giảm lùi khi đang thủ — kiểm `BattleEvent guard`.

## 6. Các bước dựng
B1 600 + giữ · B2 gồng / run / lùi ít · B3 khiên · B4 tia · B5 không rung · B6 âm · B7 capture (guard rồi bị đánh).

## 7. Nghiệm thu
Capture: con đang thủ bị đánh lùi **ít hơn** con không thủ; khiên còn thấy khi lượt địch diễn ra.
