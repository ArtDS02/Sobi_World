# Kịch bản hành động: Thắng trận (`victory`)

```json scenario
{
  "id": "victory", "kind": "action", "name": "Thắng trận", "element": "NONE", "tier": 0, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states"],
  "assets": [
    { "id": "fxs_petal", "state": "have", "layer": "L3" },
    { "id": "fxs_star", "state": "have", "layer": "L3" },
    { "id": "fxs_bubble", "state": "have", "layer": "L3" }
  ],
  "engine": ["action_by_body"]
}
```

## 1. Ý tưởng
**Cả đội ăn mừng theo kiểu riêng**, **pháo giấy** nhiều màu rơi; lặp tới khi hiện bảng thưởng. Bốn chân **nhảy 2–3 lần**, bay **lộn một vòng**, bơi **phun bong bóng**; con bị hạ vẫn **ngồi nhưng vẫy tay**. Lệch nhịp 120 ms giữa các con.

## 2. Hiện tại
pose `victory` + hop ×3 + cánh hoa + sao. Mọi con cùng một động tác (idle-and-states §5: cấm).

## 3. Kịch bản theo nhịp
| # | ms | Đội | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Ăn mừng | 0–1400 (lặp) | pose `victory`; theo kiểu thân (bảng dưới), lệch 120 | pháo giấy (cánh hoa + sao nhiều màu) rơi chậm từ trên | kèn ngắn + "yay" |
| Kiểu thân | | bốn chân: nhảy 2–3 · bay: lộn 1 vòng · bơi: phun 6 bong bóng · nặng: giơ tay đấm trời · bị hạ: ngồi vẫy | | |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L3 | pháo giấy; bong bóng | `fxs_petal`, `fxs_star` (tô nhiều màu), `fxs_bubble` | `burst petal_fall` + `star_fall` `spot sky`; bơi: `burst bubble_rise` |
| L4 | động tác theo kiểu thân | — | cần `action_by_body`; tạm: hop cho mọi con |

## 5. Asset
Đủ; cần `action_by_body`.

## 6. Các bước dựng
B1 1400 lặp · B2 năm biến thể kiểu thân · B4 pháo giấy · B5 không rung · B6 âm · B7 capture (case win, đội có cá + heo + con bị hạ).

## 7. Nghiệm thu
Capture win: ít nhất 2 kiểu động tác khác nhau trong đội; con bị hạ vẫn ngồi (không đứng dậy).
