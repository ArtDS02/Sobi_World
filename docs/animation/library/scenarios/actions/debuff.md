# Kịch bản hành động: Bị trạng thái xấu (`debuff`)

```json scenario
{
  "id": "debuff", "kind": "action", "name": "Bị trạng thái xấu", "element": "NONE", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": [], "bibles": ["actions/status"],
  "assets": [
    { "id": "fx_debuff_sink", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tím xám)" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Lớp **chung** dự phòng khi trạng thái xấu chưa có `apply` riêng: icon **"rơi bịch"** lên đầu, thân **xìu xuống** (sy 0,92), thở dài, khói tím xám **chảy xuống**. "bwomp" trầm.

## 2. Hiện tại
squash + khói + âm. Đạt cơ bản.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Rơi | 0–600 | xìu 0,92 200 ms, thở dài, run ngang nhỏ | khói **chảy xuống**, icon rơi bịch | "bwomp" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | khói xuống | `fx_debuff_sink` | `strip` |
| L3 | khói nhỏ | `fxs_puff` | giữ |
| L4 | xìu, run | — | `move squash 0.92` + `shake x 1` |

## 5. Asset
`fx_debuff_sink` **mới**.

## 6. Các bước dựng
B1 ≤ 600 · B2 xìu / run · B3 khói xuống · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Không chạy cùng `apply` riêng của status.
