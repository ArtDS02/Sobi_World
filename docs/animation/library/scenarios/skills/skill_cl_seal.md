# Kịch bản: Phong Ấn (`skill_cl_seal`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_seal", "kind": "skill", "name": "Phong Ấn", "element": "SELF", "tier": 1, "durationMs": 1250,
  "status": "draft", "refs": [], "bibles": ["actions/cast", "actions/status"],
  "assets": [
    { "id": "fxs_rune_a", "state": "have", "layer": "L1" },
    { "id": "fxs_rune_b", "state": "have", "layer": "L1" },
    { "id": "fx_rune_lock", "state": "have", "layer": "L1" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **vẽ ba rune trên không** (từng nét hiện ra), rune **bay vòng elip quanh mục tiêu**, **co lại** rồi **khóa "cạch"** vào ngực. Cảm giác: tinh tế, lách cách. T1 (power 0,6), 70 % Phong ấn.

## 2. Hiện tại
`fxs_rune_a` bay + `fx_rune_lock`. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Âm thanh |
|---|---|---|---|---|---|
| 1 Vẽ | 0–380 | pose `cast`, tay vẽ (wiggle nhỏ) | 3 rune **hiện từng cái** trước mặt (pop + sáng), theo hệ | — | phấn "skrch" ×3 |
| 2 Vòng | 380–800 | giữ | rune **bay elip** quanh mục tiêu, lệch pha 120°, bán kính **co dần** | xoay đầu nhìn theo | vù |
| 3 Khóa | 800 | — | rune lao vào ngực → vòng khóa rune bật ra | khựng | "click!" |
| 4 Dư âm | 800–1250 | idle | vòng khóa quay chậm rồi mờ; lấp lánh; `st_disable` | rùng mình | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 3 rune; vòng khóa | `fxs_rune_a/b` (tô $color, 0,3), `fx_rune_lock` | `prop pop` stagger 120 tại `front` 0–380 → `prop orbit` quanh target, bán kính giảm 380–800 → `fly` vào ngực 760–800; `strip fx_rune_lock hold 300` 800 | 0–1150 |
| L2 | sáng khi vẽ | — | `glow $color` từng rune | 0–380 |
| L3 | lấp lánh | `fxs_star` | `burst star_pop` 800, 1000 | 800–1100 |
| L4 | hit-stop | — | `stop light 50`; `move shake` nhỏ target | 800–950 |
L1 đạt 2/3: biến hình (vòng khóa khung) · vận tốc (vẽ từng cái, orbit co dần).

## 5. Asset
Đủ asset.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 vẽ, nhìn theo · B3 rune → orbit → khóa · B4 lấp lánh · B5 hit-stop light · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO` khi hero là `fx_rune_lock` (hoặc ghi lý do); capture: khung ~200 thấy **1–2 rune** (chưa đủ 3); khung ~600 rune ở ba phía mục tiêu.
