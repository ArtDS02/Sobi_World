# Kịch bản hành động: Đòn kết thúc trận (`victory_cam`)

```json scenario
{
  "id": "victory_cam", "kind": "action", "name": "Đòn kết thúc trận", "element": "NONE", "tier": 3, "durationMs": 900,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states", "actions/melee-and-hit"],
  "assets": [
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đòn **hạ kẻ địch cuối cùng** được **làm chậm** (slow-motion ngắn), **zoom nhẹ** vào cú đánh, rồi sao rơi — người chơi **kịp thấy** đòn kết thúc trước khi chuyển màn (audit 2024-10 mục 4: "đòn kết thúc không kịp hiện").

## 2. Hiện tại
slowmo + punch + sao. Đúng ý; cần đảm bảo không quá dài và không đè `victory`.

## 3. Kịch bản theo nhịp
| # | ms | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|
| 1 Chậm | 0–500 | cú đánh cuối chạy **0,4×** | punch 1,04 vào mục tiêu cuối | âm trầm kéo dài |
| 2 Trả nhịp | 500–900 | tốc độ về 1×, sao rơi | — | "ting" → nhạc thắng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L3 | sao | `fxs_star` | giữ |
| L4 | slowmo, punch | — | `slowmo scale 0.4` 0–500 rồi ease về; `punch 1.04` |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 ≤ 900 · B4 sao · B5 slowmo + punch · B6 âm · B7 capture (case ko trên quái cuối).

## 7. Nghiệm thu
Capture: khung giữa slowmo cho thấy cú đánh **chưa xong** ở thời điểm bình thường đã xong; `victory` bắt đầu sau 900.
