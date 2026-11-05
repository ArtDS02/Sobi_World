# Kịch bản: Khúc Ca Triều (`skill_nh_tide_song`)

```json scenario
{
  "id": "skill_nh_tide_song", "kind": "skill", "name": "Khúc Ca Triều", "element": "SUPPORT", "tier": 0, "durationMs": 1450,
  "status": "draft", "refs": ["REF-WATER-WAVE-001"], "bibles": ["actions/buff-and-heal", "elements/WATER"],
  "assets": [
    { "id": "fx_wave_rise", "state": "new", "layer": "L1", "spec": "Xem skill_nh_tsunami (dùng chung). Ở skill này chỉ phát K1–K3 (sóng thấp, hiền), size 0,45, không bao giờ tới khung đổ sập." },
    { "id": "fxp_wave_crest", "state": "have", "layer": "L1" },
    { "id": "fxs_note", "state": "have", "layer": "L3" },
    { "id": "fxs_bubble", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Một **dải sóng nhạc thấp, hiền** chảy qua cả đội, mỗi bạn nhún theo nhịp, **biểu tượng xấu bị cuốn trôi thành bọt**. Cảm giác: êm, đồng điệu, cả đội "cùng hát". Hồi 18 % + xóa 1 trạng thái xấu. T0.
Nguồn: thiết kế gốc; cùng họ hình với sóng thần nhưng **ngược tính cách**: thấp, mềm, không đổ sập.

## 2. Hiện tại
`fxp_wave_crest` 0,45× `sweep` qua phe ta + `ribbon` + vết. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER` (cũ). Sóng cùng một ảnh với sóng thần → hai skill khác hẳn ý nghĩa nhưng nhìn giống nhau (C4).

## 3. Kịch bản theo nhịp
| # | ms | Người dùng | Hiệu ứng chính | Đồng đội | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Hát | 0–380 | pose `cast`, ngửa đầu hát | 3 nốt lớn bay theo đường sóng; nước gợn dưới chân | — | nền lam 8 % | 3 nốt cá voi |
| 2 Dâng nhẹ | 380–520 | giữ | sóng thấp **dâng** sát đất bên trái phe ta (`fx_wave_rise` K1→K3 size 0,45) | — | — | rì rào |
| 3 Chảy qua | 520–1000 | lắc lư | sóng chảy sang phải sát đất qua từng đồng đội, mặt gợn (displacement), nốt nhạc nổi trên mặt sóng | lệch nhịp 130: nhún theo sóng, số hồi máu; icon xấu bị cuốn trượt sang phải rồi vỡ 4 bọt | — | "pop" bọt |
| 4 Tan | 1000–1450 | idle | sóng thấp dần và tan thành 12 bọt bay lên | cả đội lắc lư 1 nhịp chung | nền về | nốt cuối |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền lam nhạt | — | `tint` 8 % | 0–1450 |
| L1 | sóng thấp dâng → chảy → tan | `fx_wave_rise` K1–K3, `fxp_wave_crest` 0,45× | `strip frames [0,2]` 380; `prop sweep` sát đất (`under`) + displacement + `alpha` giảm dần cuối quãng | 380–1100 |
| L2 | lõi sáng ngọc trên người hát | — | `glow #7ee08a` 0–380 | 0–380 |
| L3 | nốt nhạc trên mặt sóng; bọt từ icon xấu; bọt tan | `fxs_note`, `fxs_bubble` | `burst note_rise` 0; `trail note_trail every 120` trên prop; `burst bubble_pop` ở mỗi đồng đội (stagger 130); `burst bubble_rise` 1000 | 0–1450 |
| L4 | đồng đội nhún theo sóng | — | `move bounce` stagger 130; `move wiggle` cả đội 1000 | 520–1450 |
L1 đạt 2/3 (biến hình: dâng khung + displacement · phụ sinh: nốt / bọt). Không cần vận tốc (sóng chậm, hiền).

## 5. Asset
| Asset | Lớp | Trạng thái |
|---|---|---|
| `fx_wave_rise` | L1 | **mới** (chung với `skill_nh_tsunami`) |
| `fxp_wave_crest`, `fxs_note`, `fxs_bubble` | L1/L3 | có |
Dự phòng: chưa có `fx_wave_rise` → bỏ nhịp dâng, `prop rise` thấp. Chưa có displacement → `wobble` nhỏ + `bobY`.

## 6. Các bước dựng
1. B1 nhịp `{ release 380, impact 520, end 1450 }` (rút từ 1550). 2. B2 thân: hát, nhún stagger. 3. B3 L1. 4. B4 L3 (bọt từ icon xấu: cần biết đồng đội nào được xóa — dùng `who: targets`). 5. B5: không rung. 6. B6 âm. 7. B7 capture.

## 7. Nghiệm thu
- `anim:audit`: hết `DURATION_OVER`; không `IMPACT_OVER_TIER`.
- Capture: sóng **thấp hơn hẳn** sóng thần (≤ 45 % chiều cao); nhún lệch nhịp thấy được; sóng không đổ sập; so ảnh với `skill_nh_tsunami` phải khác về độ cao, nhịp và màu.
