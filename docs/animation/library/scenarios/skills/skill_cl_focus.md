# Kịch bản: Tập Trung (`skill_cl_focus`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_focus", "kind": "skill", "name": "Tập Trung", "element": "SUPPORT", "tier": 0, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "actions/cast"],
  "assets": [
    { "id": "fxs_rune_a", "state": "have", "layer": "L1" },
    { "id": "fxs_rune_b", "state": "have", "layer": "L1" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô theo hệ)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ngồi thiền lơ lửng**, mắt nhắm; **rune quay quanh đầu** chậm rồi nhanh; rune **nhập vào trán**, **mắt lóe**, sao xanh tím bay vào (MP). Cảm giác: tĩnh → bừng. Công phép + 10 MP, T0.

## 2. Hiện tại
Không có hình chủ đạo (chỉ chuyển động thân + hạt). Audit: không cờ.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Thiền | 0–250 | ngồi (0,95), **bay lên 8**, nhắm mắt | — | "ommm" |
| 2 Rune | 250–700 | lơ lửng, `bobY` nhẹ | 6 rune theo hệ **quay quanh đầu**, chậm → nhanh, vòng **co dần** | ngân tăng |
| 3 Nhập | 700 | **mắt lóe**, ngẩng | rune **lao vào trán** (co về điểm); 8 sao xanh tím bay vào thân; cột sáng mảnh | "TING" |
| 4 Hạ | 700–1050 | hạ xuống | viền sáng; `st_matk_up` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 6 rune | `fxs_rune_a` ×3, `fxs_rune_b` ×3 (tô $color) | `prop orbit` quanh `head` lệch pha 60°, tốc độ tăng, bán kính giảm 250–700 → `prop fly` vào trán 700–760 | 250–760 |
| L2 | mắt lóe | — | `glow $color bright 1.5` 700 | 700–800 |
| L3 | sao MP; cột buff | `fxs_star` (tô `#9ad0ff`), `fx_buff_rise` | `burst star_pop` hút vào 700; `strip fx_buff_rise` 720 | 700–1050 |
| L4 | thiền / bay / ngẩng | — | `move float y 8` 0–700; `move puff_up 1.04` 700 (không rung) | 0–1050 |
L1 đạt 2/3: vận tốc (orbit nhanh dần, co, lao vào) · phụ sinh (sao).

## 5. Asset
`fx_buff_rise` **mới**; rune có sẵn.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 ngồi / bay / ngẩng / hạ · B3 rune quay → nhập · B4 sao, cột buff · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~400 và ~650 rune ở **bán kính khác nhau** (co dần); khung ~720 mắt lóe.
