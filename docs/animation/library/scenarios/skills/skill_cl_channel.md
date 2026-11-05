# Kịch bản: Truyền Năng (`skill_cl_channel`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_channel", "kind": "skill", "name": "Truyền Năng", "element": "SUPPORT", "tier": 0, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Năng lượng xanh tím **chạy từ chân lên ngực** heo; **dải năng lượng lượn sóng** nối hai người, **hạt MP chảy dọc** sang bạn; bạn **sáng lên, nhún**; dây **đứt "pling"** ở giữa rồi tan. Cảm giác: chia sẻ, kết nối. +25 MP cho bạn, T0.

## 2. Hiện tại
`tether` + hạt. Audit: không cờ (tether vẽ bằng code đã sống).

## 3. Kịch bản theo nhịp
| # | ms | Heo / bạn | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Tụ | 0–300 | pose `cast` | 6 sao xanh tím **chạy từ chân lên ngực** | "hmmm" |
| 2 Nối | 300–850 | heo hơi xẹp dần (0,97), bạn phồng dần | dải **lượn sóng** nối hai người (biên độ tăng rồi giảm), 10 sao nhỏ **chảy dọc** dây | ù êm |
| 3 Nhận | 850 | bạn sáng xanh tím, nhún | — | "ting" |
| 4 Đứt | 850–1150 | — | dây **đứt ở giữa** "pling", hai nửa co về hai phía rồi tan | "pling" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | dải năng lượng | tether code | `tether wave 10 → 20 → 6` (3 act nối) `#9a8aff`, 300–850; đứt: 2 tether ngắn co về 850–1000 | 300–1000 |
| L2 | bạn sáng | — | `glow #9a8aff` bạn 850 | 850–1000 |
| L3 | sao lên ngực; sao chảy | `fxs_star` (tô xanh tím) | `burst star_rise` actor 0; `trail` hạt dọc tether (burst lặp tại vị trí giữa) | 0–850 |
| L4 | xẹp / phồng; nhún | — | `move squash 0.97` actor; `move puff_up 1.04` + `hop` bạn (không rung) | 300–1000 |
L1 (tether code) đạt 2/3: biến hình (sóng đổi biên độ, đứt) · phụ sinh (sao chảy).

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 850, end 1150 }` · B2 xẹp / phồng / nhún · B3 dây lượn → đứt · B4 sao · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~550 dây **lượn mạnh nhất**; khung ~950 thấy **hai nửa dây** tách nhau.
