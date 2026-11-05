# Kịch bản trạng thái: Khiên (`shield`)

```json scenario
{
  "id": "shield", "kind": "status", "name": "Khiên", "element": "NONE", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["actions/status", "actions/buff-and-heal"],
  "assets": [
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô #9ad0ff)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô xanh, khi đỡ đòn / vỡ)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Khiên lục giác **ghép dần** quanh thân; khi còn hiệu lực **vòng mờ quay**; **khi đỡ đòn**: mặt khiên **gợn sóng** + lóe + "clang"; **khiên vỡ**: các mảnh lục giác **văng ra** + tia xanh. Cảm giác: chắc, có phản hồi khi bị đánh.

## 2. Hiện tại
apply: `fx_shield_dome` khung 0–2 + âm; layers orbit ring; expire: decal + poof + dome + mảnh kim. Không có phản ứng **khi đỡ đòn**.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–500 | đứng vững | mảnh lục giác **bay vào ghép** (K1→K4) | "vmm" |
| Duy trì | liên tục | — | vòng mờ quay chậm (giữ layer) | không |
| Đỡ đòn | 200 | lùi ít hơn bình thường | mặt khiên **gợn** (K5) + lóe xanh tại điểm trúng | "clang" |
| Vỡ / hết | 300–450 | giật | mảnh lục giác **văng ra** + tia xanh, tan | "kshh" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | khiên | `fx_shield_form` | apply `frames [0,3]`; đỡ đòn `frames [4,4]`; vỡ: phát ngược `[3,0]` + alpha |
| L2 | vòng quay | — | layer `orbit ring` (giữ) |
| L3 | lóe / tia | `fx_metal_spark` (xanh) | đỡ đòn + vỡ |
| L4 | giật | — | `move recoil x 4` khi đỡ; không rung màn |

## 5. Asset
`fx_shield_form`, `fx_metal_spark` **mới**. Đỡ đòn cần engine phát script khi khiên hút sát thương (sự kiện có sẵn? — kiểm `BattleEvent`; nếu thiếu ghi engine `status_on_hit`).

## 6. Các bước dựng
B1 apply ≤ 500 · B2 đứng vững / giật · B3 khiên ghép, gợn, vỡ · B4 lóe, tia · B5 không rung · B6 âm · B7 capture (apply / loop / expire + đòn đánh vào khiên).

## 7. Nghiệm thu
Capture: đòn đánh vào con có khiên cho thấy **gợn + lóe** (khác đòn đánh thường); vỡ cho thấy mảnh văng.
