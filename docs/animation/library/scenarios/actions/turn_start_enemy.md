# Kịch bản hành động: Bắt đầu lượt quái (`turn_start_enemy`)

```json scenario
{
  "id": "turn_start_enemy", "kind": "action", "name": "Bắt đầu lượt quái", "element": "NONE", "tier": 0, "durationMs": 350,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states", "actions/cast"],
  "assets": [
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Quái **báo hiệu** trước khi ra đòn (bible cast §3): **ngẩng lên** / **gầm nhỏ**, **mắt lóe đỏ** — người chơi đọc được "quái này sắp làm gì". ≤ 350 ms.

## 2. Hiện tại
rear + glow + âm. Đạt; mắt lóe là glow toàn thân.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Báo | 0–350 | ngẩng / chồm (rear), mắt lóe đỏ | lóe nhỏ ở `head` | gầm nhỏ theo loài |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L2 | mắt lóe | — | `glow #ff4a4a` ngắn (giữ) |
| L3 | lóe ở đầu | `fxs_star` (đỏ nhỏ) | `burst star_pop spot head tint #ff4a4a more 0.2` |
| L4 | ngẩng | — | `move rear` (giữ) |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 ≤ 350 · thêm lóe ở đầu · B7 capture.

## 7. Nghiệm thu
Lượt quái đọc được bằng hình (không chỉ thanh lượt HUD).
