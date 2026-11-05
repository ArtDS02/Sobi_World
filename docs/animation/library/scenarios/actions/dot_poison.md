# Kịch bản hành động: Mất máu vì Độc (`dot_poison`)

```json scenario
{
  "id": "dot_poison", "kind": "action", "name": "Mất máu vì Độc", "element": "NATURE", "tier": 0, "durationMs": 420,
  "status": "draft", "refs": [], "bibles": ["motifs/poison", "actions/status"],
  "assets": [
    { "id": "fxs_spore", "state": "have", "layer": "L3" },
    { "id": "fxs_bubble", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đầu lượt mất máu vì độc: **không bị đẩy lùi**, chỉ **co "ực"** tại chỗ, mặt nhăn, **tô tím** 150 ms, **bọt độc sủi vỡ** quanh thân, icon độc **phồng rồi xẹp**. Nhìn là biết do độc (khác bỏng). "bloop".

## 2. Hiện tại
bào tử + glow tím + squash 0,94. Đạt; thiếu bọt vỡ.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Ực | 0–420 | co 0,94 + lắc nhỏ, tint tím 150 | 4 bào tử + 3 bọt **sủi rồi vỡ** | "bloop" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L2 | tint tím | — | `glow #9a6ad6 tint` (giữ) |
| L3 | bào tử; bọt | `fxs_spore`, `fxs_bubble` | `burst spore_rise`; thêm `burst bubble_pop tint #7be08a` |
| L4 | co ực | — | `move squash 0.94` + `shake x 2 n 2` |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 ≤ 420 · B2 co + lắc · B4 bọt vỡ · B5 không rung · B6 âm "bloop" · B7 capture.

## 7. Nghiệm thu
Khác `dot_burn` về hướng (sủi tại chỗ vs bay lên) và màu; mục tiêu không rời chỗ.
