# Kịch bản: Ác Mộng (`skill_dm_nightmare`)

```json scenario
{
  "id": "skill_dm_nightmare", "kind": "skill", "name": "Ác Mộng", "element": "DARK", "tier": 2, "durationMs": 1350,
  "status": "draft", "refs": [], "bibles": ["elements/DARK"],
  "assets": [
    { "id": "fxp_nightmare_mask", "state": "have", "layer": "L1" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô tím, lớp khói sau mặt nạ)" },
    { "id": "fx_rune_lock", "state": "have", "layer": "L3" },
    { "id": "fx_poof", "state": "have", "layer": "L3" },
    { "id": "fxs_note", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Bạch tuộc **ru ngủ** (nốt nhạc lệch tông), **mặt nạ trăng khuyết hiện từ khói** sau lưng mục tiêu, to dần, mắt lóe — rồi **"BOO!"**: mục tiêu **giật bắn lên**, phép bị **khóa rune**. Cảm giác: rùng rợn dễ thương (không kinh dị). T2, Phong ấn 2 lượt 75 %.

## 2. Hiện tại
`fxp_nightmare_mask grow` 800 ms + `fx_poof` + `fx_rune_lock`. Audit: `STATIC_HERO`, `STATIC_SHARE` (tác động đã đủ). Mặt nạ to dần là đủ ý, nhưng ảnh không "sống": không khói, không có nhịp hù.

## 3. Kịch bản theo nhịp
| # | ms | Bạch tuộc | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Ru | 0–360 | pose `cast`, lắc lư | 3 nốt tím bay **về phía mục tiêu** | mí mắt nặng (sy 0,97) | vignette tím quanh mục tiêu | hộp nhạc lệch tông |
| 2 Hiện | 360–760 | giữ | **khói tím cuộn** sau mục tiêu, mặt nạ **hiện dần từ khói** (alpha 0 → 1), to 0,6 → 1,1, mép gợn | — | tối thêm | ngân trầm |
| 3 Lặng | 760–820 | — | mặt nạ đứng, **mắt lóe** tím | — | gần im | "…" |
| 4 BOO | 820 | — | mặt nạ **phóng to bật** 1,1 → 1,3 (punch), poof tím quanh đầu | **giật bắn** lên 18 px, `hurt` | hit-stop medium 80, punch 1,03 | "BOO!" |
| 5 Khóa | 950–1350 | idle | mặt nạ cười rồi tan vào khói; vòng rune khóa trên đầu; `st_disable` | run nhẹ | vignette tan | "click" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | vignette tím quanh mục tiêu | — | `tint focus #2a1040 0.3` | 0–1300 |
| L1 | khói + mặt nạ | `fx_smoke_curl` (`behind`), `fxp_nightmare_mask` | khói loop 360–1200; `prop grow` alpha tăng + `prop_displace` mép 360–760 → bật 820 (`pulse` một nhịp) → tan alpha 1000–1250 | 360–1250 |
| L2 | mắt mặt nạ lóe | — | `glow #d9b8ff` ngắn 760–820 | 760–820 |
| L3 | nốt nhạc; poof; rune | `fxs_note`, `fx_poof`, `fx_rune_lock` | `burst note_trail` về mục tiêu 0–360; `strip fx_poof spot head` 820; `strip fx_rune_lock` 950 | 0–1350 |
| L4 | giật bắn; hit-stop | — | `move hop y 18`; `stop medium`; `punch 1.03` | 820–1100 |
L1 đạt 3/3: biến hình (khói loop + displacement + hiện dần) · phụ sinh (khói từ mặt nạ) · vận tốc (bật ở nhịp BOO).

## 5. Asset
`fx_smoke_curl` **mới**; còn lại có. Dự phòng: `fx_poof` hold làm khói.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 ru, mí mắt, giật bắn · B3 khói → mặt nạ hiện → lặng → bật → tan · B4 nốt, poof, rune · B5 hit-stop medium (từ T1 lên T2) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, bậc có T2; capture: khung ~500 mặt nạ **mờ một nửa**; khung 780 gần như đứng yên; khung `impact+80` mục tiêu **cao hơn** chỗ đứng.
