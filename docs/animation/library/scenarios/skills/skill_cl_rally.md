# Kịch bản: Khích Lệ (`skill_cl_rally`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_rally", "kind": "skill", "name": "Khích Lệ", "element": "SUPPORT", "tier": 0, "durationMs": 1350,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fxp_banner", "state": "have", "layer": "L1" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng cam)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
**Cờ cổ vũ cắm phập** sau lưng, **cờ bay phần phật**; **mũi tên sáng vàng cam bốc lên** từ chân từng bạn; trống "dum-dum" — **cả đội đồng thanh nhảy "YAA!"**. Cảm giác: đồng lòng, khí thế. Công + Công phép cả đội, T0.

## 2. Hiện tại
`fxp_banner fall` (ảnh đứng) + streak. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Cắm cờ | 0–350 | giơ tay | cờ **rơi cắm** sau lưng, lún nảy, bụi; **lá cờ bay** | "THUNK" |
| 2 Tích | 350–850 | đội nhún theo nhịp trống ×2 | **cột sáng mũi tên** bốc lên từ chân từng bạn (stagger 100) | "dum-dum" |
| 3 YAA | 850 | **cả đội nhảy** 20 px cùng lúc | lóe vàng trên đầu từng bạn | "YAA!" |
| 4 Dư âm | 850–1350 | idle | cờ mờ dần; `st_atk_up`, `st_matk_up` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | cờ; cột buff | `fxp_banner`, `fx_buff_rise` | cờ `prop fall` + `squashOnHit` `behind` 0–350 → `prop_displace` (lá cờ bay) + `wobble rot 4 freq 2` 350–1100 → alpha; `strip fx_buff_rise` per ally stagger 100 | 0–1300 |
| L2 | lóe trên đầu | — | `glow #ffd36a` per ally 850 | 850–950 |
| L3 | bụi cắm cờ | `fx_dust_ring` (0,5) | `strip under` 320 | 320–600 |
| L4 | đội nhún / nhảy đồng loạt | — | `move bounce` ×2; `move hop y 20` cùng lúc 850 (không rung) | 350–1100 |
L1 đạt 3/3 (khi có displacement): biến hình (cờ bay, cột khung) · vận tốc (cắm lún) · phụ sinh (bụi).

## 5. Asset
`fx_buff_rise`, `fx_dust_ring` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 giơ tay; đội nhún ×2 → nhảy đồng loạt · B3 cờ → cột · B4 bụi, lóe · B5 không rung · B6 âm trống · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~880 **cả đội cùng cao** (nhảy đồng loạt).
