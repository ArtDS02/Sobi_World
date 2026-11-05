# Kịch bản hành động: Mất lượt vì Choáng (`stunned`)

```json scenario
{
  "id": "stunned", "kind": "action", "name": "Mất lượt: Choáng", "element": "NONE", "tier": 0, "durationMs": 700,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states", "actions/status"],
  "assets": [
    { "id": "fxs_star", "state": "have", "layer": "L1" },
    { "id": "fxs_feather", "state": "have", "layer": "L1" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đến lượt mà **choáng**: **ngồi lảo đảo**, lắc trái phải **chậm dần**, mắt nhắm (pose `hurt`), sao + chim nhỏ **xoay nhanh** quanh đầu, "boing-boing" + chim hót. Người chơi hiểu ngay "con này mất lượt".

## 2. Hiện tại
pose `hurt` 700 + wiggle ±10° + sao + âm. Đạt cơ bản; thiếu chim (MUST-HAVE "sao / chim") và "chậm dần".

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Lảo đảo | 0–700 | `hurt`, lắc ±10° → ±4° (**chậm dần**), ngồi thấp 0,95 | icon choáng to 1,4× **xoay quanh đầu** (1 vòng / 600 ms) + 3 sao + 1 chim nhỏ | "boing-boing" + "tweet" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | sao + chim | `fxs_star` ×3, `fxs_feather` (chim) | `prop orbit spot above` nhanh (gấp đôi status layer) |
| L4 | lảo đảo chậm dần | — | `move wiggle` biên độ giảm (2 act nối) |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 700 · B2 lảo đảo chậm dần · B3 sao + chim · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: biên độ nghiêng ở khung 600 **nhỏ hơn** khung 100; có chim.
