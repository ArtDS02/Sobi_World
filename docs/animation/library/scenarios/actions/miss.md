# Kịch bản hành động: Né đòn (`miss`)

```json scenario
{
  "id": "miss", "kind": "action", "name": "Né đòn", "element": "NONE", "tier": 0, "durationMs": 460,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_wind_swirl", "state": "have", "layer": "L1" },
    { "id": "fxs_streak", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Né **tinh nghịch**: **ngả người ra sau** kiểu "matrix" (20°) **hoặc** **nhảy bật lên** 40 px (luân phiên theo lượt) để đòn **sượt qua**, để lại hai bóng mờ, lè lưỡi. "fwip! hehe".

## 2. Hiện tại
`rear` + trail + `fx_wind_swirl` khung 1–3 + streak + âm. Đạt (bible: giữ); chỉ một kiểu né.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Né | 0–200 | **ngả sau 20°** (lượt lẻ) / **nhảy lên 40** (lượt chẵn), 2 bóng mờ | gió xoáy nhỏ tại chỗ cũ, 3 vệt gió | "fwip!" |
| 2 Lè lưỡi | 200–460 | về chỗ, nghiêng đầu | chữ "Trượt" (UI) | "hehe" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | gió xoáy | `fx_wind_swirl` (khung 1–3) | giữ |
| L2 | bóng mờ | — | `trail every 90` (giữ) |
| L3 | vệt gió | `fxs_streak` | giữ |
| L4 | ngả / nhảy | — | `move rear` hoặc `move jump y 40` luân phiên (cần chọn biến thể theo lượt — engine: `variant` theo số lượt; nếu chưa có, giữ `rear`) |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 ≤ 460 · B2 hai biến thể né · B3–B4 giữ · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Hai lần né liên tiếp trong trận thật có **hai tư thế khác nhau** (khi có biến thể).
