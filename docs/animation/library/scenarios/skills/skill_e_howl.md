# Kịch bản: Tru Lên (`skill_e_howl`) — quái Sói Đầu Đàn

```json scenario
{
  "id": "skill_e_howl", "kind": "skill", "name": "Tru Lên", "element": "SUPPORT", "tier": 0, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đỏ)" },
    { "id": "fxs_note", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Sói đầu đàn **ngửa cổ hú** dưới trăng (nền tối), **sóng âm ")))" lan** từ miệng qua bầy; cả bầy **nhảy lên đáp lại**, **mắt lóe đỏ**. Cảm giác: bầy đàn, hoang dã, khí thế. Công cả đội, T0 (rung 2 hiện có → bỏ, dùng sóng âm thay).

## 2. Hiện tại
Không có hình chủ đạo; `decal` + rung. Audit: không cờ (bậc T1 chấp nhận được).

## 3. Kịch bản theo nhịp
| # | ms | Sói đầu đàn / bầy | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Ngửa | 0–400 | **ngửa cổ** −15°, ưỡn ngực | — | tối 15 %, trăng nhạt góc trên | hít |
| 2 Hú | 400–900 | giữ, thân **rung** theo tiếng hú | **3 vòng sóng âm** cong ")))" lan từ miệng sang bầy, mỗi vòng to hơn | — | "AWOOOO" |
| 3 Đáp | 900 | **bầy nhảy lên** đáp lại (stagger 80), **mắt lóe đỏ** | cột sáng đỏ mảnh mỗi con | — | bầy hú đáp |
| 4 Dư âm | 900–1300 | idle | `st_atk_up` | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint #100818 0.15` | 0–1200 |
| L1 | sóng âm | `decal ring` hoặc `ribbon` cong code | 3 vòng nửa (cung) lan từ `head` sang allyside, size tăng, alpha giảm, lệch 150 | 400–950 |
| L2 | mắt lóe đỏ | — | `glow #ff4a4a` per ally stagger 80 | 900–1050 |
| L3 | cột buff; nốt (âm) | `fx_buff_rise`, `fxs_note` | `strip` per ally 900; `burst note_pop` tím xanh 450 | 450–1300 |
| L4 | rung thân khi hú; bầy nhảy | — | `move shake x 2 n 8` actor 400–900; `move hop y 14` bầy (không rung màn) | 400–1100 |
L1 đạt 2/3: biến hình (sóng lan to dần) · phụ sinh (âm từ miệng).

## 5. Asset
`fx_buff_rise` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 ngửa, rung, bầy nhảy · B3 sóng âm · B4 mắt, cột, nốt · B5 **bỏ rung màn** (T0) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit không `IMPACT_OVER_TIER`; capture: khung ~650 thấy **≥ 2 cung sóng** giữa sói và bầy.
