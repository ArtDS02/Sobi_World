# Kịch bản hành động: Hồi phục mỗi lượt (`regen`)

```json scenario
{
  "id": "regen", "kind": "action", "name": "Hồi phục mỗi lượt", "element": "NONE", "tier": 0, "durationMs": 400,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "actions/status"],
  "assets": [
    { "id": "fx_heal_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (nhỏ 0,6)" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" },
    { "id": "fxs_plus", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đầu lượt, **chồi Hồi phục** (status `regen`) **nở** một vòng hồi **nhỏ**: 3 lá + 3 dấu cộng bay lên. **Nhẹ hơn** `heal` (xảy ra mỗi lượt, không được làm mỏi mắt).

## 2. Hiện tại
lá + cộng. Đạt; chưa gắn với hình chồi của status.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Nở | 0–400 | nhún nhẹ 4 | chồi cạnh chân lắc 1 nhịp → vòng hồi nhỏ; 3 lá + 3 cộng | "plink" nhỏ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | vòng hồi nhỏ | `fx_heal_bloom` (0,6) | `strip` 0 |
| L3 | lá; cộng | `fxs_leaf`, `fxs_plus` | giữ |
| L4 | nhún | — | `move hop y 4` |

## 5. Asset
`fx_heal_bloom` **mới**.

## 6. Các bước dựng
B1 ≤ 400 · B2 nhún · B3 vòng · B4 lá, cộng · B5 không rung · B6 âm nhỏ · B7 capture (status regen qua lượt).

## 7. Nghiệm thu
Thời lượng ≤ 400, không chặn input; nhỏ hơn `heal` rõ ràng.
