# Kịch bản hành động: Bắt đầu lượt phe ta (`turn_start_ally`)

```json scenario
{
  "id": "turn_start_ally", "kind": "action", "name": "Bắt đầu lượt phe ta", "element": "NONE", "tier": 0, "durationMs": 300,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states"],
  "assets": [
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Báo **"tới lượt con này"**: nhún nhẹ, **sao vàng** lóe trên đầu, vòng lượt sáng dưới chân (HUD). Nhẹ, ≤ 300 ms, **không chặn input**.

## 2. Hiện tại
hop 8 + sao vàng. Đạt (bible idle-and-states: giữ).

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Nhún | 0–300 | hop 8, mắt mở to | sao vàng nhỏ trên đầu | "pip" nhỏ (tùy) |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L3 | sao | `fxs_star` | giữ |
| L4 | nhún | — | giữ |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 ≤ 300 · giữ nguyên; chỉ kiểm không chặn input.

## 7. Nghiệm thu
Không chặn input (harness `battle_ui`: bấm được ngay khi lượt bắt đầu).
